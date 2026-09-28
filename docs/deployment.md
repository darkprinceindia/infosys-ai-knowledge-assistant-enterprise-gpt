# Deployment and submission

The local app binds to `127.0.0.1:8000` by default. `render.yaml` prepares a free Render web service for a review link. Push this folder as a GitHub repository, create a Render Blueprint from it, and supply `DEMO_PASSWORD` and `GEMINI_API_KEY` when prompted. Render generates `APP_SECRET`. The local `.env` file is ignored by Git and is not transferred to Render; enter the key separately in Render's secret environment variable prompt. If model-backed synthesis is not wanted, leave that value empty and the app will use extractive answers.

**Free-tier limitation:** Render's free web service has an ephemeral filesystem and sleeps after idle time. Its local SQLite database is reseeded from the five sample files after each restart, so uploaded documents, feedback, and analytics history do not persist. A cold start may take about a minute. The review workflow still works after reseeding. For persistent SQLite without a paid disk, an Oracle Cloud Always Free VM is a possible alternative, with more setup and capacity constraints. The standard-library HTTP server is suitable for a controlled capstone demonstration; use a production-grade service stack for real organizational use.

Submission steps requiring destination access:

1. Create a GitHub repository and push this project (excluding `.env`, `.venv`, and `data/app.db`).
2. Deploy the app with a persistent store and TLS. Test sign-in, upload, cited query, source preview, and access denial at the final URL.
3. Put the deployed URL in `README.md`, add application screenshots, and record the walkthrough in `docs/demo_script.md`.
4. Upload the video to Google Drive and set its access to “Anyone with the link can view”.
5. Add actual contributor names and roles. Verify all links in the final submission checklist.

Do not publish real internal documents or API keys with the repository or recording.
