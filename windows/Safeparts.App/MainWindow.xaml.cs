using Microsoft.UI.Xaml;
using Microsoft.UI.Xaml.Controls;
using Microsoft.UI.Xaml.Input;
using Safeparts.AppModel;
using Safeparts.NativeHost;
using Windows.ApplicationModel.DataTransfer;
using Windows.Storage.Pickers;
using Windows.System;

namespace Safeparts.WinUI;

public sealed partial class MainWindow : Window
{
    public WorkbenchModel Model { get; } = new(new NativeSafepartsService());
    private bool _refreshing;

    public MainWindow()
    {
        _refreshing = true;
        InitializeComponent(); Title = "Safeparts"; ExtendsContentIntoTitleBar = true; SetTitleBar(AppTitleBar);
        Model.PropertyChanged += (_, _) => DispatcherQueue.TryEnqueue(RefreshUi);
        Model.Shares.CollectionChanged += (_, _) => DispatcherQueue.TryEnqueue(RefreshUi);
        Model.RecoveryFields.CollectionChanged += (_, _) => DispatcherQueue.TryEnqueue(RefreshUi);
        SplitEncodingBox.ItemsSource = ConcreteEncodings(); SplitEncodingBox.SelectedItem = ShareEncoding.MnemoWords;
        RecoveryEncodingBox.ItemsSource = Enum.GetValues<ShareEncoding>(); RecoveryEncodingBox.SelectedItem = ShareEncoding.MnemoWords;
        AddAccelerators(); _refreshing = false; RefreshUi();
    }

    private static ShareEncoding[] ConcreteEncodings() => [ShareEncoding.Base64url, ShareEncoding.Base58check, ShareEncoding.MnemoWords, ShareEncoding.MnemoBip39];
    private void RefreshUi()
    {
        _refreshing = true;
        SplitPanel.Visibility = Model.Task == WorkbenchTask.Split ? Visibility.Visible : Visibility.Collapsed;
        RecoverPanel.Visibility = Model.Task == WorkbenchTask.Recover ? Visibility.Visible : Visibility.Collapsed;
        SplitButton.IsEnabled = Model.CanSplit; SplitButton.Content = Model.IsSplitting ? "Splitting…" : "Split";
        ShareList.ItemsSource = Model.Shares; ExportPanel.Visibility = Model.Shares.Count > 0 ? Visibility.Visible : Visibility.Collapsed;
        TextSecretPanel.Visibility = Model.ImportedSecret is null ? Visibility.Visible : Visibility.Collapsed; ImportedSecretPanel.Visibility = Model.ImportedSecret is null ? Visibility.Collapsed : Visibility.Visible;
        ImportedSecretText.Text = Model.ImportedSecret is null ? "" : $"{Model.ImportedSecret.Name} ({Model.ImportedSecret.Bytes.Length} bytes)";
        ShowStatus(SplitStatus, Model.SplitStatus);
        RecoveryFieldList.ItemsSource = Model.RecoveryFields; RecoveryReadinessText.Text = Model.RecoveryReadiness;
        RecoveryPassphraseBox.IsEnabled = Model.RecoveryPassphraseEnabled; RecoverButton.IsEnabled = Model.CanRecover; RecoverButton.Content = Model.IsRecovering ? "Recovering…" : "Recover Secret";
        if (RecoveryEncodingBox.SelectedItem is not ShareEncoding selected || selected != Model.RecoveryEncoding) RecoveryEncodingBox.SelectedItem = Model.RecoveryEncoding;
        ShowStatus(RecoveryStatus, Model.RecoveryStatus);
        RecoveredPanel.Visibility = Model.RecoveredSecret is null ? Visibility.Collapsed : Visibility.Visible;
        RecoveredTextBox.Text = Model.RecoveredText ?? ""; RecoveredTextBox.Visibility = Model.RecoveredText is null ? Visibility.Collapsed : Visibility.Visible;
        RecoveredBytesText.Text = Model.RecoveredSecret is null ? "" : $"{Model.RecoveredByteCount} bytes"; CopyRecoveredButton.IsEnabled = Model.RecoveredText is not null;
        _refreshing = false;
        if (Model.RecoveryStatus?.Kind == StatusKind.Failure) _ = ShowRecoveryFailureAsync();
    }

