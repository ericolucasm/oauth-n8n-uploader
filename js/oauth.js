let accessToken = null;
let provider = null;
let userEmail = null;
let selectedFile = null;
let selectedRemoteFile = null;
let googlePickerLoaded = false;

/* FLUXO DE TELA */
function escolherDispositivo() {
  resetUI();
  document.getElementById("upload-local").style.display = "block";
  document.getElementById("upload-actions").style.display = "block";
  document.getElementById("home-options").style.display = "none";
  document.getElementById("voltar-home").style.display = "block";
}

function escolherNuvem() {
  resetUI();
  document.getElementById("auth-buttons").style.display = "block";
  document.getElementById("home-options").style.display = "none";
  document.getElementById("voltar-home").style.display = "block";
}

function voltarParaHome() {
  resetUI();
  document.getElementById("home-options").style.display = "block";
  document.getElementById("voltar-home").style.display = "none";
}

/* LOGIN GOOGLE */
function loginWithGoogle() {
  const clientId = "718961920868-s0tjl2judu6hurbg9glq3nlop9coqog1.apps.googleusercontent.com";
  const redirectUri = window.location.origin + "/";
  const scope = "https://www.googleapis.com/auth/drive.readonly https://www.googleapis.com/auth/userinfo.email";

  sessionStorage.setItem("provider", "google");

  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?response_type=token&client_id=${clientId}&redirect_uri=${redirectUri}&scope=${encodeURIComponent(scope)}`;

  window.location.href = authUrl;
}

/* TOKEN */
function extractTokenFromHash() {
  const hash = window.location.hash.substring(1);
  const params = new URLSearchParams(hash);

  accessToken = params.get("access_token");
  provider = sessionStorage.getItem("provider");

  if (accessToken) {
    window.history.replaceState({}, document.title, window.location.pathname);
  }
}

/* EMAIL */
async function fetchUserEmail() {
  if (!accessToken || !provider) return;

  if (provider === "google") {
    const res = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const data = await res.json();
    userEmail = data.email;
  }
}

/* ENVIAR */
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
    formData.append("provider", provider || "local");

    if (selectedFile) {
      formData.append("data", selectedFile);
    }

    if (selectedRemoteFile) {
      formData.append("remoteFile", JSON.stringify(selectedRemoteFile));
    }

    try {
      const res = await fetch("https://ericopessoal.app.n8n.cloud/webhook/febc1a1f-f40c-4d15-a098-aad161cd0fa0", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        alert("✅ Arquivo enviado com sucesso!");
        resetUI();
        voltarParaHome();
      } else {
        alert("❌ Falha ao enviar o arquivo.");
      }
    } catch (error) {
      alert("❌ Erro ao enviar: " + error.message);
    }
  });
}

/* GOOGLE PICKER */
function loadPickerScript() {
  if (googlePickerLoaded) return;

  gapi.load("picker", { callback: () => (googlePickerLoaded = true) });
}

function showGooglePicker() {
  if (!accessToken || !googlePickerLoaded) return;

  const view = new google.picker.DocsView()
    .setIncludeFolders(true)
    .setSelectFolderEnabled(false)
    .setMode(google.picker.DocsViewMode.LIST);

  const picker = new google.picker.PickerBuilder()
    .addView(view)
    .setOAuthToken(accessToken)
    .setDeveloperKey("AIzaSyA3Evl-iG9HMYWq0d3Kxg2OjAxmtkKRz4k") // sua antiga chave de dev
    .setCallback(pickerCallback)
    .build();

  picker.setVisible(true);
}

function pickerCallback(data) {
  if (data.action === google.picker.Action.PICKED) {
    const doc = data.docs[0];
    selectedRemoteFile = {
      id: doc.id,
      name: doc.name,
      mimeType: doc.mimeType,
      url: doc.url,
    };
    document.getElementById("file-name").textContent = `📎 ${doc.name}`;
    document.getElementById("upload-actions").style.display = "block";
  }
}

/* RESET */
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

/* INIT */
window.onload = async () => {
  setupUploadHandler();
  extractTokenFromHash();

  if (accessToken) {
    await fetchUserEmail();
    loadPickerScript();

    document.getElementById("auth-buttons").style.display = "none";
    document.getElementById("upload-nuvem").style.display = "block";

    const pickerBtn = document.getElementById("cloud-picker-btn");
    pickerBtn.onclick = () => showGooglePicker();
  }
};
