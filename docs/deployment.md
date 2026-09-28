# Deployment and submission

The live review deployment is [infosys-enterprise-gpt-demo.onrender.com](https://infosys-enterprise-gpt-demo.onrender.com/), a Render Free Python web service in Singapore using the public GitHub repository's `main` branch. Its build command is `pip install -r requirements.txt`, its start command is `python app.py`, and its health check path is `/`. Render sets `PORT`; the service environment sets `HOST=0.0.0.0`, a generated `APP_SECRET`, `DEMO_PASSWORD`, and `GEMINI_API_KEY`. The local `.env` is ignored by Git and is not transferred. If Gemini is unavailable, the app uses cited local extractive answers. The included `render.yaml` is a template for a future Blueprint deployment.

**Free-tier limitation:** Render's free web service has an ephemeral filesystem and sleeps after idle time. Its local SQLite database is reseeded from the five sample files after each restart, so uploaded documents, feedback, and analytics history do not persist. A cold start may take about a minute. The review workflow still works after reseeding. For persistent SQLite without a paid disk, an Oracle Cloud Always Free VM is a possible alternative, with more setup and capacity constraints. The standard-library HTTP server is suitable for a controlled capstone demonstration; use a production-grade service stack for real organizational use.

Submission steps requiring destination access:

1. The GitHub repository and Render Free deployment are available, with `.env`, `.venv`, and `data/app.db` excluded from Git.
2. For persistent uploads and analytics, move the database to durable storage before using this for more than a short demonstration.
3. The deployed URL and screenshots are in `README.md`; record the walkthrough in `docs/demo_script.md`.
4. Upload the video to Google Drive and set its access to “Anyone with the link can view”.
5. Add actual contributor names and roles. Verify all links in the final submission checklist.

Do not publish real internal documents or API keys with the repository or recording.
