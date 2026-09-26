#!/usr/bin/env bash
# M08 Hardening: Swagger contract audit, bad input never yields 500, list endpoints < 500 ms.
source "$(dirname "$0")/_lib.sh"
U="$(uniq)"

# problem CODE: status matches and the body is a ProblemDetail carrying the same status
expect_problem() {  # ID DESC CODE
  expect_status "$1" "$2" "$3"
  expect_json   "$1" "$2: ProblemDetail body" "(.status|tostring) + \"|\" + (.title != null | tostring)" "$STATUS|true"
}

# seed one of each so nested paths resolve
req POST /tasks "{\"title\":\"M08 task $U\"}";            TASK_ID="$(jq -r .id <<<"$BODY")"
req POST /habits "{\"name\":\"M08 habit $U\",\"frequency\":\"DAILY\"}"; HABIT_ID="$(jq -r .id <<<"$BODY")"
req POST /learning-cards "{\"title\":\"M08 card $U\"}";    CARD_ID="$(jq -r .id <<<"$BODY")"
req POST "/learning-cards/$CARD_ID/milestones" '{"title":"m1"}'; MS_ID="$(jq -r '.milestones[0].id' <<<"$BODY")"
req POST /plans "{\"title\":\"M08 plan $U\",\"estimatedDuration\":30,\"startDateTime\":\"$(iso_in '+1 hour')\",\"endDateTime\":\"$(iso_in '+2 hours')\",\"priorityOrder\":1,\"items\":[{\"sourceType\":\"TASK\",\"sourceId\":$TASK_ID}]}"
PLAN_ID="$(jq -r .id <<<"$BODY")"; ITEM_ID="$(jq -r '.items[0].id' <<<"$BODY")"
for v in TASK_ID HABIT_ID CARD_ID MS_ID PLAN_ID ITEM_ID; do
  [[ "${!v}" =~ ^[0-9]+$ ]] || { echo "FAIL setup: $v='${!v}'"; exit 1; }
done

# case 1: OpenAPI contract audit (A1)
req GET "$ROOT_URL/v3/api-docs"
expect_status A1 "api-docs 200" 200
DOC="$BODY"
audit() {  # ID DESC JQ (must yield the list of offending "METHOD path" strings)
  local bad; bad="$(jq -r "$3" <<<"$DOC")"
  if [[ -z "$bad" ]]; then _pass "$1" "$2"; else _fail "$1" "$2" "offenders: $(tr '\n' ' ' <<<"$bad")"; fi
}
OPS='.paths | to_entries[] | .key as $p | .value | to_entries[] | {m: (.key|ascii_upcase), p: $p, o: .value}'
audit A1 "every operation has a summary"        "$OPS | select((.o.summary // \"\") == \"\") | \"\(.m) \(.p)\""
audit A1 "every operation has a tag"            "$OPS | select((.o.tags // []) | length == 0) | \"\(.m) \(.p)\""
audit A1 "every request body has a schema"      "$OPS | select(.o.requestBody and (.o.requestBody.content[\"application/json\"].schema == null)) | \"\(.m) \(.p)\""
audit A1 "every operation declares a 2xx"       "$OPS | select([.o.responses | keys[] | select(startswith(\"2\"))] | length == 0) | \"\(.m) \(.p)\""
audit A1 "non-void 2xx responses are application/json" "$OPS | .m as \$m | .p as \$p | .o.responses | to_entries[] | select((.key|startswith(\"2\")) and .value.content and (.value.content[\"application/json\"] == null)) | \"\(\$m) \(\$p) \(.key)\""
audit A1 "every 4xx response is a ProblemDetail" "$OPS | .m as \$m | .p as \$p | .o.responses | to_entries[] | select((.key|startswith(\"4\")) and (.value.content[\"application/problem+json\"].schema[\"\$ref\"] != \"#/components/schemas/ProblemDetail\")) | \"\(\$m) \(\$p) \(.key)\""
audit A1 "every write operation documents 400"  "$OPS | select((.m == \"POST\" or .m == \"PUT\" or .m == \"PATCH\") and .o.requestBody and (.o.responses[\"400\"] == null)) | \"\(.m) \(.p)\""
audit A1 "every {id} operation documents 404"   "$OPS | select((.p | test(\"\\\\{\")) and (.o.responses[\"404\"] == null)) | \"\(.m) \(.p)\""