    private static void ShowStatus(InfoBar view, AppStatus? status)
    {
        view.IsOpen = status is not null; if (status is null) return; view.Message = status.Message;
        view.Severity = status.Kind switch { StatusKind.Success => InfoBarSeverity.Success, StatusKind.Warning => InfoBarSeverity.Warning, StatusKind.Failure => InfoBarSeverity.Error, _ => InfoBarSeverity.Informational };
    }

    private void TaskChanged(object sender, RoutedEventArgs args)
    {
        if (_refreshing || sender is not RadioButton button || button.IsChecked != true) return;
        Model.Task = button == SplitTaskButton ? WorkbenchTask.Split : WorkbenchTask.Recover; RefreshUi();
    }
    private void SecretTextChanged(object sender, TextChangedEventArgs args) { if (!_refreshing) Model.SecretText = SecretTextBox.Text; }
    private void ThresholdChanged(NumberBox sender, NumberBoxValueChangedEventArgs args) { if (!_refreshing && !double.IsNaN(args.NewValue)) { Model.Threshold = (int)args.NewValue; ThresholdBox.Value = Model.Threshold; } }
    private void ShareCountChanged(NumberBox sender, NumberBoxValueChangedEventArgs args) { if (!_refreshing && !double.IsNaN(args.NewValue)) { Model.ShareCount = (int)args.NewValue; ShareCountBox.Value = Model.ShareCount; ThresholdBox.Value = Model.Threshold; } }
    private void SplitEncodingChanged(object sender, SelectionChangedEventArgs args) { if (!_refreshing && SplitEncodingBox.SelectedItem is ShareEncoding value) Model.SplitEncoding = value; }
    private void SplitPassphraseChanged(object sender, RoutedEventArgs args) { if (!_refreshing) Model.SplitPassphrase = SplitPassphraseBox.Password; }
    private async void SplitClicked(object sender, RoutedEventArgs args) { await Model.SplitAsync(); RefreshUi(); }
    private void UseTextClicked(object sender, RoutedEventArgs args) { Model.UseTextSecret(); RefreshUi(); }
    private void ExportPrefixChanged(object sender, TextChangedEventArgs args) { if (!_refreshing) Model.ExportPrefix = ExportPrefixBox.Text; }
    private void RecoveryEncodingChanged(object sender, SelectionChangedEventArgs args) { if (!_refreshing && RecoveryEncodingBox.SelectedItem is ShareEncoding value) Model.SetRecoveryEncoding(value); }
    private void RecoveryPassphraseChanged(object sender, RoutedEventArgs args) { if (!_refreshing) Model.RecoveryPassphrase = RecoveryPassphraseBox.Password; }
    private void AddRecoveryFieldClicked(object sender, RoutedEventArgs args) { Model.AddRecoveryField(); RefreshUi(); }
    private void RecoveryFieldTextChanged(object sender, TextChangedEventArgs args) { if (!_refreshing && sender is TextBox box && box.Tag is Guid id) Model.UpdateRecoveryField(id, box.Text); }
    private void ClearRecoveryFieldClicked(object sender, RoutedEventArgs args) { if ((sender as FrameworkElement)?.Tag is Guid id) Model.ClearRecoveryField(id); }
    private void RemoveRecoveryFieldClicked(object sender, RoutedEventArgs args) { if ((sender as FrameworkElement)?.Tag is Guid id) Model.RemoveRecoveryField(id); RefreshUi(); }
    private async void RecoverClicked(object sender, RoutedEventArgs args) { await Model.RecoverAsync(); RefreshUi(); }

