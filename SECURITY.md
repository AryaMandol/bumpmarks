# Security policy

## Supported versions

Security fixes are applied to the latest published BumpMarks release.

## Reporting a vulnerability

Please do not open a public issue for a vulnerability that could expose or
destroy user data.

Use GitHub's private vulnerability reporting feature for this repository when
available. If private reporting is not enabled, contact the repository owner
through the private contact method listed on the repository profile.

Please include:

- The affected version or commit.
- Reproduction steps.
- Expected and observed behavior.
- The potential impact.
- Any suggested mitigation, if known.

## Security model

BumpMarks V1 stores movement records in browser local storage and does not
send those records to a BumpMarks backend. The production site is static.

Users should understand that browser-local data can still be lost if browser
site data is cleared or the device is lost. BumpMarks therefore includes
manual backup and restore functionality.
