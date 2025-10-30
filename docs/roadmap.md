# Integration Roadmap 

This roadmap highlights integrations and governance items required to scale Gloomy beyond the initial v1.0.0 release.

## Identity and Access

- **SSO for admins**: Integrate Google Workspace / GitHub Enterprise providers via Firebase Auth. Enforce organisation allow-listing and MFA.
- **Service-to-service access**: Evaluate workload identity federation to replace long-lived JSON keys in CI.

## Observability & Logging

- **Centralised logging**: Ship Cloud Functions, Next.js API, and Cloudflare logs to BigQuery with retention policies for compliance.
- **Audit trails**: Extend `logs` collection to capture admin actions, QuickDrop creation, and token consumption with immutable append-only semantics.
- **Alerting**: Configure uptime checks and error-rate thresholds in Cloud Monitoring; route incidents to on-call channel.

## Security Enhancements

- **Content scanning**: Deploy an AV scanning service (e.g., Cloud Run + ClamAV) that approves QuickDrop uploads before tokens activate.
- **Data loss prevention**: Optionally integrate Cloud DLP for sensitive file detection in admin uploads.
- **Secret management**: Transition environment secrets to Google Secret Manager and load via runtime fetch.

## Enterprise Features

- **Admin console improvements**: Add bulk upload, metadata import/export, and activity dashboards.
- **Audit exports**: Provide scheduled reports (CSV/JSON) for compliance teams.
- **Integration hooks**: Webhooks or Pub/Sub topics for downstream systems (ticketing, analytics).
