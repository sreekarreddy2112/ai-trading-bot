import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    id: "usr_active",
    email: "user@marketmind.in",
    username: "investor",
    phone: "9876543210",
    name: "Active Investor",
    status: "active",
  });
}

