# Projektant mebli — appka na iPhone (działa offline, bez komputera)

To jest wersja Projektanta mebli w pełni działająca w przeglądarce —
**bez Pythona, bez serwera, bez Twojego komputera**. Po jednorazowej
instalacji na iPhonie działa nawet bez internetu, wszędzie — także u klienta.

## Jak to działa (w skrócie)

1. **Raz, u siebie na komputerze**: uruchamiasz skrypt, który pakuje Twoje
   kolory (z `abler_kolory.db` i `obrazy/`) do tej appki.
2. **Raz**: wgrywasz gotowy folder na darmowy hosting (GitHub Pages) —
   to zwykłe, statyczne pliki, nic tam "nie działa" w tle, nic nie może się
   zepsuć ani zasnąć, i jest darmowe na zawsze.
3. **Raz, na iPhonie**: otwierasz link w Safari i dodajesz do ekranu
   głównego — dostajesz normalną ikonkę appki.
4. **Od teraz**: appka działa offline, wszędzie, bez komputera. Wracasz do
   kroku 1 tylko wtedy, gdy chcesz zaktualizować listę kolorów.

## Krok 1 — spakuj kolory do appki

Upewnij się, że folder `projektant_pwa` (ten, w którym jest ten plik) leży
**w tym samym folderze**, co Twój `abler_kolory.db` i `obrazy/` (czyli obok
nich, jako podfolder — tak jak w paczce, którą dostałeś).

```
Twoj_folder/
  abler_kolory.db
  obrazy/...
  projektant_pwa/        <- ten folder
    spakuj_do_apki.py
    index.html
    ...
```

Zainstaluj Pillow (raz):
```
pip install pillow
```

Uruchom (z wnętrza folderu `projektant_pwa`):
```
python spakuj_do_apki.py
```

Skrypt skopiuje i skompresuje miniaturki kolorów do `projektant_pwa/data/`.
Zobaczysz podsumowanie ile dekorów spakowano i jaki to rozmiar (zwykle
kilkanaście MB — appka mimo to zainstaluje się szybko).

## Krok 2 — wystaw appkę w internecie (GitHub Pages, za darmo)

1. Załóż darmowe konto na **github.com** (jeśli jeszcze nie masz).
2. Kliknij **New repository** (zielony przycisk), nadaj nazwę np.
   `projektant-mebli`, zostaw jako **Public**, kliknij **Create repository**.
3. Na stronie repozytorium kliknij link **„uploading an existing file”**
   (albo przycisk **Add file → Upload files**).
4. Przeciągnij **całą zawartość** folderu `projektant_pwa` (czyli
   `index.html`, `app.js`, `calc.js`, `style.css`, `manifest.json`, `sw.js`,
   foldery `data/` i `icons/` — wszystko co jest w środku, nie sam folder)
   do okna przeglądarki. Poczekaj aż się wgra (przy większej bazie kolorów
   może to chwilę potrwać), potem kliknij **Commit changes**.
5. Wejdź w zakładkę repozytorium **Settings → Pages** (w menu po lewej).
6. Przy „Branch” wybierz **main** i folder **/ (root)** → **Save**.
7. Po chwili (1–2 minuty) GitHub pokaże adres appki, coś w stylu:
   `https://twoj-login.github.io/projektant-mebli/`

To jest Twój stały, prywatny (nikt go nie zna, nie jest niczym linkowany)
adres do appki — zapisz go sobie.

## Krok 3 — zainstaluj na iPhonie

1. Otwórz ten adres w **Safari** na iPhonie (musi być Safari, nie Chrome —
   tylko Safari obsługuje instalację appek na iOS).
2. Poczekaj aż strona się w pełni załaduje (przy pierwszym razie pobiera
   wszystkie kolory — potem już nie musi, ma je zapisane offline).
3. Kliknij ikonę **Udostępnij** (kwadrat ze strzałką w górę, na dole
   ekranu).
4. Wybierz **„Dodaj do ekranu początkowego”**.
5. Gotowe — masz ikonkę appki jak każdej innej. Od teraz otwiera się
   w pełnym ekranie i **działa bez internetu**.

## Aktualizacja kolorów w przyszłości

Gdy zmienisz/dodasz kolory (`abler_sync.py`), zrób to samo co w Kroku 1
(`spakuj_do_apki.py`), a potem wgraj **tylko folder `data/`** ponownie
przez GitHub (Add file → Upload files → wrzuć zawartość `data/`, nadpisując
stare pliki) — reszta appki się nie zmienia. Przy następnym otwarciu appki
na iPhonie (z internetem, chociaż raz) pobierze nowe kolory automatycznie.

## Co różni się od wersji na komputer (EXE)

- **Eksport listy formatek**: zamiast pliku Excel — plik **CSV** (otwiera
  się w Excelu/Numbers tak samo, tylko bez kolorowego formatowania) oraz
  przycisk **„Drukuj / zapisz PDF”** (używa wbudowanej funkcji drukowania
  Safari — możesz zapisać jako PDF i wysłać klientowi mailem).
- Reszta — wybór dekoru, moduły, szuflady wg klas Blum, AGD, wizualizacja,
  zapis projektu — działa identycznie, ten sam silnik obliczeń.

## Prywatność

GitHub Pages jest technicznie publiczny (ktoś, kto zgadnie/dostanie dokładny
link, mógłby go otworzyć), ale nie jest nigdzie promowany ani indeksowany
domyślnie. Jeśli zależy Ci na pełnej prywatności danych/projektów klientów —
te dane i tak zostają tylko na Twoim telefonie (localStorage), appka nie
wysyła ich nigdzie. W internecie leżą tylko Twoje kolory/dekory (nie dane
klientów).
