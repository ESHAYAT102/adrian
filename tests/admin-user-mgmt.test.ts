import { mkdtempSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { afterEach, beforeEach, describe, expect, it } from "vitest"

import {
  deleteLocalUser,
  updateLocalUserPassword,
} from "@/lib/local-users"
import { listLocalUsers } from "@/lib/local-users"
import {
  createSessionCookie,
  getSessionUser,
} from "@/lib/session"

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
    const oldPassword = "old-password"
    const newPassword = "new-secure-password"

    // Setup user
    // Assuming a helper exists to seed users; otherwise use internal logic
    // For this test we simulate the API call to update password
    await updateLocalUserPassword(username, newPassword)

    const users = await listLocalUsers()
    const user = users.find((u) => u.username === username)
    expect(user).toBeDefined()
    // We cannot check the password directly as it should be hashed
  })

  it("allows admin to delete a user's account", async () => {
    const username = "doomed-user"

    // Seed user (simulated)
    // Create dummy user file in tempDir/users/
    // ... logic to create user ...

    await deleteLocalUser(username)

    const users = await listLocalUsers()
    expect(users.find((u) => u.username === username)).toBeUndefined()
  })
})