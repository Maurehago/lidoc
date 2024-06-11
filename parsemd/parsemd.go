package parsemd

import (
	"bufio"
	"fmt"
	"os"
	"path/filepath"
	"strings"
)

// Daten Map
type KeyValue map[string]interface{}

// Seite Objekt Aufbau
type Site struct {
	Err      string   // Bei Fehler die Fehlermeldung
	Name     string   // Dateiname ohne Endung
	Date     string   // Datum und Uhrzeit für Sortierung in Listen
	Url      string   // Pfad und Dateiname
	Path     string   // Pfad / Ordner in dem sich die Seite befindet (ohne Dateiname)
	Template string   // Template welches für die Anzeige der Seite verwendet wird
	Tags     []string // Schlüsselwörter um die Seite bei einer Suche zu finden
}

// HTML Tag Element
type htmlTag struct {
	id      string
	tagname string
	prop    string
	text    string
	parrent string
}

// Variablen zum prüfen
var row_tag string = "f-row"
var col_tag string = "f-item"

var is_first_line bool
var is_data bool
var is_row bool
var is_col bool
var is_p bool
var is_code bool
var site Site
var lastData string
var last_step int16

var is_data_text bool
var is_tags bool

// Neues Text Dokument
var new_text string

// Daten auslesen
func Get_object_value(o *obj, key string) *interface{} {
	// Nach punkte aufsplitten
	k1, k2, ok := strings.Cut(key, ".")

	// Wert lesen
	nested := (*o)[k1]
	if !ok {
		return &nested
	}

	// Unterobjekte im weitern Pfad prüfen
	nested2, ok := nested.(obj)
	if ok {
		return Get_object_value(&nested2, k2)
	}
	return &nested
}

// Datei Vorhanden prüfen
func is_file_exists(file string) bool {
	if _, err := os.Stat(file); err == nil {
		// Existiert
		return true
	} else if os.IsNotExist(err) {
		return false
	}
	return false
}

// Text hinzufügen
func add_text(text string) {
	// Header hinzufügen
	if !is_row {
		// wenn noch keine Zeile
		new_text += "<" + row_tag + ">" + "<" + col_tag + ">" + text
		is_row = true
		is_col = true
	} else if !is_col {
		// Wenn noch keine Spalte
		new_text += "<" + col_tag + ">" + text
		is_col = true
	} else {
		// nur Header hinzufügen
		new_text += text
	}
}

// Absatz prüfen
func parse_p(line string) bool {
	var text string
	// wenn noch kein Absatz
	if !is_p {
		text = "<p>" + line
		is_p = true
	} else {
		text = "</br>" + line
	}
	add_text(text)
	return true
}

// Code prüfen
func parse_code(line string) bool {
	if strings.HasPrefix(line, "```") {
		code_param := strings.Replace(line, "```", "", 1)
		if code_param != "" {
			// todo: code Parameter setzen
		}

		var text string

		// wenn schon ein Codeblock dann abschliessen
		if is_code {
			text += "</code></pre>"
			is_code = false
		} else {
			// Code beginnen
			text += "<pre><code>"
			is_code = true
		}

		add_text(text)
		return true
	}

	if is_code {
		// Zeile hinzufügen
		new_text += line + "<br>"
		return true
	}

	return false
}

// Header prüfen
func parse_header(line string) bool {
	if !strings.HasPrefix(line, "#") {
		// abbrechen
		return false
	}

	// Leerzeichen entfernen
	trim_line := strings.TrimSpace(line)

	// todo: Submenue / Anchor

	text := ""
	tag := ""

	var newTag = htmlTag{}

	// Stufe 6
	if strings.HasPrefix(trim_line, "###### ") {
		newTag.text = strings.Replace(trim_line, "###### ", "", 1)
		newTag.tagname = "h6"
	} else if strings.HasPrefix(trim_line, "##### ") {
		// Stufe 5
		newTag.text = strings.Replace(trim_line, "##### ", "", 1)
		newTag.tagname = "h5"
	} else if strings.HasPrefix(trim_line, "#### ") {
		// Stufe 4
		newTag.text = strings.Replace(trim_line, "#### ", "", 1)
		newTag.tagname = "h4"
	} else if strings.HasPrefix(trim_line, "### ") {
		// Stufe 3
		newTag.text = strings.Replace(trim_line, "### ", "", 1)
		newTag.tagname = "h3"
	} else if strings.HasPrefix(trim_line, "## ") {
		// Stufe 2
		newTag.text = strings.Replace(trim_line, "## ", "", 1)
		newTag.tagname = "h2"
	} else if strings.HasPrefix(trim_line, "# ") {
		// Stufe 1
		newTag.text = strings.Replace(trim_line, "# ", "", 1)
		newTag.tagname = "h1"
	}

	if newTag.tagname == "" {
		// kein Header
		return false
	}

	// todo: Hader Attribute lesen

	// Wenn noch Absatz offen
	if is_p {
		new_text += "</p>"
		is_p = false
	}

	// Text hinzufügen
	add_text("<" + tag + ">" + text + "</" + tag + ">")

	// OK
	return true
}

