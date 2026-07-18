// swift-tools-version: 6.0
import PackageDescription
let package = Package(name: "SafepartsMac", platforms: [.macOS(.v14)], products: [.executable(name: "SafepartsMac", targets: ["SafepartsMac"])], targets: [
 .systemLibrary(name: "safeparts_swiftFFI", path: "Generated"),
 .target(name: "SafepartsKit", dependencies: ["safeparts_swiftFFI"], path: "Sources/SafepartsKit", linkerSettings: [.unsafeFlags(["-L", "Native"]), .linkedLibrary("safeparts_swift")]),
 .executableTarget(name: "SafepartsMac", dependencies: ["SafepartsKit"], path: "Sources/SafepartsMac", resources: [.process("Resources")]),
 .testTarget(name: "SafepartsKitTests", dependencies: ["SafepartsKit"], path: "Tests/SafepartsKitTests")
])
