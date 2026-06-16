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
  it("blocks repository creation for the admin account", () => {
    const repositoriesRoute = readFileSync(
      join(process.cwd(), "app/api/repositories/route.ts"),
      "utf8"
    )
    const newRepositoryPage = readFileSync(join(process.cwd(), "app/new/page.tsx"), "utf8")
    const navbar = readFileSync(join(process.cwd(), "components/Navbar.tsx"), "utf8")
    const commandPalette = readFileSync(join(process.cwd(), "components/CommandPalette.tsx"), "utf8")

    expect(repositoriesRoute).toContain("isAdminSessionUser")
    expect(repositoriesRoute).toContain("admin_forbidden")
    expect(newRepositoryPage).toContain("isAdminSessionUser")
    expect(newRepositoryPage).toContain("Admins cannot create repositories")
    expect(navbar).toContain("!isAdmin")
    expect(commandPalette).toContain("isAdmin")
    expect(commandPalette).toContain("item.id !== \"new-repo\"")
  })

  it("shows normal users and not the normal activity section on the admin homepage", () => {
    const homePage = readFileSync(join(process.cwd(), "app/page.tsx"), "utf8")
    const adminUsers = readFileSync(join(process.cwd(), "components/AdminUsersPanel.tsx"), "utf8")

    expect(homePage).toContain("isAdminSessionUser")
    expect(homePage).toContain("AdminUsersPanel")
    expect(homePage).toContain("listLocalUsers()")
    expect(homePage).toContain("<TrendingRepositories repositories={trending} />")
    expect(adminUsers).toContain("User accounts")
    expect(adminUsers).toContain("repositories")
    expect(adminUsers).not.toContain("admin")
  })

  it("lets admin manage normal user repositories but not create admin repositories", async () => {
    await createGitHubRepository(normalUser, {
      auto_init: true,
      description: "owned by alice",
      name: "demo",
      private: false,
    })

    expect(await createGitHubRepository(adminUser, { name: "admin-demo" })).toMatchObject({
      error: "admin_forbidden",
      repository: null,
      status: 403,
    })
    expect(getLocalRepository("admin", "admin-demo")).toBeNull()

    const updated = await updateGitHubRepositoryMetadata(adminUser, "alice", "demo", {
      description: "updated by admin",
    })
    expect(updated.repository).toMatchObject({ description: "updated by admin" })

    await expect(deleteGitHubRepository(adminUser, "alice", "demo"))
      .resolves.toMatchObject({ ok: true })
    expect(getLocalRepository("alice", "demo")).toBeNull()
  })
})
