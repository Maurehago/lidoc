package parsemd

import (
	"bufio"
	"errors"
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
	Html     string   // HTML Sourcecode für die Seite
}

// Variablen zum prüfen
var row_tag string = "f-row"
var col_tag string = "f-item"

var last_param string
var is_first_line bool
var is_data bool
var is_row bool
var is_col bool
var is_colline bool
var is_empty bool
var is_p bool
var is_code bool

var site Site
var is_tags bool

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

// HTML TAGS abschliessen
func close_htmlTags() {
	if is_p {
		site.Html += "</p>"
		is_p = false
	}
	if is_col {
		site.Html += "</" + col_tag + ">"
		is_col = false
	}
	if is_row {
		site.Html += "</" + row_tag + ">"
		is_row = false
	}
}

// Text hinzufügen
func add_text(text string) {
	// HTML Zeile hinzufügen
	if !is_row {
		// wenn noch keine Zeile
		site.Html += "<" + row_tag + ">" + "<" + col_tag + ">" + text
		is_row = true
		is_col = true
	} else if !is_col {
		// Wenn noch keine Spalte
		site.Html += "<" + col_tag + ">" + text
		is_col = true
	} else {
		// nur Text hinzufügen
		site.Html += text
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

		var text string

		// wenn schon ein Codeblock dann abschliessen
		if is_code {
			text += "</code></pre>"
			is_code = false
		} else {
			// Code beginnen
			if code_param != "" {
				// code Parameter setzen
				text += "<pre><code class='language-" + code_param + "' >"
			} else {
				text += "<pre><code>"
			}
			is_code = true
		}

		add_text(text)
		return true
	}

	if is_code {
		// Zeile hinzufügen
		site.Html += line + "<br>"
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

	// Stufe 6
	if strings.HasPrefix(trim_line, "###### ") {
		text = strings.Replace(trim_line, "###### ", "", 1)
		tag = "h6"
	} else if strings.HasPrefix(trim_line, "##### ") {
		// Stufe 5
		text = strings.Replace(trim_line, "##### ", "", 1)
		tag = "h5"
	} else if strings.HasPrefix(trim_line, "#### ") {
		// Stufe 4
		text = strings.Replace(trim_line, "#### ", "", 1)
		tag = "h4"
	} else if strings.HasPrefix(trim_line, "### ") {
		// Stufe 3
		text = strings.Replace(trim_line, "### ", "", 1)
		tag = "h3"
	} else if strings.HasPrefix(trim_line, "## ") {
		// Stufe 2
		text = strings.Replace(trim_line, "## ", "", 1)
		tag = "h2"
	} else if strings.HasPrefix(trim_line, "# ") {
		// Stufe 1
		text = strings.Replace(trim_line, "# ", "", 1)
		tag = "h1"
	}

	if tag == "" {
		// kein Header
		return false
	}

	// todo: Hader Attribute lesen

	// Wenn noch Absatz offen
	if is_p {
		site.Html += "</p>"
		is_p = false
	}

	// Text hinzufügen
	add_text("<" + tag + ">" + text + "</" + tag + ">")

	// OK
	return true
}

// Anzahl der Leerzeichen vor einem Text
//func countLeadingSpaces(line string) int {
//	return len(line) - len(strings.TrimLeft(line, " "))
//}

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
			is_tags = false

		case "date":
			site.Date = value
			is_tags = false

		case "tags":
			site.Tags = []string{}
			is_tags = true

		default:
			is_tags = false
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
		// ist leere Zeile
		is_empty = true

		// wenn zuvor eine Spaltenzeile
		if is_colline {
			// alles schliessen
			close_htmlTags()
			is_colline = false
		}

		// Wenn Absatz
		if is_p {
			// Absatz schliessen
			site.Html += "</p>"
			is_p = false
		}

		// rest ignorieren
		return
	}

	// wenn Code
	if parse_code(line) {
		// Abbrechen für nächste Zeile
		return
	}

	// Wenn neue Spalte
	if strings.HasPrefix(trim_line, "---") {
		// neue Spalte
		is_colline = true
		last_param = strings.Replace(trim_line, "---", "", 1)

		// alles schliessen bis auf die Row
		if is_p {
			site.Html += "</p>"
			is_p = false
		}
		if is_col {
			site.Html += "</" + col_tag + ">"
			is_col = false
		}

		if is_empty {
			close_htmlTags()
		}

		return
	}

	// wenn zuvor eine Spalte begonnen
	if is_colline {
		// neue Spalte
		if !is_row {
			site.Html += "<" + row_tag + ">"
			is_row = true
		}

		site.Html += "<" + col_tag + last_param + ">"
		is_col = true

		last_param = ""
	}

	// Keine Spaltenzeile
	is_colline = false
	is_empty = false

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
		return site, errors.New("File" + fullPath + " not found!")
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
	is_colline = false
	is_empty = false
	is_first_line = true

	// Seiten eigenschaften setzen
	site.Url = fullPath
	site.Path = filepath.Dir(fullPath)
	name, _, _ := strings.Cut(filepath.Base(fullPath), ".")
	site.Name = name
	site.Html = ""

	// Zeilenweise lesen
	scanner := bufio.NewScanner(file)
	for scanner.Scan() {
		line := scanner.Text()
		//fmt.Println("Zeile:", line)

		// wenn erste Zeile Daten
		if is_first_line && line == "---" {
			is_data = true
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
		return site, err
	}

	// Abschliessen
	close_htmlTags()

	return site, nil
} // Parse
