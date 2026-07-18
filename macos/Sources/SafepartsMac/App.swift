import SafepartsKit
import SwiftUI

@main
struct SafepartsApp: App {
    @StateObject private var model = AppModel()

    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(model)
                .frame(minWidth: 860, minHeight: 640)
        }
        .commands {
            CommandGroup(after: .newItem) {
                Button(model.task == .split ? "Import Secret…" : "Import Recovery Shares…") {
                    model.importForCurrentTask()
                }
                .keyboardShortcut("o")

                Button(model.task == .split ? "Export Recovery Shares…" : "Save Recovered Secret…") {
                    model.exportCurrentResult()
                }
                .keyboardShortcut("s", modifiers: [.command, .shift])
                .disabled(!model.canExportCurrentResult)
            }

            CommandMenu("Safeparts") {
                Button("Clear Current Task") {
                    model.clearCurrentTask()
                }
                .keyboardShortcut(.delete, modifiers: [.command, .shift])
            }

            CommandMenu("Tasks") {
                Button("Split") { model.task = .split }
                    .keyboardShortcut("1")
                Button("Recover") { model.task = .recover }
                    .keyboardShortcut("2")
            }
        }
    }
}

struct ContentView: View {
    @EnvironmentObject private var model: AppModel

    var body: some View {
        NavigationSplitView {
            List(WorkbenchTask.allCases, selection: $model.task) { task in
                Label(task.rawValue, systemImage: task == .split ? "square.split.2x1" : "arrow.triangle.2.circlepath")
                    .tag(task)
            }
            .navigationTitle("Safeparts")
            .navigationSplitViewColumnWidth(min: 180, ideal: 210)
        } detail: {
            switch model.task {
            case .split:
                SplitView()
            case .recover:
                RecoverView()
            }
        }
        .toolbar {
            ToolbarItemGroup {
                Label("Local only", systemImage: "lock.shield")
                    .foregroundStyle(.secondary)
                    .help("Cryptographic operations run on this Mac.")

                Button("Clear", systemImage: "trash") {
                    model.clearCurrentTask()
                }
                .help("Clear the current task (Command-Shift-Delete)")
            }
        }
    }
}

struct SplitView: View {
    @EnvironmentObject private var model: AppModel

    private var secretBinding: Binding<String> {
        Binding(
            get: { model.secretText },
            set: {
                model.secretText = $0
                model.useTextSecret()
            }
        )
    }

