import { NextResponse } from "next/server"
import { checkForUpdates } from "@/lib/version"

export const runtime = "nodejs"

export async function GET() {
  const result = await checkForUpdates()
  return NextResponse.json(result, {
    headers: {
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  })
}
