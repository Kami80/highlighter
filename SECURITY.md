# Security policy

Markflow 2.0 is a local-first browser extension without a hosted backend.

## Scope

Security-sensitive functionality includes webpage content-script isolation, sanitizing rich notes, extension permissions, IndexedDB storage, data backup and restore, and cross-tab updates.

## Reports

For a possible vulnerability, prefer the repository's **Security → Report a vulnerability** flow, if enabled. Do not include private browsing history, personal annotations, authentication cookies, or secret tokens in an issue. If private reporting is unavailable, use a private communication channel with the repository maintainer instead of posting exploit details publicly.

## Support

The current development branch targets Chrome Manifest V3 (minimum Chrome 120). The maintainer should review security fixes and publish patched releases as necessary. No specific support end date is guaranteed.
