#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
spakuj_do_apki.py
==================
Uruchamiany RAZ (i po każdej aktualizacji kolorów) na komputerze, gdzie masz
już zbudowaną bazę `abler_kolory.db` i folder `obrazy/` (przez abler_sync.py).

Co robi:
  1. Czyta aktywne dekory z abler_kolory.db.
  2. Kompresuje ich miniatury i zaszywa bezpośrednio (jako base64) w jednym
     pliku projektant_pwa/data/kolory.json — dzięki temu do wgrania na
     GitHub jest JEDEN plik zamiast setek osobnych zdjęć (które łatwo
     "udławią" wgrywanie przez przeglądarkę).
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

import os
import re
import sqlite3
import sys
import time
import json
import base64
import io

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

MAX_SZEROKOSC_PX = 260   # miniatury zmniejszane do tej szerokości - appka lekka i szybka
JPEG_QUALITY = 72        # trochę niższa jakość niż zwykły plik, bo i tak to tylko miniaturka wyboru koloru


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
    for i, r in enumerate(rows, start=1):
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

        if i % 50 == 0:
            print(f"  ...przetworzono {i}/{len(rows)}")

    with open(OUT_JSON, "w", encoding="utf-8") as f:
        json.dump(wynik, f, ensure_ascii=False)

    # Podbij wersję cache w Service Workerze, żeby telefon pobrał świeże dane
    if os.path.exists(SW_PATH):
        nowa_wersja = f"v{int(time.time())}"
        sw_content = open(SW_PATH, encoding="utf-8").read()
        sw_content = re.sub(r'const CACHE_VERSION = "v[^"]*";', f'const CACHE_VERSION = "{nowa_wersja}";', sw_content)
        open(SW_PATH, "w", encoding="utf-8").write(sw_content)

    rozmiar_mb = os.path.getsize(OUT_JSON) / 1024 / 1024

    print(f"Gotowe! Spakowano {len(wynik)} dekorów (pominięto: {pominieto}).")
    print(f"Rozmiar pliku data/kolory.json: {rozmiar_mb:.1f} MB")
    print(f"Zapisano: {OUT_JSON}")
    print()
    print("WAŻNE: to teraz JEDEN plik (kolory.json) zamiast setek zdjęć —")
    print("wgraj go na GitHub tak samo jak resztę plików appki, osobno,")
    print("jeśli przy wspólnym przeciąganiu znów coś się nie uda.")
    print()
    print("Następny krok: wgraj pliki z folderu 'projektant_pwa' na darmowy")
    print("hosting (np. GitHub Pages) i otwórz stronę w Safari na iPhonie —")
    print("instrukcja w README.md.")


if __name__ == "__main__":
    main()
