package main

import (
	"fmt"

	"github.com/Maurehago/lidoc/infolist"
)

func main() {
	ils := infolist.ILists{}

	il := infolist.InfoList{Name: "testy"}
	il.Fields = []string{"feld1", "feld2", "feld3"}
	il.Types = []string{"str", "str", "str"}

	il.Data = make(map[string][]interface{})
	il.Data["maxi"] = []interface{}{"f1 ein Text", "f2 und ein Text\nzweite Zeile", "f3 hhhh"}
	il.Data["supsi"] = []interface{}{"f1", "f2", "f3"}

	ils["test1"] = il

	infoString, err := ils.Marshal()
	if err != nil {
		panic(err)
	}

	fmt.Println(string(infoString))

	testList := infolist.ILists{}
	testList.Unmarshal(infoString)

	// v := testList["test1"].Data["maxi"]
	tl := testList["test1"]

	a := tl.Get("maxi")
	fmt.Println(a)

	v := tl.GetValue("maxi", "feld2")
	fmt.Println(v)

	va := tl.GetValues("maxi", []string{"feld3", "feld1"})
	fmt.Println(va)

	/*
		testListString, err := testList.Marshal()
		if err != nil {
			panic(err)
		}
	*/
	fmt.Println(testList)
}
