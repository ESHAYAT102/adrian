import { getBaseUrl } from "@/lib/agent-discovery"

function xmlEscape(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;")
}

export async function GET(request: Request) {
  const baseUrl = getBaseUrl(request)
  const urls = [
    "/",
    "/llms.txt",
    "/llms-full.txt",
    "/openapi.json",
    "/.well-known/agent-skills/index.json",
  ]

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (path) => `  <url>
    <loc>${xmlEscape(`${baseUrl}${path}`)}</loc>
    <changefreq>daily</changefreq>
  </url>`
  )
  .join("\n")}
</urlset>
`

  return new Response(body, {
    headers: {
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
      "Content-Type": "application/xml; charset=utf-8",
    },
  })
}
