"""
Mock AI Microservice — Development / Testing Only
Run: python ai_mock_service.py
Listens on http://localhost:8001/analyze

In production, replace with your real ML model service.
"""
import json
import random
from http.server import BaseHTTPRequestHandler, HTTPServer

CATEGORIES = [
    'Compte bloqué',
    'Salle / Équipement',
    'Matériel informatique',
    'Télécommandes de climatiseur',
]

PRIORITIES = ['Faible', 'Moyen', 'Élevé', 'Critique']

# Simple keyword-based rules to simulate AI
RULES = [
    ({'bloqué', 'compte', 'mot de passe', 'accès', 'password', 'locked'}, 'Compte bloqué', 'Élevé'),
    ({'salle', 'réunion', 'vidéoprojecteur', 'room', 'equipment'}, 'Salle / Équipement', 'Moyen'),
    ({'ordinateur', 'pc', 'laptop', 'écran', 'clavier', 'souris', 'computer', 'screen'}, 'Matériel informatique', 'Moyen'),
    ({'climatiseur', 'télécommande', 'air', 'ac', 'clim', 'remote'}, 'Télécommandes de climatiseur', 'Faible'),
    ({'urgent', 'critique', 'panne totale', 'critical', 'down', 'crash'}, None, 'Critique'),
]


def classify(title: str, description: str) -> dict:
    text = (title + ' ' + description).lower()
    words = set(text.split())

    category = None
    priority = None

    for keywords, cat, pri in RULES:
        if keywords.intersection(words):
            if cat and not category:
                category = cat
            if pri == 'Critique':
                priority = 'Critique'
            elif not priority:
                priority = pri

    return {
        'category': category or random.choice(CATEGORIES),
        'priority_score': priority or random.choice(PRIORITIES),
    }


class AIHandler(BaseHTTPRequestHandler):
    def do_POST(self):
        if self.path != '/analyze':
            self.send_response(404)
            self.end_headers()
            return

        length = int(self.headers.get('Content-Length', 0))
        body = self.rfile.read(length)

        try:
            data = json.loads(body)
        except json.JSONDecodeError:
            self.send_response(400)
            self.end_headers()
            self.wfile.write(b'{"error": "Invalid JSON"}')
            return

        result = classify(
            title=data.get('title', ''),
            description=data.get('description', ''),
        )

        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps(result).encode())

    def log_message(self, format, *args):
        print(f'[AI Service] {self.address_string()} — {format % args}')


if __name__ == '__main__':
    server = HTTPServer(('localhost', 8001), AIHandler)
    print('🤖 Mock AI microservice running at http://localhost:8001/analyze')
    server.serve_forever()