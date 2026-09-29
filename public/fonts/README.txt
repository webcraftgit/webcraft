NOKTURN — krój wordmarku
========================

Napis "NOKTURN" (nagłówek, hero, stopka) jest złożony krojem
UnifrakturMaguntia (@fontsource/unifrakturmaguntia, serwowany z naszego
origin). To blackletter, ten sam gatunek co docelowy krój marki.

Docelowy krój marki to METAL MACABRE (1001fonts). Nie ma go w repo, bo jego
licencja (1001Fonts FFC) pozwala używać go komercyjnie na stronie, ale:
  - zabrania modyfikacji (także konwersji TTF -> WOFF2),
  - zabrania publikowania pliku bez zgody autora — wrzucenie go do repo na
    GitHubie może się pod to łapać.

Wcześniej w components/showcase/demos/nokturn/fonts.css była deklaracja
@font-face wskazująca na public/fonts/metal-macabre.woff2/.ttf. Pliku nie
było, więc każda wizyta na / (tablet/desktop, gdzie demo działa na żywo)
dawała dwa błędy 404 w konsoli. Deklaracja została usunięta.


JAK PRZYWRÓCIĆ METAL MACABRE
----------------------------
Tylko jeśli licencja na to pozwala (np. pisemna zgoda autora):
  1. wrzuć NIEZMIENIONY plik jako public/fonts/metal-macabre.ttf
  2. przywróć fonts.css z historii gita (git log -- components/showcase/demos/nokturn/fonts.css),
     zostaw w nim tylko źródło .ttf, i dodaj z powrotem import w NokturnSite.tsx
  3. dopisz "Metal Macabre" na początek stałej WORDMARK w NokturnSite.tsx


POLSKIE ZNAKI
-------------
Kroje blackletter zwykle nie mają glifów ą ć ę ł ń ś ź ż. Dlatego blackletter
jest w kodzie użyty WYŁĄCZNIE do słowa "NOKTURN". Nagłówki i nazwy produktów
składane są Bodoni Moda (pełne pokrycie latin + latin-ext).


LOGO (osobna sprawa)
--------------------
Znak graficzny — krzyż z pionowym napisem NOKTURN — leży jako wektor w
public/demo/nokturn/mark.svg i NIE potrzebuje żadnego fontu; litery są tam
zamienione na krzywe.
