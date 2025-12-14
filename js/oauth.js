let accessToken = null;
let provider = null;
let userEmail = null;
let selectedFile = null;

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
    // limpa a URL por segurança
    window.history.replaceState({}, document.title, window.location.pathname);
  }
}

/* =======================
   BUSCA EMAIL
======================= */
async function fetchUserEmail() {
  if (!accessToken || !provider) return;

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
}

/* =======================
   UI
======================= */
function setupUI() {
  document.getElementById("auth-buttons").style.display = "none";
  document.getElementById("upload-section").style.display = "block";
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
    fileNameDisplay.textContent = selectedFile ? `📎 ${selectedFile.name}` : "";
    uploadButton.style.display = selectedFile ? "block" : "none";
  });

  uploadButton.addEventListener("click", async () => {
    if (!selectedFile) {
      alert("Selecione um arquivo primeiro!");
      return;
    }

    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("userEmail", userEmail);
    formData.append("provider", provider);

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
  extractTokenFromHash();

  if (accessToken) {
    await fetchUserEmail();
    setupUI();
    setupUploadHandler();
  }
};
