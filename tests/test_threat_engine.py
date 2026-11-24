"""
Unified threat engine, SSRF guard, provider clients and AI analyst.
All third-party HTTP is mocked: the tests prove how real responses are interpreted and that
missing/failed sources are never reported as clean.
"""
import json
import os
import sys
import unittest

os.environ.setdefault("CTP_SKIP_DOTENV", "1")  # offline tests: never read the developer's .env
from unittest import mock

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if ROOT not in sys.path:
    sys.path.insert(0, ROOT)

from backend.app.core.config import settings
from backend.app.services import ai_analyst, intel_clients, net_safety
from backend.app.services.intel_common import make_result
from backend.app.services.ml_service import MLService
from backend.app.services.rule_engine import RuleEngineService
from backend.app.services.threat_engine import evaluate
from ml.features.extractor import extract_features

NAMES = ["VirusTotal", "Google Web Risk", "URLhaus", "urlscan.io"]


def missing():
    return {n: make_result(n, "not_configured", note="Not configured.") for n in NAMES}


def run_engine(url, intel=None, **kw):
    ex = extract_features(url)
    f, d = ex["features"], ex["details"]
    threats, _safe, rule = RuleEngineService.evaluate(f, d)
    return evaluate(url=url, domain=d["domain"], features=f, details=d, threats=threats, rule_score=rule,
                    ml=MLService.predict_all(f), intel=intel or missing(), **kw)["report"]



def _unlimited_budgets():
    """Provider tests check how responses are interpreted, not our call budgets: make those independent of test order."""
    from backend.app.services import threat_intel
    return [
        mock.patch.object(b, "allow", return_value=True)
        for b in (intel_clients.budget_webrisk, intel_clients.budget_urlhaus,
                  intel_clients.budget_urlscan_search, intel_clients.budget_urlscan_submit, threat_intel._VT_BUDGET)
    ]


class TestEngine(unittest.TestCase):
    def test_unknown_url_with_no_sources_is_never_safe(self):
        r = run_engine("https://totally-unknown-example-site.com/home")
        self.assertEqual(r["verdict"], "UNVERIFIED")
        self.assertFalse(r["verified"])
        self.assertTrue(any("No reputation source" in x for x in r["limitations"]))
        self.assertEqual(r["confidence"]["label"], "LOW")

    def test_official_domain_is_verified_safe(self):
        r = run_engine("https://www.google.com/search?q=cybersecurity")
        self.assertEqual(r["verdict"], "SAFE")
        self.assertIn("Official brand domain", r["verified_by"])

    def test_web_risk_flag_dominates_benign_looking_url(self):
        intel = missing()
        intel["Google Web Risk"] = make_result("Google Web Risk", "ok", "malicious", 92, "Listed as phishing.")
        r = run_engine("https://totally-unknown-example-site.com/home", intel)
        self.assertEqual(r["verdict"], "DANGEROUS")
        self.assertGreaterEqual(r["score"], 92)
        self.assertTrue(r["conflicts"])  # reputation says bad, structure looks ordinary

    def test_correlated_sources_are_not_summed(self):
        intel = missing()
        intel["Google Web Risk"] = make_result("Google Web Risk", "ok", "malicious", 92, "x")
        intel["URLhaus"] = make_result("URLhaus", "ok", "malicious", 95, "y")
        intel["VirusTotal"] = make_result("VirusTotal", "ok", "malicious", 90, "z", {"malicious": 8})
        r = run_engine("https://totally-unknown-example-site.com/home", intel)
        self.assertLessEqual(r["intel_score"], 95 + 8)       # strongest + capped corroboration, never 92+95+90
        self.assertLessEqual(r["score"], 100)

    def test_single_weak_virustotal_flag_is_only_suspicious(self):
        intel = missing()
        intel["VirusTotal"] = make_result("VirusTotal", "ok", "malicious", 50, "1 engine", {"malicious": 1})
        r = run_engine("https://totally-unknown-example-site.com/home", intel)
        self.assertEqual(r["verdict"], "SUSPICIOUS")

    def test_clean_reputation_does_not_hide_strong_local_signals(self):
        intel = missing()
        intel["Google Web Risk"] = make_result("Google Web Risk", "ok", "clean", 0, "not listed")
        r = run_engine("http://paypa1-account-verification.xyz/login.php", intel)
        self.assertEqual(r["verdict"], "DANGEROUS")
        self.assertTrue(any("not flag" in c or "did not flag" in c for c in r["conflicts"]))

    def test_unavailable_sources_are_listed_not_hidden(self):
        intel = missing()
        intel["VirusTotal"] = make_result("VirusTotal", "error", note="VirusTotal API HTTP 500")
        r = run_engine("https://totally-unknown-example-site.com/home", intel)
        self.assertTrue(any("VirusTotal" in x for x in r["limitations"]))

    def test_ai_never_influences_score(self):
        self.assertFalse(run_engine("https://example.org/")["ai_influences_score"])


