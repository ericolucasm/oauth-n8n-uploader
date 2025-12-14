let accessToken = null;
let provider = null;
let userEmail = null;
let selectedFile = null;
let selectedRemoteFile = null;

/* =======================
   FLUXO DE TELA
======================= */
function escolherDispositivo() {
  resetUI();
  document.getElementById("upload-local").style.display = "block";
  document.getElementById("upload-actions").style.display = "block";
  document.getElementById("home-options").style.display = "none";
  document.getElementById("voltar-home").style.display = "block";
}

function escolherNuvem() {
  resetUI();
  document.getElementById("upload-nuvem").style.display = "block";
  document.getElementById("home-options").style.display = "none";
  document.getElementById("voltar-home").style.display = "block";
}

function voltarParaHome() {
  resetUI();
  document.getElementById("home-options").style.display = "block";
  document.getElementById("voltar-home").style.display = "none";
}

/* =======================
   LOGIN GOOGLE (APENAS GOOGLE)
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
   TOKEN (SÓ GOOGLE)
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
   EMAIL GOOGLE
======================= */
async function fetchUserEmail() {
  if (!accessToken || provider !== "google") return;

  try {
    const res = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    const data = await res.json();
    userEmail = data.email;
  } catch (e) {
    console.error("Erro ao buscar e-mail:", e);
  }
}

/* =======================
   UPLOAD LOCAL
======================= */
function setupUploadHandler() {
  const fileInput = document.getElementById("file");
  const fileNameDisplay = document.getElementById("file-name");
  const uploadButton = document.getElementById("upload-btn");

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
    formData.append("provider", selectedRemoteFile?.provider || "local");

    if (selectedFile) formData.append("file", selectedFile);
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
        voltarParaHome();
      } else {
        alert("❌ Falha ao enviar o arquivo.");
      }
    } catch (error) {
      alert("❌ Erro ao enviar: " + error.message);
    }
  });
}

/* =======================
   GOOGLE PICKER
======================= */
const GOOGLE_API_KEY = "AIzaSyANw8oeQfWLNwH153Rj_O5DXTCBjxTt7_I";

function openGooglePicker() {
  if (!accessToken) {
    alert("Faça login com Google primeiro.");
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

    document.getElementById("file-name").textContent =
      `☁ Google Drive: ${file.name}`;

    document.getElementById("upload-btn").style.display = "block";
  }
}

/* =======================
   ONEDRIVE PICKER (FORMA CORRETA)
======================= */
function openOneDrivePicker() {
  OneDrive.open({
    clientId: "218686d6-0f9f-43fd-be66-b51283579215",
    action: "query",
    multiSelect: false,
    openInNewWindow: true,
    success: function (files) {
      const file = files.value[0];

      selectedFile = null;
      selectedRemoteFile = {
        provider: "microsoft",
        fileId: file.id,
        fileName: file.name,
        downloadUrl: file["@microsoft.graph.downloadUrl"]
      };

      document.getElementById("file-name").textContent =
        `☁ OneDrive: ${file.name}`;

      document.getElementById("upload-btn").style.display = "block";
    },
    cancel: function () {},
    error: function (e) {
      console.error(e);
      alert("Erro ao abrir OneDrive Picker");
    }
  });
}

/* =======================
   RESET UI
======================= */
function resetUI() {
  document.getElementById("auth-buttons").style.display = "none";
  document.getElementById("upload-local").style.display = "none";
  document.getElementById("upload-nuvem").style.display = "none";
  document.getElementById("upload-actions").style.display = "none";
  document.getElementById("file-name").textContent = "";
  document.getElementById("file").value = "";
  selectedFile = null;
  selectedRemoteFile = null;
}

/* =======================
   INIT
======================= */
window.onload = async () => {
  setupUploadHandler();
  extractTokenFromHash();

  if (accessToken && provider === "google") {
    await fetchUserEmail();
  }
};