# case 2: malformed / wrong-shaped bodies on every write endpoint (A2)
WRITES=(
  "POST /tasks" "PUT /tasks/$TASK_ID"
  "POST /habits" "PUT /habits/$HABIT_ID" "POST /habits/$HABIT_ID/completions"
  "POST /learning-cards" "PUT /learning-cards/$CARD_ID"
  "POST /learning-cards/$CARD_ID/milestones" "PUT /learning-cards/$CARD_ID/milestones/$MS_ID"
  "POST /learning-cards/$CARD_ID/notes"
  "POST /plans" "PUT /plans/$PLAN_ID" "PATCH /plans/$PLAN_ID/items/$ITEM_ID"
  "PUT /settings"
)
for w in "${WRITES[@]}"; do
  read -r M P <<<"$w"
  req "$M" "$P" '{"title": "x",'
  expect_problem A2 "$w truncated JSON → 400" 400
  req "$M" "$P" 'not json at all'
  expect_problem A2 "$w garbage → 400" 400
  req "$M" "$P" '[1,2]'
  expect_problem A2 "$w array body → 400" 400
  req "$M" "$P" "" --data '{"x":1}' -H 'Content-Type: text/plain'   # empty 3rd arg: _lib adds no JSON header
  expect_problem A2 "$w text/plain → 415" 415
done
# missing body where one is required (habit completion body is optional)
for w in "POST /tasks" "PUT /tasks/$TASK_ID" "POST /habits" "POST /learning-cards" "POST /plans" "PATCH /plans/$PLAN_ID/items/$ITEM_ID" "PUT /settings"; do
  read -r M P <<<"$w"
  req "$M" "$P" "" -H 'Content-Type: application/json'
  expect_problem A2 "$w empty body → 400" 400
done
# wrong JSON types
req POST /plans "{\"title\":\"t\",\"estimatedDuration\":\"abc\",\"startDateTime\":\"$(iso_in '+1 hour')\",\"endDateTime\":\"$(iso_in '+2 hours')\",\"priorityOrder\":1,\"items\":[{\"sourceType\":\"TASK\",\"sourceId\":$TASK_ID}]}"
expect_problem A2 "plan estimatedDuration string → 400" 400
req POST /plans "{\"title\":\"t\",\"estimatedDuration\":30,\"startDateTime\":\"yesterday\",\"endDateTime\":\"$(iso_in '+2 hours')\",\"priorityOrder\":1,\"items\":[{\"sourceType\":\"TASK\",\"sourceId\":$TASK_ID}]}"
expect_problem A2 "plan bad instant → 400" 400
req POST /plans "{\"title\":\"t\",\"estimatedDuration\":30,\"startDateTime\":\"$(iso_in '+1 hour')\",\"endDateTime\":\"$(iso_in '+2 hours')\",\"priorityOrder\":1,\"items\":[{\"sourceType\":\"TASK\",\"sourceId\":\"x\"}]}"
expect_problem A2 "plan item sourceId string → 400" 400
req POST /plans "{\"title\":\"t\",\"estimatedDuration\":30,\"startDateTime\":\"$(iso_in '+1 hour')\",\"endDateTime\":\"$(iso_in '+2 hours')\",\"priorityOrder\":1,\"items\":[null]}"
expect_problem A2 "plan null item → 400" 400
req POST /plans "{\"title\":\"t\",\"estimatedDuration\":30,\"startDateTime\":\"$(iso_in '+1 hour')\",\"endDateTime\":\"$(iso_in '+2 hours')\",\"priorityOrder\":1,\"items\":{}}"
expect_problem A2 "plan items object → 400" 400
req POST /plans "{\"title\":\"t\",\"estimatedDuration\":99999999999,\"startDateTime\":\"$(iso_in '+1 hour')\",\"endDateTime\":\"$(iso_in '+2 hours')\",\"priorityOrder\":1,\"items\":[{\"sourceType\":\"TASK\",\"sourceId\":$TASK_ID}]}"
expect_problem A2 "plan int overflow → 400" 400
req PATCH "/plans/$PLAN_ID/items/$ITEM_ID" '{"done":"maybe"}'
expect_problem A2 "item done non-boolean → 400" 400
req POST /tasks '{"title":"t","dueDate":"2026-02-30"}'
expect_problem A2 "task impossible date → 400" 400
req POST /tasks '{"title":["a"]}'
expect_problem A2 "task title array → 400" 400
req POST "/habits/$HABIT_ID/completions" '{"date":"2026-13-45"}'
expect_problem A2 "completion bad date → 400" 400
req PUT /settings '{"displayName":"X","notificationsEnabled":"yes please"}'
expect_problem A2 "settings flag non-boolean → 400" 400

# case 3: non-numeric / out-of-range ids and bad path values (A3)
for r in tasks habits plans learning-cards; do
  req GET "/$r/abc";                  expect_problem A3 "GET /$r/abc → 400" 400
  req PUT "/$r/abc" '{}';             expect_problem A3 "PUT /$r/abc → 400" 400
  req DELETE "/$r/abc";               expect_problem A3 "DELETE /$r/abc → 400" 400
  req GET "/$r/99999999999999999999"; expect_problem A3 "GET /$r/<overflow> → 400" 400
  req GET "/$r/999999999";            expect_problem A3 "GET /$r/<missing> → 404" 404
