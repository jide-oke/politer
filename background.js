chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "make-polite",
    title: "Politer!",
    contexts: ["selection"]
  });
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId !== "make-polite") return;

  const apiKey = "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";          // <-- quoted
  const politeText = await getPoliteVersion(info.selectionText, apiKey);

  await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: (replacement) => {
      const sel = window.getSelection();
      if (!sel.rangeCount) return;
      const range = sel.getRangeAt(0);
      // remove the old selection…
      range.deleteContents();
      // …and insert the new text node
      range.insertNode(document.createTextNode(replacement));
      // collapse to the end so the cursor moves after the inserted text
      sel.collapseToEnd();
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
          content: "Avoid overly robotic or stiff phrasing. You are a professional writing assistant that rewrites user-provided text to be polite, polished, clear, and customer-friendly. lways maintain a natural, professional tone with a touch of friendliness."
        },
        { role: "user", content: prompt }
      ],
      max_tokens: 200
    })
  });

  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? "Error processing request.";
}
