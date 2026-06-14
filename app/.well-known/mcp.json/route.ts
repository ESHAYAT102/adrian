import {
  SITE_DESCRIPTION,
  SITE_NAME,
  getBaseUrl,
  jsonResponse,
} from "@/lib/agent-discovery"

export async function GET(request: Request) {
  const baseUrl = getBaseUrl(request)

  return jsonResponse({
    $schema: "https://modelcontextprotocol.io/schemas/server-card/v1.0",
    version: "1.0",
    protocolVersion: "2025-06-18",
    serverInfo: {
      name: SITE_NAME,
      title: SITE_NAME,
      description: SITE_DESCRIPTION,
      homepage: baseUrl,
      documentationUrl: `${baseUrl}/llms-full.txt`,
    },
    transport: {
      type: "https",
      url: baseUrl,
    },
    capabilities: {
      resources: {
        listChanged: false,
      },
      tools: {
        listChanged: false,
      },
      prompts: {
        listChanged: false,
      },
    },
    discovery: {
      llmsTxt: `${baseUrl}/llms.txt`,
      llmsFullTxt: `${baseUrl}/llms-full.txt`,
      openapi: `${baseUrl}/openapi.json`,
      agentSkills: `${baseUrl}/.well-known/agent-skills/index.json`,
    },
  })
}
