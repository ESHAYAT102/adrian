import { extname } from "node:path"

import type { SessionUser } from "@/lib/session"
import { getLocalUserByUsername, updateLocalUserProfile } from "@/lib/local-users"
import {
  createLocalRepository,
  deleteLocalRepository,
  getLocalRepository,
  getRepositoryCommits,
  getRepositoryContents,
  getRepositoryFileText,
  getRepositoryLanguages,
  getRepositoryReadme,
  listLocalRepositories,
  updateLocalRepositoryMetadata,
  writeRepositoryFile,
} from "@/lib/local-git"

export type GitHubProfile = {
  avatar_url: string | null
  bio: string | null
  blog: string | null
  company: string | null
  created_at: string
  followers?: number
  following?: number
  html_url: string
  location: string | null
  login: string
  name: string | null
  public_repos: number
  type?: "User" | "Organization"
}

export type GitHubViewerSettings = {
  avatarUrl: string | null
  bio: string | null
  blog: string | null
  canEditProfile: boolean
  canReadNotifications: boolean
  company: string | null
  email: string | null
  hireable: boolean | null
  htmlUrl: string
  location: string | null
  login: string
  name: string | null
  scopes: string[]
  twitterUsername: string | null
}

export type GitHubViewerSettingsUpdateInput = {
  bio?: string | null
  blog?: string | null
  company?: string | null
  hireable?: boolean | null
  location?: string | null
  name?: string | null
  twitter_username?: string | null
}

export type GitHubCreateRepositoryInput = {
  auto_init?: boolean
  description?: string | null
  homepage?: string | null
  name: string
  private?: boolean
}

export type GitHubRepositoryMetadataUpdateInput = {
  archived?: boolean
  default_branch?: string | null
  description?: string | null
  has_discussions?: boolean
  has_wiki?: boolean
  homepage?: string | null
  name?: string
  private?: boolean
}

export type GitHubRepositoryFileUpdateInput = {
  branch?: string
  content: string
  message: string
  path: string
  sha: string
}

export type GitHubRepositoryFileDeleteInput = {
  branch?: string
  message: string
  path: string
  sha: string
}

export type GitHubRepository = {
  archived: boolean
  clone_url: string
  created_at: string
  default_branch?: string
  description: string | null
  fork: boolean
  forks_count: number
  full_name?: string
  has_discussions: boolean
  has_wiki: boolean
  homepage?: string | null
  html_url: string
  id: number
  language: string | null
  languages_url: string
  name: string
  open_issues_count?: number
  owner: { avatar_url?: string | null; login: string }
  permissions?: { admin?: boolean; maintain?: boolean; push?: boolean }
  private: boolean
  pushed_at: string
  size?: number
  stargazers_count: number
  subscribers_count?: number
  topics?: string[]
  updated_at: string
  url: string
}

export type GitHubBranch = { name: string }
export type GitHubRepositoryLanguages = Record<string, number>
export type GitHubRepositoryContent = {
  content?: string
  download_url: string | null
  encoding?: "base64" | "utf-8"
  html_url: string | null
  name: string
  path: string
  sha?: string
  size: number
  type: "dir" | "file" | "submodule" | "symlink"
}
export type GitHubRepositoryReadme = { content: string; html_url: string; name: string; path: string; sha: string }
export type GitHubRepositoryPageData = {
  contents: GitHubRepositoryContent[]
  rateLimited?: boolean
  rateLimitReset?: number | null
  selectedItem: {
    downloadUrl: string | null
    htmlUrl: string | null
    isImage: boolean
    isMarkdown: boolean
    isText: boolean
    isVideo: boolean
    name: string
    path: string
    sha: string
    text: string
    type: "file"
  } | null
  readme: { htmlUrl: string; markdown: string; name: string; path: string; sha: string } | null
  repository: GitHubRepository
}
export type GitHubRepositoryCommit = {
  commit: { author: { date: string; name: string } | null; committer: { date: string } | null; message: string }
  html_url: string
  sha: string
}
export type GitHubRepositoryCommitDiffFile = { additions: number; changes: number; deletions: number; filename: string; patch: string | null; previousFilename: string | null; status: string }
export type GitHubRepositoryCommitDiff = { files: GitHubRepositoryCommitDiffFile[]; patch: string; sha: string }
export type GitHubRepositoryIssue = { comments: number; html_url: string; number: number; pull_request?: unknown; state: string; title: string; updated_at: string; user: { login: string } | null }
export type GitHubRepositoryPullRequest = { comments: number; html_url: string; number: number; state: string; title: string; updated_at: string; user: { login: string } | null }
export type GitHubRepositoryDiscussion = { comments: number; html_url: string; number: number; title: string; updated_at: string; user: { login: string } | null }
export type GitHubRepositoryRelease = { body: string | null; draft: boolean; html_url: string; name: string | null; prerelease: boolean; published_at: string | null; tag_name: string }
export type GitHubNotification = { id: string; reason: string; repositoryFullName: string; repositoryUrl: string; subjectTitle: string; subjectType: string; unread: boolean; updatedAt: string; url: string }
export type ProfileActivityItem = { category: "Commits" | "Discussions" | "Issues" | "Pull Requests" | "Repositories Created" | "Stars"; createdAt: string; id: string; repoName: string; title: string; url: string; status?: "open" | "closed" | "merged"; internalUrl?: string }

