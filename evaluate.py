"""Run the curated evaluation questions against a temporary demo database."""

import csv
import os
import tempfile
from pathlib import Path

with tempfile.TemporaryDirectory() as directory:
    os.environ["APP_DB"] = str(Path(directory) / "evaluation.db")
    import knowledge as k
    import app

    k.init_db()
    with (k.ROOT / "docs" / "evaluation_queries.csv").open(newline="", encoding="utf-8") as file:
        cases = list(csv.DictReader(file))
    passed = 0
    for case in cases:
        with k.connect() as db:
            user = dict(db.execute("SELECT id,name,email,department,role FROM users WHERE id=?", (case["role"],)).fetchone())
        result = app.answer_query(case["question"], user)
        titles = [source["title"] for source in result["citations"]]
        expected_no_answer = case["expected_behavior"].startswith("no answer")
        source_ok = case["expected_source"] == "none" or case["expected_source"] in titles
        outcome = result["no_answer"] == expected_no_answer and source_ok
        passed += outcome
        print(f"{'PASS' if outcome else 'FAIL'} {case['role']}: {case['question']}")
        print(f"  route={result['route']} sources={titles} answer={result['answer'][:180]}")
    print(f"\n{passed}/{len(cases)} evaluation cases passed")
    raise SystemExit(0 if passed == len(cases) else 1)
