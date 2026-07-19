using System.Collections.ObjectModel;
using System.Collections.Specialized;

namespace Safeparts.AppModel;

public sealed class WorkbenchModel : ObservableModel
{
    private readonly ISafepartsService _service;
    private WorkbenchTask _task;
    private string _secretText = "";
    private ImportedSecret? _importedSecret;
    private string _splitPassphrase = "";
    private int _threshold = 2;
    private int _shareCount = 3;
    private ShareEncoding _splitEncoding = ShareEncoding.MnemoWords;
    private string _exportPrefix = "";
    private AppStatus? _splitStatus;
    private bool _isSplitting;
    private string _recoveryPassphrase = "";
    private ShareEncoding _recoveryEncoding = ShareEncoding.Auto;
    private Inspection? _inspection;
    private Recovery? _recovery;
    private AppStatus? _recoveryStatus;
    private bool _isRecovering;
    private long _splitGeneration;
    private long _recoveryGeneration;
    private long _inspectionGeneration;
    private CancellationTokenSource? _inspectionCancellation;
    private bool _recoveryEncodingWasManual;
    private bool _automaticExpansion = true;

    public WorkbenchModel(ISafepartsService service)
    {
        _service = service;
        RecoveryFields.CollectionChanged += RecoveryFieldsChanged;
        AddRecoveryField();
        AddRecoveryField();
    }

    public WorkbenchTask Task { get => _task; set { if (Set(ref _task, value)) Notify(nameof(CanExportCurrentResult)); } }
    public string SecretText { get => _secretText; set { if (Set(ref _secretText, value)) { _importedSecret = null; Notify(nameof(ImportedSecret), nameof(CurrentSecretBytes)); InvalidateSplit(); } } }
    public ImportedSecret? ImportedSecret => _importedSecret;
    public string SplitPassphrase { get => _splitPassphrase; set { if (Set(ref _splitPassphrase, value)) InvalidateSplit(); } }
    public int Threshold { get => _threshold; set { int normalized = Math.Clamp(value, 1, ShareCount); if (Set(ref _threshold, normalized)) InvalidateSplit(); } }
    public int ShareCount { get => _shareCount; set { int normalized = Math.Clamp(value, 1, 255); if (Set(ref _shareCount, normalized)) { if (_threshold > normalized) { _threshold = normalized; Notify(nameof(Threshold)); } InvalidateSplit(); } } }
    public ShareEncoding SplitEncoding { get => _splitEncoding; set { if (Set(ref _splitEncoding, value)) InvalidateSplit(); } }
    public string ExportPrefix { get => _exportPrefix; set => Set(ref _exportPrefix, value); }
    public ObservableCollection<EncodedShare> Shares { get; } = [];
    public AppStatus? SplitStatus { get => _splitStatus; private set => Set(ref _splitStatus, value); }
    public bool IsSplitting { get => _isSplitting; private set { if (Set(ref _isSplitting, value)) Notify(nameof(CanSplit)); } }
    public byte[] CurrentSecretBytes => _importedSecret?.Bytes.ToArray() ?? System.Text.Encoding.UTF8.GetBytes(_secretText);
    public bool CanSplit => CurrentSecretBytes.Length > 0 && !IsSplitting && SplitEncoding != ShareEncoding.Auto;

    public ObservableCollection<RecoveryShareField> RecoveryFields { get; } = [];
    public string RecoveryPassphrase { get => _recoveryPassphrase; set { if (Set(ref _recoveryPassphrase, value)) { InvalidateRecovery(); Notify(nameof(CanRecover)); } } }
    public ShareEncoding RecoveryEncoding { get => _recoveryEncoding; private set { if (Set(ref _recoveryEncoding, value)) Notify(nameof(CanRecover)); } }
    public Inspection? Inspection { get => _inspection; private set { if (Set(ref _inspection, value)) Notify(nameof(RecoveryPassphraseEnabled), nameof(CanRecover), nameof(RecoveryReadiness)); } }
    public Recovery? RecoveredSecret { get => _recovery; private set { if (Set(ref _recovery, value)) Notify(nameof(RecoveredText), nameof(RecoveredByteCount), nameof(CanExportCurrentResult)); } }
    public string? RecoveredText => RecoveredSecret is null ? null : Utf8.Decode(RecoveredSecret.Bytes);
    public int RecoveredByteCount => RecoveredSecret?.Bytes.Length ?? 0;
    public AppStatus? RecoveryStatus { get => _recoveryStatus; private set => Set(ref _recoveryStatus, value); }
    public bool IsRecovering { get => _isRecovering; private set { if (Set(ref _isRecovering, value)) Notify(nameof(CanRecover)); } }
    public bool RecoveryPassphraseEnabled => Inspection?.Encrypted == true;
    public bool CanRecover => !IsRecovering && Inspection?.Ready == true && (!RecoveryPassphraseEnabled || !string.IsNullOrEmpty(RecoveryPassphrase));
    public string RecoveryReadiness => Inspection is null ? "Waiting for Recovery shares" : Inspection.Ready ? $"Ready with {Inspection.ProvidedCount} of {Inspection.Threshold}" : $"Need {Inspection.Threshold} Recovery shares";
    public bool CanExportCurrentResult => Task == WorkbenchTask.Split ? Shares.Count > 0 : RecoveredSecret is not null;

