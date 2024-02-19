package parsemd

import (
	"bufio"
	"fmt"
	"os"
	"strings"
)

// Daten Map

// Variablen zum prüfen
var row_tag string = "r-float"
var col_tag string = "c-float"
var is_row bool
var is_p bool
var is_col bool
var is_code bool
var is_data bool
var is_first_line bool

// Daten
type keyvalue struct {
	key   string
	value interface{}
}

var Data map[string]interface{}
var lastData map[int8]keyvalue

// Neues Text Dokument
var new_text string

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
		is_data = false
		return
	}

	key, value, found := strings.Cut(line, ": ")

	// Wenn ein Key Value
	if found {
		step := countLeadingSpaces(key)
		if step == 0 {
			kv := keyvalue{key, value}
			lastData[int8(step)] = kv
			Data[key] = value
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
func Parse(filePath string) string {
	// prüfen ob vorhanden
	if !is_file_exists(filePath) {
		return ""
	}

	// Datei öffnen
	file, err := os.Open(filePath)
	if err != nil {
		fmt.Println("Fehler beim Öffnen der Datei:", err)
		return err.Error()
	}
	defer file.Close()

	// zurücksetzen
	is_row = false
	is_col = false
	is_p = false
	is_data = false
	new_text = ""

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
	return new_text
}
