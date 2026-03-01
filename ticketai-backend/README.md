# TicketAI — Backend Setup Guide

## Project Structure

```
ticketai/
├── manage.py
├── requirements.txt
├── .env.example
├── ai_mock_service.py          ← Mock AI microservice (dev)
├── ticketai/                   ← Django project config
│   ├── settings.py
│   ├── urls.py
│   ├── wsgi.py
│   └── exceptions.py
└── apps/
    ├── users/                  ← Auth, JWT, RBAC
    │   ├── models.py
    │   ├── serializers.py
    │   ├── views.py
    │   ├── permissions.py
    │   ├── throttles.py
    │   └── urls.py
    ├── tickets/                ← Core ticket logic + AI integration
    │   ├── models.py
    │   ├── serializers.py
    │   ├── views.py
    │   ├── ai_client.py
    │   └── urls.py
    └── audit/                  ← Immutable audit trail
        ├── models.py
        ├── serializers.py
        ├── views.py
        ├── utils.py
        └── urls.py
```

---

## Step-by-Step Setup

### 1. Prerequisites

- Python 3.10+
- MySQL 8.0+
- pip

### 2. Clone & Virtual Environment

```bash
cd ticketai
python -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate
```

### 3. Install Dependencies

```bash
pip install -r requirements.txt

# argon2 requires the cffi C extension:
pip install argon2-cffi
```

### 4. Configure MySQL

```sql
-- Run in MySQL shell as root:
CREATE DATABASE ticketai_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'ticketai_user'@'localhost' IDENTIFIED BY 'strong_password_here';
GRANT ALL PRIVILEGES ON ticketai_db.* TO 'ticketai_user'@'localhost';
FLUSH PRIVILEGES;
```

### 5. Environment File

```bash
cp .env.example .env
# Edit .env with your actual values:
nano .env
```

Key variables:
| Variable | Description |
|---|---|
| `SECRET_KEY` | Django secret key (generate: `python -c "import secrets; print(secrets.token_urlsafe(50))"`) |
| `DB_PASSWORD` | MySQL password |
| `AI_SERVICE_URL` | URL of your AI microservice |

### 6. Database Migrations

```bash
python manage.py makemigrations users tickets audit
python manage.py migrate
```

### 7. Create Admin User

```bash
python manage.py shell
>>> from apps.users.models import User
>>> User.objects.create_superuser(email='admin@company.com', password='SecurePass123!')
>>> exit()
```

### 8. Start the Mock AI Microservice (Development)

In a **separate terminal**:
```bash
python ai_mock_service.py
# 🤖 Mock AI microservice running at http://localhost:8001/analyze
```

### 9. Run the Django Server

```bash
python manage.py runserver
# API available at http://127.0.0.1:8000/api/
```

---

## API Reference

### Authentication

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | Public | Create account |
| POST | `/api/auth/login` | Public | Get JWT tokens |
| POST | `/api/auth/logout` | JWT | Blacklist refresh token |
| POST | `/api/auth/refresh` | Public | Refresh access token |
| GET | `/api/auth/me` | JWT | Current user info |

### Tickets

| Method | Endpoint | Roles | Description |
|--------|----------|-------|-------------|
| GET | `/api/tickets/` | All | List tickets (role-filtered) |
| POST | `/api/tickets/` | All | Create ticket → AI classification |
| GET | `/api/tickets/<id>/` | Owner/Tech/Admin | Ticket detail |
| PATCH | `/api/tickets/<id>/status/` | Tech/Admin | Update status |
| PATCH | `/api/tickets/<id>/assign/` | Tech/Admin | Assign technician |
| POST | `/api/tickets/<id>/archive/` | Admin | Archive ticket |

### Audit

| Method | Endpoint | Roles | Description |
|--------|----------|-------|-------------|
| GET | `/api/audit/logs/` | Admin | Paginated audit trail |

---

## Example API Calls

