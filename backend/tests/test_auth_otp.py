import secrets
import pytest
from fastapi import HTTPException
from routers.auth import (
    register_user,
    login_user,
    generate_auth_token,
    normalize_phone_digits,
    _users_db,
)
from models.schemas import UserRegisterRequest, UserLoginRequest

def test_register_and_login_lifecycle():
    suffix = secrets.token_hex(4)
    email = f"user_{suffix}@marketmind.in"
    username = f"trader_{suffix}"
    phone = f"987{secrets.randbelow(8999999) + 1000000}"

    # 1. Register new user with Email, Username, Phone, Password
    reg_req = UserRegisterRequest(
        email=email,
        username=username,
        phone=phone,
        password="securePassword123"
    )
    reg_res = register_user(reg_req)
    assert reg_res.status == "success"
    assert reg_res.token
    assert reg_res.user.email == email
    assert reg_res.user.username == username

    # 2. Login via Email
    login_email = login_user(UserLoginRequest(
        identifier=email,
        password="securePassword123"
    ))
    assert login_email.status == "success"
    assert login_email.user.id == reg_res.user.id

    # 3. Login via Username
    login_user_req = login_user(UserLoginRequest(
        identifier=username,
        password="securePassword123"
    ))
    assert login_user_req.status == "success"
    assert login_user_req.user.id == reg_res.user.id

    # 4. Login via Phone Number
    login_phone_req = login_user(UserLoginRequest(
        identifier=phone,
        password="securePassword123"
    ))
    assert login_phone_req.status == "success"
    assert login_phone_req.user.id == reg_res.user.id

    # 5. Login with Wrong Password
    with pytest.raises(HTTPException) as exc_wrong_pw:
        login_user(UserLoginRequest(
            identifier=username,
            password="wrongPassword"
        ))
    assert exc_wrong_pw.value.status_code == 401

    # 6. Prevent Duplicate Registration
    with pytest.raises(HTTPException) as exc_dup:
        register_user(reg_req)
    assert exc_dup.value.status_code == 400
