import AppKit
import Foundation

public enum WorkbenchTask: String, CaseIterable, Identifiable, Sendable {
    case split = "Split"
    case recover = "Recover"

    public var id: Self { self }
}

public struct AppStatus: Equatable, Sendable {
    public enum Kind: Equatable, Sendable {
        case working
        case success
        case warning
        case failure
    }

    public let kind: Kind
    public let message: String

    public init(_ kind: Kind, _ message: String) {
        self.kind = kind
        self.message = message
    }
}

public struct ImportedSecret: Equatable, Sendable {
    public let name: String
    public let bytes: Data

    public init(name: String, bytes: Data) {
        self.name = name
        self.bytes = bytes
    }
}

public enum FileOperationError: LocalizedError, Equatable, Sendable {
    case readFailed(String)
    case nonUTF8Share(String)
    case noShareText
    case writeFailed(String)

    public var errorDescription: String? {
        switch self {
        case let .readFailed(name):
            "Couldn’t read \(name)."
        case let .nonUTF8Share(name):
            "\(name) is not a UTF-8 recovery-share file."
        case .noShareText:
            "The selected files did not contain recovery shares."
        case let .writeFailed(name):
            "Couldn’t write \(name)."
        }
    }
}

public enum FileOperations {
    public nonisolated static func readSecret(at url: URL) throws -> Data {
        do {
            return try Data(contentsOf: url)
        } catch {
            throw FileOperationError.readFailed(url.lastPathComponent)
        }
    }

    public nonisolated static func readShares(at urls: [URL]) throws -> String {
        var shares: [String] = []
        for url in urls {
            let data: Data
            do {
                data = try Data(contentsOf: url)
            } catch {
                throw FileOperationError.readFailed(url.lastPathComponent)
            }
            guard let text = String(data: data, encoding: .utf8) else {
                throw FileOperationError.nonUTF8Share(url.lastPathComponent)
            }
            let trimmed = text.trimmingCharacters(in: .whitespacesAndNewlines)
            if !trimmed.isEmpty {
                shares.append(trimmed)
            }
        }
        guard !shares.isEmpty else {
            throw FileOperationError.noShareText
        }
        return shares.joined(separator: "\n\n")
    }

    public nonisolated static func write(_ data: Data, to url: URL) throws {
        do {
            try data.write(to: url, options: .atomic)
        } catch {
            throw FileOperationError.writeFailed(url.lastPathComponent)
        }
    }
}

@MainActor
public final class AppModel: ObservableObject {
    @Published public var task: WorkbenchTask = .split

    @Published public var secretText = ""
    @Published public private(set) var importedSecret: ImportedSecret?
    @Published public var splitPassphrase = ""
    @Published public var threshold = 2
    @Published public var shareCount = 3
    @Published public var encoding: ShareEncoding = .mnemoWords
    @Published public private(set) var shares: [EncodedShare] = []
    @Published public private(set) var splitStatus: AppStatus?
    @Published public private(set) var isSplitting = false

    @Published public private(set) var recoveryShareInputs = ["", ""]
    @Published public var recoveryPassphrase = ""
    @Published public var recoveryEncoding: ShareEncoding = .mnemoWords
    @Published public private(set) var inspection: Inspection?
    @Published public private(set) var recovery: Recovery?
    @Published public private(set) var recoveryStatus: AppStatus?
    @Published public private(set) var isRecovering = false

    private var splitToken = UUID()
    private var recoveryToken = UUID()
    private var inspectionToken = UUID()
    private var inspectionTask: Task<Void, Never>?
    private var recoveryEncodingWasManuallySelected = false

    public init() {}

    public var currentSecretData: Data {
        importedSecret?.bytes ?? Data(secretText.utf8)
    }

    public var canSplit: Bool {
        !currentSecretData.isEmpty && !isSplitting && encoding != .auto
    }

    public var shareInput: String {
        recoveryShareInputs
            .map { $0.trimmingCharacters(in: .whitespacesAndNewlines) }
            .filter { !$0.isEmpty }
            .joined(separator: "\n\n")
    }

    public var minimumRecoveryShareCount: Int {
        max(2, inspection.map { Int($0.threshold) } ?? 2)
    }

    public var recoveryPassphraseEnabled: Bool {
        inspection?.encrypted == true
    }

    public var canRecover: Bool {
        guard !isRecovering, inspection?.ready == true else { return false }
        return !recoveryPassphraseEnabled || !recoveryPassphrase.isEmpty
    }

    public var canExportCurrentResult: Bool {
        switch task {
        case .split: !shares.isEmpty
        case .recover: recovery != nil
        }
    }

