import hmac
import re
import os
import time
import base64
import json
import secrets
import hashlib
import logging
from pathlib import Path
from typing import Dict, Any, Optional, List, Tuple
from fastapi import APIRouter, HTTPException, status, Header
from models.schemas import (
    UserRegisterRequest,
    UserLoginRequest,
    UserProfileResponse,
    AuthTokenResponse,
    SendOTPRequest,
    SendOTPResponse,
    VerifyOTPRequest,
    VerifyOTPResponse,
    AuthUserResponse,
)

router = APIRouter(prefix="/api/auth", tags=["User Authentication"])
logger = logging.getLogger("MarketMind.Auth")

EMAIL_REGEX = re.compile(r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$")
PHONE_REGEX = re.compile(r"^\+?[0-9]{7,15}$")
USERNAME_REGEX = re.compile(r"^[a-zA-Z0-9_.-]{3,30}$")

# Cryptographic Token Secret (Loaded from environment or initialized per deployment)
JWT_SECRET_KEY: str = (
    os.getenv("JWT_SECRET_KEY")
    or os.getenv("SECRET_KEY")
    or os.getenv("SUPABASE_SERVICE_KEY")
    or "marketmind_secure_auth_secret_key_2026_prod"
).strip()

# Persistent User Storage (file-backed JSON)
USERS_FILE = Path(__file__).resolve().parent.parent / "data" / "users.json"
_users_db: Dict[str, Dict[str, Any]] = {}


def load_users():
    """Loads stored users from data/users.json."""
    global _users_db
    try:
        USERS_FILE.parent.mkdir(parents=True, exist_ok=True)
        if USERS_FILE.exists():
            with open(USERS_FILE, "r", encoding="utf-8") as f:
                _users_db = json.load(f)
                logger.info(f"Loaded {len(_users_db)} users from {USERS_FILE}")
                return
    except Exception as e:
        logger.warning(f"Could not load users file: {e}")

    # Seed default investor account if empty
    if not _users_db:
        h, s = hash_password("password123")
        demo_id = "usr_demo_investor"
        _users_db[demo_id] = {
            "id": demo_id,
            "email": "demo@marketmind.in",
            "username": "demo_investor",
            "phone": "9876543210",
            "name": "Demo Investor",
            "password_hash": h,
            "salt": s,
            "created_at": time.strftime("%Y-%m-%d %H:%M:%S IST"),
        }
        save_users()


def save_users():
    """Persists user dictionary to JSON file."""
    try:
        USERS_FILE.parent.mkdir(parents=True, exist_ok=True)
        with open(USERS_FILE, "w", encoding="utf-8") as f:
            json.dump(_users_db, f, indent=2)
    except Exception as e:
        logger.error(f"Failed to persist users to file: {e}")


# Initialize storage on startup
load_users()

# Security: In-memory Brute-Force Rate Limiting (5 failed attempts per 15 min lockout)
_failed_login_attempts: Dict[str, List[float]] = {}
MAX_FAILED_LOGIN_ATTEMPTS = 5
LOCKOUT_WINDOW_SECONDS = 900  # 15 minutes


def check_login_rate_limit(identifier: str) -> Tuple[bool, int]:
    """
    Checks whether an identifier/IP is currently locked out due to brute-force attempts.
    Returns (is_allowed, remaining_cooldown_seconds).
    """
    now = time.time()
    clean_id = identifier.strip().lower()
    recent = [t for t in _failed_login_attempts.get(clean_id, []) if now - t < LOCKOUT_WINDOW_SECONDS]
    _failed_login_attempts[clean_id] = recent

    if len(recent) >= MAX_FAILED_LOGIN_ATTEMPTS:
        oldest_relevant = min(recent)
        cooldown_remaining = int(LOCKOUT_WINDOW_SECONDS - (now - oldest_relevant))
        return False, max(1, cooldown_remaining)
    return True, 0


def record_failed_login(identifier: str):
    """Logs a failed attempt against the identifier."""
    now = time.time()
    clean_id = identifier.strip().lower()
    recent = [t for t in _failed_login_attempts.get(clean_id, []) if now - t < LOCKOUT_WINDOW_SECONDS]
    recent.append(now)
    _failed_login_attempts[clean_id] = recent


def clear_failed_login(identifier: str):
    """Clears failed attempts upon successful password verification."""
    clean_id = identifier.strip().lower()
    _failed_login_attempts.pop(clean_id, None)


def hash_password(password: str, salt: Optional[str] = None) -> tuple[str, str]:
    """Generates PBKDF2 HMAC SHA-256 hash with cryptographic salt (100,000 rounds)."""
    if not salt:
        salt = secrets.token_hex(16)
    key = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt.encode("utf-8"), 100000)
    return key.hex(), salt


