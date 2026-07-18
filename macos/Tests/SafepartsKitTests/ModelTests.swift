import Foundation
import Testing
@testable import SafepartsKit

@MainActor
private func waitUntil(_ condition: @MainActor () -> Bool) async -> Bool {
    for _ in 0 ..< 100 {
        if condition() { return true }
        try? await Task.sleep(for: .milliseconds(100))
    }
    return condition()
}

@MainActor
@Test
func thresholdClampingAndTaskScopedClear() async {
    let model = AppModel()
    model.threshold = 9
    model.shareCount = 3
    model.normalizeThreshold()
    #expect(model.threshold == 3)

    model.secretText = "sensitive"
    model.updateShareInput("share")
    model.splitPassphrase = "split pass"
    model.exportPrefix = "project"
    model.recoveryPassphrase = "recover pass"
    model.task = .split
    model.clearCurrentTask()

    #expect(model.secretText.isEmpty)
    #expect(model.splitPassphrase.isEmpty)
    #expect(model.exportPrefix.isEmpty)
    #expect(model.shareInput == "share")
    #expect(model.recoveryPassphrase == "recover pass")

    model.clear()
    #expect(model.shareInput.isEmpty)
    #expect(model.recoveryShareInputs == ["", ""])
    #expect(model.recoveryPassphrase.isEmpty)
}

@MainActor
@Test
func individualRecoveryShareCanBeCleared() {
    let model = AppModel()
    model.updateShareInput("first\n\nsecond")
    model.clearRecoveryShare(at: 0)

    #expect(model.recoveryShareInputs == ["", "second"])
    #expect(model.shareInput == "second")
}

@MainActor
@Test
func recoveryInputsFollowMetadataAndEnablePassphrase() async throws {
    let model = AppModel()
    #expect(model.encoding == .mnemoWords)
    #expect(model.recoveryEncoding == .mnemoWords)
    #expect(model.recoveryShareInputs == ["", ""])
    #expect(!model.recoveryPassphraseEnabled)

    let shares = try splitSecret(
        secret: Data("protected".utf8),
        threshold: 4,
        shareCount: 5,
        selected: .base58check,
        passphrase: "correct"
    )
    model.updateShareInput(shares[0].text)
    #expect(await waitUntil { model.inspection?.threshold == 4 })

    #expect(model.inspection?.threshold == 4)
    #expect(model.recoveryShareInputs.count == 4)
    #expect(model.recoveryEncoding == .base58check)
    #expect(model.recoveryPassphraseEnabled)

    model.setRecoveryEncoding(.mnemoBip39)
    #expect(model.recoveryEncoding == .mnemoBip39)

    model.updateShareInput(shares.prefix(4).map(\.text).joined(separator: "\n\n"))
    #expect(await waitUntil { model.inspection?.ready == true })
    #expect(model.inspection?.ready == true)
    #expect(model.recoveryEncoding == .mnemoBip39)
    #expect(!model.canRecover)

    model.setRecoveryEncoding(.base58check)
    model.recoveryPassphrase = "correct"
    #expect(model.canRecover)
    await model.recover()
    #expect(model.recoveredText == "protected")

    let plainShares = try splitSecret(
        secret: Data("plain".utf8),
        threshold: 2,
        shareCount: 3,
        selected: .mnemoWords,
        passphrase: nil
    )
    model.updateShareInput(plainShares[0].text)
    #expect(await waitUntil { model.inspection?.detectedEncoding == .mnemoWords })
    #expect(!model.recoveryPassphraseEnabled)
    #expect(model.recoveryPassphrase.isEmpty)
}

@MainActor
@Test
func staleShareInspectionCannotPublishAfterManualSelectionOrClear() async throws {
    let model = AppModel()
    let shares = try splitSecret(
        secret: Data("metadata".utf8),
        threshold: 4,
        shareCount: 5,
        selected: .base58check,
        passphrase: "pass"
    )

    model.updateShareInput(shares[0].text)
    model.setRecoveryEncoding(.mnemoWords)
    #expect(await waitUntil { model.inspection?.threshold == 4 })
    #expect(model.inspection?.threshold == 4)
    #expect(model.recoveryEncoding == .mnemoWords)

    model.updateShareInput(shares[0].text)
    model.clearRecovery()
    try await Task.sleep(for: .milliseconds(400))
    #expect(model.inspection == nil)
    #expect(model.recoveryShareInputs == ["", ""])
    #expect(!model.recoveryPassphraseEnabled)
}