    public var recoveredText: String? {
        recovery.flatMap { String(data: $0.bytes, encoding: .utf8) }
    }

    public func normalizeThreshold() {
        shareCount = min(255, max(1, shareCount))
        threshold = min(shareCount, max(1, threshold))
    }

    public func useTextSecret() {
        importedSecret = nil
        invalidateSplitResult()
    }

    public func invalidateSplitResult() {
        splitToken = UUID()
        shares = []
        splitStatus = nil
        isSplitting = false
    }

    public func invalidateRecoveryResult() {
        recoveryToken = UUID()
        recovery = nil
        recoveryStatus = nil
        isRecovering = false
    }

    public func setImportedSecret(name: String, bytes: Data) {
        invalidateSplitResult()
        importedSecret = ImportedSecret(name: name, bytes: bytes)
        secretText = ""
        splitStatus = .init(.success, "Loaded \(name) (\(bytes.count) bytes).")
    }

    public func removeImportedSecret() {
        importedSecret = nil
        invalidateSplitResult()
    }

    public func updateShareInput(_ input: String) {
        let normalized = input.replacingOccurrences(of: "\r\n", with: "\n")
        let values = normalized
            .components(separatedBy: "\n\n")
            .map { $0.trimmingCharacters(in: .whitespacesAndNewlines) }
            .filter { !$0.isEmpty }
        recoveryShareInputs = values + Array(repeating: "", count: max(0, 2 - values.count))
        refreshRecoveryInput()
    }

    public func updateRecoveryShare(at index: Int, with value: String) {
        guard recoveryShareInputs.indices.contains(index) else { return }
        recoveryShareInputs[index] = value
        refreshRecoveryInput()
    }

    public func addRecoveryShareInput() {
        recoveryShareInputs.append("")
    }

    public func setRecoveryEncoding(_ selected: ShareEncoding) {
        recoveryEncodingWasManuallySelected = true
        recoveryEncoding = selected
        invalidateRecoveryResult()
    }

    public func clearSplit() {
        splitToken = UUID()
        secretText = ""
        importedSecret = nil
        splitPassphrase = ""
        shares = []
        splitStatus = nil
        isSplitting = false
    }

    public func clearRecovery() {
        recoveryToken = UUID()
        inspectionToken = UUID()
        inspectionTask?.cancel()
        recoveryShareInputs = ["", ""]
        recoveryPassphrase = ""
        recoveryEncoding = .mnemoWords
        recoveryEncodingWasManuallySelected = false
        inspection = nil
        recovery = nil
        recoveryStatus = nil
        isRecovering = false
    }

    public func clearCurrentTask() {
        switch task {
        case .split: clearSplit()
        case .recover: clearRecovery()
        }
    }

    public func clear() {
        clearSplit()
        clearRecovery()
    }

    public func split(_ bytes: Data? = nil) async {
        normalizeThreshold()
        let payload = bytes ?? currentSecretData
        guard !payload.isEmpty else {
            shares = []
            splitStatus = .init(.failure, "Enter text or import a file before splitting.")
            return
        }

        let token = UUID()
        splitToken = token
        shares = []
        isSplitting = true
        splitStatus = .init(.working, "Creating recovery shares…")

        let selected = encoding
        let k = UInt8(threshold)
        let n = UInt8(shareCount)
        let passphrase = splitPassphrase.isEmpty ? nil : splitPassphrase
        let outcome: ([EncodedShare]?, String?) = await Task.detached(priority: .userInitiated) {
            do {
                let value = try splitSecret(
                    secret: payload,
                    threshold: k,
                    shareCount: n,
                    selected: selected,
                    passphrase: passphrase
                )
                return (value, nil as String?)
            } catch {
                return (nil, AppModel.message(for: error))
            }
        }.value

        guard splitToken == token else { return }
        isSplitting = false
        if let value = outcome.0 {
            shares = value
            splitStatus = .init(.success, "Created \(value.count) recovery shares.")
        } else {
            shares = []
            splitStatus = .init(.failure, outcome.1 ?? "Safeparts couldn’t create recovery shares.")
        }
    }

