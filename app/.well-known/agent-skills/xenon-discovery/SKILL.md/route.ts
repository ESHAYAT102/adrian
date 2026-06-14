import { XENON_AGENT_SKILL, markdownResponse } from "@/lib/agent-discovery"

export async function GET() {
  return markdownResponse(XENON_AGENT_SKILL, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  })
}