class TestNetSafety(unittest.TestCase):
    def test_private_and_special_addresses_are_blocked(self):
        for u in ["http://127.0.0.1/", "http://localhost/", "http://169.254.169.254/latest/meta-data/",
                  "http://10.0.0.5/", "http://192.168.1.1/", "http://[::1]/", "http://[::ffff:127.0.0.1]/",
                  "http://0x7f000001/", "http://2130706433/"]:
            t = net_safety.inspect_target(u)
            self.assertFalse(t["safe"], u)
            self.assertFalse(t["ips"], u)

    def test_non_http_schemes_rejected(self):
        for u in ["file:///etc/passwd", "javascript:alert(1)", "gopher://x/", "ftp://x/"]:
            self.assertFalse(net_safety.inspect_target(u)["safe"])
            self.assertFalse(net_safety.inspect_target(u)["lookup_ok"])

    def test_obfuscated_ip_detection(self):
        self.assertEqual(net_safety.numeric_ip("2130706433"), "127.0.0.1")
        self.assertEqual(net_safety.numeric_ip("0x7f000001"), "127.0.0.1")
        self.assertIsNone(net_safety.numeric_ip("example.com"))
        self.assertIsNone(net_safety.numeric_ip("8.8.8.8"))

    def test_non_shorteners_are_never_followed(self):
        with mock.patch.object(net_safety, "_one_hop") as hop:
            res = net_safety.expand_shortener("https://example.com/redirect?to=evil")
        hop.assert_not_called()
        self.assertFalse(res["is_shortener"])

    def test_shortener_expansion_never_contacts_destination(self):
        calls = []

        def fake_hop(url, ip, timeout):
            calls.append(url)
            return {"status": 302, "location": "https://evil.example.net/login", "tls_verified": True}

        with mock.patch.object(net_safety, "inspect_target", return_value={"safe": True, "ips": ["93.184.216.34"], "reason": None}), \
                mock.patch.object(net_safety, "_one_hop", side_effect=fake_hop):
            res = net_safety.expand_shortener("https://bit.ly/abc")
        self.assertEqual(calls, ["https://bit.ly/abc"])   # only the shortener was requested
        self.assertEqual(res["final_url"], "https://evil.example.net/login")
        self.assertTrue(res["chain"][-1].get("not_contacted"))