    public func recover() async {
        let input = shareInput
        guard !input.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else {
            recovery = nil
            recoveryStatus = .init(.failure, "Paste or import recovery shares first.")
            return
        }

        let token = UUID()
        recoveryToken = token
        recovery = nil
        isRecovering = true
        recoveryStatus = .init(.working, "Recovering the secret…")

        let selected = recoveryEncoding
        let passphrase = recoveryPassphrase.isEmpty ? nil : recoveryPassphrase
        let outcome: (Recovery?, String?) = await Task.detached(priority: .userInitiated) {
            do {
                let value = try combineShareInput(
                    input: input,
                    selected: selected,
                    passphrase: passphrase
                )
                return (value, nil as String?)
            } catch {
                return (nil, AppModel.message(for: error))
            }
        }.value

        guard recoveryToken == token else { return }
        isRecovering = false
        if let value = outcome.0 {
            recovery = value
            recoveryStatus = .init(.success, "Secret recovered.")
        } else {
            recovery = nil
            recoveryStatus = .init(.failure, outcome.1 ?? "Safeparts couldn’t recover the secret.")
        }
    }

    public func scheduleInspection() {
        inspectionTask?.cancel()
        inspection = nil
        let input = shareInput
        guard !input.isEmpty else { return }
        let token = UUID()
        inspectionToken = token

        inspectionTask = Task { [weak self] in
            try? await Task.sleep(for: .milliseconds(250))
            guard !Task.isCancelled else { return }
            let value = await Task.detached(priority: .utility) {
                try? inspectShareInput(input: input, selected: .auto)
            }.value
            guard !Task.isCancelled, let self, self.inspectionToken == token else { return }
            self.inspection = value
            guard let value else { return }
            if !self.recoveryEncodingWasManuallySelected {
                self.recoveryEncoding = value.detectedEncoding
            }
            self.ensureRecoveryShareInputCount(Int(value.threshold))
            if !value.encrypted {
                self.recoveryPassphrase = ""
            }
        }
    }

    public nonisolated static func fileName(_ share: EncodedShare) -> String {
        "safeparts-\(share.setId)-share-\(share.index)-of-\(share.shareCount).txt"
    }

    public nonisolated static func message(for error: Error) -> String {
        guard let error = error as? BridgeError else {
            return "Safeparts couldn’t complete the operation."
        }
        switch error {
        case .InvalidParameters:
            return "Choose a threshold no greater than the share count."
        case .InvalidEncoding:
            return "Choose a concrete share encoding before splitting."
        case .EmptyInput:
            return "Paste or import at least one recovery share."
        case .MalformedShares:
            return "The recovery shares could not be decoded with the selected encoding."
        case .InsufficientShares:
            return "More recovery shares are required."
        case .DuplicateShares:
            return "The same recovery share was provided more than once."
        case .MixedShares:
            return "The recovery shares do not belong to the same set."
        case .PassphraseRequired:
            return "These recovery shares require a passphrase."
        case .IncorrectPassphrase:
            return "The passphrase is incorrect, or the encrypted data was changed."
        case .IntegrityFailure:
            return "The recovery shares failed their integrity check."
        case .Internal:
            return "Safeparts couldn’t complete the operation."
        }
    }

    public func copy(_ text: String) {
        NSPasteboard.general.clearContents()
        guard NSPasteboard.general.setString(text, forType: .string) else {
            setCurrentStatus(.init(.failure, "The clipboard could not be updated."))
            return
        }
        setCurrentStatus(.init(.warning, "Copied. Other apps can read clipboard contents."))
    }

    public func pasteSecret() {
        guard let text = NSPasteboard.general.string(forType: .string) else {
            splitStatus = .init(.failure, "The clipboard does not contain text.")
            return
        }
        invalidateSplitResult()
        importedSecret = nil
        secretText = text
        splitStatus = .init(.warning, "Pasted from the clipboard.")
    }

    public func pasteShares() {
        guard let text = NSPasteboard.general.string(forType: .string) else {
            recoveryStatus = .init(.failure, "The clipboard does not contain text.")
            return
        }
        updateShareInput(text)
        recoveryStatus = .init(.warning, "Pasted from the clipboard.")
    }

    public func importForCurrentTask() {
        switch task {
        case .split: chooseSecretFile()
        case .recover: chooseShareFiles()
        }
    }

    public func exportCurrentResult() {
        switch task {
        case .split:
            exportAllShares()
        case .recover:
            saveRecovery()
        }
    }

    public func chooseSecretFile() {
        let panel = NSOpenPanel()
        panel.allowsMultipleSelection = false
        panel.canChooseDirectories = false
        panel.prompt = "Import"
        guard panel.runModal() == .OK, let url = panel.url else { return }
        let token = UUID()
        splitToken = token
        splitStatus = .init(.working, "Reading \(url.lastPathComponent)…")
        Task {
            let outcome: (Data?, String?) = await Task.detached(priority: .userInitiated) {
                do {
                    return (try FileOperations.readSecret(at: url), nil)
                } catch {
                    return (nil, error.localizedDescription)
                }
            }.value
            guard splitToken == token else { return }
            if let bytes = outcome.0 {
                setImportedSecret(name: url.lastPathComponent, bytes: bytes)
            } else {
                splitStatus = .init(.failure, outcome.1 ?? "The file could not be read.")
            }
        }
    }

