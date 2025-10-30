# Security and Threat Model

## Scope

This document focuses particularly on the QuickDrop workflow that allows anonymous uploads and single-use download links. Catalogue downloads share several mitigations (signed URLs, client-side password hashing) but rely on authenticated admins for uploads.

## Assets

- **Catalogue binaries**: Protected releases stored in Cloud Storage.
- **QuickDrop uploads**: Temporary files up to 25 MB stored in a dedicated bucket path.
- **Download tokens**: Short-lived Firestore documents that map to signed URLs.
- **Admin credentials**: Firebase Authentication accounts with elevated privileges.

## Threats & Mitigations

| Threat | Description | Mitigation |
| --- | --- | --- |
| Abuse of anonymous upload API | Attackers spam `/quickdrop` to exhaust storage or deliver malware. | Cloudflare managed rules + server-side per-IP rate limiting; bucket lifecycle rules purge expired files; upload size capped at 25 MB; add ClamAV or commercial malware scanning via Cloud Functions before link activation. |
| Malware distribution via shared link | Uploaded content used to spread malicious payloads. | Introduce asynchronous scanning pipeline; quarantine file until scanner marks clean; display “scan in progress” UX. |
| Token brute force | Attackers guess QuickDrop tokens before intended recipient downloads. | 32-byte random token encoded as base64url (~43 chars, >= 256 bits) stored in Firestore; tokens expire after 60 seconds or first access; rate limiting on token lookup endpoint. |
| Replay of download URL | Download URL reused after first access. | Firestore document deletion on first successful download; signed URLs with 1-minute expiry; Storage rules prevent direct listing. |
| Insider misuse | Admin leaks catalogue or raises size limits. | Role-based access, audit logging in Firestore `logs` collection; branch protection on infrastructure configs; periodic review of IAM roles. |
| Credential theft | Compromise of service account used by GitHub Actions. | Rotate service-account keys quarterly; restrict GitHub secret access; monitor IAM for anomalies. |

## Operational Controls

- **Monitoring**: Export Cloud Functions logs, Cloudflare analytics, and Firebase Auth events to BigQuery or Cloud Logging. Define alerts for spikes in QuickDrop uploads or failures in malware scanning.
- **Incident Response**: Playbook should cover revoking a malicious QuickDrop link, quarantining files, and purging tokens.
- **Configuration Hardening**: enforce HTTPS-only origins, HSTS via Cloudflare, and strict CORS on API routes.

## Future Enhancements

- Automatic quarantine queue backed by Pub/Sub + Cloud Functions scanning service.
- User-visible transparency: display scan timestamps and origin IP to admins for investigation.
- Consider optional authenticated QuickDrop for trusted partners to raise file-size limits safely.
