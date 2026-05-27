import Foundation
import Capacitor
import StoreKit

@objc(StoreKit)
class StoreKitPlugin: CAPPlugin, CAPBridgedPlugin {
    @objc public let identifier = "StoreKitPlugin"
    @objc public let jsName = "StoreKit"
    @objc public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "getProducts", returnType: "promise"),
        CAPPluginMethod(name: "purchase", returnType: "promise"),
        CAPPluginMethod(name: "restorePurchases", returnType: "promise"),
    ]

    @objc func getProducts(_ call: CAPPluginCall) {
        guard let ids = call.getArray("productIds") as? [String] else {
            call.reject("Missing productIds"); return
        }
        Task {
            do {
                let products = try await Product.products(for: ids)
                let result: [[String: Any]] = products.map { p in
                    ["id": p.id, "title": p.displayName, "description": p.description,
                     "price": p.price.description, "displayPrice": p.displayPrice]
                }
                call.resolve(["products": result])
            } catch {
                call.reject("Failed to fetch products: \(error.localizedDescription)")
            }
        }
    }

    @objc func purchase(_ call: CAPPluginCall) {
        guard let productId = call.getString("productId") else {
            call.reject("Missing productId"); return
        }
        Task { @MainActor in
            do {
                let products = try await Product.products(for: [productId])
                guard let product = products.first else {
                    call.reject("Product not found"); return
                }
                let result = try await product.purchase()
                switch result {
                case .success(let verification):
                    switch verification {
                    case .verified(let tx):
                        await tx.finish()
                        var data: [String: Any] = [
                            "transactionId": String(tx.id),
                            "productId": tx.productID,
                            "originalTransactionId": String(tx.originalID),
                        ]
                        if let expires = tx.expirationDate {
                            data["expiresDate"] = ISO8601DateFormatter().string(from: expires)
                        }
                        call.resolve(data)
                    case .unverified(_, let err):
                        call.reject("Verification failed: \(err.localizedDescription)")
                    }
                case .userCancelled:
                    call.reject("User cancelled", "1001")
                case .pending:
                    call.reject("Purchase pending — waiting for approval")
                @unknown default:
                    call.reject("Unknown purchase result")
                }
            } catch {
                call.reject("Purchase failed: \(error.localizedDescription)")
            }
        }
    }

    @objc func restorePurchases(_ call: CAPPluginCall) {
        Task {
            var transactions: [[String: Any]] = []
            for await result in Transaction.currentEntitlements {
                if case .verified(let tx) = result {
                    var item: [String: Any] = [
                        "transactionId": String(tx.id),
                        "productId": tx.productID,
                        "originalTransactionId": String(tx.originalID),
                    ]
                    if let expires = tx.expirationDate {
                        item["expiresDate"] = ISO8601DateFormatter().string(from: expires)
                    }
                    transactions.append(item)
                }
            }
            call.resolve(["transactions": transactions])
        }
    }
}