type SettingsResult = { settings: GitHubViewerSettings; error?: string; status?: number }
type RepositoryResult = { repository: GitHubRepository | null; error?: string; status?: number }
type DeleteResult = { ok: boolean; error?: string; status: number }
type FileUpdateResult = { commit: { sha: string }; content?: GitHubRepositoryContent[]; error?: string; status?: number }

function hashId(value: string) {
  let hash = 0
  for (let i = 0; i < value.length; i += 1) hash = (hash * 31 + value.charCodeAt(i)) | 0
  return Math.abs(hash)
}

function siteUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:8390").replace(/\/$/, "")
}

function toRepository(repo: ReturnType<typeof listLocalRepositories>[number], viewer?: SessionUser | null): GitHubRepository {
  const fullName = `${repo.owner}/${repo.name}`
  const languages = getRepositoryLanguages(repo.owner, repo.name)
  const language = Object.entries(languages).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null
  const canPush = viewer?.login === repo.owner
  return {
    archived: repo.archived ?? false,
    clone_url: `${siteUrl()}/${fullName}.git`,
    created_at: repo.createdAt,
    default_branch: repo.defaultBranch,
    description: repo.description,
    fork: false,
    forks_count: 0,
    full_name: fullName,
    has_discussions: false,
    has_wiki: false,
    homepage: repo.homepage ?? null,
    html_url: `/${fullName}`,
    id: hashId(fullName),
    language,
    languages_url: `/api/repository-languages?owner=${repo.owner}&repo=${repo.name}`,
    name: repo.name,
    open_issues_count: 0,
    owner: { avatar_url: null, login: repo.owner },
    permissions: { admin: canPush, maintain: canPush, push: canPush },
    private: repo.private ?? false,
    pushed_at: repo.updatedAt,
    size: repo.size ?? 0,
    stargazers_count: 0,
    subscribers_count: 0,
    topics: repo.topics ?? [],
    updated_at: repo.updatedAt,
    url: `${siteUrl()}/${fullName}`,
  }
}

function toProfile(username: string, viewer?: SessionUser | null): GitHubProfile {
  const repos = listLocalRepositories().filter((repo) => repo.owner === username)
  const localUser = getLocalUserByUsername(username)
  return {
    avatar_url: localUser?.avatarUrl ?? null,
    bio: viewer?.login === username ? "Your Adrian account" : "Adrian user",
    blog: null,
    company: null,
    created_at: localUser?.createdAt ?? repos.at(-1)?.createdAt ?? new Date(0).toISOString(),
    followers: 0,
    following: 0,
    html_url: `/${username}`,
    location: null,
    login: username,
    name: localUser?.displayName ?? (viewer?.login === username ? viewer.name : username),
    public_repos: repos.length,
    type: "User",
  }
}

export async function getGitHubViewerSettings(user: SessionUser | null): Promise<GitHubViewerSettings> {
  const login = user?.login ?? "guest"
  const localUser = user ? getLocalUserByUsername(user.login) : null
  return {
    avatarUrl: localUser?.avatarUrl ?? user?.image ?? null,
    bio: null,
    blog: null,
    canEditProfile: true,
    canReadNotifications: true,
    company: null,
    email: localUser?.email ?? user?.email ?? null,
    hireable: null,
    htmlUrl: `/${login}`,
    location: null,
    login,
    name: localUser?.displayName ?? user?.name ?? login,
    scopes: ["adrian:local-git"],
    twitterUsername: null,
  }
}

export async function updateGitHubViewerSettings(user: SessionUser | null, input: GitHubViewerSettingsUpdateInput): Promise<SettingsResult> {
  if (!user) return { error: "unauthorized", settings: await getGitHubViewerSettings(null), status: 401 }
  updateLocalUserProfile(user.login, { displayName: input.name })
  return { settings: await getGitHubViewerSettings(user) }
}

export async function createGitHubRepository(user: SessionUser, input: GitHubCreateRepositoryInput): Promise<RepositoryResult> {
  const repo = createLocalRepository({
    autoInit: input.auto_init ?? false,
    description: input.description ?? null,
    homepage: input.homepage ?? null,
    name: input.name,
    owner: user.login,
    private: Boolean(input.private),
  })
  return { repository: toRepository(repo, user) }
}

