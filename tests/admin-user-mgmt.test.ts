import { mkdtempSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { afterEach, beforeEach, describe, expect, it } from "vitest"

import {
  adminUpdateLocalUserPassword,
  createLocalUser,
  deleteLocalUser,
  listLocalUsers,
} from "@/lib/local-users"

describe("admin user management", () => {
  let tempDir: string

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), "adrian-admin-mgmt-"))
    process.env.ADRIAN_DATA_DIR = tempDir
  })

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true })
  })

  it("allows admin to change a user's password", async () => {
    const username = "target-user"
    const newPassword = "new-secure-password"

    createLocalUser({ password: "old-password", username })

    const result = adminUpdateLocalUserPassword(username, newPassword)
    expect(result.ok).toBe(true)

    const users = await listLocalUsers()
    const user = users.find((u) => u.username === username)
    expect(user).toBeDefined()
  })

  it("allows admin to delete a user's account", async () => {
    const username = "doomed-user"

    createLocalUser({ password: "some-password", username })

    const deleted = deleteLocalUser(username)
    expect(deleted).toBe(true)

    const users = await listLocalUsers()
    expect(users.find((u) => u.username === username)).toBeUndefined()
  })
})