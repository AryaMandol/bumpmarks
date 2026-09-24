# BumpMarks

BumpMarks is a small, privacy-first baby movement logging PWA.

> Record movements when you can. Catch up when you can't.

## Principles

- No account required
- No advertising
- No AI
- No analytics
- No cloud requirement
- Movement data stays on the user's device
- Works offline
- Open source
- Not a diagnostic or medical decision-making tool

## Project Location

```text
D:\Arya\Dev\bumpmarks
```

## Setup

First-time dependency setup:

```cmd
cd /d D:\Arya\Dev\bumpmarks
setup.cmd
```

## Tests

```cmd
cd /d D:\Arya\Dev\bumpmarks
test.cmd
```

## Run

```cmd
cd /d D:\Arya\Dev\bumpmarks
python app.py
```

Open:

```text
http://127.0.0.1:5000
```

## Current Milestones

### BM-001 - Complete

- Flask/PWA bootstrap
- Live movement logging
- Tally display
- Local browser storage
- Basic catch-up
- Undo
- Offline shell

### BM-002 - Complete

- Proper catch-up bottom sheet
- Catch-up count stepper
- Approximate timing choices
- Edit catch-up entries
- Delete entries with confirmation
- Existing BM-001 data compatibility

### BM-003 - Complete

- Today / History navigation
- History ordered by date
- Daily totals
- Live vs catch-up breakdown
- Day-detail sheet
- Full day entry timeline
- Optional daily notes
- Local auto-save notes

### BM-004 - Complete in this version

- Settings tab
- Configurable tracking start and end time
- Supports tracking windows that cross midnight
- Optional daily movement target
- Target progress on Today screen
- Haptic feedback on/off
- Local doctor-instructions note
- Doctor instructions displayed on Today when configured
- Validation for settings
- Existing BM-001/BM-002/BM-003 local data remains compatible

## Privacy

Movement information, notes, and settings are stored using browser local storage.

The current application does not send movement records, notes, or settings to the Flask server.

## Medical Disclaimer

BumpMarks is a recording tool only.

It does not assess fetal wellbeing, diagnose medical conditions, determine whether a movement pattern is normal or abnormal, or replace guidance from a qualified healthcare professional.


### BM-005 - Complete in this version

- Export tab
- CSV export for a selected date range
- CSV includes entry type, count, recorded timestamp, approximate catch-up timing, and daily note
- CSV formula-injection protection for user-entered text
- Full JSON backup of movement history, notes, and settings
- Strict local validation before restore
- Restore confirmation before replacing current local data
- Delete-all-data confirmation
- Delete all movement history, notes, and settings from browser local storage
- No export, backup, or restore file is uploaded to the Flask server


### BM-006 - Complete in this version

- Hardened PWA manifest with app id, scope, portrait orientation, categories, and maskable icon
- Apple touch icon and iOS PWA metadata
- Install button for browsers that expose the PWA install prompt
- iPhone/iPad Add to Home Screen guidance
- Installed-app detection
- Service-worker update detection with user-controlled refresh
- Offline navigation fallback
- Cache cleanup between app versions
- Mobile safe-area and very-small-screen layout hardening
- Honest V1 reminder policy: no unreliable browser-only scheduled reminders
- Background reminder delivery deferred until a reliable cross-platform approach is chosen

## Reminder Decision

BumpMarks V1 does not schedule background reminders.

Browser-only timers and notifications are not reliable enough across Android, iOS, browser, and installed-PWA states for a movement-tracking utility. The app will not claim to provide a reminder unless it can do so predictably.
