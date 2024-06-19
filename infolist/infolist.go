package infolist

// Daten haben immer eine GSID und eine Liste von Werten
type InfoData map[string][]interface{}

// Eine Info Liste
type InfoList struct {
	Name    string
	Fields  []string
	Types   []string
	Formats []string
	Prop    map[string]any
	Data    InfoData
}

// Liefert einen Datensatz zurück
func (il InfoList) Get(gsid string) []any {
	return il.Data[gsid]
}

// Datensatz in die liste Speichern
func (il InfoList) Set(gsid string, data []any) {
	il.Data[gsid] = data
}
