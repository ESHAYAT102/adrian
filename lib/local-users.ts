import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto"
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs"
import { join } from "node:path"

import {
  deleteLocalRepository,
  getDataDir,
  listRepositoriesForOwner,
  normalizeOwner,
  validateUsername,
} from "@/lib/local-git"
import { BUILTIN_ADMIN_PASSWORD, BUILTIN_ADMIN_USERNAME } from "@/lib/admin"

export type LocalUserRecord = {
  avatarUrl?: string | null
  createdAt: string
  displayName: string | null
  email: string | null
  passwordHash: string
  salt: string
  username: string
}

export type LocalUser = Omit<LocalUserRecord, "passwordHash" | "salt">

const BUILTIN_ADMIN_USER: LocalUser = {
  avatarUrl: null,
  createdAt: "builtin",
  displayName: "Admin",
  email: null,
  username: BUILTIN_ADMIN_USERNAME,
}

function getBuiltInUser(username: string) {
  const normalized = normalizeOwner(username)
  return normalized === BUILTIN_ADMIN_USERNAME ? BUILTIN_ADMIN_USER : null
}

function getUsersPath() {
  const dir = getDataDir()
  mkdirSync(dir, { recursive: true })
  return join(dir, "users.json")
}

function readUserRecords(): LocalUserRecord[] {
  const path = getUsersPath()
  if (!existsSync(path)) writeFileSync(path, "[]\n")
  return JSON.parse(readFileSync(path, "utf8")) as LocalUserRecord[]
}

function writeUserRecords(users: LocalUserRecord[]) {
  writeFileSync(getUsersPath(), `${JSON.stringify(users, null, 2)}\n`)
}

function publicUser(user: LocalUserRecord): LocalUser {
  return {
    avatarUrl: user.avatarUrl ?? null,
    createdAt: user.createdAt,
    displayName: user.displayName,
    email: user.email,
    username: user.username,
  }
}

function hashPassword(password: string, salt = randomBytes(16).toString("hex")) {
  const hash = scryptSync(password, salt, 64).toString("hex")
  return { hash, salt }
}

function verifyPassword(password: string, salt: string, expectedHash: string) {
  const actual = Buffer.from(hashPassword(password, salt).hash, "hex")
  const expected = Buffer.from(expectedHash, "hex")
  return actual.length === expected.length && timingSafeEqual(actual, expected)
}

export function listLocalUsers() {
  return readUserRecords().map(publicUser)
}

export function getLocalUserByUsername(username: string) {
  const builtInUser = getBuiltInUser(username)
  if (builtInUser) return builtInUser

  const normalized = normalizeOwner(username)
  const user = readUserRecords().find((item) => item.username === normalized)
  return user ? publicUser(user) : null
}

export function createLocalUser({
  displayName = null,
  email = null,
  password,
  username,
}: {
  displayName?: string | null
  email?: string | null
  password: string
  username: string
}) {
  const normalized = normalizeOwner(username)
  const validation = validateUsername(normalized)
  if (!validation.ok) throw new Error(validation.error)
  if (normalized === BUILTIN_ADMIN_USERNAME) throw new Error("Username already exists")
  if (password.length < 8) throw new Error("Password must be at least 8 characters")

  const users = readUserRecords()
  if (users.some((user) => user.username === normalized)) throw new Error("Username already exists")

  const { hash, salt } = hashPassword(password)
  const now = new Date().toISOString()
  const user: LocalUserRecord = {
    createdAt: now,
    displayName: displayName || normalized,
    email,
    passwordHash: hash,
    salt,
    username: normalized,
  }
  writeUserRecords([...users, user])
  return publicUser(user)
}

export function verifyLocalUserPassword(username: string, password: string) {
  const normalized = normalizeOwner(username)
  if (normalized === BUILTIN_ADMIN_USERNAME) {
    return password === BUILTIN_ADMIN_PASSWORD ? BUILTIN_ADMIN_USER : null
  }

  const user = readUserRecords().find((item) => item.username === normalized)
  if (!user) return null
  if (!verifyPassword(password, user.salt, user.passwordHash)) return null
  return publicUser(user)
}

export function updateLocalUserPassword(
  username: string,
  currentPassword: string,
  newPassword: string
) {
  const normalized = normalizeOwner(username)
  if (newPassword.length < 8) return { error: "password_too_short", ok: false }

  const users = readUserRecords()
  const index = users.findIndex((item) => item.username === normalized)
  if (index === -1) return { error: "not_found", ok: false }

  const existing = users[index]
  if (!verifyPassword(currentPassword, existing.salt, existing.passwordHash)) {
    return { error: "invalid_credentials", ok: false }
  }

  const { hash, salt } = hashPassword(newPassword)
  users[index] = {
    ...existing,
    passwordHash: hash,
    salt,
  }
  writeUserRecords(users)
  return { ok: true }
}

export function updateLocalUserProfile(
  username: string,
  input: {
    avatarUrl?: string | null
    displayName?: string | null
    email?: string | null
  }
) {
  const normalized = normalizeOwner(username)
  const users = readUserRecords()
  const index = users.findIndex((item) => item.username === normalized)
  if (index === -1) return null

  const existing = users[index]
  const updated: LocalUserRecord = {
    ...existing,
    avatarUrl: input.avatarUrl !== undefined ? input.avatarUrl : existing.avatarUrl,
    displayName:
      input.displayName !== undefined
        ? input.displayName || normalized
        : existing.displayName,
    email: input.email !== undefined ? input.email : existing.email,
  }
  users[index] = updated
  writeUserRecords(users)
  return publicUser(updated)
}

export function deleteLocalUser(username: string) {
  const normalized = normalizeOwner(username)
  const users = readUserRecords()
  const nextUsers = users.filter((item) => item.username !== normalized)
  if (nextUsers.length === users.length) return false

  for (const repo of listRepositoriesForOwner(normalized)) {
    deleteLocalRepository(repo.owner, repo.name)
  }

  writeUserRecords(nextUsers)
  return true
}

export function toSessionUser(user: LocalUser) {
  return {
    accessToken: `local:${user.username}`,
    email: user.email,
    image: user.avatarUrl ?? null,
    login: user.username,
    name: user.displayName,
  }
}
