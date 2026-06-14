import { execFileSync } from "node:child_process"
import {
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs"
import { join } from "node:path"

export type LocalRepositoryMetadata = {
  createdAt: string
  defaultBranch: string
  description: string | null
  name: string
  updatedAt: string
}

export type LocalRepositoryHandle = LocalRepositoryMetadata & {
  barePath: string
  commitAll: (message: string) => void
  workTreePath: string
}

const DEFAULT_BRANCH = "main"
const GIT_AUTHOR = "Adrian"
const GIT_EMAIL = "adrian@selfhost.local"

function runGit(args: string[], cwd?: string) {
  return execFileSync("git", args, {
    cwd,
    encoding: "utf8",
    env: {
      ...process.env,
      GIT_AUTHOR_EMAIL: GIT_EMAIL,
      GIT_AUTHOR_NAME: GIT_AUTHOR,
      GIT_COMMITTER_EMAIL: GIT_EMAIL,
      GIT_COMMITTER_NAME: GIT_AUTHOR,
    },
  }).trim()
}

export function getDataDir() {
  return process.env.ADRIAN_DATA_DIR || join(process.cwd(), ".adrian-data")
}

function getReposDir() {
  return join(getDataDir(), "repos")
}

function getWorktreesDir() {
  return join(getDataDir(), "worktrees")
}

function getDbPath() {
  return join(getDataDir(), "repositories.json")
}

export function ensureLocalGitStorage() {
  mkdirSync(getReposDir(), { recursive: true })
  mkdirSync(getWorktreesDir(), { recursive: true })
  if (!existsSync(getDbPath())) writeFileSync(getDbPath(), "[]\n")
}

function readMetadata(): LocalRepositoryMetadata[] {
  ensureLocalGitStorage()
  return JSON.parse(readFileSync(getDbPath(), "utf8")) as LocalRepositoryMetadata[]
}

function writeMetadata(repositories: LocalRepositoryMetadata[]) {
  ensureLocalGitStorage()
  writeFileSync(getDbPath(), `${JSON.stringify(repositories, null, 2)}\n`)
}

export function validateRepositoryName(name: string) {
  const normalized = name.trim()
  if (!normalized) return { ok: false, error: "Repository name is required" }
  if (normalized === ".git" || normalized.endsWith(".git")) {
    return { ok: false, error: "Repository names should omit the .git suffix" }
  }
  if (normalized.startsWith(".") || normalized.includes("..")) {
    return { ok: false, error: "Repository names cannot be hidden or contain .." }
  }
  if (!/^[A-Za-z0-9][A-Za-z0-9._-]{0,99}$/.test(normalized)) {
    return {
      ok: false,
      error: "Use 1-100 letters, numbers, dots, underscores, or dashes",
    }
  }

  return { ok: true as const }
}

export function getRepositoryPaths(name: string) {
  const normalized = name.replace(/\.git$/, "")
  return {
    barePath: join(getReposDir(), `${normalized}.git`),
    workTreePath: join(getWorktreesDir(), normalized),
  }
}

function toHandle(metadata: LocalRepositoryMetadata): LocalRepositoryHandle {
  const paths = getRepositoryPaths(metadata.name)
  return {
    ...metadata,
    ...paths,
    commitAll(message: string) {
      commitRepositoryChanges(metadata.name, message)
    },
  }
}

export function listLocalRepositories() {
  return readMetadata().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
}

export function getLocalRepository(name: string) {
  const normalized = name.replace(/\.git$/, "")
  const metadata = readMetadata().find((repo) => repo.name === normalized)
  return metadata ? toHandle(metadata) : null
}

export function createLocalRepository({
  description = null,
  name,
}: {
  description?: string | null
  name: string
}) {
  const normalized = name.trim().replace(/\.git$/, "")
  const validation = validateRepositoryName(normalized)
  if (!validation.ok) throw new Error(validation.error)
  if (getLocalRepository(normalized)) throw new Error("Repository already exists")

  ensureLocalGitStorage()
  const now = new Date().toISOString()
  const paths = getRepositoryPaths(normalized)
  mkdirSync(paths.workTreePath, { recursive: true })
  mkdirSync(paths.barePath, { recursive: true })

  runGit(["init", "-b", DEFAULT_BRANCH], paths.workTreePath)
  runGit(["config", "user.name", GIT_AUTHOR], paths.workTreePath)
  runGit(["config", "user.email", GIT_EMAIL], paths.workTreePath)
  writeFileSync(
    join(paths.workTreePath, "README.md"),
    `# ${normalized}\n\n${description || "An Adrian repository."}\n`
  )
  runGit(["add", "README.md"], paths.workTreePath)
  runGit(["commit", "-m", "Initial commit"], paths.workTreePath)
  runGit(["init", "--bare", "-b", DEFAULT_BRANCH], paths.barePath)
  runGit(["remote", "add", "origin", paths.barePath], paths.workTreePath)
  runGit(["push", "-u", "origin", DEFAULT_BRANCH], paths.workTreePath)
  runGit(["update-server-info"], paths.barePath)

  const metadata: LocalRepositoryMetadata = {
    createdAt: now,
    defaultBranch: DEFAULT_BRANCH,
    description,
    name: normalized,
    updatedAt: now,
  }
  writeMetadata([...readMetadata(), metadata])

  return toHandle(metadata)
}

export function commitRepositoryChanges(name: string, message: string) {
  const repo = getLocalRepository(name)
  if (!repo) throw new Error("Repository not found")

  runGit(["add", "-A"], repo.workTreePath)
  const status = runGit(["status", "--porcelain"], repo.workTreePath)
  if (status) {
    runGit(["commit", "-m", message || "Update files"], repo.workTreePath)
    runGit(["push", "origin", repo.defaultBranch], repo.workTreePath)
    runGit(["update-server-info"], repo.barePath)
  }

  const now = new Date().toISOString()
  writeMetadata(
    readMetadata().map((item) =>
      item.name === repo.name ? { ...item, updatedAt: now } : item
    )
  )
}

export function writeRepositoryFile({
  content,
  message,
  name,
  path,
}: {
  content: string
  message?: string
  name: string
  path: string
}) {
  const repo = getLocalRepository(name)
  if (!repo) throw new Error("Repository not found")
  const safePath = path.split("/").filter(Boolean)
  if (safePath.length === 0 || safePath.some((part) => part === "..")) {
    throw new Error("Invalid file path")
  }
  const absolutePath = join(repo.workTreePath, ...safePath)
  mkdirSync(join(absolutePath, ".."), { recursive: true })
  writeFileSync(absolutePath, content)
  commitRepositoryChanges(repo.name, message || `Update ${safePath.join("/")}`)
}

export function getRepositoryFiles(name: string) {
  const repo = getLocalRepository(name)
  if (!repo) return []
  try {
    return runGit(["ls-tree", "-r", "--name-only", repo.defaultBranch], repo.workTreePath)
      .split("\n")
      .filter(Boolean)
  } catch {
    return []
  }
}

export function getRepositoryReadme(name: string) {
  const repo = getLocalRepository(name)
  if (!repo) return null
  for (const path of ["README.md", "readme.md", "README"]) {
    try {
      return {
        content: runGit(["show", `${repo.defaultBranch}:${path}`], repo.workTreePath),
        path,
      }
    } catch {}
  }
  return null
}

export function getRepositoryCommits(name: string, limit = 20) {
  const repo = getLocalRepository(name)
  if (!repo) return []
  try {
    return runGit(
      [
        "log",
        `-${limit}`,
        "--date=iso-strict",
        "--format=%H%x1f%an%x1f%ad%x1f%s",
        repo.defaultBranch,
      ],
      repo.workTreePath
    )
      .split("\n")
      .filter(Boolean)
      .map((line) => {
        const [sha, author, date, message] = line.split("\x1f")
        return { author, date, message, sha }
      })
  } catch {
    return []
  }
}

export function removeAllLocalRepositoriesForTests() {
  rmSync(getDataDir(), { force: true, recursive: true })
}