class TestProviders(unittest.TestCase):
    def setUp(self):
        for p in _unlimited_budgets():
            p.start()
            self.addCleanup(p.stop)

    def test_not_configured_is_reported_honestly(self):
        with mock.patch.object(settings, "GOOGLE_WEB_RISK_API_KEY", ""), mock.patch.object(settings, "URLHAUS_AUTH_KEY", ""):
            self.assertEqual(intel_clients.check_web_risk("http://a.example/")["status"], "not_configured")
            self.assertEqual(intel_clients.check_urlhaus("http://a.example/", "a.example")["status"], "not_configured")

    def test_web_risk_hit_and_miss(self):
        with mock.patch.object(settings, "GOOGLE_WEB_RISK_API_KEY", "k"):
            with mock.patch.object(intel_clients, "_http_json", return_value={"threat": {"threatTypes": ["SOCIAL_ENGINEERING"]}}):
                r = intel_clients.check_web_risk("http://wr-hit.example/x")
            self.assertEqual((r["status"], r["verdict"]), ("ok", "malicious"))
            with mock.patch.object(intel_clients, "_http_json", return_value={}):
                r = intel_clients.check_web_risk("http://wr-miss.example/x")
            self.assertEqual((r["status"], r["verdict"]), ("ok", "clean"))

    def test_web_risk_failure_is_error_not_clean(self):
        with mock.patch.object(settings, "GOOGLE_WEB_RISK_API_KEY", "k"), \
                mock.patch.object(intel_clients, "_http_json", side_effect=TimeoutError()):
            r = intel_clients.check_web_risk("http://wr-timeout.example/x")
        self.assertEqual(r["status"], "error")
        self.assertNotEqual(r["verdict"], "clean")

    def test_urlhaus_url_listed_online(self):
        with mock.patch.object(settings, "URLHAUS_AUTH_KEY", "k"), mock.patch.object(
                intel_clients, "_urlhaus_post", return_value={"query_status": "ok", "url_status": "online", "threat": "malware_download", "tags": ["x"]}):
            r = intel_clients.check_urlhaus("http://uh-hit.example/m.exe", "uh-hit.example")
        self.assertEqual((r["status"], r["verdict"]), ("ok", "malicious"))
        self.assertGreaterEqual(r["score"], 90)

    def test_urlhaus_no_results_is_clean_but_not_proof(self):
        with mock.patch.object(settings, "URLHAUS_AUTH_KEY", "k"), mock.patch.object(
                intel_clients, "_urlhaus_post", return_value={"query_status": "no_results"}):
            r = intel_clients.check_urlhaus("http://uh-miss.example/", "uh-miss.example")
        self.assertEqual(r["verdict"], "clean")
        self.assertIn("does not prove", r["note"])

    def test_urlscan_rejects_non_uuid_ids(self):
        with mock.patch.object(settings, "URLSCAN_API_KEY", "k"):
            self.assertEqual(intel_clients.urlscan_result("../../etc/passwd")["state"], "error")
            self.assertEqual(intel_clients.urlscan_result("not-a-uuid")["state"], "error")

    def test_urlscan_no_existing_scan_is_no_data(self):
        with mock.patch.object(settings, "URLSCAN_API_KEY", "k"), mock.patch.object(intel_clients, "_urlscan_get", return_value={"results": []}):
            r = intel_clients.check_urlscan("http://us-none.example/", "us-none.example")
        self.assertEqual(r["status"], "no_data")


class TestAnalyst(unittest.TestCase):
    def setUp(self):
        self.report = run_engine("http://paypa1-account-verification.xyz/login.php")

    def test_without_key_uses_rule_based_and_says_so(self):
        with mock.patch.object(settings, "GROQ_API_KEY", ""):
            out = ai_analyst.analyze(self.report)
        self.assertEqual(out["generated_by"], "rule-based")
        self.assertEqual(out["status"], "not_configured")
        self.assertTrue(out["recommendations"])

    def test_groq_output_is_parsed_and_sanitised(self):
        body = json.dumps({"choices": [{"message": {"content": json.dumps({
            "headline": "<b>Phishing</b> link", "summary": "It mimics PayPal.", "key_findings": ["<script>x</script>Brand mimic"],
            "phishing_techniques": ["Typosquatting"], "recommendations": ["Do not click."], "limitations": "No intel."})}}]}).encode()

        class Resp:
            def __enter__(self): return self
            def __exit__(self, *a): return False
            def read(self, n=-1): return body

        captured = {}

        def fake_open(req, timeout=0):
            captured["body"] = json.loads(req.data.decode())
            return Resp()

        with mock.patch.object(settings, "GROQ_API_KEY", "k"), mock.patch("urllib.request.urlopen", side_effect=fake_open):
            out = ai_analyst.analyze(self.report)
        self.assertEqual(out["status"], "ok")
        self.assertTrue(out["generated_by"].startswith("groq:"))
        self.assertNotIn("<", out["headline"] + "".join(out["key_findings"]))
        # the model is told to treat evidence as data and receives only the compact evidence bundle
        self.assertIn("UNTRUSTED", captured["body"]["messages"][0]["content"])
        self.assertNotIn("api_key", json.dumps(captured["body"]).lower())

    def test_groq_failure_falls_back_with_note(self):
        with mock.patch.object(settings, "GROQ_API_KEY", "k"), mock.patch("urllib.request.urlopen", side_effect=TimeoutError()):
            out = ai_analyst.analyze(self.report)
        self.assertEqual(out["generated_by"], "rule-based")
        self.assertEqual(out["status"], "error")
        self.assertIn("unavailable", out["note"])