// Anzahl der Leerzeichen vor einem Text
func countLeadingSpaces(line string) int {
	return len(line) - len(strings.TrimLeft(line, " "))
}

// Daten parsen
func parse_data(line string) {
	// Wenn keine Daten zum parsen
	if !is_data {
		return
	}

	// Wenn letze Datenzeile
	if line == "---" {
		// todo: ??? Letzten Key Value abschliessen
		is_data = false
		return
	}

	// Verschachtelung feststellen
	// step := int16(countLeadingSpaces(line))

	// Leerzeichen entfernen
	trim_line := strings.TrimSpace(line)

	// Wenn leerzeile
	if trim_line == "" {
		// Zurücksetzen
		is_tags = false
		return
	}

	key, value, found := strings.Cut(trim_line, ":")
	// Wert trimmen
	value = strings.TrimSpace(value)

	// Wenn Key Value
	if found {
		// je nach key
		switch key {
		case "template":
			site.Template = value

		case "date":
			site.Date = value

		case "tags":
			site.Tags = []string{}
			is_tags = true
		}
	} else {
		// Kein KeyValue - sondern nur ein Wert
		if strings.HasPrefix(key, "- ") {
			value = strings.TrimPrefix(key, "- ") // Key ohne Item
			if is_tags {
				site.Tags = append(site.Tags, value)
			}
		}
	}
}

// Zeile prüfen
func parse_row(line string) {
	// Leerzeichen entfernen
	trim_line := strings.TrimSpace(line)

	// Wenn die Zeile leer ist
	if trim_line == "" {
		// Wenn Absatz
		if is_p {
			// Absatz schliessen
			new_text += "</p>"
			is_p = false

			// todo: prüfen auf 2. Leerzeile

			return
		}
	}

	// wenn Code
	if parse_code(line) {
		// Abbrechen für nächste Zeile
		return
	}

	// wenn Header
	if parse_header(line) {
		// Abbrechen für nächste Zeile
		return
	}

	// Wenn Absatz
	if parse_p(line) {
		// Abbrechen für nächste Zeile
		return
	}
}

// Datei parsen
func Parse(fullPath string) (Site, error) {
	// neue Seite
	site = Site{}

	// prüfen ob vorhanden
	if !is_file_exists(fullPath) {
		return site, nil
	}

	// Datei öffnen
	file, err := os.Open(fullPath)
	if err != nil {
		fmt.Println("Fehler beim Öffnen der Datei:", err)
		site.Err = err.Error()
		return site, err
	}
	defer file.Close()

	// zurücksetzen
	is_row = false
	is_col = false
	is_p = false
	is_data = false
	new_text = ""

	site.Url = fullPath
	site.Path = filepath.Dir(fullPath)
	name, _, _ := strings.Cut(filepath.Base(fullPath), ".")
	site.Name = name

	// Zeilenweise lesen
	scanner := bufio.NewScanner(file)
	for scanner.Scan() {
		line := scanner.Text()
		//fmt.Println("Zeile:", line)

		// wenn erste Zeile Daten
		if is_first_line && line == "---" {
			is_data = true
			last_step = 0 // Einrückung der Zeile auf 0
		} else if is_data {
			// Daten prüfen
			parse_data(line)
		} else {
			// Zeile Parsen
			parse_row(line)
		}
		is_first_line = false
	}

	if err := scanner.Err(); err != nil {
		fmt.Println("Fehler beim Lesen der Datei:", err)
	}

	// Abschliessen
	if is_p {
		new_text += "</p>"
		is_p = false
	}
	if is_col {
		new_text += "</" + col_tag + ">"
		is_col = false
	}
	if is_row {
		new_text += "</" + row_tag + ">"
		is_row = false
	}
	return site, nil
} // Parse
