// ---------------------------------------------------------------------
// Stan aplikacji
// ---------------------------------------------------------------------
let KOLORY = [];
let globalDekor = null;   // {kod, nazwa, miniatura}
let moduly = [];          // patrz saveModal() po pełną listę pól modułu
let edytowanyModulId = null;
let wybierzDekorCel = null;   // null | 'korpus' | 'fronty'
let tempDekorModulu = null;
let tempDekorFrontowModulu = null;
let tempAgdList = [];
let nextId = 1;

const el = (id) => document.getElementById(id);

// ---------------------------------------------------------------------
// Inicjalizacja
// ---------------------------------------------------------------------
async function init() {
  let kolory = [];
  try {
    kolory = await fetch("data/kolory.json").then(r => r.json());
  } catch (e) {
    console.error("Nie udało się wczytać data/kolory.json", e);
  }
  KOLORY = kolory;

  const kategorie = Array.from(new Set(KOLORY.map(k => k.kategoria))).sort();

  const selTyp = el("mTyp");
  selTyp.innerHTML = "";
  Object.entries(TYPY_DOMYSLNE).forEach(([key, val]) => {
    const opt = document.createElement("option");
    opt.value = key;
    opt.textContent = val.nazwa;
    selTyp.appendChild(opt);
  });

  const selSystem = el("mSystemSzuflad");
  selSystem.innerHTML = "";
  Object.entries(SYSTEMY_SZUFLAD).forEach(([key, val]) => {
    const opt = document.createElement("option");
    opt.value = key;
    opt.textContent = val.nazwa;
    selSystem.appendChild(opt);
  });

  const selAgd = el("mAgdTyp");
  selAgd.innerHTML = "";
  Object.entries(KATALOG_AGD).forEach(([key, val]) => {
    const opt = document.createElement("option");
    opt.value = key;
    opt.textContent = val.nazwa;
    selAgd.appendChild(opt);
  });
  wypelnijDomyslneWymiaryAgd();

  const selKat = el("filtrKategoria");
  kategorie.forEach(k => {
    const opt = document.createElement("option");
    opt.value = k;
    opt.textContent = k;
    selKat.appendChild(opt);
  });

  renderPaleta();
  bindEvents();
  renderModuly();
  recalc();
  renderPodgladCaly();

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  }
}

function wypelnijDomyslneWymiaryAgd() {
  const kat = KATALOG_AGD[el("mAgdTyp").value];
  if (!kat) return;
  el("mAgdSzer").value = kat.szerokosc;
  el("mAgdWys").value = kat.wysokosc;
}

// ---------------------------------------------------------------------
// Paleta kolorów
// ---------------------------------------------------------------------
function renderPaleta() {
  const query = el("szukajKolor").value.trim().toLowerCase();
  const kat = el("filtrKategoria").value;
  const grid = el("paletaKolorow");
  grid.innerHTML = "";

  const filtered = KOLORY.filter(k => {
    const matchQ = !query || k.nazwa.toLowerCase().includes(query) || (k.kod || "").toLowerCase().includes(query);
    const matchK = !kat || k.kategoria === kat;
    return matchQ && matchK;
  });

  filtered.forEach(k => {
    const tile = document.createElement("div");
    tile.className = "color-tile";
    if (wybierzDekorCel === "korpus" && tempDekorModulu && tempDekorModulu.kod === k.kod) tile.classList.add("selected");
    if (wybierzDekorCel === "fronty" && tempDekorFrontowModulu && tempDekorFrontowModulu.kod === k.kod) tile.classList.add("selected");
    if (!wybierzDekorCel && globalDekor && globalDekor.kod === k.kod) tile.classList.add("selected");
    const img = document.createElement("img");
    img.src = k.miniatura || "";
    img.loading = "lazy";
    img.alt = k.nazwa;
    img.onerror = () => { img.style.opacity = 0.2; };
    const label = document.createElement("div");
    label.className = "tile-label";
    label.textContent = `${k.nazwa} (${k.kod || "-"})`;
    tile.appendChild(img);
    tile.appendChild(label);
    tile.onclick = () => selectColor(k);
    grid.appendChild(tile);
  });

  if (filtered.length === 0) {
    grid.innerHTML = `<p style="grid-column: 1/-1; font-size:12px; color:#999;">
      Brak wyników. Jeśli baza jest pusta, uruchom najpierw abler_sync.py, żeby pobrać dekory i grafiki.</p>`;
  }
}