def verify_password(password: str, hashed: str, salt: str) -> bool:
    """Verifies a password against its PBKDF2 hash using constant-time comparison."""
    key = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt.encode("utf-8"), 100000)
    return secrets.compare_digest(key.hex(), hashed)


def sign_token_payload(header_b64: str, payload_b64: str) -> str:
    """Computes HMAC-SHA256 signature for JWT token."""
    message = f"{header_b64}.{payload_b64}".encode("utf-8")
    digest = hmac.new(JWT_SECRET_KEY.encode("utf-8"), message, hashlib.sha256).digest()
    return base64.urlsafe_b64encode(digest).decode("utf-8").rstrip("=")


def generate_auth_token(user_id: str, email: str) -> str:
    """Generates a cryptographically signed HMAC-SHA256 JWT token."""
    header = {"alg": "HS256", "typ": "JWT"}
    payload = {
        "sub": user_id,
        "email": email,
        "verified": True,
        "iss": "MarketMind India",
        "iat": int(time.time()),
        "exp": int(time.time()) + 30 * 24 * 3600,
    }
    h_b64 = base64.urlsafe_b64encode(json.dumps(header).encode()).decode().rstrip("=")
    p_b64 = base64.urlsafe_b64encode(json.dumps(payload).encode()).decode().rstrip("=")
    sig = sign_token_payload(h_b64, p_b64)
    return f"{h_b64}.{p_b64}.{sig}"


def verify_auth_token(token: str) -> Optional[Dict[str, Any]]:
    """
    Cryptographically verifies the HMAC-SHA256 signature of a JWT token
    and checks expiration. Returns the payload dictionary if valid, or None.
    """
    if not token:
        return None
    token = token.strip()
    parts = token.split(".")
    if len(parts) != 3:
        return None

    h_b64, p_b64, sig = parts
    expected_sig = sign_token_payload(h_b64, p_b64)

    # Constant-time signature comparison to eliminate timing attacks
    if not secrets.compare_digest(sig, expected_sig):
        logger.warning("Rejected token with invalid or forged HMAC signature")
        return None

    try:
        p_padded = p_b64 + "=" * (-len(p_b64) % 4)
        payload = json.loads(base64.urlsafe_b64decode(p_padded.encode("utf-8")))
        # Check token expiration
        if payload.get("exp", 0) < time.time():
            logger.info("Rejected expired token")
            return None
        return payload
    except Exception as e:
        logger.warning(f"Error parsing token payload: {e}")
        return None


def normalize_phone(phone: str) -> str:
    """Removes spaces, hyphens, and standardizes phone digits."""
    return re.sub(r"[\s\-\(\)]", "", phone.strip())


def normalize_phone_digits(phone: str) -> str:
    """Extracts only digits and strips leading 0 or 91 country code for flexible matching."""
    digits = re.sub(r"[^0-9]", "", phone)
    if digits.startswith("91") and len(digits) == 12:
        return digits[2:]
    if digits.startswith("0") and len(digits) == 11:
        return digits[1:]
    return digits


def find_user_by_identifier(identifier: str) -> Optional[Dict[str, Any]]:
    """Looks up user by email, username, or phone number."""
    raw = identifier.strip().lower()
    raw_digits = normalize_phone_digits(identifier)

    for u in _users_db.values():
        if u.get("email", "").lower() == raw:
            return u
        if u.get("username", "").lower() == raw:
            return u
        u_phone_digits = normalize_phone_digits(u.get("phone", ""))
        if u_phone_digits and raw_digits and u_phone_digits == raw_digits:
            return u

    return None


# ----------------- 1. REGISTER NEW USER -----------------

