document.getElementById("save").addEventListener("click", () => {
    const key = document.getElementById("apiKey").value;
    chrome.storage.sync.set({ openai_api_key: key }, () => {
      document.getElementById("status").textContent = "API key saved!";
    });
  });