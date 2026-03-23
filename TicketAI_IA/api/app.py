from flask import Flask, request, jsonify
from functools import wraps
import joblib
import string
import unicodedata
import os
import nltk
from nltk.corpus import stopwords

nltk.download('stopwords', quiet=True)

app = Flask(__name__)

API_SECRET_KEY = os.environ.get('AI_SECRET_KEY', 'ticketai-secret-2024-neural')

category_model      = joblib.load('../models/category_model.joblib')
category_vectorizer = joblib.load('../models/tfidf_vectorizer.joblib')
priority_model      = joblib.load('../models/priority_model.joblib')
priority_vectorizer = joblib.load('../models/tfidf_vectorizer_priority.joblib')

STOP_WORDS = set(stopwords.words('french'))

MOTS_URGENTS = [
    "urgent", "bloque", "impossible", "panne",
    "ne fonctionne plus", "critique", "erreur"
]

def require_api_key(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        key = request.headers.get('X-API-Key')
        if not key or key != API_SECRET_KEY:
            return jsonify({'error': 'Clé API invalide ou manquante.'}), 401
        return f(*args, **kwargs)
    return decorated

def supprimer_accents(texte):
    return ''.join(
        c for c in unicodedata.normalize('NFD', texte)
        if unicodedata.category(c) != 'Mn'
    )

def preprocess_texte(texte: str) -> str:
    texte = texte.lower()
    texte = texte.translate(str.maketrans('', '', string.punctuation + string.digits))
    # 1. Supprimer stopwords AVANT accents
    mots = texte.split()
    mots = [mot for mot in mots if mot not in STOP_WORDS]
    texte = ' '.join(mots)
    # 2. Supprimer accents APRÈS stopwords
    texte = supprimer_accents(texte)
    return texte

def appliquer_regles_priorite(texte: str, prediction_ml: str) -> str:
    texte_lower = texte.lower()
    for mot in MOTS_URGENTS:
        if mot in texte_lower:
            if prediction_ml in ['Faible', 'Moyen']:
                return 'Élevé'
            return prediction_ml
    return prediction_ml

@app.route('/predict', methods=['POST'])
@require_api_key
def predict():
    data = request.get_json(silent=True)
    if not data:
        return jsonify({'error': 'Corps JSON manquant.'}), 400

    title       = data.get('title', '').strip()
    description = data.get('description', '').strip()

    if not title and not description:
        return jsonify({'categorie': 'Inconnu', 'priorite': 'Faible', 'confidence': 0.0})

    texte         = f'{title} {description}'
    texte_nettoye = preprocess_texte(texte)

    vect_cat  = category_vectorizer.transform([texte_nettoye])
    cat_pred  = category_model.predict(vect_cat)[0]
    cat_proba = float(category_model.predict_proba(vect_cat).max())

    vect_prio       = priority_vectorizer.transform([texte_nettoye])
    prio_pred       = priority_model.predict(vect_prio)[0]
    prio_pred_final = appliquer_regles_priorite(texte_nettoye, prio_pred)

    return jsonify({
        'categorie':  cat_pred,
        'priorite':   prio_pred_final,
        'confidence': round(cat_proba, 2)
    })

@app.route('/health', methods=['GET'])
def health():
    return jsonify({
        'status': 'ok',
        'service': 'TicketAI ML Service',
        'models': {'category': 'loaded', 'priority': 'loaded'}
    })

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    debug = os.environ.get('FLASK_DEBUG', 'true').lower() == 'true'
    app.run(host='0.0.0.0', port=port, debug=debug)