function selectColor(k) {
  if (wybierzDekorCel === "korpus") {
    tempDekorModulu = k;
    renderModalDekorChip();
    wybierzDekorCel = null;
    el("banerWyboruModulu").classList.add("hidden");
    el("modalModul").classList.remove("hidden");
    refreshModalPreview();
  } else if (wybierzDekorCel === "fronty") {
    tempDekorFrontowModulu = k;
    renderModalDekorFrontowChip();
    wybierzDekorCel = null;
    el("banerWyboruModulu").classList.add("hidden");
    el("modalModul").classList.remove("hidden");
    refreshModalPreview();
  } else {
    globalDekor = k;
    renderGlobalDekorChip();
    renderModuly();
    renderPodgladCaly();
  }
  renderPaleta();
}

function renderGlobalDekorChip() {
  const box = el("wybranyDekor");
  if (!globalDekor) {
    box.textContent = "— nie wybrano —";
    return;
  }
  box.innerHTML = "";
  const img = document.createElement("img");
  img.src = globalDekor.miniatura || "";
  const span = document.createElement("span");
  span.textContent = `${globalDekor.nazwa} (${globalDekor.kod || "-"})`;
  box.appendChild(img);
  box.appendChild(span);
}

function renderModalDekorChip() {
  const box = el("mDekorWybrany");
  const d = tempDekorModulu;
  if (!d) {
    box.textContent = "— dekor globalny —";
    return;
  }
  box.innerHTML = "";
  const img = document.createElement("img");
  img.src = d.miniatura || "";
  const span = document.createElement("span");
  span.textContent = `${d.nazwa} (${d.kod || "-"})`;
  box.appendChild(img);
  box.appendChild(span);
}

function renderModalDekorFrontowChip() {
  const box = el("mDekorFrontowWybrany");
  const d = tempDekorFrontowModulu;
  if (!d) {
    box.textContent = "— taki sam jak korpus —";
    return;
  }
  box.innerHTML = "";
  const img = document.createElement("img");
  img.src = d.miniatura || "";
  const span = document.createElement("span");
  span.textContent = `${d.nazwa} (${d.kod || "-"})`;
  box.appendChild(img);
  box.appendChild(span);
}

// ---------------------------------------------------------------------
// Wizualizacja (SVG) — front elewacji modułu
// ---------------------------------------------------------------------
let svgFillCounter = 0;

