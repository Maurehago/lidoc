package main

import (
	"fmt"

	"github.com/Maurehago/lidoc/infolist"
)

func main() {
	// ils := infolist.ILists{}

	il := infolist.InfoList{Name: "testy"}
	il.Path = "test"
	il.Fields = []string{"feld1", "feld2", "feld3"}
	il.Types = []string{"str", "str", "str"}

	il.Data = make(map[string][]interface{})
	il.Data["maxi"] = []interface{}{"f1 ein Text", "f2 und ein Text\nzweite Zeile", "f3 hhhh"}
	il.Data["supsi"] = []interface{}{"f1", "f2", "f3"}

	// Speichern
	err := il.Save(".")
	if err != nil {
		panic(err)
	}

	// laden
	testList := infolist.InfoList{}
	// testList.Name = "testy"
	// testList.Path = "test"
	err = testList.LoadFrom(".", "test", "testy")
	if err != nil {
		panic(err)
	}

	fmt.Println(testList)

	// Wert lesen
	fmt.Println(testList.GetValue("supsi", "feld2"))

	// GSID
	fmt.Println("GSID:", infolist.GSID())
}
