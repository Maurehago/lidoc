package infolist

import (
	"cmp"
	"crypto/rand"
	"encoding/json"
	"errors"
	"fmt"
	"math/big"
	"os"
	"path/filepath"
	"slices"
	"strconv"
	"strings"
	"time"
)

// Daten haben immer eine GSID und eine Liste von Werten
type Record []interface{}
type Fields []string

// ==================
//
//	InfoList
//
// -----------

// Als JSON
// {
// 	"liste1": {
// 	  "Name": "liste1"
// 	  , "Fields": ["feld1", "feld2", "feld3", "feld4"]
// 	  , "Types" : ["bool", "int", "num", "str"]
// 	  , "Prop": {
// 		"supa": "Wert von Supa"
// 	  }
// 	  , "Data": {
// 		"id1": [true, 32, 64.5, "1. Text"]
// 		, "id2": [true, 16, 112.3, "2. Text\nund Text in 2. Zeile"]
// 		, "id7": [true, 22, null, "3. Text mit excaped \" "]
// 		, "5": [false, null, 42.42, "Text 2"]
// 	  }
//	  , "List": []
// 	}
// 	, "liste2": {

// 	}
// }

type InfoList struct {
	Name   string                   // Name der Liste
	Path   string                   // Pfad der Liste im Dateisystem
	Prop   map[string]interface{}   // Zusätzliche Eigenschaften der Liste
	Fields []string                 // FeldNamen von Data
	Types  []string                 // FeldTypen von Data
	Data   map[string][]interface{} // Daten der Liste
	List   []any                    // Liste von einträgen z.B.: für ENums
}

// Diese Funktion liefert ein Array/Slice für einen Datensatz zurück
// die Feldnamen und die Reihenfolge der Daten bestimmt die "Fields" Eigenschaft von der InfoList
func (il InfoList) Get(id string) Record {
	return il.Data[id]
}

// Setzt einen Datensatz(data) mit der id in der Liste
// Wenn vorhanden wird der Datensatz komplett überschrieben.
func (il InfoList) Set(id string, data Record) {
	// todo: Prüfen auf Array und die richtigen Datentypen
	il.Data[id] = data
}

// Liefert auf Grund des angegebenen Feldnamen(field)
// die Position/Index der Spalte in der InfoList zurück
func (il InfoList) GetFieldIndex(field string) int {
	return slices.Index(il.Fields, field)
}

// Liefert eine Liste an Positionen/Indexes der angegebenen Spaltennamen(fields) zurück.
func (il InfoList) GetFieldIndexes(fields []string) []int {
	indexes := make([]int, len(fields))
	fieldList := il.Fields

	for i, v := range fields {
		indexes[i] = slices.Index(fieldList, v)
	}

	return indexes
}

// Liest den Wert einer Spalte(field) vom angegebenen Datensatz(id) aus.
func (il InfoList) GetValue(id string, field string) any {
	index := slices.Index(il.Fields, field)
	if index >= 0 {
		return il.Data[id][index]
	} else {
		return nil
	}
}

// Gibt ein Array/Slice an Werten für die Spalten(fields) eines Datensatzes(id) zurück.
func (il InfoList) GetValues(id string, fields []string) []any {
	data := make([]any, len(fields))
	fieldNames := il.Fields
	dataList := il.Data[id]

	// Alle Felder durchgehen
	for i, name := range fields {
		// index der Spalte
		index := slices.Index(fieldNames, name)

		if index >= 0 {
			data[i] = dataList[index]
		} else {
			data[i] = nil
		}
	}
	return data
}

// Setzt den Wert(value) einer Spalte(field) im Datensatz(id)
func (il InfoList) SetValue(id string, field string, value any) {
	index := slices.Index(il.Fields, field)

	if index >= 0 {
		fieldType := il.Types[index]

		// Wert setzen
		switch fieldType {
		case "int", "num", "bool":
			il.Data[id][index] = value
		default:
			il.Data[id][index] = fmt.Sprintf("%v", value)
		}
	}
}

// Sortierter Index
func (il InfoList) GetSortIndex(fields []string) []string {
	// Alle Keys von der map
	dataIndex := make([]string, len(il.Data))

	for k, _ := range il.Data {
		dataIndex = append(dataIndex, k)
	}

	// Prüfen auf FeLder
	if len(fields) <= 0 {
		return dataIndex
	}

	// Feld/Spalten Positionen ermitteln
	fieldIndex := il.GetFieldIndexes(fields)

	// Sortieren
	slices.SortStableFunc(dataIndex, func(a, b string) int {
		dataA := il.Data[a]
		dataB := il.Data[b]

		sortValue := 0

		for i, fi := range fieldIndex {
			fieldName := fields[i]
			fieldType := il.Types[fi]

			valueA := dataA[fi]
			valueB := dataB[fi]

			if strings.HasSuffix(fieldName, " DESC") {
				// Absteigend Sortieren
				switch fieldType {
				case "bool":
					if valueB.(bool) && !valueA.(bool) {
						sortValue = 1
						return 1
					} else if !valueB.(bool) && valueA.(bool) {
						sortValue = -1
						return -1
					}
				case "int":
					sortValue = cmp.Compare[int](valueB.(int), valueA.(int))
				case "num":
					sortValue = cmp.Compare[float64](valueB.(float64), valueA.(float64))
				default:
					sortValue = cmp.Compare[string](valueB.(string), valueA.(string))
				} // Switch Type
			} else {
				// Aufsteigend sortieren
				switch fieldType {
				case "bool":
					if valueA.(bool) && !valueB.(bool) {
						sortValue = 1
						return 1
					} else if !valueA.(bool) && valueB.(bool) {
						sortValue = -1
						return -1
					}
				case "int":
					sortValue = cmp.Compare[int](valueA.(int), valueB.(int))
				case "num":
					sortValue = cmp.Compare[float64](valueA.(float64), valueB.(float64))
				default:
					sortValue = cmp.Compare[string](valueA.(string), valueB.(string))
				} // Switch Type
			}

			if sortValue != 0 {
				return sortValue
			}
		} // For jede Spalte

		// Sortierung zurückgeben
		return sortValue
	}) // Sortierung

	return dataIndex
} // getSortIndex