function moduleMarkup(m, decorUrlKorpus, decorUrlFrontow) {
  const w = Math.max(m.szerokosc || 1, 1);
  const h = Math.max(m.wysokosc || 1, 1);
  const fillIdK = "fillk_" + (svgFillCounter++);
  const fillIdF = "fillf_" + (svgFillCounter++);
  let defs = "";

  let fillKorpus = "#cbd0da";
  if (decorUrlKorpus) {
    defs += `<pattern id="${fillIdK}" patternUnits="userSpaceOnUse" width="${w}" height="${h}">
      <image href="${decorUrlKorpus}" x="0" y="0" width="${w}" height="${h}" preserveAspectRatio="xMidYMid slice"/>
    </pattern>`;
    fillKorpus = `url(#${fillIdK})`;
  }
  let fillFrontow = fillKorpus;
  if (decorUrlFrontow) {
    defs += `<pattern id="${fillIdF}" patternUnits="userSpaceOnUse" width="${w}" height="${h}">
      <image href="${decorUrlFrontow}" x="0" y="0" width="${w}" height="${h}" preserveAspectRatio="xMidYMid slice"/>
    </pattern>`;
    fillFrontow = `url(#${fillIdF})`;
  }

  const strokeW = Math.max(w * 0.004, 1);
  let body = `<rect x="0" y="0" width="${w}" height="${h}" fill="${fillKorpus}" stroke="#333" stroke-width="${strokeW}"/>`;

  const drzwi = m.drzwi || 0;
  const nNiska = m.szuflady_niska || 0;
  const nSrednia = m.szuflady_srednia || 0;
  const nWysoka = m.szuflady_wysoka || 0;
  const domyslne = SYSTEMY_SZUFLAD[m.system_szuflad] || SYSTEMY_SZUFLAD["legrabox"] || { niska: 118, srednia: 156, wysoka: 193 };
  const wysNiska = (m.wys_niska !== undefined && m.wys_niska !== null && m.wys_niska !== "") ? Number(m.wys_niska) : domyslne.niska;
  const wysSrednia = (m.wys_srednia !== undefined && m.wys_srednia !== null && m.wys_srednia !== "") ? Number(m.wys_srednia) : domyslne.srednia;
  const wysWysoka = (m.wys_wysoka !== undefined && m.wys_wysoka !== null && m.wys_wysoka !== "") ? Number(m.wys_wysoka) : domyslne.wysoka;

  const agdFront = (m.agd || []).filter(a => (a.miejsce || "front") === "front" && Number(a.wysokosc) > 0);

  // rzedy: lista { typ: 'szuflada'|'agd', h, etykieta }
  const rzedy = [];
  for (let i = 0; i < nNiska; i++) rzedy.push({ typ: "szuflada", h: wysNiska });
  for (let i = 0; i < nSrednia; i++) rzedy.push({ typ: "szuflada", h: wysSrednia });
  for (let i = 0; i < nWysoka; i++) rzedy.push({ typ: "szuflada", h: wysWysoka });
  agdFront.forEach(a => rzedy.push({ typ: "agd", h: Number(a.wysokosc), etykieta: a.nazwa }));

  const nRzedow = rzedy.length + (drzwi > 0 ? 1 : 0);
  if (nRzedow > 0) {
    const gap = Math.max(w, h) * 0.006;
    const margin = Math.max(w, h) * 0.01;
    const sumaWys = rzedy.reduce((s, r) => s + r.h, 0);
    const sumaGap = nRzedow > 1 ? gap * (nRzedow - 1) : 0;
    const wysDrzwi = Math.max(h - 2 * margin - sumaGap - sumaWys, 20);

    let y = margin;
    rzedy.forEach(row => {
      if (row.typ === "agd") {
        body += `<rect x="${margin}" y="${y}" width="${w - 2 * margin}" height="${Math.max(row.h, 1)}" fill="#b9c0ca" stroke="#333" stroke-width="${strokeW * 0.7}" stroke-dasharray="${w * 0.015},${w * 0.01}"/>`;
        const fontSize = Math.max(Math.min(row.h * 0.32, w * 0.05), Math.max(w, h) * 0.02);
        body += `<text x="${w / 2}" y="${y + row.h / 2 + fontSize * 0.32}" font-size="${fontSize}" text-anchor="middle" fill="#4a4f57" font-family="Arial, sans-serif">${escapeXmlLocal(row.etykieta || "AGD")}</text>`;
      } else {
        body += `<rect x="${margin}" y="${y}" width="${w - 2 * margin}" height="${Math.max(row.h, 1)}" fill="${fillFrontow}" stroke="#333" stroke-width="${strokeW * 0.7}"/>`;
        body += `<rect x="${w / 2 - w * 0.08}" y="${y + row.h * 0.15}" width="${w * 0.16}" height="${Math.max(row.h * 0.06, 1.5)}" fill="#333" opacity="0.55"/>`;
      }
      y += row.h + gap;
    });
    if (drzwi > 0) {
      const doorW = (w - 2 * margin - (drzwi - 1) * gap) / drzwi;
      let x = margin;
      for (let i = 0; i < drzwi; i++) {
        body += `<rect x="${x}" y="${y}" width="${Math.max(doorW, 1)}" height="${Math.max(wysDrzwi, 1)}" fill="${fillFrontow}" stroke="#333" stroke-width="${strokeW * 0.7}"/>`;
        const uchwytX = (drzwi === 1) ? (x + doorW - doorW * 0.1 - strokeW * 2) : (i % 2 === 0 ? x + doorW - doorW * 0.08 - strokeW * 2 : x + doorW * 0.08);
        body += `<rect x="${uchwytX}" y="${y + wysDrzwi * 0.08}" width="${strokeW * 2}" height="${wysDrzwi * 0.2}" fill="#333" opacity="0.55"/>`;
        x += doorW + gap;
      }
    }
  }
  return { defs, body, w, h };
}

