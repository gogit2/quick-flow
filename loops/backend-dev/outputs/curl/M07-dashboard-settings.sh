#!/usr/bin/env bash
# M07 Dashboard and settings: settings CRUD/validation, greeting, task/habit/plan/learning widgets.
# Checks are relative (the regression DB holds data from earlier suites).
source "$(dirname "$0")/_lib.sh"
U="$(uniq)"
TODAY="$(date +%F)"; YESTERDAY="$(date -d yesterday +%F)"

# case 1: settings (D-51)
req GET /settings
expect_status A1 "GET settings 200" 200
expect_json   A1 "settings shape" '[has("displayName"), has("notificationsEnabled"), has("browserNotifications"), has("defaultView")] | all' true
req PUT /settings "{\"displayName\":\"Tester $U\",\"defaultView\":\"TASKS\"}"
expect_status A1 "PUT settings 200" 200
expect_json   A1 "PUT returns displayName" '.displayName' "Tester $U"
req GET /settings
expect_json   A1 "displayName persisted" '.displayName' "Tester $U"
expect_json   A1 "defaultView persisted" '.defaultView' TASKS
LONG="$(printf 'x%.0s' $(seq 1 101))"
req PUT /settings "{\"displayName\":\"$LONG\"}"
expect_status A1 "displayName 101 chars → 400" 400
expect_json   A1 "error on displayName" '.errors.displayName != null' true
req PUT /settings '{"displayName":"X","defaultView":"NOPE"}'
expect_status A1 "bad defaultView → 400" 400
req PUT /settings '{"displayName":"  "}'
expect_status A1 "blank displayName → 400" 400
req GET /settings
expect_json   A1 "rejected PUTs changed nothing" '.displayName' "Tester $U"

# case 2: greeting (D-52)
req GET /dashboard
expect_status A2 "GET dashboard 200" 200
expect_json   A2 "greeting starts with Good" '.greeting | startswith("Good ")' true
expect_json   A2 "greeting contains displayName" ".greeting | endswith(\", Tester $U\")" true
expect_json   A2 "today is local date" '.today' "$TODAY"
expect_json   A2 "serverTime present" '.serverTime != null' true

# case 3: due today / overdue
req POST /tasks "{\"title\":\"Dash today $U\",\"dueDate\":\"$TODAY\"}"; TT="$(jq -r .id <<<"$BODY")"
req POST /tasks "{\"title\":\"Dash late $U\",\"dueDate\":\"$YESTERDAY\"}"; TL="$(jq -r .id <<<"$BODY")"
req POST /tasks "{\"title\":\"Dash archived $U\",\"dueDate\":\"$TODAY\"}"; TA="$(jq -r .id <<<"$BODY")"
req POST "/tasks/$TA/archive"
req GET /dashboard
expect_json   A3 "due-today task in dueToday" "$(printf '[.tasks.dueToday[] | select(.id == %s)] | length' "$TT")" 1
expect_json   A3 "overdue task in overdue" "$(printf '[.tasks.overdue[] | select(.id == %s)] | length' "$TL")" 1
expect_json   A3 "overdue flag set" "$(printf '.tasks.overdue[] | select(.id == %s) | .overdue' "$TL")" true
expect_json   A3 "due-today not in overdue" "$(printf '[.tasks.overdue[] | select(.id == %s)] | length' "$TT")" 0
expect_json   A3 "archived task hidden" "$(printf '[.tasks.dueToday[] | select(.id == %s)] | length' "$TA")" 0

# case 4: completed today + completion % (D-15)
req POST "/tasks/$TT/complete"
expect_status A4 "complete task 200" 200
req GET /dashboard; DASH="$BODY"
expect_json   A4 "completed task in completedToday" "$(printf '[.tasks.completedToday[] | select(.id == %s)] | length' "$TT")" 1
expect_json   A4 "completionPercent = round(done/total*100)" \
  '.tasks.completionPercent == (if .tasks.totalActive == 0 then 0 else ((.tasks.doneCount * 100 / .tasks.totalActive) + 0.5 | floor) end)' true
req GET /tasks; TASKS="$BODY"
BODY="$DASH"
expect_json   A4 "totalActive matches GET /tasks" '.tasks.totalActive' "$(jq 'length' <<<"$TASKS")"
expect_json   A4 "doneCount matches GET /tasks" '.tasks.doneCount' "$(jq '[.[] | select(.status == "DONE")] | length' <<<"$TASKS")"

