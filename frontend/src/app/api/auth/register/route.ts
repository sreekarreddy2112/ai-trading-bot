import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, username, phone, password } = body;

    if (!username || username.trim().length < 3) {
      return NextResponse.json(
        { detail: "Username must be at least 3 characters." },
        { status: 400 }
      );
    }
    if (!email || !email.includes("@")) {
      return NextResponse.json(
        { detail: "A valid email address is required." },
        { status: 400 }
      );
    }
    if (!phone || phone.replace(/\D/g, "").length < 10) {
      return NextResponse.json(
        { detail: "A valid 10-digit phone number is required." },
        { status: 400 }
      );
    }
    if (!password || password.length < 6) {
      return NextResponse.json(
        { detail: "Password must be at least 6 characters." },
        { status: 400 }
      );
    }

    const cleanUsername = username.trim().toLowerCase();
    const cleanEmail = email.trim().toLowerCase();
    const cleanPhone = phone.replace(/\D/g, "");

    const userId = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const token = `mkt_token_${Buffer.from(`${userId}:${cleanEmail}:${Date.now()}`).toString("base64")}`;

    const userProfile = {
      id: userId,
      email: cleanEmail,
      username: cleanUsername,
      phone: cleanPhone,
      name: username.trim(),
      created_at: new Date().toISOString(),
    };

    return NextResponse.json(
      {
        status: "success",
        message: "Account created successfully! Welcome to MarketMind India.",
        user: userProfile,
        token,
      },
      { status: 200 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { detail: err.message || "Failed to register user." },
      { status: 500 }
    );
  }
}

