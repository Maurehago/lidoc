# FlexCSS

FlexCSS verwendet das Flex Layout für die Darstellug von Inhalten,
ind einer Zeilen und Spalten Ansicht.

## Zeile
```html
<f-row><p>Das ist eine Zeile</p></f-row>
```

<f-row color-s><p>Das ist eine Zeile</p></f-row>

## Spalten
Innerhalb einer Zeile können Spalten angegeben werden.
Der Absatz Tag "**&lt;p>**" bestimmt das der Text/Inhalt mit einem Padding dargestellt wird.
```html
<f-row>
    <f-item><p>Das ist Spalte 1</p></f-item>
    <f-item><p>Das ist Spalte 2</p></f-item>
</f-row>
```

<f-row color-s>
    <f-item color-s2><p>Das ist Spalte 1</p></f-item>
    <f-item color-p2><p>Das ist Spalte 2</p></f-item>
</f-row>

Fast alle HTML-Tags können als Spalten verwendet werden
Zum beispiel "&lt;div>" erzeugt das selbe Ergebniss.
```html
<f-row>
    <div><p>Das ist Spalte 1</p></div>
    <div><p>Das ist Spalte 2</p></div>
</f-row>
```

Es funktionieren auch Buttons und Links
```html
<f-row>
    <button><p>Das ist Spalte 1</p></button>
    <button><p>Das ist Spalte 2</p></button>
</f-row>

<f-row>
    <a><p>Das ist Spalte 1</p></a>
    <a><p>Das ist Spalte 2</p></a>
</f-row>
```

<f-row color-s>
    <button><p>Das ist Spalte 1</p></button>
    <button><p>Das ist Spalte 2</p></button>
</f-row>
<hr/>
<f-row color-s>
    <a color-s2><p>Das ist Spalte 1</p></a>
    <a color-p2><p>Das ist Spalte 2</p></a>
</f-row>


### Spalten Breiten
Spalten können mit dem "w-fit" Attribut so angepasst werden das diese sich die zur verfügung stehende Breite teilen.
```html
<f-row>
    <f-item w-fit><p>Das ist Spalte 1</p></f-item>
    <f-item w-fit><p>Das ist Spalte 2</p></f-item>
</f-row>
```

<f-row color-s>
    <f-item color-s2 w-fit><p>Das ist Spalte 1</p></f-item>
    <f-item color-p2 w-fit><p>Das ist Spalte 2</p></f-item>
</f-row>

#### die Breite "w-flex-(n)"
Mit der Spalte "w-flex-" und einer folgenden Zahl (0-9) kann ein Platzanteil einer Zeile angegeben werden.
Die folgende Einstellung der 3 Splaten (w-flex-1 / w-flex-3 / w-flex-1) besagt:
das die mittlere Spalte 2x mehr Platz beanspruchen darf, als die 1. und 3. Spalte.
Natürlich nur wenn für die anderen Spalten genug Platz für die Anzeige vorhanden ist.
```html
<f-row>
    <f-item w-flex-1><p>Das ist Spalte 1</p></f-item>
    <f-item w-flex-3><p>Das ist Spalte 2</p></f-item>
    <f-item w-flex-1><p>Das ist Spalte 3</p></f-item>
</f-row>
```

<f-row color-s>
    <f-item color-s2 w-flex-1><p>Das ist Spalte 1</p></f-item>
    <f-item color-p2 w-flex-3><p>Das ist Spalte 2</p></f-item>
    <f-item color-s2 w-flex-1><p>Das ist Spalte 3</p></f-item>
</f-row>


<div ma-b-xl>&nbsp;</div>
