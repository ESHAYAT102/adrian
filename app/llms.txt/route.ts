import {
  SITE_DESCRIPTION,
  SITE_NAME,
  getBaseUrl,
  textResponse,
} from "@/lib/agent-discovery"

export async function GET(request: Request) {
  const baseUrl = getBaseUrl(request)

  return textResponse(`# ${SITE_NAME}

> ${SITE_DESCRIPTION}

## Primary Content

- [Home](${baseUrl}/): overview and public route guide
- [Full LLM context](${baseUrl}/llms-full.txt): complete machine-readable guide
- [OpenAPI](${baseUrl}/openapi.json): public API and route description

## Agent Discovery

- [Agent Skills](${baseUrl}/.well-known/agent-skills/index.json)
- [Robots](${baseUrl}/robots.txt)
- [Sitemap](${baseUrl}/sitemap.xml)

## Markdown Content Negotiation

Send \`Accept: text/markdown\` to public content pages. Xenon serves Markdown for \`/\`, \`/{username}\`, and \`/{username}/{repo}\`, including selected files with \`?path=\`.
`)
}
