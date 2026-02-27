import pandas as pd
import joblib
import os
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report, confusion_matrix, accuracy_score
import warnings
warnings.filterwarnings("ignore")
# =========================
# LOAD DATASET
# =========================

df = pd.read_csv("dataset/dataset.csv")

# Hapus kolom index kalau ada
if 'index' in df.columns:
    df = df.drop(columns=['index'])

# =========================
# SPLIT FEATURE & LABEL
# =========================

X = df.drop(columns=['Result'])
y = df['Result']

# =========================
# SPLIT DATA
# =========================

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

# =========================
# TRAIN RANDOM FOREST
# =========================

model = RandomForestClassifier(
    n_estimators=150,
    max_depth=10,
    random_state=42
)

model.fit(X_train, y_train)

# =========================
# EVALUATION
# =========================

y_pred = model.predict(X_test)

print("\n=== ACCURACY ===")
print(accuracy_score(y_test, y_pred))

print("\n=== CONFUSION MATRIX ===")
print(confusion_matrix(y_test, y_pred))

print("\n=== CLASSIFICATION REPORT ===")
print(classification_report(y_test, y_pred))

# =========================
# SAVE MODEL
# =========================

if not os.path.exists("model"):
    os.makedirs("model")

joblib.dump(model, "model/random_forest.pkl")

print("\nModel berhasil disimpans!")