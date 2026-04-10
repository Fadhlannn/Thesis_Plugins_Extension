from fastapi import FastAPI
from pydantic import BaseModel, Field
from typing import List
import re

app = FastAPI()

# =============================
# MODELS
# =============================

class Cookie(BaseModel):
    name: str
    domain: str


class WebsiteData(BaseModel):
    url: str
    is_https: bool
    tracker_count: int
    permissions: dict[str,str]
    cookies_count: int
    third_party_domains: List[str]
    iframe_count: int
    redirect_count: int
    domain_age_days: int
    ip_address: str = "Unknown"
    cookies: List[Cookie] = Field(default_factory=list)

# class WebsiteData(BaseModel):
#     url: str
#     is_https: bool = False
#     tracker_count: int = 0
#     permissions: List[str] = []
#     cookies_count: int = 0
#     third_party_domains: List[str] = []
#     iframe_count: int = 0
#     redirect_count: int = 0
#     domain_age_days: int = 0
#     ip_address: str = "Unknown"
#     cookies: List[Cookie] = []

# =============================
# COOKIE ANALYZER (MERGED)
# =============================

def analyze_cookies(cookies: List[Cookie]):
    cookie_types = set()
    score = 0
    reasons = []

    for c in cookies:
        name = c.name.lower()

        if "session" in name or "auth" in name or "token" in name:
            cookie_types.add("Session")
            score += 15

        elif "_ga" in name or "analytics" in name:
            cookie_types.add("Analytics")
            score += 8

        elif "ads" in name or "track" in name:
            cookie_types.add("Advertising")
            score += 10

        elif "cf_" in name or "secure" in name:
            cookie_types.add("Security")
            score += 2

        else:
            cookie_types.add("General")
            score += 3

    # limit max score
    score = min(score, 40)

    # generate reasons
    if "Session" in cookie_types:
        reasons.append("Website menyimpan sesi login user (berisiko jika bocor)")

    if "Advertising" in cookie_types:
        reasons.append("Website menggunakan cookie untuk iklan dan profiling user")

    if "Analytics" in cookie_types:
        reasons.append("Website melacak aktivitas user")

    if "Security" in cookie_types:
        reasons.append("Website menggunakan cookie untuk proteksi keamanan")

    return score, reasons


# =============================
# API
# =============================

@app.get("/")
def home():
    return {"message": "Scoring Engine Active"}


@app.post("/analyze")
def analyze_site(data: WebsiteData):
    score = 0
    reasons = []

    # =============================
    # RULE 1: URL IP
    # =============================
    if re.match(r"http[s]?://\d+\.\d+\.\d+\.\d+", data.url):
        score += 40
        reasons.append("URL menggunakan IP Address langsung")

    # =============================
    # RULE 2: HTTPS
    # =============================
    if not data.is_https:
        score += 35
        reasons.append("Website tidak menggunakan HTTPS")

    # =============================
    # RULE 3: Phishing keyword
    # =============================
    suspicious_keywords = [
        "hadiah", "gratis", "bank-login",
        "update-akun", "verifikasi", "claim"
    ]

    if any(word in data.url.lower() for word in suspicious_keywords):
        score += 40
        reasons.append("URL mengandung kata kunci mencurigakan")

    # =============================
    # RULE 4: Tracker
    # =============================
    if data.tracker_count > 15:
        score += 30
        reasons.append("Tracker pihak ketiga sangat banyak")
    elif data.tracker_count > 5:
        score += 15
        reasons.append("Terdeteksi beberapa tracker")

    # =============================
    # RULE 5: Cookies (jumlah)
    # =============================
    if data.cookies_count > 20:
        score += 20
        reasons.append("Jumlah cookies sangat banyak")
    elif data.cookies_count > 10:
        score += 10
        reasons.append("Cukup banyak cookies")

    # =============================
    # 🔥 COOKIE ANALYSIS (MERGED)
    # =============================
    cookie_score, cookie_reasons = analyze_cookies(data.cookies)
    score += cookie_score
    reasons.extend(cookie_reasons)

    # =============================
    # RULE 6: Third Party
    # =============================
    if len(data.third_party_domains) > 10:
        score += 25
        reasons.append("Terlalu banyak third-party domain")
    elif len(data.third_party_domains) > 5:
        score += 10
        reasons.append("Beberapa third-party domain ditemukan")

    tracking_domains = [
        "google-analytics.com",
        "googletagmanager.com",
        "doubleclick.net",
        "facebook.net",
        "hotjar.com"
    ]

    tracker_detected = [
        d for d in data.third_party_domains
        if any(t in d for t in tracking_domains)
    ]

    if len(tracker_detected) > 3:
        score += 15
        reasons.append("Banyak domain tracking terdeteksi")

    # =============================
    # RULE 7: Iframe
    # =============================
    if data.iframe_count > 3:
        score += 25
        reasons.append("Banyak iframe terdeteksi")

    # =============================
    # RULE 8: Redirect
    # =============================
    if data.redirect_count > 3:
        score += 30
        reasons.append("Redirect berulang terdeteksi")

    # =============================
    # RULE 9: Domain Age
    # =============================
    if data.domain_age_days < 30:
        score += 40
        reasons.append("Domain sangat baru")
    elif data.domain_age_days < 180:
        score += 20
        reasons.append("Domain masih relatif baru")
        
    # =============================
    # RULE 10: Permissions
    # =============================
    sensitive_permissions = ["camera", "microphone", "geolocation"]

    found_permissions = []

    for perm in sensitive_permissions:
        status = data.permissions.get(perm)

        if status == "granted":
            score += 20
            reasons.append(f"{perm} diizinkan (risiko tinggi)")

        elif status == "prompt":
            score += 5
            reasons.append(f"{perm} diminta (potensi risiko)")

    if found_permissions:
        score += 20 * len(found_permissions)
        reasons.append(f"Akses sensitif: {', '.join(found_permissions)}")

    # =============================
    # FINAL STATUS
    # =============================
    if score > 70:
        status = "Berisiko"
    elif score > 30:
        status = "Waspada"
    else:
        status = "Aman"

    return {
        "url": data.url,
        "final_score": score,
        "status": status,
        "analysis_details": reasons,
        "cookies_count": data.cookies_count,
        "tracker_count": data.tracker_count,
        "iframe_count": data.iframe_count,
        "third_party_domains_count": len(data.third_party_domains)
    }