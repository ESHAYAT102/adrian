import {
  XENON_AGENT_SKILL,
  jsonResponse,
  sha256Digest,
} from "@/lib/agent-discovery"

export async function GET() {
  return jsonResponse({
    $schema: "https://schemas.agentskills.io/discovery/0.2.0/schema.json",
    skills: [
      {
        name: "xenon-discovery",
        type: "skill-md",
        description:
          "Use Xenon to inspect public GitHub profiles, repositories, README files, and repository metadata in concise Markdown.",
        url: "/.well-known/agent-skills/xenon-discovery/SKILL.md",
        digest: sha256Digest(XENON_AGENT_SKILL),
      },
    ],
  })
}
