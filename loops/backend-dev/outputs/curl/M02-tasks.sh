#!/usr/bin/env bash
# M02 Tasks: CRUD, validation, complete/completedAt, archive/restore, hard delete, search/filter/sort, overdue, 404s.
source "$(dirname "$0")/_lib.sh"
U="$(uniq)"
# "today" in the server zone, derived from a throwaway habit completion (the server owns the clock)
req POST /habits "{\"name\":\"clock $U\",\"frequency\":\"DAILY\"}"; HC="$(jq -r .id <<<"$BODY")"
req POST "/habits/$HC/completions"; TODAY="$(jq -r .date <<<"$BODY")"; req DELETE "/habits/$HC"
YESTERDAY="$(date -d "$TODAY -1 day" +%F)"
TOMORROW="$(date -d "$TODAY +1 day" +%F)"
IN5="$(date -d "$TODAY +5 day" +%F)"

# case 1: create
req POST /tasks "{\"title\":\"Report $U\",\"description\":\"desc\",\"priority\":\"HIGH\",\"dueDate\":\"$IN5\"}"
expect_status A1 "create 201" 201
expect_header A1 "Location header" Location "/api/v1/tasks/"
expect_json   A1 "title echoed" '.title' "Report $U"
expect_json   A1 "description echoed" '.description' desc
expect_json   A1 "priority HIGH" '.priority' HIGH
expect_json   A1 "dueDate echoed" '.dueDate' "$IN5"
expect_json   A1 "status TODO" '.status' TODO
expect_json   A1 "archived false" '.archived' false
expect_json   A1 "completedAt null" '.completedAt' null
T1="$(jq -r .id <<<"$BODY")"; UPD1="$(jq -r .updatedAt <<<"$BODY")"
req POST /tasks "{\"title\":\"Defaults $U\"}"
expect_json   A1 "priority defaults MEDIUM" '.priority' MEDIUM
expect_json   A1 "dueDate optional" '.dueDate' null

# case 2: blank title
req POST /tasks '{"title":"   "}'
expect_status A2 "blank title 400" 400
expect_json   A2 "errors.title present" '.errors.title != null' true
req POST /tasks '{"description":"no title"}'
expect_status A2 "missing title 400" 400

# case 3: lengths
T201="$(printf 'x%.0s' $(seq 1 201))"; T200="$(printf 'y%.0s' $(seq 1 200))"
D2001="$(printf 'd%.0s' $(seq 1 2001))"
req POST /tasks "{\"title\":\"$T201\"}"
expect_status A3 "201-char title 400" 400
req POST /tasks "{\"title\":\"$T200\"}"
expect_status A3 "200-char title 201" 201
req DELETE "/tasks/$(jq -r .id <<<"$BODY")"
req POST /tasks "{\"title\":\"Long $U\",\"description\":\"$D2001\"}"
expect_status A3 "2001-char description 400" 400
expect_json   A3 "errors.description present" '.errors.description != null' true

# case 4: invalid enums
req POST /tasks "{\"title\":\"Bad $U\",\"status\":\"FOO\"}"
expect_status A4 "bad status 400" 400
req POST /tasks "{\"title\":\"Bad $U\",\"priority\":\"X\"}"
expect_status A4 "bad priority 400" 400
req GET "/tasks?status=FOO"
expect_status A4 "bad status filter 400" 400
req GET "/tasks?sort=title"
expect_status A4 "bad sort 400" 400

# case 5: update
sleep 1
req PUT "/tasks/$T1" "{\"title\":\"Report v2 $U\",\"priority\":\"LOW\",\"dueDate\":\"$TOMORROW\"}"
expect_status A5 "PUT 200" 200
expect_json   A5 "title updated" '.title' "Report v2 $U"
expect_json   A5 "priority updated" '.priority' LOW
expect_json   A5 "dueDate updated" '.dueDate' "$TOMORROW"
expect_json   A5 "status kept" '.status' TODO
expect_json   A5 "updatedAt changed" ".updatedAt != \"$UPD1\"" true

# case 6: complete, then back to TODO
req POST "/tasks/$T1/complete"
expect_status A6 "complete 200" 200
expect_json   A6 "status DONE" '.status' DONE
expect_json   A6 "completedAt set" '.completedAt != null' true
req PUT "/tasks/$T1" "{\"title\":\"Report v2 $U\",\"status\":\"TODO\"}"
expect_json   A6 "back to TODO" '.status' TODO
expect_json   A6 "completedAt cleared" '.completedAt' null
req PUT "/tasks/$T1" "{\"title\":\"Report v2 $U\",\"status\":\"DONE\"}"
expect_json   A6 "PUT DONE sets completedAt" '.completedAt != null' true

# case 7: archive / restore
req POST /tasks "{\"title\":\"Archive me $U\"}"; TA="$(jq -r .id <<<"$BODY")"
req POST "/tasks/$TA/archive"
expect_status A7 "archive 200" 200
expect_json   A7 "archived true" '.archived' true
req GET "/tasks?q=$U"
expect_json   A7 "excluded from default list" "[.[] | select(.id == $TA)] | length" 0
req GET "/tasks?archived=true"
expect_json   A7 "present with archived=true" "[.[] | select(.id == $TA)] | length" 1
expect_json   A7 "archived list has only archived" '[.[] | select(.archived == false)] | length' 0
req POST "/tasks/$TA/restore"
expect_json   A7 "restore archived false" '.archived' false
req GET "/tasks?q=$U"
expect_json   A7 "back in default list" "[.[] | select(.id == $TA)] | length" 1

