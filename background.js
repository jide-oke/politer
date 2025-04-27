chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "make-polite",
    title: "Politer!",
    contexts: ["selection"]
  });
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId !== "make-polite") return;

  const apiKey = "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";
  const politeText = await getPoliteVersion(info.selectionText, apiKey);

  await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    world: "MAIN",
    func: (textToCopy) => {
      navigator.clipboard.writeText(textToCopy).then(() => {
        console.log('Copied to clipboard successfully!');

        // Create a checkmark popup
        const checkmark = document.createElement('div');
        checkmark.textContent = '✔️';
        checkmark.style.position = 'fixed';
        checkmark.style.top = '20px';
        checkmark.style.right = '20px';
        checkmark.style.fontSize = '36px';
        checkmark.style.background = 'white';
        checkmark.style.borderRadius = '50%';
        checkmark.style.padding = '10px';
        checkmark.style.boxShadow = '0 2px 6px rgba(0,0,0,0.3)';
        checkmark.style.zIndex = 9999;
        checkmark.style.transition = 'opacity 0.5s ease';

        document.body.appendChild(checkmark);

        // After 1.5 seconds, fade out and remove
        setTimeout(() => {
          checkmark.style.opacity = '0';
          setTimeout(() => {
            checkmark.remove();
          }, 500);
        }, 1500);

      }).catch(err => {
        console.error('Failed to copy text: ', err);
      });
    },
    args: [politeText]
  });
});

async function getPoliteVersion(text, apiKey) {
  const prompt = `Can you make this more polite: ${text}`;
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "Avoid overly robotic or stiff phrasing. You are a professional writing assistant that rewrites user-provided text to be polite, polished, clear, and customer-friendly. Always maintain a natural, professional tone with a touch of friendliness. Keep and return the keywords of the conversation bols. Keep and return the hyperlinks as well."
        },
        { role: "user", content: prompt }
      ],
      max_tokens: 200
    })
  });

  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? "Error processing request.";
}
