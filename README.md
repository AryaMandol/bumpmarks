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

This development copy is intended to run from:

```text
D:\Arya\Dev\bumpmarks
```

## First-Time Setup

Open Windows CMD:

```cmd
cd /d D:\Arya\Dev\bumpmarks
setup.cmd
```

## Run Automated Tests

```cmd
cd /d D:\Arya\Dev\bumpmarks
test.cmd
```

Expected result:

```text
3 passed
```

## Run the Application

```cmd
cd /d D:\Arya\Dev\bumpmarks
python app.py
```

Then open:

```text
http://127.0.0.1:5000
```

## Current Features

- Daily movement counter
- One-tap movement logging
- Visual tally marks
- Catch-up entries
- Undo
- Local browser storage
- Recent entry list
- 12 PM to 12 AM tracking window
- Basic offline PWA support

## Privacy

Movement information is stored using browser local storage.

The current application does not send movement records to the Flask server.

## Medical Disclaimer

BumpMarks is a recording tool only.

It does not assess fetal wellbeing, diagnose medical conditions, determine whether a movement pattern is normal or abnormal, or replace guidance from a qualified healthcare professional.
