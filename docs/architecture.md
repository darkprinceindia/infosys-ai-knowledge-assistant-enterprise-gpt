# Architecture

```text
Browser UI
  ├─ Employee question → authenticated /api/query
  │   ├─ query classification → department + route
  │   ├─ HR route → MCP stdio search_curated_knowledge tool
  │   └─ other routes → local hybrid search
  │       └─ post-connector permission check + freshness filter
  │           └─ cited synthesis (Gemini if configured; extractive fallback)
  │               └─ query, source, connector, and audit records
  └─ Administrator upload → validation → text extraction → section chunks
      → lexical vectors + FTS5 index → document metadata
```

SQLite stores document metadata, source text, chunks, local hashed lexical vectors, FTS5 terms, queries, citations, feedback, connector calls, and audit events. A local vector makes the project run without a paid API. It is **not a semantic model embedding**; for a production corpus, replace it with a model embedding service and vector database, then run a measured retrieval evaluation.

## Access boundary

`Internal` documents are available to all authenticated demo users. HR, Sales, and Engineering material is available only to those departments and the administrator. `Restricted` content is administrator-only. The MCP server checks the user's scope and the API filters its returned records again. A document preview uses the same authorization check. Expired and archived documents are omitted from retrieval.

## MCP route

`mcp_server.py` implements JSON-RPC `initialize`, `tools/list`, and `tools/call` over standard input/output. The advertised read-only tool is `search_curated_knowledge`. HR questions demonstrate the connector path; connector failures are recorded and safely fall back to the local index. The backend owns the identity context and never exposes connector credentials to the browser.

## Model behavior

The optional Gemini prompt includes only permitted, retrieved passages and asks for citation markers. The response is accepted only when its citation numbers refer to supplied passages. When the model is unavailable or omits valid citations, extractive synthesis uses the cited source text. A low retrieval signal takes the no-answer path. The signal is a ranking score, **not a calibrated probability of correctness**.