export async function updateGitHubRepositoryMetadata(user: SessionUser, owner: string, repo: string, input: GitHubRepositoryMetadataUpdateInput): Promise<RepositoryResult> {
  if (user.login !== owner) throw new Error("Only the repository owner can update this repository")
  return { repository: toRepository(updateLocalRepositoryMetadata(owner, repo, input), user) }
}

export async function deleteGitHubRepository(user: SessionUser, owner: string, repo: string): Promise<DeleteResult> {
  if (user.login !== owner) throw new Error("Only the repository owner can delete this repository")
  deleteLocalRepository(owner, repo)
  return { ok: true, status: 200 }
}

export async function isGitHubRepositoryStarred(_user?: SessionUser | null, _owner?: string, _repo?: string) { return false }
export async function starGitHubRepository(_user: SessionUser, owner: string, repo: string): Promise<RepositoryResult> { return getGitHubRepository(owner, repo, _user).then((r) => ({ repository: r.repository, status: 200 })) }
export async function unstarGitHubRepository(_user: SessionUser, owner: string, repo: string): Promise<RepositoryResult> { return getGitHubRepository(owner, repo, _user).then((r) => ({ repository: r.repository, status: 200 })) }
export async function forkGitHubRepository(_user: SessionUser, owner: string, repo: string): Promise<RepositoryResult> { return getGitHubRepository(owner, repo, _user).then((r) => ({ repository: r.repository, status: 200 })) }

export async function getGitHubViewerRepositories(user: SessionUser) {
  return listLocalRepositories().filter((repo) => repo.owner === user.login).map((repo) => toRepository(repo, user))
}

export async function getTrendingRepositories(_user?: SessionUser | null) {
  return listLocalRepositories().slice(0, 12).map((repo) => toRepository(repo, _user))
}

export async function getGitHubProfilePageData(username: string, user?: SessionUser | null) {
  const repositories = listLocalRepositories().filter((repo) => repo.owner === username).map((repo) => toRepository(repo, user))
  return { profile: toProfile(username, user), rateLimited: false, rateLimitReset: null, repositories }
}

export async function getGitHubRepository(owner: string, repo: string, user?: SessionUser | null) {
  const local = getLocalRepository(owner, repo)
  return { repository: local ? toRepository(local, user) : null, rateLimited: false }
}

export async function getGitHubRepositoryLanguages(owner: string, repo: string, _user?: SessionUser | null) {
  return getRepositoryLanguages(owner, repo)
}

function isTextPath(path: string) {
  return /\.(md|mdx|txt|json|ts|tsx|js|jsx|css|html|yml|yaml|toml|go|py|rs|java|c|cpp|h|sh|env|gitignore)$/i.test(path) || !extname(path)
}
function isImagePath(path: string) { return /\.(png|jpe?g|gif|webp|svg|ico)$/i.test(path) }
function isVideoPath(path: string) { return /\.(mp4|webm|mov)$/i.test(path) }

export async function getGitHubRepositoryPageData(owner: string, repo: string, user?: SessionUser | null, path = "", branch?: string): Promise<GitHubRepositoryPageData> {
  const local = getLocalRepository(owner, repo)
  if (!local) throw new Error("Repository not found")
  const repository = toRepository(local, user)
  const contents = getRepositoryContents(owner, repo, path, branch).map((item) => ({
    content: item.content,
    download_url: null,
    encoding: item.encoding,
    html_url: `/${owner}/${repo}/tree/${item.path}`,
    name: item.name,
    path: item.path,
    sha: item.sha,
    size: item.size,
    type: item.type,
  })) satisfies GitHubRepositoryContent[]
  const readme = getRepositoryReadme(owner, repo, branch)
  const file = path ? getRepositoryFileText(owner, repo, path, branch) : null
  return {
    contents,
    rateLimited: false,
    selectedItem: file ? {
      downloadUrl: null,
      htmlUrl: `/${owner}/${repo}/blob/${file.path}`,
      isImage: isImagePath(file.path),
      isMarkdown: /\.mdx?$/i.test(file.path),
      isText: isTextPath(file.path),
      isVideo: isVideoPath(file.path),
      name: file.name,
      path: file.path,
      sha: file.sha,
      text: file.content,
      type: "file",
    } : null,
    readme: readme ? { htmlUrl: `/${owner}/${repo}/blob/${readme.path}`, markdown: readme.content, name: readme.name, path: readme.path, sha: readme.sha } : null,
    repository,
  }
}

