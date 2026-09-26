#!/usr/bin/env bash
# M06 Plan items: mark done/not done, BR-13 side effects, auto COMPLETED, history, cascade on source delete.
source "$(dirname "$0")/_lib.sh"
U="$(uniq)"
P=/plans

# sources
req POST /tasks "{\"title\":\"Item task $U\",\"priority\":\"MEDIUM\"}"; T="$(jq -r .id <<<"$BODY")"
req POST /habits "{\"name\":\"Item habit $U\",\"frequency\":\"DAILY\"}"; H="$(jq -r .id <<<"$BODY")"
req POST /learning-cards "{\"title\":\"Item card $U\"}"; L="$(jq -r .id <<<"$BODY")"
req POST /habits "{\"name\":\"Pre-done habit $U\",\"frequency\":\"DAILY\"}"; H2="$(jq -r .id <<<"$BODY")"
req POST "/habits/$H2/completions" '{}'
req POST /habits "{\"name\":\"Doomed habit $U\",\"frequency\":\"DAILY\"}"; H3="$(jq -r .id <<<"$BODY")"
plan() {  # TITLE START END ITEMS
  echo "{\"title\":\"$1\",\"estimatedDuration\":60,\"startDateTime\":\"$2\",\"endDateTime\":\"$3\",\"priorityOrder\":1,\"items\":$4}"
}
item_id() { jq -r --arg t "$1" --argjson s "$2" '.items[] | select(.sourceType == $t and .sourceId == $s) | .id' <<<"$BODY"; }
S="$(iso_in '-10 min')"; E="$(iso_in '+50 min')"

