function setupUploadHandler() {
  const fileInput = document.getElementById("file");
  const fileNameDisplay = document.getElementById("file-name");
  const uploadButton = document.getElementById("upload-btn");

  if (!fileInput || !uploadButton) return;

  fileInput.addEventListener("change", (event) => {
    selectedFile = event.target.files[0];
    selectedRemoteFile = null; // reseta seleção da nuvem
    fileNameDisplay.textContent = selectedFile ? `📎 ${selectedFile.name}` : "";
    uploadButton.style.display = selectedFile ? "block" : "none";
  });

  uploadButton.addEventListener("click", async () => {
    if (!selectedFile && !selectedRemoteFile) {
      alert("Selecione um arquivo primeiro!");
      return;
    }

    const formData = new FormData();
    formData.append("userEmail", userEmail);
    formData.append("provider", provider);

    if (selectedFile) {
      formData.append("file", selectedFile);
    } else if (selectedRemoteFile) {
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

