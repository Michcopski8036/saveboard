import Foundation
import Capacitor
import AuthenticationServices
import CryptoKit

@objc(SignInWithApple)
class SignInWithApplePlugin: CAPPlugin, CAPBridgedPlugin, ASAuthorizationControllerDelegate, ASAuthorizationControllerPresentationContextProviding {

    @objc public let identifier = "SignInWithApplePlugin"
    @objc public let jsName = "SignInWithApple"
    @objc public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "authorize", returnType: "promise")
    ]

    private var pendingCall: CAPPluginCall?

    @objc func authorize(_ call: CAPPluginCall) {
        pendingCall = call

        let provider = ASAuthorizationAppleIDProvider()
        let request  = provider.createRequest()
        request.requestedScopes = [.fullName, .email]

        if let rawNonce = call.getString("nonce"), !rawNonce.isEmpty {
            request.nonce = sha256(rawNonce)
        }

        let controller = ASAuthorizationController(authorizationRequests: [request])
        controller.delegate = self
        controller.presentationContextProvider = self
        DispatchQueue.main.async { controller.performRequests() }
    }

    // MARK: - ASAuthorizationControllerPresentationContextProviding

    func presentationAnchor(for controller: ASAuthorizationController) -> ASPresentationAnchor {
        return bridge?.webView?.window ?? UIWindow()
    }

    // MARK: - ASAuthorizationControllerDelegate

    func authorizationController(controller: ASAuthorizationController,
                                        didCompleteWithAuthorization authorization: ASAuthorization) {
        guard let credential = authorization.credential as? ASAuthorizationAppleIDCredential,
              let tokenData = credential.identityToken,
              let identityToken = String(data: tokenData, encoding: .utf8) else {
            pendingCall?.reject("Failed to retrieve identity token")
            return
        }

        let response: [String: Any] = [
            "identityToken": identityToken,
            "user":       credential.user,
            "email":      credential.email ?? "",
            "givenName":  credential.fullName?.givenName  ?? "",
            "familyName": credential.fullName?.familyName ?? ""
        ]
        pendingCall?.resolve(["response": response])
    }

    func authorizationController(controller: ASAuthorizationController,
                                        didCompleteWithError error: Error) {
        let code = String((error as NSError).code)
        pendingCall?.reject(code, error.localizedDescription, error)
    }

    // MARK: - Helpers

    private func sha256(_ input: String) -> String {
        let data = Data(input.utf8)
        let hash = SHA256.hash(data: data)
        return hash.map { String(format: "%02x", $0) }.joined()
    }
}
