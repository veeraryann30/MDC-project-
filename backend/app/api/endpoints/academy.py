"""
Scam Awareness Academy Endpoints for Catch the Phish (Module 8)
Interactive learning curriculum, simulated scam laboratories, and verified knowledge quizzes.
"""

from datetime import datetime
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from backend.app.database.session import get_db
from backend.app.database.models import AcademyProgress
from backend.app.security.auth import get_current_user_optional

router = APIRouter(prefix="/academy", tags=["Scam Awareness Academy"])

ACADEMY_MODULES = [
    {
        "id": "upi_fraud",
        "title": "UPI & Payment App Deception",
        "category": "Payment Security",
        "read_time": "5 min",
        "summary": "How attackers misuse 'Collect Request' QR codes to drain bank accounts while pretending to refund money.",
        "key_takeaways": [
            "Entering a UPI PIN ALWAYS deducts money from your account. PIN is never required to receive funds.",
            "Never scan a QR code sent over WhatsApp or SMS to claim a lottery, reward, or marketplace payment.",
            "Decline unknown UPI collect requests immediately."
        ],
        "simulated_scenario": {
            "type": "Fake Olx Buyer",
            "message": "I want to buy your table. I am sending ₹5,000 via GooglePay QR code. Scan this code and enter PIN to accept money into your account.",
            "red_flags": ["Request to scan QR code to receive money", "Entering UPI PIN to get credit"]
        }
    },
    {
        "id": "recruitment_fraud",
        "title": "Recruitment & Fake Internship Scams",
        "category": "Career Safety",
        "read_time": "6 min",
        "summary": "Targeting students and fresh graduates with guaranteed work-from-home offers requiring upfront registration fees.",
        "key_takeaways": [
            "Legitimate enterprise employers never charge registration fees, training fees, or equipment security deposits.",
            "Unsolicited job offer letters sent without any formal interview are always fraudulent.",
            "Check the recruiter's official email domain. Reputable corporate hiring managers do not use free @gmail.com accounts."
        ],
        "simulated_scenario": {
            "type": "Amazon WFH Impersonation",
            "message": "Congratulations! Selected as Amazon Data Specialist. Salary ₹45,000/month. Pay ₹1,200 training kit fee to activate your employee ID.",
            "red_flags": ["Upfront fee demand", "No technical assessment", "Sent from personal Gmail address"]
        }
    },
    {
        "id": "crypto_ponzi",
        "title": "High-Yield Investment & Crypto Ponzi Schemes",
        "category": "Financial Defense",
        "read_time": "7 min",
        "summary": "Pig-butchering romance scams, fake trading apps, and impossible 200% guaranteed return guarantees.",
        "key_takeaways": [
            "No financial product or trading algorithm can guarantee daily or zero-risk profits.",
            "Beware of 'advance withdrawal taxes'—scammers freeze fake dashboard profits to extort more deposits.",
            "Never share your 12-word or 24-word cryptocurrency wallet seed phrase with anyone."
        ],
        "simulated_scenario": {
            "type": "Telegram VIP Trading Bot",
            "message": "Deposit 0.05 BTC into our AI arbitrage pool. Guaranteed 15% daily returns. Withdraw anytime. Pay 10% gas fee to unlock your earnings.",
            "red_flags": ["Guaranteed return claim", "Advance fee to withdraw existing funds"]
        }
    },
    {
        "id": "email_phishing",
        "title": "Enterprise Email Phishing & Spoofing",
        "category": "Social Engineering",
        "read_time": "6 min",
        "summary": "Header spoofing, Lookalike homoglyph domains, and fake password expiration alerts.",
        "key_takeaways": [
            "Always inspect the sender's actual email address, not just the friendly display name.",
            "Verify cryptographic SPF/DKIM flags in mail clients.",
            "Never enter corporate single sign-on (SSO) credentials on domains not belonging to your company."
        ],
        "simulated_scenario": {
            "type": "Office365 Urgent Password Reset",
            "message": "IT Helpdesk: Your Microsoft password expires in 2 hours. Keep current password by logging into http://office365-verify.click/login",
            "red_flags": ["Artificial urgency deadline", "Suspicious .click TLD", "Credential harvesting link"]
        }
    },
    {
        "id": "banking_kyc",
        "title": "Banking KYC & Pan Card Suspension Traps",
        "category": "Banking Defense",
        "read_time": "5 min",
        "summary": "Urgent SMS warnings threatening immediate account deactivation unless an unverified APK or form is submitted.",
        "key_takeaways": [
            "Banks never threaten same-day account suspension via SMS with a short link.",
            "Never install unverified Android .apk files sent via SMS or WhatsApp.",
            "Banks will never ask for your card CVV, ATM PIN, or Internet Banking password."
        ],
        "simulated_scenario": {
            "type": "SBI KYC Block Alert",
            "message": "Dear customer, your SBI NetBanking will be blocked today. Click http://sbi-netbanking.top/kyc.apk to update PAN immediately.",
            "red_flags": ["Malicious .apk download", "Suspicious unofficial domain", "Panicked urgency"]
        }
    }
]

