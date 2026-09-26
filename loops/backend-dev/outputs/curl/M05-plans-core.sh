#!/usr/bin/env bash
# M05 Plans core: create/read/update/delete, derived status, progress, rest time, validation, list order.
source "$(dirname "$0")/_lib.sh"
U="$(uniq)"
P=/plans

# sources
req POST /tasks "{\"title\":\"Plan task $U\",\"priority\":\"MEDIUM\"}"; T="$(jq -r .id <<<"$BODY")"
req POST /habits "{\"name\":\"Plan habit $U\",\"frequency\":\"DAILY\"}"; H="$(jq -r .id <<<"$BODY")"
req POST /learning-cards "{\"title\":\"Plan card $U\"}"; L="$(jq -r .id <<<"$BODY")"
ITEMS="[{\"sourceType\":\"TASK\",\"sourceId\":$T},{\"sourceType\":\"HABIT\",\"sourceId\":$H},{\"sourceType\":\"LEARNING_RESOURCE\",\"sourceId\":$L}]"
TASK_ITEM="[{\"sourceType\":\"TASK\",\"sourceId\":$T}]"
plan() {  # TITLE START END PRIORITY ITEMS
  echo "{\"title\":\"$1\",\"estimatedDuration\":60,\"startDateTime\":\"$2\",\"endDateTime\":\"$3\",\"priorityOrder\":$4,\"items\":$5}"
}

# case 1: IN_PROGRESS plan with 3 items
req POST $P "$(plan "Now $U" "$(iso_in '-10 min')" "$(iso_in '+50 min')" 2 "$ITEMS")"
expect_status A1 "create plan 201" 201
expect_header A1 "Location header" Location "/api/v1/plans/"
expect_json   A1 "status IN_PROGRESS" '.status' IN_PROGRESS
expect_json   A1 "totalItems 3" '.totalItems' 3
expect_json   A1 "doneItems 0" '.doneItems' 0
expect_json   A1 "progress 0" '.progressPercent' 0
expect_json   A1 "remainingSeconds 2900–3000" '.remainingSeconds >= 2900 and .remainingSeconds <= 3000' true
expect_json   A1 "startsInSeconds null" '.startsInSeconds' null
expect_json   A1 "task sourceTitle" '.items[0].sourceTitle' "Plan task $U"
expect_json   A1 "task sourceStatus" '.items[0].sourceStatus' TODO
expect_json   A1 "habit sourceTitle" '.items[1].sourceTitle' "Plan habit $U"
expect_json   A1 "habit sourceStatus" '.items[1].sourceStatus' PENDING
expect_json   A1 "card sourceTitle" '.items[2].sourceTitle' "Plan card $U"
expect_json   A1 "card sourceStatus" '.items[2].sourceStatus' NOT_STARTED
expect_json   A1 "items not done" '[.items[].done] | any' false
P1="$(jq -r .id <<<"$BODY")"
req GET "$P/$P1"
expect_status A1 "GET plan 200" 200
expect_json   A1 "GET status IN_PROGRESS" '.status' IN_PROGRESS

# case 2: NOT_STARTED
req POST $P "$(plan "Later $U" "$(iso_in '+1 hour')" "$(iso_in '+2 hour')" 1 "$TASK_ITEM")"
expect_status A2 "create future plan 201" 201
expect_json   A2 "status NOT_STARTED" '.status' NOT_STARTED
expect_json   A2 "remainingSeconds null" '.remainingSeconds' null
expect_json   A2 "startsInSeconds > 0" '.startsInSeconds > 0' true
P2="$(jq -r .id <<<"$BODY")"

# case 3: COMPLETED by time
req POST $P "$(plan "Past $U" "$(iso_in '-2 hour')" "$(iso_in '-1 hour')" 1 "$TASK_ITEM")"
expect_status A3 "create past plan 201" 201
expect_json   A3 "status COMPLETED" '.status' COMPLETED
expect_json   A3 "remainingSeconds null" '.remainingSeconds' null
expect_json   A3 "startsInSeconds null" '.startsInSeconds' null
P3="$(jq -r .id <<<"$BODY")"