    public func chooseShareFiles() {
        let panel = NSOpenPanel()
        panel.allowsMultipleSelection = true
        panel.canChooseDirectories = false
        panel.prompt = "Import"
        guard panel.runModal() == .OK, !panel.urls.isEmpty else { return }
        let urls = panel.urls
        let token = UUID()
        recoveryToken = token
        recoveryStatus = .init(.working, "Reading \(urls.count) share file(s)…")
        Task {
            let outcome: (String?, String?) = await Task.detached(priority: .userInitiated) {
                do {
                    return (try FileOperations.readShares(at: urls), nil)
                } catch {
                    return (nil, error.localizedDescription)
                }
            }.value
            guard recoveryToken == token else { return }
            if let input = outcome.0 {
                updateShareInput(input)
                recoveryStatus = .init(.success, "Imported \(urls.count) share file(s).")
            } else {
                recoveryStatus = .init(.failure, outcome.1 ?? "The share files could not be read.")
            }
        }
    }

    public func saveShare(_ share: EncodedShare) {
        let panel = NSSavePanel()
        panel.nameFieldStringValue = Self.fileName(share)
        guard panel.runModal() == .OK, let url = panel.url else { return }
        write(Data(share.text.utf8), to: url, success: "Saved recovery share.", task: .split)
    }

    public func exportAllShares() {
        guard !shares.isEmpty else {
            splitStatus = .init(.failure, "Create recovery shares before exporting.")
            return
        }
        let panel = NSOpenPanel()
        panel.canChooseDirectories = true
        panel.canChooseFiles = false
        panel.canCreateDirectories = true
        panel.prompt = "Export"
        guard panel.runModal() == .OK, let directory = panel.url else { return }
        let output = shares.map { (Self.fileName($0), Data($0.text.utf8)) }
        let token = splitToken
        splitStatus = .init(.working, "Exporting \(output.count) recovery shares…")
        Task {
            let failure = await Task.detached(priority: .userInitiated) { () -> String? in
                for (name, data) in output {
                    do {
                        try FileOperations.write(data, to: directory.appendingPathComponent(name))
                    } catch {
                        return name
                    }
                }
                return nil
            }.value
            guard splitToken == token else { return }
            if let failure {
                splitStatus = .init(.failure, "Export stopped because \(failure) could not be written. Check the destination before trying again.")
            } else {
                splitStatus = .init(.success, "Exported \(output.count) separate recovery-share files.")
            }
        }
    }

    public func saveRecovery() {
        guard let recovery else {
            recoveryStatus = .init(.failure, "Recover a secret before saving.")
            return
        }
        let panel = NSSavePanel()
        panel.nameFieldStringValue = "recovered-secret"
        guard panel.runModal() == .OK, let url = panel.url else { return }
        write(recovery.bytes, to: url, success: "Saved the recovered secret.", task: .recover)
    }

    private func refreshRecoveryInput() {
        invalidateRecoveryResult()
        scheduleInspection()
    }

    private func ensureRecoveryShareInputCount(_ requiredCount: Int) {
        let missingCount = max(0, max(2, requiredCount) - recoveryShareInputs.count)
        recoveryShareInputs.append(contentsOf: Array(repeating: "", count: missingCount))
    }

    private func write(_ data: Data, to url: URL, success: String, task: WorkbenchTask) {
        let token = token(for: task)
        setStatus(.init(.working, "Writing \(url.lastPathComponent)…"), for: task)
        Task {
            let error = await Task.detached(priority: .userInitiated) { () -> String? in
                do {
                    try FileOperations.write(data, to: url)
                    return nil
                } catch {
                    return error.localizedDescription
                }
            }.value
            guard self.token(for: task) == token else { return }
            if let error {
                setStatus(.init(.failure, error), for: task)
            } else {
                setStatus(.init(.success, success), for: task)
            }
        }
    }

    private func token(for task: WorkbenchTask) -> UUID {
        switch task {
        case .split: splitToken
        case .recover: recoveryToken
        }
    }

    private func setCurrentStatus(_ status: AppStatus) {
        setStatus(status, for: task)
    }

    private func setStatus(_ status: AppStatus, for task: WorkbenchTask) {
        switch task {
        case .split: splitStatus = status
        case .recover: recoveryStatus = status
        }
    }
}
