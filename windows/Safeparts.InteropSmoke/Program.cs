using System.Reflection;
using System.Runtime.InteropServices;
using Safeparts.Native;

internal static class Program
{
    private const string NativeLibraryName = "safeparts_uniffi";
    private static readonly byte[] BinarySecret = [0, 255, 3, 128];

    private static int Main()
    {
        try
        {
            NativeLibrary.SetDllImportResolver(typeof(Program).Assembly, ResolveNativeLibrary);
            VerifyNativeContract();
            Console.WriteLine("Safeparts C# interoperability smoke passed.");
            return 0;
        }
        catch (Exception error)
        {
            Console.Error.WriteLine($"Safeparts C# interoperability smoke failed: {error.GetType().Name}");
            return 1;
        }
    }

    private static IntPtr ResolveNativeLibrary(
        string libraryName,
        Assembly assembly,
        DllImportSearchPath? searchPath)
    {
        if (!string.Equals(libraryName, NativeLibraryName, StringComparison.Ordinal))
        {
            return IntPtr.Zero;
        }

        string? nativeDirectory = Environment.GetEnvironmentVariable("SAFEPARTS_NATIVE_DIR");
        if (string.IsNullOrWhiteSpace(nativeDirectory))
        {
            throw new InvalidOperationException("SAFEPARTS_NATIVE_DIR is required.");
        }

        string libraryFileName = OperatingSystem.IsWindows()
            ? "safeparts_uniffi.dll"
            : OperatingSystem.IsMacOS()
                ? "libsafeparts_uniffi.dylib"
                : "libsafeparts_uniffi.so";
        string libraryPath = Path.Combine(nativeDirectory, libraryFileName);
        if (!File.Exists(libraryPath))
        {
            throw new FileNotFoundException("The Safeparts native library was not found.");
        }

        return NativeLibrary.Load(libraryPath, assembly, searchPath);
    }

    private static void VerifyNativeContract()
    {
        ShareEncoding[] encodings =
        [
            ShareEncoding.Base64url,
            ShareEncoding.Base58check,
            ShareEncoding.MnemoWords,
            ShareEncoding.MnemoBip39,
        ];

        foreach (ShareEncoding encoding in encodings)
        {
            VerifyPlainRoundTrip(encoding);
            VerifyProtectedRoundTrip(encoding);
        }

        for (int repetition = 0; repetition < 16; repetition++)
        {
            VerifyPlainRoundTrip(encodings[repetition % encodings.Length]);
        }

        VerifyTypedFailures();
    }

    private static void VerifyPlainRoundTrip(ShareEncoding encoding)
    {
        EncodedShare[] shares = SafepartsNative.SplitSecret(BinarySecret, 2, 3, encoding, null);
        Require(shares.Length == 3, "Split should return the requested Share count.");
        Require(shares.Select(share => share.Index).Distinct().Count() == 3, "Share indexes should be unique.");
        Require(shares.All(share => share.ShareCount == 3), "Recovery shares should report their Share count.");
        Require(shares.Select(share => share.SetId).Distinct().Count() == 1, "Recovery shares should report one set ID.");

        string input = Join(shares, 2);
        Inspection inspection = SafepartsNative.InspectShareInput(input, ShareEncoding.Auto);
        Require(inspection.DetectedEncoding == encoding, "Auto encoding should report the concrete Share encoding.");
        Require(inspection.Threshold == 2, "Inspection should report the Threshold.");
        Require(inspection.ShareCount == 3, "Inspection should report the Share count.");
        Require(inspection.ProvidedCount == 2, "Inspection should report the provided Recovery shares.");
        Require(inspection.Consistent && inspection.Ready, "Two consistent Recovery shares should be ready.");
        Require(!inspection.Encrypted, "Plain Recovery shares should not report Passphrase protection.");

        Recovery recovery = SafepartsNative.CombineShareInput(input, ShareEncoding.Auto, null);
        Require(recovery.Bytes.SequenceEqual(BinarySecret), "Recovery should preserve arbitrary bytes.");
        Require(recovery.DetectedEncoding == encoding, "Recovery should report the concrete Share encoding.");
    }