S="$(iso_in '-10 min')"; E="$(iso_in '+50 min')"
# case 4: items rules
req POST $P "$(plan "Empty $U" "$S" "$E" 1 "[]")"
expect_status A4 "empty items 400" 400
expect_json   A4 "errors.items present" '.errors.items != null' true
req POST $P "$(plan "Missing $U" "$S" "$E" 1 '[{"sourceType":"TASK","sourceId":999999999}]')"
expect_status A4 "unknown source 400" 400
expect_json   A4 "errors.items present" '.errors.items != null' true
req POST $P "$(plan "Dup $U" "$S" "$E" 1 "[{\"sourceType\":\"TASK\",\"sourceId\":$T},{\"sourceType\":\"TASK\",\"sourceId\":$T}]")"
expect_status A4 "duplicate source 400" 400
expect_json   A4 "errors.items present" '.errors.items != null' true
req POST $P "$(plan "NoId $U" "$S" "$E" 1 '[{"sourceType":"TASK"}]')"
expect_status A4 "item without sourceId 400" 400

# case 5: window
req POST $P "$(plan "Window $U" "$E" "$S" 1 "$TASK_ITEM")"
expect_status A5 "end before start 400" 400
expect_json   A5 "errors.endDateTime present" '.errors.endDateTime != null' true
req POST $P "$(plan "Equal $U" "$S" "$S" 1 "$TASK_ITEM")"
expect_status A5 "end == start 400" 400
expect_json   A5 "errors.endDateTime present" '.errors.endDateTime != null' true

# case 6: field validation
req POST $P "{\"title\":\"Dur $U\",\"estimatedDuration\":0,\"startDateTime\":\"$S\",\"endDateTime\":\"$E\",\"priorityOrder\":1,\"items\":$TASK_ITEM}"
expect_status A6 "estimatedDuration 0 → 400" 400
expect_json   A6 "errors.estimatedDuration present" '.errors.estimatedDuration != null' true
req POST $P "{\"title\":\"Prio $U\",\"estimatedDuration\":30,\"startDateTime\":\"$S\",\"endDateTime\":\"$E\",\"priorityOrder\":0,\"items\":$TASK_ITEM}"
expect_status A6 "priorityOrder 0 → 400" 400
expect_json   A6 "errors.priorityOrder present" '.errors.priorityOrder != null' true
req POST $P "$(plan "Type $U" "$S" "$E" 1 '[{"sourceType":"BOOK","sourceId":1}]')"
expect_status A6 "bad sourceType 400" 400
req POST $P "{\"title\":\"  \",\"estimatedDuration\":30,\"startDateTime\":\"$S\",\"endDateTime\":\"$E\",\"priorityOrder\":1,\"items\":$TASK_ITEM}"
expect_status A6 "blank title 400" 400
req POST $P "{\"title\":\"NoStart $U\",\"estimatedDuration\":30,\"endDateTime\":\"$E\",\"priorityOrder\":1,\"items\":$TASK_ITEM}"
expect_status A6 "missing start 400" 400
req GET "$P?status=BOGUS"
expect_status A6 "bad status filter 400" 400

# case 7: list order (our plans only): IN_PROGRESS (prio 1, then 2) → NOT_STARTED → COMPLETED
req POST $P "$(plan "Now top $U" "$(iso_in '-5 min')" "$(iso_in '+30 min')" 1 "$TASK_ITEM")"
P4="$(jq -r .id <<<"$BODY")"
req GET $P
expect_status A7 "list 200" 200
expect_json   A7 "group + priority order" "[.[] | select(.id == $P1 or .id == $P2 or .id == $P3 or .id == $P4) | .id] | map(tostring) | join(\",\")" "$P4,$P1,$P2,$P3"
req GET "$P?status=NOT_STARTED"
expect_json   A7 "status filter" '[.[].status] | unique | join(",")' NOT_STARTED
expect_json   A7 "filter includes P2" "[.[] | select(.id == $P2)] | length" 1

# case 8: PUT recomputes status, keeps done flags for kept items
req PUT "$P/$P2" "$(plan "Later renamed $U" "$(iso_in '-1 min')" "$(iso_in '+1 hour')" 3 "$ITEMS")"
expect_status A8 "PUT 200" 200
expect_json   A8 "title updated" '.title' "Later renamed $U"
expect_json   A8 "priority updated" '.priorityOrder' 3
expect_json   A8 "status recomputed IN_PROGRESS" '.status' IN_PROGRESS
expect_json   A8 "items replaced (3)" '.totalItems' 3
expect_json   A8 "remainingSeconds set" '.remainingSeconds > 0' true
req PUT "$P/$P2" "$(plan "Later renamed $U" "$(iso_in '-3 hour')" "$(iso_in '-2 hour')" 3 "$TASK_ITEM")"
expect_json   A8 "window in past → COMPLETED" '.status' COMPLETED
expect_json   A8 "items shrunk (1)" '.totalItems' 1
req PUT "$P/$P2" "$(plan "x" "$E" "$S" 3 "$TASK_ITEM")"
expect_status A8 "PUT bad window 400" 400
req PUT "$P/999999999" "$(plan "x" "$S" "$E" 1 "$TASK_ITEM")"
expect_status A8 "PUT unknown 404" 404

# case 9: delete plan, sources untouched
req DELETE "$P/$P1"
expect_status A9 "DELETE 204" 204
req GET "$P/$P1"
expect_status A9 "GET deleted 404" 404
req GET "/tasks/$T"
expect_status A9 "source task still exists" 200
req GET "/habits/$H"
expect_status A9 "source habit still exists" 200
req DELETE "$P/$P1"
expect_status A9 "DELETE again 404" 404

# case 10: serverTime
req GET "$P/$P3"
ST="$(jq -r .serverTime <<<"$BODY")"
DIFF=$(( $(date -u +%s) - $(date -u -d "$ST" +%s) )); DIFF=${DIFF#-}
if (( DIFF <= 5 )); then _pass A10 "serverTime within 5 s ($ST)"; else _fail A10 "serverTime within 5 s" "off by ${DIFF}s"; fi

summary