    var body: some View {
        Form {
            PageHeader(
                title: "Split a secret",
                subtitle: "Create recovery shares without sending data anywhere."
            )

            Section("Secret") {
                if let imported = model.importedSecret {
                    LabeledContent("Imported file") {
                        VStack(alignment: .trailing, spacing: 3) {
                            Text(imported.name)
                                .lineLimit(1)
                            Text("\(imported.bytes.count.formatted()) bytes")
                                .font(.caption)
                                .foregroundStyle(.secondary)
                        }
                    }
                    HStack {
                        Button("Replace File…", systemImage: "doc.badge.plus") {
                            model.chooseSecretFile()
                        }
                        Button("Use Text Instead", systemImage: "text.cursor") {
                            model.removeImportedSecret()
                        }
                    }
                } else {
                    TextEditor(text: secretBinding)
                        .font(.body.monospaced())
                        .frame(minHeight: 120)
                        .accessibilityLabel("Secret text")
                    HStack {
                        Button("Paste", systemImage: "doc.on.clipboard") {
                            model.pasteSecret()
                        }
                        Button("Import File…", systemImage: "doc.badge.plus") {
                            model.chooseSecretFile()
                        }
                    }
                }
            }

            Section("Recovery policy") {
                LabeledContent("Threshold") {
                    Stepper(value: $model.threshold, in: 1 ... model.shareCount) {
                        Text("\(model.threshold)")
                            .monospacedDigit()
                    }
                    .accessibilityLabel("Minimum recovery shares")
                    .onChange(of: model.threshold) { _, _ in model.invalidateSplitResult() }
                }

                LabeledContent("Share count") {
                    Stepper(value: $model.shareCount, in: model.threshold ... 255) {
                        Text("\(model.shareCount)")
                            .monospacedDigit()
                    }
                    .accessibilityLabel("Total recovery shares")
                    .onChange(of: model.shareCount) { _, _ in model.invalidateSplitResult() }
                }

                Picker("Share encoding", selection: $model.encoding) {
                    Text("Base64url").tag(ShareEncoding.base64url)
                    Text("Base58Check").tag(ShareEncoding.base58check)
                    Text("Mnemonic words").tag(ShareEncoding.mnemoWords)
                    Text("BIP-39 mnemonic").tag(ShareEncoding.mnemoBip39)
                }
                .onChange(of: model.encoding) { _, _ in model.invalidateSplitResult() }

                SecureField("Optional passphrase", text: $model.splitPassphrase)
                    .onChange(of: model.splitPassphrase) { _, _ in model.invalidateSplitResult() }
            }

            Section {
                HStack {
                    Button {
                        Task { await model.split() }
                    } label: {
                        if model.isSplitting {
                            ProgressView()
                                .controlSize(.small)
                        } else {
                            Label("Create Recovery Shares", systemImage: "square.split.2x1")
                        }
                    }
                    .buttonStyle(.borderedProminent)
                    .keyboardShortcut(.return, modifiers: .command)
                    .disabled(!model.canSplit)

                    Text("Command-Return")
                        .font(.caption)
                        .foregroundStyle(.tertiary)
                }

                if let status = model.splitStatus {
                    StatusView(status: status)
                }
            }

            if !model.shares.isEmpty {
                Section("Recovery shares") {
                    ForEach(model.shares, id: \.index) { share in
                        ShareRow(share: share)
                    }

                    HStack {
                        Spacer()
                        Button("Export All…", systemImage: "folder.badge.plus") {
                            model.exportAllShares()
                        }
                    }
                }
            }
        }
        .formStyle(.grouped)
        .navigationTitle("Split")
    }
}

struct ShareRow: View {
    @EnvironmentObject private var model: AppModel
    let share: EncodedShare

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Label("Share \(share.index) of \(share.shareCount)", systemImage: "key.horizontal")
                    .font(.headline)
                Spacer()
                ControlGroup {
                    Button("Copy", systemImage: "doc.on.doc") {
                        model.copy(share.text)
                    }
                    Button("Save…", systemImage: "square.and.arrow.down") {
                        model.saveShare(share)
                    }
                }
                .labelStyle(.iconOnly)
            }

            ScrollView([.horizontal, .vertical]) {
                Text(share.text)
                    .font(.caption.monospaced())
                    .textSelection(.enabled)
                    .fixedSize(horizontal: true, vertical: false)
            }
            .frame(minHeight: 72, maxHeight: 160)
            .accessibilityLabel("Recovery share \(share.index)")
            .accessibilityValue(share.text)
        }
        .padding(.vertical, 4)
    }
}

struct RecoverView: View {
    @EnvironmentObject private var model: AppModel

    private var shareInputBinding: Binding<String> {
        Binding(
            get: { model.shareInput },
            set: { model.updateShareInput($0) }
        )
    }

    private var encodingBinding: Binding<ShareEncoding> {
        Binding(
            get: { model.recoveryEncoding },
            set: { model.setRecoveryEncoding($0) }
        )
    }

