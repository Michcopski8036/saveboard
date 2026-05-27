import Capacitor
import WebKit

class MainViewController: CAPBridgeViewController {
    override func capacitorDidLoad() {
        bridge?.registerPluginType(StoreKitPlugin.self)

        // Inject app-target plugin headers before page JS runs.
        // autoRegisterPlugins only picks up SPM-packaged plugins.
        let js = """
        (function() {
            var a = (window.Capacitor = window.Capacitor || {});
            var h = (a.PluginHeaders = a.PluginHeaders || []);
            if (!h.some(function(p) { return p.name === 'StoreKit'; })) {
                h.push({ name: 'StoreKit', methods: [
                    { name: 'getProducts', rtype: 'promise' },
                    { name: 'purchase', rtype: 'promise' },
                    { name: 'restorePurchases', rtype: 'promise' },
                ]});
            }
        })();
        """
        let script = WKUserScript(source: js, injectionTime: .atDocumentStart, forMainFrameOnly: true)
        bridge?.webView?.configuration.userContentController.addUserScript(script)
    }
}