# case 5: today's habits (D-24)
req POST /habits "{\"name\":\"Dash habit $U\",\"frequency\":\"DAILY\"}"; H="$(jq -r .id <<<"$BODY")"
req GET /dashboard
expect_json   A5 "new daily habit in habits.today" "$(printf '[.habits.today[] | select(.id == %s)] | length' "$H")" 1
expect_json   A5 "doneToday false" "$(printf '.habits.today[] | select(.id == %s) | .doneToday' "$H")" false
BEFORE="$(jq -r .habits.completedTodayCount <<<"$BODY")"
req POST "/habits/$H/completions" '{}'
expect_status A5 "complete habit 201" 201
req GET /dashboard
expect_json   A5 "doneToday true" "$(printf '.habits.today[] | select(.id == %s) | .doneToday' "$H")" true
expect_json   A5 "completedTodayCount +1" '.habits.completedTodayCount' "$((BEFORE + 1))"
expect_json   A5 "currentStreak 1" "$(printf '.habits.today[] | select(.id == %s) | .currentStreak' "$H")" 1
req POST /habits "{\"name\":\"Dash weekly $U\",\"frequency\":\"WEEKLY\"}"; HW="$(jq -r .id <<<"$BODY")"
req POST "/habits/$HW/completions" '{}'
req GET /dashboard
expect_json   A5 "weekly done this week hidden" "$(printf '[.habits.today[] | select(.id == %s)] | length' "$HW")" 0
req POST "/habits/$H/deactivate"
req GET /dashboard
expect_json   A5 "deactivated habit absent" "$(printf '[.habits.today[] | select(.id == %s)] | length' "$H")" 0

# case 6: active plan, live progress (FR-08)
req POST /tasks "{\"title\":\"Dash plan task $U\"}"; PT="$(jq -r .id <<<"$BODY")"
req POST /learning-cards "{\"title\":\"Dash plan card $U\"}"; PL="$(jq -r .id <<<"$BODY")"
req POST /plans "{\"title\":\"Dash plan $U\",\"estimatedDuration\":60,\"startDateTime\":\"$(iso_in '-10 min')\",\"endDateTime\":\"$(iso_in '+50 min')\",\"priorityOrder\":1,\"items\":[{\"sourceType\":\"TASK\",\"sourceId\":$PT},{\"sourceType\":\"LEARNING_RESOURCE\",\"sourceId\":$PL}]}"
expect_status A6 "create plan 201" 201
P="$(jq -r .id <<<"$BODY")"; IT="$(jq -r '.items[0].id' <<<"$BODY")"
req POST /plans "{\"title\":\"Dash later $U\",\"estimatedDuration\":30,\"startDateTime\":\"$(iso_in '+1 min')\",\"endDateTime\":\"$(iso_in '+31 min')\",\"priorityOrder\":1,\"items\":[{\"sourceType\":\"TASK\",\"sourceId\":$PT}]}"
PU="$(jq -r .id <<<"$BODY")"
req GET /dashboard
expect_json   A6 "plan in plans.active" "$(printf '[.plans.active[] | select(.id == %s)] | length' "$P")" 1
expect_json   A6 "remainingSeconds > 0" "$(printf '.plans.active[] | select(.id == %s) | .remainingSeconds > 0' "$P")" true
expect_json   A6 "progress 0" "$(printf '.plans.active[] | select(.id == %s) | .progressPercent' "$P")" 0
expect_json   A6 "activeCount = active length" '.plans.activeCount == (.plans.active | length)' true
expect_json   A6 "future plan in upcoming" "$(printf '[.plans.upcoming[] | select(.id == %s)] | length' "$PU")" 1
expect_json   A6 "upcoming max 5, all NOT_STARTED" '(.plans.upcoming | length) <= 5 and all(.plans.upcoming[]; .status == "NOT_STARTED")' true
req PATCH "/plans/$P/items/$IT" '{"done":true}'
expect_status A6 "PATCH item 200" 200
req GET /dashboard
expect_json   A6 "dashboard progress 50 immediately" "$(printf '.plans.active[] | select(.id == %s) | .progressPercent' "$P")" 50

# case 7: learning snapshot (D-30)
req POST /learning-cards "{\"title\":\"Dash card $U\"}"; C="$(jq -r .id <<<"$BODY")"
req POST "/learning-cards/$C/milestones" '{"title":"Step 1"}'
M1="$(jq -r '.milestones[0].id' <<<"$BODY")"
req POST "/learning-cards/$C/milestones" '{"title":"Step 2"}'
req GET /dashboard
BEFORE="$(jq -r .learning.milestonesCompletedLast7Days <<<"$BODY")"
req POST "/learning-cards/$C/milestones/$M1/complete"
expect_status A7 "complete milestone 200" 200
req GET /dashboard; DASH="$BODY"
expect_json   A7 "milestonesCompletedLast7Days +1" '.learning.milestonesCompletedLast7Days' "$((BEFORE + 1))"
expect_json   A7 "card in inProgress with 50%" "$(printf '.learning.inProgress[] | select(.id == %s) | .progressPercent' "$C")" 50
req GET /learning-cards; CARDS="$BODY"
BODY="$DASH"
for S in NOT_STARTED IN_PROGRESS COMPLETED; do
  expect_json A7 "byStatus.$S matches GET /learning-cards" ".learning.byStatus.$S" \
    "$(jq --arg s "$S" '[.[] | select(.status == $s)] | length' <<<"$CARDS")"
done

# leave the defaults for later suites / the UI
req PUT /settings '{"displayName":"Friend","notificationsEnabled":true,"browserNotifications":false,"defaultView":"DASHBOARD"}'
expect_status A1 "restore defaults 200" 200
req GET /settings
expect_json   A1 "defaults restored" '[.displayName, .notificationsEnabled, .browserNotifications, .defaultView] | join(",")' "Friend,true,false,DASHBOARD"

summary
