let accessToken = null;
let provider = null;
let userEmail = null;
let selectedFile = null;

// LOGIN GOOGLE
function loginWithGoogle() {
  const clientId = '718961920868-s0tjl2judu6hurbg9glq3nlop9coqog1.apps.googleusercontent.com';
  const redirectUri = window.location.origin + '/';
  const scope = 'https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/drive.readonly';
  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?response_type=token&client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}`;
  provider = 'google';
  window.location.href = authUrl;
}

// LOGIN MICROSOFT
function loginWithMicrosoft() {
  const clientId = '218686d6-0f9f-43fd-be66-b51283579215';
  const redirectUri = window.location.origin + '/';
  const scope = 'Files.Read User.Read';
  const authUrl = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id=${clientId}&response_type=token&redirect_uri=${redirectUri}&scope=${scope}`;
  provider = 'microsoft';
  window.location.href = authUrl;
}

// EXTRAI O ACCESS TOKEN
function extractTokenFromHash() {
  const hash = window.location.hash.substring(1);
  const params = new URLSearchParams(hash);
  accessToken = params.get("access_token");
}

// BUSCA E-MAIL DO USUÁRIO
async function fetchUserEmail() {
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

// ATUALIZA A INTERFACE
function setupUI() {
  document.getElementById("auth-buttons").style.display = "none";
  document.getElementById("upload-section").style.display = "block";
}

// TRATA UPLOAD
function setupUploadHandler() {
  const fileInput = document.getElementById("file");
  const fileNameDisplay = document.getElementById("file-name");

  fileInput.addEventListener("change", (event) => {
    selectedFile = event.target.files[0];
    fileNameDisplay.textContent = selectedFile ? `📎 ${selectedFile.name}` : "";
  });

  document.getElementById("upload-btn").addEventListener("click", async () => {
    if (!selectedFile) {
      alert("Selecione um arquivo primeiro!");
      return;
    }

    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("userEmail", userEmail);
    formData.append("provider", provider);

    try {
      const res = await fetch("https://ericopessoal.app.n8n.cloud/webhook-test/document_input", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        alert("✅ Arquivo enviado com sucesso!");
        document.getElementById("file-name").textContent = "";
        document.getElementById("file").value = "";
      } else {
        alert("❌ Falha ao enviar o arquivo.");
      }
    } catch (error) {
      alert("❌ Erro ao enviar: " + error.message);
    }
  });
}

// EXECUTA AO ABRIR A PÁGINA
window.onload = async () => {
  extractTokenFromHash();

  if (accessToken) {
    await fetchUserEmail();
    setupUI();
    setupUploadHandler();
  }
};