    private async void PasteSecretClicked(object sender, RoutedEventArgs args) { string? text = await ReadClipboardAsync(); if (text is not null) { SecretTextBox.Text = text; Model.SecretText = text; } }
    private async void PasteSharesClicked(object sender, RoutedEventArgs args) { string? text = await ReadClipboardAsync(); if (text is not null) { Model.SetRecoveryInput(text); RefreshUi(); } }
    private async void PasteRecoveryFieldClicked(object sender, RoutedEventArgs args) { if ((sender as FrameworkElement)?.Tag is Guid id) { string? text = await ReadClipboardAsync(); if (text is not null) Model.UpdateRecoveryField(id, text); } }
    private async void CopyShareClicked(object sender, RoutedEventArgs args) { if ((sender as FrameworkElement)?.Tag is EncodedShare share) await WriteClipboardAsync(share.Text); }
    private async void CopyRecoveredClicked(object sender, RoutedEventArgs args) { if (Model.RecoveredText is string text) await WriteClipboardAsync(text); }

    private async void ImportSecretClicked(object sender, RoutedEventArgs args)
    {
        FileOpenPicker picker = new(); picker.FileTypeFilter.Add("*"); InitializePicker(picker); Windows.Storage.StorageFile? file = await picker.PickSingleFileAsync(); if (file is null) return;
        try { Model.SetImportedSecret(file.Name, await File.ReadAllBytesAsync(file.Path)); RefreshUi(); } catch { await ShowFileErrorAsync($"Couldn’t read {file.Name}."); }
    }
    private async void ImportSharesClicked(object sender, RoutedEventArgs args)
    {
        FileOpenPicker picker = new(); picker.FileTypeFilter.Add("*"); InitializePicker(picker); IReadOnlyList<Windows.Storage.StorageFile> files = await picker.PickMultipleFilesAsync(); if (files.Count == 0) return;
        List<string> shares = [];
        try { foreach (Windows.Storage.StorageFile file in files) { string text = await File.ReadAllTextAsync(file.Path, new System.Text.UTF8Encoding(false, true)); if (!string.IsNullOrWhiteSpace(text)) shares.Add(text.Trim()); } if (shares.Count == 0) throw new InvalidDataException(); Model.SetRecoveryInput(string.Join("\n\n", shares)); RefreshUi(); }
        catch { await ShowFileErrorAsync("Couldn’t import the selected Recovery-share files."); }
    }
    private async void SaveShareClicked(object sender, RoutedEventArgs args) { if ((sender as FrameworkElement)?.Tag is EncodedShare share) await SaveBytesAsync(System.Text.Encoding.UTF8.GetBytes(share.Text), ShareFileNamePolicy.Individual(share)); }
    private async void SaveRecoveredClicked(object sender, RoutedEventArgs args) { if (Model.RecoveredSecret is not null) await SaveBytesAsync(Model.RecoveredSecret.Bytes, "safeparts-recovered-secret.bin"); }
    private async void ExportAllClicked(object sender, RoutedEventArgs args)
    {
        FolderPicker picker = new(); picker.FileTypeFilter.Add("*"); InitializePicker(picker); Windows.Storage.StorageFolder? folder = await picker.PickSingleFolderAsync(); if (folder is null) return;
        try { foreach (EncodedShare share in Model.Shares) { string path = Path.Combine(folder.Path, ShareFileNamePolicy.Export(share, Model.ExportPrefix)); await AtomicWriteAsync(path, System.Text.Encoding.UTF8.GetBytes(share.Text)); } }
        catch { await ShowFileErrorAsync("Couldn’t export the Recovery shares."); }
    }
    private async Task SaveBytesAsync(byte[] bytes, string suggestedName)
    {
        FileSavePicker picker = new() { SuggestedFileName = suggestedName }; picker.FileTypeChoices.Add("Safeparts file", [Path.GetExtension(suggestedName) is string ext && ext.Length > 0 ? ext : ".bin"]); InitializePicker(picker); Windows.Storage.StorageFile? file = await picker.PickSaveFileAsync(); if (file is null) return;
        try { await AtomicWriteAsync(file.Path, bytes); } catch { await ShowFileErrorAsync($"Couldn’t write {file.Name}."); }
    }
    private static async Task AtomicWriteAsync(string path, byte[] bytes) { string temporary = $"{path}.{Guid.NewGuid():N}.tmp"; try { await File.WriteAllBytesAsync(temporary, bytes); File.Move(temporary, path, true); } finally { if (File.Exists(temporary)) File.Delete(temporary); } }
    private async Task<string?> ReadClipboardAsync()
    {
        try { DataPackageView content = Clipboard.GetContent(); return content.Contains(StandardDataFormats.Text) ? await content.GetTextAsync() : null; }
        catch { await ShowFileErrorAsync("Couldn’t read the clipboard."); return null; }
    }
    private async Task WriteClipboardAsync(string text)
    {
        try { DataPackage package = new(); package.SetText(text); Clipboard.SetContent(package); Clipboard.Flush(); }
        catch { await ShowFileErrorAsync("Couldn’t write to the clipboard."); }
    }

