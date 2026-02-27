from flask import Flask, request, jsonify
import joblib
import numpy as np
import os

app = Flask(__name__)

# =========================
# LOAD MODEL
# =========================

model_path = os.path.join("model", "random_forest.pkl")
model = joblib.load(model_path)

# =========================
# FEATURE ORDER (WAJIB SAMA SEPERTI TRAINING)
# =========================

FEATURE_COLUMNS = [
    "having_IPhaving_IP_Address",
    "URLURL_Length",
    "Shortining_Service",
    "having_At_Symbol",
    "double_slash_redirecting",
    "Prefix_Suffix",
    "having_Sub_Domain",
    "SSLfinal_State",
    "Domain_registeration_length",
    "Favicon",
    "port",
    "HTTPS_token",
    "Request_URL",
    "URL_of_Anchor",
    "Links_in_tags",
    "SFH",
    "Submitting_to_email",
    "Abnormal_URL",
    "Redirect",
    "on_mouseover",
    "RightClick",
    "popUpWidnow",
    "Iframe",
    "age_of_domain",
    "DNSRecord",
    "web_traffic",
    "Page_Rank",
    "Google_Index",
    "Links_pointing_to_page",
    "Statistical_report"
]

# =========================
# RISK SCORE FUNCTION
# =========================

def calculate_risk_score(probability):
    score = round(probability * 100, 2)

    if score < 40:
        level = "Low"
    elif score < 70:
        level = "Medium"
    else:
        level = "High"

    return score, level

# =========================
# EXPLANATION FUNCTION
# =========================

def generate_explanation(data, risk_level):
    reasons = []

    if data.get("having_IPhaving_IP_Address") == 1:
        reasons.append("URL menggunakan IP Address")

    if data.get("Shortining_Service") == 1:
        reasons.append("Menggunakan URL shortening service")

    if data.get("having_At_Symbol") == 1:
        reasons.append("Mengandung simbol @ dalam URL")

    if data.get("HTTPS_token") == 1:
        reasons.append("Token HTTPS mencurigakan")

    if data.get("Iframe") == 1:
        reasons.append("Menggunakan iframe tersembunyi")

    if not reasons:
        reasons.append("Tidak ditemukan indikasi mencurigakan utama")

    return reasons

# =========================
# API ENDPOINT
# =========================

@app.route("/")
def home():
    return "Backend Running 🚀"

@app.route("/predict", methods=["POST"])
def predict():
    try:
        data = request.json

        # Pastikan semua fitur ada
        features_list = []
        for col in FEATURE_COLUMNS:
            features_list.append(data.get(col, 0))

        features = np.array([features_list])

        # Predict probability
        probability = model.predict_proba(features)[0][1]

        risk_score, level = calculate_risk_score(probability)

        explanation = generate_explanation(data, level)

        response = {
            "risk_score": risk_score,
            "risk_level": level,
            "message": f"Website memiliki tingkat risiko {level}",
            "reasons": explanation
        }

        return jsonify(response)

    except Exception as e:
        return jsonify({"error": str(e)}), 400

# =========================

if __name__ == "__main__":
    app.run(debug=True)