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
    world: "MAIN",
    func: (replacement) => {
      // 1) Is the selection inside an input/textarea?
      const sel = window.getSelection();
      const node = sel.anchorNode;
      if (node && node.nodeType === Node.TEXT_NODE &&
          node.parentElement.matches("input, textarea")) {
        // @ts-ignore
        replaceSelectionInInput(node.parentElement, replacement);
      } else {
        // 2) Otherwise do the normal range delete/insert
        if (!sel.rangeCount) return;
        const range = sel.getRangeAt(0);
        range.deleteContents();
        range.insertNode(document.createTextNode(replacement));
        sel.collapseToEnd();
      }

      // helper for inputs:
      function replaceSelectionInInput(el, replacement) {
        const start = el.selectionStart;
        const end   = el.selectionEnd;
        const val   = el.value;
        el.value = val.slice(0, start) + replacement + val.slice(end);
        const pos = start + replacement.length;
        el.setSelectionRange(pos, pos);
      }
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
