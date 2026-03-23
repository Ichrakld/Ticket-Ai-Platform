LOGIN_SCHEMA = {
    "type": "object",
    "required": ["email", "password"],
    "additionalProperties": False,
    "properties": {
        "email":    {"type": "string", "maxLength": 254},
        "password": {"type": "string", "maxLength": 128}
    }
}

REGISTER_SCHEMA = {
    "type": "object",
    "required": ["email", "password", "password_confirm"],
    "additionalProperties": False,
    "properties": {
        "email":            {"type": "string", "maxLength": 254},
        "password":         {"type": "string", "minLength": 12, "maxLength": 128},
        "password_confirm": {"type": "string", "minLength": 12, "maxLength": 128},
        "role":             {"type": "string", "enum": ["Utilisateur", "Technicien", "Admin"]}
    }
}