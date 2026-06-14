import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto"
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs"
import { join } from "node:path"

import { getDataDir, validateUsername, normalizeOwner } from "@/lib/local-git"

export type LocalUserRecord = {
  createdAt: string
  displayName: string | null
  email: string | null
  passwordHash: string
  salt: string
  username: string
}

export type LocalUser = Omit<LocalUserRecord, "passwordHash" | "salt">

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
  const user = readUserRecords().find((item) => item.username === normalized)
  if (!user) return null
  if (!verifyPassword(password, user.salt, user.passwordHash)) return null
  return publicUser(user)
}

export function toSessionUser(user: LocalUser) {
  return {
    accessToken: `local:${user.username}`,
    email: user.email,
    image: null,
    login: user.username,
    name: user.displayName,
  }
}
