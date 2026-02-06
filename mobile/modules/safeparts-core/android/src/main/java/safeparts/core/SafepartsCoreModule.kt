package safeparts.core

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import uniffi.safeparts_mobile_bridge.SafepartsException
import uniffi.safeparts_mobile_bridge.combineShares
import uniffi.safeparts_mobile_bridge.getVersion
import uniffi.safeparts_mobile_bridge.splitSecret
import uniffi.safeparts_mobile_bridge.supportedEncodings

class SafepartsCoreModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("SafepartsCore")

    Function("supportedEncodings") {
      return@Function supportedEncodings()
    }

    Function("getVersion") {
      return@Function getVersion()
    }

    AsyncFunction("splitSecret") { secretB64: String, k: Int, n: Int, encoding: String, passphrase: String? ->
      try {
        splitSecret(secretB64, k.toUByte(), n.toUByte(), encoding, passphrase)
      } catch (e: SafepartsException) {
        throw Exception(e.message)
      }
    }

    AsyncFunction("combineShares") { shares: List<String>, encoding: String, passphrase: String? ->
      try {
        combineShares(shares, encoding, passphrase)
      } catch (e: SafepartsException) {
        throw Exception(e.message)
      }
    }
  }
}
