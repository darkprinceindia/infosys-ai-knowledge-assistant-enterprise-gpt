# API reference

All API endpoints use JSON. Authenticated routes rely on an `HttpOnly`, `SameSite=Lax` session cookie. Cross-origin POST requests are rejected.

| Method | Route | Access | Purpose |
| --- | --- | --- | --- |
| POST | `/api/login` | Public | Email and password; sets session cookie. |
| POST | `/api/logout` | Public | Clears session cookie. |
| GET | `/api/me` | Public | Current user or `null`. |
| GET | `/api/documents` | Authenticated | List documents visible to the user. |
| GET | `/api/documents/{id}` | Authenticated | Full permitted document for preview. |
| POST | `/api/documents/upload` | Admin | Upload and index a base64-encoded file with metadata. |
| POST | `/api/documents/archive` | Admin | Remove a document from active retrieval. |
| POST | `/api/query` | Authenticated | Classify, route, retrieve, synthesize, and return citations. |
| POST | `/api/feedback` | Query owner/admin | Submit a 1–5 rating and optional issue/comment. |
| GET | `/api/connectors` | Authenticated | List configured MCP tool metadata. |
| GET | `/api/analytics` | Admin | Usage, quality, document, and connector aggregates. |

Example query request:

```json
{"question":"How do I escalate a P1 delivery incident?","department":"All"}
```

Example response fields: `id`, `answer`, `citations` (document ID, title, section, passage, effective date, owner, classification, ranking score), `route`, `department`, `confidence`, `no_answer`, and `latency_ms`.

Failures use `{"error":"..."}` with HTTP 400 for invalid input, 401 for incorrect credentials, 403 for missing authorization, and 404 for absent resources. The UI caps upload size at 5 MB; the server also enforces the limit.
