// -----------------------------
// PARSER RAGAZZI
// -----------------------------
function parseRagazzi(text) {
  return text.split("\n").filter(x => x.trim()).map(r => {
    const parts = r.split(",");
    const nome = parts[0].trim();
    const sesso = parts[1].trim();

    const no = parts
      .slice(2)
      .join(",")
      .replace("NO:", "")
      .split(",")
      .map(x => x.trim())
      .filter(x => x);

    return {
      nome,
      sesso,
      no,
      famiglia: nome.split(" ").slice(-1)[0] // cognome
    };
  });
}

// -----------------------------
// PARSER FAMIGLIE
// -----------------------------
function parseFamiglie(text) {
  return text.split("\n").filter(x => x.trim()).map(r => {
    const parts = r.split(",");
    const nome = parts[0].trim();

    const capSex = parts[1].trim();
    const capacita = parseInt(capSex);
    const accetta = capSex.replace(/[0-9]/g, "");

    const tags = parts
      .slice(2)
      .join(",")
      .replace("TAGS:", "")
      .split(",")
      .map(x => x.trim())
      .filter(x => x);

    return {
      nome,
      capacita,
      accetta,
      tags
    };
  });
}

// -----------------------------
// COMPATIBILITÀ GENERICA
// -----------------------------
function compatibile(ragazzo, famiglia) {
  // Non può andare nella propria famiglia
  if (ragazzo.famiglia === famiglia.nome) return false;

  // Compatibilità sesso
  if (famiglia.accetta !== "MF" && famiglia.accetta !== ragazzo.sesso)
    return false;

  // Vincoli generici NO vs TAGS
  for (const forbidden of ragazzo.no) {
    if (famiglia.tags.includes(forbidden)) return false;
  }

  return true;
}

// -----------------------------
// SOLVER (BACKTRACKING)
// -----------------------------
function solve(ragazzi, famiglie) {
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
// COLLEGAMENTO UI
// -----------------------------
document.getElementById("solve-btn").onclick = () => {
  const ragazzi = parseRagazzi(document.getElementById("ragazzi-input").value);
  const famiglie = parseFamiglie(document.getElementById("famiglie-input").value);

  const result = solve(ragazzi, famiglie);

  document.getElementById("output").textContent =
    result ? JSON.stringify(result, null, 2) : "Nessuna soluzione trovata";
};
