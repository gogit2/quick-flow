# M07 scenarios
Fresh DB. `{ts}` = a unique suffix per run.

## S1 [smoke] Defaults, change the display name, persist
Proves: UX Settings Page, D-51, A-10
| Step | Action | Expected |
|---|---|---|
| 1 | navigate {app_url}/settings | h1 "Settings"; settings-display-name "Friend"; settings-notifications on; settings-browser-notifications off; settings-default-view "Dashboard" |
| 2 | set settings-display-name "Sam {ts}"; click settings-save | settings-saved "Saved"; snackbar "Settings saved"; `PUT /settings` 200 |
| 3 | reload /settings | display name "Sam {ts}" |

## S2 Default view at app start
Proves: D-51
| Step | Action | Expected |
|---|---|---|
| 1 | settings-default-view → Tasks; save | saved |
| 2 | navigate {app_url}/ (full page load) | URL /tasks; h1 "Tasks" |
| 3 | /settings: default view → Dashboard; save; navigate {app_url}/ | URL /dashboard |

## S3 Validation
Proves: A-10, AC "required fields are validated"
| Step | Action | Expected |
|---|---|---|
| 1 | clear settings-display-name; click settings-save | settings-display-name-error "Display name is required"; no PUT sent |
| 2 | type 101 × "a"; save | error "at most 100 characters"; no PUT |
| 3 | reload | display name still "Sam {ts}" |

## S4 Browser notifications permission
Proves: D-46 (browser notification only with permission), UX Settings
| Step | Action | Expected |
|---|---|---|
| 1 | toggle settings-browser-notifications on | permission is requested; when it is not granted (headless Chromium denies it) → settings-browser-denied hint and the toggle switches back off |

## S5 In-app reminders off silences the start notification
Proves: D-46 honours `notificationsEnabled` (M07-T03)
| Step | Action | Expected |
|---|---|---|
| 1 | toggle settings-notifications off; save | saved |
| 2 | setup (API): a task; in the UI build a plan starting at the next whole minute | card Not started |
| 3 | wait until the start has passed (+5 s) | no "has started" snackbar; plan In progress; `qf.notifiedPlans` contains the id (marked, not shown) |
| 4 | turn in-app reminders back on; save | saved |

### Results
| Trial | S1.1 | S1.2 | S1.3 | S2.1 | S2.2 | S2.3 | S3.1 | S3.2 | S3.3 | S4.1 | S5.1 | S5.2 | S5.3 | S5.4 | M01 S1 | M02 S1 | M03 S1 | M04 S1 | M05 S1 | M06 S1 | Console | 5xx | Screenshot |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ (task via API) | ✅ | ✅ | ✅ 7/7 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ none | ✅ none | evidence/M07/trial-1/M07-trial-1-final.png |
