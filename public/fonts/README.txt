NOKTURN — display face drop-in
==============================

BRAKUJE PLIKU FONTU. Napis "NOKTURN" w nagłówku, w hero i w stopce ma być
złożony krojem METAL MACABRE. Tego kroju nie ma w npm ani we Fontsource i nie
jest redystrybuowany razem z tym repo, więc plik trzeba wrzucić ręcznie.


GDZIE WRZUCIĆ
-------------
  public/fonts/metal-macabre.woff2      <- preferowane
  public/fonts/metal-macabre.ttf        <- zadziała, ale ~3x cięższe

Nazwa musi być dokładnie taka. Deklaracja @font-face siedzi w
components/showcase/demos/nokturn/fonts.css i wskazuje na te dwie ścieżki.
Nic więcej nie trzeba zmieniać — po wrzuceniu pliku krój przejmuje wszystkie
miejsca, w których używany jest WORDMARK.


CO SIĘ DZIEJE, DOPÓKI PLIKU NIE MA
----------------------------------
Stack leci dalej na UnifrakturMaguntia (@fontsource/unifrakturmaguntia, już
zainstalowany, serwowany z naszego origin). To ten sam gatunek — blackletter —
i metrycznie na tyle zbliżony, że po podmianie układ się nie przesunie.
Strona wygląda skończenie, po prostu nie jest to docelowy krój.


KONWERSJA TTF -> WOFF2
----------------------
  pip install fonttools brotli
  python3 -c "from fontTools.ttLib import TTFont; f=TTFont('metal-macabre.ttf'); \
              f.flavor='woff2'; f.save('metal-macabre.woff2')"


POLSKIE ZNAKI — SPRAWDŹ PRZED UŻYCIEM GDZIEKOLWIEK INDZIEJ
----------------------------------------------------------
Kroje blackletter zwykle nie mają glifów ą ć ę ł ń ś ź ż. Dlatego ten krój
jest w kodzie użyty WYŁĄCZNIE do słowa "NOKTURN", które nie zawiera polskich
znaków. Nagłówki i nazwy produktów składane są Bodoni Moda, które ma pełne
pokrycie latin + latin-ext.

Jeśli chcesz użyć Metal Macabre gdziekolwiek indziej, najpierw sprawdź pokrycie:

  python3 -c "from fontTools.ttLib import TTFont; \
    c=TTFont('public/fonts/metal-macabre.ttf').getBestCmap(); \
    print([ch for ch in 'ąćęłńóśźżĄĆĘŁŃÓŚŹŻ' if ord(ch) not in c])"

Pusta lista = można. Cokolwiek innego = zostaw przy samym wordmarku.


LOGO (osobna sprawa)
--------------------
Znak graficzny — krzyż z pionowym napisem NOKTURN — leży jako wektor w
public/demo/nokturn/mark.svg i NIE potrzebuje żadnego fontu; litery są tam
zamienione na krzywe. Używany jest jako duży znak wodny za katalogiem.
