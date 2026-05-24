import os
import json
import hashlib
import secrets

USERS_FILE = os.path.join(os.path.dirname(__file__), 'users.json')
ACTIVE_TOKENS = {} # In-memory store for active session tokens

def load_users():
    if not os.path.exists(USERS_FILE):
        with open(USERS_FILE, 'w') as f:
            json.dump([], f)
        return []
    try:
        with open(USERS_FILE, 'r') as f:
            return json.load(f)
    except Exception:
        return []

def save_users(users):
    with open(USERS_FILE, 'w') as f:
        json.dump(users, f, indent=2)

def hash_password(password):
    return hashlib.sha256(password.encode('utf-8')).hexdigest()

def register_user(username, email, password):
    users = load_users()
    
    # Check duplicate username or email
    for u in users:
        if u['username'].lower() == username.lower():
            return False, "Username is already registered."
        if u['email'].lower() == email.lower():
            return False, "Email is already registered."
            
    new_user = {
        "id": secrets.token_hex(8),
        "username": username,
        "email": email,
        "password": hash_password(password)
    }
    
    users.append(new_user)
    save_users(users)
    return True, "User registered successfully."

def login_user(username_or_email, password):
    users = load_users()
    hashed_pwd = hash_password(password)
    
    for u in users:
        if u['username'].lower() == username_or_email.lower() or u['email'].lower() == username_or_email.lower():
            if u['password'] == hashed_pwd:
                # Generate token
                token = secrets.token_hex(16)
                ACTIVE_TOKENS[token] = {
                    "user_id": u['id'],
                    "username": u['username'],
                    "email": u['email']
                }
                return True, {
                    "token": token,
                    "user": {
                        "id": u['id'],
                        "username": u['username'],
                        "email": u['email']
                    }
                }
            break
            
    return False, "Invalid username, email, or password."

def logout_user(token):
    if token in ACTIVE_TOKENS:
        del ACTIVE_TOKENS[token]
        return True
    return False

def verify_token(token):
    return ACTIVE_TOKENS.get(token)
