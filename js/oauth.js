
function loginWithGoogle() {
  const clientId = '718961920868-s0tjl2judu6hurbg9glq3nlop9coqog1.apps.googleusercontent.com';
  const redirectUri = window.location.href;
  const scope = 'https://www.googleapis.com/auth/drive.readonly';
  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?response_type=token&client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}`;
  window.location.href = authUrl;
}

function loginWithMicrosoft() {
  const clientId = '218686d6-0f9f-43fd-be66-b51283579215';
  const redirectUri = window.location.href;
  const scope = 'Files.Read';
  const authUrl = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id=${clientId}&response_type=token&redirect_uri=${redirectUri}&scope=${scope}`;
  window.location.href = authUrl;
}

window.onload = () => {
  const hash = window.location.hash.substring(1);
  const params = new URLSearchParams(hash);
  const accessToken = params.get("access_token");

  if (accessToken) {
    document.getElementById("fileInput").style.display = "block";
    document.getElementById("fileInput").addEventListener("change", (event) => {
      const file = event.target.files[0];
      const formData = new FormData();
      formData.append("file", file);

      fetch("https://ericopessoal.app.n8n.cloud/webhook-test/document_input", {
        method: "POST",
        body: formData
      })
      .then(response => alert("Arquivo enviado com sucesso!"))
      .catch(error => alert("Erro ao enviar: " + error));
    });
  }
};
