using Microsoft.UI.Xaml;

namespace Safeparts.WinUI;

public partial class App : Application
{
    private Window? _window;

    public App()
    {
        if (Environment.GetEnvironmentVariable("SAFEPARTS_LAUNCH_DIAGNOSTICS") == "1")
        {
            UnhandledException += ReportUnhandledException;
        }
        InitializeComponent();
    }

    private static void ReportUnhandledException(object sender, Microsoft.UI.Xaml.UnhandledExceptionEventArgs args)
    {
        try { File.WriteAllText(Path.Combine(AppContext.BaseDirectory, "Safeparts.launch-error.txt"), args.Exception.ToString()); }
        catch { }
    }

    protected override void OnLaunched(LaunchActivatedEventArgs args) { _window = new MainWindow(); _window.Activate(); }
}
