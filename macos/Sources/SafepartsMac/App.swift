import SafepartsKit
import SwiftUI

@main
struct SafepartsApp: App {
    @StateObject private var model = AppModel()

    var body: some Scene {
        WindowGroup("Safeparts") {
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
        VStack(spacing: 0) {
            TaskSwitcher()
            Divider()

            switch model.task {
            case .split:
                SplitView()
            case .recover:
                RecoverView()
            }
        }
        .toolbar {
            ToolbarItem(placement: .navigation) {
                Image("safeparts-logo", bundle: .module)
                    .resizable()
                    .renderingMode(.original)
                    .scaledToFit()
                    .frame(width: 24, height: 24)
                    .accessibilityLabel("Safeparts logo")
                    .help("Safeparts")
            }

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

struct TaskSwitcher: View {
    @EnvironmentObject private var model: AppModel

    var body: some View {
        Picker("Task", selection: $model.task) {
            ForEach(WorkbenchTask.allCases) { task in
                Text(task.rawValue).tag(task)
            }
        }
        .labelsHidden()
        .pickerStyle(.segmented)
        .frame(width: 260)
        .frame(maxWidth: .infinity)
        .padding(.horizontal, 18)
        .padding(.vertical, 9)
        .background(.bar)
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

                ShareEncodingSelector(selection: $model.encoding)
                    .onChange(of: model.encoding) { _, _ in model.invalidateSplitResult() }

                VStack(alignment: .leading, spacing: 6) {
                    Text("Passphrase")
                        .font(.subheadline.weight(.medium))
                    SecureField("", text: $model.splitPassphrase)
                        .textFieldStyle(.roundedBorder)
                        .frame(maxWidth: .infinity)
                        .accessibilityLabel("Passphrase")
                        .onChange(of: model.splitPassphrase) { _, _ in model.invalidateSplitResult() }
                }
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

                    HStack(spacing: 10) {
                        Text("Filename prefix")
                            .font(.subheadline)
                            .foregroundStyle(.secondary)
                        TextField("Optional", text: $model.exportPrefix)
                            .textFieldStyle(.roundedBorder)
                            .frame(width: 200)
                            .accessibilityLabel("Export filename prefix")
                        Spacer()
                        Button("Export All…", systemImage: "folder.badge.plus") {
                            model.exportAllShares()
                        }
                    }
                }
            }
        }
        .formStyle(.grouped)
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
                HStack(spacing: 2) {
                    Button {
                        model.copy(share.text)
                    } label: {
                        Image(systemName: "doc.on.doc")
                            .frame(width: 24, height: 22)
                    }
                    .buttonStyle(.borderless)
                    .accessibilityLabel("Copy share \(share.index)")
                    .help("Copy share")

                    Button {
                        model.saveShare(share)
                    } label: {
                        Image(systemName: "arrow.down.to.line")
                            .frame(width: 24, height: 22)
                    }
                    .buttonStyle(.borderless)
                    .accessibilityLabel("Save share \(share.index)")
                    .help("Save share…")
                }
                .controlSize(.small)
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

    private var encodingBinding: Binding<ShareEncoding> {
        Binding(
            get: { model.recoveryEncoding },
            set: { model.setRecoveryEncoding($0) }
        )
    }

    private func shareBinding(at index: Int) -> Binding<String> {
        Binding(
            get: { model.recoveryShareInputs[index] },
            set: { model.updateRecoveryShare(at: index, with: $0) }
        )
    }

    var body: some View {
        Form {
            PageHeader(
                title: "Recover a secret",
                subtitle: "Add enough recovery shares from the same set."
            )

            Section {
                ForEach(model.recoveryShareInputs.indices, id: \.self) { index in
                    VStack(alignment: .leading, spacing: 6) {
                        HStack(spacing: 8) {
                            Text("Share \(index + 1)")
                                .font(.subheadline.weight(.medium))
                            if index < model.minimumRecoveryShareCount {
                                Text("Required")
                                    .font(.caption)
                                    .foregroundStyle(.secondary)
                            }
                            Spacer()

                            Button {
                                model.pasteRecoveryShare(at: index)
                            } label: {
                                Image(systemName: "doc.on.clipboard")
                                    .frame(width: 22, height: 20)
                            }
                            .buttonStyle(.borderless)
                            .accessibilityLabel("Paste share \(index + 1)")
                            .help("Paste")

                            Button {
                                model.clearRecoveryShare(at: index)
                            } label: {
                                Image(systemName: "xmark.circle.fill")
                                    .frame(width: 22, height: 20)
                            }
                            .buttonStyle(.borderless)
                            .foregroundStyle(.secondary)
                            .disabled(model.recoveryShareInputs[index].isEmpty)
                            .accessibilityLabel("Clear share \(index + 1)")
                            .help("Clear")
                        }
                        .controlSize(.small)

                        TextEditor(text: shareBinding(at: index))
                            .font(.caption.monospaced())
                            .frame(minHeight: 72, maxHeight: 112)
                            .accessibilityLabel("Recovery share \(index + 1)")
                    }
                    .padding(.vertical, 2)
                }

                HStack {
                    Button("Paste Shares", systemImage: "doc.on.clipboard", action: model.pasteShares)
                    Button("Import Files…", systemImage: "doc.on.doc") {
                        model.chooseShareFiles()
                    }
                    Spacer()
                    Button("Add Share", systemImage: "plus") {
                        model.addRecoveryShareInput()
                    }
                    .buttonStyle(.borderless)
                }
            } header: {
                HStack {
                    Text("Recovery shares")
                    Spacer()
                    if model.inspection?.ready == true {
                        Label("Ready", systemImage: "checkmark.circle.fill")
                            .font(.caption.weight(.medium))
                            .foregroundStyle(.green)
                            .padding(.horizontal, 8)
                            .padding(.vertical, 3)
                            .background(Capsule().fill(Color.green.opacity(0.10)))
                            .accessibilityLabel("Shares are ready to recover")
                    } else {
                        Text("At least \(model.minimumRecoveryShareCount)")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }
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

            Section("Recovery options") {
                ShareEncodingSelector(selection: encodingBinding)

                VStack(alignment: .leading, spacing: 6) {
                    Text("Passphrase")
                        .font(.subheadline.weight(.medium))
                    SecureField("", text: $model.recoveryPassphrase)
                        .textFieldStyle(.roundedBorder)
                        .frame(maxWidth: .infinity)
                        .accessibilityLabel("Passphrase")
                        .disabled(!model.recoveryPassphraseEnabled)
                        .onChange(of: model.recoveryPassphrase) { _, _ in model.invalidateRecoveryResult() }
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

            if let inspection = model.inspection {
                Section("Share summary") {
                    LabeledContent("Detected format", value: inspection.detectedEncoding.friendlyName)
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
                }
            }
        }
        .formStyle(.grouped)
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

struct ShareEncodingSelector: View {
    @Binding var selection: ShareEncoding

    private let columns = [
        GridItem(.flexible(), spacing: 8),
        GridItem(.flexible(), spacing: 8),
    ]

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Share format")
                .font(.subheadline.weight(.medium))

            LazyVGrid(columns: columns, spacing: 8) {
                ForEach(Array(ShareEncoding.friendlyChoices.enumerated()), id: \.offset) { _, encoding in
                    let selected = selection == encoding
                    Button {
                        selection = encoding
                    } label: {
                        HStack(spacing: 10) {
                            Image(systemName: encoding.symbolName)
                                .font(.title3)
                                .foregroundStyle(selected ? Color.accentColor : .secondary)
                                .frame(width: 24)

                            VStack(alignment: .leading, spacing: 2) {
                                Text(encoding.friendlyName)
                                    .font(.subheadline.weight(.medium))
                                    .foregroundStyle(.primary)
                                Text(encoding.friendlyDescription)
                                    .font(.caption)
                                    .foregroundStyle(.secondary)
                                    .lineLimit(2)
                            }

                            Spacer(minLength: 4)

                            if selected {
                                Image(systemName: "checkmark.circle.fill")
                                    .foregroundStyle(Color.accentColor)
                            }
                        }
                        .padding(.horizontal, 11)
                        .padding(.vertical, 9)
                        .frame(maxWidth: .infinity, minHeight: 58, alignment: .leading)
                        .contentShape(.rect)
                    }
                    .buttonStyle(.plain)
                    .background(
                        RoundedRectangle(cornerRadius: 9, style: .continuous)
                            .fill(selected ? Color.accentColor.opacity(0.11) : Color.secondary.opacity(0.06))
                    )
                    .overlay {
                        RoundedRectangle(cornerRadius: 9, style: .continuous)
                            .stroke(selected ? Color.accentColor.opacity(0.65) : Color.secondary.opacity(0.18))
                    }
                    .accessibilityLabel("\(encoding.friendlyName), \(encoding.friendlyDescription)")
                    .accessibilityValue(selected ? "Selected" : "")
                }
            }
        }
    }
}

extension ShareEncoding {
    static let friendlyChoices: [ShareEncoding] = [
        .mnemoWords,
        .base64url,
        .base58check,
        .mnemoBip39,
    ]

    var friendlyName: String {
        switch self {
        case .auto: "Automatic"
        case .base64url: "Letters"
        case .base58check: "Checked letters"
        case .mnemoWords: "Words"
        case .mnemoBip39: "BIP-39 words"
        }
    }

    var friendlyDescription: String {
        switch self {
        case .auto: "Detect the format"
        case .base64url: "Compact alphanumeric text"
        case .base58check: "Compact text with typo detection"
        case .mnemoWords: "Easy-to-write mnemonic words"
        case .mnemoBip39: "Familiar BIP-39 vocabulary"
        }
    }

    var symbolName: String {
        switch self {
        case .auto: "wand.and.stars"
        case .base64url: "textformat.abc"
        case .base58check: "checkmark.seal"
        case .mnemoWords: "text.book.closed"
        case .mnemoBip39: "list.bullet.rectangle"
        }
    }
}
