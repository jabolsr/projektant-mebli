#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
spakuj_do_apki.py
==================
Uruchamiany RAZ (i po każdej aktualizacji kolorów) na komputerze, gdzie masz
już zbudowaną bazę `abler_kolory.db` i folder `obrazy/` (przez abler_sync.py).

Co robi:
  1. Czyta aktywne dekory z abler_kolory.db.
  2. Kompresuje ich miniatury i zaszywa jako base64 wprost w
     projektant_pwa/data/kolory.json (bez osobnych plików obrazów) — dzięki
     temu cały pakiet to garstka plików, którą da się bez problemu wgrać
     na GitHub czy inny hosting.
  3. Podbija numer wersji w sw.js, żeby telefon pobrał świeże dane zamiast
     starych z pamięci podręcznej.

Wymaga: pip install pillow
Uruchom: python spakuj_do_apki.py

Oczekiwana struktura folderów (przykład):
    Twoj_folder/
      abler_kolory.db
      obrazy/...
      projektant_pwa/          <- ten folder (z index.html, app.js, itd.)
        spakuj_do_apki.py      <- ten skrypt
"""

import base64
import io
import os
import re
import sqlite3
import sys
import time
import json

try:
    from PIL import Image
except ImportError:
    print("Brakuje pakietu 'Pillow'. Zainstaluj: pip install pillow")
    sys.exit(1)

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))          # .../projektant_pwa
BASE_DIR = os.path.dirname(SCRIPT_DIR)                           # folder nadrzędny z bazą
DB_PATH = os.path.join(BASE_DIR, "abler_kolory.db")

OUT_DATA_DIR = os.path.join(SCRIPT_DIR, "data")
OUT_JSON = os.path.join(OUT_DATA_DIR, "kolory.json")
SW_PATH = os.path.join(SCRIPT_DIR, "sw.js")

MAX_SZEROKOSC_PX = 420   # miniatury zmniejszane do tej szerokości - appka lekka i szybka
JPEG_QUALITY = 82


def main():
    if not os.path.exists(DB_PATH):
        print(f"BŁĄD: nie znaleziono {DB_PATH}")
        print("Ten skrypt musi siedzieć w folderze projektant_pwa, który z kolei")
        print("jest w tym samym folderze co abler_kolory.db i obrazy/.")
        sys.exit(1)

    os.makedirs(OUT_DATA_DIR, exist_ok=True)

    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    rows = conn.execute(
        "SELECT id, kategoria, lp, nazwa, kod, plik_miniatura FROM dekory "
        "WHERE status='aktywny' ORDER BY kategoria, lp"
    ).fetchall()
    conn.close()

    if not rows:
        print("UWAGA: baza nie ma żadnych aktywnych dekorów. Uruchom najpierw abler_sync.py.")

    wynik = []
    pominieto = 0
    for r in rows:
        if not r["plik_miniatura"]:
            pominieto += 1
            continue
        src_path = os.path.join(BASE_DIR, r["plik_miniatura"])
        if not os.path.exists(src_path):
            pominieto += 1
            continue

        try:
            with Image.open(src_path) as im:
                im = im.convert("RGB")
                if im.width > MAX_SZEROKOSC_PX:
                    ratio = MAX_SZEROKOSC_PX / im.width
                    im = im.resize((MAX_SZEROKOSC_PX, max(int(im.height * ratio), 1)), Image.LANCZOS)
                buf = io.BytesIO()
                im.save(buf, "JPEG", quality=JPEG_QUALITY, optimize=True)
                b64 = base64.b64encode(buf.getvalue()).decode("ascii")
                data_uri = f"data:image/jpeg;base64,{b64}"
        except Exception as e:
            print(f"  [pominięto] {r['nazwa']} ({r['kod']}) — błąd obrazu: {e}")
            pominieto += 1
            continue

        wynik.append({
            "id": r["id"],
            "kategoria": r["kategoria"],
            "nazwa": r["nazwa"],
            "kod": r["kod"],
            "miniatura": data_uri,
        })

    with open(OUT_JSON, "w", encoding="utf-8") as f:
        json.dump(wynik, f, ensure_ascii=False)

    # Podbij wersję cache w Service Workerze, żeby telefon pobrał świeże dane
    if os.path.exists(SW_PATH):
        nowa_wersja = f"v{int(time.time())}"
        sw_content = open(SW_PATH, encoding="utf-8").read()
        sw_content = re.sub(r'const CACHE_VERSION = "v[^"]*";', f'const CACHE_VERSION = "{nowa_wersja}";', sw_content)
        open(SW_PATH, "w", encoding="utf-8").write(sw_content)

    json_size = os.path.getsize(OUT_JSON)

    print(f"Gotowe! Spakowano {len(wynik)} dekorów (pominięto: {pominieto}).")
    print(f"Rozmiar {os.path.basename(OUT_JSON)}: {json_size / 1024 / 1024:.1f} MB (obrazki zaszyte w środku)")
    print(f"Zapisano: {OUT_JSON}")
    print()
    print("Następny krok: wgraj cały folder 'projektant_pwa' na darmowy hosting")
    print("(np. GitHub Pages) i otwórz stronę w Safari na iPhonie —")
    print("instrukcja w README.md.")


if __name__ == "__main__":
    main()