export async function getGitHubRepositoryContents(owner: string, repo: string, path = "", _user?: SessionUser | null, branch?: string) {
  return getRepositoryContents(owner, repo, path, branch).map((item) => ({
    content: item.content,
    download_url: null,
    encoding: item.encoding,
    html_url: `/${owner}/${repo}/tree/${item.path}`,
    name: item.name,
    path: item.path,
    sha: item.sha,
    size: item.size,
    type: item.type,
  })) satisfies GitHubRepositoryContent[]
}

export async function updateGitHubRepositoryFile(user: SessionUser, owner: string, repo: string, input: GitHubRepositoryFileUpdateInput): Promise<FileUpdateResult> {
  if (user.login !== owner) throw new Error("Only the repository owner can update files")
  writeRepositoryFile({ content: input.content, message: input.message, name: repo, owner, path: input.path })
  return { commit: { sha: Date.now().toString(16) }, content: await getGitHubRepositoryContents(owner, repo, input.path, user, input.branch) }
}

export async function deleteGitHubRepositoryFile(_user: SessionUser, _owner: string, _repo: string, _input: GitHubRepositoryFileDeleteInput): Promise<FileUpdateResult> {
  return { commit: { sha: Date.now().toString(16) } }
}

export async function getGitHubRepositoryBranches(owner: string, repo: string, _user?: SessionUser | null) {
  const local = getLocalRepository(owner, repo)
  return local ? [{ name: local.defaultBranch }] : []
}

export async function getGitHubRepositoryCommits(owner: string, repo: string, _user?: SessionUser | null, branch?: string) {
  return getRepositoryCommits(owner, repo, 30, branch).map((commit) => ({
    commit: { author: { date: commit.date, name: commit.author }, committer: { date: commit.date }, message: commit.message },
    html_url: `/${owner}/${repo}/commit/${commit.sha}`,
    sha: commit.sha,
  })) satisfies GitHubRepositoryCommit[]
}

export async function getGitHubRepositoryCommitCount(owner: string, repo: string, _user?: SessionUser | null, branch?: string) { return getRepositoryCommits(owner, repo, 10_000, branch).length }
export async function getGitHubRepositoryCommitDiff(owner: string, repo: string, sha: string, _user?: SessionUser | null): Promise<GitHubRepositoryCommitDiff> {
  const local = getLocalRepository(owner, repo)
  if (!local) throw new Error("Repository not found")
  return { files: [], patch: "", sha }
}
export async function getGitHubRepositoryIssues(_owner?: string, _repo?: string, _user?: SessionUser | null): Promise<GitHubRepositoryIssue[]> { return [] }
export async function getGitHubRepositoryIssueCount(_owner?: string, _repo?: string, _user?: SessionUser | null) { return 0 }
export async function getGitHubRepositoryPullRequests(_owner?: string, _repo?: string, _user?: SessionUser | null): Promise<GitHubRepositoryPullRequest[]> { return [] }
export async function getGitHubRepositoryPullRequestCount(_owner?: string, _repo?: string, _user?: SessionUser | null) { return 0 }
export async function getGitHubRepositoryReleases(_owner?: string, _repo?: string, _user?: SessionUser | null): Promise<GitHubRepositoryRelease[]> { return [] }
export async function getGitHubRepositoryDiscussions(_owner?: string, _repo?: string, _user?: SessionUser | null): Promise<GitHubRepositoryDiscussion[]> { return [] }
export async function getGitHubRepositoryDiscussionCount(_owner?: string, _repo?: string, _user?: SessionUser | null) { return 0 }
export async function getGitHubNotifications(_user?: SessionUser | null, _options?: { unreadOnly?: boolean }): Promise<GitHubNotification[]> { return [] }
export async function markGitHubNotificationAsRead(_user?: SessionUser | null, _threadId?: string) { return { ok: true, status: 200 } }
export async function markGitHubNotificationAsDone(_user?: SessionUser | null, _threadId?: string) { return { ok: true, status: 200 } }
export async function unsubscribeFromGitHubNotification(_user?: SessionUser | null, _threadId?: string) { return { ok: true, status: 200 } }

export async function getGitHubActivity(username: string, user?: SessionUser | null): Promise<ProfileActivityItem[]> {
  return listLocalRepositories()
    .filter((repo) => repo.owner === username)
    .flatMap((repo) => getRepositoryCommits(repo.owner, repo.name, 5).map((commit) => ({
      category: "Commits" as const,
      createdAt: commit.date,
      id: `${repo.owner}/${repo.name}/${commit.sha}`,
      internalUrl: `/${repo.owner}/${repo.name}`,
      repoName: `${repo.owner}/${repo.name}`,
      title: commit.message,
      url: `/${repo.owner}/${repo.name}`,
    })))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export async function getGitHubStarredRepositories(_username?: string, _user?: SessionUser | null): Promise<GitHubRepository[]> { return [] }
