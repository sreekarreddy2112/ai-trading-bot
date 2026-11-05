import secrets
import pytest
from fastapi import HTTPException
from routers.auth import (
    register_user,
    login_user,
    get_current_user_profile,
    generate_auth_token,
    verify_auth_token,
    check_login_rate_limit,
    record_failed_login,
    clear_failed_login,
    MAX_FAILED_LOGIN_ATTEMPTS,
)
from routers.watchlist import get_user_id, SYMBOL_REGEX
from services.alerts_service import (
    create_price_alert,
    delete_price_alert,
    _alerts_store,
)
from models.schemas import UserRegisterRequest, UserLoginRequest, CreateAlertRequest


def test_login_brute_force_rate_limiting():
    """Security Point 2: Unlimited login attempts are blocked with HTTP 429 after 5 failures."""
    test_id = f"brute_force_target_{secrets.token_hex(4)}@marketmind.in"
    clear_failed_login(test_id)

    # First 4 failed attempts return 401 Unauthorized
    for _ in range(MAX_FAILED_LOGIN_ATTEMPTS - 1):
        with pytest.raises(HTTPException) as exc:
            login_user(UserLoginRequest(identifier=test_id, password="wrongPassword1"))
        assert exc.value.status_code == 401

    # 5th failed attempt hits the threshold
    with pytest.raises(HTTPException) as exc5:
        login_user(UserLoginRequest(identifier=test_id, password="wrongPassword1"))
    assert exc5.value.status_code == 401

    # 6th attempt is blocked with 429 Too Many Requests (Account Lockout)
    with pytest.raises(HTTPException) as exc6:
        login_user(UserLoginRequest(identifier=test_id, password="wrongPassword1"))
    assert exc6.value.status_code == 429
    assert "locked" in exc6.value.detail.lower()

    # Cleanup
    clear_failed_login(test_id)


def test_weak_password_rejected():
    """Security Point 2: Trivial dictionary passwords are rejected during registration."""
    weak_req = UserRegisterRequest(
        email=f"weak_user_{secrets.token_hex(4)}@marketmind.in",
        username=f"weak_{secrets.token_hex(4)}",
        phone=f"987{secrets.randbelow(8999999) + 1000000}",
        password="password"  # Common weak password
    )
    with pytest.raises(HTTPException) as exc:
        register_user(weak_req)
    assert exc.value.status_code == 400
    assert "too common" in exc.value.detail.lower()


def test_tampered_token_signature_rejected():
    """Security Point 3 & 8: Forged or modified JWT tokens are cryptographically rejected."""
    valid_token = generate_auth_token("usr_test_123", "test@marketmind.in")
    assert verify_auth_token(valid_token) is not None

    # Tamper with payload (attacker changing user ID to admin)
    parts = valid_token.split(".")
    tampered_token = f"{parts[0]}.eyJzdWIiOiAidXNyX2FkbWluIn0.{parts[2]}"
    assert verify_auth_token(tampered_token) is None

    # Request to get_current_user_profile with forged token must raise 401
    with pytest.raises(HTTPException) as exc:
        get_current_user_profile(authorization=f"Bearer {tampered_token}")
    assert exc.value.status_code == 401
    assert "forged" in exc.value.detail.lower() or "invalid" in exc.value.detail.lower()


def test_idor_bola_access_control():
    """Security Point 8: User A cannot delete User B's alert."""
    user_a = "usr_alice_99"
    user_b = "usr_bob_88"

    # Seed alert belonging exclusively to User B
    alert_b_id = f"alert-{secrets.token_hex(4)}"
    _alerts_store[user_b] = [{
        "id": alert_b_id,
        "user_id": user_b,
        "symbol": "RELIANCE",
        "company_name": "Reliance Industries",
        "alert_type": "ABOVE_LIMIT",
        "target_value": 3200.0,
        "initial_price": 2980.0,
        "status": "ACTIVE",
        "triggered_at": None,
        "note": "Bob's private alert",
        "created_at": "2026-11-05 12:00"
    }]

    # Alice attempts to delete Bob's alert (IDOR attack)
    deleted_by_alice = delete_price_alert(user_id=user_a, alert_id=alert_b_id)
    assert deleted_by_alice is False  # Rejected: Alice is not the owner

    # Verify Bob's alert is still safe and untampered
    assert len(_alerts_store[user_b]) == 1

    # Bob deletes his own alert
    deleted_by_bob = delete_price_alert(user_id=user_b, alert_id=alert_b_id)
    assert deleted_by_bob is True
    assert len(_alerts_store[user_b]) == 0


def test_symbol_input_validation():
    """Security Point 6: Malformed, path-traversal, and injection inputs fail validation."""
    assert SYMBOL_REGEX.match("RELIANCE") is not None
    assert SYMBOL_REGEX.match("TCS") is not None
    assert SYMBOL_REGEX.match("M&M") is not None
    assert SYMBOL_REGEX.match("BAJAJ-AUTO") is not None

    # Injection & path traversal attempts must fail
    assert SYMBOL_REGEX.match("../../etc/passwd") is None
    assert SYMBOL_REGEX.match("<script>alert(1)</script>") is None
    assert SYMBOL_REGEX.match("RELIANCE; DROP TABLE users;") is None
    assert SYMBOL_REGEX.match("A" * 50) is None
