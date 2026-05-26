import UIKit
import UniformTypeIdentifiers

class ShareViewController: UIViewController {

    private let appGroupID = "group.app.saveboard.saveboard"

    private var sharedURL: URL?
    private var sharedText: String?
    private var sharedImage: UIImage?
    private var contentType: ContentType = .unknown

    enum ContentType { case url, text, image, unknown }

    // MARK: - UI

    private lazy var navBar: UIView = {
        let v = UIView(); v.translatesAutoresizingMaskIntoConstraints = false; return v
    }()
    private lazy var cancelButton: UIButton = {
        let b = UIButton(type: .system)
        b.setTitle("Cancel", for: .normal); b.tintColor = .systemGray
        b.addTarget(self, action: #selector(cancel), for: .touchUpInside)
        b.translatesAutoresizingMaskIntoConstraints = false; return b
    }()
    private lazy var titleLabel: UILabel = {
        let l = UILabel(); l.text = "SaveBoard"
        l.font = .systemFont(ofSize: 17, weight: .semibold)
        l.translatesAutoresizingMaskIntoConstraints = false; return l
    }()
    private lazy var previewCard: UIView = {
        let v = UIView(); v.backgroundColor = .secondarySystemBackground
        v.layer.cornerRadius = 14; v.translatesAutoresizingMaskIntoConstraints = false; return v
    }()
    private lazy var previewIcon: UIImageView = {
        let iv = UIImageView(); iv.contentMode = .scaleAspectFill
        iv.clipsToBounds = true; iv.layer.cornerRadius = 8
        iv.backgroundColor = .tertiarySystemBackground
        iv.translatesAutoresizingMaskIntoConstraints = false; return iv
    }()
    private lazy var previewTitle: UILabel = {
        let l = UILabel(); l.font = .systemFont(ofSize: 15, weight: .medium)
        l.numberOfLines = 2; l.translatesAutoresizingMaskIntoConstraints = false; return l
    }()
    private lazy var previewSubtitle: UILabel = {
        let l = UILabel(); l.font = .systemFont(ofSize: 13); l.textColor = .secondaryLabel
        l.numberOfLines = 1; l.translatesAutoresizingMaskIntoConstraints = false; return l
    }()
    private lazy var saveButton: UIButton = {
        var cfg = UIButton.Configuration.filled()
        cfg.title = "Save to SaveBoard"
        cfg.baseBackgroundColor = UIColor(red: 0.13, green: 0.7, blue: 0.47, alpha: 1)
        cfg.cornerStyle = .large
        let b = UIButton(configuration: cfg)
        b.addTarget(self, action: #selector(save), for: .touchUpInside)
        b.translatesAutoresizingMaskIntoConstraints = false; return b
    }()
    private lazy var spinner: UIActivityIndicatorView = {
        let s = UIActivityIndicatorView(style: .medium); s.hidesWhenStopped = true
        s.translatesAutoresizingMaskIntoConstraints = false; return s
    }()

    // MARK: - Lifecycle

    override func viewDidLoad() {
        super.viewDidLoad()
        setupUI()
        extractContent()
    }

    private func setupUI() {
        view.backgroundColor = .systemBackground
        view.addSubview(navBar)
        navBar.addSubview(cancelButton)
        navBar.addSubview(titleLabel)
        view.addSubview(previewCard)
        previewCard.addSubview(previewIcon)
        previewCard.addSubview(previewTitle)
        previewCard.addSubview(previewSubtitle)
        view.addSubview(saveButton)
        view.addSubview(spinner)

        NSLayoutConstraint.activate([
            navBar.topAnchor.constraint(equalTo: view.safeAreaLayoutGuide.topAnchor, constant: 8),
            navBar.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            navBar.trailingAnchor.constraint(equalTo: view.trailingAnchor),
            navBar.heightAnchor.constraint(equalToConstant: 44),

            cancelButton.leadingAnchor.constraint(equalTo: navBar.leadingAnchor, constant: 16),
            cancelButton.centerYAnchor.constraint(equalTo: navBar.centerYAnchor),
            titleLabel.centerXAnchor.constraint(equalTo: navBar.centerXAnchor),
            titleLabel.centerYAnchor.constraint(equalTo: navBar.centerYAnchor),

            previewCard.topAnchor.constraint(equalTo: navBar.bottomAnchor, constant: 16),
            previewCard.leadingAnchor.constraint(equalTo: view.leadingAnchor, constant: 16),
            previewCard.trailingAnchor.constraint(equalTo: view.trailingAnchor, constant: -16),

            previewIcon.topAnchor.constraint(equalTo: previewCard.topAnchor, constant: 12),
            previewIcon.leadingAnchor.constraint(equalTo: previewCard.leadingAnchor, constant: 12),
            previewIcon.widthAnchor.constraint(equalToConstant: 60),
            previewIcon.heightAnchor.constraint(equalToConstant: 60),
            previewIcon.bottomAnchor.constraint(lessThanOrEqualTo: previewCard.bottomAnchor, constant: -12),

            previewTitle.topAnchor.constraint(equalTo: previewCard.topAnchor, constant: 12),
            previewTitle.leadingAnchor.constraint(equalTo: previewIcon.trailingAnchor, constant: 10),
            previewTitle.trailingAnchor.constraint(equalTo: previewCard.trailingAnchor, constant: -12),

            previewSubtitle.topAnchor.constraint(equalTo: previewTitle.bottomAnchor, constant: 4),
            previewSubtitle.leadingAnchor.constraint(equalTo: previewIcon.trailingAnchor, constant: 10),
            previewSubtitle.trailingAnchor.constraint(equalTo: previewCard.trailingAnchor, constant: -12),
            previewSubtitle.bottomAnchor.constraint(equalTo: previewCard.bottomAnchor, constant: -12),

            saveButton.topAnchor.constraint(equalTo: previewCard.bottomAnchor, constant: 20),
            saveButton.leadingAnchor.constraint(equalTo: view.leadingAnchor, constant: 16),
            saveButton.trailingAnchor.constraint(equalTo: view.trailingAnchor, constant: -16),
            saveButton.heightAnchor.constraint(equalToConstant: 50),

            spinner.centerXAnchor.constraint(equalTo: saveButton.centerXAnchor),
            spinner.centerYAnchor.constraint(equalTo: saveButton.centerYAnchor),
        ])
    }

    // MARK: - Content extraction

    private func extractContent() {
        guard let items = extensionContext?.inputItems as? [NSExtensionItem] else { return }
        let allProviders = items.flatMap { $0.attachments ?? [] }

        // URL takes priority over plain text
        if let urlProvider = allProviders.first(where: { $0.hasItemConformingToTypeIdentifier(UTType.url.identifier) }) {
            loadURL(from: urlProvider); return
        }
        if let textProvider = allProviders.first(where: { $0.hasItemConformingToTypeIdentifier(UTType.plainText.identifier) }) {
            loadText(from: textProvider); return
        }
        if let imgProvider = allProviders.first(where: { $0.hasItemConformingToTypeIdentifier(UTType.image.identifier) }) {
            loadImage(from: imgProvider); return
        }
    }

    private func loadURL(from provider: NSItemProvider) {
        provider.loadItem(forTypeIdentifier: UTType.url.identifier) { [weak self] item, _ in
            DispatchQueue.main.async {
                guard let url = item as? URL else { return }
                self?.contentType = .url
                self?.sharedURL = url
                self?.previewTitle.text = url.absoluteString
                self?.previewSubtitle.text = url.host ?? ""
                let img = UIImage(systemName: "link.circle.fill")
                self?.previewIcon.image = img
                self?.previewIcon.tintColor = .systemBlue
                self?.previewIcon.contentMode = .scaleAspectFit
            }
        }
    }

    private func loadText(from provider: NSItemProvider) {
        provider.loadItem(forTypeIdentifier: UTType.plainText.identifier) { [weak self] item, _ in
            DispatchQueue.main.async {
                guard let text = item as? String else { return }
                self?.contentType = .text
                self?.sharedText = text
                self?.previewTitle.text = text
                self?.previewSubtitle.text = "Text"
                self?.previewIcon.image = UIImage(systemName: "text.alignleft")
                self?.previewIcon.tintColor = .systemGreen
                self?.previewIcon.contentMode = .scaleAspectFit
            }
        }
    }

    private func loadImage(from provider: NSItemProvider) {
        provider.loadItem(forTypeIdentifier: UTType.image.identifier) { [weak self] item, _ in
            DispatchQueue.main.async {
                let image: UIImage?
                if let img = item as? UIImage {
                    image = img
                } else if let url = item as? URL {
                    image = UIImage(contentsOfFile: url.path)
                } else {
                    image = nil
                }
                guard let img = image else { return }
                self?.contentType = .image
                self?.sharedImage = img
                self?.previewIcon.image = img
                self?.previewIcon.contentMode = .scaleAspectFill
                self?.previewTitle.text = "Image"
                self?.previewSubtitle.text = "Tap Save to add to SaveBoard"
            }
        }
    }

    // MARK: - Actions

    @objc private func cancel() {
        extensionContext?.cancelRequest(withError: NSError(domain: "SaveBoardShare", code: 0))
    }

    @objc private func save() {
        saveButton.isEnabled = false
        saveButton.configuration?.title = ""
        spinner.startAnimating()

        var item: [String: Any] = [:]

        switch contentType {
        case .url:
            item["type"] = "url"
            item["url"] = sharedURL?.absoluteString ?? ""
        case .text:
            item["type"] = "text"
            item["text"] = sharedText ?? ""
        case .image:
            item["type"] = "image"
            if let img = sharedImage,
               let data = img.jpegData(compressionQuality: 0.85),
               let container = FileManager.default.containerURL(forSecurityApplicationGroupIdentifier: appGroupID) {
                let filename = "share_\(Int(Date().timeIntervalSince1970)).jpg"
                let fileURL = container.appendingPathComponent(filename)
                try? data.write(to: fileURL)
                item["imageFileName"] = filename
            }
        case .unknown:
            cancel(); return
        }

        let defaults = UserDefaults(suiteName: appGroupID)
        var pending = defaults?.array(forKey: "pendingShareItems") as? [[String: Any]] ?? []
        pending.append(item)
        defaults?.set(pending, forKey: "pendingShareItems")
        defaults?.synchronize()

        DispatchQueue.main.asyncAfter(deadline: .now() + 0.4) { [weak self] in
            self?.extensionContext?.completeRequest(returningItems: [], completionHandler: nil)
        }
    }
}
