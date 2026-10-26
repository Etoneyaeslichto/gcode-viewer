using System;
using System.Diagnostics;
using System.Drawing;
using System.IO;
using System.Net.Http;
using System.Runtime.InteropServices;
using System.Text;
using System.Text.Json;
using System.Text.RegularExpressions;
using System.Threading;
using System.Threading.Tasks;
using System.Windows.Forms;
using Microsoft.Web.WebView2.Core;
using Microsoft.Web.WebView2.WinForms;

namespace GcodeViewer
{
    static class Program
    {
        public static readonly string UpdateDir = Path.Combine(
            Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "GcodeViewer", "update");

        [STAThread]
        static void Main(string[] args)
        {
            ApplicationConfiguration.Initialize();
            // Копия программы как установщик: дождаться закрытия, заменить файл скачанным и запустить
            if (args.Length == 4 && args[0] == "--replace")
            {
                Replace(args[1], args[2], args[3]);
                return;
            }
            try
            {
                if (Directory.Exists(UpdateDir))
                {
                    Directory.Delete(UpdateDir, true);
                }
            }
            catch
            {
            }
            Application.Run(new MainForm());
        }

        private static void Replace(string target, string pid, string source)
        {
            try
            {
                Process.GetProcessById(int.Parse(pid)).WaitForExit(20000);
            }
            catch
            {
            }
            for (int i = 0; ; i++)
            {
                try
                {
                    File.Copy(source, target, true);
                    break;
                }
                catch (Exception e)
                {
                    if (i >= 20)
                    {
                        MessageBox.Show("Не удалось заменить файл программы:\n" + e.Message +
                            "\n\nНовая версия сохранена здесь:\n" + source, "G-код ЧПУ",
                            MessageBoxButtons.OK, MessageBoxIcon.Error);
                        return;
                    }
                    Thread.Sleep(500);
                }
            }
            Process.Start(new ProcessStartInfo(target) { UseShellExecute = true });
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
            core.AddHostObjectToScript("bridge", new Bridge(this));
            await core.AddScriptToExecuteOnDocumentCreatedAsync(
                "(function(b){window.Android={saveFile:function(n,t){return b.SaveFile(n,t)}," +
                "getVersion:function(){return b.GetVersion()},openUrl:function(u){b.OpenUrl(u)}," +
                "installUpdate:function(u){b.InstallUpdate(u)}}})(chrome.webview.hostObjects.sync.bridge);");

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

        // Состояние обновления для страницы: p — проценты, i — сообщение, err — ошибка
        internal void Report(string state, string value)
        {
            string js = "window.updProgress&&updProgress(" + JsonSerializer.Serialize(state) + "," +
                JsonSerializer.Serialize(value) + ")";
            BeginInvoke(() => web.CoreWebView2?.ExecuteScriptAsync(js));
        }

        internal void RestartInto(string exe)
        {
            BeginInvoke(() =>
            {
                try
                {
                    string updater = Path.Combine(Program.UpdateDir, "updater.exe");
                    File.Copy(Environment.ProcessPath, updater, true);
                    var psi = new ProcessStartInfo(updater) { UseShellExecute = false };
                    psi.ArgumentList.Add("--replace");
                    psi.ArgumentList.Add(Environment.ProcessPath);
                    psi.ArgumentList.Add(Environment.ProcessId.ToString());
                    psi.ArgumentList.Add(exe);
                    Process.Start(psi);
                    Close();
                }
                catch (Exception e)
                {
                    Report("err", e.Message);
                }
            });
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

        private readonly MainForm form;
        private bool busy;

        internal Bridge(MainForm form)
        {
            this.form = form;
        }

        public void InstallUpdate(string url)
        {
            if (busy || url == null || !url.StartsWith("https://"))
            {
                return;
            }
            busy = true;
            Task.Run(async () =>
            {
                try
                {
                    Directory.CreateDirectory(Program.UpdateDir);
                    string exe = Path.Combine(Program.UpdateDir, "GcodeViewer.exe");
                    using (var http = new HttpClient())
                    {
                        http.DefaultRequestHeaders.UserAgent.ParseAdd("GcodeViewer");
                        using var resp = await http.GetAsync(url, HttpCompletionOption.ResponseHeadersRead);
                        resp.EnsureSuccessStatusCode();
                        long total = resp.Content.Headers.ContentLength ?? 0, done = 0;
                        int last = -1;
                        using var src = await resp.Content.ReadAsStreamAsync();
                        using var dst = File.Create(exe);
                        var buf = new byte[81920];
                        int n;
                        while ((n = await src.ReadAsync(buf)) > 0)
                        {
                            await dst.WriteAsync(buf.AsMemory(0, n));
                            done += n;
                            int pct = total > 0 ? (int)(done * 100 / total) : 0;
                            if (pct != last)
                            {
                                last = pct;
                                form.Report("p", pct.ToString());
                            }
                        }
                        if (done < 1_000_000)
                        {
                            throw new IOException("файл обновления повреждён");
                        }
                    }
                    form.Report("i", "Устанавливаю, программа перезапустится…");
                    form.RestartInto(exe);
                }
                catch (Exception e)
                {
                    busy = false;
                    form.Report("err", e.Message);
                }
            });
        }

        public string GetVersion()
        {
            return Application.ProductVersion.Split('+')[0];
        }

        public void OpenUrl(string url)
        {
            if (url != null && url.StartsWith("https://"))
            {
                Process.Start(new ProcessStartInfo(url) { UseShellExecute = true });
            }
        }

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
