"""End-to-end service checks using an isolated SQLite database."""

import os
import io
import tempfile
import unittest
import zipfile
from pathlib import Path

TEMP = tempfile.TemporaryDirectory()
os.environ["APP_DB"] = str(Path(TEMP.name) / "test.db")
os.environ["DEMO_PASSWORD"] = "test-password"

import knowledge as k  # noqa: E402
import app  # noqa: E402


class WorkflowTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        k.init_db()

    def user(self, user_id):
        with k.connect() as db:
            return dict(db.execute("SELECT id,name,email,department,role FROM users WHERE id=?", (user_id,)).fetchone())

    def test_demo_corpus_and_permission_boundary(self):
        admin, delivery, hr = self.user("admin"), self.user("delivery"), self.user("hr")
        self.assertEqual(len(k.list_documents(admin)), 5)
        self.assertEqual(len(k.list_documents(delivery)), 2)
        self.assertEqual(len(k.list_documents(hr)), 3)
        hr_document = next(doc for doc in k.list_documents(admin) if doc["department"] == "HR")
        self.assertIsNone(k.get_document(hr_document["id"], delivery))
        self.assertIsNotNone(k.get_document(hr_document["id"], hr))

    def test_cited_answer_and_mcp_route(self):
        result = app.answer_query("How many annual leave days do employees receive?", self.user("hr"))
        self.assertFalse(result["no_answer"])
        self.assertIn("MCP", result["route"])
        self.assertTrue(result["citations"])
        self.assertIn("[1]", result["answer"])
        self.assertEqual(result["citations"][0]["classification"], "HR")

    def test_restricted_source_never_retrieved(self):
        result = app.answer_query("How many annual leave days do employees receive?", self.user("delivery"))
        self.assertTrue(result["no_answer"])
        self.assertFalse(result["citations"])
        self.assertNotIn("20 days", result["answer"])

    def test_unknown_question_uses_no_answer_path(self):
        result = app.answer_query("What is the cafeteria breakfast menu on Mars?", self.user("admin"))
        self.assertTrue(result["no_answer"])
        self.assertEqual(result["citations"], [])

    def test_duplicate_and_invalid_intake(self):
        with self.assertRaisesRegex(ValueError, "already indexed"):
            k.create_document({"title": "Duplicate", "department": "HR", "classification": "HR", "owner": "Test",
                               "document_type": "Guide", "filename": "copy.md",
                               "content": (k.ROOT / "data/sample_hr_policies/leave-policy.md").read_text()}, "admin")
        with self.assertRaisesRegex(ValueError, "Supported file types"):
            k.extract_document("bad.exe", b"ignored")

    def test_docx_and_pdf_text_extraction(self):
        document = io.BytesIO()
        with zipfile.ZipFile(document, "w") as archive:
            archive.writestr("word/document.xml", '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:p><w:r><w:t>DOCX approval steps</w:t></w:r></w:p></w:body></w:document>')
        self.assertIn("DOCX approval steps", k.extract_document("steps.docx", document.getvalue()))

        from pypdf import PdfWriter
        from pypdf.generic import DecodedStreamObject, DictionaryObject, NameObject
        writer = PdfWriter()
        page = writer.add_blank_page(width=612, height=792)
        font = DictionaryObject({NameObject("/Type"): NameObject("/Font"),
                                 NameObject("/Subtype"): NameObject("/Type1"),
                                 NameObject("/BaseFont"): NameObject("/Helvetica")})
        page[NameObject("/Resources")] = DictionaryObject({NameObject("/Font"): DictionaryObject({NameObject("/F1"): font})})
        stream = DecodedStreamObject()
        stream.set_data(b"BT /F1 12 Tf 50 700 Td (PDF escalation guide) Tj ET")
        page[NameObject("/Contents")] = writer._add_object(stream)
        output = io.BytesIO()
        writer.write(output)
        self.assertIn("PDF escalation guide", k.extract_document("guide.pdf", output.getvalue()))

    def test_analytics_record_activity(self):
        app.answer_query("How do I escalate a P1 delivery incident?", self.user("admin"))
        report = k.analytics(self.user("admin"))
        self.assertGreaterEqual(report["queries"], 1)
        self.assertEqual(sum(x["count"] for x in report["documents_by_department"]), 5)


if __name__ == "__main__":
    unittest.main()
