fetch('/data')
  .then(res => res.json())
  .then(renderContent)
  .catch(() => {
    document.getElementById('content').innerHTML =
      "<div class='loading' style='color:red'>Error loading content!</div>";
  });

function renderContent(blocks) {
  const contentDiv = document.getElementById('content');
  if (!blocks || !blocks.length) {
    contentDiv.innerHTML = "<div class='loading' style='color:red'>No content available!</div>";
    return;
  }
  contentDiv.innerHTML = blocks.map(block => `
    <section class="section-block">
      <h2>${block.heading}</h2>
      <div class="section-content">${formatContent(block.content)}</div>
    </section>
  `).join('');
}

// Format bullets and paragraphs
function formatContent(text) {
  const lines = text.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
  let html = "";
  let inList = false;
  lines.forEach((line, idx) => {
    if (/^([-*•])\s/.test(line)) {
      if (!inList) { html += "<ul>"; inList = true; }
      html += `<li>${line.replace(/^([-*•])\s*/, "")}</li>`;
      // If last line is a list item, close the list
      if (idx === lines.length - 1) { html += "</ul>"; inList = false; }
    } else {
      if (inList) { html += "</ul>"; inList = false; }
      html += `<p>${line}</p>`;
    }
  });
  if (inList) { html += "</ul>"; }
  return html;
}
