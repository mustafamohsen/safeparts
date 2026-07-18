import AppKit
import Foundation

public enum Task: String, CaseIterable, Identifiable { case split = "Split"; case recover = "Recover"; public var id: Self { self } }

@MainActor public final class AppModel: ObservableObject {
 @Published public var task: Task = .split
 @Published public var secretText = ""; @Published public var shareInput = ""; @Published public var passphrase = ""
 @Published public var threshold = 2; @Published public var shareCount = 3
 @Published public var encoding: ShareEncoding = .base64url; @Published public var recoveryEncoding: ShareEncoding = .auto
 @Published public var shares: [EncodedShare] = []; @Published public var recovery: Recovery?; @Published public var status = ""
 public init() {}
 public func normalizeThreshold() { shareCount = min(255, max(1, shareCount)); threshold = min(shareCount, max(1, threshold)) }
 public func clear() { secretText = ""; shareInput = ""; passphrase = ""; shares = []; recovery = nil; status = "" }
 public var recoveredText: String? { recovery.flatMap { String(data: $0.bytes, encoding: .utf8) } }
 public func split(_ bytes: Data? = nil) { do { normalizeThreshold(); shares = try splitSecret(secret: bytes ?? Data(secretText.utf8), threshold: UInt8(threshold), shareCount: UInt8(shareCount), selected: encoding, passphrase: passphrase.isEmpty ? nil : passphrase); status = "Created \(shares.count) recovery shares." } catch { status = error.localizedDescription } }
 public func recover() { do { recovery = try combineShareInput(input: shareInput, selected: recoveryEncoding, passphrase: passphrase.isEmpty ? nil : passphrase); status = "Secret recovered." } catch { recovery = nil; status = error.localizedDescription } }
 public static func fileName(_ share: EncodedShare) -> String { "safeparts-\(share.setId)-share-\(share.index)-of-\(share.shareCount).txt" }
 public func copy(_ text: String) { NSPasteboard.general.clearContents(); NSPasteboard.general.setString(text, forType: .string); status = "Copied. Other apps can read clipboard contents." }
 public func pasteShares() { shareInput = NSPasteboard.general.string(forType: .string) ?? "" }
}
