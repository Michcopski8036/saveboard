package app.saveboard.saveboard;

import androidx.annotation.NonNull;

import com.android.billingclient.api.AcknowledgePurchaseParams;
import com.android.billingclient.api.BillingClient;
import com.android.billingclient.api.BillingClientStateListener;
import com.android.billingclient.api.BillingFlowParams;
import com.android.billingclient.api.BillingResult;
import com.android.billingclient.api.ProductDetails;
import com.android.billingclient.api.Purchase;
import com.android.billingclient.api.PurchasesUpdatedListener;
import com.android.billingclient.api.QueryProductDetailsParams;
import com.android.billingclient.api.QueryPurchasesParams;
import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import org.json.JSONException;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Google Play Billing, exposed under the SAME JS name and method shapes as the iOS
 * StoreKit plugin (ios/App/App/StoreKitPlugin.swift). src/app/lib/storekit.ts talks to
 * both without knowing which platform it is on — that is the whole point: the web layer
 * keeps one purchase flow instead of two.
 *
 * Methods: getProducts / purchase / restorePurchases.
 *
 * ⚠️ Play specifics that differ from StoreKit and bite if forgotten:
 *  - A subscription must be bought through an *offer*, so launching the flow needs the
 *    offerToken from ProductDetails, not just the product id.
 *  - A purchase that is not acknowledged within 3 days is refunded automatically by Google.
 *    We acknowledge as soon as it arrives.
 *  - Play does not hand the client an expiry date. `expiresDate` is therefore null here,
 *    while iOS fills it. The subscriptions row simply stores null for current_period_end.
 *  - The billing connection drops (app backgrounded, Play services updated). Billing 8's
 *    enableAutoServiceReconnection() handles that; withConnection() still covers the very
 *    first call, when nothing has connected yet.
 *  - ⚠️ Play Console REJECTS an upload built against Billing < 8.0.0 (hit on 2026-09-11
 *    with 7.1.1). Keep this dependency current.
 */
@CapacitorPlugin(name = "StoreKit")
public class StoreKitPlugin extends Plugin implements PurchasesUpdatedListener {

    private BillingClient billingClient;

    /** The purchase() call waiting on PurchasesUpdatedListener, if any. */
    private PluginCall pendingPurchase;
    /** productId -> ProductDetails, filled by getProducts so purchase() can find the offer. */
    private final Map<String, ProductDetails> productCache = new HashMap<>();

    @Override
    public void load() {
        billingClient = BillingClient.newBuilder(getContext())
            .setListener(this)
            .enableAutoServiceReconnection()
            .enablePendingPurchases(
                com.android.billingclient.api.PendingPurchasesParams.newBuilder()
                    .enableOneTimeProducts()
                    .build())
            .build();
    }

    /** Runs `body` once the billing connection is up; fails the call if it cannot connect. */
    private void withConnection(PluginCall call, Runnable body) {
        if (billingClient.isReady()) { body.run(); return; }
        billingClient.startConnection(new BillingClientStateListener() {
            @Override
            public void onBillingSetupFinished(@NonNull BillingResult result) {
                if (result.getResponseCode() == BillingClient.BillingResponseCode.OK) {
                    body.run();
                } else {
                    call.reject("Play Billing unavailable (" + result.getResponseCode() + "): "
                        + result.getDebugMessage());
                }
            }

            @Override
            public void onBillingServiceDisconnected() {
                // Left to the next call to retry — reconnecting in a loop here would spin
                // on devices without Play services (emulators, some China-market phones).
            }
        });
    }

    @PluginMethod
    public void getProducts(PluginCall call) {
        JSArray ids = call.getArray("productIds");
        if (ids == null || ids.length() == 0) { call.reject("productIds is required"); return; }

        List<QueryProductDetailsParams.Product> products = new ArrayList<>();
        try {
            for (int i = 0; i < ids.length(); i++) {
                products.add(QueryProductDetailsParams.Product.newBuilder()
                    .setProductId(ids.getString(i))
                    .setProductType(BillingClient.ProductType.SUBS)
                    .build());
            }
        } catch (JSONException e) {
            call.reject("productIds must be strings"); return;
        }

        QueryProductDetailsParams params = QueryProductDetailsParams.newBuilder()
            .setProductList(products).build();

        withConnection(call, () -> billingClient.queryProductDetailsAsync(params, (result, queryResult) -> {
            if (result.getResponseCode() != BillingClient.BillingResponseCode.OK) {
                call.reject("Could not load products: " + result.getDebugMessage()); return;
            }
            JSArray out = new JSArray();
            // Billing 8 wraps the list (it also reports ids it could not fetch, via
            // getUnfetchedProductList()). An id missing here means the product does not
            // exist or is not Active in Play Console — the empty list is what makes
            // UpgradePage fall back to the web checkout.
            for (ProductDetails d : queryResult.getProductDetailsList()) {
                productCache.put(d.getProductId(), d);
                JSObject p = new JSObject();
                p.put("id", d.getProductId());
                p.put("title", d.getTitle());
                p.put("description", d.getDescription());
                // Play prices live on the offer's pricing phases, not the product. Take the
                // first phase of the first offer — for a plain monthly/yearly sub that is
                // the recurring price a buyer sees.
                String price = "";
                if (d.getSubscriptionOfferDetails() != null && !d.getSubscriptionOfferDetails().isEmpty()) {
                    List<ProductDetails.PricingPhase> phases = d.getSubscriptionOfferDetails()
                        .get(0).getPricingPhases().getPricingPhaseList();
                    if (!phases.isEmpty()) price = phases.get(0).getFormattedPrice();
                }
                p.put("price", price);
                p.put("displayPrice", price);
                out.put(p);
            }
            JSObject ret = new JSObject();
            ret.put("products", out);
            call.resolve(ret);
        }));
    }