function escapeXmlLocal(s) {
  return String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

function svgStandalone(m, decorUrlKorpus, decorUrlFrontow, pxW, pxH) {
  const { defs, body, w, h } = moduleMarkup(m, decorUrlKorpus, decorUrlFrontow);
  return `<svg viewBox="0 0 ${w} ${h}" width="${pxW}" height="${pxH}" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet">
    <defs>${defs}</defs>${body}</svg>`;
}

function decorUrlKorpusModulu(m) {
  return m.dekor_miniatura || (globalDekor ? globalDekor.miniatura : null);
}
function decorUrlFrontowModulu(m) {
  return m.dekor_frontow_miniatura || decorUrlKorpusModulu(m);
}

function renderCardPreview(m) {
  const boxW = 96, boxH = 96;
  const ratio = m.szerokosc / m.wysokosc;
  let pxW, pxH;
  if (ratio > boxW / boxH) { pxW = boxW; pxH = boxW / ratio; } else { pxH = boxH; pxW = boxH * ratio; }
  return svgStandalone(m, decorUrlKorpusModulu(m), decorUrlFrontowModulu(m), pxW, pxH);
}

function renderPodgladCaly() {
  const box = el("podgladCaly");
  if (moduly.length === 0) {
    box.innerHTML = `<p class="empty-hint">Dodaj moduły, żeby zobaczyć podgląd całego zestawu.</p>`;
    return;
  }
  const gapMm = 20;
  const totalW = moduly.reduce((s, m) => s + m.szerokosc, 0) + (moduly.length - 1) * gapMm;
  const maxH = Math.max(...moduly.map(m => m.wysokosc));
  const containerWidthPx = Math.max(box.clientWidth - 20 || 900, 320);
  const maxHeightPx = 300;
  let scale = containerWidthPx / totalW;
  if (maxH * scale > maxHeightPx) scale = maxHeightPx / maxH;

  const canvasW = totalW * scale;
  const canvasH = maxH * scale + 22;
  let inner = "";
  let x = 0;
  moduly.forEach(m => {
    const { defs, body, w, h } = moduleMarkup(m, decorUrlKorpusModulu(m), decorUrlFrontowModulu(m));
    const wpx = m.szerokosc * scale;
    const hpx = m.wysokosc * scale;
    const ypx = maxH * scale - hpx;
    inner += `<svg x="${x}" y="${ypx}" width="${wpx}" height="${hpx}" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none"><defs>${defs}</defs>${body}</svg>`;
    inner += `<text x="${x + wpx / 2}" y="${maxH * scale + 16}" font-size="10" text-anchor="middle" fill="#6b7280">${escapeXml(m.nazwa_modulu)}</text>`;
    x += wpx + gapMm * scale;
  });
  box.innerHTML = `<svg width="${canvasW}" height="${canvasH}">${inner}</svg>`;
}

function escapeXml(s) {
  return String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

function refreshModalPreview() {
  const m = {
    szerokosc: parseFloat(el("mSzerokosc").value) || 1,
    wysokosc: parseFloat(el("mWysokosc").value) || 1,
    drzwi: parseInt(el("mDrzwi").value) || 0,
    szuflady_niska: parseInt(el("mSzufladyNiska").value) || 0,
    szuflady_srednia: parseInt(el("mSzufladySrednia").value) || 0,
    szuflady_wysoka: parseInt(el("mSzufladyWysoka").value) || 0,
    system_szuflad: el("mSystemSzuflad").value,
    wys_niska: el("mWysNiska").value,
    wys_srednia: el("mWysSrednia").value,
    wys_wysoka: el("mWysWysoka").value,
    agd: tempAgdList,
  };
  const decorK = tempDekorModulu ? tempDekorModulu.miniatura : (globalDekor ? globalDekor.miniatura : null);
  const decorF = tempDekorFrontowModulu ? tempDekorFrontowModulu.miniatura : decorK;
  const boxW = 240, boxH = 200;
  const ratio = m.szerokosc / m.wysokosc;
  let pxW, pxH;
  if (ratio > boxW / boxH) { pxW = boxW; pxH = boxW / ratio; } else { pxH = boxH; pxW = boxH * ratio; }
  el("mPodglad").innerHTML = svgStandalone(m, decorK, decorF, pxW, pxH);
}

function wypelnijDomyslneWysokosciSzuflad() {
  const sys = SYSTEMY_SZUFLAD[el("mSystemSzuflad").value];
  if (!sys) return;
  el("mWysNiska").value = sys.niska;
  el("mWysSrednia").value = sys.srednia;
  el("mWysWysoka").value = sys.wysoka;
}

// ---------------------------------------------------------------------
// AGD w module
// ---------------------------------------------------------------------
function renderAgdListaModal() {
  const box = el("mAgdLista");
  if (tempAgdList.length === 0) {
    box.innerHTML = `<div style="font-size:12px;color:var(--text-dim);">Brak dodanego AGD w tym module.</div>`;
    return;
  }
  box.innerHTML = "";
  tempAgdList.forEach((a, idx) => {
    const chip = document.createElement("div");
    chip.className = "agd-chip";
    const miejsceOpis = { blat: "wycięcie w blacie", gorna: "szafka górna/dno", front: "nisza we froncie" }[a.miejsce] || a.miejsce;
    chip.innerHTML = `<span>${a.nazwa}${a.model ? " — " + a.model : ""} (${a.szerokosc}×${a.wysokosc} mm, ${miejsceOpis})</span>
      <button class="agd-remove" data-idx="${idx}" type="button">✕</button>`;
    box.appendChild(chip);
  });
  box.querySelectorAll(".agd-remove").forEach(btn => {
    btn.addEventListener("click", () => {
      tempAgdList.splice(parseInt(btn.dataset.idx), 1);
      renderAgdListaModal();
      refreshModalPreview();
    });
  });
}

function dodajAgd() {
  const typKey = el("mAgdTyp").value;
  const kat = KATALOG_AGD[typKey] || { nazwa: "AGD", miejsce: "front" };
  const szer = parseFloat(el("mAgdSzer").value) || kat.szerokosc || 0;
  const wys = parseFloat(el("mAgdWys").value) || kat.wysokosc || 0;
  const model = el("mAgdModel").value.trim();
  tempAgdList.push({
    typ: typKey,
    nazwa: kat.nazwa,
    model,
    szerokosc: szer,
    wysokosc: wys,
    miejsce: kat.miejsce || "front",
  });
  el("mAgdModel").value = "";
  renderAgdListaModal();
  refreshModalPreview();
}

// ---------------------------------------------------------------------
// Moduły — lista i modal
// ---------------------------------------------------------------------
function renderModuly() {
  const list = el("listaModulow");
  list.innerHTML = "";
  el("pustyProjekt").style.display = moduly.length ? "none" : "block";

  moduly.forEach(m => {
    const card = document.createElement("div");
    card.className = "module-card";
    const dekorOpis = m.dekor_kod ? `${m.dekor_nazwa} (${m.dekor_kod})` : (globalDekor ? `${globalDekor.nazwa} (${globalDekor.kod}) — globalny` : "brak dekoru!");
    const frontowOpis = m.dekor_frontow_kod ? ` · fronty: ${m.dekor_frontow_nazwa} (${m.dekor_frontow_kod})` : "";
    const liczbaSzuflad = (m.szuflady_niska || 0) + (m.szuflady_srednia || 0) + (m.szuflady_wysoka || 0);
    const czesciSzuflad = [];
    if (m.szuflady_niska) czesciSzuflad.push(`${m.szuflady_niska}× niska`);
    if (m.szuflady_srednia) czesciSzuflad.push(`${m.szuflady_srednia}× średnia`);
    if (m.szuflady_wysoka) czesciSzuflad.push(`${m.szuflady_wysoka}× wysoka`);
    const szufladyOpis = liczbaSzuflad > 0
      ? ` · szuflady: ${czesciSzuflad.join(", ")} (${m.typ_szuflady === "drewniana" ? "drewniane" : "front, " + (SYSTEMY_SZUFLAD[m.system_szuflad] ? SYSTEMY_SZUFLAD[m.system_szuflad].nazwa : "system metalowy")})`
      : "";
    const agdOpis = (m.agd && m.agd.length) ? ` · AGD: ${m.agd.map(a => a.nazwa).join(", ")}` : "";
    card.innerHTML = `
      <div class="m-preview">${renderCardPreview(m)}</div>
      <div class="m-body">
        <div class="m-info">
          <h3>${m.nazwa_modulu}</h3>
          <div class="m-details">${m.szerokosc}×${m.wysokosc}×${m.glebokosc} mm · płyta ${m.grubosc} mm ·
          półki: ${m.polki} · drzwi: ${m.drzwi}${szufladyOpis} · plecy: ${m.plecy ? "tak" : "nie"} · dekor: ${dekorOpis}${frontowOpis}${agdOpis}</div>
        </div>
        <div class="m-actions">
          <button class="btn btn-ghost btn-sm" data-edit="${m.id}">Edytuj</button>
          <button class="btn btn-ghost btn-sm" data-del="${m.id}">Usuń</button>
        </div>
      </div>`;
    list.appendChild(card);
  });

  list.querySelectorAll("[data-edit]").forEach(b => b.onclick = () => openModal(b.dataset.edit));
  list.querySelectorAll("[data-del]").forEach(b => b.onclick = () => {
    moduly = moduly.filter(m => String(m.id) !== b.dataset.del);
    renderModuly();
    recalc();
    renderPodgladCaly();
  });
}

function openModal(id) {
  edytowanyModulId = id || null;
  tempDekorModulu = null;
  tempDekorFrontowModulu = null;
  tempAgdList = [];
  wybierzDekorCel = null;

  const typDefault = Object.keys(TYPY_DOMYSLNE)[0];
  let m = id ? moduly.find(x => String(x.id) === String(id)) : null;

  if (m) {
    el("modalTytul").textContent = "Edytuj moduł";
    el("mNazwa").value = m.nazwa_modulu;
    el("mTyp").value = m.typ;
    el("mSzerokosc").value = m.szerokosc;
    el("mWysokosc").value = m.wysokosc;
    el("mGlebokosc").value = m.glebokosc;
    el("mGrubosc").value = m.grubosc;
    el("mPolki").value = m.polki;
    el("mDrzwi").value = m.drzwi;
    el("mSystemSzuflad").value = m.system_szuflad || "legrabox";
    el("mTypSzuflady").value = m.typ_szuflady || "przod_tylko";
    el("mSzufladyNiska").value = m.szuflady_niska || 0;
    el("mSzufladySrednia").value = m.szuflady_srednia || 0;
    el("mSzufladyWysoka").value = m.szuflady_wysoka || 0;
    if (m.wys_niska !== undefined && m.wys_niska !== null && m.wys_niska !== "") {
      el("mWysNiska").value = m.wys_niska;
      el("mWysSrednia").value = m.wys_srednia;
      el("mWysWysoka").value = m.wys_wysoka;
    } else {
      wypelnijDomyslneWysokosciSzuflad();
    }
    el("mPlecy").checked = m.plecy;
    el("mUslojenie").value = m.uslojenie;
    if (m.dekor_kod) {
      tempDekorModulu = { kod: m.dekor_kod, nazwa: m.dekor_nazwa, miniatura: m.dekor_miniatura };
    }
    if (m.dekor_frontow_kod) {
      tempDekorFrontowModulu = { kod: m.dekor_frontow_kod, nazwa: m.dekor_frontow_nazwa, miniatura: m.dekor_frontow_miniatura };
    }
    tempAgdList = Array.isArray(m.agd) ? JSON.parse(JSON.stringify(m.agd)) : [];
  } else {
    el("modalTytul").textContent = "Nowy moduł";
    const d = TYPY_DOMYSLNE[typDefault];
    el("mNazwa").value = d.nazwa;
    el("mTyp").value = typDefault;
    fillFromTyp(typDefault);
  }
  renderModalDekorChip();
  renderModalDekorFrontowChip();
  renderAgdListaModal();
  refreshModalPreview();
  el("modalModul").classList.remove("hidden");
}

function fillFromTyp(typKey) {
  const d = TYPY_DOMYSLNE[typKey];
  if (!d) return;
  el("mSzerokosc").value = d.szerokosc;
  el("mWysokosc").value = d.wysokosc;
  el("mGlebokosc").value = d.glebokosc;
  el("mPolki").value = d.polki;
  el("mDrzwi").value = d.drzwi;
  el("mSystemSzuflad").value = d.system_szuflad || "legrabox";
  el("mTypSzuflady").value = d.typ_szuflady || "przod_tylko";
  el("mSzufladyNiska").value = d.szuflady_niska || 0;
  el("mSzufladySrednia").value = d.szuflady_srednia || 0;
  el("mSzufladyWysoka").value = d.szuflady_wysoka || 0;
  wypelnijDomyslneWysokosciSzuflad();
  el("mPlecy").checked = d.plecy;
  if (!el("mNazwa").value || Object.values(TYPY_DOMYSLNE).some(t => t.nazwa === el("mNazwa").value)) {
    el("mNazwa").value = d.nazwa;
  }
  refreshModalPreview();
}

function closeModal() {
  el("modalModul").classList.add("hidden");
  el("banerWyboruModulu").classList.add("hidden");
  wybierzDekorCel = null;
}

function saveModal() {
  const dane = {
    id: edytowanyModulId || nextId++,
    nazwa_modulu: el("mNazwa").value || "Moduł",
    typ: el("mTyp").value,
    szerokosc: parseFloat(el("mSzerokosc").value) || 0,
    wysokosc: parseFloat(el("mWysokosc").value) || 0,
    glebokosc: parseFloat(el("mGlebokosc").value) || 0,
    grubosc: parseFloat(el("mGrubosc").value) || 18,
    polki: parseInt(el("mPolki").value) || 0,
    drzwi: parseInt(el("mDrzwi").value) || 0,
    system_szuflad: el("mSystemSzuflad").value,
    typ_szuflady: el("mTypSzuflady").value,
    szuflady_niska: parseInt(el("mSzufladyNiska").value) || 0,
    szuflady_srednia: parseInt(el("mSzufladySrednia").value) || 0,
    szuflady_wysoka: parseInt(el("mSzufladyWysoka").value) || 0,
    wys_niska: parseFloat(el("mWysNiska").value) || null,
    wys_srednia: parseFloat(el("mWysSrednia").value) || null,
    wys_wysoka: parseFloat(el("mWysWysoka").value) || null,
    plecy: el("mPlecy").checked,
    uslojenie: el("mUslojenie").value,
    dekor_kod: tempDekorModulu ? tempDekorModulu.kod : null,
    dekor_nazwa: tempDekorModulu ? tempDekorModulu.nazwa : null,
    dekor_miniatura: tempDekorModulu ? tempDekorModulu.miniatura : null,
    dekor_frontow_kod: tempDekorFrontowModulu ? tempDekorFrontowModulu.kod : null,
    dekor_frontow_nazwa: tempDekorFrontowModulu ? tempDekorFrontowModulu.nazwa : null,
    dekor_frontow_miniatura: tempDekorFrontowModulu ? tempDekorFrontowModulu.miniatura : null,
    agd: JSON.parse(JSON.stringify(tempAgdList)),
  };

  if (edytowanyModulId) {
    moduly = moduly.map(m => String(m.id) === String(edytowanyModulId) ? dane : m);
  } else {
    moduly.push(dane);
  }
  closeModal();
  renderModuly();
  recalc();
  renderPodgladCaly();
}

// ---------------------------------------------------------------------
// Obliczanie listy formatek (woła backend)
// ---------------------------------------------------------------------
function modulyDoWyslania() {
  return moduly.map(m => {
    const dekor_kod = m.dekor_kod || (globalDekor ? globalDekor.kod : null);
    const dekor_nazwa = m.dekor_nazwa || (globalDekor ? globalDekor.nazwa : "(brak dekoru)");
    const dekor_frontow_kod = m.dekor_frontow_kod || dekor_kod;
    const dekor_frontow_nazwa = m.dekor_frontow_nazwa || dekor_nazwa;
    return { ...m, dekor_kod, dekor_nazwa, dekor_frontow_kod, dekor_frontow_nazwa };
  });
}

async function recalc() {
  if (moduly.length === 0) {
    el("podsumowanie").innerHTML = "";
    el("ostrzezeniaBox").innerHTML = "";
    el("agdBox").innerHTML = "";
    document.querySelector("#tabelaFormatek tbody").innerHTML = "";
    return;
  }
  const data = obliczProjekt(modulyDoWyslania());
  renderPodsumowanie(data.podsumowanie);
  renderTabela(data.zbiorczo);
  renderOstrzezenia(data.ostrzezenia || []);
  renderAgdPodsumowanie(data.agd || []);
}

function renderAgdPodsumowanie(lista) {
  const box = el("agdBox");
  if (!lista.length) { box.innerHTML = ""; return; }
  const wiersze = lista.map(a =>
    `<tr><td>${a.modul}</td><td>${a.element}${a.model ? " (" + a.model + ")" : ""}</td><td>${a.dlugosc}×${a.szerokosc} mm</td></tr>`
  ).join("");
  box.innerHTML = `
    <div style="margin-top:14px;">
      <div class="selected-color-label" style="font-weight:600;">AGD w projekcie:</div>
      <table style="margin-top:6px;"><tbody>${wiersze}</tbody></table>
    </div>`;
}

function renderOstrzezenia(lista) {
  const box = el("ostrzezeniaBox");
  if (!lista.length) { box.innerHTML = ""; return; }
  box.innerHTML = lista.map(w => `<div class="warning-box">⚠ ${w}</div>`).join("");
}

function renderPodsumowanie(p) {
  el("podsumowanie").innerHTML = `
    <div class="stat"><strong>${p.pozycji}</strong>pozycji</div>
    <div class="stat"><strong>${p.sztuk_lacznie}</strong>szt. łącznie</div>
    <div class="stat"><strong>${p.powierzchnia_m2}</strong>m² płyty</div>
  `;
}

function renderTabela(rows) {
  const tbody = document.querySelector("#tabelaFormatek tbody");
  tbody.innerHTML = "";
  rows.forEach(r => {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${r.element}</td><td>${r.dekor_nazwa} (${r.dekor_kod})</td>
      <td>${r.grubosc}</td><td>${r.dlugosc}</td><td>${r.szerokosc}</td><td>${r.ilosc}</td><td>${r.obrzeze}</td>`;
    tbody.appendChild(tr);
  });
}

// ---------------------------------------------------------------------
// Eksport / zapis / wczytanie projektu
// ---------------------------------------------------------------------
function csvEscape(val) {
  const s = String(val ?? "");
  if (/[;"\n]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
  return s;
}

function eksportuj() {
  if (moduly.length === 0) {
    alert("Dodaj przynajmniej jeden moduł, zanim wyeksportujesz listę formatek.");
    return;
  }
  const nazwaProjektu = el("nazwaProjektu").value || "Projekt mebli";
  const data = obliczProjekt(modulyDoWyslania());
  const linie = [];

  linie.push(csvEscape(`${nazwaProjektu} — lista formatek`));
  linie.push(csvEscape(`Wygenerowano: ${new Date().toLocaleString("pl-PL")}`));
  linie.push("");

  const naglowki = ["Moduł(y)", "Element", "Dekor", "Kod dekoru", "Grubość [mm]", "Długość [mm]", "Szerokość [mm]", "Ilość [szt]", "Kierunek usłojenia", "Oklejanie krawędzi"];
  linie.push(naglowki.map(csvEscape).join(";"));
  data.zbiorczo.forEach(e => {
    linie.push([e.moduly, e.element, e.dekor_nazwa, e.dekor_kod, e.grubosc, e.dlugosc, e.szerokosc, e.ilosc, e.uslojenie, e.obrzeze].map(csvEscape).join(";"));
  });
  linie.push("");
  linie.push(csvEscape(`Razem sztuk: ${data.podsumowanie.sztuk_lacznie}`));
  linie.push(csvEscape(`Razem powierzchnia (orientacyjnie): ${data.podsumowanie.powierzchnia_m2} m²`));

  if (data.agd && data.agd.length) {
    linie.push("");
    linie.push(csvEscape("AGD / sprzęt w zabudowie"));
    linie.push(["Moduł", "Element / opis", "Model", "Wysokość niszy [mm]", "Szerokość niszy [mm]"].map(csvEscape).join(";"));
    data.agd.forEach(a => {
      linie.push([a.modul, a.element, a.model || "", a.dlugosc, a.szerokosc].map(csvEscape).join(";"));
    });
  }

  const csvContent = "\uFEFF" + linie.join("\r\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `lista_formatek_${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function drukujListe() {
  if (moduly.length === 0) {
    alert("Dodaj przynajmniej jeden moduł, żeby wydrukować listę formatek.");
    return;
  }
  window.print();
}

function zapiszProjekt() {
  const dane = {
    nazwa_projektu: el("nazwaProjektu").value,
    globalDekor,
    moduly,
    nextId,
  };
  localStorage.setItem("projektant_mebli_projekt", JSON.stringify(dane));
  alert("Projekt zapisany lokalnie w przeglądarce.");
}

function wczytajProjekt() {
  const raw = localStorage.getItem("projektant_mebli_projekt");
  if (!raw) {
    alert("Brak zapisanego projektu w tej przeglądarce.");
    return;
  }
  const dane = JSON.parse(raw);
  el("nazwaProjektu").value = dane.nazwa_projektu || "Mój projekt";
  globalDekor = dane.globalDekor || null;
  moduly = dane.moduly || [];
  nextId = dane.nextId || (moduly.length + 1);
  renderGlobalDekorChip();
  renderPaleta();
  renderModuly();
  recalc();
  renderPodgladCaly();
}

// ---------------------------------------------------------------------
// Podpięcie zdarzeń
// ---------------------------------------------------------------------
function bindEvents() {
  el("szukajKolor").addEventListener("input", renderPaleta);
  el("filtrKategoria").addEventListener("change", renderPaleta);
  el("btnDodajModul").addEventListener("click", () => openModal(null));
  el("btnAnulujModul").addEventListener("click", closeModal);
  el("btnZapiszModul").addEventListener("click", saveModal);
  el("mTyp").addEventListener("change", (e) => fillFromTyp(e.target.value));
  el("btnEksport").addEventListener("click", eksportuj);
  el("btnDrukuj").addEventListener("click", drukujListe);
  el("btnZapisz").addEventListener("click", zapiszProjekt);
  el("btnWczytaj").addEventListener("click", wczytajProjekt);

  el("btnWybierzDekorModulu").addEventListener("click", () => {
    wybierzDekorCel = "korpus";
    el("modalModul").classList.add("hidden");
    el("banerWyboruModulu").classList.remove("hidden");
    el("banerWyboruModulu").firstChild.textContent = "Wybierz dekor korpusu — kliknij kafelek poniżej. ";
    renderPaleta();
  });
  el("btnWybierzDekorFrontow").addEventListener("click", () => {
    wybierzDekorCel = "fronty";
    el("modalModul").classList.add("hidden");
    el("banerWyboruModulu").classList.remove("hidden");
    el("banerWyboruModulu").firstChild.textContent = "Wybierz dekor frontów — kliknij kafelek poniżej. ";
    renderPaleta();
  });
  el("btnAnulujWyborModulu").addEventListener("click", () => {
    wybierzDekorCel = null;
    el("banerWyboruModulu").classList.add("hidden");
    el("modalModul").classList.remove("hidden");
    renderPaleta();
  });
  el("btnResetDekorModulu").addEventListener("click", () => {
    tempDekorModulu = null;
    wybierzDekorCel = null;
    renderModalDekorChip();
    renderPaleta();
    refreshModalPreview();
  });
  el("btnResetDekorFrontow").addEventListener("click", () => {
    tempDekorFrontowModulu = null;
    wybierzDekorCel = null;
    renderModalDekorFrontowChip();
    renderPaleta();
    refreshModalPreview();
  });

  el("btnDodajAgd").addEventListener("click", dodajAgd);
  el("mAgdTyp").addEventListener("change", wypelnijDomyslneWymiaryAgd);

  el("mSystemSzuflad").addEventListener("change", () => {
    wypelnijDomyslneWysokosciSzuflad();
    refreshModalPreview();
  });

  ["mSzerokosc", "mWysokosc", "mDrzwi", "mSzufladyNiska", "mSzufladySrednia", "mSzufladyWysoka", "mWysNiska", "mWysSrednia", "mWysWysoka", "mTypSzuflady"].forEach(id => {
    el(id).addEventListener("input", refreshModalPreview);
    el(id).addEventListener("change", refreshModalPreview);
  });
}

init();
