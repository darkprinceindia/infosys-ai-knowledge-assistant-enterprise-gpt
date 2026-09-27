"""Exercise login, upload, query, preview, feedback, analytics and access over HTTP."""

import base64
import http.cookiejar
import json
import os
import sys
import tempfile
import threading
import urllib.error
import urllib.request
from http.server import ThreadingHTTPServer
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

with tempfile.TemporaryDirectory() as directory:
    os.environ["APP_DB"] = str(Path(directory) / "http.db")
    os.environ["DEMO_PASSWORD"] = "test-password"
    import knowledge as k
    import app

    k.init_db()
    server = ThreadingHTTPServer(("127.0.0.1", 0), app.Handler)
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    base = f"http://127.0.0.1:{server.server_port}"

    def client():
        jar = http.cookiejar.CookieJar()
        return urllib.request.build_opener(urllib.request.HTTPCookieProcessor(jar))

    def call(opener, route, payload=None):
        request = urllib.request.Request(base + route,
            data=json.dumps(payload).encode() if payload is not None else None,
            headers={"Content-Type": "application/json"} if payload is not None else {})
        with opener.open(request) as response:
            return json.load(response)

    try:
        admin = client()
        call(admin, "/api/login", {"email": "admin@demo.local", "password": "test-password"})
        assert len(call(admin, "/api/documents")["documents"]) == 5
        text = b"# Remote work handbook\n## Approval\nEmployees request remote work in the team portal. Managers review the request before a remote work arrangement starts. The approval is recorded by HR Operations."
        uploaded = call(admin, "/api/documents/upload", {"title": "Remote work handbook", "department": "HR",
            "classification": "HR", "owner": "HR Operations", "document_type": "Policy",
            "filename": "remote-work.md", "file_base64": base64.b64encode(text).decode()})["document"]
        assert uploaded["chunks"] >= 1
        answer = call(admin, "/api/query", {"question": "How do employees request remote work?"})
        assert not answer["no_answer"] and any(x["title"] == "Remote work handbook" for x in answer["citations"])
        assert call(admin, f"/api/documents/{uploaded['id']}")["document"]["content"]
        assert call(admin, "/api/feedback", {"query_id": answer["id"], "rating": 5})["saved"]
        assert call(admin, "/api/analytics")["feedback_count"] == 1
        delivery = client()
        call(delivery, "/api/login", {"email": "delivery@demo.local", "password": "test-password"})
        try:
            call(delivery, f"/api/documents/{uploaded['id']}")
        except urllib.error.HTTPError as exc:
            assert exc.code == 404
        else:
            raise AssertionError("Restricted document was visible")
        print("HTTP smoke test passed: login, upload, query, preview, feedback, analytics, access denial")
    finally:
        server.shutdown()
        server.server_close()
