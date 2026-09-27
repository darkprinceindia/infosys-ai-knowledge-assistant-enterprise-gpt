# API incident runbook
Owner: Platform Engineering
Effective date: 2026-01-01
Classification: Engineering

## Triage
Check the service health dashboard, error rate, latency, and most recent deployment. Correlate the first error with deployment and infrastructure events. Create an incident record before changing production configuration.

## Rollback
If errors began after a deployment and a safe rollback exists, the on-call engineer may roll back after notifying the incident commander. Verify health checks, error rate, and client traffic before declaring recovery.

## Escalation
Escalate to the database owner when connection exhaustion or query latency is observed. Escalate to security when suspicious access or data exposure is suspected. Record all actions in the incident timeline.
