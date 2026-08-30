const { invoke } = window.__TAURI__.tauri;
const { open } = window.__TAURI__.dialog;

const dropzone = document.getElementById("dropzone");
const fileList = document.getElementById("file-list");
const summary = document.getElementById("summary");

dropzone.addEventListener("click", async () => {
  const selected = await open({
    multiple: true,
    filters: [{ name: "Archivos comprimidos", extensions: ["zip", "rar"] }],
  });
  if (selected) {
    const paths = Array.isArray(selected) ? selected : [selected];
    runExtraction(paths);
  }
});

window.__TAURI__.event.listen("tauri://file-drop", (event) => {
  const paths = event.payload;
  runExtraction(paths);
});

window.__TAURI__.event.listen("tauri://file-drop-hover", () => {
  dropzone.classList.add("dragover");
});
window.__TAURI__.event.listen("tauri://file-drop-cancelled", () => {
  dropzone.classList.remove("dragover");
});

async function runExtraction(paths) {
  dropzone.classList.remove("dragover");
  fileList.innerHTML = "";
  summary.textContent = `Extrayendo ${paths.length} archivo(s)...`;

  const outcomes = await invoke("batch_extract", { paths });

  let okCount = 0;
  for (const outcome of outcomes) {
    const row = document.createElement("div");
    row.className = "result-row";

    if (outcome.ok) {
      okCount++;
      row.innerHTML = `<span>${outcome.archive}</span><span class="ok">✓ ${outcome.dest}</span>`;
    } else {
      row.innerHTML = `<span>${outcome.archive}</span><span class="fail">✗ ${outcome.error}</span>`;
    }
    fileList.appendChild(row);
  }

  summary.textContent = `${okCount}/${outcomes.length} archivos extraídos correctamente.`;
}