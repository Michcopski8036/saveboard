import Capacitor
import WebKit

class MainViewController: CAPBridgeViewController {
    override func capacitorDidLoad() {
        bridge?.registerPluginType(SignInWithApplePlugin.self)

        // Inject SignInWithApple into Capacitor.PluginHeaders before page JS runs.
        // autoRegisterPlugins only picks up SPM-packaged plugins; our app-target plugin
        // must be declared here so the JS bridge finds it in PluginHeaders.
        let js = """
        (function() {
            var a = (window.Capacitor = window.Capacitor || {});
            var h = (a.PluginHeaders = a.PluginHeaders || []);
            if (!h.some(function(p) { return p.name === 'SignInWithApple'; })) {
                h.push({ name: 'SignInWithApple', methods: [{ name: 'authorize', rtype: 'promise' }] });
            }
        })();
        """
        let script = WKUserScript(source: js, injectionTime: .atDocumentStart, forMainFrameOnly: true)
        bridge?.webView?.configuration.userContentController.addUserScript(script)
    }
}