    @PluginMethod
    public void purchase(PluginCall call) {
        String productId = call.getString("productId");
        if (productId == null) { call.reject("productId is required"); return; }

        ProductDetails details = productCache.get(productId);
        if (details == null) {
            call.reject("Product not loaded. Call getProducts first."); return;
        }
        if (details.getSubscriptionOfferDetails() == null
            || details.getSubscriptionOfferDetails().isEmpty()) {
            call.reject("No subscription offer for " + productId); return;
        }
        String offerToken = details.getSubscriptionOfferDetails().get(0).getOfferToken();

        BillingFlowParams flow = BillingFlowParams.newBuilder()
            .setProductDetailsParamsList(java.util.Collections.singletonList(
                BillingFlowParams.ProductDetailsParams.newBuilder()
                    .setProductDetails(details)
                    .setOfferToken(offerToken)
                    .build()))
            .build();

        withConnection(call, () -> {
            // Held so onPurchasesUpdated can resolve it — Play answers on a listener,
            // not on the launch call.
            pendingPurchase = call;
            BillingResult r = billingClient.launchBillingFlow(getActivity(), flow);
            if (r.getResponseCode() != BillingClient.BillingResponseCode.OK) {
                pendingPurchase = null;
                call.reject("Could not open Google Play: " + r.getDebugMessage());
            }
        });
    }

    @Override
    public void onPurchasesUpdated(@NonNull BillingResult result, List<Purchase> purchases) {
        PluginCall call = pendingPurchase;
        pendingPurchase = null;
        if (call == null) return;

        if (result.getResponseCode() == BillingClient.BillingResponseCode.USER_CANCELED) {
            // Same string the iOS plugin uses — UpgradePage stays silent on this one.
            call.reject("User cancelled"); return;
        }
        if (result.getResponseCode() != BillingClient.BillingResponseCode.OK || purchases == null) {
            call.reject("Purchase failed: " + result.getDebugMessage()); return;
        }
        for (Purchase p : purchases) {
            if (p.getPurchaseState() != Purchase.PurchaseState.PURCHASED) continue;
            acknowledge(p);
            call.resolve(toTransaction(p));
            return;
        }
        call.reject("Purchase is pending. It will unlock once Google confirms payment.");
    }

    /** Google auto-refunds purchases left unacknowledged for 3 days. */
    private void acknowledge(Purchase p) {
        if (p.isAcknowledged()) return;
        billingClient.acknowledgePurchase(
            AcknowledgePurchaseParams.newBuilder().setPurchaseToken(p.getPurchaseToken()).build(),
            r -> { /* best effort: a failure here is retried next launch via restorePurchases */ });
    }

    private JSObject toTransaction(Purchase p) {
        JSObject t = new JSObject();
        t.put("transactionId", p.getOrderId() != null ? p.getOrderId() : p.getPurchaseToken());
        t.put("productId", p.getProducts().isEmpty() ? "" : p.getProducts().get(0));
        // Play has no separate "original" id; the token is stable across renewals.
        t.put("originalTransactionId", p.getPurchaseToken());
        // Play does not tell the client when the period ends — only the Developer API does.
        t.put("expiresDate", null);
        return t;
    }

    @PluginMethod
    public void restorePurchases(PluginCall call) {
        QueryPurchasesParams params = QueryPurchasesParams.newBuilder()
            .setProductType(BillingClient.ProductType.SUBS).build();

        withConnection(call, () -> billingClient.queryPurchasesAsync(params, (result, purchases) -> {
            if (result.getResponseCode() != BillingClient.BillingResponseCode.OK) {
                call.reject("Could not read purchases: " + result.getDebugMessage()); return;
            }
            JSArray out = new JSArray();
            for (Purchase p : purchases) {
                if (p.getPurchaseState() != Purchase.PurchaseState.PURCHASED) continue;
                acknowledge(p);   // covers a purchase whose acknowledge failed earlier
                out.put(toTransaction(p));
            }
            JSObject ret = new JSObject();
            ret.put("transactions", out);
            call.resolve(ret);
        }));
    }
}
