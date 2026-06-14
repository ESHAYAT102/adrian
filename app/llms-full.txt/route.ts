import {
  SITE_DESCRIPTION,
  SITE_NAME,
  XENON_AGENT_SKILL,
  buildHomeMarkdown,
  getBaseUrl,
  textResponse,
} from "@/lib/agent-discovery"

export async function GET(request: Request) {
  const baseUrl = getBaseUrl(request)

  return textResponse(`# ${SITE_NAME} Full LLM Context

${SITE_DESCRIPTION}

${buildHomeMarkdown(baseUrl)}

## Content Negotiation Contract

- Request Markdown with \`Accept: text/markdown\`.
- Request HTML with \`Accept: text/html\`.
- Xenon returns \`406 Not Acceptable\` when no supported representation is acceptable.
- Responses include \`Vary: Accept\` so shared caches keep HTML and Markdown separate.
- Responses include \`Link\` headers for alternate Markdown, \`llms.txt\`, full context, Agent Skills, and OpenAPI discovery.

## Supported Public Route Shapes

- \`GET /\`
- \`GET /{username}\`
- \`GET /{username}/{repo}\`
- \`GET /{username}/{repo}?path={path}\`
- \`GET /{username}/{repo}?branch={branch}\`
- \`GET /{username}/{repo}?commit={sha}\`

## Machine-Readable Files

- \`${baseUrl}/robots.txt\`
- \`${baseUrl}/sitemap.xml\`
- \`${baseUrl}/llms.txt\`
- \`${baseUrl}/llms-full.txt\`
- \`${baseUrl}/openapi.json\`
- \`${baseUrl}/.well-known/agent-skills/index.json\`
- \`${baseUrl}/.well-known/agent-skills/xenon-discovery/SKILL.md\`

## Agent Skill

${XENON_AGENT_SKILL}
`)
}