    public void SetImportedSecret(string name, byte[] bytes)
    {
        InvalidateSplit(); _importedSecret = new(name, bytes.ToArray()); _secretText = "";
        Notify(nameof(ImportedSecret), nameof(SecretText), nameof(CurrentSecretBytes), nameof(CanSplit));
        SplitStatus = new(StatusKind.Success, $"Loaded {name} ({bytes.Length} bytes).");
    }

    public void UseTextSecret() { if (_importedSecret is null) return; _importedSecret = null; Notify(nameof(ImportedSecret), nameof(CurrentSecretBytes)); InvalidateSplit(); }

    public async Task SplitAsync()
    {
        if (!CanSplit) return;
        long generation = ++_splitGeneration; byte[] secret = CurrentSecretBytes;
        byte threshold = (byte)Threshold; byte count = (byte)ShareCount; ShareEncoding encoding = SplitEncoding;
        string? passphrase = string.IsNullOrEmpty(SplitPassphrase) ? null : SplitPassphrase;
        Shares.Clear(); SplitStatus = new(StatusKind.Working, "Splitting locally…"); IsSplitting = true;
        try
        {
            IReadOnlyList<EncodedShare> result = await _service.SplitAsync(secret, threshold, count, encoding, passphrase);
            if (generation != _splitGeneration) return;
            foreach (EncodedShare share in result) Shares.Add(share);
            SplitStatus = new(StatusKind.Success, $"Created {result.Count} Recovery shares.");
        }
        catch (SafepartsException error) { if (generation == _splitGeneration) SplitStatus = new(StatusKind.Failure, SafepartsMessages.For(error.Failure)); }
        catch { if (generation == _splitGeneration) SplitStatus = new(StatusKind.Failure, SafepartsMessages.For(SafepartsFailure.Internal)); }
        finally { if (generation == _splitGeneration) IsSplitting = false; Notify(nameof(CanExportCurrentResult)); }
    }

    public void AddRecoveryField(string text = "")
    {
        RecoveryShareField field = new(text); field.PropertyChanged += RecoveryFieldChanged; RecoveryFields.Add(field);
    }

    public void UpdateRecoveryField(Guid id, string text) { RecoveryShareField? field = RecoveryFields.FirstOrDefault(item => item.Id == id); if (field is not null) field.Text = text; }
    public void ClearRecoveryField(Guid id) => UpdateRecoveryField(id, "");
    public void RemoveRecoveryField(Guid id)
    {
        if (RecoveryFields.Count <= 2) return;
        RecoveryShareField? field = RecoveryFields.FirstOrDefault(item => item.Id == id); if (field is null) return;
        _automaticExpansion = false; field.PropertyChanged -= RecoveryFieldChanged; RecoveryFields.Remove(field); RecoveryInputChanged();
    }

    public void SetRecoveryInput(string input)
    {
        _automaticExpansion = true;
        string normalized = input.Replace("\r\n", "\n", StringComparison.Ordinal);
        string[] values = normalized.Split("\n\n", StringSplitOptions.TrimEntries | StringSplitOptions.RemoveEmptyEntries);
        while (RecoveryFields.Count > 0) { RecoveryFields[0].PropertyChanged -= RecoveryFieldChanged; RecoveryFields.RemoveAt(0); }
        foreach (string value in values) AddRecoveryField(value);
        while (RecoveryFields.Count < 2) AddRecoveryField();
        RecoveryInputChanged();
    }

    public void SetRecoveryEncoding(ShareEncoding encoding)
    {
        _recoveryEncodingWasManual = true; RecoveryEncoding = encoding; InvalidateRecovery(); _ = RefreshInspectionAsync();
    }