# case 8: hard delete
req DELETE "/tasks/$TA"
expect_status A8 "delete 204" 204
req GET "/tasks/$TA"
expect_status A8 "GET deleted 404" 404
req GET "/tasks"
expect_json   A8 "not in default list" "[.[] | select(.id == $TA)] | length" 0
req GET "/tasks?archived=true"
expect_json   A8 "not in archived list" "[.[] | select(.id == $TA)] | length" 0

# case 9: search + filters
S="srch$U"
req POST /tasks "{\"title\":\"Alpha ${S} one\",\"priority\":\"HIGH\"}";  SA="$(jq -r .id <<<"$BODY")"
req POST /tasks "{\"title\":\"beta ${S} two\",\"priority\":\"LOW\",\"status\":\"IN_PROGRESS\"}"; SB="$(jq -r .id <<<"$BODY")"
req POST /tasks "{\"title\":\"gamma ${S} three\",\"priority\":\"HIGH\",\"status\":\"IN_PROGRESS\"}"; SC="$(jq -r .id <<<"$BODY")"
req POST /tasks "{\"title\":\"unrelated $U\",\"priority\":\"HIGH\"}"
QMIX="$(tr '[:lower:]' '[:upper:]' <<<"${S:0:4}")${S:4}"
req GET "/tasks?q=$QMIX"
expect_status A9 "search 200" 200
expect_json   A9 "mixed-case search finds 3" 'length' 3
expect_json   A9 "all results contain term" "[.[] | select(.title | ascii_downcase | contains(\"${S}\") | not)] | length" 0
req GET "/tasks?q=$S&status=IN_PROGRESS"
expect_json   A9 "status filter" 'length' 2
req GET "/tasks?q=$S&status=IN_PROGRESS&priority=HIGH"
expect_json   A9 "status AND priority" 'length' 1
expect_json   A9 "status AND priority -> gamma" '.[0].id' "$SC"
req GET "/tasks?q=$S&priority=LOW"
expect_json   A9 "priority filter" '.[0].id' "$SB"

# case 10: sorting (and due-date filters)
O="ord$U"
req POST /tasks "{\"title\":\"$O nodue\"}";                          ON="$(jq -r .id <<<"$BODY")"
req POST /tasks "{\"title\":\"$O late\",\"dueDate\":\"$IN5\"}";      OL="$(jq -r .id <<<"$BODY")"
req POST /tasks "{\"title\":\"$O early\",\"dueDate\":\"$TOMORROW\"}"; OE="$(jq -r .id <<<"$BODY")"
req GET "/tasks?q=$O&sort=dueDate&dir=asc"
expect_json   A10 "dueDate asc, nulls last" '[.[].id] | map(tostring) | join(",")' "$OE,$OL,$ON"
req GET "/tasks?q=$O&sort=dueDate&dir=desc"
expect_json   A10 "dueDate desc, nulls last" '[.[].id] | map(tostring) | join(",")' "$OL,$OE,$ON"
req GET "/tasks?q=$O&sort=createdAt&dir=desc"
expect_json   A10 "createdAt desc" '[.[].id] | map(tostring) | join(",")' "$OE,$OL,$ON"
req GET "/tasks?q=$O&sort=createdAt&dir=asc"
expect_json   A10 "createdAt asc" '[.[].id] | map(tostring) | join(",")' "$ON,$OL,$OE"
req GET "/tasks?q=$O&dueDate=$TOMORROW"
expect_json   A10 "dueDate equality filter" '[.[].id] | map(tostring) | join(",")' "$OE"
req GET "/tasks?q=$O&dueFrom=$TODAY&dueTo=$TOMORROW"
expect_json   A10 "due range filter" '[.[].id] | map(tostring) | join(",")' "$OE"
req GET "/tasks?q=$O&dueFrom=$IN5&dueTo=$TODAY"
expect_status A10 "inverted range 400" 400

# case 11: overdue
req POST /tasks "{\"title\":\"Late $U\",\"dueDate\":\"$YESTERDAY\"}"; OV="$(jq -r .id <<<"$BODY")"
expect_json   A11 "yesterday TODO overdue" '.overdue' true
req POST /tasks "{\"title\":\"Today $U\",\"dueDate\":\"$TODAY\"}"
expect_json   A11 "due today not overdue" '.overdue' false
req POST /tasks "{\"title\":\"LateDone $U\",\"dueDate\":\"$YESTERDAY\",\"status\":\"DONE\"}"
expect_json   A11 "yesterday DONE not overdue" '.overdue' false
req POST "/tasks/$OV/archive"
expect_json   A11 "archived not overdue" '.overdue' false
req GET "/tasks?q=Report"
expect_json   A11 "no-due task not overdue" "[.[] | select(.overdue == true and .dueDate == null)] | length" 0

# case 12: unknown id
req GET /tasks/999999999
expect_status A12 "GET unknown 404" 404
expect_json   A12 "ProblemDetail status" '.status' 404
req PUT /tasks/999999999 '{"title":"x"}'
expect_status A12 "PUT unknown 404" 404
req DELETE /tasks/999999999
expect_status A12 "DELETE unknown 404" 404
req POST /tasks/999999999/complete
expect_status A12 "complete unknown 404" 404

summary
