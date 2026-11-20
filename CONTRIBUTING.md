# Contributing to Markflow

Thanks for helping improve this free, local-first extension.

## Start here

1. Search existing GitHub issues before opening a new one.
2. Describe the issue, Chrome version, the type of page involved, and steps to reproduce. **Never paste private highlights or personal notes.**
3. Fork the repository and make a focused branch. Keep Manifest V3, offline-only operation, IndexedDB schema compatibility and the no-HTML-export requirement.
4. Run the syntax, storage-contract, and browser UI tests in `README.md` before opening a pull request.
5. Attach sanitized screenshots if the change affects appearance. Do not include real browsing histories or IndexedDB files.

## Privacy and release rules

Do not add telemetry, remote code, accounts, third-party analytics, or cloud sync without an explicit project decision. All third-party code must be vendored locally and compatible with MV3 and the project license. For data schema changes, provide a migration and tests. Never commit `.env`, Chrome profiles, private backup JSON, API tokens or signing keys.

## Reporting security issues

Please avoid posting a working exploit or private data in a public issue. Use GitHub's private vulnerability reporting / security advisory feature where enabled, or contact the repository maintainer through a private channel before disclosure.
