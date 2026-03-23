import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import classification_report, confusion_matrix
import joblib

# charger le dataset nettoyé
df = pd.read_csv('../data/tickets_clean.csv')

# vérifier les colonnes
print("Colonnes disponibles :", df.columns)

# séparer X (texte) et y (catégorie)
X = df['texte_nettoye']
y = df['categorie']

# nettoyer les espaces autour des catégories et priorités
df['categorie'] = df['categorie'].str.strip()
df['priorite'] = df['priorite'].str.strip()

# séparer X et y après nettoyage
X = df['texte_nettoye']
y = df['categorie']

# vérifier les classes et leur nombre
print("Répartition des catégories :")
print(y.value_counts())

# diviser en train et test
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)

# TF-IDF Vectorizer
# limite à 5000 mots les plus fréquents
vectorizer = TfidfVectorizer(max_features=5000)
X_train_tfidf = vectorizer.fit_transform(X_train)
X_test_tfidf = vectorizer.transform(X_test)

# modèle : Régression Logistique
model = LogisticRegression(max_iter=1000)

# entraînement
model.fit(X_train_tfidf, y_train)

# évaluation sur test
y_pred = model.predict(X_test_tfidf)
print("=== Classification Report ===")
print(classification_report(y_test, y_pred))
print("=== Matrice de confusion ===")
print(confusion_matrix(y_test, y_pred))

# validation croisée 5-fold sur le train
scores = cross_val_score(model, X_train_tfidf, y_train, cv=5)
print("Cross-validation scores :", scores)
print("Mean CV accuracy :", scores.mean())

# sauvegarder modèle et vectorizer
joblib.dump(model, '../models/category_model.joblib')
joblib.dump(vectorizer, '../models/tfidf_vectorizer.joblib')

print("Modèle et vectorizer sauvegardés avec succès !")
