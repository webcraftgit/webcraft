NOKTURN — zdjęcia produktów / product photo drop-in
====================================================

JEŚLI W SIATCE WIDAĆ PUSTE RAMKI Z KRZYŻYKAMI W ROGACH, TO ZNACZY ŻE TYCH
PLIKÓW TU NIE MA. Każda ramka wypisuje nazwę pliku, którego szuka, oraz
rozmiar, w jakim należy go wyeksportować. Nic nie trzeba zmieniać w kodzie —
wrzucenie pliku o właściwej nazwie natychmiast go podmienia.


NAZEWNICTWO
-----------
  <id-produktu>-front.webp
  <id-produktu>-back.webp

Człon `-front` / `-back` MUSI być dokładnie taki — na nim opiera się cały
mechanizm podmiany. Człon `<id-produktu>` jest dowolny, ale musi być zapisany
znakami ASCII, małymi literami, bez spacji i bez polskich znaków
(np. `calun`, `black-veil`). To on staje się identyfikatorem produktu.

ROZSZERZENIE NIE MA ZNACZENIA: .jpg .jpeg .webp .png — każdy slot próbuje po
kolei wszystkich czterech. WEBP jest preferowany (mniej więcej połowa wagi
przy tej samej jakości).


ROZMIAR — 4:5, NIE 3:4
----------------------
  front, back    kadr 4:5 pionowy, wyeksportuj 1400 × 1750

Ramka w kodzie ma proporcje 4:5. Plik w innych proporcjach nie zepsuje się,
ale zostanie przycięty przez `object-cover` — przy 3:4 znika około 7%
wysokości, czyli zwykle dół ubrania.

WAGA: celuj poniżej ~250 KB na plik (WebP, jakość 75–80). Cały katalog leży
w /public, więc jest publicznie do pobrania i wlicza się w budżet strony.
6 produktów × 2 zdjęcia × 250 KB to już 3 MB.


DWA ZDJĘCIA NA PRODUKT, JEDEN KOLOR
-----------------------------------
Sklep jest ustawiony na dokładnie dwa ujęcia (przód i tył) i jedną wersję
kolorystyczną — czerń. Nie ma ujęć `detail` ani `worn`, nie ma próbników
koloru. Jeśli kiedyś dojdzie drugi kolor, próbniki wracają automatycznie
(kod sprawdza, czy jest z czego wybierać) — ale zdjęcia trzeba wtedy nazwać
per kolor i to wymaga zmiany w kodzie.


NAJEŻDŻANIE MYSZĄ — DLATEGO `back` JEST OBOWIĄZKOWE
---------------------------------------------------
W siatce produktów najechanie kursorem na zdjęcie przechodzi płynnie
z `front` na `back`. To jest główny sposób, w jaki siatka pokazuje nadruk —
a nadruk w tej marce jest na plecach, więc samo `front` pokazuje najmniej
ciekawą stronę ubrania.

  · Brak pliku `back` = kafelek po prostu nie reaguje na kursor. Nic się nie
    psuje, ale produkt traci najlepszy element prezentacji.
  · `front` i `back` MUSZĄ być zrobione w tym samym kadrze, tej samej skali
    i na tym samym tle. Przejście jest przenikaniem, więc każda różnica
    w wielkości ubrania czy w kolorze tła będzie widoczna jako „skok”.
  · Efekt działa tylko na myszy — na telefonie i tablecie nie ma najeżdżania,
    więc `front` musi się bronić samodzielnie.
  · Na stronie głównej (kafelek podglądu) ujęcia `back` NIE są wczytywane —
    tam nie da się najechać kursorem, więc nie ma po co ich pobierać.


SPÓJNOŚĆ NADRUKU
----------------
Ujęcia `front` i `back` tego samego produktu muszą pokazywać tę samą grafikę
i to samo ubranie. Jeśli każde ujęcie zostanie wygenerowane osobno, nadruk
i krój będą się między nimi różnić — i to jest dokładnie ten moment, w którym
widz orientuje się, że sklep jest nieprawdziwy. Zrób raz puste ubranie,
a potem nałóż na nie grafikę: wtedy nadruk jest identyczny wszędzie.

To samo dotyczy całego katalogu — jedno tło i jeden kadr dla wszystkich
sześciu produktów robi większość roboty w tym, żeby sklep wyglądał na prawdziwy.


