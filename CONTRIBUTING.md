# Contributing to BumpMarks

Thanks for helping improve BumpMarks.

## Product boundaries

BumpMarks is intentionally a small movement-recording utility. Contributions
should preserve these boundaries:

- Keep movement data local by default.
- Do not require an account for core use.
- Do not add advertising or third-party behavioral analytics.
- Do not add AI health interpretation, fetal wellbeing scoring, or automated
  normal/abnormal classifications.
- Do not fabricate exact occurrence times for catch-up entries.
- Keep medical guidance user-entered or clearly sourced outside the app.
- Prefer simple, accessible interactions over feature density.

## Development

Install dependencies:

```bash
python -m pip install -r requirements.txt
```

Run the Flask development app:

```bash
python app.py
```

Run tests and release checks:

```bash
python -m pytest -v
python verify_release.py
```

Build the static production bundle:

```bash
python build_static.py
```

## Pull requests

A pull request should:

- Explain the user problem being solved.
- Keep the patch focused.
- Include or update automated tests.
- Preserve existing local-storage compatibility unless a migration is part of
  the change.
- Update README or release notes when behavior changes.
- Pass the repository CI checks.

## Accessibility

New UI should remain keyboard usable, preserve visible focus states, maintain
sensible touch targets, and avoid relying on color alone to communicate state.

## Medical safety

BumpMarks is not a diagnostic tool. Do not add clinical claims, emergency
thresholds, risk scores, or treatment recommendations without a separately
reviewed product and regulatory decision.