done
req POST /tasks/abc/complete;                        expect_problem A3 "POST /tasks/abc/complete → 400" 400
req POST /habits/abc/activate;                       expect_problem A3 "POST /habits/abc/activate → 400" 400
req GET  /habits/abc/completions;                    expect_problem A3 "GET /habits/abc/completions → 400" 400
req DELETE "/habits/$HABIT_ID/completions/notadate"; expect_problem A3 "DELETE completion bad date → 400" 400
req PATCH "/plans/$PLAN_ID/items/xyz" '{"done":true}'; expect_problem A3 "PATCH item xyz → 400" 400
req POST "/learning-cards/$CARD_ID/milestones/abc/complete"; expect_problem A3 "complete milestone abc → 400" 400
req DELETE "/learning-cards/$CARD_ID/notes/abc";     expect_problem A3 "DELETE note abc → 400" 400
req GET /no-such-route;                              expect_problem A3 "unknown route → 404" 404
req PATCH /tasks;                                    expect_problem A3 "wrong method → 405" 405

# case 4: unknown enum values, in bodies and query params (A4)
req POST /tasks '{"title":"t","status":"NOPE"}';         expect_problem A4 "task status NOPE → 400" 400
req POST /tasks '{"title":"t","priority":"URGENT"}';     expect_problem A4 "task priority URGENT → 400" 400
req POST /tasks '{"title":"t","priority":"high"}';       expect_problem A4 "task priority lowercase → 400" 400
req POST /habits '{"name":"h","frequency":"HOURLY"}';    expect_problem A4 "habit frequency HOURLY → 400" 400
req PUT "/learning-cards/$CARD_ID" '{"title":"c","status":"PAUSED"}'; expect_problem A4 "learning status PAUSED → 400" 400
req POST /plans "{\"title\":\"t\",\"estimatedDuration\":30,\"startDateTime\":\"$(iso_in '+1 hour')\",\"endDateTime\":\"$(iso_in '+2 hours')\",\"priorityOrder\":1,\"items\":[{\"sourceType\":\"NOTE\",\"sourceId\":1}]}"
expect_problem A4 "plan sourceType NOTE → 400" 400
req PUT /settings '{"displayName":"X","defaultView":"CALENDAR"}'; expect_problem A4 "settings defaultView CALENDAR → 400" 400
req GET "/tasks?status=NOPE";     expect_problem A4 "GET /tasks?status=NOPE → 400" 400
req GET "/tasks?priority=NOPE";   expect_problem A4 "GET /tasks?priority=NOPE → 400" 400
req GET "/tasks?sort=title";      expect_problem A4 "GET /tasks?sort=title → 400" 400
req GET "/tasks?dir=up";          expect_problem A4 "GET /tasks?dir=up → 400" 400
req GET "/tasks?dueDate=soon";    expect_problem A4 "GET /tasks?dueDate=soon → 400" 400
req GET "/tasks?archived=maybe";  expect_problem A4 "GET /tasks?archived=maybe → 400" 400
req GET "/habits?active=maybe";   expect_problem A4 "GET /habits?active=maybe → 400" 400
req GET "/plans?status=NOPE";     expect_problem A4 "GET /plans?status=NOPE → 400" 400

# nothing above created stray data or broke the seeded rows
req GET "/tasks/$TASK_ID";  expect_json A4 "seeded task intact" '.title' "M08 task $U"
req GET "/plans/$PLAN_ID";  expect_json A4 "seeded plan intact" '.items | length' 1

# case 5: list endpoints respond < 500 ms (A5), best of 3 to ignore a cold JIT
for path in /tasks /habits /learning-cards /plans /plans/history /dashboard /settings; do
  best=""
  for _ in 1 2 3; do
    t="$(curl -s -o /dev/null -w '%{time_total}' "$BASE_URL$path")"
    [[ -z "$best" ]] || awk -v a="$t" -v b="$best" 'BEGIN{exit !(a<b)}' && best="$t"
  done
  if awk -v t="$best" 'BEGIN{exit !(t<0.5)}'; then _pass A5 "GET $path ${best}s < 0.5s"; else _fail A5 "GET $path" "took ${best}s"; fi
done

# cleanup
req DELETE "/plans/$PLAN_ID"; req DELETE "/tasks/$TASK_ID"; req DELETE "/habits/$HABIT_ID"; req DELETE "/learning-cards/$CARD_ID"

summary
