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

### BM-003 - Complete in this version

- Today / History navigation
- History ordered by date
- Daily totals
- Live vs catch-up breakdown
- First-to-last recorded time summary
- Day-detail sheet
- Full day entry timeline
- Optional daily notes
- Notes editable for today and historical days
- Auto-save notes locally
- Existing BM-001/BM-002 local data remains compatible

## Privacy

Movement information and notes are stored using browser local storage.

The current application does not send movement records or notes to the Flask server.

## Medical Disclaimer

BumpMarks is a recording tool only.

It does not assess fetal wellbeing, diagnose medical conditions, determine whether a movement pattern is normal or abnormal, or replace guidance from a qualified healthcare professional.
