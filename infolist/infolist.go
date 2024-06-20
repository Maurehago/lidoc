package infolist

import (
	"fmt"
	"os"
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
type InfoList struct {
	Name   string                   // Name der Liste
	Prop   map[string]interface{}   // Zusätzliche Eigenschaften der Liste
	Fields []string                 // FeldNamen von Data
	Types  []string                 // FeldTypen von Data
	Data   map[string][]interface{} // Daten der Liste
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
			data += k + "↔" + fmt.Sprintf("%s▲", v)
		}

		// Daten hinzufügen
		data += "---▲"

		for k, v := range il.Data {
			data += k + "↔"
			for i, d := range v {
				if i > 0 {
					data += fmt.Sprintf("▼%s", d)
				} else {
					data += fmt.Sprintf("%s", d)
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

					case "int8":
						f[i], err = strconv.ParseInt(item, 10, 8)

					case "int16":
						f[i], err = strconv.ParseInt(item, 10, 16)

					case "int32":
						f[i], err = strconv.ParseInt(item, 10, 32)

					case "int64":
						f[i], err = strconv.ParseInt(item, 10, 64)

					case "uint8":
						f[i], err = strconv.ParseUint(item, 10, 8)

					case "uint16":
						f[i], err = strconv.ParseUint(item, 10, 16)

					case "uint32":
						f[i], err = strconv.ParseUint(item, 10, 32)

					case "uint64":
						f[i], err = strconv.ParseUint(item, 10, 64)

					case "num32":
						f[i], err = strconv.ParseFloat(item, 32)

					case "num64":
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
