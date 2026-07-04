import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

import pytest

from utils.jwt import create_access_token, create_refresh_token, decode_token


def test_create_access_token():
    data = {"user_id": 1}
    token = create_access_token(data)
    assert token is not None
    assert isinstance(token, str)
    assert len(token) > 0


def test_create_refresh_token():
    data = {"user_id": 1}
    token = create_refresh_token(data)
    assert token is not None
    assert isinstance(token, str)
    assert len(token) > 0


def test_decode_token_valid():
    data = {"user_id": 1}
    token = create_access_token(data)
    payload = decode_token(token)
    assert payload is not None
    assert payload["user_id"] == 1
    assert payload["type"] == "access"


def test_decode_token_invalid():
    payload = decode_token("invalid.token.here")
    assert payload is None