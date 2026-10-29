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

  function generateHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash |= 0;
    }
    return Math.abs(hash).toString(16).padStart(8, "0");
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
    if (!isOfficeReady || typeof Word === "undefined") {
      updateStatus("Word API henüz hazır değil.", true);
      return;
    }

    const uidInput = document.getElementById("student-uid");
    const nameInput = document.getElementById("student-name");

    const uid = uidInput && uidInput.value.trim() ? uidInput.value.trim() : (localStorage.getItem("sentience_uid") || "anonymous_student");
    const name = nameInput && nameInput.value.trim() ? nameInput.value.trim() : (localStorage.getItem("sentience_name") || "Bilinmeyen Öğrenci");
    const sessionId = "sess_" + Math.random().toString(36).substring(2, 10);
    const timestamp = new Date().toISOString();
    const hash = generateHash(uid + ":" + sessionId + ":" + timestamp);

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

      localStorage.setItem("sentience_uid", uid);
      localStorage.setItem("sentience_name", name);

      updateStatus("Mühür Başarılı!\nOturum: " + sessionId + "\nZaman: " + timestamp + "\nİmza: " + hash);
    } catch (err) {
      updateStatus("Mühürleme hatası: " + (err && err.message ? err.message : String(err)), true);
    }
  }

  Office.onReady((info) => {
    if (info.host === Office.HostType.Word) {
      isOfficeReady = true;
      autoFillCredentials();
      updateStatus("Word entegrasyonu aktif. Otomatik mühür hazırlanıyor...");

      sealDocument(true);

      const btn = document.getElementById("btn-seal");
      if (btn) {
        btn.addEventListener("click", () => sealDocument(false));
      }
    } else {
      updateStatus("Bu eklenti yalnızca Microsoft Word içinde çalışır.", true);
    }
  });
})();
