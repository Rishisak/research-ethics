"""
Test script for verifying Research Ethics Guidance Assistant on the 8 real PDF guidelines.
Tests the required test questions A through H.
"""

import json
import urllib.request
import time
import sys

URL = "http://127.0.0.1:8000/ask"

TEST_QUESTIONS = [
    ("A. Normal", "What is informed consent in research?", "Informed Consent", False, "SUPPORTED"),
    ("B. Data", "How should researchers protect participant research data?", "Data Handling & Privacy", False, "SUPPORTED"),
    ("C. Authorship", "What criteria should someone meet to qualify as an author?", "Authorship", False, "SUPPORTED"),
    ("D. Publication", "What is plagiarism in academic publishing?", "Publication Ethics", False, "SUPPORTED"),
    ("E. AI/Research", "What happens if I write my research paper using AI?", "Publication Ethics", False, "SUPPORTED"),
    ("F. Escalation", "Should my Ethics Committee approve my study?", "Informed Consent", True, "ESCALATION"),
    ("G. Insufficient", "What are the specific guidelines for cryogenic brain preservation of astronauts in lunar missions?", None, False, "INSUFFICIENT_EVIDENCE"),
    ("H. Out of Scope", "What is the best way to make pizza?", None, False, "UNKNOWN")
]

def run_tests():
    print("=" * 110)
    print("RUNNING REQUIRED TEST SUITE ON REAL PDF KNOWLEDGE BASE")
    print("=" * 110)
    
    passed = 0
    failed = 0
    
    for label, q, exp_cat, exp_esc, exp_type in TEST_QUESTIONS:
        t0 = time.time()
        try:
            req = urllib.request.Request(
                URL,
                data=json.dumps({"question": q}).encode("utf-8"),
                headers={"Content-Type": "application/json"}
            )
            with urllib.request.urlopen(req) as resp:
                data = json.loads(resp.read().decode("utf-8"))
        except Exception as e:
            print(f"[{label}] ERROR: {e}")
            failed += 1
            continue
            
        elap = time.time() - t0
        q_type = data.get("question_type")
        cat = data.get("category")
        esc = data.get("escalation_required")
        sources = data.get("sources", [])
        answer = data.get("answer", "")
        
        type_ok = (q_type == exp_type)
        cat_ok = True
        if exp_cat:
            cat_ok = (cat == exp_cat or (exp_cat in ("Publication Ethics", "Research Integrity") and cat in ("Publication Ethics", "Research Integrity", "Other Research Ethics")))
        esc_ok = (esc == exp_esc)
        
        # Verify no AI approval decision
        esc_safe = True
        if exp_esc:
            ans_lower = answer.lower()
            if "i approve your study" in ans_lower or "your study is approved" in ans_lower:
                esc_safe = False
                
        is_ok = type_ok and cat_ok and esc_ok and esc_safe
        if is_ok:
            passed += 1
            status = "PASS"
        else:
            failed += 1
            status = "FAIL"
            
        print("-" * 110)
        print(f"[{label}] {status} ({elap:5.2f}s) | Question: '{q}'")
        print(f"  Type: {q_type} (Expected: {exp_type}) | Cat: {cat} (Expected: {exp_cat}) | Esc: {esc} (Expected: {exp_esc})")
        print(f"  Sources ({len(sources)}):")
        for s in sources[:3]:
            doc_str = s.get('document', '')
            page_str = s.get('page', '')
            sec_str = s.get('section', '')
            org_str = s.get('organization', '')
            print(f"    * {doc_str} | p.{page_str} | § {sec_str} ({org_str})")
        safe_ans = answer[:220].replace('\n', ' ').encode('ascii', errors='replace').decode()
        print(f"  Answer: {safe_ans}...")
        
        time.sleep(1.5)  # respectful delay between LLM calls
        
    print("=" * 110)
    print(f"RESULTS: Total: {len(TEST_QUESTIONS)} | Passed: {passed} | Failed: {failed}")
    print("=" * 110)
    if failed > 0:
        sys.exit(1)

if __name__ == "__main__":
    run_tests()