    private void InitializePicker(object picker) => WinRT.Interop.InitializeWithWindow.Initialize(picker, WinRT.Interop.WindowNative.GetWindowHandle(this));
    private async Task ShowRecoveryFailureAsync() { string message = Model.RecoveryStatus?.Message ?? "Safeparts could not recover the Secret."; Model.DismissRecoveryFailure(); ContentDialog dialog = new() { Title = "Recovery failed", Content = message, CloseButtonText = "OK", XamlRoot = Content.XamlRoot }; await dialog.ShowAsync(); RecoveryFieldList.Focus(FocusState.Programmatic); }
    private async Task ShowFileErrorAsync(string message) { ContentDialog dialog = new() { Title = "File operation failed", Content = message, CloseButtonText = "OK", XamlRoot = Content.XamlRoot }; await dialog.ShowAsync(); }

    private void AddAccelerators()
    {
        AddAccelerator(VirtualKey.Number1, VirtualKeyModifiers.Control, () => { SplitTaskButton.IsChecked = true; });
        AddAccelerator(VirtualKey.Number2, VirtualKeyModifiers.Control, () => { RecoverTaskButton.IsChecked = true; });
        AddAccelerator(VirtualKey.O, VirtualKeyModifiers.Control, () => { if (Model.Task == WorkbenchTask.Split) ImportSecretClicked(this, new RoutedEventArgs()); else ImportSharesClicked(this, new RoutedEventArgs()); });
        AddAccelerator(VirtualKey.S, VirtualKeyModifiers.Control | VirtualKeyModifiers.Shift, () => { if (Model.Task == WorkbenchTask.Split && Model.Shares.Count > 0) ExportAllClicked(this, new RoutedEventArgs()); else if (Model.RecoveredSecret is not null) SaveRecoveredClicked(this, new RoutedEventArgs()); });
        AddAccelerator(VirtualKey.Enter, VirtualKeyModifiers.Control, async () => { if (Model.Task == WorkbenchTask.Split) await Model.SplitAsync(); else await Model.RecoverAsync(); RefreshUi(); });
        AddAccelerator(VirtualKey.Delete, VirtualKeyModifiers.Control | VirtualKeyModifiers.Shift, () => { Model.ClearCurrentTask(); RefreshUi(); });
    }
    private void AddAccelerator(VirtualKey key, VirtualKeyModifiers modifiers, Action action) { KeyboardAccelerator accelerator = new() { Key = key, Modifiers = modifiers }; accelerator.Invoked += (_, args) => { action(); args.Handled = true; }; Content.KeyboardAccelerators.Add(accelerator); }
}
