using System.Collections.ObjectModel;
using System.ComponentModel;
using System.Runtime.CompilerServices;
using System.Text;

namespace Safeparts.AppModel;

public enum WorkbenchTask { Split, Recover }
public enum ShareEncoding { Auto, Base64url, Base58check, MnemoWords, MnemoBip39 }
public enum StatusKind { Working, Success, Warning, Failure }
public enum SafepartsFailure { InvalidParameters, InvalidEncoding, EmptyInput, MalformedShares, InsufficientShares, DuplicateShares, MixedShares, PassphraseRequired, IncorrectPassphrase, IntegrityFailure, Internal }

public sealed class SafepartsException(SafepartsFailure failure) : Exception
{
    public SafepartsFailure Failure { get; } = failure;
}

public sealed record EncodedShare(string Text, byte Index, byte ShareCount, string SetId);
public sealed record Inspection(ShareEncoding DetectedEncoding, byte Threshold, byte ShareCount, uint ProvidedCount, bool Encrypted, byte[] Indexes, bool Consistent, bool Ready);
public sealed record Recovery(byte[] Bytes, ShareEncoding DetectedEncoding, byte Threshold, byte ShareCount, bool Encrypted, byte[] Indexes, string SetId);
public sealed record ImportedSecret(string Name, byte[] Bytes);
public sealed record AppStatus(StatusKind Kind, string Message);

public sealed class RecoveryShareField : INotifyPropertyChanged
{
    private string _text;
    public RecoveryShareField(string text = "", Guid? id = null) { _text = text; Id = id ?? Guid.NewGuid(); }
    public Guid Id { get; }
    public string Text { get => _text; set { if (_text == value) return; _text = value; PropertyChanged?.Invoke(this, new(nameof(Text))); } }
    public event PropertyChangedEventHandler? PropertyChanged;
}

public interface ISafepartsService
{
    Task<IReadOnlyList<EncodedShare>> SplitAsync(byte[] secret, byte threshold, byte shareCount, ShareEncoding encoding, string? passphrase);
    Task<Inspection> InspectAsync(string input, ShareEncoding encoding);
    Task<Recovery> RecoverAsync(string input, ShareEncoding encoding, string? passphrase);
}

public abstract class ObservableModel : INotifyPropertyChanged
{
    public event PropertyChangedEventHandler? PropertyChanged;
    protected bool Set<T>(ref T field, T value, [CallerMemberName] string? name = null)
    {
        if (EqualityComparer<T>.Default.Equals(field, value)) return false;
        field = value; PropertyChanged?.Invoke(this, new(name)); return true;
    }
    protected void Notify(params string[] names) { foreach (string name in names) PropertyChanged?.Invoke(this, new(name)); }
}

public static class SafepartsMessages
{
    public static string For(SafepartsFailure failure) => failure switch
    {
        SafepartsFailure.InvalidParameters => "Choose a valid Threshold and Share count.",
        SafepartsFailure.InvalidEncoding => "Choose a concrete Share encoding before splitting.",
        SafepartsFailure.EmptyInput => "Enter Recovery shares first.",
        SafepartsFailure.MalformedShares => "The Recovery share input is malformed.",
        SafepartsFailure.InsufficientShares => "More Recovery shares are required.",
        SafepartsFailure.DuplicateShares => "Remove duplicate Recovery shares.",
        SafepartsFailure.MixedShares => "Recovery shares do not belong to the same set.",
        SafepartsFailure.PassphraseRequired => "Enter the passphrase used to protect these Recovery shares.",
        SafepartsFailure.IncorrectPassphrase => "The passphrase is incorrect.",
        SafepartsFailure.IntegrityFailure => "Recovery share integrity verification failed.",
        _ => "Safeparts could not complete the operation."
    };
}

public static class Utf8
{
    private static readonly UTF8Encoding Strict = new(false, true);
    public static string? Decode(byte[] bytes) { try { return Strict.GetString(bytes); } catch (DecoderFallbackException) { return null; } }
}
