import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ alerts: [] });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    return NextResponse.json({
      id: `alt_${Date.now()}`,
      symbol: body.symbol || "RELIANCE",
      target_price: body.target_price || 3000,
      direction: body.direction || "ABOVE",
      created_at: new Date().toISOString(),
      is_triggered: false,
    });
  } catch {
    return NextResponse.json({ success: true });
  }
}

