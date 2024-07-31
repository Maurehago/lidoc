package main

import (
	"bytes"
	"errors"
	"flag"
	"fmt"
	"html/template"
	"io/fs"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"runtime"
	"strings"
	"time"

	"github.com/Maurehago/lidoc/infolist"
	"github.com/Maurehago/lidoc/parsemd"
)

// Standard Einstellungen
const (
	Host   = "localhost"
	Port   = "8080"
	Static = "./"
	Open   = true
)

var port string
var fileList []string
var siteList infolist.InfoList
var homePath string
var lastCheck time.Time
var is_build bool

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

// Prüfen ob eine URL existiert
func is_url_exists(url string) error {

	// Get the data
	resp, err := http.Get(url)
	if err != nil {
		// resp.StatusCode
		return err
	}
	if resp.StatusCode != 200 {
		return errors.New(resp.Status)
	}
	return nil
}

// Keine HTML Escapen für Templates
func noescape(s string) template.HTML {
	return template.HTML(s)
}

// Template auflösen
func parseSite(site *parsemd.Site) (bytes.Buffer, error) {
	var doc bytes.Buffer

	// Template lesen
	templFile := ""
	templName := ""

	if site.Template != "" {
		// Nur Datei Name nehmen sonnst kommt ein Fehler beim Parsen
		templFile = site.Template
		templName = filepath.Base(site.Template)
	} else {
		// Standard Template
		templFile = "_template.html"
		templName = "_template.html"
	}

	// Template parsen
	templ, err := template.New(templName).Funcs(template.FuncMap{"noescape": noescape}).ParseFiles(templFile)
	if err != nil {
		fmt.Println(err)
		return doc, err
	}

	err = templ.Execute(&doc, site)
	if err != nil {
		fmt.Println(err)
		return doc, err
	}

	return doc, nil
}

// Datei Prüfung
func buildFile(path string, info fs.DirEntry, err error) error {
	// Verzeichnisse werden nicht berücksichtigt
	if info.IsDir() {
		return nil
	}
	if err != nil {
		return err
	}

	// test:
	// fmt.Println("buildfile:", path)

	// Dateinamenserweiterung Markdown (.md)
	ext := filepath.Ext(path)
	if ext != ".md" {
		return nil
	}

	// ÄnderungsZeitpunkt prüfen
	var fileInfo fs.FileInfo
	fileInfo, err = info.Info()
	if err == nil {
		modTime := fileInfo.ModTime()
		if modTime.Before(lastCheck) {
			// fmt.Println("Ignore:", path)
			return nil
		}
	}

	fileName := info.Name()
	dir := filepath.Dir(path)
	relPath := strings.Replace(path, homePath, "", 1)

	// Alle Dateien oder Ordner mit "_" werden ignoriert
	if strings.Contains(relPath, "/_") || strings.Contains(relPath, "\\_") || strings.HasPrefix(fileName, "_") || strings.Contains(dir, ".") {
		return nil
	}

	// Wenn Markdown
	// Parsen
	// fmt.Println("path:", path)

	// var site parsemd.Site
	site, err := parsemd.Parse(path)
	if err != nil {
		fmt.Println(site, err)
		return err
	}

	htmlName := strings.Replace(fileName, ".md", ".html", 1)
	htmlPath := filepath.Join(dir, htmlName)

	// Template parsen
	// fmt.Println("site:", site)

	var doc bytes.Buffer
	doc, err = parseSite(&site)
	if err != nil {
		fmt.Println(err)
		return err
	}

	// Datei erstellen
	err = os.WriteFile(htmlPath, doc.Bytes(), 0777)
	if err != nil {
		fmt.Println("HTML save Error:", err.Error())
		return err
	}

	// Datei erstellt
	is_build = true

	// Bilder prüfen ob vorhanden
	imgErrors := 0
	for _, imgURL := range site.Images {
		if err = is_url_exists(imgURL); err != nil {
			imgErrors += 1
		}
	}

	// Links prüfen ob vorhanden
	linkErrors := 0
	for _, linkURL := range site.Links {
		if err = is_url_exists(linkURL); err != nil {
			linkErrors += 1
		}
	}

	// Seiten Liste
	// ID, path, name, title, date, imageerror, linkerror
	// siteID := infolist.GSID()
	// site.ID = siteID
	siteList.Set(site.ID, []any{site.ID, site.Path, site.Name, site.Title, site.Date, imgErrors, linkErrors})
	fileList = append(fileList, site.Path)

	return nil
}