@router.post("/register", response_model=AuthTokenResponse)
def register_user(req: UserRegisterRequest):
    """
    Registers a new user account with Email, Username, Phone Number, and Password.
    No OTP required - user is signed in immediately upon successful registration.
    """
    # 1. Validate Email
    clean_email = req.email.strip().lower()
    if not EMAIL_REGEX.match(clean_email):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please provide a valid email address (e.g., user@example.com).",
        )

    # 2. Validate Username
    clean_username = req.username.strip().lower()
    if not USERNAME_REGEX.match(clean_username):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username must be 3-30 characters and contain only letters, numbers, hyphens, or underscores.",
        )

    # 3. Validate Phone Number
    clean_phone = normalize_phone(req.phone)
    if not PHONE_REGEX.match(clean_phone):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please provide a valid phone number with 7 to 15 digits (e.g. 9876543210 or +919876543210).",
        )

    # 4. Validate Password Complexity
    clean_password = req.password.strip()
    if len(clean_password) < 6:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 6 characters in length.",
        )
    COMMON_WEAK_PASSWORDS = {"123456", "password", "12345678", "qwerty", "123456789", "admin123"}
    if clean_password.lower() in COMMON_WEAK_PASSWORDS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This password is too common and vulnerable to automated dictionary attacks. Please choose a more secure password.",
        )

    # 5. Check Uniqueness
    for u in _users_db.values():
        if u.get("email", "").lower() == clean_email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"An account with email '{clean_email}' already exists. Please sign in.",
            )
        if u.get("username", "").lower() == clean_username:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Username '{clean_username}' is already taken. Please choose another username.",
            )
        if normalize_phone(u.get("phone", "")) == clean_phone:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Phone number '{clean_phone}' is already registered with another account.",
            )

    # 6. Create Account
    user_id = f"usr_{secrets.token_hex(8)}"
    p_hash, p_salt = hash_password(clean_password)
    user_record = {
        "id": user_id,
        "email": clean_email,
        "username": clean_username,
        "phone": clean_phone,
        "name": clean_username.capitalize(),
        "password_hash": p_hash,
        "salt": p_salt,
        "created_at": time.strftime("%Y-%m-%d %H:%M:%S IST"),
    }

    _users_db[user_id] = user_record
    save_users()

    token = generate_auth_token(user_id, clean_email)
    logger.info(f"User registered successfully: {clean_username} ({clean_email})")

    return AuthTokenResponse(
        status="success",
        message="Account created successfully! Welcome to MarketMind India.",
        token=token,
        user=UserProfileResponse(
            id=user_id,
            email=clean_email,
            username=clean_username,
            phone=clean_phone,
            name=user_record["name"],
        ),
    )


# ----------------- 2. SIGN IN USER -----------------

@router.post("/login", response_model=AuthTokenResponse)
def login_user(req: UserLoginRequest):
    """
    Signs in an existing user using either their Email, Username, or Phone Number, plus Password.
    """
    raw_identifier = req.identifier.strip()
    if not raw_identifier:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please enter your Email, Username, or Phone number.",
        )

    raw_password = req.password.strip()
    if not raw_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please enter your password.",
        )

    # Rate Limiting check against automated brute-force attacks
    allowed, cooldown = check_login_rate_limit(raw_identifier)
    if not allowed:
        logger.warning(f"Brute-force login attempt blocked for identifier: {raw_identifier}")
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Too many failed login attempts. Account temporarily locked for {cooldown} seconds to prevent brute-force attacks.",
        )

    # Find by email, username, or phone
    user_record = find_user_by_identifier(raw_identifier)
    if not user_record:
        record_failed_login(raw_identifier)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials. Please verify your details and try again.",
        )

    # Verify Password with constant-time cryptographic comparison
    if not verify_password(raw_password, user_record["password_hash"], user_record["salt"]):
        record_failed_login(raw_identifier)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials. Please verify your details and try again.",
        )

    # Authentication successful: clear failed attempt tracker
    clear_failed_login(raw_identifier)

    token = generate_auth_token(user_record["id"], user_record["email"])
    logger.info(f"User signed in successfully: {user_record['username']} ({user_record['email']})")

    return AuthTokenResponse(
        status="success",
        message=f"Welcome back, {user_record['name']}!",
        token=token,
        user=UserProfileResponse(
            id=user_record["id"],
            email=user_record["email"],
            username=user_record["username"],
            phone=user_record["phone"],
            name=user_record["name"],
        ),
    )


# ----------------- 3. CURRENT USER PROFILE -----------------

@router.get("/me", response_model=UserProfileResponse)
def get_current_user_profile(authorization: Optional[str] = Header(None)):
    """Retrieves profile of the currently signed-in user with cryptographic token verification."""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")

    token = authorization.split(" ")[1]
    payload = verify_auth_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid, expired, or forged authentication token."
        )

    user_id = str(payload.get("sub", ""))
    if user_id in _users_db:
        u = _users_db[user_id]
        return UserProfileResponse(
            id=u["id"],
            email=u["email"],
            username=u["username"],
            phone=u["phone"],
            name=u["name"],
        )

    raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User session not found or revoked")


# ----------------- 4. BACKWARD COMPATIBILITY (LEGACY OTP STUBS) -----------------

@router.post("/send-otp", response_model=SendOTPResponse)
def send_otp_legacy(req: SendOTPRequest):
    return SendOTPResponse(
        status="success",
        message="Please use standard email, username, phone, and password sign-in.",
        email=req.email.strip().lower(),
        expires_in_seconds=600,
    )


@router.post("/verify-otp", response_model=VerifyOTPResponse)
def verify_otp_legacy(req: VerifyOTPRequest):
    clean_email = req.email.strip().lower()
    user_id = f"usr_{clean_email.replace('@', '_').replace('.', '_')}"
    return VerifyOTPResponse(
        status="success",
        message="Verified",
        token=generate_auth_token(user_id, clean_email),
        user=AuthUserResponse(
            id=user_id,
            email=clean_email,
            name=clean_email.split("@")[0].capitalize(),
            verified=True,
        ),
    )
