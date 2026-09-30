import React, { useState } from 'react';
import { 
  BookOpen, ShieldAlert, CheckCircle2, AlertTriangle, HelpCircle, 
  ArrowRight, Sparkles, Award, Lock, ExternalLink, QrCode, Globe, Key, Clock, Terminal
} from 'lucide-react';

export default function Learn() {
  const [selectedLesson, setSelectedLesson] = useState(0);
  const [quizMode, setQuizMode] = useState(false);
  const [quizAnswers, setQuizAnswers] = useState({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);

  const lessons = [
    {
      id: 'karpathy_principles',
      title: "Karpathy's First-Principles Threat Framework",
      category: 'Analyst Methodology',
      icon: Terminal,
      what: "Adapted from Andrej Karpathy's core engineering guidelines: Think Before Clicking, Simplicity First, Surgical Inspection, and Goal-Driven Verification.",
      how: "Phishers rely on human haste, urgency, and assumed trust. Applying first-principles reasoning breaks the social engineering spell.",
      detect: "Ask 4 questions: 1. Am I assuming this is safe? 2. What is the simplest root domain here? 3. Can I surgically inspect the spelling character-by-character? 4. Can I verify the request through an independent official channel?",
      safe: "Follow the foundational rule: Don't assume. Don't hide confusion. When in doubt, stop immediately, don't click, and verify."
    },
    {
      id: 'lookalike',
      title: 'Lookalike Domains (Typosquatting)',
      category: 'Domain & Identity',
      icon: Globe,
      what: 'Typosquatting involves registering domain names that intentionally look or sound almost identical to established brands (e.g., "paypa1.com", "g00gle.com", "appie.com").',
      how: 'Attackers purchase domains with subtle misspellings, character replacements (like "rn" instead of "m" or numbers for letters), hoping victims fail to notice the slight variation.',
      detect: 'Carefully scrutinize every character of the domain label before the TLD. Watch for transposed letters, extra hyphens ("paypal-verify.com"), or suspicious number substitutes.',
      safe: 'Use bookmarks for banking and email accounts rather than clicking links in messages. Check the address bar font carefully.'
    },
    {
      id: 'fake_login',
      title: 'Fake Login Pages & Credential Harvesting',
      category: 'Social Engineering',
      icon: Key,
      what: 'Cloned web pages that precisely mimic legitimate sign-in gateways (like Google Accounts, Microsoft 365, or Netflix) designed to capture credentials in plaintext.',
      how: 'Phishers rip the legitimate CSS, logos, and layout, but direct the login form submission POST request to an attacker-controlled server or database.',
      detect: 'Always examine the URL host. Even if the page looks 100% identical to Microsoft 365, if the domain is not "login.microsoftonline.com", it is a fake.',
      safe: 'Use a password manager. Password managers match domains strictly and will refuse to auto-fill your credentials into a spoofed URL.'
    },
    {
      id: 'url_manipulation',
      title: 'URL Manipulation & Subdomain Stacking',
      category: 'Structure & Obfuscation',
      icon: Lock,
      what: 'Tricking the reader by placing a trusted company name into the subdomain or directory while hosting the site on a completely unrelated root domain.',
      how: 'For example, in "http://paypal.com.account-security.net/verify", attackers exploit how humans read left-to-right. The user sees "paypal.com", but the actual root domain is "account-security.net".',
      detect: 'Find the first single slash "/" in the URL. Then read backwards to the last two labels (or three for country TLDs). That is the true website owner.',
      safe: 'On mobile devices, tap the URL bar to view the full host without truncation.'
    },
    {
      id: 'punycode',
      title: 'Punycode & IDN Homograph Attacks',
      category: 'Domain & Identity',
      icon: ShieldAlert,
      what: 'Exploiting Internationalized Domain Names (IDN) by using foreign alphabets (Cyrillic, Greek) that have glyphs visually identical to Latin characters.',
      how: 'The Cyrillic letter "а" (U+0430) looks identical to Latin "a" (U+0061). In browsers, this translates to "xn--...". An attacker can display what looks like "apple.com" to human eyes.',
      detect: 'Look for "xn--" prefixes in raw URLs. Security scanners like Catch the Phish automatically flag Punycode characters on brand lookalikes.',
      safe: 'Configure browsers or use security extensions that display raw Punycode instead of Unicode representations.'
    },
    {
      id: 'shortened',
      title: 'Shortened URLs & Hidden Destinations',
      category: 'Structure & Obfuscation',
      icon: ExternalLink,
      what: 'Using redirection services like bit.ly, tinyurl, or t.co to completely conceal where a link actually leads.',
      how: 'Attackers compress malicious phishing URLs to hide suspicious domains and bypass initial email/SMS spam filters.',
      detect: 'Never assume a shortened URL is harmless. You cannot evaluate safety by inspecting a shortened string alone.',
      safe: 'Use URL expansion tools (or append "+" to bit.ly links) to preview the destination before clicking.'
    },
    {
      id: 'credential_theft',
      title: 'Spearphishing & Credential Theft',
      category: 'Social Engineering',
      icon: AlertTriangle,
      what: 'Targeted phishing directed at specific individuals or companies utilizing personalized reconnaissance data.',
      how: 'Attackers research your LinkedIn, colleagues, or projects to craft convincing emails claiming to be your manager, IT department, or vendor asking for credentials.',
      detect: 'Check the sender’s full email address (not just display name) and look for urgency demands ("Immediate action required").',
      safe: 'Establish an out-of-band verification protocol (call your coworker or IT desk via official phone) before acting on sensitive requests.'
    },
    {
      id: 'fake_payment',
      title: 'Fake Payment & Banking Gateways',
      category: 'Financial Fraud',
      icon: Award,
      what: 'Counterfeit payment processor interfaces asking for credit card numbers, CVVs, PINs, or bank account routing numbers.',
      how: 'Often delivered via fake delivery failure notifications (DHL, FedEx, USPS) asking for a $1.50 re-delivery fee to harvest credit card details.',
      detect: 'Legitimate postal services will not demand credit card payments on strange domains (.top, .xyz) for missed parcels.',
      safe: 'Never pay fees via unsolicited text links. Go directly to the official courier tracking portal.'
    },
    {
      id: 'urgency',
      title: 'Urgency & Fear-Based Triggers',
      category: 'Social Engineering',
      icon: Clock,
      what: 'Psychological manipulation leveraging artificial urgency, fear, or panic to bypass rational evaluation.',
      how: 'Phrases like "Account Suspended in 24 Hours", "Unauthorized Wire Transfer Alert", or "Tax Penalty Notice" push victims into reacting hastily.',
      detect: 'Whenever a message creates sudden panic, take a deep breath. Stop, don\'t click, and inspect the link first.',
      safe: 'Directly visit the official platform through a trusted app or separate browser window.'
    },
    {
      id: 'qr_phishing',
      title: 'QR Code Phishing (Quishing)',
      category: 'Physical & Digital Vectors',
      icon: QrCode,
      what: 'Replacing legitimate QR codes or embedding QR codes in emails to shift victims from secure computers to unmonitored mobile phones.',
      how: 'Attackers paste sticker QR codes over parking meters or embed them in emails ("Scan to authenticate 2FA").',
      detect: 'Most phone camera apps preview the URL before opening it. Look closely at the domain in the preview bubble.',
      safe: 'Treat physical and emailed QR codes as untrusted hyperlinks. Never scan QR codes from unexpected emails.'
    },
    {
      id: 'social_engineering',
      title: 'Social Engineering & Pretexting',
      category: 'Social Engineering',
      icon: HelpCircle,
      what: 'The broader art of human deception—fabricating plausible scenarios (pretexts) to trick people into divulging confidential information.',
      how: 'Scammers pose as authority figures, tech support, HR personnel, or legal representatives.',
      detect: 'Be skeptical of unexpected requests for sensitive data, passwords, or gift card purchases.',
      safe: 'Remember: Real IT administrators will NEVER ask you for your password or two-factor code.'
    }
  ];

  // Interactive Quiz Questions
  const quizQuestions = [
    {
      id: 1,
      scenario: 'You receive an urgent SMS: "Your Bank account has been locked. Verify identity at: http://192.168.1.55:8080/bank/login.php"',
      options: [
        { text: 'A. Safe: The port 8080 indicates a high-security banking server.', isCorrect: false },
        { text: 'B. Phishing: Legitimate banks use registered domains with HTTPS, never raw IP addresses with non-standard ports.', isCorrect: true },
        { text: 'C. Safe: It has "bank" in the path name so it belongs to a verified financial institution.', isCorrect: false }
      ],
      explanation: 'Banks never host public consumer login portals on raw numeric IP addresses or non-standard ports like 8080.'
    },
    {
      id: 2,
      scenario: 'You are presented with this URL: "http://paypal.com.customer-identity-check.xyz/login"',
      options: [
        { text: 'A. Safe because "paypal.com" appears at the beginning of the URL.', isCorrect: false },
        { text: 'B. Phishing: "paypal.com" is just a subdomain; the actual destination domain is "customer-identity-check.xyz".', isCorrect: true },
        { text: 'C. Safe because it contains the keyword "login".', isCorrect: false }
      ],
      explanation: 'Attackers use subdomain stacking to trick users. The real domain owner is the label immediately before the TLD (.xyz).'
    },
    {
      id: 3,
      scenario: 'A website has a green padlock and says "https://secure-login-apple-id.top/login". Does the padlock mean the website is legitimate?',
      options: [
        { text: 'A. Yes, HTTPS and the padlock guarantee that the website is officially certified and safe.', isCorrect: false },
        { text: 'B. No, HTTPS only encrypts the traffic. Attackers easily obtain free SSL certificates for phishing domains.', isCorrect: true },
        { text: 'C. Yes, only authorized corporations are allowed to obtain SSL certificates.', isCorrect: false }
      ],
      explanation: 'Over 80% of modern phishing websites utilize HTTPS encryption. HTTPS guarantees encryption in transit, NOT the trustworthiness of the domain owner.'
    },
    {
      id: 4,
      scenario: 'You notice a link displayed as "http://paypa1.com/signin". What phishing technique is being used?',
      options: [
        { text: 'A. Typosquatting / Character Substitution (replacing lowercase "l" with number "1").', isCorrect: true },
        { text: 'B. Cross-Site Scripting (XSS).', isCorrect: false },
        { text: 'C. SQL Injection.', isCorrect: false }
      ],
      explanation: 'The digit "1" is substituted for "l" in "paypal", creating a visually similar deceptive domain.'
    },
    {
      id: 5,
      scenario: 'What is the purpose of an "@" symbol inside a link like "http://google.com@evil-site.com"?',
      options: [
        { text: 'A. It sends an email directly to Google.', isCorrect: false },
        { text: 'B. Everything before the "@" is treated as username credentials, directing the browser to "evil-site.com".', isCorrect: true },
        { text: 'C. It enables Google Authenticator verification.', isCorrect: false }
      ],
      explanation: 'In the URL standard (RFC 3986), characters before "@" are treated as userinfo, directing traffic solely to the host following the "@".'
    },
    {
      id: 6,
      scenario: 'You scan a link that shows "xn--gogle-pra.com". What attack vector does this signify?',
      options: [
        { text: 'A. Zero-day Buffer Overflow.', isCorrect: false },
        { text: 'B. Punycode / IDN Homograph attack designed to mimic foreign glyphs as Latin letters.', isCorrect: true },
        { text: 'C. Standard German domain encoding.', isCorrect: false }
      ],
      explanation: '"xn--" indicates Punycode encoding, where Cyrillic or other foreign characters are used to visually clone legitimate English domains.'
    }
  ];

  const handleSelectAnswer = (qId, optionIdx) => {
    if (quizSubmitted) return;
    setQuizAnswers(prev => ({ ...prev, [qId]: optionIdx }));
  };

  const calculateScore = () => {
    let score = 0;
    quizQuestions.forEach(q => {
      const selected = quizAnswers[q.id];
      if (selected !== undefined && q.options[selected].isCorrect) {
        score++;
      }
    });
    return score;
  };

  const activeLesson = lessons[selectedLesson];
  const LessonIcon = activeLesson.icon;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-black/60 border border-orange-500/40 text-orange-400 text-xs font-mono mb-2">
            <BookOpen className="w-3.5 h-3.5" />
            <span>Phishing Awareness Academy</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tight">
            Learn Phishing Detection
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Master the anatomy of social engineering, lookalike domains, and credential harvesters.
          </p>
        </div>

        {/* Mode Toggle */}
        <div className="flex rounded-xl bg-[#090C13] border border-[#1C2230] p-1">
          <button
            onClick={() => setQuizMode(false)}
            className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${
              !quizMode ? 'bg-[#FF6B00] text-black font-black' : 'text-slate-400 hover:text-white'
            }`}
          >
            10 Lesson Modules
          </button>
          <button
            onClick={() => setQuizMode(true)}
            className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
              quizMode ? 'bg-[#FF6B00] text-black font-black' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            <span>Phishing IQ Quiz</span>
          </button>
        </div>
      </div>

      {!quizMode ? (
        /* 10 Interactive Lessons Layout */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Sidebar Lesson Selector */}
          <div className="lg:col-span-4 space-y-2">
            <h3 className="text-xs font-mono uppercase tracking-wider text-slate-400 font-bold px-2 mb-2">
              Select Attack Vector ({lessons.length})
            </h3>
            <div className="space-y-1.5">
              {lessons.map((lesson, idx) => {
                const Icon = lesson.icon;
                const isSelected = selectedLesson === idx;
                return (
                  <button
                    key={lesson.id}
                    onClick={() => setSelectedLesson(idx)}
                    className={`w-full text-left p-3 rounded-xl border transition-all flex items-center gap-3 ${
                      isSelected
                        ? 'bg-orange-950/40 border-orange-500/60 text-orange-300 shadow-[0_0_15px_rgba(255,107,0,0.18)]'
                        : 'bg-[#090C13] border-[#1C2230] text-slate-400 hover:text-white hover:bg-slate-800/40'
                    }`}
                  >
                    <div className={`p-2 rounded-lg ${isSelected ? 'bg-orange-500/20 text-orange-400' : 'bg-slate-800 text-slate-400'}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="truncate">
                      <div className="text-xs font-bold text-white truncate">
                        {lesson.title}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {lesson.category}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Lesson Detail View */}
          <div className="lg:col-span-8">
            <div className="p-6 sm:p-8 rounded-3xl bg-[#090C13] border border-[#1C2230] space-y-6">
              {/* Header */}
              <div className="flex items-center gap-4 border-b border-[#1C2230] pb-5">
                <div className="p-3 rounded-2xl bg-orange-950/40 border border-orange-500/40 text-orange-400">
                  <LessonIcon className="w-7 h-7" />
                </div>
                <div>
                  <span className="text-[11px] font-mono text-orange-400 uppercase tracking-wider font-semibold">
                    {activeLesson.category}
                  </span>
                  <h2 className="text-xl sm:text-2xl font-bold text-white">
                    {activeLesson.title}
                  </h2>
                </div>
              </div>

              {/* 4 Core Pillars */}
              <div className="space-y-6 text-xs sm:text-sm">
                {/* 1. What is it? */}
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-orange-400 font-bold uppercase tracking-wider text-xs font-mono">
                    <Sparkles className="w-4 h-4" />
                    <span>1. What Is It?</span>
                  </div>
                  <p className="text-slate-300 pl-6 leading-relaxed">
                    {activeLesson.what}
                  </p>
                </div>

                {/* 2. How attackers use it */}
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-rose-400 font-bold uppercase tracking-wider text-xs font-mono">
                    <AlertTriangle className="w-4 h-4" />
                    <span>2. How Attackers Use It</span>
                  </div>
                  <p className="text-slate-300 pl-6 leading-relaxed">
                    {activeLesson.how}
                  </p>
                </div>

                {/* 3. How to detect it */}
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-amber-400 font-bold uppercase tracking-wider text-xs font-mono">
                    <HelpCircle className="w-4 h-4" />
                    <span>3. How to Detect It</span>
                  </div>
                  <p className="text-slate-300 pl-6 leading-relaxed">
                    {activeLesson.detect}
                  </p>
                </div>

                {/* 4. How to stay safe */}
                <div className="space-y-1.5 p-4 rounded-2xl bg-orange-950/20 border border-orange-500/30">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold uppercase tracking-wider text-xs font-mono">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>4. How to Stay Safe</span>
                  </div>
                  <p className="text-slate-200 pl-6 leading-relaxed font-medium">
                    {activeLesson.safe}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Interactive Phishing IQ Quiz */
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="p-6 rounded-2xl bg-[#090C13] border border-[#1C2230] text-center space-y-2">
            <h2 className="text-xl font-bold text-white">Phishing IQ Challenge</h2>
            <p className="text-xs text-slate-400">
              Evaluate real-world URL scenarios and determine whether each link is safe or an attack vector.
            </p>
            {quizSubmitted && (
              <div className="mt-4 p-4 rounded-xl bg-orange-950/60 border border-orange-500/50 inline-block font-mono">
                <div className="text-2xl font-bold text-orange-400">
                  Your Score: {calculateScore()} / {quizQuestions.length}
                </div>
                <div className="text-xs text-slate-300 mt-1">
                  {calculateScore() >= 5 ? '🏆 Cybersecurity Master!' : 'Keep practicing with the 10 lesson modules!'}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-4">
            {quizQuestions.map((q, idx) => {
              const selectedOpt = quizAnswers[q.id];
              return (
                <div key={q.id} className="p-5 rounded-2xl bg-[#090C13] border border-[#1C2230] space-y-3">
                  <div className="text-xs font-mono text-orange-400 font-semibold uppercase">
                    Scenario #{idx + 1}
                  </div>
                  <p className="text-sm font-semibold text-white bg-[#06080E] p-3 rounded-xl border border-[#1C2230] font-mono">
                    {q.scenario}
                  </p>

                  <div className="space-y-2 pt-1">
                    {q.options.map((opt, optIdx) => {
                      const isChosen = selectedOpt === optIdx;
                      let optionClasses = 'bg-[#06080E] border-[#1C2230] text-slate-300 hover:bg-slate-800';
                      if (isChosen) {
                        optionClasses = 'bg-orange-950/60 border-orange-500 text-orange-300';
                      }
                      if (quizSubmitted) {
                        if (opt.isCorrect) {
                          optionClasses = 'bg-emerald-950/80 border-emerald-500 text-emerald-300';
                        } else if (isChosen && !opt.isCorrect) {
                          optionClasses = 'bg-rose-950/80 border-rose-500 text-rose-300';
                        }
                      }

                      return (
                        <button
                          key={optIdx}
                          onClick={() => handleSelectAnswer(q.id, optIdx)}
                          className={`w-full text-left p-3 rounded-xl border text-xs transition-all flex items-center justify-between ${optionClasses}`}
                        >
                          <span>{opt.text}</span>
                          {quizSubmitted && opt.isCorrect && (
                            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {quizSubmitted && (
                    <div className="pt-2 text-xs text-slate-400 font-mono bg-black/40 p-2.5 rounded-lg border border-[#1C2230]">
                      <strong className="text-orange-400">Explanation: </strong>
                      {q.explanation}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="text-center pt-4">
            {!quizSubmitted ? (
              <button
                onClick={() => setQuizSubmitted(true)}
                disabled={Object.keys(quizAnswers).length < quizQuestions.length}
                className="px-8 py-3 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 disabled:opacity-50 text-black font-black text-xs uppercase tracking-wider rounded-xl shadow-[0_0_20px_rgba(255,107,0,0.3)] transition-all cursor-pointer"
              >
                Submit Answers & View Grade
              </button>
            ) : (
              <button
                onClick={() => {
                  setQuizAnswers({});
                  setQuizSubmitted(false);
                }}
                className="px-6 py-2.5 bg-[#06080E] border border-[#1C2230] hover:border-orange-500 text-slate-300 text-xs font-mono uppercase tracking-wider rounded-xl transition-all cursor-pointer"
              >
                Reset & Try Again
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
