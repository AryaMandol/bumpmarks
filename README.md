# BumpMarks

BumpMarks is a small, privacy-first Progressive Web App for recording baby movements.

> Record movements when you can. Catch up when you can't.

BumpMarks is intentionally focused. It is a logging utility, not a pregnancy platform, medical device, diagnostic tool, or fetal wellbeing assessment system.

## Features

- One-tap live movement recording
- Catch-up entries for movements remembered later
- Approximate timing for catch-up entries
- Undo, edit, and delete entry controls
- Visual tally marks
- Configurable tracking window
- Optional daily target
- Optional daily notes
- History with daily detail
- User and doctor analytics views
- Local charts for recorded totals, live vs catch-up entries, and live-entry time-of-day distribution
- CSV export
- Full JSON backup and restore
- PWA installation and offline support
- Local-only data storage
- No account required
- No advertising
- No third-party tracking analytics
- No AI

## Privacy

BumpMarks stores movement records, notes, preferences, and settings in the browser's local storage.

Flask is used for local development. The recommended production deployment is a static site, so there is no BumpMarks application server receiving movement data.

Analytics inside BumpMarks are calculated locally from the user's own stored records. BumpMarks does not include third-party analytics or advertising SDKs.

Browser security headers additionally restrict access to camera, microphone, geolocation, payment, and USB capabilities.

Users can export their records, create a local backup, restore a backup, or delete all locally stored BumpMarks data.

## Analytics

The Analytics screen contains two presentation modes.

### User view

Designed for simple personal review with:

- 7-day, 14-day, 30-day, all-data, and custom date ranges
- Recorded totals by logged day
- Live vs catch-up entry chart
- Live entries by time-of-day chart
- All, live-only, and catch-up-only entry filters where applicable
- Summary counts for logged days and recorded entries

### Doctor view

Uses the same selected date range and adds a compact factual table containing:

- Date
- Recorded total
- Live count
- Catch-up count
- Live recording span
- Daily note

Doctor View can be printed from the browser.

Analytics are descriptive only. Missing days are not treated as zero movements, catch-up entries do not receive invented occurrence timestamps, and the app does not classify any pattern as normal or abnormal.

## Development

### Requirements

- Python 3.11 or newer
- A modern browser

### Install dependencies

```bash
python -m pip install -r requirements.txt
```

On Windows, the included helper can also be used:

```cmd
setup.cmd
```

### Run tests

```bash
python -m pytest -v
```

Or on Windows:

```cmd
test.cmd
```

### Run locally

```bash
python app.py
```

Then open:

```text
http://127.0.0.1:5000
```

The root URL is the public landing page. The tracker itself is available at:

```text
http://127.0.0.1:5000/app
```

`localhost` and `127.0.0.1` are treated as secure development origins by modern browsers, which allows local PWA testing.

## Visual identity

BumpMarks uses a restrained cobalt-blue accent with cool neutral surfaces.

The public landing page and the tracker share the same color system so the product feels continuous when moving from the website into the installed app.

The landing page includes a small interactive counter demo and a real product screenshot rather than a fabricated dashboard mockup.

## Data model

The current V1 stores data under the browser local-storage key:

```text
bumpmarks.v1
```

Existing V1 releases preserve this storage key for backward compatibility.

A day's data can contain:

- Movement entries
- Entry type: live or catch-up
- Recorded timestamp
- Approximate catch-up timing
- Optional daily note

Application settings are stored alongside the day records.

## Backup and restore

BumpMarks can create a JSON backup containing the complete local application state.

Restore validates the backup structure before replacing local data.

CSV export is intended for readable review in spreadsheet software and includes protection against spreadsheet formula injection from user-entered text.

## PWA behavior

BumpMarks includes:

- Web app manifest
- Standard and maskable icons
- Apple touch icon
- Offline app-shell caching
- Offline navigation fallback
- Service-worker update detection
- Install guidance for supported browsers
- Mobile safe-area handling

## Reminders

BumpMarks V1 does not provide background scheduled reminders.

Reliable notification behavior differs across browsers, mobile operating systems, and installed-PWA states. BumpMarks does not present an unreliable browser timer as a dependable reminder feature.

## Accessibility

The interface includes:

- Keyboard-visible focus states
- Skip-to-content navigation
- Modal focus trapping and focus restoration
- Reduced-motion support
- Screen-reader status announcements
- Accessible active-navigation states
- Larger touch targets
- Accessible progress information

## Security

Local Flask development and the production static-site configuration apply equivalent security headers including:

- Content Security Policy
- Referrer Policy
- X-Content-Type-Options
- X-Frame-Options
- Permissions Policy
- Cross-Origin-Opener-Policy

The service worker is served with `no-cache` semantics so browsers can detect new versions.

## Medical disclaimer

BumpMarks is a recording and visualization tool only.

It does not assess fetal wellbeing, diagnose medical conditions, determine whether a movement pattern is normal or abnormal, provide emergency guidance, or replace instructions from a qualified healthcare professional.

Users should follow the movement-counting method and medical guidance provided by their own healthcare professional.

## Production build

Build the static production bundle with:

```bash
python build_static.py
```

The output is written to `dist/`. Run the complete release verification with:

```bash
python verify_release.py
```

## Deployment

BumpMarks includes a Render Blueprint for free static-site deployment. On Windows, after pushing the repository, run:

```cmd
deploy_render.cmd
```

This opens Render with the current GitHub repository preselected. See `DEPLOYMENT.md` for production routes, custom-domain guidance, and the release flow.

## Open source

BumpMarks is released under the MIT License. See `LICENSE`, `CONTRIBUTING.md`, `SECURITY.md`, and `ASSETS.md`.

The first public release is version `1.0.0`.
