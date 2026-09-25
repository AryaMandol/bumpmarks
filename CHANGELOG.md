# Changelog

All notable changes to BumpMarks are documented here.

## [1.0.0] - 2026-09-24

### Added

- One-tap live baby movement recording.
- Visual tally groups.
- Catch-up entries with approximate timing.
- Undo, edit, and delete controls.
- Daily notes and history.
- Configurable tracking window and optional daily target.
- User-entered doctor instructions.
- User and Doctor analytics views.
- CSV export and JSON backup/restore.
- Delete-all-data controls.
- PWA installation, offline shell, update handling, and mobile hardening.
- Accessibility and storage-resilience improvements.
- Public landing page and shared cobalt visual identity.
- Local-first lifestyle imagery on the landing page.
- Static production build and Render deployment configuration.
- GitHub Actions CI and automated release workflow.

### Privacy and safety

- No account required.
- No advertising.
- No third-party behavioral analytics.
- No cloud storage requirement.
- No AI health interpretation.
- No diagnostic or normal/abnormal fetal movement classification.


## BM-008B - production offline and mobile navigation fix

- Precaches canonical static application documents instead of relying on Render rewrite aliases.
- Seeds `/app` and `/app/` cache aliases for installed-PWA launches.
- Activates updated service workers immediately and claims open clients.
- Registers the worker immediately with root scope and `updateViaCache: none`.
- Replaces text-glyph bottom-navigation icons with consistently sized SVG icons.
- Makes tracking-window labels deterministic (`12 PM`, `12 AM`) and clarifies the closed state.

### BM-008C production hotfix

- Refresh app HTML and code assets from the network when available, while preserving offline fallback.
- Revision app CSS/JavaScript URLs to prevent stale installed-PWA assets.
- Add explicit offline-state messaging while preserving local actions.
- Normalize five-tab mobile navigation geometry and small-screen layouts.
- Replace the placeholder product screenshot with a real application capture.


### Deployment reliability

- Render deployment synchronization now triggers on every `main` commit.
- Static builds are stamped with the exact source Git revision.
- Added `build-info.json` for deployment identity checks.
- Production verification now rejects stale Render deployments.

### Website policy and payment-readiness

- Added Cashfree-ready public policy pages for privacy, terms, refund/cancellation and contact.
- Added visible legal/support links to the landing page and app Settings.
- Added offline caching and Render routes for the policy pages.
- Production verification now checks that all four public policy pages are live.