// liefert einen JsonBlob([]byte) von der InfoList Auflistung zurück.
// Für Datenübertragung und zum Speichern in eine Datei.
func (il InfoList) Marshal() ([]byte, error) {
	return json.Marshal(il)
} // Marshal

// Liest einen JsonBlob([]byte) in die InfoList Auflistung ein
func (il InfoList) Unmarshal(data []byte) error {
	return json.Unmarshal(data, &il)
} // unmarshal

// von Speicher laden -> in Adresse von Infolist
func (il *InfoList) Load(listBasePath string) error {
	// Prüfen auf Name und Pfad
	if il.Name == "" {
		return errors.New("no 'Name' in List")
	}
	if il.Path == "" {
		return errors.New("no 'Path' in List")
	}

	// Pfad im Homedir suchen
	if listBasePath == "" {
		basePath, err := os.UserHomeDir()
		if err != nil {
			panic(err)
		}
		listBasePath = basePath
	}
	listPath := filepath.Join(listBasePath, "ilist", il.Path, il.Name+".json")

	// laden
	data, err := os.ReadFile(listPath)
	if err != nil {
		return err
	}

	//err = il.Unmarshal(data)
	err = json.Unmarshal(data, &il)
	if err != nil {
		return err
	}

	// Prüfen ob vorhanden
	return nil
} // Load

// von Speicher laden -> in Adresse von Infolist
func (il *InfoList) LoadFrom(listBasePath string, path string, name string) error {
	// Prüfen auf Name und Pfad
	if name == "" {
		return errors.New("no 'Name' in List")
	}
	if path == "" {
		return errors.New("no 'Path' in List")
	}

	il.Name = name
	il.Path = path

	// Pfad im Homedir suchen
	if listBasePath == "" {
		basePath, err := os.UserHomeDir()
		if err != nil {
			panic(err)
		}
		listBasePath = basePath
	}
	listPath := filepath.Join(listBasePath, "ilist", il.Path, il.Name+".json")

	// laden
	data, err := os.ReadFile(listPath)
	if err != nil {
		return err
	}

	//err = il.Unmarshal(data)
	err = json.Unmarshal(data, &il)
	if err != nil {
		return err
	}

	// Prüfen ob vorhanden
	return nil
} // Load

// in Speicher schreiben
func (il InfoList) Save(listBasePath string) error {
	// Prüfen auf Name und Pfad
	if il.Name == "" {
		return errors.New("no 'Name' in List")
	}
	if il.Path == "" {
		return errors.New("no 'Path' in List")
	}

	// Pfad im Homedir erstellen
	if listBasePath == "" {
		basePath, err := os.UserHomeDir()
		if err != nil {
			panic(err)
		}
		listBasePath = basePath
	}
	listPath := filepath.Join(listBasePath, "ilist", il.Path)
	if _, err := os.Stat(listPath); os.IsNotExist(err) {
		os.MkdirAll(listPath, 0700) // Create your file
	}
	listFile := filepath.Join(listPath, il.Name+".json")

	// Daten
	data, err := il.Marshal()
	if err != nil {
		return err
	}

	// Speichern
	fmt.Println("List:", listFile)
	err = os.WriteFile(listFile, data, 0777)
	if err != nil {
		return err
	}

	// Prüfen ob vorhanden
	return nil
} // Save

// =============================
//
//	Liste von InfoListen
//
// -----------------------

type ILists map[string]InfoList // InfoList Auflistung

// liefert einen JsonBlob([]byte) von der InfoList Auflistung zurück.
// Für Datenübertragung und zum Speichern in eine Datei.
func (ils ILists) Marshal() ([]byte, error) {
	return json.Marshal(ils)
} // Marshal

// Liest einen JsonBlob([]byte) in die InfoList Auflistung ein
func (ils ILists) Unmarshal(data []byte) error {
	return json.Unmarshal(data, &ils)
} // unmarshal

// GSID Erstellen
func GSID() string {
	// Time
	t := time.Now()
	unixTime := t.UnixMilli()
	timestring := strconv.FormatInt(unixTime, 36)

	// Random
	r, err := rand.Int(rand.Reader, big.NewInt(10000000000))
	if err != nil {
		fmt.Println("error:", err)
		return err.Error()
	}
	randstring := strconv.FormatInt(r.Int64(), 36)

	// Time + Random
	return timestring + randstring
}