### Register
```bash
curl -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "SecurePass123!", "password_confirm": "SecurePass123!"}'
```

### Login
```bash
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "SecurePass123!"}'

# Response:
# {
#   "access": "eyJ...",
#   "refresh": "eyJ...",
#   "user": { "id": 1, "email": "...", "role": "Utilisateur" }
# }
```

### Create Ticket (AI auto-classifies)
```bash
curl -X POST http://localhost:8000/api/tickets/ \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{"title": "Mon compte est bloqué", "description": "Je ne peux plus me connecter depuis ce matin"}'

# Response includes AI-assigned category and priority_score:
# {
#   "ticket": {
#     "title": "Mon compte est bloqué",
#     "category": "Compte bloqué",
#     "priority_score": "Élevé",
#     "status": "Ouvert"
#   }
# }
```

### Update Ticket Status
```bash
curl -X PATCH http://localhost:8000/api/tickets/1/status/ \
  -H "Authorization: Bearer <technicien_token>" \
  -H "Content-Type: application/json" \
  -d '{"status": "En cours"}'
```

### Query Filters (Tickets)
```
GET /api/tickets/?status=Ouvert
GET /api/tickets/?priority_score=Critique
GET /api/tickets/?category=Compte+bloqué
GET /api/tickets/?archived=true      (Admin only)
```

### Audit Logs (Admin)
```bash
curl -X GET "http://localhost:8000/api/audit/logs/?page=1&page_size=20" \
  -H "Authorization: Bearer <admin_token>"
```

---

## Security Architecture

### Authentication & JWT
- Access tokens expire in **60 minutes** (configurable)
- Refresh tokens expire in **7 days** with rotation
- Blacklisting prevents refresh token reuse after logout
- JWT payload includes `email` and `role` claims

### RBAC Roles
| Role | Can Do |
|------|--------|
| `Utilisateur` | Create tickets, view own tickets |
| `Technicien` | All + update ticket status/assignment |
| `Admin` | All + archive tickets, view audit logs, create elevated users |

### Password Security
- **Argon2** hashing (memory-hard, GPU-resistant) via Django's `PASSWORD_HASHERS`
- Minimum 8 characters enforced by Django's password validators

### Rate Limiting
- Auth endpoints: **5 requests/minute** (anonymous)
- General API: **200 requests/hour** (authenticated)

### Input Sanitization
- All string inputs HTML-escaped via `html.escape()` to prevent XSS
- Django ORM uses parameterized queries exclusively — SQL injection impossible
- CSRF middleware active for non-JWT endpoints

### Audit Trail
- Every login, logout, registration logged
- Every ticket creation, status change, assignment, archive logged
- `AuditLog` model is **append-only** — raises `PermissionError` on update/delete

---

## AI Microservice Integration Flow

```
POST /api/tickets/
       │
       ▼
  Validate input (serializer)
       │
       ▼
  POST http://ai-service/analyze
  { "title": "...", "description": "...", "text": "..." }
       │
       ├─ Success → { "category": "...", "priority_score": "..." }
       │               │
       │               ▼
       │         Save ticket with AI fields
       │
       └─ Failure (timeout/error)
                       │
                       ▼
               Save ticket with category=null, priority_score=null
               (graceful degradation — ticket is never lost)
```

---

## Production Deployment Notes

```bash
# Use Gunicorn for production
pip install gunicorn
gunicorn ticketai.wsgi:application --workers 4 --bind 0.0.0.0:8000

# Collect static files
python manage.py collectstatic

# Set these in .env for production:
DEBUG=False
ALLOWED_HOSTS=yourdomain.com
SECRET_KEY=<strong-random-key>
```

Add a reverse proxy (Nginx/Apache) in front of Gunicorn, with:
- HTTPS/TLS termination
- `X-Forwarded-For` header forwarding (for accurate IP logging)
- Additional rate limiting at proxy layer
