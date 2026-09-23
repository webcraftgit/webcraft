WIŚNIOWA — zdjęcia do demo / photo drop-in
==========================================

JEŚLI ZDJĘĆ NIE WIDAĆ, TO ZNACZY ŻE TYCH PLIKÓW TU NIE MA.
Strona sama to pokazuje: w pustym kadrze wypisana jest ścieżka pliku, którego
szuka, a konsola przeglądarki loguje ostrzeżenie dla każdego brakującego slotu.

Wrzuć pliki TUTAJ (public/demo/wisniowa/), pod tymi nazwami:

  hero          gabinet / korytarz, KADR SZEROKI, światło dzienne, bez ludzi.
                Idzie na całą szerokość pod nagłówkiem — lewa 1/3 kadru
                powinna być pusta i musi znieść przyciemnienie.
  reception     recepcja i poczekalnia od strony drzwi (pion 4:5)
  detail        detal — dłonie, narzędzia, mała głębia ostrości (pion 4:5)
  team          cały zespół, jedna ściana, jeden obiektyw, kadr szeroki (16:7)
  quote         PORTRET (kadr pionowy), jedna osoba, spojrzenie poza obiektyw
  gallery-1     moment zabiegu (4:3)
  gallery-2     sprzęt / technologia (pion 3:4)
  gallery-3     spokojny kąt gabinetu (4:3)
  street        front budynku z drugiej strony ulicy (4:3)

PO WRZUCENIU PLIKU DOPISZ GO DO `LOCAL` w components/showcase/demos/wisniowa/
photos.tsx, np.  hero: "hero.webp",  — jedna linijka. Rozszerzenie dowolne
(.jpg .jpeg .webp .png). Wcześniej strona zgadywała rozszerzenia sama, ale
kosztowało to 28 błędów 404 na każde wejście i opóźniało zdjęcie w nagłówku.
Bez wpisu w LOCAL slot pokazuje zdjęcie z Unsplash.

ZDJĘCIA Z ZEWNĘTRZNEGO HOSTA: w photos.tsx zamiast nazwy wpisz pełny adres
https://... Działa to dopiero od CP4_3, bo wcześniej `img-src 'self'` w
next.config.mjs blokował takie obrazki na poziomie CSP — cicho, bez błędu sieci.

LICENCJA — wszystko w /public jest publicznie do pobrania. Używaj źródeł, które
pozwalają na redystrybucję (licencja Unsplash pozwala; większość stocków
"free for personal use" NIE). Nie wrzucaj pliku, którego licencji nie
przeczytałeś.
