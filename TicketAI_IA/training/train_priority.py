import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import classification_report, confusion_matrix
import joblib

# charger le dataset nettoyé
df = pd.read_csv('../data/tickets_clean.csv')

# définir X et y
X = df['texte_nettoye']
y = df['priorite']

# diviser train/test
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)

# TF-IDF Vectorizer
vectorizer = TfidfVectorizer(max_features=5000)
X_train_tfidf = vectorizer.fit_transform(X_train)
X_test_tfidf = vectorizer.transform(X_test)

# modèle ML : Régression Logistique
model = LogisticRegression(max_iter=1000, multi_class='multinomial')
model.fit(X_train_tfidf, y_train)

# évaluation ML
y_pred = model.predict(X_test_tfidf)
print("=== Classification Report ===")
print(classification_report(y_test, y_pred))
print("=== Matrice de confusion ===")
print(confusion_matrix(y_test, y_pred))

scores = cross_val_score(model, X_train_tfidf, y_train, cv=5)
print("Cross-validation scores :", scores)
print("Mean CV accuracy :", scores.mean())

# définir les mots critiques pour règles
mots_urgents = ["urgent", "bloqué", "impossible",
                "panne", "ne fonctionne plus", "critique"]


def appliquer_regles_priorite(texte, prediction_ml):
    texte = texte.lower()
    for mot in mots_urgents:
        if mot in texte:
            # Si un mot critique apparaît, prioriser au moins Élevé
            if prediction_ml in ["Faible", "Moyen"]:
                return "Élevé"
            else:
                return prediction_ml
    return prediction_ml


# appliquer la logique hybride sur le test
y_test_hybride = [appliquer_regles_priorite(
    txt, pred) for txt, pred in zip(X_test, y_pred)]

print("=== Classification Report avec règles ===")
print(classification_report(y_test, y_test_hybride))

# sauvegarder modèle et vectorizer
joblib.dump(model, '../models/priority_model.joblib')
joblib.dump(vectorizer, '../models/tfidf_vectorizer_priority.joblib')

print("Modèle de priorité et vectorizer sauvegardés avec succès !")
