using System;
using System.IO;
using System.Drawing;
using System.Text;
using System.Windows.Forms;
using Microsoft.Win32;

namespace SentienceAI.WordSetup
{
    public class SetupForm : Form
    {
        private Label lblTitle;
        private Label lblDesc;
        private Label lblStatus;
        private Button btnInstall;
        private Button btnUninstall;
        private Button btnExit;
        private ProgressBar progressBar;

        private const string CatalogGuid = "{B720B571-081B-4E38-A7F7-9D6031A56CE2}";
        private const string ManifestId = "{b720b571-081b-4e38-a7f7-9d6031a56ce2}";

        private static readonly string AppDataDir = Path.Combine(
            Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
            "SentienceAI", "WordAddin"
        );
        private static readonly string WefDir = Path.Combine(
            Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
            "Microsoft", "Office", "16.0", "Wef"
        );

        private const string ManifestXml = "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\r\n" +
"<OfficeApp xmlns=\"http://schemas.microsoft.com/office/appforoffice/1.1\"\r\n" +
"           xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\"\r\n" +
"           xsi:type=\"TaskPaneApp\">\r\n" +
"  <Id>b720b571-081b-4e38-a7f7-9d6031a56ce2</Id>\r\n" +
"  <Version>2.5.0.0</Version>\r\n" +
"  <ProviderName>Sentience AI</ProviderName>\r\n" +
"  <DefaultLocale>en-US</DefaultLocale>\r\n" +
"  <DisplayName DefaultValue=\"Sentience AI\" />\r\n" +
"  <Description DefaultValue=\"Sentience AI Academic Integrity and Forensics Add-in\" />\r\n" +
"  <IconUrl DefaultValue=\"https://sentience-ai-free-2026.web.app/icon-32.png\" />\r\n" +
"  <HighResolutionIconUrl DefaultValue=\"https://sentience-ai-free-2026.web.app/icon-80.png\" />\r\n" +
"  <SupportUrl DefaultValue=\"https://sentience-ai-free-2026.web.app/guide#word-eklentisi-masaustu-kurulumu\" />\r\n" +
"  <AppDomains>\r\n" +
"    <AppDomain>https://sentience-ai-free-2026.web.app</AppDomain>\r\n" +
"  </AppDomains>\r\n" +
"  <Hosts>\r\n" +
"    <Host Name=\"Document\" />\r\n" +
"  </Hosts>\r\n" +
"  <DefaultSettings>\r\n" +
"    <SourceLocation DefaultValue=\"https://sentience-ai-free-2026.web.app/word-addin/telemetry-hook.html\" />\r\n" +
"  </DefaultSettings>\r\n" +
"  <Permissions>ReadWriteDocument</Permissions>\r\n" +
"</OfficeApp>";

        public SetupForm()
        {
            InitializeComponent();
            CheckOfficeEnvironment();
        }