    private static void VerifyProtectedRoundTrip(ShareEncoding encoding)
    {
        const string correctPassphrase = "correct-synthetic-passphrase";
        EncodedShare[] shares = SafepartsNative.SplitSecret(
            BinarySecret,
            2,
            3,
            encoding,
            correctPassphrase);
        string input = Join(shares, 2);

        Inspection inspection = SafepartsNative.InspectShareInput(input, ShareEncoding.Auto);
        Require(inspection.Encrypted, "Protected Recovery shares should report Passphrase protection.");
        ExpectThrows<BridgeException.PassphraseRequired>(
            () => SafepartsNative.CombineShareInput(input, ShareEncoding.Auto, null));
        ExpectThrows<BridgeException.IncorrectPassphrase>(
            () => SafepartsNative.CombineShareInput(
                input,
                ShareEncoding.Auto,
                "PASSPHRASE-SENTINEL"),
            "PASSPHRASE-SENTINEL");

        Recovery recovery = SafepartsNative.CombineShareInput(
            input,
            ShareEncoding.Auto,
            correctPassphrase);
        Require(recovery.Bytes.SequenceEqual(BinarySecret), "Protected recovery should preserve arbitrary bytes.");
    }

    private static void VerifyTypedFailures()
    {
        ExpectThrows<BridgeException.InvalidEncoding>(
            () => SafepartsNative.SplitSecret(BinarySecret, 2, 3, ShareEncoding.Auto, null));
        ExpectThrows<BridgeException.EmptyInput>(
            () => SafepartsNative.InspectShareInput(string.Empty, ShareEncoding.Auto));
        ExpectThrows<BridgeException.MalformedShares>(
            () => SafepartsNative.InspectShareInput("RECOVERY-SHARE-SENTINEL", ShareEncoding.Auto),
            "RECOVERY-SHARE-SENTINEL");

        EncodedShare[] firstSet = SafepartsNative.SplitSecret(
            BinarySecret,
            2,
            3,
            ShareEncoding.Base64url,
            null);
        ExpectThrows<BridgeException.InsufficientShares>(
            () => SafepartsNative.CombineShareInput(firstSet[0].Text, ShareEncoding.Auto, null));
        ExpectThrows<BridgeException.DuplicateShares>(
            () => SafepartsNative.CombineShareInput(
                $"{firstSet[0].Text}\n\n{firstSet[0].Text}",
                ShareEncoding.Auto,
                null),
            firstSet[0].Text);

        EncodedShare[] secondSet = SafepartsNative.SplitSecret(
            [9, 8, 7],
            2,
            3,
            ShareEncoding.Base64url,
            null);
        ExpectThrows<BridgeException.MixedShares>(
            () => SafepartsNative.CombineShareInput(
                $"{firstSet[0].Text}\n\n{secondSet[0].Text}",
                ShareEncoding.Auto,
                null));
    }

    private static string Join(IEnumerable<EncodedShare> shares, int count) =>
        string.Join("\n\n", shares.Take(count).Select(share => share.Text));

    private static void ExpectThrows<TException>(Action action, string? sensitiveSentinel = null)
        where TException : Exception
    {
        try
        {
            action();
        }
        catch (TException error)
        {
            if (sensitiveSentinel is not null)
            {
                Require(
                    !error.ToString().Contains(sensitiveSentinel, StringComparison.Ordinal),
                    "A native error exposed sensitive input.");
            }
            return;
        }

        throw new InvalidOperationException($"Expected {typeof(TException).Name}.");
    }

    private static void Require(bool condition, string message)
    {
        if (!condition)
        {
            throw new InvalidOperationException(message);
        }
    }
}
