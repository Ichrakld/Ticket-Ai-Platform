import pandas as pd
from sklearn.metrics import classification_report, confusion_matrix, accuracy_score
import joblib

# charger les modèles et vectorizers
category_model = joblib.load('../models/category_model.joblib')
category_vectorizer = joblib.load('../models/tfidf_vectorizer.joblib')

priority_model = joblib.load('../models/priority_model.joblib')
priority_vectorizer = joblib.load('../models/tfidf_vectorizer_priority.joblib')

# charger le dataset nettoyé
df = pd.read_csv('../data/tickets_clean.csv')

# séparer X et y pour catégorie
X_cat = df['texte_nettoye']
y_cat = df['categorie']

X_cat_tfidf = category_vectorizer.transform(X_cat)
y_cat_pred = category_model.predict(X_cat_tfidf)

print("=== Évaluation Modèle Catégorie ===")
print("Accuracy :", accuracy_score(y_cat, y_cat_pred))
print("Classification Report :\n", classification_report(y_cat, y_cat_pred))
print("Matrice de confusion :\n", confusion_matrix(y_cat, y_cat_pred))

# séparer X et y pour priorité
X_prio = df['texte_nettoye']
y_prio = df['priorite']

X_prio_tfidf = priority_vectorizer.transform(X_prio)
y_prio_pred = priority_model.predict(X_prio_tfidf)

# ajouter règles simples comme avant
mots_urgents = ["urgent", "bloqué", "impossible",
                "panne", "ne fonctionne plus", "critique"]


def appliquer_regles_priorite(texte, prediction_ml):
    texte = texte.lower()
    for mot in mots_urgents:
        if mot in texte:
            if prediction_ml in ["Faible", "Moyen"]:
                return "Élevé"
            else:
                return prediction_ml
    return prediction_ml


y_prio_pred_hybride = [appliquer_regles_priorite(
    txt, pred) for txt, pred in zip(X_prio, y_prio_pred)]

print("\n=== Évaluation Modèle Priorité (avec règles) ===")
print("Accuracy :", accuracy_score(y_prio, y_prio_pred_hybride))
print("Classification Report :\n",
      classification_report(y_prio, y_prio_pred_hybride))
print("Matrice de confusion :\n", confusion_matrix(y_prio, y_prio_pred_hybride))
