import { NextRequest, NextResponse } from "next/server"

export const runtime = "nodejs"

export async function GET(request: NextRequest) {
  const callbackUrl = request.nextUrl.searchParams.get("callbackUrl") || "/"
  return NextResponse.redirect(new URL(callbackUrl, request.nextUrl.origin))
}
