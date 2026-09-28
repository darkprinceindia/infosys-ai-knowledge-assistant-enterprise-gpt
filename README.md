# Infosys AI Knowledge Assistant (Enterprise GPT)

## Project overview

A capstone prototype for governed document question answering. Employees ask natural-language questions and receive answers with source citations. Administrators can upload approved documents, inspect connector activity, and review quality signals. The interface uses Infosys-inspired styling for the demonstration and is not an official Infosys product.

## Business problem

Policies, procedures, and runbooks can be scattered across files and teams. Employees need to find the relevant passage, check its source, and avoid relying on material outside their access scope.

## Product goal

Answer from permitted documents with a citation, or clearly say when the available evidence is insufficient.

## Live demo

[infosys-enterprise-gpt-demo.onrender.com](https://infosys-enterprise-gpt-demo.onrender.com/) runs on Render Free. Select a demo account and request the shared password from the project owner.

> **Demo data:** The included documents are fictional examples created for this project. They are not Infosys policies or internal records.

![Assistant home screen with the Infosys-inspired interface](assets/screenshots/01_assistant_home.png)

## Screenshots

| Cited answer | Source preview |
| :---: | :---: |
| ![HR question answered with a source citation](assets/screenshots/02_cited_hr_answer.png) | ![Preview of a cited passage](assets/screenshots/03_source_preview.png) |

| Document ingestion | Quality analytics |
| :---: | :---: |
| ![Administrator document upload](assets/screenshots/05_document_ingestion.png) | ![Quality analytics dashboard](assets/screenshots/07_quality_analytics.png) |

The [employee access screenshot](assets/screenshots/10_employee_access_boundary.png) shows how a Delivery account is kept outside HR-only material.

## Architecture

```mermaid
flowchart TB
    User["Employee or administrator"] --> UI["Browser UI"]
    UI --> API["Python API<br/>sessions and roles"]
    API --> Router["Classify question"]
    Router -->|"HR"| MCP["MCP connector"]
    Router -->|"Other"| Search["Approved passage search"]
    MCP --> Search
    Store["SQLite + FTS5<br/>documents and chunks"] --> Search
    Search --> Answer["Cited answer<br/>Gemini or local fallback"]
    API --> Intake["Admin upload<br/>extract and index"]
    Intake --> Store
    API --> Signals["Audit and quality records"]
```

The MCP tool is a bundled local connector. Gemini receives only retrieved passages that passed the access filter. The local hashed vectors are lexical features, not semantic embeddings. See the [architecture notes](docs/architecture.md).

## AI workflow

An administrator upload is validated, converted to text, split into sections and passages, then indexed in SQLite FTS5. For a question, the backend chooses the read-only MCP search tool for HR topics or local search for other topics. It filters retrieved passages by role, department, and document status before building the answer. Gemini may phrase an answer from those permitted passages when configured; otherwise the application extracts cited source sentences.

```mermaid
flowchart LR
    Q["Question"] --> R["Classify and route"]
    R --> K["Retrieve candidate passages"]
    K --> P["Apply access and freshness checks"]
    P --> E{"Enough evidence?"}
    E -->|"No"| N["Explain that no supported answer was found"]
    E -->|"Yes"| C["Select up to three cited passages"]
    C --> M{"Gemini answer with valid citations?"}
    M -->|"Yes"| G["Return model-backed answer"]
    M -->|"No or unavailable"| L["Return extractive answer"]
```

## How to run locally

Requires Python 3.11 or newer. No frontend build step is needed.

```powershell
git clone https://github.com/darkprinceindia/infosys-ai-knowledge-assistant-enterprise-gpt.git
cd infosys-ai-knowledge-assistant-enterprise-gpt
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
.\.venv\Scripts\python.exe app.py
```

Open **http://127.0.0.1:8000**. On later runs, only the `cd` and final `app.py` commands are needed. The login screen offers administrator and employee accounts for Delivery, HR, Engineering, and Sales. Set `DEMO_PASSWORD` in `.env` or the host's environment to control the shared demo password; the login page does not display it.

For macOS/Linux, activate the virtual environment and run `python app.py` with the same environment variables. `pypdf` is only required for PDF uploads; TXT, Markdown, and DOCX work with the standard library.

## Demo in five minutes

1. Sign in as **Administrator**. Ask “What is the annual leave request process?” The answer uses the **MCP curated knowledge** route and shows a citation.
2. Open its source card to inspect the approved passage and metadata.
3. Open **Knowledge library** to inspect the five seeded collections and upload a new TXT, MD, DOCX, or PDF file with department, classification, owner, and dates.
4. Open **Quality analytics** to see the query, route, no-answer rate, citation coverage, and connector event.
5. Sign out and use **Delivery employee**. Ask the same HR question. The assistant must decline because HR material is outside that account's access scope.

See [docs/demo_script.md](docs/demo_script.md) for a recording script and narration.

## Key features

- Upload validation, duplicate detection, DOCX/PDF/TXT/MD extraction, section-aware chunking, source metadata, and SQLite indexing.
- Permission-aware search with local lexical vectors and term overlap, filtering expired or archived documents.
- Query classification and a real read-only MCP stdio JSON-RPC tool route for HR queries, with connector events and a local fallback on connector failure.
- Source-grounded answers with numbered citations; optional Gemini synthesis when `GEMINI_API_KEY` is configured. Without a key, the app uses transparent extractive synthesis.
- No-answer behavior, source preview, feedback capture, role-based screens, audit events, and quality analytics.
- Five fictional sample documents covering delivery, HR, engineering, sales, and project onboarding.

## Data sources used

The repository seeds five fictional Markdown documents and their access metadata from [`data/source_metadata.csv`](data/source_metadata.csv). They are examples for testing the workflow, not company policies.

| Topic | Seed document |
| --- | --- |
| Delivery incidents | [Delivery escalation SOP](data/sample_sops/delivery-escalation.md) |
| Leave requests | [Employee leave policy](data/sample_hr_policies/leave-policy.md) |
| API incidents | [API incident runbook](data/sample_engineering_guides/incident-runbook.md) |
| Client proposals | [Approved AI services positioning](data/sample_sales_assets/approved-positioning.md) |
| New projects | [Project onboarding manual](data/sample_project_manuals/onboarding-manual.md) |

Administrators can also add approved TXT, Markdown, DOCX, or PDF files through the Knowledge library. Uploads are indexed with owner, department, classification, and dates.

## Tools and technologies used

| Part | Technology | Purpose |
| --- | --- | --- |
| Frontend | HTML, CSS, JavaScript in `static/` | Login, questions, citations, library, analytics. |
| Backend | Python standard-library HTTP server in `app.py` | Sessions, API routes, query workflow, access checks. |
| Knowledge layer | `knowledge.py` and SQLite FTS5 | Intake, metadata, lexical retrieval, citations, quality records. |
| Connector | `mcp_server.py` over stdio JSON-RPC | Read-only curated-knowledge route for HR questions. |
| Optional LLM | Gemini API | Synthesize an answer from approved retrieved passages. |
| PDF intake | `pypdf` | Extract text from uploaded PDFs. |

## API at a glance

The browser calls JSON endpoints in `app.py`. Login sets an `HttpOnly` session cookie; protected routes use that cookie and apply the signed-in user's role and department.

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `POST` | `/api/login` | Sign in and start a session. |
| `GET` | `/api/me` | Return the current user. |
| `POST` | `/api/query` | Ask a question and receive an answer with citations. |
| `GET` | `/api/documents` and `/api/documents/{id}` | List permitted documents and preview a source. |
| `POST` | `/api/documents/upload` | Validate and index a document (administrator only). |
| `GET` | `/api/connectors` | Show the configured MCP connector. |
| `GET` | `/api/analytics` | Return usage and quality metrics (administrator only). |

The [full API reference](docs/api_documentation.md) includes the remaining endpoints, access rules, request and response fields, and error codes.

## Environment variables

Copy `.env.example` to `.env` and set values before a shared deployment. `.env` is ignored by Git.

| Variable | Purpose |
| --- | --- |
| `APP_SECRET` | HMAC signing key for 12-hour session cookies. Required for a public bind. |
| `DEMO_PASSWORD` | Password for seeded demo accounts. Required for a public bind. |
| `GEMINI_API_KEY` | Optional model-backed synthesis; never sent to the browser. |
| `GEMINI_MODEL` | Gemini model name, default `gemini-flash-latest`. |
| `APP_DB` | SQLite database path, default `data/app.db`. |
| `HOST`, `PORT` | Listening address and port; default `127.0.0.1:8000`. |

The model request sends only passages that passed the permission filter. Avoid putting sensitive real company documents into a demo deployment without an approved identity provider, data retention policy, and security review.

The live Render Free service uses this public GitHub repository, Python 3.12, a Singapore instance, and the build/start commands in the [deployment guide](docs/deployment.md). The dashboard stores `APP_SECRET`, `DEMO_PASSWORD`, and `GEMINI_API_KEY` as environment variables; the local `.env` file is not transferred. Render Free uses an ephemeral filesystem: sample documents reseed after a restart, but uploads, feedback, and analytics history do not persist. The included [`render.yaml`](render.yaml) is a template for future Blueprint deployments.

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

## Evaluation approach

The [six evaluation questions](docs/evaluation_queries.csv) cover a cited answer from each main department, an HR access denial for a Delivery user, and an unsupported question that should receive no citation. Review each result for the expected source, route, citation, and access behavior. This is a small functional check of the prototype, not a measured accuracy benchmark for real enterprise content.

Run the automated workflow and access-control tests locally:

```powershell
.\.venv\Scripts\python.exe -m unittest discover -s tests -v
```

The tests use a temporary database and verify the MCP answer route, citations, restricted-source behavior, no-answer handling, seeded content, duplicate detection, and analytics.

## Known limitations

- Retrieval uses local hashed lexical vectors and SQLite FTS5, not semantic model embeddings or a vector database.
- The MCP tool is a bundled read-only demonstration over the seeded knowledge bank, not a connection to a live company system.
- Demo accounts and a shared password are for review; enterprise use would need managed identity, document approvals, stronger evaluation, and security and privacy review.
- Render Free storage is temporary: uploaded files, feedback, and analytics history can reset when the service restarts.

See the [security notes](docs/security_notes.md) and [deployment guide](docs/deployment.md) for the production work behind these limits.

## Team contribution

| Project maker | Track |
| --- | --- |
| Soumyakanta Mishra | Data Science |
| Sayan Modak | Data Science |
| Pulkit Narang | Data Science |
| Subhansu Bose | Data Science |
| Chandra Akash Kiran | Data Science |
| M.S. Pavan Shankar | Data Science |
| Shruti Vishwas Deshpande | Web3 |
| Sanket Arun Patil | Data Science |

The team collaborated on research, implementation, testing, and documentation.