AUTOMATYCZNE WYRÓWNANIE — scripts/normalize-nokturn-photos.py
-------------------------------------------------------------
Nie musisz sam kadrować ani centrować. Skrypt robi to na podstawie kanału
alfa (czyli dokładnej sylwetki ubrania, nie zgadywanego kadru):

  python3 scripts/normalize-nokturn-photos.py lobotomy-hoodie \
      surowe/przod.webp surowe/tyl.webp

  · przycina do rzeczywistych granic ubrania
  · skaluje OBA ujęcia TYM SAMYM współczynnikiem
  · centruje w kadrze 4:5 i zapisuje 1400×1750 WebP z przezroczystością

URUCHAMIAJ OBA UJĘCIA RAZEM. Wspólny współczynnik skali liczony jest ze
wspólnych granic przodu i tyłu — jeśli przepuścisz pliki osobno, tył
o kilka pikseli węższy zostanie powiększony inaczej niż przód i ubranie
będzie „oddychać” podczas przenikania. To jest dokładnie ten błąd, któremu
skrypt ma zapobiegać.

TŁO MA BYĆ PRZEZROCZYSTE. Kolor kafelka pod ubraniem ustawia kod
(`T.tile` w NokturnSite.tsx), więc przezroczysty eksport pozwala dobrać go
później bez ponownego eksportowania zdjęć. Białe tło wypalone w plik
odbierze tę możliwość i zrobi jasny prostokąt na ciemnej stronie.


TŁO WYPALONE W PIKSELE — WYKRYWANE AUTOMATYCZNIE
------------------------------------------------
Część eksportów przychodzi z SZACHOWNICĄ przezroczystości wypaloną w piksele:
kanał alfa jest wtedy pełnym prostokątem, a „tło” to zwykłe dane obrazu.
W podglądzie pliku wygląda to identycznie jak prawdziwa przezroczystość.

Skrypt rozpoznaje to sam — nie po alfie (te eksporty mają miękką, częściowo
przezroczystą obwódkę, więc test „czy alfa jest prostokątem” zawodzi), tylko
po tym, CO zawierają nieprzezroczyste piksele: prawidłowo wycięte ubranie to
niemal sama ciemna tkanina (~10% jasnych pikseli), a wypalona szachownica to
połowa jasnych kwadratów (~50%).

Wycinanie odcina też wszystko, co wychodzi POZA sylwetkę ubrania: szarą
smugę, rozbryzgi i pojedyncze kolce drutu kolczastego wystające za rękaw.
Nadruk wewnątrz ubrania zostaje nietknięty.

SKALA WYRÓWNYWANA JEST PO WYSOKOŚCI UBRANIA (zmiana, CP4_24)
------------------------------------------------------------
Wcześniej skrypt skalował każde zdjęcie tak, żeby ramka alfa zajmowała 88%
szerokości kadru. To brzmi rozsądnie i jest błędne: ramka alfa ubrania to
ROZPIĘTOŚĆ RĘKAWÓW, a nie szerokość korpusu.

Koszulki przyszły z rękawami rozłożonymi szeroko, bluzy z rękawami wzdłuż
tułowia. Wyrównanie obu do tej samej rozpiętości rękawów ścisnęło więc korpusy
koszulek. Pomiar na dostarczonych plikach: korpus koszulki 628 px wobec 1170 px
w bluzie — korpusy bluz były 1,87x szersze, przez skrypt, którego jedynym
zadaniem było ujednolicenie skali. W siatce koszulki wyglądały jak ubranka dla
lalek powieszone obok prawdziwych ubrań.

Teraz mierzona jest WYSOKOŚĆ UBRANIA, od ramion do dołu. Oversize'owa koszulka
i boxy bluza różnią się realną długością o kilka centymetrów (~72 vs ~70 cm),
więc to wysokość odpowiada ustawieniu obu ubrań przed jednym aparatem z tej
samej odległości. Jest też odporna na ułożenie rękawów, czyli dokładnie na tę
zmienną, która psuła poprzednie podejście.

Szerokość wynika już z proporcji samego ubrania: koszulka wychodzi szersza od
bluzy, bo koszulka z rozłożonymi rękawami NAPRAWDĘ jest szersza. To czyta się
jako jedna sesja zdjęciowa i o to chodzi.


