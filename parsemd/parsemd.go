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
	Err      string   // Bei Fehler die Fehlermeldung (wird beim Parsen generiert)
	Title    string   // Titel der Seite
	Name     string   // Dateiname (wird beim Parsen generiert)
	Date     string   // Datum und Uhrzeit für Sortierung in Listen
	Author   string   // Autor des Dokumentes
	Url      string   // Pfad und Dateiname (wird beim Parsen generiert)
	Path     string   // Pfad / Ordner in dem sich die Seite befindet (ohne Dateiname) (wird beim Parsen generiert)
	Template string   // Template welches für die Anzeige der Seite verwendet wird
	Tags     []string // Schlüsselwörter um die Seite bei einer Suche zu finden
	Content  string   // HTML Sourcecode für die Seite (wird beim Parsen generiert)
	Images   []string // Liste Mit Bildern(URL) (wird beim Parsen generiert)
	Links    []string // Liste mit Links(URL) (wird beim Parsen generiert)
}

// Tabellen
type table struct {
	titles []string
	fields []string
}

// Variablen zum prüfen
var row_tag string = "f-row"
var col_tag string = "f-item"

var last_attribute string
var is_first_line bool
var is_data bool
var is_row bool
var is_col bool
var is_colline bool
var is_empty bool
var is_p bool
var is_code bool

var is_table bool
var tHead string
var colgroup string

var is_ul bool                      // Einfache Liste
var is_ol bool                      // Sortierte Liste
var is_li bool                      // Listen Element
var last_list_step int              // Letzte Listen Stufe
var parrent_step_tag map[int]string // letztes Listen Element

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

// Content hinzufügen
func add_content(text string) {
	site.Content += text
}

// Tabellen Daten hinzufügen
func add_tableData() {
	if !is_table {
		return
	}

	// Spaltengruppe hinzufügen
	add_content("<colgroup>" + colgroup + "</colgroup>")

	// Head hinzufügen
	add_content("<thead><tr>" + tHead + "</tr></thead>")
}

// HTML TAGS abschliessen
func close_htmlTags() {
	// Listen schliessen
	close_listTags(true)

	if is_p {
		add_content("</p>")
		is_p = false
	}
	if is_col {
		add_content("</" + col_tag + ">")
		is_col = false
	}
	if is_row {
		add_content("</" + row_tag + ">")
		is_row = false
	}
}

// Listen Tags schliessen
func close_listTags(all bool) {
	// Listen Tags schliessen
	if is_li {
		add_content("</li>")
		is_li = false
	}
	if is_ul {
		add_content("</ul>")
		is_ul = false
	}
	if is_ol {
		add_content("</ol>")
		is_ol = false
	}

	if all {
		for last_list_step > 0 {
			last_list_step -= 1

			// Listentag lesen
			listTag := parrent_step_tag[last_list_step]
			if listTag == "ul" {
				add_content("</ul>")
			} else if listTag == "ol" {
				add_content("</ol>")
			}
		} // for alle Einrückungen
	} // wenn alle Einrückungen schliessen
}

