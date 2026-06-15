import { mkdtempSync, readFileSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { afterEach, beforeEach, describe, expect, it } from "vitest"

import { buildAdminDashboardStats } from "@/lib/admin-dashboard"
import {
  createGitHubRepository,
  createGitHubRepositoryRelease,
  getGitHubRepositoryReleases,
} from "@/lib/github"
import { createLocalUser } from "@/lib/local-users"
import type { SessionUser } from "@/lib/session"

let dataDir: string

const user: SessionUser = {
  accessToken: "local:alice",
  email: null,
  image: null,
  login: "alice",
  name: "Alice User",
}

beforeEach(() => {
  dataDir = mkdtempSync(join(tmpdir(), "adrian-admin-dashboard-"))
  process.env.ADRIAN_DATA_DIR = dataDir
})

afterEach(() => {
  rmSync(dataDir, { force: true, recursive: true })
  delete process.env.ADRIAN_DATA_DIR
})

describe("admin dashboard stats and releases", () => {
  it("builds dashboard stats with supported date filters", async () => {
    createLocalUser({ password: "password123", username: "alice" })
    await createGitHubRepository(user, {
      auto_init: true,
      description: "demo repo",
      name: "demo",
      private: false,
    })

    const stats = buildAdminDashboardStats({ now: new Date() })

    expect(stats.filters.map((filter) => filter.id)).toEqual([
      "7d",
      "30d",
      "2m",
      "3m",
      "6m",
      "1y",
    ])
    expect(stats.byFilter["7d"]).toMatchObject({
      commits: 1,
      newRepos: 1,
      newUsers: 1,
      totalRepos: 1,
    })
  })

  it("creates repository releases with uploaded assets", async () => {
    await createGitHubRepository(user, {
      auto_init: true,
      description: "demo repo",
      name: "demo",
      private: false,
    })

    const result = await createGitHubRepositoryRelease(user, "alice", "demo", {
      assets: [{ content: "hello release", name: "notes.txt", type: "text/plain" }],
      body: "Optional release description",
      name: "Version 1",
      tagName: "v1.0.0",
    })

    expect(result.release).toMatchObject({
      body: "Optional release description",
      name: "Version 1",
      tag_name: "v1.0.0",
    })
    expect(result.release?.assets).toEqual([
      expect.objectContaining({
        browser_download_url: expect.stringContaining("/api/repository-releases/assets"),
        name: "notes.txt",
        size: 13,
      }),
    ])
    await expect(getGitHubRepositoryReleases("alice", "demo", user))
      .resolves.toEqual([expect.objectContaining({ tag_name: "v1.0.0" })])
  })

  it("wires release creation and admin dashboard UI", () => {
    const adminDashboard = readFileSync(
      join(process.cwd(), "components/AdminDashboard.tsx"),
      "utf8"
    )
    const releaseForm = readFileSync(
      join(process.cwd(), "components/RepositoryReleaseForm.tsx"),
      "utf8"
    )
    const releaseRoute = readFileSync(
      join(process.cwd(), "app/api/repository-releases/route.ts"),
      "utf8"
    )

    expect(adminDashboard).toContain("Admin dashboard")
    expect(adminDashboard).toContain("Last 7 days")
    expect(adminDashboard).toContain("Commits")
    expect(adminDashboard).toContain("New users")
    expect(adminDashboard).toContain("New repos")
    expect(adminDashboard).toContain("Total repos")
    expect(releaseForm).toContain("Create release")
    expect(releaseForm).toContain("onDrop")
    expect(releaseForm).toContain("/api/repository-releases")
    expect(releaseRoute).toContain("formData")
    expect(releaseRoute).toContain("createGitHubRepositoryRelease")
  })
})
