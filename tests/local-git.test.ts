import { mkdtempSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { afterEach, beforeEach, describe, expect, it } from "vitest"

import {
  createLocalRepository,
  getRepositoryReadme,
  listLocalRepositories,
  validateRepositoryName,
} from "@/lib/local-git"

let dataDir: string

beforeEach(() => {
  dataDir = mkdtempSync(join(tmpdir(), "adrian-"))
  process.env.ADRIAN_DATA_DIR = dataDir
})

afterEach(() => {
  rmSync(dataDir, { force: true, recursive: true })
  delete process.env.ADRIAN_DATA_DIR
})

describe("local git backend", () => {
  it("validates repository names", () => {
    expect(validateRepositoryName("hello-world_123")).toEqual({ ok: true })
    expect(validateRepositoryName("../escape").ok).toBe(false)
    expect(validateRepositoryName("bad name").ok).toBe(false)
    expect(validateRepositoryName(".git").ok).toBe(false)
  })

  it("creates a bare repository and stores metadata", () => {
    createLocalRepository({
      description: "A self-hosted repo",
      name: "demo",
    })

    expect(listLocalRepositories()).toMatchObject([
      {
        description: "A self-hosted repo",
        name: "demo",
      },
    ])
  })

  it("reads README content from the default branch", () => {
    const repo = createLocalRepository({ name: "docs" })
    const readmePath = join(repo.workTreePath, "README.md")
    writeFileSync(readmePath, "# Docs\n\nHello from Adrian.\n")
    repo.commitAll("Add README")

    expect(getRepositoryReadme("docs")?.content).toContain("Hello from Adrian")
  })
})
