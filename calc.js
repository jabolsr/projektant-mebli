// ===========================================================================
// calc.js — silnik liczenia formatek (port 1:1 logiki z designer_app.py)
// Działa w 100% lokalnie w przeglądarce, bez żadnego serwera.
// ===========================================================================

const TYPY_DOMYSLNE = {
  szafka_dolna:    { nazwa: "Szafka dolna",  szerokosc: 600, wysokosc: 720,  glebokosc: 560, polki: 1, drzwi: 1, szuflady_niska: 0, szuflady_srednia: 0, szuflady_wysoka: 0, system_szuflad: "legrabox", typ_szuflady: "przod_tylko", plecy: true },
  szafka_szuflady: { nazwa: "Szafka z szufladami", szerokosc: 600, wysokosc: 720, glebokosc: 560, polki: 0, drzwi: 0, szuflady_niska: 1, szuflady_srednia: 1, szuflady_wysoka: 1, system_szuflad: "legrabox", typ_szuflady: "przod_tylko", plecy: true },
  szafka_gorna:    { nazwa: "Szafka górna",  szerokosc: 600, wysokosc: 720,  glebokosc: 320, polki: 1, drzwi: 1, szuflady_niska: 0, szuflady_srednia: 0, szuflady_wysoka: 0, system_szuflad: "legrabox", typ_szuflady: "przod_tylko", plecy: true },
  slupek:          { nazwa: "Słupek",        szerokosc: 600, wysokosc: 2000, glebokosc: 560, polki: 4, drzwi: 2, szuflady_niska: 0, szuflady_srednia: 0, szuflady_wysoka: 0, system_szuflad: "legrabox", typ_szuflady: "przod_tylko", plecy: true },
  regal:           { nazwa: "Regał",         szerokosc: 800, wysokosc: 1900, glebokosc: 350, polki: 5, drzwi: 0, szuflady_niska: 0, szuflady_srednia: 0, szuflady_wysoka: 0, system_szuflad: "legrabox", typ_szuflady: "przod_tylko", plecy: true },
  szafa:           { nazwa: "Szafa",         szerokosc: 900, wysokosc: 2200, glebokosc: 580, polki: 3, drzwi: 2, szuflady_niska: 0, szuflady_srednia: 0, szuflady_wysoka: 0, system_szuflad: "legrabox", typ_szuflady: "przod_tylko", plecy: true },
  custom:          { nazwa: "Moduł niestandardowy", szerokosc: 600, wysokosc: 720, glebokosc: 500, polki: 1, drzwi: 0, szuflady_niska: 0, szuflady_srednia: 0, szuflady_wysoka: 0, system_szuflad: "legrabox", typ_szuflady: "przod_tylko", plecy: true },
};

// Minimalne wysokości frontu [mm] wg oficjalnego katalogu technicznego Blum
const SYSTEMY_SZUFLAD = {
  legrabox:  { nazwa: "Blum LEGRABOX",         niska: 107, srednia: 132, wysoka: 170 },
  tandembox: { nazwa: "Blum TANDEMBOX antaro", niska: 111, srednia: 126, wysoka: 156 },
};

const GRUBOSC_BOKU_SZUFLADY = 12;
const LUZ_PROWADNICE_WYS = 20;
const LUZ_PROWADNICE_GLEB = 50;
const LUZ_PROWADNICE_SZER = 26;

const KATALOG_AGD = {
  piekarnik: { nazwa: "Piekarnik do zabudowy",     szerokosc: 560, wysokosc: 585,  miejsce: "front" },
  mikrofala: { nazwa: "Mikrofala do zabudowy",     szerokosc: 560, wysokosc: 380,  miejsce: "front" },
  zmywarka:  { nazwa: "Zmywarka do zabudowy",      szerokosc: 598, wysokosc: 820,  miejsce: "front" },
  lodowka:   { nazwa: "Lodówka do zabudowy",       szerokosc: 560, wysokosc: 1780, miejsce: "front" },
  plyta:     { nazwa: "Płyta grzewcza",            szerokosc: 560, wysokosc: 0,    miejsce: "blat" },
  okap:      { nazwa: "Okap (podszafkowy/wyciąg)", szerokosc: 600, wysokosc: 150,  miejsce: "gorna" },
  inne:      { nazwa: "Inne AGD",                  szerokosc: 560, wysokosc: 400,  miejsce: "front" },
};

function round1(x) { return Math.round(x * 10) / 10; }

