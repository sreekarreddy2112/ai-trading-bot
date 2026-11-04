import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json([]);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    return NextResponse.json({
      symbol: body.symbol || "RELIANCE",
      name: `${body.symbol || "RELIANCE"} Ltd`,
      added_at: new Date().toISOString(),
      current_price: 2985.0,
      change: 52.3,
      percent_change: 1.78,
    });
  } catch {
    return NextResponse.json({ success: true });
  }
}

