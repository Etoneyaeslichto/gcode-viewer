using System;
using System.Diagnostics;
using System.Drawing;
using System.IO;
using System.Runtime.InteropServices;
using System.Text;
using System.Text.RegularExpressions;
using System.Windows.Forms;
using Microsoft.Web.WebView2.Core;
using Microsoft.Web.WebView2.WinForms;

namespace GcodeViewer
{
    static class Program
    {
        [STAThread]
        static void Main()
        {
            ApplicationConfiguration.Initialize();
            Application.Run(new MainForm());
        }
    }

    class MainForm : Form
    {
        private const string Host = "https://app.local/";
        private const string RuntimeUrl = "https://go.microsoft.com/fwlink/p/?LinkId=2124703";

        private readonly WebView2 web;
        private readonly byte[] page;
        private FormWindowState prevState;

        public MainForm()
        {
            Text = "G-код ЧПУ";
            Icon = Icon.ExtractAssociatedIcon(Application.ExecutablePath);
            BackColor = Color.FromArgb(0x1C, 0x1C, 0x1A);
            Size = new Size(1280, 800);
            StartPosition = FormStartPosition.CenterScreen;
            WindowState = FormWindowState.Maximized;
            KeyPreview = true;

            using (var s = typeof(MainForm).Assembly.GetManifestResourceStream("index.html"))
            using (var ms = new MemoryStream())
            {
                s.CopyTo(ms);
                page = ms.ToArray();
            }

            web = new WebView2 { Dock = DockStyle.Fill, DefaultBackgroundColor = BackColor };
            Controls.Add(web);
            Load += async (_, _) => await InitAsync();
        }

        private async System.Threading.Tasks.Task InitAsync()
        {
            try
            {
                // Профиль (localStorage: чертёж, настройки) — в AppData, а не рядом с exe
                string data = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "GcodeViewer");
                var env = await CoreWebView2Environment.CreateAsync(null, data);
                await web.EnsureCoreWebView2Async(env);
            }
            catch (WebView2RuntimeNotFoundException)
            {
                if (MessageBox.Show(this, "Не найден компонент Microsoft Edge WebView2 Runtime.\nОткрыть страницу загрузки?",
                        Text, MessageBoxButtons.YesNo, MessageBoxIcon.Error) == DialogResult.Yes)
                {
                    OpenExternal(RuntimeUrl);
                }
                Close();
                return;
            }

            var core = web.CoreWebView2;
            core.Settings.IsStatusBarEnabled = false;
            core.Settings.AreDevToolsEnabled = false;
            core.Settings.IsPasswordAutosaveEnabled = false;
            core.Settings.IsGeneralAutofillEnabled = false;

            core.AddWebResourceRequestedFilter(Host + "*", CoreWebView2WebResourceContext.All);
            core.WebResourceRequested += (_, e) =>
            {
                string path = new Uri(e.Request.Uri).AbsolutePath;
                e.Response = path == "/" || path == "/index.html"
                    ? core.Environment.CreateWebResourceResponse(new MemoryStream(page), 200, "OK",
                        "Content-Type: text/html; charset=utf-8")
                    : core.Environment.CreateWebResourceResponse(null, 404, "Not Found", "");
            };
            core.NewWindowRequested += (_, e) =>
            {
                e.Handled = true;
                OpenExternal(e.Uri);
            };

            // Страница уже умеет сохранять через window.Android.saveFile (как в APK)
            core.AddHostObjectToScript("bridge", new Bridge());
            await core.AddScriptToExecuteOnDocumentCreatedAsync(
                "window.Android={saveFile:function(n,t){return chrome.webview.hostObjects.sync.bridge.SaveFile(n,t)}};");

            core.Navigate(Host + "index.html");
        }

        protected override void OnKeyDown(KeyEventArgs e)
        {
            base.OnKeyDown(e);
            if (e.KeyCode == Keys.F11)
            {
                ToggleFullScreen();
                e.Handled = true;
            }
        }

        private void ToggleFullScreen()
        {
            if (FormBorderStyle == FormBorderStyle.None)
            {
                FormBorderStyle = FormBorderStyle.Sizable;
                WindowState = prevState;
            }
            else
            {
                prevState = WindowState;
                FormBorderStyle = FormBorderStyle.None;
                WindowState = FormWindowState.Normal;
                WindowState = FormWindowState.Maximized;
            }
        }

        private static void OpenExternal(string url)
        {
            try
            {
                Process.Start(new ProcessStartInfo(url) { UseShellExecute = true });
            }
            catch
            {
            }
        }
    }

    [ComVisible(true)]
    [ClassInterface(ClassInterfaceType.AutoDual)]
    public class Bridge
    {
        private const string Subdir = "CNC";

        public string SaveFile(string name, string text)
        {
            string safe = Regex.Replace(name ?? "program", "[\\\\/:*?\"<>|]", "_");
            try
            {
                string dir = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.MyDocuments), Subdir);
                Directory.CreateDirectory(dir);
                File.WriteAllText(Path.Combine(dir, safe), text ?? "", new UTF8Encoding(false));
                return "Сохранено: Документы\\" + Subdir + "\\" + safe;
            }
            catch (Exception e)
            {
                return "Ошибка сохранения: " + e.Message;
            }
        }
    }
}
