# M01 scenarios
## S1 [smoke] Persistent navigation opens every page
Proves: PRD §4, UX Main Navigation, DoD "six pages reachable"
| Step | Action | Expected |
|---|---|---|
| 1 | navigate {app_url}/ | redirected to /dashboard; h1 "Dashboard"; app-nav with 6 links visible |
| 2 | click nav-tasks | URL /tasks; h1 "Tasks"; nav still visible |
| 3 | click nav-habits | URL /habits; h1 "Habits"; nav still visible |
| 4 | click nav-learning | URL /learning; h1 "Learning Resources"; nav still visible |
| 5 | click nav-plans | URL /plans; h1 "Todo Plans"; nav still visible |
| 6 | click nav-settings | URL /settings; h1 "Settings"; nav still visible |
| 7 | click nav-dashboard | URL /dashboard; h1 "Dashboard" |
| 8 | navigate {app_url}/does-not-exist | redirected to /dashboard; h1 "Dashboard" |
### Results
| Trial | S1.1 | S1.2 | S1.3 | S1.4 | S1.5 | S1.6 | S1.7 | S1.8 | Console | 5xx | Screenshot |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ none | ✅ none | evidence/M01/trial-1/M01-trial-1-final.png |
