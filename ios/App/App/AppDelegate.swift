import UIKit
import Capacitor
import WebKit

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate {

    var window: UIWindow?

    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        // Override point for customization after application launch.
        return true
    }

    func applicationWillResignActive(_ application: UIApplication) {
        // Sent when the application is about to move from active to inactive state. This can occur for certain types of temporary interruptions (such as an incoming phone call or SMS message) or when the user quits the application and it begins the transition to the background state.
        // Use this method to pause ongoing tasks, disable timers, and invalidate graphics rendering callbacks. Games should use this method to pause the game.
    }

    func applicationDidEnterBackground(_ application: UIApplication) {
        // Use this method to release shared resources, save user data, invalidate timers, and store enough application state information to restore your application to its current state in case it is terminated later.
        // If your application supports background execution, this method is called instead of applicationWillTerminate: when the user quits.
    }

    func applicationWillEnterForeground(_ application: UIApplication) {
        // Called as part of the transition from the background to the active state; here you can undo many of the changes made on entering the background.
    }

    func applicationDidBecomeActive(_ application: UIApplication) {
        processPendingShareItems()
    }

    private func processPendingShareItems() {
        let appGroupID = "group.app.saveboard.saveboard"
        guard let defaults = UserDefaults(suiteName: appGroupID),
              let pending = defaults.array(forKey: "pendingShareItems") as? [[String: Any]],
              !pending.isEmpty else { return }

        defaults.removeObject(forKey: "pendingShareItems")
        defaults.synchronize()

        // Resolve image files to base64 strings
        var resolved: [[String: Any]] = pending.map { item in
            var copy = item
            if let filename = item["imageFileName"] as? String,
               let container = FileManager.default.containerURL(forSecurityApplicationGroupIdentifier: appGroupID) {
                let fileURL = container.appendingPathComponent(filename)
                if let data = try? Data(contentsOf: fileURL) {
                    copy["imageBase64"] = data.base64EncodedString()
                    try? FileManager.default.removeItem(at: fileURL)
                }
                copy.removeValue(forKey: "imageFileName")
            }
            return copy
        }

        guard let jsonData = try? JSONSerialization.data(withJSONObject: resolved),
              let json = String(data: jsonData, encoding: .utf8) else { return }

        let js = "window.dispatchEvent(new CustomEvent('saveboard-share', { detail: \(json) }))"

        DispatchQueue.main.asyncAfter(deadline: .now() + 1.5) { [weak self] in
            guard let bridge = (self?.window?.rootViewController as? CAPBridgeViewController)?.bridge else { return }
            bridge.webView?.evaluateJavaScript(js, completionHandler: nil)
        }
    }

    func applicationWillTerminate(_ application: UIApplication) {
        // Called when the application is about to terminate. Save data if appropriate. See also applicationDidEnterBackground:.
    }

    func application(_ app: UIApplication, open url: URL, options: [UIApplication.OpenURLOptionsKey: Any] = [:]) -> Bool {
        // Called when the app was launched with a url. Feel free to add additional processing here,
        // but if you want the App API to support tracking app url opens, make sure to keep this call
        return ApplicationDelegateProxy.shared.application(app, open: url, options: options)
    }

    func application(_ application: UIApplication, continue userActivity: NSUserActivity, restorationHandler: @escaping ([UIUserActivityRestoring]?) -> Void) -> Bool {
        // Called when the app was launched with an activity, including Universal Links.
        // Feel free to add additional processing here, but if you want the App API to support
        // tracking app url opens, make sure to keep this call
        return ApplicationDelegateProxy.shared.application(application, continue: userActivity, restorationHandler: restorationHandler)
    }

}
