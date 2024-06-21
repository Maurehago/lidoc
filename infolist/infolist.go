package infolist

import (
	"fmt"
	"os"
	"slices"
	"strconv"
	"strings"
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
// 	}
// 	, "liste2": {

// 	}
// }

type InfoList struct {
	Name   string                   // Name der Liste
	Prop   map[string]interface{}   // Zusätzliche Eigenschaften der Liste
	Fields []string                 // FeldNamen von Data
	Types  []string                 // FeldTypen von Data
	Data   map[string][]interface{} // Daten der Liste
}

// Slice an Daten holen - Datensatz Array
func (il InfoList) Get(id string) Record {
	return il.Data[id]
}

// Index einer Spalte holen
func (il InfoList) GetIndex(field string) int {
	return slices.Index(il.Fields, field)
}

// Wert einer Spalte holen
func (il InfoList) GetValue(id string, field string) any {
	index := slices.Index(il.Fields, field)
	if index >= 0 {
		return il.Data[id][index]
	} else {
		return nil
	}
}

// Mehrere Daten lesen
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

// Wert einer Spalte setzen
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

// =============================
//
//	Liste von InfoListen
//
// -----------------------
type ILists map[string]InfoList

// Marshal
func (ils ILists) Marshal() ([]byte, error) {
	var data string

	addList := func(il InfoList) {
		// Beginn der Liste
		data += "===↔" + il.Name + "▲"

		// Feldnamen und Typen
		data += "fields↔" + strings.Join(il.Fields, "▼") + "▲"
		data += "types↔" + strings.Join(il.Types, "▼") + "▲"

		// Restliche Eigenschaften
		for k, v := range il.Prop {
			data += k + "↔" + fmt.Sprintf("%v▲", v)
		}

		// Daten hinzufügen
		data += "---▲"

		for k, v := range il.Data {
			data += k + "↔"
			for i, d := range v {
				if i > 0 {
					data += fmt.Sprintf("▼%v", d)
				} else {
					data += fmt.Sprintf("%v", d)
				}
			}
			data += "▲"
		}
	}

	for _, il := range ils {
		addList(il)
	}

	return []byte(data), nil
} // Marshal

// UnMarshal
func (ils ILists) Unmarshal(data []byte) error {
	// in einen String umwandeln
	text := string(data)

	// in Zeilen aufsplitten
	lines := strings.Split(text, "▲")

	// Speicher für neue Liste
	var infolist InfoList
	var isProp bool
	var err error

	// Alle Zeilen durchgehen
	for _, line := range lines {
		// in ID und Daten aufsplitten
		id, dataLine, found := strings.Cut(line, "↔")
		if found {
			// Wenn ID == "===" dann ist es der Listenname
			if id == "===" {
				// neue Info list
				infolist = InfoList{}
				infolist.Name = dataLine
				ils[dataLine] = infolist
				isProp = true
			} else if isProp {
				// Fenn felder
				if id == "fields" {
					infolist.Fields = strings.Split(dataLine, "▼")
				} else if id == "types" {
					infolist.Types = strings.Split(dataLine, "▼")
				} else if strings.Contains(dataLine, "▼") {
					// in ein Slice auftrennen
					infolist.Prop[id] = strings.Split(dataLine, "▼")
				} else {
					// Einfache Eigenschaft
					infolist.Prop[id] = dataLine
				}
			} else {
				// ab Hier sind Daten
				items := strings.Split(dataLine, "▼")
				l := len(items)
				f := make([]interface{}, l)
				types := infolist.Types

				for i, item := range items {
					switch types[i] {
					case "bool":
						f[i], err = strconv.ParseBool(item)

					case "int":
						f[i], err = strconv.Atoi(item)

					case "num":
						f[i], err = strconv.ParseFloat(item, 64)

					default:
						f[i] = item
					} // switch

					// bei Fehler Abbrechen
					if err != nil {
						return err
					}
				} // for Items

				// Zu Daten hinzufügen
				infolist.Data[id] = f
			}
		} else {
			// keine richtige Datenzeile
			if id == "---" {
				isProp = false
			}
		} // Wenn Key Value Zeile
	} // For alle Zeilen

	return nil
} // unmarshal

func test() {
	x := InfoList{Name: "test"}
	x.Fields = Fields{"gsid", "name", "adresse", "plz"}
	x.Types = Fields{"str", "str", "str", "str"}

	il := ILists{}
	il["test"] = x

	data, _ := il.Marshal()
	os.WriteFile("test.txt", data, 0777)
	test := Record{"eurwe", 1, 7, false, "hfhf"}
	x.Data["test"] = test

	//test2 := Data{x["fields"]}
	//name := slices.Index(test2, "name")
	//fmt.Println(x["fields"], test2[name])
}
