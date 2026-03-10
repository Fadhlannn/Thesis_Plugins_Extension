from fastapi import FastAPI
from pydantic import BaseModel
from typing import List
import re

app = FastAPI()

class WebsiteData(BaseModel):
    url: str
    is_https: bool
    tracker_count: int
    permissions: List[str]
    cookies_count: int
    third_party_domains: List[str]
    iframe_count: int
    redirect_count: int
    domain_age_days: int
    ip_address: str = "Unknown"


@app.get("/")
def home():
    return {"message": "Scoring Engine Active"}


@app.post("/analyze")
def analyze_site(data: WebsiteData):
    score = 0
    reasons = []

    # RULE 1: URL menggunakan IP
    ip_pattern = r"http[s]?://\d+\.\d+\.\d+\.\d+"

    if re.match(ip_pattern, data.url):
        score += 40
        reasons.append("URL menggunakan IP Address langsung")

    # RULE 2: HTTPS
    if not data.is_https:
        score += 35
        reasons.append("Website tidak menggunakan HTTPS")

    # RULE 3: Keyword phishing
    suspicious_keywords = [
        "hadiah",
        "gratis",
        "bank-login",
        "update-akun",
        "verifikasi",
        "claim"
    ]

    if any(word in data.url.lower() for word in suspicious_keywords):
        score += 40
        reasons.append("URL mengandung kata kunci mencurigakan")
 
    # RULE 4: Tracker
    if data.tracker_count > 15:
        score += 30
        reasons.append("Tracker pihak ketiga sangat banyak")
    elif data.tracker_count > 5:
        score += 15
        reasons.append("Terdeteksi beberapa tracker")

    # RULE 5: Cookies
    if data.cookies_count > 20:
        score += 20
        reasons.append("Jumlah cookies sangat banyak (tracking)")
    elif data.cookies_count > 10:
        score += 10
        reasons.append("Terdapat cukup banyak cookies")

    # =============================
    # RULE 6: Third Party Domains
    # =============================
    if len(data.third_party_domains) > 10:
        score += 25
        reasons.append("Terlalu banyak third-party domain")
    elif len(data.third_party_domains) > 5:
        score += 10
        reasons.append("Beberapa domain pihak ketiga ditemukan")

    # Rule Tracking domain
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
        reasons.append("Banyak iframe terdeteksi pada halaman")

    # =============================
    # RULE 8: Redirect
    # =============================
    if data.redirect_count > 3:
        score += 30
        reasons.append("Website melakukan redirect berulang")

    # =============================
    # RULE 9: Domain Age
    # =============================
    if data.domain_age_days < 30:
        score += 40
        reasons.append("Domain sangat baru dibuat")
    elif data.domain_age_days < 180:
        score += 20
        reasons.append("Domain masih relatif baru")

    # RULE 10: Permission Sensitif
    sensitive_permissions = ["camera", "microphone", "geolocation"]

    found_permissions = [
        p for p in data.permissions if p in sensitive_permissions
    ]

    if found_permissions:
        score += 20 * len(found_permissions)
        reasons.append(
            f"Meminta akses sensitif: {', '.join(found_permissions)}"
        )

    # STATUS AKHIR
    status = "Aman"

    if score > 70:
        status = "Berisiko"
    elif score > 30:
        status = "Waspada"

    return {
        "url": data.url,
        "final_score": score,
        "status": status,
        "analysis_details": reasons,
        "cookies_count": data.cookies_count,
        "is_https": data.is_https,
        "tracker_count": data.tracker_count,
        "iframe_count": data.iframe_count,
        "third_party_domains": data.third_party_domains,
        "third_party_domains_count": len(data.third_party_domains)
    }