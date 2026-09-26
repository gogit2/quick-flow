#!/usr/bin/env bash
# M04 Learning: card CRUD, validation, milestones (complete/uncomplete, status derivation), notes, BR-9, cascade delete.
source "$(dirname "$0")/_lib.sh"
U="$(uniq)"
P=/learning-cards

# case 1: create card
req POST $P "{\"title\":\"Course $U\",\"description\":\"https://example.com\"}"
expect_status A1 "create card 201" 201
expect_json   A1 "status NOT_STARTED" '.status' NOT_STARTED
expect_json   A1 "milestones empty" '.milestones | length' 0
expect_json   A1 "notes empty" '.notes | length' 0
expect_json   A1 "progress 0" '.progressPercent' 0
expect_header A1 "Location header" Location "/api/v1/learning-cards/"
C="$(jq -r .id <<<"$BODY")"
req GET $P
expect_json   A1 "card in list" "[.[] | select(.id == $C)] | length" 1

# case 2: validation
req POST $P '{"title":"   "}'
expect_status A2 "blank title 400" 400
expect_json   A2 "errors.title present" '.errors.title != null' true
req POST $P '{"description":"no title"}'
expect_status A2 "missing title 400" 400
req POST "$P/$C/milestones" '{"title":""}'
expect_status A2 "blank milestone title 400" 400
req POST "$P/$C/notes" '{"text":" "}'
expect_status A2 "blank note text 400" 400
req GET "$P/999999999"
expect_status A2 "unknown card 404" 404

# case 3: add 2 milestones
req POST "$P/$C/milestones" '{"title":"Step 1","targetDate":"2026-12-31"}'
expect_status A3 "add milestone 1 201" 201
expect_header A3 "Location header" Location "/milestones/"
expect_json   A3 "targetDate kept" '.milestones[0].targetDate' 2026-12-31
M1="$(jq -r '.milestones[0].id' <<<"$BODY")"
req POST "$P/$C/milestones" '{"title":"Step 2"}'
expect_status A3 "add milestone 2 201" 201
expect_json   A3 "milestonesTotal 2" '.milestonesTotal' 2
expect_json   A3 "second targetDate null" '.milestones[1].targetDate' null
M2="$(jq -r '.milestones[1].id' <<<"$BODY")"

# case 4: complete / uncomplete, derived status
req POST "$P/$C/milestones/$M1/complete"
expect_status A4 "complete milestone 200" 200
expect_json   A4 "done true" ".milestones[] | select(.id == $M1) | .done" true
expect_json   A4 "completedAt set" ".milestones[] | select(.id == $M1) | .completedAt != null" true
expect_json   A4 "status IN_PROGRESS" '.status' IN_PROGRESS
expect_json   A4 "progress 50" '.progressPercent' 50
expect_json   A4 "milestonesDone 1" '.milestonesDone' 1
req POST "$P/$C/milestones/$M2/complete"
expect_json   A4 "all done → COMPLETED" '.status' COMPLETED
expect_json   A4 "progress 100" '.progressPercent' 100
req POST "$P/$C/milestones/$M2/uncomplete"
expect_status A4 "uncomplete 200" 200
expect_json   A4 "uncompleted → IN_PROGRESS" '.status' IN_PROGRESS
expect_json   A4 "completedAt cleared" ".milestones[] | select(.id == $M2) | .completedAt" null
req PUT "$P/$C/milestones/$M2" '{"title":"Step 2 renamed","targetDate":"2027-01-15","done":true}'
expect_status A4 "PUT milestone 200" 200
expect_json   A4 "PUT renames" ".milestones[] | select(.id == $M2) | .title" "Step 2 renamed"
expect_json   A4 "PUT done → COMPLETED" '.status' COMPLETED

# case 5: manual status
req PUT "$P/$C" "{\"title\":\"Course $U v2\",\"description\":\"book\",\"status\":\"NOT_STARTED\"}"
expect_status A5 "PUT card 200" 200
expect_json   A5 "manual status saved" '.status' NOT_STARTED
expect_json   A5 "title updated" '.title' "Course $U v2"
req GET "$P/$C"
expect_json   A5 "manual status persisted" '.status' NOT_STARTED
req PUT "$P/$C" "{\"title\":\"Course $U v2\",\"status\":\"COMPLETED\"}"
expect_json   A5 "manual COMPLETED saved" '.status' COMPLETED
req PUT "$P/$C" "{\"title\":\"Course $U v2\"}"
expect_json   A5 "omitted status keeps it" '.status' COMPLETED
req PUT "$P/$C" "{\"title\":\"Course $U v2\",\"status\":\"DONE\"}"
expect_status A5 "bad status 400" 400

# case 6: notes
req POST "$P/$C/notes" '{"text":"First note"}'
expect_status A6 "add note 201" 201
expect_json   A6 "createdAt set" '.createdAt != null' true
N1="$(jq -r .id <<<"$BODY")"
req POST "$P/$C/notes" '{"text":"Second note"}'
N2="$(jq -r .id <<<"$BODY")"
req GET "$P/$C"
expect_json   A6 "2 notes on card" '.notes | length' 2
expect_json   A6 "newest first" '.notes[0].id' "$N2"
req DELETE "$P/$C/notes/$N1"
expect_status A6 "delete note 204" 204
req GET "$P/$C"
expect_json   A6 "note gone" "[.notes[] | select(.id == $N1)] | length" 0

# case 7: delete milestone, BR-9 cross-card ids
req POST $P "{\"title\":\"Other $U\"}"
C2="$(jq -r .id <<<"$BODY")"
req POST "$P/$C2/milestones/$M1/complete"
expect_status A7 "milestone of other card 404" 404
req DELETE "$P/$C2/milestones/$M1"
expect_status A7 "delete milestone via other card 404" 404
req DELETE "$P/$C2/notes/$N2"
expect_status A7 "delete note via other card 404" 404
req DELETE "$P/$C/milestones/$M2"
expect_status A7 "delete milestone 204" 204
req GET "$P/$C"
expect_json   A7 "milestonesTotal 1" '.milestonesTotal' 1
expect_json   A7 "re-derived COMPLETED (1/1 done)" '.status' COMPLETED
req DELETE "$P/$C/milestones/$M2"
expect_status A7 "delete missing milestone 404" 404

# case 8: delete card cascades
req DELETE "$P/$C"
expect_status A8 "delete card 204" 204
req GET "$P/$C"
expect_status A8 "deleted card 404" 404
req GET $P
expect_json   A8 "gone from list" "[.[] | select(.id == $C)] | length" 0
req POST "$P/$C/notes" '{"text":"x"}'
expect_status A8 "note on deleted card 404" 404
req DELETE "$P/$C2"
expect_status A8 "cleanup other card 204" 204

summary
