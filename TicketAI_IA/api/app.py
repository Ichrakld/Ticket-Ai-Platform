from flask import Flask, request, jsonify
import joblib
import string

app = Flask(__name__)

# charger les modèles et vectorizers
category_model = joblib.load('../models/category_model.joblib')
category_vectorizer = joblib.load('../models/tfidf_vectorizer.joblib')

priority_model = joblib.load('../models/priority_model.joblib')
priority_vectorizer = joblib.load('../models/tfidf_vectorizer_priority.joblib')

# définir mots critiques pour règles
mots_urgents = ["urgent", "bloqué", "impossible",
                "panne", "ne fonctionne plus", "critique"]

# fonctions utilitaires


def preprocess_texte(texte):
    """Nettoyage basique du texte : minuscule + suppression ponctuation et chiffres"""
    texte = texte.lower()
    texte = texte.translate(str.maketrans(
        '', '', string.punctuation + string.digits))
    return texte


def appliquer_regles_priorite(texte, prediction_ml):
    """Applique les règles métier pour booster la priorité si mots critiques présents"""
    texte = texte.lower()
    for mot in mots_urgents:
        if mot in texte:
            if prediction_ml in ["Faible", "Moyen"]:
                return "Élevé"
            else:
                return prediction_ml
    return prediction_ml

# endpoint principal


@app.route('/predict', methods=['POST'])
def predict():
    data = request.get_json()
    title = data.get("title", "")
    description = data.get("description", "")

    # cas texte vide
    if not title.strip() and not description.strip():
        return jsonify({
            "categorie": "Inconnu",
            "priorite": "Faible",
            "confidence": 0.0
        })

    # --- texte complet ---
    texte = f"{title} {description}"
    texte_nettoye = preprocess_texte(texte)

    # --- catégorie ---
    vect_cat = category_vectorizer.transform([texte_nettoye])
    cat_pred = category_model.predict(vect_cat)[0]
    cat_proba = category_model.predict_proba(
        vect_cat).max()  # confiance de la prédiction

    # --- priorité ---
    vect_prio = priority_vectorizer.transform([texte_nettoye])
    prio_pred = priority_model.predict(vect_prio)[0]
    prio_pred_hybride = appliquer_regles_priorite(texte_nettoye, prio_pred)

    response = {
        "categorie": cat_pred,
        "priorite": prio_pred_hybride,
        "confidence": round(float(cat_proba), 2)
    }

    return jsonify(response)


# lancer l’API
if __name__ == '__main__':
    app.run(debug=True)
