(function () {
  let isOfficeReady = false;

  function updateStatus(text, isError = false) {
    const box = document.getElementById("log-box");
    const badge = document.getElementById("status-badge");
    if (box) {
      box.textContent = text;
      box.style.borderColor = isError ? "#ef4444" : "#10b981";
    }
    if (badge) {
      badge.textContent = isError ? "Hata" : "Bağlı";
      badge.style.background = isError ? "#ef4444" : "#10b981";
    }
  }

  function padZero(str, len) {
    var s = String(str);
    while (s.length < len) {
      s = "0" + s;
    }
    return s;
  }

  function generateHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash |= 0;
    }
    return padZero(Math.abs(hash).toString(16), 8);
  }

  function autoFillCredentials() {
    const savedUid = localStorage.getItem("sentience_uid");
    const savedName = localStorage.getItem("sentience_name");
    const uidInput = document.getElementById("student-uid");
    const nameInput = document.getElementById("student-name");

    if (savedUid && uidInput) uidInput.value = savedUid;
    if (savedName && nameInput) nameInput.value = savedName;
  }

  async function sealDocument(silent = false) {
    const uidInput = document.getElementById("student-uid");
    const nameInput = document.getElementById("student-name");

    const uid = uidInput && uidInput.value.trim() ? uidInput.value.trim() : (localStorage.getItem("sentience_uid") || "anonymous_student");
    const name = nameInput && nameInput.value.trim() ? nameInput.value.trim() : (localStorage.getItem("sentience_name") || "Bilinmeyen Öğrenci");
    const sessionId = "sess_" + Math.random().toString(36).substring(2, 10);
    const timestamp = new Date().toISOString();
    const hash = generateHash(uid + ":" + sessionId + ":" + timestamp);

    localStorage.setItem("sentience_uid", uid);
    localStorage.setItem("sentience_name", name);

    updateStatus("Mühürleniyor, lütfen bekleyin...");

    if (typeof Word !== "undefined" && typeof Word.run === "function") {
      try {
        await Word.run(async (context) => {
          const customProps = context.document.properties.customProperties;
          customProps.load("items");
          await context.sync();

          customProps.add("sentience_student_uid", uid);
          customProps.add("sentience_student_name", name);
          customProps.add("sentience_session_id", sessionId);
          customProps.add("sentience_seal_timestamp", timestamp);
          customProps.add("sentience_seal_hash", hash);

          await context.sync();
        });

        updateStatus("✓ Mühür Başarılı!\nOturum: " + sessionId + "\nÖğrenci: " + name + "\nUID: " + uid + "\nİmza: " + hash);
        return;
      } catch (err) {
        console.warn("Word.run customProperties hatası:", err);
      }
    }

    if (typeof Office !== "undefined" && Office.context && Office.context.document && Office.context.document.settings) {
      try {
        Office.context.document.settings.set("sentience_student_uid", uid);
        Office.context.document.settings.set("sentience_student_name", name);
        Office.context.document.settings.set("sentience_session_id", sessionId);
        Office.context.document.settings.set("sentience_seal_timestamp", timestamp);
        Office.context.document.settings.set("sentience_seal_hash", hash);
        Office.context.document.settings.saveAsync((asyncResult) => {
          if (asyncResult.status === Office.AsyncResultStatus.Succeeded) {
            updateStatus("✓ Mühür Başarılı (Office Settings)!\nOturum: " + sessionId + "\nÖğrenci: " + name + "\nUID: " + uid);
          } else {
            updateStatus("Ayarlar kaydedilemedi: " + (asyncResult.error ? asyncResult.error.message : "Bilinmeyen hata"), true);
          }
        });
        return;
      } catch (err) {
        console.warn("Office.context settings hatası:", err);
      }
    }

    updateStatus("✓ Kimlik ve Oturum Kaydedildi!\n(Belgeyi kaydetmek için Ctrl+S yapınız)\nOturum: " + sessionId + "\nUID: " + uid);
  }

  function setupHooks() {
    autoFillCredentials();
    const btn = document.getElementById("btn-seal");
    if (btn) {
      btn.onclick = () => sealDocument(false);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", setupHooks);
  } else {
    setupHooks();
  }

  if (typeof Office !== "undefined" && Office.onReady) {
    Office.onReady((info) => {
      isOfficeReady = true;
      if (info.host === Office.HostType.Word) {
        updateStatus("Word entegrasyonu hazır. Bilgileri onaylayıp mühürleyebilirsiniz.");
      } else {
        updateStatus("Office bağlantısı kuruldu.");
      }
    });
  }
})();
