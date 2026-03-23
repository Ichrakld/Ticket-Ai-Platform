TICKET_CREATE_SCHEMA = {
    "type": "object",
    "required": ["title", "description"],
    "additionalProperties": False,
    "properties": {
        "title": {
            "type": "string",
            "minLength": 5,
            "maxLength": 255
        },
        "description": {
            "type": "string",
            "minLength": 10,
            "maxLength": 5000
        },
        "category": {           # ← ajouté
            "type": "string",
            "maxLength": 100
        }
    }
}

LOGIN_SCHEMA = {
    "type": "object",
    "required": ["email", "password"],
    "additionalProperties": False,
    "properties": {
        "email": {
            "type": "string",
            "format": "email",
            "maxLength": 254
        },
        "password": {
            "type": "string",
            "minLength": 8,
            "maxLength": 128
        }
    }
}