        private void InitializeComponent()
        {
            this.Text = "Sentience AI — Word Eklentisi Kurulumu";
            this.Size = new Size(500, 340);
            this.StartPosition = FormStartPosition.CenterScreen;
            this.FormBorderStyle = FormBorderStyle.FixedDialog;
            this.MaximizeBox = false;
            this.BackColor = Color.FromArgb(15, 20, 26);
            this.ForeColor = Color.White;
            this.Font = new Font("Segoe UI", 9.5f, FontStyle.Regular);

            lblTitle = new Label
            {
                Text = "SENTIENCE AI — WORD ADD-IN",
                Font = new Font("Segoe UI", 13f, FontStyle.Bold),
                ForeColor = Color.FromArgb(16, 185, 129),
                Location = new Point(24, 20),
                AutoSize = true
            };

            lblDesc = new Label
            {
                Text = "Microsoft Word için Adli Bilişim & Telemetri Mühürleme eklentisini bu bilgisayara kurun veya kaldırın.",
                Location = new Point(24, 60),
                Size = new Size(436, 45),
                ForeColor = Color.FromArgb(156, 163, 175)
            };

            lblStatus = new Label
            {
                Text = "Durum: Kontrol ediliyor...",
                Location = new Point(24, 120),
                Size = new Size(436, 40),
                ForeColor = Color.FromArgb(209, 213, 219)
            };

            progressBar = new ProgressBar
            {
                Location = new Point(24, 175),
                Size = new Size(436, 12),
                Visible = false
            };

            btnInstall = new Button
            {
                Text = "Eklentiyi Kur",
                Font = new Font("Segoe UI", 9.5f, FontStyle.Bold),
                BackColor = Color.FromArgb(16, 185, 129),
                ForeColor = Color.Black,
                FlatStyle = FlatStyle.Flat,
                Location = new Point(24, 215),
                Size = new Size(135, 42),
                Cursor = Cursors.Hand
            };
            btnInstall.FlatAppearance.BorderSize = 0;
            btnInstall.Click += BtnInstall_Click;

            btnUninstall = new Button
            {
                Text = "Eklentiyi Kaldır",
                Font = new Font("Segoe UI", 9.5f, FontStyle.Bold),
                BackColor = Color.FromArgb(31, 41, 55),
                ForeColor = Color.FromArgb(239, 68, 68),
                FlatStyle = FlatStyle.Flat,
                Location = new Point(170, 215),
                Size = new Size(135, 42),
                Cursor = Cursors.Hand
            };
            btnUninstall.FlatAppearance.BorderColor = Color.FromArgb(239, 68, 68);
            btnUninstall.Click += BtnUninstall_Click;

            btnExit = new Button
            {
                Text = "Kapat",
                BackColor = Color.FromArgb(31, 41, 55),
                ForeColor = Color.FromArgb(156, 163, 175),
                FlatStyle = FlatStyle.Flat,
                Location = new Point(345, 215),
                Size = new Size(115, 42),
                Cursor = Cursors.Hand
            };
            btnExit.FlatAppearance.BorderSize = 0;
            btnExit.Click += (s, e) => this.Close();

            this.Controls.Add(lblTitle);
            this.Controls.Add(lblDesc);
            this.Controls.Add(lblStatus);
            this.Controls.Add(progressBar);
            this.Controls.Add(btnInstall);
            this.Controls.Add(btnUninstall);
            this.Controls.Add(btnExit);
        }

        private void CheckOfficeEnvironment()
        {
            try
            {
                using (var key = Registry.CurrentUser.OpenSubKey(@"Software\Microsoft\Office\16.0\Word"))
                {
                    if (key != null)
                    {
                        lblStatus.Text = "Tespit: Microsoft Word (Office 2016/2019/2021/365) hazır.";
                        lblStatus.ForeColor = Color.FromArgb(52, 211, 153);
                        return;
                    }
                }
                lblStatus.Text = "Bilgi: Standart Office 16.0 dizinleri kullanılarak kurulum yapılacaktır.";
                lblStatus.ForeColor = Color.FromArgb(251, 191, 36);
            }
            catch
            {
                lblStatus.Text = "Durum: Hazır.";
            }
        }

        public static void PerformInstall()
        {
            if (!Directory.Exists(AppDataDir))
            {
                Directory.CreateDirectory(AppDataDir);
            }

            string manifestPath = Path.Combine(AppDataDir, "manifest.xml");
            Encoding utf8WithoutBom = new UTF8Encoding(false);
            File.WriteAllText(manifestPath, ManifestXml, utf8WithoutBom);

            if (!Directory.Exists(WefDir))
            {
                Directory.CreateDirectory(WefDir);
            }
            File.WriteAllText(Path.Combine(WefDir, "manifest.xml"), ManifestXml, utf8WithoutBom);
            File.WriteAllText(Path.Combine(WefDir, "sentience-ai-manifest.xml"), ManifestXml, utf8WithoutBom);
            File.WriteAllText(Path.Combine(WefDir, "b720b571-081b-4e38-a7f7-9d6031a56ce2.xml"), ManifestXml, utf8WithoutBom);

            string[] subDirs = Directory.GetDirectories(WefDir, "{*}");
            foreach (string sd in subDirs)
            {
                try
                {
                    string[] innerDirs = Directory.GetDirectories(sd);
                    foreach (string id in innerDirs)
                    {
                        string mDir = Path.Combine(id, "Manifests");
                        if (Directory.Exists(mDir))
                        {
                            File.WriteAllText(Path.Combine(mDir, "manifest.xml"), ManifestXml, utf8WithoutBom);
                            File.WriteAllText(Path.Combine(mDir, "sentience-ai-manifest.xml"), ManifestXml, utf8WithoutBom);
                        }
                    }
                }
                catch { }
            }

            char drive = AppDataDir[0];
            string uncPath = @"\\localhost\" + drive + "$" + AppDataDir.Substring(2);
            string catReg = @"Software\Microsoft\Office\16.0\WEF\TrustedCatalogs\" + CatalogGuid;
            using (var regKey = Registry.CurrentUser.CreateSubKey(catReg))
            {
                if (regKey != null)
                {
                    regKey.SetValue("Id", CatalogGuid, RegistryValueKind.String);
                    regKey.SetValue("Url", uncPath, RegistryValueKind.String);
                    regKey.SetValue("Flags", 1, RegistryValueKind.DWord);
                }
            }

            string devReg = @"Software\Microsoft\Office\16.0\WEF\Developer";
            using (var devKey = Registry.CurrentUser.CreateSubKey(devReg))
            {
                if (devKey != null)
                {
                    devKey.SetValue(ManifestId, manifestPath, RegistryValueKind.String);
                }
            }
        }

