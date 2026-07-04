import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

import pytest

from utils.security import get_hash_password, verify_password


def test_get_hash_password():
    password = "TestPassword123"
    hashed = get_hash_password(password)
    assert hashed is not None
    assert isinstance(hashed, str)
    assert len(hashed) > 0
    assert hashed.startswith("$2b$") or hashed.startswith("$2a$")


def test_verify_password_correct():
    password = "TestPassword123"
    hashed = get_hash_password(password)
    assert verify_password(password, hashed) is True


def test_verify_password_incorrect():
    password = "TestPassword123"
    hashed = get_hash_password(password)
    assert verify_password("WrongPassword", hashed) is False


def test_verify_password_invalid_hash():
    assert verify_password("password", "invalid-hash") is False