req POST $P "$(plan "Items $U" "$S" "$E" "[{\"sourceType\":\"TASK\",\"sourceId\":$T},{\"sourceType\":\"HABIT\",\"sourceId\":$H},{\"sourceType\":\"LEARNING_RESOURCE\",\"sourceId\":$L}]")"
P1="$(jq -r .id <<<"$BODY")"
IT="$(item_id TASK "$T")"; IH="$(item_id HABIT "$H")"; IL="$(item_id LEARNING_RESOURCE "$L")"
expect_json A1 "plan starts IN_PROGRESS" '.status' IN_PROGRESS

# case 1 + 2: mark the task item done
req PATCH "$P/$P1/items/$IT" '{"done":true}'
expect_status A1 "PATCH item 200" 200
expect_json   A1 "doneItems 1" '.doneItems' 1
expect_json   A1 "progress 33" '.progressPercent' 33
expect_json   A1 "still IN_PROGRESS" '.status' IN_PROGRESS
expect_json   A1 "item done" ".items[] | select(.id == $IT) | .done" true
expect_json   A2 "item sourceStatus DONE" ".items[] | select(.id == $IT) | .sourceStatus" DONE
req GET "/tasks/$T"
expect_json   A2 "task status DONE" '.status' DONE
expect_json   A2 "task completedAt set" '.completedAt != null' true

# case 3: habit item → today's completion; already completed today → still 200
req PATCH "$P/$P1/items/$IH" '{"done":true}'
expect_status A3 "PATCH habit item 200" 200
expect_json   A3 "doneItems 2" '.doneItems' 2
req GET "/habits/$H"
expect_json   A3 "habit doneToday" '.doneToday' true
req POST $P "$(plan "PreDone $U" "$S" "$E" "[{\"sourceType\":\"HABIT\",\"sourceId\":$H2},{\"sourceType\":\"TASK\",\"sourceId\":$T}]")"
PX="$(jq -r .id <<<"$BODY")"; IX="$(item_id HABIT "$H2")"
req PATCH "$P/$PX/items/$IX" '{"done":true}'
expect_status A3 "habit already done today → 200 (no 409)" 200
req GET "/habits/$H2/completions"
expect_json   A3 "still one completion" 'length' 1

# case 4: learning item → card unchanged
req GET "/learning-cards/$L"; CARD_STATUS="$(jq -r .status <<<"$BODY")"
req PATCH "$P/$P1/items/$IL" '{"done":true}'
expect_status A4 "PATCH learning item 200" 200
expect_json   A4 "doneItems 3" '.doneItems' 3
req GET "/learning-cards/$L"
expect_json   A4 "card status unchanged" '.status' "$CARD_STATUS"

# case 5: un-mark the task item → progress drops, task stays DONE
req PATCH "$P/$P1/items/$IT" '{"done":false}'
expect_status A5 "un-mark 200" 200
expect_json   A5 "item not done" ".items[] | select(.id == $IT) | .done" false
expect_json   A5 "doneItems 2" '.doneItems' 2
expect_json   A5 "progress 67" '.progressPercent' 67
expect_json   A5 "back to IN_PROGRESS" '.status' IN_PROGRESS
req GET "/tasks/$T"
expect_json   A5 "task stays DONE" '.status' DONE

# case 6: all items done → COMPLETED before end
req PATCH "$P/$P1/items/$IT" '{"done":true}'
expect_status A6 "re-mark 200" 200
expect_json   A6 "status COMPLETED" '.status' COMPLETED
expect_json   A6 "progress 100" '.progressPercent' 100
expect_json   A6 "remainingSeconds null" '.remainingSeconds' null
req GET "$P/$P1"
expect_json   A6 "GET status COMPLETED" '.status' COMPLETED

# case 7: history
req POST $P "$(plan "OldA $U" "$(iso_in '-5 hour')" "$(iso_in '-4 hour')" "[{\"sourceType\":\"TASK\",\"sourceId\":$T}]")"; PA="$(jq -r .id <<<"$BODY")"
req POST $P "$(plan "OldB $U" "$(iso_in '-3 hour')" "$(iso_in '-2 hour')" "[{\"sourceType\":\"TASK\",\"sourceId\":$T}]")"; PB="$(jq -r .id <<<"$BODY")"
req GET "$P/history"
expect_status A7 "GET history 200" 200
expect_json   A7 "P1 in history with 100%" ".[] | select(.id == $P1) | .progressPercent" 100
expect_json   A7 "only COMPLETED" '[.[].status] | all(. == "COMPLETED")' true
expect_json   A7 "sorted by end desc" '[.[].endDateTime] as $e | $e == ($e | sort | reverse)' true
expect_json   A7 "P1 before OldB before OldA" "[.[].id] as \$i | (\$i | index($P1)) < (\$i | index($PB)) and (\$i | index($PB)) < (\$i | index($PA))" true
expect_json   A7 "IN_PROGRESS plan not in history" "[.[].id] | index($PX)" null

# case 8: delete a source habit → its item is gone, plan remains
req POST $P "$(plan "Cascade $U" "$S" "$E" "[{\"sourceType\":\"HABIT\",\"sourceId\":$H3},{\"sourceType\":\"LEARNING_RESOURCE\",\"sourceId\":$L}]")"
PC="$(jq -r .id <<<"$BODY")"
expect_json   A8 "totalItems 2 before" '.totalItems' 2
req DELETE "/habits/$H3"
expect_status A8 "delete habit 204" 204
req GET "$P/$PC"
expect_status A8 "plan still exists" 200
expect_json   A8 "totalItems 1 after" '.totalItems' 1
expect_json   A8 "habit item gone" "[.items[] | select(.sourceType == \"HABIT\")] | length" 0
req POST /tasks "{\"title\":\"Doomed task $U\"}"; T2="$(jq -r .id <<<"$BODY")"
req POST $P "$(plan "Cascade2 $U" "$S" "$E" "[{\"sourceType\":\"TASK\",\"sourceId\":$T2}]")"; PD="$(jq -r .id <<<"$BODY")"
req DELETE "/tasks/$T2"
expect_status A8 "delete task 204" 204
req GET "$P/$PD"
expect_status A8 "emptied plan still exists" 200
expect_json   A8 "emptied plan totalItems 0" '.totalItems' 0
expect_json   A8 "empty plan not COMPLETED by items" '.status' IN_PROGRESS
req DELETE "/learning-cards/$L"
expect_status A8 "delete card 204" 204
req GET "$P/$PC"
expect_json   A8 "card item gone" '.totalItems' 0

# case 9: errors
req PATCH "$P/$P1/items/999999999" '{"done":true}'
expect_status A9 "unknown item 404" 404
req PATCH "$P/999999999/items/$IT" '{"done":true}'
expect_status A9 "unknown plan 404" 404
req PATCH "$P/$PX/items/$IT" '{"done":true}'
expect_status A9 "item of another plan 404" 404
req PATCH "$P/$P1/items/$IT" '{}'
expect_status A9 "missing done 400" 400
expect_json   A9 "errors.done present" '.errors.done != null' true
req PATCH "$P/$P1/items/$IT" '{"done":"maybe"}'
expect_status A9 "bad done value 400" 400

summary
