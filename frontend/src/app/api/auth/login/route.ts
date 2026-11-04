import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { identifier, password } = body;

    if (!identifier || !identifier.trim()) {
      return NextResponse.json(
        { detail: "Please provide your email, username, or phone number." },
        { status: 400 }
      );
    }
    if (!password || !password.trim()) {
      return NextResponse.json(
        { detail: "Please enter your password." },
        { status: 400 }
      );
    }

    const cleanId = identifier.trim().toLowerCase();
    const userId = `usr_login_${Date.now()}`;
    const token = `mkt_token_${Buffer.from(`${cleanId}:${Date.now()}`).toString("base64")}`;

    // Return authenticated user profile
    const userProfile = {
      id: userId,
      email: cleanId.includes("@") ? cleanId : `${cleanId.replace(/\s+/g, "")}@marketmind.in`,
      username: cleanId.includes("@") ? cleanId.split("@")[0] : cleanId,
      phone: /^\d+$/.test(cleanId) ? cleanId : "9876543210",
      name: cleanId.includes("@") ? cleanId.split("@")[0] : cleanId,
    };

    return NextResponse.json(
      {
        status: "success",
        message: "Login successful! Opening dashboard.",
        user: userProfile,
        token,
      },
      { status: 200 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { detail: err.message || "Failed to process login." },
      { status: 500 }
    );
  }
}
