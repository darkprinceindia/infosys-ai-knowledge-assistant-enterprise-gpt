# Infosys AI Knowledge Assistant (Enterprise GPT)

A working capstone application for governed document question answering. Employees ask natural-language questions and receive answers with source citations. Administrators can upload approved documents, inspect connector activity, and review quality signals.

> **Demo data:** The included documents are fictional examples created for this project. They are not Infosys policies or internal records.

## Run locally

Requires Python 3.11 or newer. No frontend build step is needed.

```powershell
cd G:\AlmaBetter\infosys-ai-knowledge-assistant-enterprise-gpt
python -m venv .venv
.venv\Scripts\python.exe -m pip install -r requirements.txt
.venv\Scripts\python.exe app.py
```

Open **http://127.0.0.1:8000**. The local demo password is `Demo123!` unless `DEMO_PASSWORD` is set. The login screen offers administrator and employee accounts for Delivery, HR, Engineering, and Sales. Change the password before sharing a deployment.

For macOS/Linux, activate the virtual environment and run `python app.py` with the same environment variables. `pypdf` is only required for PDF uploads; TXT, Markdown, and DOCX work with the standard library.

## Demo in five minutes

1. Sign in as **Administrator**. Ask “What is the annual leave request process?” The answer uses the **MCP curated knowledge** route and shows a citation.
2. Open its source card to inspect the approved passage and metadata.
3. Open **Knowledge library** to inspect the five seeded collections and upload a new TXT, MD, DOCX, or PDF file with department, classification, owner, and dates.
4. Open **Quality analytics** to see the query, route, no-answer rate, citation coverage, and connector event.
5. Sign out and use **Delivery employee**. Ask the same HR question. The assistant must decline because HR material is outside that account's access scope.

See [docs/demo_script.md](docs/demo_script.md) for a recording script and narration.

## What works

- Upload validation, duplicate detection, DOCX/PDF/TXT/MD extraction, section-aware chunking, source metadata, and SQLite indexing.
- Permission-aware search with local lexical vectors and term overlap, filtering expired or archived documents.
- Query classification and a real read-only MCP stdio JSON-RPC tool route for HR queries, with connector events and a local fallback on connector failure.
- Source-grounded answers with numbered citations; optional Gemini synthesis when `GEMINI_API_KEY` is configured. Without a key, the app uses transparent extractive synthesis.
- No-answer behavior, source preview, feedback capture, role-based screens, audit events, and quality analytics.
- Five fictional sample documents covering delivery, HR, engineering, sales, and project onboarding.

## Configuration

Copy `.env.example` to `.env` and set values before a shared deployment. `.env` is ignored by Git.

| Variable | Purpose |
| --- | --- |
| `APP_SECRET` | HMAC signing key for 12-hour session cookies. Required for a public bind. |
| `DEMO_PASSWORD` | Password for seeded demo accounts. Required for a public bind. |
| `GEMINI_API_KEY` | Optional model-backed synthesis; never sent to the browser. |
| `GEMINI_MODEL` | Gemini model name, default `gemini-2.5-flash`. |
| `APP_DB` | SQLite database path, default `data/app.db`. |
| `HOST`, `PORT` | Listening address and port; default `127.0.0.1:8000`. |

The model request sends only passages that passed the permission filter. Avoid putting sensitive real company documents into a demo deployment without an approved identity provider, data retention policy, and security review.

## Project layout

```text
app.py                 HTTP API, login, routing, answer workflow
knowledge.py           ingestion, indexing, permission checks, retrieval, analytics
mcp_server.py          read-only MCP stdio connector
static/                employee and administrator web interface
data/sample_*/         fictional seed documents
tests/                 workflow and access-control tests
docs/                  architecture, APIs, demo, evaluation, deployment notes
```

## Test

```powershell
.venv\Scripts\python.exe -m unittest discover -s tests -v
```

The tests use a temporary database and verify the MCP answer route, citations, restricted-source behavior, no-answer handling, seeded content, duplicate detection, and analytics.

## Submission status

The local codebase and demo flow are ready. A public GitHub URL, public app URL, and Google Drive recording require the corresponding destination accounts and publication steps. The application is a **capstone prototype**, with production gaps documented in [docs/security_notes.md](docs/security_notes.md). The brief's suggested stacks are options rather than mandatory choices; this implementation uses Python's standard library and a small optional PDF package to remain easy to run.

## Team contribution

Implementation, sample data, documentation, and automated tests were prepared in this workspace. Add the actual contributor names and responsibilities before final submission.
