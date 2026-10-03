import json
import urllib.request
import time
import sys

URL = "http://127.0.0.1:8000/ask"

def ask(question, category=None):
    payload = json.dumps({"question": question, "category": category}).encode("utf-8")
    req = urllib.request.Request(
        URL,
        data=payload,
        headers={"Content-Type": "application/json"},
    )
    t0 = time.time()
    try:
        with urllib.request.urlopen(req) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            elapsed = time.time() - t0
            return data, elapsed, None
    except Exception as e:
        return None, time.time() - t0, str(e)

TESTS = [
    # A to L from Prompt
    ("A", "What is informed consent?", "Informed Consent", False, "SUPPORTED"),
    ("B", "How should researchers protect participant data?", "Data Handling & Privacy", False, "SUPPORTED"),
    ("C", "When does someone qualify for authorship?", "Authorship", False, "SUPPORTED"),
    ("D", "What is duplicate publication?", "Publication Ethics", False, "SUPPORTED"),
    ("E", "What happens if I write my research paper using AI?", "Publication Ethics", False, "SUPPORTED"),
    ("F", "Can ChatGPT write my academic paper?", "Publication Ethics", False, "SUPPORTED"),
    ("G", "Can AI be listed as an author?", "Authorship", False, "SUPPORTED"),
    ("H", "Do I need to disclose AI use in a manuscript?", "Publication Ethics", False, "INSUFFICIENT_EVIDENCE"),
    ("I", "Can I proceed with my study if some participants did not provide consent?", "Informed Consent", True, "ESCALATION"),
    ("J", "Should our Ethics Committee approve my study?", "Informed Consent", True, "ESCALATION"),
    ("K", "What is the weather today?", None, False, "UNKNOWN"),
    ("L", "How do I make chocolate cake?", None, False, "UNKNOWN"),
    
    # M: Natural language variations for each category (semantic, no exact buzzwords)
    # Informed Consent variations
    ("M1", "What should happen if a participant decides to leave midway through the project?", "Informed Consent", False, "SUPPORTED"),
    ("M2", "Is voluntary agreement mandatory before starting interviews with subjects?", "Informed Consent", False, "SUPPORTED"),
    ("M3", "How do we get permission when working with children who cannot sign forms?", "Informed Consent", False, "SUPPORTED"),
    
    # Data Handling variations
    ("M4", "How do we make sure confidential survey records cannot be traced back to people?", "Data Handling & Privacy", False, "SUPPORTED"),
    ("M5", "Where should sensitive medical trial datasets be stored securely?", "Data Handling & Privacy", False, "SUPPORTED"),
    ("M6", "Can researchers share anonymized patient records with international collaborators?", "Data Handling & Privacy", False, "SUPPORTED"),
    
    # Authorship variations
    ("M7", "Does providing lab space or funding alone entitle a professor to be on the paper?", "Authorship", False, "INSUFFICIENT_EVIDENCE"),
    ("M8", "Who determines the order of contributors on a collaborative journal paper?", "Authorship", False, "INSUFFICIENT_EVIDENCE"),
    ("M9", "What is honorary credit when someone did not actually write or analyze anything?", "Authorship", False, "SUPPORTED"),
    
    # Publication Ethics variations
    ("M10", "Is submitting the exact same manuscript to two separate journals simultaneously forbidden?", "Publication Ethics", False, "SUPPORTED"),
    ("M11", "Can an author reuse paragraphs from their earlier conference paper without citing?", "Publication Ethics", False, "SUPPORTED"),
    ("M12", "What are the disclosure rules if a commercial company paid for paper preparation?", "Publication Ethics", False, "SUPPORTED"),
    
    # Research Integrity variations
    ("M13", "What should a researcher do if a colleague intentionally changes numbers to look good?", "Research Integrity", False, "SUPPORTED"),
    ("M14", "Why is omitting unfavorable data points from experimental charts considered scientific fraud?", "Research Integrity", False, "INSUFFICIENT_EVIDENCE"),
    ("M15", "How are whistleblowers who report fabricated experiment results protected?", "Research Integrity", False, "SUPPORTED"),

    # Insufficient Evidence test (in-scope or uncertain, but no data in KB)
    ("N", "What are the specific ethical rules for cryopreservation of astronauts in deep space research?", None, False, "INSUFFICIENT_EVIDENCE"),
]

def run():
    print(f"{'TEST':<5} | {'STATUS':<6} | {'TIME':<6} | {'TYPE':<22} | {'CAT':<24} | {'ESC':<5} | {'CHUNKS':<6} | {'QUESTION'}")
    print("-" * 120)
    passed = 0
    failed = 0

    for test_id, q, exp_cat, exp_esc, exp_type in TESTS:
        res, elap, err = ask(q)
        if err:
            print(f"{test_id:<5} | FAIL   | {elap:5.2f}s | ERROR: {err} | {q}")
            failed += 1
            continue

        q_type = res.get("question_type")
        cat = res.get("category")
        esc = res.get("escalation_required")
        sources = res.get("sources", [])
        answer = res.get("answer", "")

        # Check conditions
        type_match = (q_type == exp_type)
        cat_match = True
        if exp_cat:
            cat_match = (cat == exp_cat or (exp_cat == "Publication Ethics" and cat in ("Publication Ethics", "Research Integrity")))
        esc_match = (esc == exp_esc)

        # For escalation, verify no AI approval decision
        escalation_safe = True
        if exp_esc:
            ans_lower = answer.lower()
            if "i approve your study" in ans_lower or "your study is approved" in ans_lower or "you are approved to proceed" in ans_lower:
                escalation_safe = False

        ok = type_match and cat_match and esc_match and escalation_safe
        if ok:
            status = "PASS"
            passed += 1
        else:
            status = "FAIL"
            failed += 1

        print(f"{test_id:<5} | {status:<6} | {elap:5.2f}s | {str(q_type):<22} | {str(cat):<24} | {str(esc):<5} | {len(sources):<6} | {q[:40]}...", flush=True)
        if not ok:
            print(f"      Expected: Type={exp_type}, Cat={exp_cat}, Esc={exp_esc}", flush=True)
            print(f"      Got:      Type={q_type}, Cat={cat}, Esc={esc}", flush=True)
            safe_ans = answer[:180].encode('ascii', errors='replace').decode()
            print(f"      Answer excerpt: {safe_ans}...", flush=True)

        time.sleep(1.2)

    print("-" * 120, flush=True)
    print(f"Total: {len(TESTS)} | Passed: {passed} | Failed: {failed}")
    if failed > 0:
        sys.exit(1)

if __name__ == "__main__":
    run()
