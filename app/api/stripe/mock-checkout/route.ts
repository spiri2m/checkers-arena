import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json({
    url: "/pro/success",
    mode: "subscription",
    provider: "stripe-mock"
  });
}