@MainActor
@Test
func textAndBinaryPresentationUseTheRealBridge() async {
    let model = AppModel()
    model.secretText = "hello"
    await model.split()
    #expect(model.shares.count == 3)

    model.updateShareInput(model.shares.prefix(2).map(\.text).joined(separator: "\n\n"))
    await model.recover()
    #expect(model.recoveredText == "hello")

    await model.split(Data([0xff, 0xfe]))
    model.updateShareInput(model.shares.prefix(2).map(\.text).joined(separator: "\n\n"))
    await model.recover()
    #expect(model.recoveredText == nil)
    #expect(model.recovery?.bytes == Data([0xff, 0xfe]))
}

@MainActor
@Test
func failedSplitClearsStaleSharesAndShowsSafeCopy() async {
    let model = AppModel()
    model.secretText = "first secret"
    await model.split()
    #expect(!model.shares.isEmpty)

    model.encoding = .auto
    await model.split()
    #expect(model.shares.isEmpty)
    #expect(model.splitStatus?.kind == .failure)
    #expect(model.splitStatus?.message == "Choose a concrete share encoding before splitting.")
}

@Test
func bridgeEncodingsPassphraseAndTypedErrors() throws {
    for encoding in [
        ShareEncoding.base64url,
        .base58check,
        .mnemoWords,
        .mnemoBip39,
    ] {
        let shares = try splitSecret(
            secret: Data([0, 255, 3]),
            threshold: 2,
            shareCount: 3,
            selected: encoding,
            passphrase: "correct"
        )
        let input = shares.prefix(2).map(\.text).joined(separator: "\n\n")
        #expect {
            try combineShareInput(input: input, selected: .auto, passphrase: nil)
        } throws: { error in
            error as? BridgeError == .PassphraseRequired
        }
        #expect {
            try combineShareInput(input: input, selected: .auto, passphrase: "wrong")
        } throws: { error in
            error as? BridgeError == .IncorrectPassphrase
        }
        let recovered = try combineShareInput(input: input, selected: .auto, passphrase: "correct")
        #expect(recovered.bytes == Data([0, 255, 3]))
    }

    #expect {
        try combineShareInput(input: "malformed", selected: .auto, passphrase: nil)
    } throws: { error in
        error as? BridgeError == .MalformedShares
    }

    #expect(AppModel.message(for: BridgeError.InsufficientShares) == "More recovery shares are required.")
    #expect(!AppModel.message(for: BridgeError.MixedShares).contains("share text"))
}

@Test
func shareFileImportIsAllOrNothingAndWritesReportFailures() throws {
    let directory = FileManager.default.temporaryDirectory
        .appendingPathComponent(UUID().uuidString, isDirectory: true)
    try FileManager.default.createDirectory(at: directory, withIntermediateDirectories: true)
    defer { try? FileManager.default.removeItem(at: directory) }

    let valid = directory.appendingPathComponent("valid.txt")
    let invalid = directory.appendingPathComponent("invalid.txt")
    try Data("synthetic-share".utf8).write(to: valid)
    try Data([0xff, 0xfe]).write(to: invalid)

    #expect {
        try FileOperations.readShares(at: [valid, invalid])
    } throws: { error in
        error as? FileOperationError == .nonUTF8Share("invalid.txt")
    }

    let missingParent = directory.appendingPathComponent("missing/output.txt")
    #expect {
        try FileOperations.write(Data("value".utf8), to: missingParent)
    } throws: { error in
        error as? FileOperationError == .writeFailed("output.txt")
    }
}

@Test
func fileNaming() {
    let share = EncodedShare(text: "x", index: 2, shareCount: 3, setId: "abc")
    #expect(AppModel.fileName(share) == "safeparts-abc-share-2-of-3.txt")
    #expect(
        AppModel.exportFileName(share, prefix: "Project Alpha")
            == "Project Alpha-safeparts-abc-share-2-of-3.txt"
    )
    #expect(
        AppModel.exportFileName(share, prefix: " client:/backup ")
            == "client-backup-safeparts-abc-share-2-of-3.txt"
    )
    let unicodeName = AppModel.exportFileName(
        share,
        prefix: String(repeating: "🔐", count: 100)
    )
    #expect(unicodeName.utf8.count <= 255)
    #expect(unicodeName.hasSuffix("-safeparts-abc-share-2-of-3.txt"))
}
