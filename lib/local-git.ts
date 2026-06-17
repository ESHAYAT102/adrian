import { execFileSync } from "node:child_process"
import {
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs"
import { basename, dirname, extname, join, normalize } from "node:path"

export type LocalRepositoryMetadata = {
  archived?: boolean
  createdAt: string
  defaultBranch: string
  description: string | null
  fork?: boolean
  forkedFrom?: { owner: string; name: string } | null
  homepage?: string | null
  name: string
  owner: string
  private?: boolean
  size?: number
  starredBy?: string[]
  topics?: string[]
  updatedAt: string
}

export type LocalRepositoryHandle = LocalRepositoryMetadata & {
  barePath: string
  clonePath: string
  commitAll: (message: string) => void
  workTreePath: string
}

export type LocalRepositoryContent = {
  content?: string
  encoding?: "base64" | "utf-8"
  name: string
  path: string
  sha: string
  size: number
  type: "dir" | "file"
}

export type LocalReleaseAsset = {
  contentType: string
  downloadUrl: string
  name: string
  size: number
}

export type LocalRepositoryRelease = {
  assets: LocalReleaseAsset[]
  body: string | null
  createdAt: string
  name: string | null
  owner: string
  repo: string
  tagName: string
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

function refExists(cwd: string, ref: string) {
  try {
    execFileSync("git", ["rev-parse", "--verify", `${ref}^{commit}`], {
      cwd,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    })
    return true
  } catch {
    return false
  }
}

let _dataDirWarned = false

export function getDataDir() {
  const dir = process.env.ADRIAN_DATA_DIR || join(process.cwd(), "..", ".adrian-data")
  if (!process.env.ADRIAN_DATA_DIR && !_dataDirWarned) {
    _dataDirWarned = true
    console.warn(`[adrian] ADRIAN_DATA_DIR not set. Data directory: ${dir}`)
    console.warn("[adrian] Set ADRIAN_DATA_DIR to a path outside your project to ensure data survives git operations and container rebuilds.")
  }
  return dir
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

function getReleasesDir() {
  return join(getDataDir(), "releases")
}

function getRepositoryReleaseDir(owner: string, name: string) {
  return join(getReleasesDir(), normalizeOwner(owner), normalizeRepositoryName(name))
}

function getRepositoryReleasesPath(owner: string, name: string) {
  return join(getRepositoryReleaseDir(owner, name), "releases.json")
}

export function ensureLocalGitStorage() {
  mkdirSync(getReposDir(), { recursive: true })
  mkdirSync(getWorktreesDir(), { recursive: true })
  if (!existsSync(getDbPath())) writeFileSync(getDbPath(), "[]\n")
}

function readMetadata(): LocalRepositoryMetadata[] {
  ensureLocalGitStorage()
  const raw = JSON.parse(readFileSync(getDbPath(), "utf8")) as Array<Partial<LocalRepositoryMetadata>>
  return raw.map((repo) => ({
    archived: repo.archived ?? false,
    createdAt: repo.createdAt ?? new Date(0).toISOString(),
    defaultBranch: repo.defaultBranch ?? DEFAULT_BRANCH,
    description: repo.description ?? null,
    homepage: repo.homepage ?? null,
    name: repo.name ?? "repo",
    owner: repo.owner ?? "eshayat",
    private: repo.private ?? false,
    size: repo.size ?? 0,
    starredBy: repo.starredBy ?? [],
    topics: repo.topics ?? [],
    updatedAt: repo.updatedAt ?? repo.createdAt ?? new Date(0).toISOString(),
  }))
}

function writeMetadata(repositories: LocalRepositoryMetadata[]) {
  ensureLocalGitStorage()
  writeFileSync(getDbPath(), `${JSON.stringify(repositories, null, 2)}\n`)
}

export function validateUsername(username: string) {
  const normalized = username.trim()
  if (!normalized) return { ok: false, error: "Username is required" }
  if (normalized === ".git" || normalized.endsWith(".git")) {
    return { ok: false, error: "Usernames should omit the .git suffix" }
  }
  if (normalized.startsWith(".") || normalized.includes("..")) {
    return { ok: false, error: "Usernames cannot be hidden or contain .." }
  }
  if (!/^[A-Za-z0-9][A-Za-z0-9-]{0,38}$/.test(normalized)) {
    return { ok: false, error: "Use 1-39 letters, numbers, or dashes" }
  }
  return { ok: true as const }
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
    return { ok: false, error: "Use 1-100 letters, numbers, dots, underscores, or dashes" }
  }
  return { ok: true as const }
}

export function normalizeOwner(owner: string) {
  return owner.trim().toLowerCase()
}

export function normalizeRepositoryName(name: string) {
  return name.trim().replace(/\.git$/, "")
}

export function getRepositoryClonePath(owner: string, name: string) {
  return `/${normalizeOwner(owner)}/${normalizeRepositoryName(name)}.git`
}

export function getRepositoryPaths(owner: string, name: string) {
  const normalizedOwner = normalizeOwner(owner)
  const normalized = normalizeRepositoryName(name)
  return {
    barePath: join(getReposDir(), normalizedOwner, `${normalized}.git`),
    clonePath: getRepositoryClonePath(normalizedOwner, normalized),
    workTreePath: join(getWorktreesDir(), normalizedOwner, normalized),
  }
}

function toHandle(metadata: LocalRepositoryMetadata): LocalRepositoryHandle {
  const paths = getRepositoryPaths(metadata.owner, metadata.name)
  return {
    ...metadata,
    ...paths,
    commitAll(message: string) {
      commitRepositoryChanges(metadata.owner, metadata.name, message)
    },
  }
}

export function listLocalRepositories() {
  return readMetadata().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
}

export function listRepositoriesForOwner(owner: string) {
  const normalizedOwner = normalizeOwner(owner)
  return listLocalRepositories().filter((repo) => repo.owner === normalizedOwner)
}

export function isLocalRepositoryStarredByUser(owner: string, name: string, username: string) {
  const repo = getLocalRepository(owner, name)
  return Boolean(repo?.starredBy?.includes(normalizeOwner(username)))
}

export function starLocalRepositoryForUser(owner: string, name: string, username: string) {
  const normalizedUsername = normalizeOwner(username)
  return updateRepoMetadata(owner, name, (repo) => ({
    ...repo,
    starredBy: Array.from(new Set([...(repo.starredBy ?? []), normalizedUsername])),
  }))
}

export function unstarLocalRepositoryForUser(owner: string, name: string, username: string) {
  const normalizedUsername = normalizeOwner(username)
  return updateRepoMetadata(owner, name, (repo) => ({
    ...repo,
    starredBy: (repo.starredBy ?? []).filter((starredUser) => starredUser !== normalizedUsername),
  }))
}

export function getLocalRepository(owner: string, name: string) {
  const normalizedOwner = normalizeOwner(owner)
  const normalized = normalizeRepositoryName(name)
  const metadata = readMetadata().find((repo) => repo.owner === normalizedOwner && repo.name === normalized)
  return metadata ? toHandle(metadata) : null
}

function updateRepoMetadata(owner: string, name: string, updater: (repo: LocalRepositoryMetadata) => LocalRepositoryMetadata) {
  const normalizedOwner = normalizeOwner(owner)
  const normalized = normalizeRepositoryName(name)
  let updated: LocalRepositoryMetadata | null = null
  writeMetadata(readMetadata().map((repo) => {
    if (repo.owner !== normalizedOwner || repo.name !== normalized) return repo
    updated = updater(repo)
    return updated
  }))
  if (!updated) throw new Error("Repository not found")
  return toHandle(updated)
}

export function createLocalRepository({
  autoInit = true,
  description = null,
  homepage = null,
  name,
  owner,
  private: isPrivate = false,
}: {
  autoInit?: boolean
  description?: string | null
  homepage?: string | null
  name: string
  owner: string
  private?: boolean
}) {
  const normalizedOwner = normalizeOwner(owner)
  const normalized = normalizeRepositoryName(name)
  const ownerValidation = validateUsername(normalizedOwner)
  if (!ownerValidation.ok) throw new Error(ownerValidation.error)
  const validation = validateRepositoryName(normalized)
  if (!validation.ok) throw new Error(validation.error)
  if (getLocalRepository(normalizedOwner, normalized)) throw new Error("Repository already exists")

  ensureLocalGitStorage()
  const now = new Date().toISOString()
  const paths = getRepositoryPaths(normalizedOwner, normalized)
  mkdirSync(paths.workTreePath, { recursive: true })
  mkdirSync(paths.barePath, { recursive: true })

  runGit(["init", "-b", DEFAULT_BRANCH], paths.workTreePath)
  runGit(["config", "user.name", GIT_AUTHOR], paths.workTreePath)
  runGit(["config", "user.email", GIT_EMAIL], paths.workTreePath)
  runGit(["init", "--bare", "-b", DEFAULT_BRANCH], paths.barePath)
  runGit(["config", "http.receivepack", "true"], paths.barePath)
  runGit(["remote", "add", "origin", paths.barePath], paths.workTreePath)
  if (autoInit) {
    writeFileSync(join(paths.workTreePath, "README.md"), `# ${normalized}\n\n${description || "An Adrian repository."}\n`)
    runGit(["add", "README.md"], paths.workTreePath)
    runGit(["commit", "-m", "Initial commit"], paths.workTreePath)
    runGit(["push", "-u", "origin", DEFAULT_BRANCH], paths.workTreePath)
  }
  runGit(["update-server-info"], paths.barePath)

  const metadata: LocalRepositoryMetadata = {
    archived: false,
    createdAt: now,
    defaultBranch: DEFAULT_BRANCH,
    description,
    homepage,
    name: normalized,
    owner: normalizedOwner,
    private: isPrivate,
    size: 0,
    starredBy: [],
    topics: [],
    updatedAt: now,
  }
  writeMetadata([...readMetadata(), metadata])

  return toHandle(metadata)
}

export function updateLocalRepositoryMetadata(owner: string, name: string, input: Partial<LocalRepositoryMetadata> & { default_branch?: string | null }) {
  return updateRepoMetadata(owner, name, (repo) => ({
    ...repo,
    archived: input.archived ?? repo.archived,
    defaultBranch: input.default_branch ?? input.defaultBranch ?? repo.defaultBranch,
    description: input.description ?? repo.description,
    homepage: input.homepage ?? repo.homepage ?? null,
    name: input.name ? normalizeRepositoryName(input.name) : repo.name,
    private: input.private ?? repo.private,
    updatedAt: new Date().toISOString(),
  }))
}

export function forkLocalRepository(
  owner: string,
  name: string,
  newOwner: string,
  newName: string
) {
  const source = getLocalRepository(owner, name)
  if (!source) throw new Error("Source repository not found")

  const normalizedNewOwner = normalizeOwner(newOwner)
  const normalizedNewName = normalizeRepositoryName(newName)

  if (getLocalRepository(normalizedNewOwner, normalizedNewName)) {
    throw new Error("A repository with this name already exists")
  }

  ensureLocalGitStorage()
  const now = new Date().toISOString()
  const paths = getRepositoryPaths(normalizedNewOwner, normalizedNewName)
  mkdirSync(paths.workTreePath, { recursive: true })
  mkdirSync(paths.barePath, { recursive: true })

  runGit(["init", "-b", source.defaultBranch], paths.workTreePath)
  runGit(["config", "user.name", GIT_AUTHOR], paths.workTreePath)
  runGit(["config", "user.email", GIT_EMAIL], paths.workTreePath)
  runGit(["init", "--bare", "-b", source.defaultBranch], paths.barePath)
  runGit(["config", "http.receivepack", "true"], paths.barePath)
  runGit(["remote", "add", "origin", paths.barePath], paths.workTreePath)
  runGit(["remote", "add", "upstream", source.barePath], paths.workTreePath)
  runGit(["fetch", "upstream"], paths.workTreePath)
  runGit(["checkout", source.defaultBranch], paths.workTreePath)
  runGit(["push", "-u", "origin", `${source.defaultBranch}:${source.defaultBranch}`], paths.workTreePath)
  runGit(["remote", "remove", "upstream"], paths.workTreePath)
  runGit(["update-server-info"], paths.barePath)

  const metadata: LocalRepositoryMetadata = {
    archived: false,
    createdAt: now,
    defaultBranch: source.defaultBranch,
    description: source.description,
    fork: true,
    forkedFrom: { owner: normalizeOwner(owner), name: normalizeRepositoryName(name) },
    homepage: source.homepage,
    name: normalizedNewName,
    owner: normalizedNewOwner,
    private: source.private,
    size: 0,
    starredBy: [],
    topics: [],
    updatedAt: now,
  }
  writeMetadata([...readMetadata(), metadata])

  return toHandle(metadata)
}

export function listForkedRepositories(owner: string, name: string) {
  const normalizedOwner = normalizeOwner(owner)
  const normalizedName = normalizeRepositoryName(name)
  return readMetadata().filter(
    (repo) =>
      repo.fork &&
      repo.forkedFrom?.owner === normalizedOwner &&
      repo.forkedFrom?.name === normalizedName
  )
}

export function deleteLocalRepository(owner: string, name: string) {
  const repo = getLocalRepository(owner, name)
  if (!repo) throw new Error("Repository not found")
  rmSync(repo.workTreePath, { force: true, recursive: true })
  rmSync(repo.barePath, { force: true, recursive: true })
  writeMetadata(readMetadata().filter((item) => !(item.owner === repo.owner && item.name === repo.name)))
}

export function commitRepositoryChanges(owner: string, name: string, message: string) {
  const repo = getLocalRepository(owner, name)
  if (!repo) throw new Error("Repository not found")

  runGit(["add", "-A"], repo.workTreePath)
  const status = runGit(["status", "--porcelain"], repo.workTreePath)
  if (status) {
    runGit(["commit", "-m", message || "Update files"], repo.workTreePath)
    runGit(["push", "origin", repo.defaultBranch], repo.workTreePath)
    runGit(["update-server-info"], repo.barePath)
  }

  updateRepoMetadata(owner, name, (item) => ({ ...item, updatedAt: new Date().toISOString() }))
}

export function syncLocalRepositoryWorkTree(owner: string, name: string) {
  const repo = getLocalRepository(owner, name)
  if (!repo) throw new Error("Repository not found")

  runGit(["fetch", "origin"], repo.workTreePath)
  const remoteBranch = `origin/${repo.defaultBranch}`
  if (!refExists(repo.workTreePath, remoteBranch)) return

  runGit(["checkout", "-B", repo.defaultBranch, remoteBranch], repo.workTreePath)
  runGit(["reset", "--hard", remoteBranch], repo.workTreePath)
  runGit(["update-server-info"], repo.barePath)
  updateRepoMetadata(owner, name, (item) => ({ ...item, updatedAt: new Date().toISOString() }))
}

export function writeRepositoryFile({ content, message, name, owner, path }: { content: string; message?: string; name: string; owner: string; path: string }) {
  const repo = getLocalRepository(owner, name)
  if (!repo) throw new Error("Repository not found")
  const safePath = path.split("/").filter(Boolean)
  if (safePath.length === 0 || safePath.some((part) => part === "..")) throw new Error("Invalid file path")
  const absolutePath = join(repo.workTreePath, ...safePath)
  mkdirSync(dirname(absolutePath), { recursive: true })
  writeFileSync(absolutePath, content)
  commitRepositoryChanges(owner, name, message || `Update ${safePath.join("/")}`)
}

function getTreeEntries(owner: string, name: string, path = "", branch?: string) {
  const repo = getLocalRepository(owner, name)
  if (!repo) return []
  const ref = branch || repo.defaultBranch
  if (!refExists(repo.workTreePath, ref)) return []
  const treeish = path ? `${ref}:${path}` : ref
  try {
    return runGit(["ls-tree", treeish], repo.workTreePath)
      .split("\n")
      .filter(Boolean)
      .map((line) => {
        const [meta, fileName] = line.split("\t")
        const [mode, type, sha] = meta.split(" ")
        const fullPath = path ? `${path}/${fileName}` : fileName
        const size = type === "blob" ? Number(runGit(["cat-file", "-s", sha], repo.workTreePath)) : 0
        return { mode, name: fileName, path: fullPath, sha, size, type: type === "tree" ? "dir" as const : "file" as const }
      })
  } catch {
    return []
  }
}

export function getRepositoryContents(owner: string, name: string, path = "", branch?: string): LocalRepositoryContent[] {
  return getTreeEntries(owner, name, path, branch)
}

export function getRepositoryFiles(owner: string, name: string, branch?: string) {
  const repo = getLocalRepository(owner, name)
  if (!repo) return []
  if (!refExists(repo.workTreePath, branch || repo.defaultBranch)) return []
  try {
    return runGit(["ls-tree", "-r", "--name-only", branch || repo.defaultBranch], repo.workTreePath).split("\n").filter(Boolean)
  } catch {
    return []
  }
}

export function getRepositoryFileText(owner: string, name: string, path: string, branch?: string) {
  const repo = getLocalRepository(owner, name)
  if (!repo) return null
  const normalized = normalize(path)
  if (normalized.startsWith("..")) return null
  if (!refExists(repo.workTreePath, branch || repo.defaultBranch)) return null
  try {
    const sha = runGit(["rev-parse", `${branch || repo.defaultBranch}:${normalized}`], repo.workTreePath)
    return { content: runGit(["show", `${branch || repo.defaultBranch}:${normalized}`], repo.workTreePath), name: basename(normalized), path: normalized, sha }
  } catch {
    return null
  }
}

export function getRepositoryReadme(owner: string, name: string, branch?: string) {
  for (const path of ["README.md", "readme.md", "README"]) {
    const file = getRepositoryFileText(owner, name, path, branch)
    if (file) return file
  }
  return null
}

export function getRepositoryCommits(owner: string, name: string, limit = 20, branch?: string) {
  const repo = getLocalRepository(owner, name)
  if (!repo) return []
  if (!refExists(repo.workTreePath, branch || repo.defaultBranch)) return []
  try {
    return runGit(["log", `-${limit}`, "--date=iso-strict", "--format=%H%x1f%an%x1f%ad%x1f%s", branch || repo.defaultBranch], repo.workTreePath)
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

const LANGUAGE_BY_EXT: Record<string, string> = {
  ".css": "CSS",
  ".go": "Go",
  ".html": "HTML",
  ".js": "JavaScript",
  ".jsx": "JavaScript",
  ".json": "JSON",
  ".md": "Markdown",
  ".py": "Python",
  ".rs": "Rust",
  ".ts": "TypeScript",
  ".tsx": "TypeScript",
}

export function getRepositoryLanguages(owner: string, name: string) {
  const repo = getLocalRepository(owner, name)
  if (!repo) return {}
  const languages: Record<string, number> = {}
  for (const file of getRepositoryFiles(owner, name)) {
    const language = LANGUAGE_BY_EXT[extname(file).toLowerCase()]
    if (!language) continue
    const absolutePath = join(repo.workTreePath, file)
    const size = existsSync(absolutePath) && statSync(absolutePath).isFile() ? statSync(absolutePath).size : 0
    languages[language] = (languages[language] ?? 0) + size
  }
  return languages
}

function readRepositoryReleases(owner: string, name: string): LocalRepositoryRelease[] {
  const path = getRepositoryReleasesPath(owner, name)
  if (!existsSync(path)) return []
  return JSON.parse(readFileSync(path, "utf8")) as LocalRepositoryRelease[]
}

function writeRepositoryReleases(owner: string, name: string, releases: LocalRepositoryRelease[]) {
  const dir = getRepositoryReleaseDir(owner, name)
  mkdirSync(dir, { recursive: true })
  writeFileSync(getRepositoryReleasesPath(owner, name), `${JSON.stringify(releases, null, 2)}\n`)
}

export function listRepositoryReleases(owner: string, name: string) {
  return readRepositoryReleases(owner, name).sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export function createLocalRepositoryRelease({
  assets = [],
  body = null,
  name = null,
  owner,
  repo,
  tagName,
}: {
  assets?: Array<{ content: Buffer | string; contentType?: string; name: string }>
  body?: string | null
  name?: string | null
  owner: string
  repo: string
  tagName: string
}) {
  const repository = getLocalRepository(owner, repo)
  if (!repository) throw new Error("Repository not found")
  const normalizedTag = tagName.trim()
  if (!normalizedTag) throw new Error("Tag is required")

  const releaseDir = getRepositoryReleaseDir(owner, repo)
  const assetDir = join(releaseDir, "assets", normalizedTag.replace(/[^A-Za-z0-9._-]/g, "-"))
  mkdirSync(assetDir, { recursive: true })

  const now = new Date().toISOString()
  const releaseAssets: LocalReleaseAsset[] = assets.map((asset) => {
    const safeName = basename(asset.name).replace(/[/\\]/g, "-")
    const content = Buffer.isBuffer(asset.content) ? asset.content : Buffer.from(asset.content)
    writeFileSync(join(assetDir, safeName), content)
    return {
      contentType: asset.contentType || "application/octet-stream",
      downloadUrl: `/api/repository-releases/assets?owner=${encodeURIComponent(normalizeOwner(owner))}&repo=${encodeURIComponent(normalizeRepositoryName(repo))}&tag=${encodeURIComponent(normalizedTag)}&name=${encodeURIComponent(safeName)}`,
      name: safeName,
      size: content.length,
    }
  })

  const release: LocalRepositoryRelease = {
    assets: releaseAssets,
    body,
    createdAt: now,
    name,
    owner: normalizeOwner(owner),
    repo: normalizeRepositoryName(repo),
    tagName: normalizedTag,
  }

  const next = [release, ...readRepositoryReleases(owner, repo).filter((item) => item.tagName !== normalizedTag)]
  writeRepositoryReleases(owner, repo, next)
  return release
}

export function readLocalReleaseAsset(owner: string, repo: string, tagName: string, assetName: string) {
  const release = readRepositoryReleases(owner, repo).find((item) => item.tagName === tagName)
  const safeName = basename(assetName).replace(/[/\\]/g, "-")
  const asset = release?.assets.find((item) => item.name === safeName)
  if (!release || !asset) return null
  const assetPath = join(
    getRepositoryReleaseDir(owner, repo),
    "assets",
    tagName.replace(/[^A-Za-z0-9._-]/g, "-"),
    safeName
  )
  if (!existsSync(assetPath)) return null
  return { ...asset, content: readFileSync(assetPath) }
}

export function removeAllLocalRepositoriesForTests() {
  rmSync(getDataDir(), { force: true, recursive: true })
}
