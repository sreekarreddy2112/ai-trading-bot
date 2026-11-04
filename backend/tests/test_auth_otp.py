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

def test_validate_email_syntax():
    assert validate_email_syntax("trader@marketmind.in") == "trader@marketmind.in"
    assert validate_email_syntax("  USER@DOMAIN.COM  ") == "user@domain.com"
    
    with pytest.raises(HTTPException):
        validate_email_syntax("invalid-email")
        
    with pytest.raises(HTTPException):
        validate_email_syntax("@missingusername.com")

def test_send_and_verify_otp_lifecycle():
    _otp_store.clear()
    email = "investor.test@marketmind.in"

    # 1. Send OTP
    send_res = send_otp(SendOTPRequest(email=email))
    assert send_res.status == "sent"
    assert send_res.email == email
    assert send_res.demo_otp is not None
    assert len(send_res.demo_otp) == 6

    # 2. Verify with wrong code
    with pytest.raises(HTTPException) as exc_info:
        verify_otp(VerifyOTPRequest(email=email, otp="000000"))
    assert "Invalid verification code" in exc_info.value.detail

    # 3. Verify with correct code
    verify_res = verify_otp(VerifyOTPRequest(email=email, otp=send_res.demo_otp))
    assert verify_res.status == "verified"
    assert verify_res.user.email == email
    assert verify_res.user.verified is True
    assert len(verify_res.token) > 20
