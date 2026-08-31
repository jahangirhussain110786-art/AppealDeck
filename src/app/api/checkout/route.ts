import { NextResponse } from "next/server";

export async function POST() {
  const apiKey = process.env.PADDLE_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Checkout not configured" }, { status: 501 });
  }
  return NextResponse.json(
    { message: "Configure the Paddle checkout with the sandbox/live key" },
    { status: 200 },
  );
}
