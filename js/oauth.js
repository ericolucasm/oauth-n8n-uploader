let accessToken = null;
let provider = null;
let userEmail = null;
let selectedFile = null;
let selectedRemoteFile = null;

/* =======================
   LOGIN GOOGLE
======================= */
function loginWithGoogle() {
  const clientId = '718961920868-s0tjl2judu6hurbg9glq3nlop9coqog1.apps.googleusercontent.com';
  const redirectUri = window.location.origin + '/';
  const scope = 'https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/drive.readonly';

  sessionStorage.setItem('provider', 'google');

  const authUrl =
    `https://accounts.google.com/o/oauth2/v2/auth` +
    `?response_type=token` +
    `&client_id=${clientId}` +
    `&redirect_uri=${redirectUri}` +
    `&scope=${encodeURIComponent(scope)}`;

  window.location.href = authUrl;
}

/* =======================
   LOGIN MICROSOFT
======================= */
function loginWithMicrosoft() {
  const clientId = '218686d6-0f9f-43fd-be66-b51283579215';
  const redirectUri = window.location.origin + '/';
  const scope = 'Files.Read User.Read';

  sessionStorage.setItem('provider', 'microsoft');

  const authUrl =
    `https://login.microsoftonline.com/common/oauth2/v2.0/authorize` +
    `?response_type=token` +
    `&client_id=${clientId}` +
    `&redirect_uri=${redirectUri}` +
    `&scope=${encodeURIComponent(scope)}`;

  window.location.href = authUrl;
}

/* =======================
   TOKEN
======================= */
function extractTokenFromHash() {
  const hash = window.location.hash.substring(1);
  const params = new URLSearchParams(hash);

  accessToken = params.get("access_token");
  provider = sessionStorage.getItem("provider");

  if (accessToken) {
    window.history.replaceState({}, document.title, window.location.pathname);
  }
}

/* =======================
   BUSCA EMAIL
======================= */
async function fetchUserEmail() {
  if (!accessToken || !provider) return;

  try {
    if (provider === 'google') {
      const res = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      const data = await res.json();
      userEmail = data.email;
    } else if (provider === 'microsoft') {
      const res = await fetch('https://graph.microsoft.com/v1.0/me', {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      const data = await res.json();
      userEmail = data.mail || data.userPrincipalName;
    }
  } catch (e) {
    console.error("Erro ao buscar e-mail:", e);
  }
}

/* =======================
   UI para nuvem
======================= */
function enableCloudUploadUI() {
  const cloudBtn = document.getElementById("cloud-picker-btn");

  if (provider === "google") {
    cloudBtn.style.display = "block";
    cloudBtn.onclick = openGooglePicker;
  }

  if (provider === "microsoft") {
    cloudBtn.style.display = "block";
    cloudBtn.onclick = openOneDrivePicker;
  }
}

/* =======================
   UPLOAD
======================= */
function setupUploadHandler() {
  const fileInput = document.getElementById("file");
  const fileNameDisplay = document.getElementById("file-name");
  const uploadButton = document.getElementById("upload-btn");

  if (!fileInput || !uploadButton) return;

  fileInput.addEventListener("change", (event) => {
    selectedFile = event.target.files[0];
    selectedRemoteFile = null;
    fileNameDisplay.textContent = selectedFile ? `📎 ${selectedFile.name}` : "";
    uploadButton.style.display = selectedFile ? "block" : "none";
  });

  uploadButton.addEventListener("click", async () => {
    if (!selectedFile && !selectedRemoteFile) {
      alert("Selecione um arquivo primeiro!");
      return;
    }

    const formData = new FormData();
    formData.append("userEmail", userEmail || "sem-login");
    formData.append("provider", provider || "local");

    if (selectedFile) {
      formData.append("file", selectedFile);
    }

    if (selectedRemoteFile) {
      formData.append("remoteFile", JSON.stringify(selectedRemoteFile));
    }

    try {
      const res = await fetch(
        "https://ericopessoal.app.n8n.cloud/webhook-test/document_input",
        { method: "POST", body: formData }
      );

      if (res.ok) {
        alert("✅ Arquivo enviado com sucesso!");
        fileNameDisplay.textContent = "";
        fileInput.value = "";
        uploadButton.style.display = "none";
        selectedFile = null;
        selectedRemoteFile = null;
      } else {
        alert("❌ Falha ao enviar o arquivo.");
      }
    } catch (error) {
      alert("❌ Erro ao enviar: " + error.message);
    }
  });
}

/* =======================
   INIT
======================= */
window.onload = async () => {
  setupUploadHandler();         // sempre ativo
  extractTokenFromHash();       // verifica se houve login

  if (accessToken) {
    await fetchUserEmail();
    enableCloudUploadUI();     // só se logado
  }
};

/* =======================
   GOOGLE DRIVE PICKER
======================= */
const GOOGLE_API_KEY = "AIzaSyANw8oeQfWLNwH153Rj_O5DXTCBjxTt7_I";

function openGooglePicker() {
  if (!accessToken) {
    alert("Você precisa estar logado com Google.");
    return;
  }

  gapi.load("picker", () => {
    const view = new google.picker.View(google.picker.ViewId.DOCS);

    const picker = new google.picker.PickerBuilder()
      .setDeveloperKey(GOOGLE_API_KEY)
      .setOAuthToken(accessToken)
      .addView(view)
      .setCallback(googlePickerCallback)
      .build();

    picker.setVisible(true);
  });
}

function googlePickerCallback(data) {
  if (data.action === google.picker.Action.PICKED) {
    const file = data.docs[0];

    selectedFile = null;
    selectedRemoteFile = {
      provider: "google",
      fileId: file.id,
      fileName: file.name,
      mimeType: file.mimeType
    };

    document.getElementById("file-name").textContent = `☁ Google Drive: ${file.name}`;
    document.getElementById("upload-btn").style.display = "block";
  }
}

/* =======================
   ONEDRIVE PICKER
======================= */
function openOneDrivePicker() {
  if (!accessToken) {
    alert("Você precisa estar logado com Microsoft.");
    return;
  }

  OneDrive.open({
    clientId: "218686d6-0f9f-43fd-be66-b51283579215",
    action: "query",
    multiSelect: false,
    advanced: { accessToken: accessToken },
    success: function (files) {
      const file = files.value[0];

      selectedFile = null;
      selectedRemoteFile = {
        provider: "microsoft",
        fileId: file.id,
        fileName: file.name,
        downloadUrl: file["@microsoft.graph.downloadUrl"]
      };

      document.getElementById("file-name").textContent = `☁ OneDrive: ${file.name}`;
      document.getElementById("upload-btn").style.display = "block";
    },
    cancel: function () {},
    error: function (e) {
      alert("Erro ao abrir OneDrive Picker");
      console.error(e);
    }
  });
}


