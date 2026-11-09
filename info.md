# JSON SQL-Query DSL (Domain Specific Language) Dokumentation

Diese Spezifikation beschreibt das flache, deklarative JSON-Format zur Abbildung komplexer SQL-Abfragen. Das Design verzichtet bewusst auf tiefe Verschachtelungen (AST), ist für Entwickler intuitiv lesbar und deckt alle modernen SQL-Features ab.

## 1. Kernkonzepte & Syntax-Regeln

- quest repräsentiert das WHERE / HAVING: Ein Objekt, dessen Key-Value-Paare standardmäßig per AND verknüpft werden. Arrays erzeugen eine OR-Verknüpfung.
- Das Präfix $. für Tabellenfelder: Wenn ein Wert mit $. beginnt (z.B. "$.c.id"), erkennt der Parser dies als Spaltenreferenz einer Fremdtabelle und schreibt sie direkt in das SQL. Beginnt der Wert nicht damit, wird er als skalarer Wert sicher als Parameter (?) gebunden.
- Standardmäßig immer LEFT JOIN: Da im Anwendungsalltag fast ausschließlich LEFT OUTER JOINs benötigt werden, generiert die joins-Eigenschaft im Treiber immer einen LEFT JOIN. Ein separates type-Feld entfällt.
- Gleicher Aufbau für Joins und Bedingungen: Verknüpfungen nutzen das Feld "on", welches exakt dieselbe rekursive Syntax wie "quest" verwendet.

## 2. Struktur eines Query-Objekts

Jeder Tabellen-Konfigurationsblock besitzt folgendes flaches Schema auf oberster Ebene:

|* Key	 |* Typ	|* Beschreibung	|* Beispiel |
| driver | String	| Name des Datenbak Treibers.	| "sqlite1" |
| table  | String	| Der Tabellenname inklusive optionalem Alias.	| "customers c" |
| cols	 | Array<String>	| Ausgewählte Spalten, SQL-Funktionen oder mathematische Ausdrücke.	| ["c.id", "SUM(ci.score) AS total"] |
| joins	 | Array<Object>	| Liste flacher Relationen. Jedes Objekt enthält table und ein on-Vergleichsobjekt.	| [ { "table": "logs l", "on": { "l.user_id": "$.c.id" } } ] |
| quest	 | Object | Array	| Die Filterbedingungen (WHERE-Klausel). Unterbaut auch _exists und _not_exists.	| { "c.city": "Wien" } |
| subs	 | Object	| Definiert Subselects. Der Key wird zum SQL-Alias, das Ergebnis wird automatisch an cols angehängt.	| { "cnt": { "table": "logs", "cols":  | ["COUNT(*)"] } } |
| group	 | Array<String>	| Gruppierungsspalten für Aggregationen.	| ["c.id", "c.name"] |
| having | Object	| Filterbedingungen für Aggregatfunktionen nach dem GROUP BY.	| { "SUM(ci.score)": { ">": 50 } } |
| sort	 | Array<String>	| Sortierungsanweisungen inklusive SQL-Zusätzen.	| ["total_score DESC", "c.name ASC NULLS FIRST"] |
| limit	 | Number	| Maximale Anzahl an zurückzugebenden Datensätzen.	| 25 |
| page	 | Number	| Die Seitenzahl für die Paginierung (berechnet automatisch den OFFSET).	| 2 |


## 3. Anwendungsbeispiele & JSON-Vorlagen


Beispiel A: Einfache Abfrage mit Paginierung und Sortierung

Holt Kunden aus Wien, sortiert nach Name, limitiert auf 25 Einträge für die zweite Ergebnisseite (Offset 25).
```json
{
  "table": "customers c",
  "driver": "sqlite1",
  "cols": ["c.id", "c.name", "c.email"],
  "quest": {
    "c.city": "Wien"
  },
  "sort": ["c.name ASC NULLS FIRST"],
  "limit": 25,
  "page": 2
}
```
Generiertes SQL:
```sql
SELECT c.id, c.name, c.email FROM customers c WHERE c.city = ? ORDER BY c.name ASC NULLS FIRST LIMIT 25 OFFSET 25
```

Beispiel B: LEFT JOIN mit Spalten-Extraktion für das UI