function calcModule(m, ostrzezenia) {
  const t = parseFloat(m.grubosc ?? 18);
  const w = parseFloat(m.szerokosc);
  const h = parseFloat(m.wysokosc);
  const d = parseFloat(m.glebokosc);
  const polki = parseInt(m.polki || 0);
  const drzwi = parseInt(m.drzwi || 0);
  const nNiska = parseInt(m.szuflady_niska || 0);
  const nSrednia = parseInt(m.szuflady_srednia || 0);
  const nWysoka = parseInt(m.szuflady_wysoka || 0);
  const systemSzuflad = m.system_szuflad || "legrabox";
  const typSzuflady = m.typ_szuflady || "przod_tylko";
  const plecy = m.plecy !== false;
  const uslojenie = m.uslojenie || "pion";
  const dekorKod = m.dekor_kod || "-";
  const dekorNazwa = m.dekor_nazwa || "(nie wybrano)";
  const dekorFrontowKod = m.dekor_frontow_kod || dekorKod;
  const dekorFrontowNazwa = m.dekor_frontow_nazwa || dekorNazwa;
  const nazwaModulu = m.nazwa_modulu || m.nazwa || "Moduł";

  const wysKlasDomyslne = SYSTEMY_SZUFLAD[systemSzuflad] || SYSTEMY_SZUFLAD.legrabox;
  const wysKlas = {
    niska: (m.wys_niska !== undefined && m.wys_niska !== null && m.wys_niska !== "") ? parseFloat(m.wys_niska) : wysKlasDomyslne.niska,
    srednia: (m.wys_srednia !== undefined && m.wys_srednia !== null && m.wys_srednia !== "") ? parseFloat(m.wys_srednia) : wysKlasDomyslne.srednia,
    wysoka: (m.wys_wysoka !== undefined && m.wys_wysoka !== null && m.wys_wysoka !== "") ? parseFloat(m.wys_wysoka) : wysKlasDomyslne.wysoka,
    nazwa: wysKlasDomyslne.nazwa,
  };

  const elems = [];
  function add(element, wymDl, wymSzer, ilosc, obrzeze, opts) {
    opts = opts || {};
    const grubosc = opts.grubosc;
    const front = !!opts.front;
    const agd = !!opts.agd;
    const model = opts.model || "";
    elems.push({
      modul: nazwaModulu,
      element,
      dekor_kod: agd ? "-" : (front ? dekorFrontowKod : dekorKod),
      dekor_nazwa: agd ? "—" : (front ? dekorFrontowNazwa : dekorNazwa),
      grubosc: agd ? 0.0 : (grubosc !== undefined ? grubosc : t),
      dlugosc: round1(wymDl),
      szerokosc: round1(wymSzer),
      ilosc,
      obrzeze,
      uslojenie: (agd || grubosc !== undefined) ? "-" : uslojenie,
      agd,
      model,
    });
  }

  if (w <= 2 * t || h <= 0 || d <= 0) return elems;

  add("Bok", h, d, 2, "1 kr. dł. (przód)");
  add("Wieniec (góra/dół)", w - 2 * t, d, 2, "1 kr. dł. (przód)");

  if (polki > 0) add("Półka", w - 2 * t - 2, Math.max(d - 20, 50), polki, "1 kr. dł. (przód)");

  const agdLista = m.agd || [];
  const agdFront = [];
  const agdInne = [];
  agdLista.forEach(a => {
    if ((a.miejsce || "front") === "front" && parseFloat(a.wysokosc || 0) > 0) agdFront.push(a);
    else agdInne.push(a);
  });

  const margin = 2.0, gap = 3.0;
  const rzedySzuflad = [];
  [["niska", nNiska], ["srednia", nSrednia], ["wysoka", nWysoka]].forEach(([klasa, n]) => {
    for (let i = 0; i < n; i++) rzedySzuflad.push([klasa, wysKlas[klasa]]);
  });
  const rzedyAgd = agdFront.map(a => [a, parseFloat(a.wysokosc)]);

  const nRzedow = rzedySzuflad.length + rzedyAgd.length + (drzwi > 0 ? 1 : 0);
  const sumaWysZajete = rzedySzuflad.reduce((s, [, hh]) => s + hh, 0) + rzedyAgd.reduce((s, [, hh]) => s + hh, 0);
  const sumaGap = nRzedow > 1 ? gap * (nRzedow - 1) : 0;
  const wysRzeduDrzwi = h - 2 * margin - sumaGap - sumaWysZajete;

  if (ostrzezenia) {
    if (drzwi > 0 && wysRzeduDrzwi < 80) {
      ostrzezenia.push(`Moduł „${nazwaModulu}”: suma wysokości szuflad i AGD (${sumaWysZajete.toFixed(0)} mm) jest zbyt duża względem wysokości modułu (${h.toFixed(0)} mm) — rząd drzwi wyszedłby niższy niż 80 mm. Zmniejsz liczbę szuflad/AGD albo zwiększ wysokość modułu.`);
    } else if (sumaWysZajete > 0 && (h - 2 * margin - sumaGap - sumaWysZajete) < 0 && drzwi === 0) {
      ostrzezenia.push(`Moduł „${nazwaModulu}”: suma wysokości szuflad i AGD (${sumaWysZajete.toFixed(0)} mm) przekracza wysokość modułu (${h.toFixed(0)} mm). Zwiększ wysokość modułu albo zmniejsz liczbę pozycji.`);
    }
  }

  const nazwyKlas = { niska: "niska", srednia: "średnia", wysoka: "wysoka" };
  const etykietaSystemu = wysKlas.nazwa;

  rzedySzuflad.forEach(([klasa, wysFrontu]) => {
    add(`Front szuflady (${nazwyKlas[klasa]}, ${etykietaSystemu})`, wysFrontu, Math.max(w - 2 * margin, 50), 1, "4 krawędzie", { front: true });
    if (typSzuflady === "drewniana") {
      const bodyH = Math.max(wysFrontu - LUZ_PROWADNICE_WYS, 40);
      const bodyD = Math.max(d - LUZ_PROWADNICE_GLEB, 100);
      const bodyW = Math.max(w - 2 * t - LUZ_PROWADNICE_SZER, 100);
      add(`Bok szuflady (${nazwyKlas[klasa]})`, bodyH, bodyD, 2, "brak", { grubosc: GRUBOSC_BOKU_SZUFLADY });
      add(`Przód/tył szuflady wew. (${nazwyKlas[klasa]})`, bodyH, bodyW, 2, "brak", { grubosc: GRUBOSC_BOKU_SZUFLADY });
      add(`Dno szuflady HDF (${nazwyKlas[klasa]})`, bodyW, bodyD, 1, "brak", { grubosc: 3.0 });
    }
  });

  rzedyAgd.forEach(([a, wysNisza]) => {
    const nazwaAgd = a.nazwa || "AGD";
    const model = a.model || "";
    const etykieta = `Nisza AGD: ${nazwaAgd}` + (model ? ` (${model})` : "");
    const szerNisza = parseFloat(a.szerokosc || (w - 2 * margin));
    add(etykieta, wysNisza, szerNisza, 1, "brak", { agd: true, model });
  });

  if (drzwi > 0) {
    const szerFrontu = (w - (drzwi + 1) * gap) / drzwi;
    add("Front (drzwi)", Math.max(wysRzeduDrzwi, 50), Math.max(szerFrontu, 50), drzwi, "4 krawędzie", { front: true });
  }

  agdInne.forEach(a => {
    const nazwaAgd = a.nazwa || "AGD";
    const model = a.model || "";
    const miejsce = a.miejsce || "front";
    const etykietaMiejsca = { blat: "wycięcie w blacie", gorna: "w szafce górnej / dnie" }[miejsce] || miejsce;
    const etykieta = `AGD: ${nazwaAgd}` + (model ? ` (${model})` : "") + ` — ${etykietaMiejsca}`;
    add(etykieta, parseFloat(a.wysokosc || 0), parseFloat(a.szerokosc || 0), 1, "brak", { agd: true, model });
  });

  if (plecy) add("Plecy (HDF 3mm)", Math.max(w - 4, 10), Math.max(h - 4, 10), 1, "brak", { grubosc: 3.0 });

  return elems;
}

