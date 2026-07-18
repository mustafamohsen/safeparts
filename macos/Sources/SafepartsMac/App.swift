import AppKit
import SafepartsKit
import SwiftUI

@main struct SafepartsApp: App {
 @StateObject private var model = AppModel()
 var body: some Scene { WindowGroup { ContentView().environmentObject(model).frame(minWidth: 850, minHeight: 620) }
  .commands { CommandGroup(replacing: .newItem) { Button("Clear") { model.clear() }.keyboardShortcut("n") }; CommandMenu("Tasks") { Button("Split") { model.task = .split }.keyboardShortcut("1"); Button("Recover") { model.task = .recover }.keyboardShortcut("2") } }
 }
}

struct ContentView: View {
 @EnvironmentObject var model: AppModel
 var body: some View { NavigationSplitView { List(Task.allCases, selection: $model.task) { Label($0.rawValue, systemImage: $0 == .split ? "square.split.2x1" : "arrow.triangle.2.circlepath").tag($0) }.navigationTitle("Safeparts") } detail: { Group { model.task == .split ? AnyView(SplitView()) : AnyView(RecoverView()) }.toolbar { ToolbarItem { Label("Local only", systemImage: "lock.shield") }; ToolbarItem { Button("Clear", systemImage: "trash", action: model.clear) } } } }
}
struct SplitView: View {
 @EnvironmentObject var model: AppModel
 var body: some View { Form { Section { Text("Split a secret").font(.title); Text("Create recovery shares without sending data anywhere.").foregroundStyle(.secondary) }
  GroupBox("Secret") { VStack(alignment: .leading) { TextEditor(text: $model.secretText).font(.body.monospaced()).frame(minHeight: 100); HStack { Button("Paste") { model.secretText = NSPasteboard.general.string(forType: .string) ?? "" }; Button("Import File") { importSecret() } } } }
  GroupBox("Options") { Grid(alignment: .leading) { GridRow { Text("Threshold"); Stepper("\(model.threshold)", value: $model.threshold, in: 1...255) }; GridRow { Text("Share count"); Stepper("\(model.shareCount)", value: $model.shareCount, in: 1...255) }; GridRow { Text("Encoding"); Picker("Encoding", selection: $model.encoding) { Text("Base64url").tag(ShareEncoding.base64url); Text("Base58Check").tag(ShareEncoding.base58check); Text("Mnemonic words").tag(ShareEncoding.mnemoWords); Text("BIP-39 mnemonic").tag(ShareEncoding.mnemoBip39) }.labelsHidden() }; GridRow { Text("Passphrase"); SecureField("Optional", text: $model.passphrase) } } }
  Button("Split", action: { model.split() }).buttonStyle(.borderedProminent).keyboardShortcut(.return); Text(model.status).foregroundStyle(.secondary)
  if !model.shares.isEmpty { GroupBox("Recovery shares") { VStack { ForEach(model.shares, id: \.index) { share in HStack(alignment: .top) { Text("\(share.index)").monospacedDigit(); Text(share.text).font(.caption.monospaced()).textSelection(.enabled); Spacer(); Button("Copy") { model.copy(share.text) }; Button("Save") { save(Data(share.text.utf8), name: AppModel.fileName(share)) } }; Divider() }; Button("Export All") { exportAll() } } } }
 }.formStyle(.grouped).navigationTitle("Split") }
 func importSecret() { let p=NSOpenPanel(); p.allowsMultipleSelection=false; if p.runModal() == .OK, let u=p.url, let d=try? Data(contentsOf:u) { model.split(d) } }
 func save(_ data: Data, name: String) { let p=NSSavePanel(); p.nameFieldStringValue=name; if p.runModal() == .OK, let u=p.url { try? data.write(to:u, options:.atomic) } }
 func exportAll() { let p=NSOpenPanel(); p.canChooseDirectories=true; p.canChooseFiles=false; if p.runModal() == .OK, let dir=p.url { for s in model.shares { try? Data(s.text.utf8).write(to:dir.appendingPathComponent(AppModel.fileName(s)),options:.atomic) } } }
}
struct RecoverView: View {
 @EnvironmentObject var model: AppModel
 var body: some View { Form { Section { Text("Recover a secret").font(.title); Text("Add enough recovery shares from the same set.").foregroundStyle(.secondary) }; GroupBox("Recovery shares") { VStack { TextEditor(text:$model.shareInput).font(.body.monospaced()).frame(minHeight:180); HStack { Button("Paste",action:model.pasteShares); Button("Import Files",action:importFiles) } } }; Picker("Encoding",selection:$model.recoveryEncoding) { Text("Auto").tag(ShareEncoding.auto); Text("Base64url").tag(ShareEncoding.base64url); Text("Base58Check").tag(ShareEncoding.base58check); Text("Mnemonic words").tag(ShareEncoding.mnemoWords); Text("BIP-39 mnemonic").tag(ShareEncoding.mnemoBip39) }; SecureField("Optional passphrase",text:$model.passphrase); Button("Recover",action:model.recover).buttonStyle(.borderedProminent).keyboardShortcut(.return); Text(model.status).foregroundStyle(.secondary); if let r=model.recovery { GroupBox("Recovered secret") { VStack(alignment:.leading) { if let text=model.recoveredText { Text(text).font(.body.monospaced()).textSelection(.enabled); Button("Copy") { model.copy(text) } } else { Label("Binary data (\(r.bytes.count) bytes)",systemImage:"doc") }; Button("Save…") { save(Data(r.bytes)) } } } } }.formStyle(.grouped).navigationTitle("Recover") }
 func importFiles() { let p=NSOpenPanel(); p.allowsMultipleSelection=true; if p.runModal() == .OK { model.shareInput=p.urls.compactMap { try? String(contentsOf:$0,encoding:.utf8) }.joined(separator:"\n\n") } }
 func save(_ data:Data) { let p=NSSavePanel(); p.nameFieldStringValue="recovered-secret"; if p.runModal() == .OK, let u=p.url { try? data.write(to:u,options:.atomic) } }
}
