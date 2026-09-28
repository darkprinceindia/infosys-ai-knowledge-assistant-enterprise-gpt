# Security and production boundaries

This application demonstrates permission-aware retrieval with fictional data. It is **not approved for real internal Infosys content** as deployed locally.

Implemented controls:

- Passwords are salted and derived with PBKDF2-SHA256; session tokens are HMAC-signed and expire after 12 hours.
- Cookies are `HttpOnly` and `SameSite=Lax`; cross-origin POSTs are rejected. Set TLS termination correctly so cookies receive `Secure` in hosted use.
- Queries, source previews, and MCP results are filtered by user role and department. Restricted source text is absent from unauthorized results.
- Model keys remain server-side. Model calls receive only authorized retrieved passages.
- Uploads limit size and extension; filenames are not used as server filesystem paths.
- Audits record indexing, archiving, queries, and feedback.

Required before production use:

1. Replace demo accounts with enterprise OIDC/SSO, managed roles, account lifecycle, and MFA.
2. Use an approved database, encryption at rest, secure object storage, secret manager, and retention/deletion policy.
3. Add malware scanning, richer parser isolation, MIME validation, rate limits, and request size limits at the reverse proxy.
4. Implement robust citation verification, prompt-injection tests, redaction, human review for policy-sensitive answers, and calibrated evaluation thresholds.
5. Replace local lexical vectors with evaluated model embeddings and a scalable vector store.
6. Review every external connector for scope, credential handling, auditability, and data sharing.
7. Run security, privacy, legal, and data-owner reviews before indexing real company documents.

The login page does not reveal the demo password. Public binding requires explicit `APP_SECRET` and `DEMO_PASSWORD`, but that alone does not make the application production-safe.
