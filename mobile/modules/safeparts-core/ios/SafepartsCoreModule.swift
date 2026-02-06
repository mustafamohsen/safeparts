import ExpoModulesCore

// UniFFI-generated Swift bindings live in ./uniffi/

public final class SafepartsCoreModule: Module {
  public func definition() -> ModuleDefinition {
    Name("SafepartsCore")

    Function("supportedEncodings") { () -> [String] in
      supportedEncodings()
    }

    Function("getVersion") { () -> String in
      getVersion()
    }

    AsyncFunction("splitSecret") { (secretB64: String, k: Int, n: Int, encoding: String, passphrase: String?) -> [String] in
      let k8 = UInt8(clamping: k)
      let n8 = UInt8(clamping: n)
      return try splitSecret(secretB64: secretB64, k: k8, n: n8, encoding: encoding, passphrase: passphrase)
    }

    AsyncFunction("combineShares") { (shares: [String], encoding: String, passphrase: String?) -> String in
      return try combineShares(shares: shares, encoding: encoding, passphrase: passphrase)
    }
  }
}
