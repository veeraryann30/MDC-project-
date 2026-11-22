"""
Unified threat engine, SSRF guard, provider clients and AI analyst.
All third-party HTTP is mocked: the tests prove how real responses are interpreted and that
missing/failed sources are never reported as clean.
"""
import json
import os
import sys
import unittest
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


if __name__ == "__main__":
    unittest.main()
