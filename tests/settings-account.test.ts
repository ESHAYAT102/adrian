import { readFileSync } from "node:fs"
import { mkdtempSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { afterEach, beforeEach, describe, expect, it } from "vitest"

import { getGitHubViewerSettings, updateGitHubViewerSettings } from "@/lib/github"
import {
  createLocalRepository,
  getLocalRepository,
} from "@/lib/local-git"
import {
  createLocalUser,
  deleteLocalUser,
  getLocalUserByUsername,
  updateLocalUserPassword,
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
    createLocalRepository({ name: "owned-repo", owner: "test" })
    createLocalRepository({ name: "other-repo", owner: "someone-else" })

    expect(deleteLocalUser("test")).toBe(true)

    expect(getLocalUserByUsername("test")).toBeNull()
    expect(verifyLocalUserPassword("test", "password123")).toBeNull()
    expect(getLocalRepository("test", "owned-repo")).toBeNull()
    expect(getLocalRepository("someone-else", "other-repo")).not.toBeNull()
  })

  it("changes a local user password only when the current password matches", () => {
    createLocalUser({ displayName: "Test Account", password: "password123", username: "test" })

    expect(updateLocalUserPassword("test", "wrongpass", "newpassword123")).toMatchObject({
      error: "invalid_credentials",
    })
    expect(verifyLocalUserPassword("test", "password123")).not.toBeNull()

    expect(updateLocalUserPassword("test", "password123", "newpassword123")).toMatchObject({
      ok: true,
    })
    expect(verifyLocalUserPassword("test", "password123")).toBeNull()
    expect(verifyLocalUserPassword("test", "newpassword123")).not.toBeNull()
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

  it("requires only the account username before deleting an account through the API", () => {
    const accountRoute = readFileSync(join(process.cwd(), "app/api/settings/account/route.ts"), "utf8")

    expect(accountRoute).toContain("await request.json()")
    expect(accountRoute).toContain("body.username")
    expect(accountRoute).not.toContain("body.password")
    expect(accountRoute).not.toContain("verifyLocalUserPassword")
    expect(accountRoute).toContain("invalid_credentials")
  })

  it("uses a shared delete modal that requires username instead of account password", () => {
    const settingsForm = readFileSync(join(process.cwd(), "components/SettingsForm.tsx"), "utf8")

    expect(settingsForm).not.toContain("window.confirm")
    expect(settingsForm).toContain("Dialog")
    expect(settingsForm).toContain("DialogContent")
    expect(settingsForm).toContain("DialogFooter")
    expect(settingsForm).toContain("isDeleteDialogOpen")
    expect(settingsForm).toContain("deleteForm")
    expect(settingsForm).toContain("username: \"\"")
    expect(settingsForm).toContain("value={deleteForm.username}")
    expect(settingsForm).not.toContain("password: deleteForm.password")
  })

  it("renders a change password section and calls the password API", () => {
    const settingsForm = readFileSync(join(process.cwd(), "components/SettingsForm.tsx"), "utf8")
    const passwordRoute = readFileSync(join(process.cwd(), "app/api/settings/password/route.ts"), "utf8")

    expect(settingsForm).toContain("Change password")
    expect(settingsForm).toContain("currentPassword")
    expect(settingsForm).toContain("newPassword")
    expect(settingsForm).toContain("confirmPassword")
    expect(settingsForm).toContain("/api/settings/password")
    expect(passwordRoute).toContain("updateLocalUserPassword")
  })
})
