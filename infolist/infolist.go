package infolist

import (
	"encoding/json"
	"fmt"
	"os"
	"slices"
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

// Diese Funktion liefert ein Array/Slice für einen Datensatz zurück
// die Feldnamen und die Reihenfolge der Daten bestimmt die "Fields" Eigenschaft von der InfoList
func (il InfoList) Get(id string) Record {
	return il.Data[id]
}

// Liefert auf Grund des angegebenen Feldnamen(field)
// die Position/Index der Spalte in der InfoList zurück
func (il InfoList) GetIndex(field string) int {
	return slices.Index(il.Fields, field)
}

// Liefert eine Liste an Positionen/Indexes der angegebenen Spaltennamen(fields) zurück.
func (il InfoList) GetIndexes(fields []string) []int {
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
