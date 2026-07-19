using FlaUI.Core;
using FlaUI.Core.AutomationElements;
using FlaUI.Core.Definitions;
using FlaUI.Core.Input;
using FlaUI.Core.Tools;
using FlaUI.Core.WindowsAPI;
using FlaUI.UIA3;

namespace Safeparts.UiAutomation.Tests;

public sealed class WorkbenchUiAutomationTests
{
    [Fact]
    public void SplitAndRecoverCompleteByKeyboardWithAccessibleSemantics()
    {
        string executable = Environment.GetEnvironmentVariable("SAFEPARTS_APP_EXE")
            ?? throw new InvalidOperationException("SAFEPARTS_APP_EXE must point to the packaged Safeparts.exe.");
        Assert.True(File.Exists(executable), "The packaged Safeparts executable was not found.");

        using Application application = Application.Launch(executable);
        using UIA3Automation automation = new();
        try
        {
            Window window = WaitForMainWindow(application, automation);
            window.SetForeground();
            window.FocusNative();

            RadioButton splitTask = RequireById(window, "TaskSplit").AsRadioButton();
            RadioButton recoverTask = RequireById(window, "TaskRecover").AsRadioButton();
            TextBox secretText = RequireById(window, "SecretText").AsTextBox();
            ComboBox splitEncoding = RequireById(window, "SplitEncoding").AsComboBox();
            Button splitAction = RequireById(window, "SplitAction").AsButton();

            Assert.Equal(ControlType.RadioButton, splitTask.ControlType);
            Assert.Equal("Split", splitTask.Name);
            Assert.Equal(ControlType.RadioButton, recoverTask.ControlType);
            Assert.Equal("Recover", recoverTask.Name);
            Assert.Equal(ControlType.Edit, secretText.ControlType);
            Assert.Equal("Secret text", secretText.Name);
            Assert.Equal(ControlType.ComboBox, splitEncoding.ControlType);
            Assert.Equal("Share encoding", splitEncoding.Name);
            Assert.Equal(ControlType.Button, splitAction.ControlType);
            Assert.False(splitAction.IsEnabled);

            FocusAndPress(splitEncoding, VirtualKeyShort.HOME);
            const string syntheticSecret = "synthetic keyboard workflow secret";
            FocusAndType(secretText, syntheticSecret);
            WaitUntil(() => splitAction.IsEnabled, "Split action did not become enabled.");
            FocusAndPress(splitAction, VirtualKeyShort.RETURN);

            TextBox[] splitShares = WaitForTextBoxes(window, "Recovery share text", 3);
            string[] shareText = splitShares.Select(box => box.Text).ToArray();
            Assert.All(shareText, value => Assert.False(string.IsNullOrWhiteSpace(value)));
            Assert.Equal(3, shareText.Distinct(StringComparer.Ordinal).Count());

            FocusAndPress(recoverTask, VirtualKeyShort.SPACE);
            TextBox[] recoveryFields = WaitForTextBoxes(window, "Recovery share", 2);
            FocusAndType(recoveryFields[0], shareText[0]);
            FocusAndType(recoveryFields[1], shareText[1]);

            Button recoverAction = RequireById(window, "RecoverAction").AsButton();
            AutomationElement readiness = RequireById(window, "RecoveryReadiness");
            Assert.Equal(ControlType.Button, recoverAction.ControlType);
            WaitUntil(() => recoverAction.IsEnabled, $"Recover action did not become enabled. Readiness: {readiness.Name}");
            FocusAndPress(recoverAction, VirtualKeyShort.RETURN);

            TextBox recoveredText = WaitForById(window, "RecoveredText").AsTextBox();
            WaitUntil(() => recoveredText.Text == syntheticSecret, "Recovered text did not match the synthetic Secret.");
            Assert.True(recoveredText.IsReadOnly);
            Assert.Equal("Recovered Secret text", recoveredText.Name);
        }
        finally
        {
            if (!application.HasExited)
            {
                application.Kill();
            }
        }
    }

    private static Window WaitForMainWindow(Application application, UIA3Automation automation)
    {
        RetryResult<Window?> result = Retry.WhileNull(
            () => application.GetMainWindow(automation),
            timeout: TimeSpan.FromSeconds(20),
            interval: TimeSpan.FromMilliseconds(200));
        Assert.True(result.Success && result.Result is not null, "Safeparts main window did not appear.");
        return result.Result!;
    }

    private static AutomationElement RequireById(Window window, string automationId) =>
        window.FindFirstDescendant(condition => condition.ByAutomationId(automationId))
        ?? throw new InvalidOperationException($"Automation element '{automationId}' was not found.");

    private static AutomationElement WaitForById(Window window, string automationId)
    {
        RetryResult<AutomationElement?> result = Retry.WhileNull(
            () => window.FindFirstDescendant(condition => condition.ByAutomationId(automationId)),
            timeout: TimeSpan.FromSeconds(10),
            interval: TimeSpan.FromMilliseconds(100));
        Assert.True(result.Success && result.Result is not null, $"Automation element '{automationId}' did not appear.");
        return result.Result!;
    }

    private static TextBox[] WaitForTextBoxes(Window window, string automationName, int count)
    {
        TextBox[] Current() => window
            .FindAllDescendants(condition => condition.ByName(automationName))
            .Where(element => element.ControlType == ControlType.Edit)
            .Select(element => element.AsTextBox())
            .ToArray();

        RetryResult<bool> result = Retry.WhileTrue(
            () => Current().Length < count,
            timeout: TimeSpan.FromSeconds(15),
            interval: TimeSpan.FromMilliseconds(100));
        Assert.True(result.Success, $"Expected {count} accessible '{automationName}' text boxes.");
        return Current().Take(count).ToArray();
    }

    private static void FocusAndType(AutomationElement element, string value)
    {
        element.FocusNative();
        Keyboard.TypeSimultaneously(VirtualKeyShort.CONTROL, VirtualKeyShort.KEY_A);
        Keyboard.Type(value);
        Wait.UntilInputIsProcessed(TimeSpan.FromMilliseconds(100));
    }

    private static void FocusAndPress(AutomationElement element, VirtualKeyShort key)
    {
        element.FocusNative();
        Keyboard.Type(key);
        Wait.UntilInputIsProcessed(TimeSpan.FromMilliseconds(100));
    }

    private static void WaitUntil(Func<bool> condition, string message)
    {
        RetryResult<bool> result = Retry.WhileFalse(
            condition,
            timeout: TimeSpan.FromSeconds(15),
            interval: TimeSpan.FromMilliseconds(100));
        Assert.True(result.Success, message);
    }
}
