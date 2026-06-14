import { mkdtempSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { afterEach, beforeEach, describe, expect, it } from "vitest"

import {
  createLocalRepository,
  getLocalRepository,
  getRepositoryContents,
  getRepositoryClonePath,
  getRepositoryReadme,
  listLocalRepositories,
  listRepositoriesForOwner,
  validateRepositoryName,
  validateUsername,
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
  it("validates usernames and repository names", () => {
    expect(validateUsername("eshayat")).toEqual({ ok: true })
    expect(validateUsername("../escape").ok).toBe(false)
    expect(validateUsername("bad name").ok).toBe(false)
    expect(validateUsername(".git").ok).toBe(false)

    expect(validateRepositoryName("hello-world_123")).toEqual({ ok: true })
    expect(validateRepositoryName("../escape").ok).toBe(false)
    expect(validateRepositoryName("bad name").ok).toBe(false)
    expect(validateRepositoryName(".git").ok).toBe(false)
  })

  it("creates owner-scoped bare repositories and stores metadata", () => {
    createLocalRepository({
      description: "A self-hosted repo",
      name: "demo",
      owner: "eshayat",
    })

    expect(listLocalRepositories()).toMatchObject([
      {
        description: "A self-hosted repo",
        name: "demo",
        owner: "eshayat",
      },
    ])
    expect(listRepositoriesForOwner("eshayat")).toHaveLength(1)
    expect(listRepositoriesForOwner("alice")).toHaveLength(0)
  })

  it("creates truly empty repositories when autoInit is false", () => {
    createLocalRepository({
      autoInit: false,
      description: "This should not create a README",
      name: "empty",
      owner: "eshayat",
    })

    expect(getRepositoryContents("eshayat", "empty")).toEqual([])
    expect(getRepositoryReadme("eshayat", "empty")).toBeNull()
  })

  it("allows the same repository name under different users", () => {
    createLocalRepository({ name: "demo", owner: "eshayat" })
    createLocalRepository({ name: "demo", owner: "alice" })

    expect(getLocalRepository("eshayat", "demo")?.owner).toBe("eshayat")
    expect(getLocalRepository("alice", "demo")?.owner).toBe("alice")
    expect(listLocalRepositories()).toHaveLength(2)
  })

  it("uses GitHub-style clone paths without a /git prefix", () => {
    createLocalRepository({ name: "cool-cli", owner: "eshayat" })

    expect(getRepositoryClonePath("eshayat", "cool-cli")).toBe(
      "/eshayat/cool-cli.git"
    )
  })

  it("reads README content from an owner-scoped default branch", () => {
    const repo = createLocalRepository({ name: "docs", owner: "eshayat" })
    const readmePath = join(repo.workTreePath, "README.md")
    writeFileSync(readmePath, "# Docs\n\nHello from Adrian.\n")
    repo.commitAll("Add README")

    expect(getRepositoryReadme("eshayat", "docs")?.content).toContain(
      "Hello from Adrian"
    )
  })
})
