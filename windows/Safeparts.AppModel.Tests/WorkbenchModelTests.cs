using Safeparts.AppModel;

namespace Safeparts.AppModel.Tests;

public sealed class WorkbenchModelTests
{
    [Fact]
    public async Task DefaultSplitPublishesThreeWordsShares()
    {
        FakeService service = new(); WorkbenchModel model = new(service) { SecretText = "hello" };
        await model.SplitAsync();
        Assert.Equal(3, model.Shares.Count); Assert.Equal(2, model.Threshold); Assert.Equal(3, model.ShareCount); Assert.Equal(ShareEncoding.MnemoWords, model.SplitEncoding);
    }

    [Fact]
    public async Task ClearMakesLateSplitInert()
    {
        TaskCompletionSource<IReadOnlyList<EncodedShare>> pending = new(); FakeService service = new() { SplitHandler = () => pending.Task };
        WorkbenchModel model = new(service) { SecretText = "synthetic" }; Task operation = model.SplitAsync(); model.ClearSplit();
        pending.SetResult([new("share", 1, 3, "set")]); await operation;
        Assert.Empty(model.Shares); Assert.Empty(model.SecretText);
    }

    [Fact]
    public void PolicyNormalizesAndInvalidatesShares()
    {
        WorkbenchModel model = new(new FakeService()); model.SecretText = "x"; model.ShareCount = 3; model.Threshold = 9;
        Assert.Equal(3, model.Threshold); model.SplitEncoding = ShareEncoding.Base58check; Assert.Empty(model.Shares);
        model.ShareCount = 1; Assert.Equal(1, model.Threshold);
    }

    [Fact]
    public void RecoveryFieldsHaveStableIdentityAndTwoFieldFloor()
    {
        WorkbenchModel model = new(new FakeService()); model.AddRecoveryField("third"); Guid removed = model.RecoveryFields[1].Id; Guid retained = model.RecoveryFields[2].Id;
        model.RemoveRecoveryField(removed); model.UpdateRecoveryField(removed, "stale");
        Assert.DoesNotContain(model.RecoveryFields, field => field.Id == removed); Assert.Contains(model.RecoveryFields, field => field.Id == retained);
        model.RemoveRecoveryField(retained); Assert.Equal(2, model.RecoveryFields.Count);
    }

    [Fact]
    public async Task InspectionExpandsThresholdAndGatesPassphrase()
    {
        FakeService service = new() { Inspection = new(ShareEncoding.Base58check, 4, 5, 1, true, [1], true, false) };
        WorkbenchModel model = new(service); model.UpdateRecoveryField(model.RecoveryFields[0].Id, "synthetic");
        await WaitUntil(() => model.Inspection is not null);
        Assert.Equal(4, model.RecoveryFields.Count); Assert.True(model.RecoveryPassphraseEnabled); Assert.Equal(ShareEncoding.Base58check, model.RecoveryEncoding); Assert.False(model.CanRecover);
    }

    [Fact]
    public async Task ManualEncodingWinsAndUnprotectedInspectionClearsPassphrase()
    {
        FakeService service = new() { Inspection = new(ShareEncoding.Base58check, 2, 3, 2, false, [1, 2], true, true) };
        WorkbenchModel model = new(service) { RecoveryPassphrase = "stale" }; model.SetRecoveryEncoding(ShareEncoding.MnemoBip39); model.UpdateRecoveryField(model.RecoveryFields[0].Id, "a");
        await WaitUntil(() => model.Inspection is not null);
        Assert.Equal(ShareEncoding.MnemoBip39, model.RecoveryEncoding); Assert.Empty(model.RecoveryPassphrase); Assert.True(model.CanRecover);
    }

    [Fact]
    public async Task TextAndBinaryRecoveryPresentation()
    {
        FakeService service = new() { Recovery = new(System.Text.Encoding.UTF8.GetBytes("hello"), ShareEncoding.MnemoWords, 2, 3, false, [1, 2], "set"), Inspection = new(ShareEncoding.MnemoWords, 2, 3, 2, false, [1, 2], true, true) };
        WorkbenchModel model = new(service); model.SetRecoveryInput("a\n\nb"); await WaitUntil(() => model.CanRecover); await model.RecoverAsync(); Assert.Equal("hello", model.RecoveredText);
        service.Recovery = service.Recovery with { Bytes = [255, 254] }; model.SetRecoveryInput("c\n\nd"); await WaitUntil(() => model.CanRecover); await model.RecoverAsync(); Assert.Null(model.RecoveredText); Assert.Equal(2, model.RecoveredByteCount);
    }

    [Theory]
    [InlineData(" client:/backup ", "client-backup-safeparts-abc-share-2-of-3.txt")]
    [InlineData("CON", "_CON-safeparts-abc-share-2-of-3.txt")]
    [InlineData("name. ", "name-safeparts-abc-share-2-of-3.txt")]
    public void ExportNamesAreWindowsSafe(string prefix, string expected)
    {
        Assert.Equal(expected, ShareFileNamePolicy.Export(new("x", 2, 3, "abc"), prefix));
    }

    private static async Task WaitUntil(Func<bool> condition)
    {
        for (int i = 0; i < 50 && !condition(); i++) await Task.Delay(50);
        Assert.True(condition());
    }

    private sealed class FakeService : ISafepartsService
    {
        public Func<Task<IReadOnlyList<EncodedShare>>>? SplitHandler { get; init; }
        public Inspection Inspection { get; set; } = new(ShareEncoding.MnemoWords, 2, 3, 2, false, [1, 2], true, true);
        public Recovery Recovery { get; set; } = new(System.Text.Encoding.UTF8.GetBytes("secret"), ShareEncoding.MnemoWords, 2, 3, false, [1, 2], "set");
        public Task<IReadOnlyList<EncodedShare>> SplitAsync(byte[] secret, byte threshold, byte shareCount, ShareEncoding encoding, string? passphrase) => SplitHandler?.Invoke() ?? Task.FromResult<IReadOnlyList<EncodedShare>>(Enumerable.Range(1, shareCount).Select(i => new EncodedShare($"share-{i}", (byte)i, shareCount, "set")).ToArray());
        public Task<Inspection> InspectAsync(string input, ShareEncoding encoding) => Task.FromResult(Inspection);
        public Task<Recovery> RecoverAsync(string input, ShareEncoding encoding, string? passphrase) => Task.FromResult(Recovery);
    }
}