class _Resp:
    def __init__(self, content):
        self._body = json.dumps({"choices": [{"message": {"content": json.dumps(content)}}]}).encode()

    def __enter__(self): return self
    def __exit__(self, *a): return False
    def read(self, n=-1): return self._body


def _opinion(p, c=1.0):
    return {"status": "ok", "probability": p, "confidence": c, "evidence_for": [], "evidence_against": [], "reasoning": "r"}


class TestReviewAgent(unittest.TestCase):
    def setUp(self):
        from backend.app.services import ai_agent
        self.agent = ai_agent
        self.unknown = run_engine("https://totally-unknown-example-site.com/home")   # UNVERIFIED, low score

    def test_agent_can_raise_score_within_the_cap(self):
        rev = self.agent.decide(self.unknown, _opinion(100, 1.0))
        self.assertTrue(rev["applied"])
        self.assertLessEqual(rev["adjustment"], self.agent.MAX_ADJUSTMENT)
        self.assertGreater(rev["final_score"], self.unknown["score"])

    def test_adjustment_is_scaled_by_confidence_and_ignores_noise(self):
        base = self.unknown["score"]
        self.assertEqual(self.agent.decide(self.unknown, _opinion(base + 3, 1.0))["adjustment"], 0.0)   # inside noise
        self.assertEqual(self.agent.decide(self.unknown, _opinion(100, 0.0))["adjustment"], 0.0)        # no confidence, no move
        hi = self.agent.decide(self.unknown, _opinion(base + 20, 1.0))["adjustment"]   # gap small enough to stay under the cap
        lo = self.agent.decide(self.unknown, _opinion(base + 20, 0.4))["adjustment"]
        self.assertEqual((hi, lo), (10.0, 4.0))

    def test_agent_cannot_lower_a_reputation_flagged_score(self):
        intel = missing()
        intel["Google Web Risk"] = make_result("Google Web Risk", "ok", "malicious", 92, "Listed as phishing.")
        flagged = run_engine("https://totally-unknown-example-site.com/home", intel)
        rev = self.agent.decide(flagged, _opinion(0, 1.0))
        self.assertFalse(rev["applied"])
        self.assertEqual(rev["final_score"], flagged["score"])
        self.assertIn("reputation source", rev["note"])

    def test_agent_never_touches_official_domains(self):
        official = run_engine("https://www.google.com/search?q=cybersecurity")
        rev = self.agent.decide(official, _opinion(100, 1.0))
        self.assertFalse(rev["applied"])
        self.assertEqual(rev["final_score"], official["score"])

    def test_failed_agent_leaves_the_engine_score_alone(self):
        for status in ("not_configured", "rate_limited", "error"):
            rev = self.agent.decide(self.unknown, {"status": status, "note": "x"})
            self.assertFalse(rev["applied"])
            self.assertEqual(rev["final_score"], self.unknown["score"])

    def test_malformed_model_output_is_rejected(self):
        for bad in ({}, {"probability": "high", "confidence": 1}, {"probability": float("nan"), "confidence": 1},
                    {"probability": True, "confidence": 1}, {"probability": 50}):
            with self.assertRaises(ValueError):
                self.agent._parse_opinion(bad)
        ok = self.agent._parse_opinion({"probability": 999, "confidence": 5, "reasoning": "<b>x</b>"})
        self.assertEqual((ok["probability"], ok["confidence"], ok["reasoning"]), (100.0, 1.0, "x"))

    def test_case_hides_engine_score_and_verdict(self):
        report = run_engine("http://paypa1-account-verification.xyz/login.php")
        ex = extract_features(report["url"])
        threats, _s, _r = RuleEngineService.evaluate(ex["features"], ex["details"])
        case = json.dumps(self.agent.build_case(report, threats, ex["features"], ex["details"]))
        self.assertNotIn('"score"', case)
        self.assertNotIn(report["verdict"], case)
        self.assertIn("paypa1", case)

    def test_consult_calls_groq_and_parses(self):
        out = {"probability": 85, "confidence": 0.8, "evidence_for": ["Brand mimic"], "evidence_against": [], "reasoning": "Looks like PayPal."}
        with mock.patch.object(settings, "GROQ_API_KEY", "k"), mock.patch.object(self.agent._budget, "allow", return_value=True), \
                mock.patch("urllib.request.urlopen", return_value=_Resp(out)):
            res = self.agent.consult({"url": "http://x.example"})
        self.assertEqual((res["status"], res["probability"], res["confidence"]), ("ok", 85.0, 0.8))

    def test_consult_without_key_or_on_failure_is_not_ok(self):
        with mock.patch.object(settings, "GROQ_API_KEY", ""):
            self.assertEqual(self.agent.consult({})["status"], "not_configured")
        with mock.patch.object(settings, "GROQ_API_KEY", "k"), mock.patch.object(self.agent._budget, "allow", return_value=True), \
                mock.patch("urllib.request.urlopen", side_effect=TimeoutError()):
            self.assertEqual(self.agent.consult({})["status"], "error")

    def test_applied_review_updates_verdict_and_is_audited(self):
        from backend.app.services.threat_engine import apply_agent_review
        report = run_engine("https://totally-unknown-example-site.com/home")
        before = report["score"]
        review = self.agent.decide(report, _opinion(100, 1.0))
        apply_agent_review(report, review)
        self.assertTrue(report["ai_influences_score"])
        self.assertEqual(report["engine_score"], before)
        self.assertEqual(report["score"], review["final_score"])
        self.assertEqual(report["agent_review"]["adjustment"], review["adjustment"])
        self.assertEqual(report["score_path"][-1]["value"], report["score"])

    def test_unapplied_review_changes_nothing_but_is_attached(self):
        from backend.app.services.threat_engine import apply_agent_review
        report = run_engine("https://totally-unknown-example-site.com/home")
        snapshot = (report["score"], report["verdict"])
        apply_agent_review(report, self.agent.decide(report, {"status": "error", "note": "x"}))
        self.assertEqual((report["score"], report["verdict"]), snapshot)
        self.assertFalse(report["ai_influences_score"])
        self.assertIn("agent_review", report)


