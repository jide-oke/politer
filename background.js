chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
      id: "make-polite",
      title: "Politer!",
      contexts: ["selection"]
    });
  });
  
  chrome.contextMenus.onClicked.addListener(async (info, tab) => {
    if (info.menuItemId === "make-polite") {
      const selectedText = info.selectionText;
      const apiKey = await getStoredApiKey();
      const politeText = await getPoliteVersion(selectedText, apiKey);
      
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: (text) => alert("Politer version:\n\n" + text),
        args: [politeText]
      });
    }
  });
  
  async function getStoredApiKey() {
    return new Promise((resolve) => {
      chrome.storage.sync.get(["openai_api_key"], (result) => {
        resolve(result.openai_api_key);
      });
    });
  }
  
  async function getPoliteVersion(text, apiKey) {
    const prompt = `Can you make this more polite: ${text}`;
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "gpt-4",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 200
      })
    });
  
    const data = await response.json();
    return data.choices?.[0]?.message?.content || "Error processing request.";
  }