QUIZ_QUESTIONS = [
    {
        "id": 1,
        "question": "A buyer on a marketplace wants to pay you ₹4,000. They send a QR code and ask you to scan it and enter your UPI PIN. What will happen?",
        "options": [
            "You will safely receive ₹4,000 in your bank account.",
            "₹4,000 will be deducted from your bank account.",
            "The money will go into a pending escrow until delivery.",
            "Your UPI app will verify your identity without moving funds."
        ],
        "correct_index": 1,
        "explanation": "Entering a UPI PIN ALWAYS authorizes a debit (payment out) of your account. You NEVER need to enter your PIN to receive money."
    },
    {
        "id": 2,
        "question": "You receive an email from 'Google Careers' from 'google.recruiter2026@gmail.com' offering a high-paying internship if you pay ₹1,500 for a laptop security deposit. Is this legitimate?",
        "options": [
            "Yes, enterprise recruiters often use Gmail for flexibility.",
            "Yes, if the deposit is promised to be 100% refundable on first paycheck.",
            "No, legitimate employers never use free webmail or require upfront fees from candidates.",
            "Yes, but only if they attach a signed offer letter PDF."
        ],
        "correct_index": 2,
        "explanation": "Reputable employers never communicate formal hiring via personal @gmail.com accounts, and genuine companies NEVER charge candidates upfront fees for employment."
    },
    {
        "id": 3,
        "question": "A trading platform claims their AI bot delivers a 'guaranteed 20% weekly profit with zero risk'. How should this be evaluated?",
        "options": [
            "It is a legitimate algorithmic trading advantage.",
            "It is a high-confidence financial scam, as zero-risk guaranteed profits do not exist in real markets.",
            "It is safe if the website has a valid green HTTPS padlock.",
            "It is safe as long as they allow crypto deposits."
        ],
        "correct_index": 1,
        "explanation": "All financial investments carry market risk. Anyone promising mathematically guaranteed, risk-free profits is operating a deceptive Ponzi or advance-fee fraud scheme."
    },
    {
        "id": 4,
        "question": "An email display name reads 'PayPal Security Support', but the actual address is 'support@paypa1-account-portal.xyz'. What technique is this?",
        "options": [
            "Legitimate load balancing",
            "Brand impersonation & lookalike homoglyph domain spoofing",
            "Public beta testing",
            "Internal proxy relay"
        ],
        "correct_index": 1,
        "explanation": "The attacker replaced 'l' with '1' and used a cheap .xyz TLD to mislead users into believing they are communicating with PayPal."
    },
    {
        "id": 5,
        "question": "You receive an urgent SMS: 'Your bank account will be permanently blocked in 12 hours unless you update KYC here.' What is the safest response?",
        "options": [
            "Click the link immediately to prevent account suspension.",
            "Ignore the SMS link and check your account status directly via the bank's official app or branch.",
            "Forward the link to your friends to check if their accounts are also blocked.",
            "Reply to the SMS asking for the manager's phone number."
        ],
        "correct_index": 1,
        "explanation": "Scammers manufacture artificial panic. Always independently verify status through official, verified banking apps or customer care numbers."
    }
]


class QuizSubmission(BaseModel):
    module_id: Optional[str] = "general_scam_iq"
    answers: Dict[str, int]  # question_id -> selected_index


@router.get("/modules")
def get_academy_modules():
    return ACADEMY_MODULES


@router.get("/quiz")
def get_quiz():
    # Return questions without the correct_index to prevent inspection
    sanitized = []
    for q in QUIZ_QUESTIONS:
        sanitized.append({
            "id": q["id"],
            "question": q["question"],
            "options": q["options"]
        })
    return sanitized


@router.post("/quiz/submit")
def submit_quiz(
    submission: QuizSubmission,
    db: Session = Depends(get_db),
    user_payload: Optional[dict] = Depends(get_current_user_optional)
):
    score = 0
    total = len(QUIZ_QUESTIONS)
    results = []

    for q in QUIZ_QUESTIONS:
        qid_str = str(q["id"])
        selected = submission.answers.get(qid_str)
        is_correct = (selected == q["correct_index"])
        if is_correct:
            score += 1

        results.append({
            "id": q["id"],
            "question": q["question"],
            "user_answer": selected,
            "correct_answer": q["correct_index"],
            "is_correct": is_correct,
            "explanation": q["explanation"]
        })

    percentage = round((score / total) * 100, 1)

    # Save progress if user is authenticated
    user_id = None
    if user_payload and "sub" in user_payload:
        try:
            user_id = int(user_payload["sub"])
            prog = AcademyProgress(
                user_id=user_id,
                module_id=submission.module_id or "general_scam_iq",
                score=int(percentage),
                completed_at=datetime.utcnow()
            )
            db.add(prog)
            db.commit()
        except Exception:
            pass

    return {
        "score": score,
        "total": total,
        "percentage": percentage,
        "passed": percentage >= 80.0,
        "badge": "Certified Cyber Vigilant" if percentage >= 80.0 else "Vigilance In Progress",
        "detailed_results": results
    }
