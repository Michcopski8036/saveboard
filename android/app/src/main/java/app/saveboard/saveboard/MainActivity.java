package app.saveboard.saveboard;

import android.content.Intent;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    // Android share-target: the SEND intent-filter is on this (singleTask) activity.
    // When the app is already running/backgrounded the share arrives via onNewIntent,
    // so we must (1) replace the activity's intent so SendIntent.checkSendIntentReceived()
    // reads the NEW shared link (it reads getActivity().getIntent()), and (2) tell the
    // web layer to re-check by dispatching the `sendIntentReceived` event App.tsx listens for.
    // Without this, only cold-start shares worked.
    @Override
    protected void onNewIntent(Intent intent) {
        setIntent(intent);
        super.onNewIntent(intent);
        if (getBridge() != null && getBridge().getWebView() != null) {
            getBridge().getWebView().post(() ->
                getBridge().getWebView().evaluateJavascript(
                    "window.dispatchEvent(new Event('sendIntentReceived'))", null));
        }
    }
}
