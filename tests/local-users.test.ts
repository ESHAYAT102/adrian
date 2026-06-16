import { mkdtempSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { afterEach, beforeEach, describe, expect, it } from "vitest"

import {
  createLocalUser,
  getLocalUserByUsername,
  listLocalUsers,
  updateLocalUserProfile,
  verifyLocalUserPassword,
} from "@/lib/local-users"
let dataDir: string

beforeEach(() => {
  dataDir = mkdtempSync(join(tmpdir(), "adrian-users-"))
  process.env.ADRIAN_DATA_DIR = dataDir
})

afterEach(() => {
  rmSync(dataDir, { force: true, recursive: true })
  delete process.env.ADRIAN_DATA_DIR
})

describe("local users", () => {
  it("creates users with normalized lowercase usernames", () => {
    const user = createLocalUser({
      displayName: "Eshayat",
      password: "correct horse battery staple",
      username: "ESHAYAT",
    })

    expect(user).toMatchObject({ displayName: "Eshayat", username: "eshayat" })
    expect(listLocalUsers()).toHaveLength(1)
    expect(getLocalUserByUsername("eshayat")).toMatchObject({ username: "eshayat" })
  })

  it("verifies passwords without exposing password hashes publicly", () => {
    createLocalUser({ password: "correct horse battery staple", username: "eshayat" })

    expect(verifyLocalUserPassword("eshayat", "wrong password")).toBeNull()
    expect(
      verifyLocalUserPassword("eshayat", "correct horse battery staple")
    ).toMatchObject({ username: "eshayat" })
    expect(verifyLocalUserPassword("eshayat", "correct horse battery staple"))
      .not.toHaveProperty("passwordHash")
  })

  it("updates and persists a user profile picture URL", () => {
    createLocalUser({ password: "correct horse battery staple", username: "eshayat" })

    const updated = updateLocalUserProfile("eshayat", {
      avatarUrl: "/api/users/eshayat/avatar?v=123",
    })

    expect(updated).toMatchObject({
      avatarUrl: "/api/users/eshayat/avatar?v=123",
      username: "eshayat",
    })
    expect(getLocalUserByUsername("eshayat")).toMatchObject({
      avatarUrl: "/api/users/eshayat/avatar?v=123",
    })
    expect(verifyLocalUserPassword("eshayat", "correct horse battery staple"))
      .toMatchObject({ avatarUrl: "/api/users/eshayat/avatar?v=123" })
  })
})
