import { mkdtempSync, readFileSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { afterEach, beforeEach, describe, expect, it } from "vitest"

import { assignAdmin } from "@/lib/admin-store"
import {
  createGitHubRepository,
  deleteGitHubRepository,
  updateGitHubRepositoryMetadata,
} from "@/lib/github"
import { getLocalRepository } from "@/lib/local-git"
import { createLocalUser } from "@/lib/local-users"
import type { SessionUser } from "@/lib/session"

let dataDir: string

const adminUser: SessionUser = {
  accessToken: "local:admin",
  email: null,
  image: null,
  login: "admin",
  name: "Admin",
}

const normalUser: SessionUser = {
  accessToken: "local:alice",
  email: null,
  image: null,
  login: "alice",
  name: "Alice User",
}

beforeEach(() => {
  dataDir = mkdtempSync(join(tmpdir(), "adrian-admin-role-"))
  process.env.ADRIAN_DATA_DIR = dataDir
  createLocalUser({ password: "admin-password", username: "admin" })
  assignAdmin("admin")
  createLocalUser({ password: "alice-password", username: "alice" })
})

afterEach(() => {
  rmSync(dataDir, { force: true, recursive: true })
  delete process.env.ADRIAN_DATA_DIR
})

describe("admin role behavior", () => {
  it("allows repository creation for the admin account", () => {
    const homePage = readFileSync(join(process.cwd(), "app/page.tsx"), "utf8")
    const adminUsers = readFileSync(join(process.cwd(), "components/AdminUsersPanel.tsx"), "utf8")

    expect(homePage).toContain("isAdminSessionUser")
    expect(homePage).toContain("AdminUsersPanel")
    expect(homePage).toContain("TrendingRepositories repositories={allRepositories}")
    expect(adminUsers).toContain("User accounts")
    expect(adminUsers).toContain("repositories")
    expect(adminUsers).not.toContain("admin")
  })

  it("filters admin from the users list on the homepage", () => {
    const homePage = readFileSync(join(process.cwd(), "app/page.tsx"), "utf8")

    expect(homePage).toContain('listLocalUsers().filter((u) => u.username !== user?.login)')
  })

  it("lets admin manage normal user repositories and create repos", async () => {
    await createGitHubRepository(normalUser, {
      auto_init: true,
      description: "owned by alice",
      name: "demo",
      private: false,
    })

    const created = await createGitHubRepository(adminUser, { name: "admin-demo" })
    expect(created.repository).not.toBeNull()
    expect(created.repository?.name).toBe("admin-demo")
    expect(getLocalRepository("admin", "admin-demo")).not.toBeNull()

    const updated = await updateGitHubRepositoryMetadata(adminUser, "alice", "demo", {
      description: "updated by admin",
    })
    expect(updated.repository).toMatchObject({ description: "updated by admin" })

    await expect(deleteGitHubRepository(adminUser, "alice", "demo"))
      .resolves.toMatchObject({ ok: true })
    expect(getLocalRepository("alice", "demo")).toBeNull()
  })
})
