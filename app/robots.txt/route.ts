import { getBaseUrl, textResponse } from "@/lib/agent-discovery"

const AI_USER_AGENTS = [
  "GPTBot",
  "ChatGPT-User",
  "OAI-SearchBot",
  "ClaudeBot",
  "Claude-User",
  "PerplexityBot",
  "Perplexity-User",
  "Google-Extended",
  "GoogleOther",
  "GoogleOther-Image",
  "GoogleOther-Video",
  "Applebot",
  "Applebot-Extended",
  "Bytespider",
  "CCBot",
  "DuckAssistBot",
]

export async function GET(request: Request) {
  const baseUrl = getBaseUrl(request)
  const aiRules = AI_USER_AGENTS.map(
    (userAgent) => `User-agent: ${userAgent}\nAllow: /`
  ).join("\n\n")

  return textResponse(`User-agent: *
Allow: /

${aiRules}

Sitemap: ${baseUrl}/sitemap.xml
Host: ${baseUrl}
`)
}
