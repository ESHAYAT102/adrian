import { NextRequest, NextResponse } from "next/server"

export const runtime = "nodejs"

export async function GET(request: NextRequest) {
  return NextResponse.redirect(new URL("/", request.nextUrl.origin))
}
