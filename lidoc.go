package main

import (
	"flag"
	"fmt"
	"html/template"
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

// Datei Handler
func handleFile(w http.ResponseWriter, r *http.Request) {
	// nur GET Requests erlaubt
	if r.Method != "GET" {
		return
	}

	// Pfad aus URL
	relFile := r.URL.Path
	// wenn keine Datei -> Index.html
	if strings.HasSuffix(relFile, "/") {
		relFile += "index.html"
	}

	file := Static + relFile
	fmt.Println("file: " + file)

	// Datei Erweiterung prüfen
	filetype := filepath.Ext(file)

	if filetype == ".html" {
		// prüfen ob ein Datei mit markdown existiert
		mdFile := strings.Replace(file, ".html", ".md", 1)

		if is_file_exists(mdFile) {
			// Hier Marrkdown parsen und zurückgeben
			site, err := parsemd.Parse(mdFile)
			if err == nil {
				// Template lesen
				templFile := site.Template
				if templFile == "" {
					// Standard Template
					templFile = "_template.html"
				}

				// Template parsen
				templ, err := template.New(templFile).Funcs(template.FuncMap{"noescape": noescape}).ParseFiles(templFile)
				if err != nil {
					fmt.Println("ERROR: Template: " + templFile + " " + err.Error())

					if site.Content != "" {
						w.Header().Add("Content-Type", "text/html")
						_, err := fmt.Fprintf(w, site.Content)
						if err != nil {
							fmt.Fprintf(os.Stderr, "Fprintf: %v\n", err)
						}
						return
					}
				} else {
					err = templ.Execute(w, site)
					if err != nil {
						fmt.Println("ERROR: Template: " + templFile + " " + err.Error())
					}
					return
				}
			}
		}
	} // else if filetype == ".lidoc" {
	// hier Liste Parsen und zurückgeben
	// }

	// nur die Datei ausliefern
	http.ServeFile(w, r, file)
}

// Start Funktion
func main() {
	// Parameter prüfen
	// flag.StringVar(zeiger, name, default, beschreibung)
	flag.StringVar(&port, "p", Port, "Server Port")
	flag.Parse()

	// Handler
	go http.HandleFunc("/", handleFile)

	//Create the server.
	serverURL := Host + ":" + port

	fmt.Println(runtime.GOOS)
	fmt.Println("Server running on http://" + serverURL)
	fmt.Println("stop with CTRL+C")
	fmt.Println("...")

	err := http.ListenAndServe(serverURL, nil)
	if err != nil {
		log.Fatal("Error Starting the HTTP Server :", err)
		return
	}
}
