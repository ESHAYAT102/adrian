import { readFileSync } from "node:fs"
import { mkdtempSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { afterEach, beforeEach, describe, expect, it } from "vitest"

import { getGitHubViewerSettings, updateGitHubViewerSettings } from "@/lib/github"
import {
  createLocalUser,
  deleteLocalUser,
  getLocalUserByUsername,
  verifyLocalUserPassword,
} from "@/lib/local-users"
import type { SessionUser } from "@/lib/session"

let dataDir: string

const sessionUser: SessionUser = {
  accessToken: "local:test",
  email: null,
  image: null,
  login: "test",
  name: "Test Account",
}

beforeEach(() => {
  dataDir = mkdtempSync(join(tmpdir(), "adrian-settings-"))
  process.env.ADRIAN_DATA_DIR = dataDir
})

afterEach(() => {
  rmSync(dataDir, { force: true, recursive: true })
  delete process.env.ADRIAN_DATA_DIR
})

describe("settings account management", () => {
  it("updates the local account email through viewer settings", async () => {
    createLocalUser({ displayName: "Test Account", password: "password123", username: "test" })

    const result = await updateGitHubViewerSettings(sessionUser, {
      email: "test@example.com",
      name: "Test Account",
    })

    expect(result.settings?.email).toBe("test@example.com")
    expect((await getGitHubViewerSettings(sessionUser)).email).toBe("test@example.com")
    expect(getLocalUserByUsername("test")?.email).toBe("test@example.com")
  })

  it("deletes a local user account and prevents later password login", () => {
    createLocalUser({ displayName: "Test Account", password: "password123", username: "test" })

    expect(deleteLocalUser("test")).toBe(true)

    expect(getLocalUserByUsername("test")).toBeNull()
    expect(verifyLocalUserPassword("test", "password123")).toBeNull()
  })

  it("removes OAuth/app/profile summary cards from the settings UI", () => {
    const settingsPage = readFileSync(join(process.cwd(), "app/settings/page.tsx"), "utf8")
    const settingsForm = readFileSync(join(process.cwd(), "components/SettingsForm.tsx"), "utf8")

    expect(settingsPage).not.toContain("App Access")
    expect(settingsPage).not.toContain("Open GitHub profile")
    expect(settingsForm).not.toContain("OAuth Access")
    expect(settingsForm).not.toContain("scopeLabel")
  })

  it("renders editable email and delete-account controls in settings form", () => {
    const settingsForm = readFileSync(join(process.cwd(), "components/SettingsForm.tsx"), "utf8")

    expect(settingsForm).toContain("email: settings.email")
    expect(settingsForm).toContain("Email")
    expect(settingsForm).not.toContain("readOnly")
    expect(settingsForm).toContain("Delete account")
    expect(settingsForm).toContain("/api/settings/account")
  })
})
