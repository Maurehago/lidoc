# FlexCSS

FlexCSS verwendet das Flex Layout für die Darstellug von Inhalten,
ind einer Zeilen und Spalten Ansicht.

## Zeile
```html
<f-row color-s><p>Das ist eine Zeile</p></f-row>
```

<f-row color-s><p>Das ist eine Zeile</p></f-row>

## Spalten
Innerhalb einer Zeile können Spalten angegeben werden.
Der Absatz Tag "**&lt;p>**" bestimmt das der Text/Inhalt mit einem Padding dargestellt wird.
```html
<f-row color-s>
    <f-item color-s2><p>Das ist Spalte 1</p></f-item>
    <f-item color-a><p>Das ist Spalte 2</p></f-item>
</f-row>
```

<f-row color-s>
    <f-item color-s2><p>Das ist Spalte 1</p></f-item>
    <f-item color-a><p>Das ist Spalte 2</p></f-item>
</f-row>

Fast alle HTML-Tags können als Spalten verwendet werden
Zum beispiel "&lt;div>" erzeugt das selbe Ergebniss.
```html
<f-row color-s>
    <div color-s2><p>Das ist Spalte 1</p></div>
    <div color-a><p>Das ist Spalte 2</p></div>
</f-row>
```

Es funktionieren auch Buttons und Links
```html
<f-row color-s>
    <button><p>Das ist Spalte 1</p></button>
    <button><p>Das ist Spalte 2</p></button>
</f-row>

<f-row color-s>
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
    <a><p>Das ist Spalte 1</p></a>
    <a><p>Das ist Spalte 2</p></a>
</f-row>


### Spalten Breiten
Spalten können mit dem "w-fit" Attribut so angepasst werden das diese sich die zur verfügung stehende Breite teilen.
```html
<f-row color-s>
    <f-item color-s2 w-fit><p>Das ist Spalte 1</p></f-item>
    <f-item color-a w-fit><p>Das ist Spalte 2</p></f-item>
</f-row>
```

<f-row color-s>
    <f-item color-s2 w-fit><p>Das ist Spalte 1</p></f-item>
    <f-item color-a w-fit><p>Das ist Spalte 2</p></f-item>
</f-row>



<div ma-b-xl>&nbsp;</div>