PRZÓD I TYŁ DOSTAJĄ JEDNO WSPÓLNE PUDEŁKO
-----------------------------------------
Bluzy przyszły jako osobno generowane rendery o różnych proporcjach — przód
1232x1440, tył 1232x1539, czyli 6,4% różnicy. Przy jakimkolwiek jednolitym
skalowaniu jedna oś zostaje niedopasowana i przenikanie na hoverze zamienia się
w ubranie, które rośnie.

Dlatego wszystkie ujęcia jednego produktu są skalowane do JEDNEGO wspólnego
pudełka, liczonego z mediany proporcji jego własnych ujęć. Wymaga to drobnej
korekty nierównomiernej, ograniczonej przez ANISO_CAP: 6% spłaszczenia na
zdjęciu bluzy jest niewidoczne, 20% już nie. Jeśli produkt przekroczy limit,
skrypt to wypisuje i wraca do skalowania jednolitego, zamiast po cichu
zniekształcić ubranie.

URUCHAMIAJ OBA UJĘCIA RAZEM — wspólne pudełko liczone jest ze wszystkich ujęć
naraz, więc przepuszczenie plików osobno przywraca dokładnie ten skok, któremu
skrypt ma zapobiegać.

Przeliczenie całego katalogu w miejscu:

  python3 scripts/normalize-nokturn-photos.py --renormalise


TŁO MA BYĆ PRZEZROCZYSTE. Kolor kafelka pod ubraniem ustawia kod
(`T.tile` w NokturnSite.tsx), więc przezroczysty eksport pozwala dobrać go
później bez ponownego eksportowania zdjęć. Białe tło wypalone w plik odbierze
tę możliwość i zrobi jasny prostokąt na ciemnej stronie.


TŁO WYPALONE W PIKSELE — WYKRYWANE AUTOMATYCZNIE
------------------------------------------------
Część eksportów przychodzi z SZACHOWNICĄ przezroczystości wypaloną w piksele.
Skrypt rozpoznaje to po tym, CO zawierają nieprzezroczyste piksele: prawidłowo
wycięte ubranie to niemal sama ciemna tkanina (~10% jasnych pikseli), a wypalona
szachownica to połowa jasnych kwadratów (~50%). Wtedy wypisuje ostrzeżenie —
plik trzeba wyeksportować ponownie z prawdziwą alfą.


UJĘCIE PROWADZĄCE W SIATCE
--------------------------
Domyślnie siatka pokazuje `front`, a na hoverze przechodzi na `back`. Produkt
może to odwrócić polem `lead: "back"` w data.ts. Robi tak Burn The Churches,
którego przód to mały krzyż na pustej czarnej koszulce — jako miniatura jest
czarnym prostokątem, a cała grafika jest z tyłu.


ZNAK MARKI — mark.webp (CP4_26)
-------------------------------
public/demo/nokturn/mark.webp to logo w pełnym kolorze (biały krzyż, czerwone
litery), spłaszczone z oryginalnego eksportu CorelDRAW RAZEM z jego 39 PNG-ami
faktur. 710×1400, przezroczyste tło, ~110 KB, jeden request.

Dlaczego raster: w tym eksporcie faktury PNG SĄ logo — wektor pod spodem to
tylko płaska biała sylwetka. SVG + 39 PNG-ów to 3,2 MB i 40 requestów.
Usunięte przy spłaszczaniu: tło #2B2A29 i dwie linie pomocnicze.

Wpięte jako zwykły <img> w hero (BrandMark w NokturnSite.tsx). Kolor jest
wypalony — nie da się go już zmienić z CSS.

Podmiana logo: wyeksportuj nowy plik jako przezroczysty WebP ~1400 px
wysokości, przytnij do granic grafiki i zaktualizuj MARK_W / MARK_H.

mark.svg (stary, jednokolorowy, currentColor) zostaje jako wersja mono na
przyszłość (favicon, stopka, druk) — obecnie NIEUŻYWANY.

Źródło (nokturn logo.svg + katalog PNG) NIE jest w repo — /public jest
publicznie do pobrania. Trzymaj je w materiałach klienta.


KRÓJ DISPLAY — METAL MACABRE
----------------------------
Napis NOKTURN w nagłówku i stopce ma być złożony krojem Metal Macabre.
Pliku fontu nie ma w repo — instrukcja i ścieżka: public/fonts/README.txt.
Do czasu wrzucenia pliku stack schodzi na UnifrakturMaguntia.