// Text hinzufügen
func add_text(text string) {
	// HTML Zeile hinzufügen
	if !is_row {
		// wenn noch keine Zeile
		add_content("<" + row_tag + ">" + "<" + col_tag + ">" + text)
		is_row = true
		is_col = true
	} else if !is_col {
		// Wenn noch keine Spalte
		add_content("<" + col_tag + ">" + text)
		is_col = true
	} else {
		// nur Text hinzufügen
		add_content(text)
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
			// Listtags bei Code schliessen
			close_listTags(true)

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
		parse_line := strings.ReplaceAll(line, "<", "&lt;") // < HTML-TAG Zeichen müssen umgewandelt werden
		add_content(parse_line + "\n")
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
		add_content("</p>")
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
		// Tags zurücksetzen
		is_tags = false

		// je nach key
		switch key {
		case "template":
			site.Template = value

		case "title":
			site.Title = value

		case "date":
			site.Date = value

		case "tags":
			site.Tags = []string{}
			is_tags = true

		case "author":
			site.Author = value

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

// auf leere Zeile Prüfen
func parse_empty(trim_line string) bool {
	// Wenn die Zeile leer ist
	if trim_line == "" {
		// Listen schliessen
		close_listTags(true)

		// wenn zuvor eine Spaltenzeile
		if is_colline {
			// alles schliessen
			close_htmlTags()
			is_colline = false
		}

		// Wenn Absatz
		if is_p {
			// Absatz schliessen
			add_content("</p>")
			is_p = false
		}

		// Wenn Tabelle
		if is_table {
			// Tabellen Kopf setzen
			add_tableData()
			add_content("<tbody></tbody></table>")
			is_table = false
		}

		// wenn zuvor schon eine Leerzeile
		// das ist die 2. Leerzeile
		// dann alle HTML-Tags schliessen
		if is_empty {
			close_htmlTags()
		}

		// ist leere Zeile
		is_empty = true

		// rest ignorieren
		return true
	}
	return false
}

// Auf Spalten prüfen
func parse_column(trim_line string) bool {
	// Wenn neue Spalte
	if strings.HasPrefix(trim_line, "---") {
		// neue Spalte
		is_colline = true
		last_attribute = strings.Replace(trim_line, "---", "", 1)

		// alles schliessen bis auf die Row
		close_listTags(true)
		if is_p {
			add_content("</p>")
			is_p = false
		}
		if is_col {
			add_content("</" + col_tag + ">")
			is_col = false
		}

		if is_empty {
			close_htmlTags()
		}

		return true
	} else {
		return false
	}
} // parse_column

// Auf Bilder prüfen
func parse_line_image(line string) string {
	// Start von Bild prüfen
	pos1 := strings.Index(line, "![")
	if pos1 < 0 {
		return line
	}

	// Splitt Position zwischen Tag und URL
	pos2 := strings.Index(line, "](")
	if pos2 < pos1 {
		return line
	}

	// Ende Position
	pos3 := strings.Index(line[pos2:], ")")
	if pos3 < 0 {
		return line
	}
	pos3 += pos2 // Weil Position von einem Substring

	// 1. Teil vor dem Bild
	part1 := line[:pos1]       // 1. Teil vor dem Bild
	tag := line[pos1+2 : pos2] // Tag / Name vom Bild
	url := line[pos2+2 : pos3] // URL vom Bild
	part2 := line[pos3+1:]     // 2. Teil nach dem Bild

	// neue Zeile zusammenbauen
	new_line := part1 + "<img src='" + url + "' tag='" + tag + "'>" + part2

	// Bild URL merken
	site.Images = append(site.Images, url)

	// auf weitere Bilder prüfen und zurückgeben
	return parse_line_image(new_line)
} // Parse_line_image

// Auf Links prüfen
func parse_line_link(line string) string {
	// Start von Bild prüfen
	pos1 := strings.Index(line, "[")
	if pos1 < 0 {
		return line
	}

	// Splitt Position zwischen Tag und URL
	pos2 := strings.Index(line, "](")
	if pos2 < pos1 {
		return line
	}

	// Ende Position
	pos3 := strings.Index(line[pos2:], ")")
	if pos3 < 0 {
		return line
	}
	pos3 += pos2 // Weil Position von einem Substring

	// 1. Teil vor dem Link
	part1 := line[:pos1]        // 1. Teil vor dem Link
	text := line[pos1+1 : pos2] // Text vom Link
	url := line[pos2+2 : pos3]  // URL vom Link
	part2 := line[pos3+1:]      // 2. Teil nach dem Link

	// Wenn kein Text
	if text == "" {
		text = url
	}

	// neue Zeile zusammenbauen
	new_line := part1 + "<a href='" + url + "'>" + text + "</a>" + part2

	// Link URL merken
	site.Links = append(site.Links, url)

	// auf weitere Links prüfen und zurückgeben
	return parse_line_link(new_line)
} // Parse_line_link

// Listen Prüfen
func parse_lists(line string) bool {
	trim_line := strings.TrimLeft(line, " ")

	// Einrückung prüfen
	step := len(line) - len(trim_line)

	// Wenn Einrückung und keine Listen
	if step > last_list_step && !is_li {
		// Es kann keine Liste mit Einrückung beginnen
		close_listTags(true)
		return false
	}

	text := ""
	listTag := ""
	is_new_item := false

	// Wenn UL - Listitem
	if strings.HasPrefix(trim_line, "- ") {
		text = trim_line[2:]
		listTag = "ul"
		is_new_item = true
	} else if i := strings.Index(trim_line, ". "); i >= 1 && i <= 3 {
		text = trim_line[i+2:]
		listTag = "ol"
		is_new_item = true
	} else {
		// wenn keine Listen abbrechen
		if !is_ul && !is_ol {
			close_listTags(true)
			return false
		}

		text = trim_line
	}

	// nur wenn neuer Listeneitrag
	if is_new_item {
		// voriges List Item schliessen
		if step == last_list_step {
			if is_li {
				add_content("</li>")
				is_li = false
			}
		} else if step < last_list_step {
			// Liste schliessen
			close_listTags(false)

			// Listentag lesen
			listTag = parrent_step_tag[step]
			if listTag == "ul" {
				is_ul = true
			} else if listTag == "ol" {
				is_ol = true
			}
			last_list_step = step
		} else if step > last_list_step {
			// merken
			if is_ul {
				parrent_step_tag[last_list_step] = "ul"
			} else if is_ol {
				parrent_step_tag[last_list_step] = "ol"
			}
			is_ul = false
			is_ol = false
			last_list_step = step
		}

		// wenn noch keine Liste
		if listTag == "ul" && !is_ul {
			add_content("<ul>")
			is_ul = true
			is_li = false
		} else if listTag == "ol" && !is_ol {
			add_content("<ol>")
			is_ol = true
			is_li = false
		}

		// Listen Element hinzufügen
		if is_li {
			// voriges schliessen und neues anfangen
			add_content("</li><li>" + text)
			is_li = true
		} else {
			add_content("<li>" + text)
			is_li = true
		}
	} else {
		// kein neues element

		// wenn keint ListItem offen
		if !is_li {
			return false
		}

		// Text hinzufügen
		add_content("</br>" + text)
	} // if new_item

	return true
} // parse Lists

// Parse Tabellen
func parse_table(line string) bool {
	// ||pfad-listenname
	// - FeldName1 Überschrift1
	// - FeldName2 Überschrift2
	// - FeldName3 Überschrift3

	if !is_table && strings.HasPrefix(line, "||") {
		// Tabelle start
		listName := line[2:]
		add_content("<table data-ilist='" + listName + "'>")
		tHead = ""
		colgroup = ""
		is_table = true
		return true
	}
	if !is_table {
		return false
	}

	// Spalten lesen
	if strings.HasPrefix(line, "- ") {
		fieldName, title, ok := strings.Cut(line[2:], " ")
		if ok {
			colgroup += "<col name='" + fieldName + "'/>"
			tHead += "<th data-col='" + fieldName + "'>" + title + "</th>"
		} else {
			colgroup += "<col name='" + fieldName + "'/>"
			tHead += "<th data-col='" + fieldName + "'>" + fieldName + "</th>"
		}
	} else {
		return false
	}
	return true
} // parse_table

// Zeile prüfen
func parse_row(line string) {
	// Leerzeichen entfernen
	trim_line := strings.TrimSpace(line)

	// Wenn die Zeile leer ist
	if parse_empty(trim_line) {
		return
	}

	// wenn Code
	if parse_code(line) {
		// Abbrechen für nächste Zeile
		return
	}

	// Auf Spalten Beginn prüfen
	if parse_column(trim_line) {
		return
	}

	// wenn zuvor eine Spalte begonnen
	if is_colline {
		// neue Spalte
		if !is_row {
			add_content("<" + row_tag + ">")
			is_row = true
		}

		add_content("<" + col_tag + last_attribute + ">")
		is_col = true

		last_attribute = ""
	}

	// ab hier keine Spaltenzeile
	is_colline = false
	is_empty = false

	// wenn Header
	if parse_header(line) {
		// Abbrechen für nächste Zeile
		return
	}

	// auf Bilder prüfen
	line = parse_line_image(line)

	// auf Links prüfen
	line = parse_line_link(line)

	// auf Tabellen prüfen
	if parse_table(line) {
		return
	}

	// auf Fett / Italic prüfen

	// auf Listen prüfen
	if parse_lists(line) {
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
	is_ul = false
	is_ol = false
	is_table = false
	last_list_step = 0
	parrent_step_tag = map[int]string{}

	// Seiten eigenschaften setzen
	site.Url = fullPath
	site.Path = filepath.Dir(fullPath)
	name, _, _ := strings.Cut(filepath.Base(fullPath), ".")
	site.Title = ""
	site.Name = name
	site.Content = ""
	site.Images = []string{}
	site.Links = []string{}

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
