import bcrypt


def get_hash_password(password: str) -> str:
    salt = bcrypt.gensalt()
    password_bytes = password.encode('utf-8')[:72]
    return bcrypt.hashpw(password_bytes, salt).decode('utf-8')


def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        plain_bytes = plain_password.encode('utf-8')[:72]
        return bcrypt.checkpw(plain_bytes, hashed_password.encode('utf-8'))
    except Exception:
        return False
