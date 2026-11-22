# Threat Intelligence, Scoring and Security Model

Catch the Phish judges every URL and every URL found in a QR code with one engine
(`backend/app/services/threat_engine.py`). This page explains how to enable each source, how the
score is built, and the safeguards around outbound requests.

## 1. Environment variables

All keys are **server-side only**. Locally, copy `.env.example` to `.env` in the project root (git-ignored); it is
loaded when the backend starts, and real environment variables always take precedence. On Render, set them in the
dashboard. The
frontend never receives a key. Every key is optional: a missing key is shown as *Not configured* in the
result, never silently treated as "clean".

| Variable | Purpose | Where to get it |
|---|---|---|
| `VIRUSTOTAL_API_KEY` | Multi-engine URL reputation (malicious / suspicious counts) | virustotal.com -> profile -> API key (free tier: 4 lookups/min, 500/day) |
| `GOOGLE_WEB_RISK_API_KEY` | Phishing, malware and unwanted-software lists | Google Cloud console -> enable **Web Risk API** -> Credentials -> API key (restrict the key to that API) |
| `URLHAUS_AUTH_KEY` | Malware-distribution URLs and hosts | free key at auth.abuse.ch |
| `URLSCAN_API_KEY` | Existing scan lookup + optional deep behavioural scan | urlscan.io -> profile -> API keys |
| `GROQ_API_KEY` | AI analyst explanations (Llama) | console.groq.com/keys |
| `GROQ_MODEL` | Model id (default `openai/gpt-oss-120b`) | console.groq.com/docs/models (Groq retires models; if calls return 404, pick a current one) |
| `VT_REQUESTS_PER_MINUTE`, `WEB_RISK_REQUESTS_PER_MINUTE`, `URLHAUS_REQUESTS_PER_MINUTE`, `URLSCAN_SEARCH_PER_MINUTE`, `URLSCAN_SUBMIT_PER_MINUTE`, `GROQ_REQUESTS_PER_MINUTE` | Outbound call budgets (defaults fit free tiers) | - |
| `INTEL_CACHE_TTL_SECONDS` | How long provider answers are cached (default 3600) | - |
| `SCAN_RATE_LIMIT_PER_MINUTE` | Per-IP limit on scan endpoints (default 20) | - |

Existing variables (`APP_ENV`, `AUTH_SECRET_KEY`, `CORS_ORIGINS`, `DATABASE_URL`, `RATE_LIMIT_PER_MINUTE`,
`MAX_UPLOAD_BYTES`, `VITE_API_URL`) are unchanged. The dashboard's **Detection engines** panel shows which keys
are configured and the result of the last real call to each service.

## 2. What each source does

* **VirusTotal** - read-only report lookup (the URL is never submitted for a new scan). One engine flag is weak
  (score 50, suspicious); several are strong. A report analysed by fewer than 10 engines is "not enough to judge".
* **Google Web Risk** - authoritative blocklist match (score 92 for phishing/malware, 70 for unwanted software).
* **URLhaus** - exact URL match (95 online / 80 offline) or host match (70 / 50).
* **urlscan.io** - searches *existing* results for the URL/domain (no visit). The **deep scan** button submits the URL
  as *unlisted*; urlscan.io's own servers then load the page and report redirects, requests and brand impersonation.
  It only runs when the user clicks it.
* **Groq AI analyst** - writes the explanation, recommendations and limitations from the evidence bundle. If Groq is
  missing or fails, a deterministic rule-based explanation of the same evidence is shown and labelled as such.

Privacy: lookups send the URL (credentials and fragment removed) to the providers. URLs that resolve to private or
internal addresses are **never** sent to any third party.

## 3. How the score is built

1. **Local score** = 50% ML + 50% rules (existing scorer, including its high-severity floors). The ML value is
   0.7 x Random Forest + 0.3 x Logistic Regression (they read the same features as the rules, so they are blended,
   not added).
2. **Reputation score** = the *strongest* flagging source, plus at most +8 for independent corroboration. VirusTotal
   already aggregates feeds such as Safe Browsing and URLhaus, so scores are never summed.
3. **Final score** = the higher of the two (and of a short link's destination score). 0-30 SAFE, 31-60 SUSPICIOUS,
   61-100 DANGEROUS.
4. **Unverified**: a score of 30 or less with no independent confirmation (a clean reputation answer or an official
   brand domain) is reported as **UNVERIFIED**, never SAFE. Unknown is not safe.
5. **Conflicts** (reputation clean but heuristics high, reputation malicious but structure ordinary, ML models
   disagree) are shown and lower the confidence. Missing sources reduce confidence and are listed under
   "What could not be checked".
6. **The AI never changes the score**; this also keeps prompt injection in a page or URL from influencing a verdict.

## 4. Security model

* **SSRF**: the server only contacts a host after resolving it and confirming every address is public
  (loopback, private, link-local, cloud-metadata, CGNAT, reserved, IPv4-mapped IPv6 and decimal/hex IP spellings are
  rejected). Connections are pinned to the validated address (no DNS rebinding).
* **No automatic visits**: scanned URLs are never fetched. Short links are expanded by asking only the *shortener*
  for its `Location` header; the destination it points to is analysed, never contacted. Redirects are not followed.
  TLS certificates are read with a handshake only (no HTTP request) and only for hosts not already flagged.
* **Provider calls** disable redirects (keys never follow a redirect to another host), cap response size, time out,
  are cached, and respect per-provider budgets. HTTP 429 and failures are shown as *Rate limited* / *Unavailable*.
* **Rate limiting**: scan endpoints are limited per IP (`SCAN_RATE_LIMIT_PER_MINUTE`); bulk scans cost 5 and skip
  external lookups and AI to protect API quotas.
* **QR uploads**: extension + magic-byte + size checks, image dimensions read from the header before decoding
  (decompression-bomb guard), PDF page cap, filename sanitised, and the file is decoded in memory and never stored.
* **Validation**: URL length/control-character checks, UUID validation for urlscan ids, URLs with credentials or
  non-web schemes are never sent anywhere.

## 5. Verifying a deployment

1. Start the API and open the dashboard: each configured service shows *Ready*; after a scan it shows *Online* (or
   *Degraded* with the last error).
2. Scan a URL from a public phishing feed (for example one listed on urlhaus.abuse.ch/browse). With the keys set,
   URLhaus/VirusTotal should flag it and the verdict should be DANGEROUS with higher confidence.
3. Run `python -m unittest tests.test_threat_engine` (mocked providers) and the existing suite.

## 6. Known limits

* A brand-new phishing page can be unlisted everywhere; the engine keeps strong local evidence in that case, but
  a page with no local signals and no listings can only be UNVERIFIED.
* Provider free tiers are small. The in-memory cache and budgets are per process; with several workers each has its
  own (use a shared cache such as Redis if you scale out).
* Only the first QR payload is analysed; all decoded payloads are listed.
