# Import z appki Claude — dyktowanie opisu kuchni prosto do projektu

Zamiast klikać każdy moduł osobno, możesz **opisać całą zabudowę słowami**
(np. dyktując w appce Claude na telefonie, stojąc u klienta), a Claude
zamieni to na gotowy plik, który wklejasz w moim programie przyciskiem
**„Importuj z tekstu"**.

## Jak to zrobić krok po kroku

1. Otwórz appkę **Claude** na iPhonie (albo dowolną przeglądarkę na
   claude.ai).
2. Skopiuj i wklej **cały poniższy blok „SZABLON DO WKLEJENIA"**, a na
   końcu dopisz (albo nadyktuj mikrofonem na klawiaturze) swój opis
   zabudowy — tak jak byś opisywał ją koledze: co stoi z lewej do prawej,
   jakie AGD, jakie szuflady, jaka szerokość.
3. Wyślij wiadomość. Claude odpowie gotowym plikiem JSON.
4. Skopiuj **całą** odpowiedź (od `[` albo `{` na początku, do `]` albo `}`
   na końcu).
5. W moim programie kliknij **„Importuj z tekstu"**, wklej, kliknij
   **„Importuj moduły"**.
6. Moduły pojawią się w projekcie — dopracuj kolory (jeśli nie zgadłem
   dokładnych kodów z Twojej bazy) i skoryguj wymiary, jeśli trzeba.

## SZABLON DO WKLEJENIA (skopiuj całość razem ze swoim opisem na końcu)

```
Jesteś generatorem danych do mojego programu "Projektant mebli". Na
podstawie opisu zabudowy kuchennej poniżej, wygeneruj TYLKO poprawny JSON
(bez żadnego tekstu przed ani po, bez komentarzy, bez bloku markdown ```)
w formacie:

{
  "nazwa_projektu": "krótka nazwa projektu",
  "moduly": [
    {
      "nazwa_modulu": "string, opisowa nazwa",
      "typ": "szafka_dolna | szafka_szuflady | szafka_gorna | slupek | regal | szafa | custom",
      "szerokosc": liczba w mm,
      "wysokosc": liczba w mm,
      "glebokosc": liczba w mm,
      "grubosc": liczba w mm (domyślnie 18, pomiń jeśli standard),
      "polki": liczba półek (int),
      "drzwi": liczba drzwi (int, 0 jeśli szafka bez frontu drzwiowego),
      "system_szuflad": "legrabox | tandembox",
      "typ_szuflady": "przod_tylko | drewniana",
      "szuflady_niska": liczba szuflad niskich (int),
      "szuflady_srednia": liczba szuflad średnich (int),
      "szuflady_wysoka": liczba szuflad wysokich (int),
      "plecy": true/false,
      "uslojenie": "pion | poziom",
      "dekor_kod": "kod dekoru JEŚLI użytkownik go podał (np. D375), inaczej pomiń",
      "dekor_nazwa": "nazwa dekoru JEŚLI podana, inaczej pomiń",
      "dekor_frontow_kod": "TYLKO jeśli fronty mają być w innym kolorze niż korpus",
      "agd": [
        {
          "typ": "piekarnik | mikrofala | zmywarka | lodowka | plyta | okap | inne",
          "model": "model urządzenia jeśli podany, inaczej pusty string",
          "szerokosc": liczba w mm (pomiń, użyję typowej),
          "wysokosc": liczba w mm (pomiń, użyję typowej),
          "miejsce": "front | blat | gorna"
        }
      ]
    }
  ]
}

Zasady:
- Standardowe wymiary bazowe: szafka dolna wys. 720mm, gł. 560mm; szafka
  górna wys. 720mm, gł. 320mm; słupek wys. 2000mm, gł. 560mm — użyj tych
  jeśli użytkownik nie poda inaczej.
- Jeśli moduł ma zawierać kilka szuflad "standardowo" (bez podanych klas),
  rozłóż je rozsądnie: np. 3 szuflady = 1 niska + 1 średnia + 1 wysoka,
  albo trzymaj się tego, co użytkownik jednoznacznie powiedział.
- AGD typu "piekarnik", "mikrofala", "zmywarka", "lodowka" zajmują miejsce
  we froncie (miejsce: "front"). "plyta" (płyta grzewcza) to zawsze
  miejsce: "blat". "okap" to miejsce: "gorna".
- Nie zgaduj kolorów/dekorów, których użytkownik nie podał wprost — pomiń
  pola dekor_kod/dekor_nazwa, użytkownik dobierze je sam w aplikacji.
- Jeśli czegoś nie da się jednoznacznie ustalić z opisu, wybierz najbardziej
  typowe, rozsądne rozwiązanie stolarskie i idź dalej — nie zadawaj pytań,
  to ma być gotowy plik do wklejenia.

Oto opis zabudowy:
[TU DOPISZ / NADYKTUJ SWÓJ OPIS]
```

## Przykład (na podstawie prawdziwej kuchni)

Opis: *„Z lewej strony ścianka boczna, zmywarka 60, szafka pod umywalką 60,
szafka z płytą gazową i z szufladami 60, szafka z szufladami 45, wszystko
przykryte blatem. Nad zmywarką słupek z mikrofalówką i piekarnikiem oraz
szafka pod sufit. Szafki górne standardowe, nad płytą pochłaniacz
standardowy."*

Taki opis Claude zamieni na plik podobny do tego (skrócony, dla poglądu —
pełny, gotowy do wklejenia przykład znajdziesz w pliku
`przyklad_import.json` obok tego README — możesz go od razu zaimportować,
żeby zobaczyć jak to działa, zanim spróbujesz własnego opisu):

```json
{
  "nazwa_projektu": "Kuchnia — przykład",
  "moduly": [
    { "nazwa_modulu": "Zmywarka 60", "szerokosc": 600, "wysokosc": 820, "glebokosc": 560, "drzwi": 0,
      "agd": [{ "typ": "zmywarka", "model": "", "miejsce": "front" }] },
    { "nazwa_modulu": "Szafka pod umywalką 60", "typ": "szafka_dolna", "szerokosc": 600, "drzwi": 1 },
    { "nazwa_modulu": "Szafka z płytą i szufladami 60", "typ": "szafka_dolna", "szerokosc": 600, "drzwi": 0,
      "szuflady_niska": 1, "szuflady_srednia": 1, "szuflady_wysoka": 1,
      "agd": [{ "typ": "plyta", "miejsce": "blat" }] },
    { "nazwa_modulu": "Szafka z szufladami 45", "typ": "szafka_dolna", "szerokosc": 450, "drzwi": 0,
      "szuflady_niska": 1, "szuflady_srednia": 1, "szuflady_wysoka": 1 }
  ]
}
```

## Ważna uwaga o kolejności AGD w module

Silnik układa fronty w module od góry w kolejności: najpierw szuflady,
potem nisze AGD, na końcu ewentualne drzwi (na resztę wysokości). Jeśli
opisujesz słupek, w którym szafka ma być **nad** piekarnikiem (a nie pod),
zaimportowany moduł i tak policzy poprawną listę formatek (boki, plecy,
wieńce są niezależne od kolejności frontów) — tylko wizualizacja pokaże
drzwi poniżej AGD zamiast powyżej. Jeśli to dla Ciebie ważne przy
prezentacji klientowi, popraw kolejność ręcznie w edycji modułu.