    public async Task RecoverAsync()
    {
        if (!CanRecover) return;
        long generation = ++_recoveryGeneration; string input = CombinedRecoveryInput(); ShareEncoding encoding = RecoveryEncoding;
        string? passphrase = RecoveryPassphraseEnabled ? RecoveryPassphrase : null;
        RecoveredSecret = null; RecoveryStatus = new(StatusKind.Working, "Recovering locally…"); IsRecovering = true;
        try
        {
            Recovery result = await _service.RecoverAsync(input, encoding, passphrase);
            if (generation != _recoveryGeneration) return;
            RecoveredSecret = result; RecoveryStatus = new(StatusKind.Success, $"Recovered {result.Bytes.Length} bytes.");
        }
        catch (SafepartsException error) { if (generation == _recoveryGeneration) RecoveryStatus = new(StatusKind.Failure, SafepartsMessages.For(error.Failure)); }
        catch { if (generation == _recoveryGeneration) RecoveryStatus = new(StatusKind.Failure, SafepartsMessages.For(SafepartsFailure.Internal)); }
        finally { if (generation == _recoveryGeneration) IsRecovering = false; }
    }

    public void DismissRecoveryFailure() { if (RecoveryStatus?.Kind == StatusKind.Failure) RecoveryStatus = null; }
    public void ClearCurrentTask() { if (Task == WorkbenchTask.Split) ClearSplit(); else ClearRecovery(); }
    public void Clear() { ClearSplit(); ClearRecovery(); }
    public void ClearSplit()
    {
        ++_splitGeneration; _secretText = ""; _importedSecret = null; _splitPassphrase = ""; _exportPrefix = ""; Shares.Clear(); SplitStatus = null; IsSplitting = false;
        Notify(nameof(SecretText), nameof(ImportedSecret), nameof(SplitPassphrase), nameof(ExportPrefix), nameof(CurrentSecretBytes), nameof(CanSplit), nameof(CanExportCurrentResult));
    }
    public void ClearRecovery()
    {
        ++_recoveryGeneration; ++_inspectionGeneration; _inspectionCancellation?.Cancel();
        while (RecoveryFields.Count > 0) { RecoveryFields[0].PropertyChanged -= RecoveryFieldChanged; RecoveryFields.RemoveAt(0); }
        AddRecoveryField(); AddRecoveryField(); _recoveryPassphrase = ""; _recoveryEncoding = ShareEncoding.Auto; _recoveryEncodingWasManual = false; _automaticExpansion = true;
        Inspection = null; RecoveredSecret = null; RecoveryStatus = null; IsRecovering = false;
        Notify(nameof(RecoveryPassphrase), nameof(RecoveryEncoding), nameof(CanRecover));
    }

    private void InvalidateSplit()
    {
        ++_splitGeneration; Shares.Clear(); SplitStatus = null; IsSplitting = false; Notify(nameof(CanSplit), nameof(CanExportCurrentResult));
    }
    private void InvalidateRecovery()
    {
        ++_recoveryGeneration; RecoveredSecret = null; RecoveryStatus = null; IsRecovering = false; Notify(nameof(CanRecover));
    }
    private string CombinedRecoveryInput() => string.Join("\n\n", RecoveryFields.Select(field => field.Text.Trim()).Where(text => text.Length > 0));
    private void RecoveryFieldChanged(object? sender, System.ComponentModel.PropertyChangedEventArgs eventArgs) { if (eventArgs.PropertyName == nameof(RecoveryShareField.Text)) RecoveryInputChanged(); }
    private void RecoveryFieldsChanged(object? sender, NotifyCollectionChangedEventArgs args) => Notify(nameof(RecoveryFields));
    private void RecoveryInputChanged() { InvalidateRecovery(); _ = RefreshInspectionAsync(); }

    private async Task RefreshInspectionAsync()
    {
        long generation = ++_inspectionGeneration; _inspectionCancellation?.Cancel(); CancellationTokenSource cancellation = new(); _inspectionCancellation = cancellation;
        Inspection = null; string input = CombinedRecoveryInput(); if (input.Length == 0) return;
        try
        {
            await System.Threading.Tasks.Task.Delay(250, cancellation.Token);
            ShareEncoding requested = _recoveryEncodingWasManual ? RecoveryEncoding : ShareEncoding.Auto;
            Inspection result = await _service.InspectAsync(input, requested);
            if (cancellation.IsCancellationRequested || generation != _inspectionGeneration) return;
            Inspection = result;
            if (!_recoveryEncodingWasManual) RecoveryEncoding = result.DetectedEncoding;
            if (!result.Encrypted && _recoveryPassphrase.Length > 0) { _recoveryPassphrase = ""; Notify(nameof(RecoveryPassphrase)); }
            if (_automaticExpansion) while (RecoveryFields.Count < Math.Max(2, (int)result.Threshold)) AddRecoveryField();
            Notify(nameof(CanRecover), nameof(RecoveryPassphraseEnabled));
        }
        catch (OperationCanceledException) { }
        catch (SafepartsException) { if (generation == _inspectionGeneration) Inspection = null; }
        catch { if (generation == _inspectionGeneration) Inspection = null; }
    }
}
