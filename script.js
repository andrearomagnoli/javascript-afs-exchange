// -----------------------------
// TEMA SCURO
// -----------------------------
const themeToggle = document.getElementById("themeToggle");
if (themeToggle) {
  themeToggle.addEventListener("change", e => {
    document.body.classList.toggle("dark-theme", e.target.checked);
  });
}

// -----------------------------
// ALERT
// -----------------------------
function showAlert(msg, type="danger") {
  const html = `
    <div class="alert alert-${type} alert-dismissible fade show" role="alert">
      ${msg}
      <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    </div>`;
  document.getElementById("alert-area").innerHTML = html;
}

// -----------------------------
// TABELLE DINAMICHE
// -----------------------------
function addRagazzoRow() {
  const tbody = document.querySelector("#ragazzi-table tbody");
  const tr = document.createElement("tr");
  tr.innerHTML = `
    <td><input class="form-control" placeholder="Paolo Rossi"></td>
    <td>
      <select class="form-select">
        <option value="M">M</option>
        <option value="F">F</option>
      </select>
    </td>
    <td><input class="form-control" placeholder="cani, gatti"></td>
    <td><button class="btn btn-sm btn-danger" onclick="this.closest('tr').remove()">x</button></td>
  `;
  tbody.appendChild(tr);
}

function addFamigliaRow() {
  const tbody = document.querySelector("#famiglie-table tbody");
  const tr = document.createElement("tr");
  tr.innerHTML = `
    <td><input class="form-control" placeholder="Rossi"></td>
    <td><input class="form-control" placeholder="2MF"></td>
    <td><input class="form-control" placeholder="gatti, uccelli"></td>
    <td><button class="btn btn-sm btn-danger" onclick="this.closest('tr').remove()">x</button></td>
  `;
  tbody.appendChild(tr);
}

// -----------------------------
// PARSER ROBUSTO
// -----------------------------
function parseRagazzi() {
  const rows = document.querySelectorAll("#ragazzi-table tbody tr");
  return [...rows]
    .filter(r => r.children[0].querySelector("input").value.trim() !== "")
    .map(r => {
      const nome = r.children[0].querySelector("input").value.trim();
      const sesso = r.children[1].querySelector("select").value.trim();
      const no = r.children[2].querySelector("input").value
        .split(",").map(x => x.trim()).filter(x => x);

      return {
        nome,
        sesso,
        no,
        famiglia: nome.split(" ").slice(-1)[0]
      };
    });
}

function parseFamiglie() {
  const rows = document.querySelectorAll("#famiglie-table tbody tr");
  return [...rows]
    .filter(r => r.children[0].querySelector("input").value.trim() !== "")
    .map(r => {
      const nome = r.children[0].querySelector("input").value.trim();
      const capSex = r.children[1].querySelector("input").value.trim();

      // Estrai numeri ovunque siano
      const capacita = parseInt(capSex.match(/\d+/)?.[0] || "0");

      // Estrai lettere M/F ovunque siano
      const letters = (capSex.match(/[MF]/gi) || []).map(x => x.toUpperCase());
      const hasM = letters.includes("M");
      const hasF = letters.includes("F");

      let accetta;
      if (hasM && hasF) accetta = "MF";
      else if (hasM) accetta = "M";
      else if (hasF) accetta = "F";
      else accetta = "MF"; // fallback

      const tags = r.children[2].querySelector("input").value
        .split(",").map(x => x.trim()).filter(x => x);

      return { nome, capacita, accetta, tags };
    });
}

// -----------------------------
// COMPATIBILITÀ
// -----------------------------
function compatibile(r, f) {
  if (r.famiglia === f.nome) return false;
  if (f.accetta !== "MF" && f.accetta !== r.sesso) return false;
  for (const forbidden of r.no)
    if (f.tags.includes(forbidden)) return false;
  return true;
}

// -----------------------------
// SOLVER CON MRV (Minimum Remaining Values)
// -----------------------------
function solve(ragazzi, famiglie) {

  // MRV: ordina i ragazzi per numero di famiglie compatibili
  ragazzi.sort((a, b) => {
    const ca = famiglie.filter(f => compatibile(a, f)).length;
    const cb = famiglie.filter(f => compatibile(b, f)).length;
    return ca - cb;
  });

  const cap = Object.fromEntries(famiglie.map(f => [f.nome, f.capacita]));
  const assegnazione = {};

  function backtrack(i) {
    if (i === ragazzi.length) return true;
    const r = ragazzi[i];

    for (const f of famiglie) {
      if (cap[f.nome] > 0 && compatibile(r, f)) {
        cap[f.nome]--;
        assegnazione[r.nome] = f.nome;

        if (backtrack(i + 1)) return true;

        cap[f.nome]++;
        delete assegnazione[r.nome];
      }
    }
    return false;
  }

  return backtrack(0) ? assegnazione : null;
}

// -----------------------------
// UI → SOLVER
// -----------------------------
document.getElementById("solve-btn").onclick = () => {
  const ragazzi = parseRagazzi();
  const famiglie = parseFamiglie();

  const result = solve(ragazzi, famiglie);

  if (!result) {
    showAlert("Nessuna soluzione trovata", "danger");
    document.getElementById("output").innerHTML = "";
    return;
  }

  showAlert("Soluzione trovata!", "success");

  let html = "<ul class='list-group'>";
  for (const [r, f] of Object.entries(result)) {
    html += `
      <li class="list-group-item d-flex justify-content-between">
        <span><strong>${r}</strong></span>
        <span class="badge bg-primary">${f}</span>
      </li>`;
  }
  html += "</ul>";

  document.getElementById("output").innerHTML = html;
};
