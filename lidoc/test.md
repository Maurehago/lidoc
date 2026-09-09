---
test_schema: test:test

test_cols:
- vorname Vorname des Kunden
- nachname Nachname
- email Email-Adresse

---

=== test
- [Test](/Test1)
- [Test 2](/Test 2)

===

# zum Testen

## Tabelle

[ table-stripes w-25]
|* Name [ text-c] |* Value |
| Name 1 | Wert 1 |
| Name 2 | Wert 2 |
| Name 3 | Wert 3 | [ color-green]
|* Name 4 | Wert 4 |
| Name 5 | Wert 5 [ color-blue] |

[table-stripes data-schema="test:test" data-cols="test_cols"]
| |



## Liste
1. Name1
    2. Wert 1
        - test 3
    - Wert X
5. Name 2
    1. Wert 2
    - sdfdsfs
- ss

- aaaa
    - bbbb
        - cccc
- B
    - cc
    - ddd
- C
- D
    - E

Hallo

## Data liste
[ table-stripes table-border]
+++ list /data/test
- id
- name Name
- info Info


## Data Formular
[ id="testForm" color-s]
+++ form
- id
- name Name
- info Info

## Form

[ color-s ma-all w-50]
| ID | <input type="number" data-col="id"> |
| Name | <input type="text" data-col="name"> |
| Info | <input type="text" data-col="info"> |
