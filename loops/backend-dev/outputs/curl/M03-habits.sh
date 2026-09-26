#!/usr/bin/env bash
# M03 Habits: CRUD, validation, completions (409 dup, future 400), streak, progress, activate, cascade delete.
source "$(dirname "$0")/_lib.sh"
U="$(uniq)"

# case 1: create daily + weekly
req POST /habits "{\"name\":\"Daily $U\",\"description\":\"d\",\"frequency\":\"DAILY\"}"
expect_status A1 "create daily 201" 201
expect_json   A1 "frequency DAILY" '.frequency' DAILY
expect_json   A1 "active true" '.active' true
expect_json   A1 "doneToday false initially" '.doneToday' false
expect_header A1 "Location header" Location "/api/v1/habits/"
D="$(jq -r .id <<<"$BODY")"
req POST /habits "{\"name\":\"Weekly $U\",\"frequency\":\"WEEKLY\"}"
expect_status A1 "create weekly 201" 201
expect_json   A1 "frequency WEEKLY" '.frequency' WEEKLY
W="$(jq -r .id <<<"$BODY")"

# case 2: validation
req POST /habits '{"name":"   ","frequency":"DAILY"}'
expect_status A2 "blank name 400" 400
expect_json   A2 "errors.name present" '.errors.name != null' true
LONG="$(printf 'x%.0s' $(seq 1 151))"
req POST /habits "{\"name\":\"$LONG\",\"frequency\":\"DAILY\"}"
expect_status A2 "151-char name 400" 400
req POST /habits "{\"name\":\"Bad $U\",\"frequency\":\"MONTHLY\"}"
expect_status A2 "bad frequency 400" 400
req POST /habits "{\"name\":\"NoFreq $U\"}"
expect_status A2 "missing frequency 400" 400

# case 3: complete today (no body)
req POST "/habits/$D/completions"
expect_status A3 "complete today 201" 201
TODAY="$(jq -r .date <<<"$BODY")"
YESTERDAY="$(date -d "$TODAY -1 day" +%F)"
TOMORROW="$(date -d "$TODAY +1 day" +%F)"
req GET "/habits/$D"
expect_json   A3 "doneToday true" '.doneToday' true
expect_json   A3 "doneThisPeriod true" '.doneThisPeriod' true
expect_json   A3 "streak >= 1" '.currentStreak >= 1' true
expect_json   A3 "lastCompletedDate today" '.lastCompletedDate' "$TODAY"

# case 4: duplicate
req POST "/habits/$D/completions" "{\"date\":\"$TODAY\"}"
expect_status A4 "duplicate completion 409" 409
expect_json   A4 "problem status 409" '.status' 409

# case 5: future / past
req POST "/habits/$D/completions" "{\"date\":\"$TOMORROW\"}"
expect_status A5 "future date 400" 400
expect_json   A5 "errors.date present" '.errors.date != null' true
req POST "/habits/$D/completions" "{\"date\":\"$YESTERDAY\"}"
expect_status A5 "yesterday 201" 201
req GET "/habits/$D"
expect_json   A5 "streak 2" '.currentStreak' 2

# case 6: progress for daily with 2 completions in last 7 days (not today/yesterday)
req POST /habits "{\"name\":\"Progress $U\",\"frequency\":\"DAILY\"}"
P="$(jq -r .id <<<"$BODY")"
req POST "/habits/$P/completions" "{\"date\":\"$(date -d "$TODAY -2 day" +%F)\"}"
req POST "/habits/$P/completions" "{\"date\":\"$(date -d "$TODAY -5 day" +%F)\"}"
req POST "/habits/$P/completions" "{\"date\":\"$(date -d "$TODAY -9 day" +%F)\"}"
req GET "/habits/$P"
expect_json   A6 "progressPercent 29" '.progressPercent' 29
expect_json   A6 "streak 0 (gap)" '.currentStreak' 0
req GET "/habits/$P/completions"
expect_status A6 "list completions 200" 200
expect_json   A6 "3 completions" 'length' 3

# weekly period done after one completion this week
req POST "/habits/$W/completions"
req GET "/habits/$W"
expect_json   A3 "weekly doneThisPeriod" '.doneThisPeriod' true
expect_json   A3 "weekly streak 1" '.currentStreak' 1
expect_json   A6 "weekly progress 25" '.progressPercent' 25

# case 7: un-complete today
req DELETE "/habits/$D/completions/today"
expect_status A7 "uncomplete today 204" 204
req GET "/habits/$D"
expect_json   A7 "doneToday false" '.doneToday' false
expect_json   A7 "streak still 1 (yesterday)" '.currentStreak' 1
req DELETE "/habits/$D/completions/today"
expect_status A7 "uncomplete again 404" 404
req DELETE "/habits/$D/completions/$YESTERDAY"
expect_status A7 "remove dated completion 204" 204
req DELETE "/habits/$D/completions/not-a-date"
expect_status A7 "bad date path 400" 400

# case 8: deactivate / activate / update
req POST "/habits/$D/deactivate"
expect_status A8 "deactivate 200" 200
expect_json   A8 "active false" '.active' false
req GET "/habits?active=false"
expect_json   A8 "listed as inactive" "[.[] | select(.id == $D)] | length" 1
req GET "/habits?active=true"
expect_json   A8 "not listed as active" "[.[] | select(.id == $D)] | length" 0
req POST "/habits/$D/activate"
expect_json   A8 "active true" '.active' true
req PUT "/habits/$D" "{\"name\":\"Renamed $U\",\"frequency\":\"WEEKLY\"}"
expect_status A8 "update 200" 200
expect_json   A8 "name updated" '.name' "Renamed $U"
expect_json   A8 "frequency updated" '.frequency' WEEKLY
req PUT "/habits/$D" '{"name":"","frequency":"DAILY"}'
expect_status A8 "update blank name 400" 400

# case 9: delete cascades
req DELETE "/habits/$P"
expect_status A9 "delete 204" 204
req GET "/habits/$P"
expect_status A9 "get deleted 404" 404
req GET "/habits/$P/completions"
expect_status A9 "completions of deleted 404" 404
req DELETE "/habits/$P"
expect_status A9 "delete again 404" 404
req GET "/habits/999999999"
expect_status A9 "unknown habit 404" 404

summary