        public static void PerformUninstall()
        {
            try
            {
                string catReg = @"Software\Microsoft\Office\16.0\WEF\TrustedCatalogs\" + CatalogGuid;
                Registry.CurrentUser.DeleteSubKeyTree(catReg, false);
            }
            catch { }

            try
            {
                string devReg = @"Software\Microsoft\Office\16.0\WEF\Developer";
                using (var devKey = Registry.CurrentUser.OpenSubKey(devReg, true))
                {
                    if (devKey != null)
                    {
                        devKey.DeleteValue(ManifestId, false);
                    }
                }
            }
            catch { }

            try
            {
                if (Directory.Exists(AppDataDir))
                {
                    Directory.Delete(AppDataDir, true);
                }
            }
            catch { }

            try
            {
                string[] filesToRemove = { "manifest.xml", "sentience-ai-manifest.xml", "b720b571-081b-4e38-a7f7-9d6031a56ce2.xml" };
                foreach (string file in filesToRemove)
                {
                    string p = Path.Combine(WefDir, file);
                    if (File.Exists(p)) File.Delete(p);
                }
            }
            catch { }
        }

        private void BtnInstall_Click(object sender, EventArgs e)
        {
            try
            {
                progressBar.Visible = true;
                progressBar.Value = 30;

                PerformInstall();

                progressBar.Value = 100;
                lblStatus.Text = "Başarılı: Sentience AI Word eklentisi kuruldu!\nWord'ü açıp Ekle -> Eklentilerim kısmından kontrol edebilirsiniz.";
                lblStatus.ForeColor = Color.FromArgb(52, 211, 153);

                MessageBox.Show(
                    "Sentience AI Word Eklentisi başarıyla kuruldu!\n\nMicrosoft Word uygulamasını açıp 'Ekle -> Eklentilerim -> Paylaşılan Klasör' bölümünden eklentiyi kullanabilirsiniz.",
                    "Kurulum Tamamlandı",
                    MessageBoxButtons.OK,
                    MessageBoxIcon.Information
                );
            }
            catch (Exception ex)
            {
                lblStatus.Text = "Hata: " + ex.Message;
                lblStatus.ForeColor = Color.FromArgb(239, 68, 68);
                MessageBox.Show("Kurulum sırasında bir hata oluştu:\n" + ex.Message, "Hata", MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
        }

        private void BtnUninstall_Click(object sender, EventArgs e)
        {
            try
            {
                progressBar.Visible = true;
                progressBar.Value = 50;

                PerformUninstall();

                progressBar.Value = 100;
                lblStatus.Text = "Eklenti bu bilgisayardan başarıyla kaldırıldı.";
                lblStatus.ForeColor = Color.FromArgb(156, 163, 175);

                MessageBox.Show(
                    "Sentience AI Word eklentisi başarıyla kaldırıldı.",
                    "Kaldırma Tamamlandı",
                    MessageBoxButtons.OK,
                    MessageBoxIcon.Information
                );
            }
            catch (Exception ex)
            {
                lblStatus.Text = "Hata: " + ex.Message;
                lblStatus.ForeColor = Color.FromArgb(239, 68, 68);
            }
        }

        [STAThread]
        public static void Main(string[] args)
        {
            if (args.Length > 0 && (args[0] == "/silent" || args[0] == "/quiet"))
            {
                try
                {
                    PerformInstall();
                    Environment.Exit(0);
                }
                catch
                {
                    Environment.Exit(1);
                }
            }

            Application.EnableVisualStyles();
            Application.SetCompatibleTextRenderingDefault(false);
            Application.Run(new SetupForm());
        }
    }
}