class TestSecretHandling(unittest.TestCase):
    def setUp(self):
        for p in _unlimited_budgets():
            p.start()
            self.addCleanup(p.stop)

    KEY = "fake0123456789abcdef" * 3  # obviously fake, never a real credential

    def test_pasted_keys_are_whitespace_trimmed(self):
        import subprocess
        env = dict(os.environ, VIRUSTOTAL_API_KEY="  " + self.KEY + "\n", GROQ_MODEL=" openai/gpt-oss-120b \n")
        out = subprocess.run(
            [sys.executable, "-c", "from backend.app.core.config import settings as s; print(repr(s.VIRUSTOTAL_API_KEY), repr(s.GROQ_MODEL))"],
            cwd=ROOT, env=env, capture_output=True, text=True)
        self.assertIn(repr(self.KEY), out.stdout)
        self.assertIn("'openai/gpt-oss-120b'", out.stdout)

    def test_exception_text_with_the_key_never_reaches_the_result(self):
        err = ValueError("Invalid header value b'%s\\n'" % self.KEY)
        with mock.patch.object(settings, "VIRUSTOTAL_API_KEY", self.KEY), \
                mock.patch("urllib.request.urlopen", side_effect=err):
            r = intel_clients.check_virustotal("http://secret-leak-test.example/x")
        self.assertEqual(r["status"], "error")
        self.assertNotIn(self.KEY, json.dumps(r))

    def test_redact_removes_configured_keys(self):
        from backend.app.services.intel_common import redact
        with mock.patch.object(settings, "GROQ_API_KEY", "gsk_" + "a" * 40):
            self.assertNotIn("a" * 40, redact("boom gsk_" + "a" * 40 + " boom"))
            self.assertIn("[redacted]", redact("boom gsk_" + "a" * 40))


