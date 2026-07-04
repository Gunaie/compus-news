import hashlib
import bcrypt


def get_hash_password(password: str) -> str:
    salt = bcrypt.gensalt()
    password_bytes = password.encode('utf-8')[:72]
    return bcrypt.hashpw(password_bytes, salt).decode('utf-8')


def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        if hashed_password.startswith('$2b$') or hashed_password.startswith('$2a$'):
            plain_bytes = plain_password.encode('utf-8')[:72]
            return bcrypt.checkpw(plain_bytes, hashed_password.encode('utf-8'))
        else:
            hash_part, salt = hashed_password.split(':')
            combined = f"{plain_password}{salt}"
            new_hash = hashlib.sha256(combined.encode()).hexdigest()
            return new_hash == hash_part
    except Exception:
        return False
