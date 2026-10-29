using System;
using System.IO;
using System.Drawing;
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
        private static readonly string AppDataDir = Path.Combine(
            Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
            "SentienceAI", "WordAddin"
        );
        private static readonly string WefDir = Path.Combine(
            Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
            "Microsoft", "Office", "16.0", "Wef"
        );

        private const string ManifestContent = @"<?xml version=""1.0"" encoding=""UTF-8""?>
<OfficeApp xmlns=""http://schemas.microsoft.com/office/appforoffice/1.1""
           xmlns:xsi=""http://www.w3.org/2001/XMLSchema-instance""
           xsi:type=""MailApp"">
  <Id>b720b571-081b-4e38-a7f7-9d6031a56ce2</Id>
  <Version>2.5.0.0</Version>
  <ProviderName>Sentience AI</ProviderName>
  <DefaultLocale>tr-TR</DefaultLocale>
  <DisplayName DefaultValue=""Sentience AI"" />
  <Description DefaultValue=""Akademik bütünlük ve adli bilişim telemetri mühürleme eklentisi"" />
  <IconUrl DefaultValue=""https://sentience-ai-free-2026.web.app/icon-192.png"" />
  <HighResolutionIconUrl DefaultValue=""https://sentience-ai-free-2026.web.app/icon-512.png"" />
  <Hosts>
    <Host Name=""Document"" />
  </Hosts>
  <DefaultSettings>
    <SourceLocation DefaultValue=""https://sentience-ai-free-2026.web.app/word-addin/telemetry-hook.html"" />
  </DefaultSettings>
  <Permissions>ReadWriteDocument</Permissions>
</OfficeApp>";

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

        private void BtnInstall_Click(object sender, EventArgs e)
        {
            try
            {
                progressBar.Visible = true;
                progressBar.Value = 30;

                if (!Directory.Exists(AppDataDir))
                {
                    Directory.CreateDirectory(AppDataDir);
                }

                string manifestFile = Path.Combine(AppDataDir, "manifest.xml");
                File.WriteAllText(manifestFile, ManifestContent);

                if (!Directory.Exists(WefDir))
                {
                    Directory.CreateDirectory(WefDir);
                }
                string wefManifest = Path.Combine(WefDir, "sentience-ai-manifest.xml");
                File.WriteAllText(wefManifest, ManifestContent);

                progressBar.Value = 70;

                string regPath = @"Software\Microsoft\Office\16.0\WEF\TrustedCatalogs\" + CatalogGuid;
                using (var regKey = Registry.CurrentUser.CreateSubKey(regPath))
                {
                    if (regKey != null)
                    {
                        regKey.SetValue("Id", CatalogGuid, RegistryValueKind.String);
                        regKey.SetValue("Url", AppDataDir, RegistryValueKind.String);
                        regKey.SetValue("Flags", 1, RegistryValueKind.DWord);
                    }
                }

                progressBar.Value = 100;
                lblStatus.Text = "Başarılı: Sentience AI Word eklentisi kuruldu!\nWord'ü açıp Ekle -> Eklentilerim kısmından kontrol edebilirsiniz.";
                lblStatus.ForeColor = Color.FromArgb(52, 211, 153);

                MessageBox.Show(
                    "Sentience AI Word Eklentisi başarıyla kuruldu!\n\nMicrosoft Word uygulamasını açıp 'Ekle -> Eklentilerim' bölümünden eklentiyi kullanabilirsiniz.",
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

                string regPath = @"Software\Microsoft\Office\16.0\WEF\TrustedCatalogs\" + CatalogGuid;
                Registry.CurrentUser.DeleteSubKeyTree(regPath, false);

                string wefManifest = Path.Combine(WefDir, "sentience-ai-manifest.xml");
                if (File.Exists(wefManifest))
                {
                    File.Delete(wefManifest);
                }

                if (Directory.Exists(AppDataDir))
                {
                    Directory.Delete(AppDataDir, true);
                }

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
                    if (!Directory.Exists(AppDataDir)) Directory.CreateDirectory(AppDataDir);
                    File.WriteAllText(Path.Combine(AppDataDir, "manifest.xml"), ManifestContent);
                    if (!Directory.Exists(WefDir)) Directory.CreateDirectory(WefDir);
                    File.WriteAllText(Path.Combine(WefDir, "sentience-ai-manifest.xml"), ManifestContent);

                    using (var regKey = Registry.CurrentUser.CreateSubKey(@"Software\Microsoft\Office\16.0\WEF\TrustedCatalogs\" + CatalogGuid))
                    {
                        if (regKey != null)
                        {
                            regKey.SetValue("Id", CatalogGuid, RegistryValueKind.String);
                            regKey.SetValue("Url", AppDataDir, RegistryValueKind.String);
                            regKey.SetValue("Flags", 1, RegistryValueKind.DWord);
                        }
                    }
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