// Alle Dateien und Ordner in durchgehen
func build() {
	var err error
	homePath, err = os.Getwd()
	fmt.Println("Path:", homePath)
	if err != nil {
		fmt.Println(homePath, err)
		return
	}

	// Build zurüksetzen
	is_build = false

	// Alle Dateien durchgehen
	err = filepath.WalkDir(homePath, buildFile)
	if err != nil {
		fmt.Println(err)
		return
	}

	lastCheck = time.Now()

	if is_build {
		// Seitenliste speichern
		// fmt.Println("SiteList:", siteList)
		err = siteList.Save(".")
		if err != nil {
			fmt.Println(err)
			return
		}
	}

	// Garbage Collector anstoßen
	runtime.GC()
}

// Datei Handler
func handleFile(w http.ResponseWriter, r *http.Request) {
	// nur GET Requests erlaubt
	if r.Method != "GET" {
		return
	}

	// Markdown Datei
	var mdFile string
	checkFolder := false
	checkMD := false

	// Pfad aus URL
	relFile := r.URL.Path

	fullPath := filepath.Join(Static, relFile)

	// Datei Erweiterung prüfen
	filetype := filepath.Ext(fullPath)

	// Je nach Dateiendung
	switch filetype {
	case "":
		mdFile = fullPath + ".md"
		checkFolder = true

	case ".html":
		mdFile = strings.Replace(fullPath, ".html", ".md", 1)
		checkMD = true

	case ".md":
		mdFile = fullPath
		checkMD = true

	default:
		mdFile = ""
	}

	// auf Ordner prüfen
	if checkFolder {
		fInfo, err := os.Stat(fullPath)
		if os.IsNotExist(err) {
			// dann kann es Datei sein
		} else if fInfo.IsDir() {
			mdFile = filepath.Join(fullPath, "index.md")
			checkMD = true
		}
	}

	// Console Log
	// fmt.Println("file: "+file, mdFile)

	// Wenn Markdown zu prüfen
	if checkMD && mdFile != "" {
		// Hier Marrkdown parsen und zurückgeben

		// Console Log
		// fmt.Println("parse:", mdFile)

		// buildFile
		build()
	}

	// Wenn Seitenliste
	if strings.HasSuffix(relFile, "ilist/lidoc/sites.json") {
		data, _ := siteList.Marshal()
		fmt.Fprint(w, string(data))
		return
	}

	// nur die Datei ausliefern
	http.ServeFile(w, r, fullPath)
}

// HTML Dateien erzeugen
func buildFiles(w http.ResponseWriter, r *http.Request) {
	// Startwerte setzen
	lastCheck = lastCheck.AddDate(-1, 0, 0)

	// Seitenliste Daten leeren
	siteList.Data = make(map[string][]interface{})
	fileList = make([]string, 0)

	build()

	// Ausgabe Liste mit Seiten
	http.ServeFile(w, r, "./_list.html")

	// _, err := fmt.Fprintf(w, "Dateien erstellt")
	// if err != nil {
	// 	fmt.Fprintf(os.Stderr, "Fprintf: %v\n", err)
	// }
}

// Start Funktion
func main() {
	// Parameter prüfen
	// flag.StringVar(zeiger, name, default, beschreibung)
	flag.StringVar(&port, "p", Port, "Server Port")
	flag.Parse()

	// Seiten Liste erstellen
	siteList = infolist.InfoList{}
	siteList.Name = "sites"
	siteList.Path = "lidoc"

	// Laden probieren
	err := siteList.Load("")
	if err != nil {
		fmt.Println("siteList:", err.Error())
	}

	// SeitenListe Felder und Typen
	siteList.Fields = []string{"ID", "path", "name", "title", "date", "imageerror", "linkerror"}
	siteList.Types = []string{"str", "str", "str", "str", "str", "int", "int"}

	// Daten in Seitenliste leeren
	siteList.Data = make(map[string][]interface{})

	// Build beim Start
	build()

	// Handler
	http.HandleFunc("/build", buildFiles)
	go http.HandleFunc("/", handleFile)

	//Create the server.
	serverURL := Host + ":" + port

	fmt.Println(runtime.GOOS)
	fmt.Println("Server running on http://" + serverURL)
	fmt.Println("stop with CTRL+C")
	fmt.Println("...")

	// Server starten
	err = http.ListenAndServe(serverURL, nil)
	if err != nil {
		log.Fatal("Error Starting the HTTP Server :", err)
		return
	}
}
