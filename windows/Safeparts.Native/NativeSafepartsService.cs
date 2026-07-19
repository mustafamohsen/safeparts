using System.Reflection;
using System.Runtime.InteropServices;
using Model = Safeparts.AppModel;
using Native = Safeparts.Native;

namespace Safeparts.NativeHost;

public sealed class NativeSafepartsService : Model.ISafepartsService
{
    private static int _initialized;
    public NativeSafepartsService() => InitializeResolver();

    public Task<IReadOnlyList<Model.EncodedShare>> SplitAsync(byte[] secret, byte threshold, byte shareCount, Model.ShareEncoding encoding, string? passphrase) =>
        Task.Run<IReadOnlyList<Model.EncodedShare>>(() =>
        {
            try { return Native.SafepartsNative.SplitSecret(secret, threshold, shareCount, ToNative(encoding), passphrase).Select(share => new Model.EncodedShare(share.Text, share.Index, share.ShareCount, share.SetId)).ToArray(); }
            catch (Native.BridgeException error) { throw Map(error); }
        });

    public Task<Model.Inspection> InspectAsync(string input, Model.ShareEncoding encoding) => Task.Run(() =>
    {
        try { Native.Inspection value = Native.SafepartsNative.InspectShareInput(input, ToNative(encoding)); return new Model.Inspection(ToModel(value.DetectedEncoding), value.Threshold, value.ShareCount, value.ProvidedCount, value.Encrypted, value.Indexes, value.Consistent, value.Ready); }
        catch (Native.BridgeException error) { throw Map(error); }
    });

    public Task<Model.Recovery> RecoverAsync(string input, Model.ShareEncoding encoding, string? passphrase) => Task.Run(() =>
    {
        try { Native.Recovery value = Native.SafepartsNative.CombineShareInput(input, ToNative(encoding), passphrase); return new Model.Recovery(value.Bytes, ToModel(value.DetectedEncoding), value.Threshold, value.ShareCount, value.Encrypted, value.Indexes, value.SetId); }
        catch (Native.BridgeException error) { throw Map(error); }
    });

    private static void InitializeResolver()
    {
        if (Interlocked.Exchange(ref _initialized, 1) != 0) return;
        NativeLibrary.SetDllImportResolver(typeof(Native.SafepartsNative).Assembly, Resolve);
    }

    private static IntPtr Resolve(string name, Assembly assembly, DllImportSearchPath? searchPath)
    {
        if (name != "safeparts_uniffi") return IntPtr.Zero;
        string? directory = Environment.GetEnvironmentVariable("SAFEPARTS_NATIVE_DIR");
        string path = Path.Combine(string.IsNullOrWhiteSpace(directory) ? AppContext.BaseDirectory : directory, OperatingSystem.IsWindows() ? "safeparts_uniffi.dll" : OperatingSystem.IsMacOS() ? "libsafeparts_uniffi.dylib" : "libsafeparts_uniffi.so");
        return NativeLibrary.Load(path, assembly, searchPath);
    }

    private static Model.SafepartsException Map(Native.BridgeException error) => new(error switch
    {
        Native.BridgeException.InvalidParameters => Model.SafepartsFailure.InvalidParameters,
        Native.BridgeException.InvalidEncoding => Model.SafepartsFailure.InvalidEncoding,
        Native.BridgeException.EmptyInput => Model.SafepartsFailure.EmptyInput,
        Native.BridgeException.MalformedShares => Model.SafepartsFailure.MalformedShares,
        Native.BridgeException.InsufficientShares => Model.SafepartsFailure.InsufficientShares,
        Native.BridgeException.DuplicateShares => Model.SafepartsFailure.DuplicateShares,
        Native.BridgeException.MixedShares => Model.SafepartsFailure.MixedShares,
        Native.BridgeException.PassphraseRequired => Model.SafepartsFailure.PassphraseRequired,
        Native.BridgeException.IncorrectPassphrase => Model.SafepartsFailure.IncorrectPassphrase,
        Native.BridgeException.IntegrityFailure => Model.SafepartsFailure.IntegrityFailure,
        _ => Model.SafepartsFailure.Internal
    });

    private static Native.ShareEncoding ToNative(Model.ShareEncoding value) => value switch
    {
        Model.ShareEncoding.Auto => Native.ShareEncoding.Auto,
        Model.ShareEncoding.Base64url => Native.ShareEncoding.Base64url,
        Model.ShareEncoding.Base58check => Native.ShareEncoding.Base58check,
        Model.ShareEncoding.MnemoWords => Native.ShareEncoding.MnemoWords,
        Model.ShareEncoding.MnemoBip39 => Native.ShareEncoding.MnemoBip39,
        _ => Native.ShareEncoding.Auto
    };
    private static Model.ShareEncoding ToModel(Native.ShareEncoding value) => value switch
    {
        Native.ShareEncoding.Base64url => Model.ShareEncoding.Base64url,
        Native.ShareEncoding.Base58check => Model.ShareEncoding.Base58check,
        Native.ShareEncoding.MnemoWords => Model.ShareEncoding.MnemoWords,
        Native.ShareEncoding.MnemoBip39 => Model.ShareEncoding.MnemoBip39,
        _ => Model.ShareEncoding.Auto
    };
}
