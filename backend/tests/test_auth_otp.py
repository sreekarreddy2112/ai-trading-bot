import pytest
from fastapi import HTTPException
from routers.auth import (
    send_otp,
    verify_otp,
    validate_email_syntax,
    generate_auth_token,
    _otp_store,
)
from models.schemas import SendOTPRequest, VerifyOTPRequest
from config import settings

def test_validate_email_syntax():
    assert validate_email_syntax("trader@marketmind.in") == "trader@marketmind.in"
    assert validate_email_syntax("  USER@DOMAIN.COM  ") == "user@domain.com"
    
    with pytest.raises(HTTPException):
        validate_email_syntax("invalid-email")
        
    with pytest.raises(HTTPException):
        validate_email_syntax("@missingusername.com")

def test_send_and_verify_otp_lifecycle(monkeypatch):
    _otp_store.clear()
    email = "investor.test@marketmind.in"

    # Mock send_email_direct to simulate successful email delivery
    import routers.auth as auth_mod
    monkeypatch.setattr(auth_mod, "send_email_direct", lambda to_email, code: True)

    # 1. Send OTP
    send_res = send_otp(SendOTPRequest(email=email))
    assert send_res.status == "sent"
    assert send_res.email == email
    
    # Verify code was stored in server session
    assert email in _otp_store
    otp_code = _otp_store[email]["code"]
    assert len(otp_code) == 6

    # 2. Verify with wrong code
    with pytest.raises(HTTPException) as exc_info:
        verify_otp(VerifyOTPRequest(email=email, otp="000000"))
    assert "Invalid verification code" in exc_info.value.detail

    # 3. Verify with correct code
    verify_res = verify_otp(VerifyOTPRequest(email=email, otp=otp_code))
    assert verify_res.status == "verified"
    assert verify_res.user.email == email
    assert verify_res.user.verified is True
    assert len(verify_res.token) > 20