Um im UI bei Klick auf einen Kunden dessen Interessen filtern zu können, wird die n:n-Tabelle gejoint und deren Fremdschlüssel direkt selektiert.
```json
{
  "table": "interests i",
  "driver": "sqlite1",
  "cols": ["i.*", "ci.customer_id"],
  "joins": [
    {
      "table": "customers_interests ci",
      "on": { "ci.interest_id": "$.i.id" }
    }
  ],
  "quest": {
    "i.category_id": { "IN": [3, 4, 7, 12] }
  }
}
```
Generiertes SQL:
```sql
SELECT i.*, ci.customer_id FROM interests i LEFT JOIN customers_interests ci ON ci.interest_id = i.id WHERE i.category_id IN (?, ?, ?, ?)
```

Beispiel C: WHERE EXISTS und NOT EXISTS (Verschachtelte Filter)

Holt alle Wiener Kunden, die mindestens ein aktives Interesse besitzen, aber keine Fehler-Logs aufweisen.
```json
{
  "table": "customers c",
  "driver": "sqlite1",
  "cols": ["c.*"],
  "quest": {
    "c.city": "Wien",
    "_exists": {
      "table": "customers_interests ci",
      "on": { "ci.customer_id": "$.c.id", "ci.is_active": true },
      "quest": {
        "_exists": {
          "table": "interests i",
          "on": { "i.id": "$.ci.interest_id" },
          "quest": { "i.category_id": { "IN": [3, 4, 7, 12] } }
        }
      }
    },
    "_not_exists": {
      "table": "logs l",
      "on": { "l.user_id": "$.c.id" },
      "quest": { "l.level": "ERROR" }
    }
  }
}
```
Generiertes SQL:
```sql
SELECT c.* FROM customers c 
WHERE c.city = ? 
  AND EXISTS (
    SELECT 1 FROM customers_interests ci 
    WHERE ci.customer_id = c.id AND ci.is_active = ? 
      AND EXISTS (
        SELECT 1 FROM interests i WHERE i.id = ci.interest_id AND i.category_id IN (?, ?, ?, ?)
      )
  )
  AND NOT EXISTS (
    SELECT 1 FROM logs l WHERE l.user_id = c.id AND l.level = ?
  )
```

Beispiel D: Aggregationen, HAVING und Subselects (subs)

Berechnet Statistiken pro Kunde. Nutzt das subs-Objekt für korrelierte Unterabfragen (die vom Parser automatisch als Spalte formatiert werden) und filtert per having auf Mindest-Scores.
```json
{
  "table": "customers c",
  "driver": "sqlite1",
  "cols": ["c.id", "c.name", "SUM(ci.score) AS total_score"],
  "subs": {
    "global_interest_avg": {
      "table": "interests i",
      "cols": ["AVG(i.base_score)"]
    },
    "user_log_count": {
      "table": "logs l",
      "cols": ["COUNT(*)"],
      "quest": { "l.user_id": "$.c.id" }
    }
  },
  "joins": [
    { "table": "customers_interests ci", "on": { "ci.customer_id": "$.c.id" } }
  ],
  "quest": { "c.city": "Wien" },
  "group": ["c.id", "c.name"],
  "having": {
    "SUM(ci.score)": { ">": 50 }
  }
}
```
Generiertes SQL:
```sql
SELECT c.id, c.name, SUM(ci.score) AS total_score, (SELECT AVG(i.base_score) FROM interests i) AS global_interest_avg, (SELECT COUNT(*) FROM logs l WHERE l.user_id = c.id) AS user_log_count 
FROM customers c 
LEFT JOIN customers_interests ci ON ci.customer_id = c.id
WHERE c.city = ? 
GROUP BY c.id, c.name 
HAVING SUM(ci.score) > ?
```

## 4. Sonder-Operatoren Referenz

Vergleiche & Listen (IN, NOT IN)

```json
"i.category_id": { "IN": [3, 4, 7] }
```
oder mit SUB-Select
```json
"i.category_id": { "IN": {"table": "categories ca", "cols": ["ca.id"], "quest": {"active": true}} }
```


NULL-Werte prüfen (IS NULL, IS NOT NULL)

Werte werden als Booleans übergeben und erzeugen keine Parameter-Bindung (?).
```json
"c.deleted_at": { "IS NULL": true },
"ci.verified_at": { "IS NOT NULL": true }
```

Logische Operatoren (_or)

Arrays auf beliebiger quest- oder on-Ebene wechseln die standardmäßige Verknüpfung von AND auf OR.
```json
"quest": [
  { "c.status": "premium" },
  { "c.score": { ">": 90 } }
]
```
(Erzeugt im SQL: WHERE (c.status = ? OR c.score > ?))