    var body: some View {
        Form {
            PageHeader(
                title: "Recover a secret",
                subtitle: "Add enough recovery shares from the same set."
            )

            Section("Recovery shares") {
                TextEditor(text: shareInputBinding)
                    .font(.body.monospaced())
                    .frame(minHeight: 190)
                    .accessibilityLabel("Recovery share text")

                HStack {
                    Button("Paste", systemImage: "doc.on.clipboard", action: model.pasteShares)
                    Button("Import Files…", systemImage: "doc.on.doc") {
                        model.chooseShareFiles()
                    }
                }
            }

            Section("Recovery options") {
                Picker("Share encoding", selection: encodingBinding) {
                    Text("Auto-detect").tag(ShareEncoding.auto)
                    Text("Base64url").tag(ShareEncoding.base64url)
                    Text("Base58Check").tag(ShareEncoding.base58check)
                    Text("Mnemonic words").tag(ShareEncoding.mnemoWords)
                    Text("BIP-39 mnemonic").tag(ShareEncoding.mnemoBip39)
                }

                SecureField("Passphrase, if required", text: $model.recoveryPassphrase)
                    .onChange(of: model.recoveryPassphrase) { _, _ in model.invalidateRecoveryResult() }
            }

            if let inspection = model.inspection {
                Section("Share summary") {
                    LabeledContent("Detected encoding", value: inspection.detectedEncoding.displayName)
                    LabeledContent("Recovery threshold", value: "\(inspection.threshold) of \(inspection.shareCount)")
                    LabeledContent("Shares provided", value: "\(inspection.providedCount)")
                    LabeledContent("Passphrase protected", value: inspection.encrypted ? "Yes" : "No")
                    LabeledContent("Consistent") {
                        if inspection.consistent {
                            Text("Yes")
                        } else {
                            Text("No")
                                .foregroundStyle(.orange)
                        }
                    }
                    LabeledContent("Status") {
                        Label(
                            inspection.ready ? "Ready to recover" : "More valid shares needed",
                            systemImage: inspection.ready ? "checkmark.circle.fill" : "exclamationmark.circle"
                        )
                        .foregroundStyle(inspection.ready ? .green : .secondary)
                    }
                }
            }

            Section {
                HStack {
                    Button {
                        Task { await model.recover() }
                    } label: {
                        if model.isRecovering {
                            ProgressView()
                                .controlSize(.small)
                        } else {
                            Label("Recover Secret", systemImage: "arrow.triangle.2.circlepath")
                        }
                    }
                    .buttonStyle(.borderedProminent)
                    .keyboardShortcut(.return, modifiers: .command)
                    .disabled(!model.canRecover)

                    Text("Command-Return")
                        .font(.caption)
                        .foregroundStyle(.tertiary)
                }

                if let status = model.recoveryStatus {
                    StatusView(status: status)
                }
            }

            if let recovery = model.recovery {
                Section("Recovered secret") {
                    if let text = model.recoveredText {
                        Text(text)
                            .font(.body.monospaced())
                            .textSelection(.enabled)
                            .frame(maxWidth: .infinity, alignment: .leading)
                        Button("Copy Text", systemImage: "doc.on.doc") {
                            model.copy(text)
                        }
                    } else {
                        Label("Binary data (\(recovery.bytes.count.formatted()) bytes)", systemImage: "doc")
                            .foregroundStyle(.secondary)
                    }

                    Button("Save Recovered Secret…", systemImage: "square.and.arrow.down") {
                        model.saveRecovery()
                    }
                }
            }
        }
        .formStyle(.grouped)
        .navigationTitle("Recover")
    }
}

struct PageHeader: View {
    let title: String
    let subtitle: String

    var body: some View {
        Section {
            VStack(alignment: .leading, spacing: 4) {
                Text(title)
                    .font(.largeTitle.weight(.semibold))
                Text(subtitle)
                    .foregroundStyle(.secondary)
            }
            .accessibilityElement(children: .combine)
        }
    }
}

struct StatusView: View {
    let status: AppStatus

    private var symbol: String {
        switch status.kind {
        case .working: "clock"
        case .success: "checkmark.circle.fill"
        case .warning: "exclamationmark.triangle.fill"
        case .failure: "xmark.octagon.fill"
        }
    }

    private var accessibilityPrefix: String {
        switch status.kind {
        case .working: "In progress"
        case .success: "Success"
        case .warning: "Warning"
        case .failure: "Error"
        }
    }

    var body: some View {
        Label(status.message, systemImage: symbol)
            .foregroundStyle(status.kind == .failure ? .red : .secondary)
            .accessibilityLabel("\(accessibilityPrefix): \(status.message)")
    }
}

extension ShareEncoding {
    var displayName: String {
        switch self {
        case .auto: "Auto-detect"
        case .base64url: "Base64url"
        case .base58check: "Base58Check"
        case .mnemoWords: "Mnemonic words"
        case .mnemoBip39: "BIP-39 mnemonic"
        }
    }
}
