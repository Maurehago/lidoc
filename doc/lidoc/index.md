# LiDoc

Der Listen und Document Generator, verwendet einen abgewandelten Markdown Syntax zum Anzeigen von Webseiten.

Als Stylesheet wird Flex.css eingesetzt.
Das ermöglicht das einfache Verwenden von Spalten in einem Dokument.

Für die Darstellung von Code wird das Javascript Framework "prism" Verwendet. [__prismjs.com__](https://prismjs.com/)

Die Generation von statischen Seiten ist noch nicht implementiert.

## Markdown Syntax Übersicht

### Header
Syntax:
```md
# Header 1
## Header 2
### Header 3
#### Header 4
##### Header 5
###### Header 6
```

### Fett und Unterstrichen
Syntax:
```md
**Fett**
__Unterstrichen__
```

### Sortierte Liste
Syntax:
```md
1. Erster Eintrag
2. Zweiter Eintrag
3. Dritter Eintrag
```

### Unsortierte Liste
Syntax: 
```md
- Erster Eintrag
- Zweiter Eintrag
- Dritter Eintrag
```

### Link
Syntax:
```md
[Titel](https://www.example.com)
```

### Bild
Syntax:
```md
![alt Text](image.jpg)
```

### Absatz
- Text in einer oder mehren Zeilen wird in einem Absatz zusammengeführt.
- Vor jeder neue Zeile wird ein Zeilenumbruch erstellt.
- Eine leere Zeile beendet den Absatz.
- Ein alleinstehendes "%" in einer Zeile erzeugt eine leere Zeile innerhalb eines Absatzes.

Syntax:
```md
Das ist ein Absatz
mit zweiter Zeile

Das ist ein neuer Absatz.
%
mit einer Leerzeile.
```

### Spalten
Die Darstellung in Spalten startet mit einer Zeile "---". Die Spalten werden mit "---" getrennt und beendet.
Nach der leten Spalte muss eine Leerzeile stehen.

Die Angabe zwischen Eckigen Klammern "[ ]" bestimmt die Attribute der einzelnen Spalten(nach "---").

Beispiel:

[ pa-v]
--- [ color-s w-fit]
Spalte1
--- [ color-s2 w-fit]
Spalte2
--- [ color-s w-fit]
Spalte3
---

Syntax:
```txt
--- [ color-s w-fit]
Spalte1
--- [ color-s2 w-fit]
Spalte2
--- [ color-s w-fit]
Spalte3
---

```

### Tabelle
Eine Tabellen-Zeile beginnt mit einem Pipe "|". Bei Angabe von "|*" wird bestimmt das eine "th" Spalte statt einer "td" Spalte verwendet wird.
Die Angabe "[ table-stripes table-border]" vor den Tabellen Zeilen gibt die Attribute für die Tabelle an.
Eine Leerzeile nach der Letzten Tabellen-Zeile schließt die Tabelle ab.

Beispiel:

[ table-stripes table-border ma-auto]
|* Wert |* Beschreibung |
| 10 | die Zahl 10 |
| 20 | die Zahl 20 |
| 300 | die Zahl 300 |

Syntax:
```txt
[ table-stripes table-border]
|* Wert |* Beschreibung |
| 10 | die Zahl 10 |
| 20 | die Zahl 20 |
| 300 | die Zahl 300 |

```

### Code
Syntax Hervorhebung wird über die Libary "prism" erzeugt.
Dabei wird der Code zwischen zwei Zeilen mit jeweils drei Grabakzent (```) eingeschlossen. Und bei der Beginnenden Zeile kann noch die Syntax-Sprache mit angegeben werden.

Beispiel:
```js
let x = 5 + 7;
console.log(x);
```

Syntax:
```txt
&#96;&#96;&#96;js
let x = 5 + 7;
console.log(x);
&#96;&#96;&#96;
```

### Abschnitt
Es können Inhalte auch in verschiedenen HTML-Elementen angezeigt werden.
Das erfolgt durch auftrennen in verschiedene Abschnitte.
Ein Abschnitt wechselt mit einer Zeile mit mindestesten drei Istgleich-Zeichen "===".
Wird hinter den Zeichen ein Name angegeben, so entspricht es der ID des HTML-Elements. Wenn kein Name wird immer "content" als ID angenommen.

Beispiel:
```txt
=== info
# Info
Das steht im HTML-Element mit der ID "info"

========

# Content
Das steht im HTML-Element mit der ID "content"

```

[ ma-b-l]
%