function calcProject(modules) {
  const allElems = [];
  const ostrzezenia = [];
  modules.forEach(m => allElems.push(...calcModule(m, ostrzezenia)));
  return { elems: allElems, ostrzezenia };
}

function aggregateFormatki(elems) {
  const groups = {};
  elems.forEach(e => {
    const key = [e.element, e.dekor_kod, e.grubosc, e.dlugosc, e.szerokosc, e.obrzeze, e.uslojenie].join("||");
    if (!groups[key]) groups[key] = { ...e, ilosc: 0, moduly: new Set() };
    groups[key].ilosc += e.ilosc;
    groups[key].moduly.add(e.modul);
  });
  const result = Object.values(groups).map(g => ({ ...g, moduly: Array.from(g.moduly).sort().join(", ") }));
  result.sort((a, b) => (a.dekor_kod + a.element).localeCompare(b.dekor_kod + b.element));
  return result;
}

function obliczProjekt(modules) {
  const { elems, ostrzezenia } = calcProject(modules);
  const formatkiElems = elems.filter(e => !e.agd);
  const agdElems = elems.filter(e => e.agd);
  const agg = aggregateFormatki(formatkiElems);
  const totalSzt = agg.reduce((s, e) => s + e.ilosc, 0);
  const totalM2 = agg.reduce((s, e) => s + (e.dlugosc / 1000) * (e.szerokosc / 1000) * e.ilosc, 0);
  return {
    szczegolowo: formatkiElems,
    zbiorczo: agg,
    agd: agdElems,
    podsumowanie: { pozycji: agg.length, sztuk_lacznie: totalSzt, powierzchnia_m2: Math.round(totalM2 * 100) / 100 },
    ostrzezenia,
  };
}
