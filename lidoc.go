package main

import (
	"bytes"
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

// Keine HTML Escapen für Templates
func noescape(s string) template.HTML {
	return template.HTML(s)
}

// Template auflösen
func parseSite(site parsemd.Site) (bytes.Buffer, error) {
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

	fileName := info.Name()
	dir := filepath.Dir(path)
	ext := filepath.Ext(path)

	// Alle Dateien oder Ordner mit "_" werden ignoriert
	if strings.HasPrefix(fileName, "_") || strings.Contains(dir, ".") {
		return nil
	}

	// Wenn Markdown
	if ext == ".md" {
		// Parsen
		fmt.Println("path:", path)

		site, err := parsemd.Parse(path)
		if err != nil {
			fmt.Println(site, err)
			return err
		}

		htmlName := strings.Replace(fileName, ".md", ".html", 1)
		htmlPath := filepath.Join(dir, htmlName)

		// Template parsen
		fmt.Println("site:", site)

		doc, err := parseSite(site)
		if err != nil {
			fmt.Println(err)
			return err
		}

		// Datei erstellen
		os.WriteFile(htmlPath, doc.Bytes(), 0777)
		// var file *os.File
		// file, err = os.Create(htmlPath)
		// if err != nil {
		// 	fmt.Println(err)
		// 	return err
		// }
		// err = templ.Execute(file, site)
		// if err != nil {
		// 	fmt.Println(err)
		// 	return err
		// }

		fileList = append(fileList, htmlPath)
	} else {
		fileList = append(fileList, path)
	}
	return nil
}

// Alle Dateien und Ordner in durchgehen
func build() {
	homePath, err := os.Getwd()
	fmt.Println("Path:", homePath)
	if err != nil {
		fmt.Println(homePath, err)
		return
	}

	fileList = make([]string, 0)

	// Alle Dateien durchgehen
	err = filepath.WalkDir(homePath, buildFile)
	if err != nil {
		fmt.Println(err)
		return
	}

	// fmt.Println(fileList)
}

// Datei Handler
func handleFile(w http.ResponseWriter, r *http.Request) {
	// nur GET Requests erlaubt
	if r.Method != "GET" {
		return
	}

	// Markdown Datei
	var mdFile string

	// Pfad aus URL
	relFile := r.URL.Path

	file := filepath.Join(Static, relFile)

	// Datei Erweiterung prüfen
	filetype := filepath.Ext(file)

	// prüfen
	fInfo, err := os.Stat(file)
	if os.IsNotExist(err) {
		// Console Log
		fmt.Println("no exist: " + file)

		if filetype == "" {
			file += ".md"
			mdFile = file
			filetype = ".md"
		} else if filetype == ".html" {
			file = strings.Replace(file, ".html", ".md", 1)
			mdFile = file
		}
		fInfo, err = os.Stat(file)
	}
	if err != nil {
		// Fehler
		fmt.Println("File Error:", err)
		return
	} else if filetype == ".html" {
		// Html Datei existiert
		mdFile = strings.Replace(file, ".html", ".md", 1)
	}

	// Wenn Directory
	if fInfo.IsDir() {
		mdFile = filepath.Join(file, "index.md")
		file = filepath.Join(file, "index.html")
	}

	// Console Log
	fmt.Println("file: "+file, mdFile)

	if is_file_exists(mdFile) {
		// Hier Marrkdown parsen und zurückgeben
		site, err := parsemd.Parse(mdFile)
		if err != nil {
			// Fehler
			fmt.Println("ERROR parsing site:", site, err)
			return
		}

		// Seite mit Template auflösen
		doc, err := parseSite(site)
		if err != nil {
			// Fehler
			fmt.Println("ERROR templating site:", site, err)
			return
		}

		// Seite turücksenden
		_, err = fmt.Fprint(w, doc.String())
		if err != nil {
			// Fehler
			fmt.Println("ERROR sending back:", err)
		}
		return
	}

	// nur die Datei ausliefern
	http.ServeFile(w, r, file)
}

// HTML Dateien erzeugen
func buildFiles(w http.ResponseWriter, r *http.Request) {
	build()
	_, err := fmt.Fprintf(w, "Dateien erstellt")
	if err != nil {
		fmt.Fprintf(os.Stderr, "Fprintf: %v\n", err)
	}
}

// Start Funktion
func main() {
	// Parameter prüfen
	// flag.StringVar(zeiger, name, default, beschreibung)
	flag.StringVar(&port, "p", Port, "Server Port")
	flag.Parse()

	// Handler
	go http.HandleFunc("/build", buildFiles)
	go http.HandleFunc("/", handleFile)

	//Create the server.
	serverURL := Host + ":" + port

	fmt.Println(runtime.GOOS)
	fmt.Println("Server running on http://" + serverURL)
	fmt.Println("stop with CTRL+C")
	fmt.Println("...")

	// Server starten
	err := http.ListenAndServe(serverURL, nil)
	if err != nil {
		log.Fatal("Error Starting the HTTP Server :", err)
		return
	}
	// Build beim Start
	go build()
}