class TestAnalystAudience(unittest.TestCase):
    def test_operator_advice_is_filtered_out_of_recommendations(self):
        recs = [
            "Open the link only in a trusted browser.",
            "Consider configuring additional reputation services (Google Web Risk, URLhaus, urlscan.io).",
            "Add the API keys on the server to enable more checks.",
            "Do not enter passwords on the page.",
        ]
        kept = ai_analyst.user_recommendations(recs)
        self.assertEqual(kept, ["Open the link only in a trusted browser.", "Do not enter passwords on the page."])

    def test_groq_recommendations_never_tell_the_user_to_configure_services(self):
        report = run_engine("https://totally-unknown-example-site.com/home")
        body = json.dumps({"choices": [{"message": {"content": json.dumps({
            "headline": "Unverified link", "summary": "No source confirmed it.",
            "key_findings": ["No reputation source answered"],
            "recommendations": ["Consider configuring more reputation services.", "Avoid entering passwords until verified."],
            "limitations": "Several sources are not configured."})}}]}).encode()

        class Resp:
            def __enter__(self): return self
            def __exit__(self, *a): return False
            def read(self, n=-1): return body

        with mock.patch.object(settings, "GROQ_API_KEY", "k"), mock.patch("urllib.request.urlopen", return_value=Resp()):
            out = ai_analyst.analyze(report)
        self.assertEqual(out["recommendations"], ["Avoid entering passwords until verified."])
        self.assertIn("not configured", out["limitations"])  # honest gaps stay in limitations

    def test_all_operator_advice_falls_back_to_rule_based_actions(self):
        report = run_engine("https://totally-unknown-example-site.com/home")
        body = json.dumps({"choices": [{"message": {"content": json.dumps({
            "headline": "h", "summary": "s", "key_findings": [],
            "recommendations": ["Configure the API keys."], "limitations": "l"})}}]}).encode()

        class Resp:
            def __enter__(self): return self
            def __exit__(self, *a): return False
            def read(self, n=-1): return body

        with mock.patch.object(settings, "GROQ_API_KEY", "k"), mock.patch("urllib.request.urlopen", return_value=Resp()):
            out = ai_analyst.analyze(report)
        self.assertTrue(out["recommendations"])
        self.assertFalse(any(ai_analyst._OPERATOR_ADVICE.search(r) for r in out["recommendations"]))

    def test_rule_based_actions_are_user_facing_for_every_verdict(self):
        for v in ("DANGEROUS", "SUSPICIOUS", "SAFE", "UNVERIFIED"):
            rb = ai_analyst.rule_based({"verdict": v, "score": 10, "confidence": {"label": "LOW"}, "reasons": [], "limitations": []})
            self.assertFalse(any(ai_analyst._OPERATOR_ADVICE.search(r) for r in rb["recommendations"]), v)


if __name__ == "__main__":
    unittest.main()
