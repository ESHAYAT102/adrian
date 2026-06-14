import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"

import {
  getLocalRepository,
  getRepositoryCommits,
  getRepositoryFiles,
  getRepositoryReadme,
} from "@/lib/local-git"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ repo: string }>
}): Promise<Metadata> {
  const { repo } = await params
  const repository = getLocalRepository(repo)
  return {
    title: repository ? `${repository.name} · Adrian` : "Repository",
  }
}

export default async function RepositoryPage({
  params,
}: {
  params: Promise<{ repo: string }>
}) {
  const { repo } = await params
  const repository = getLocalRepository(repo)
  if (!repository) notFound()

  const files = getRepositoryFiles(repository.name)
  const readme = getRepositoryReadme(repository.name)
  const commits = getRepositoryCommits(repository.name)
  const cloneUrl = `/git/${repository.name}.git`

  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-10 md:px-8">
        <header className="space-y-5 border-b border-border pb-8">
          <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">
            ← Repositories
          </Link>
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="space-y-2">
              <h1 className="text-3xl font-black tracking-tight">
                {repository.name}
              </h1>
              <p className="max-w-2xl text-sm text-muted-foreground">
                {repository.description || "No description provided."}
              </p>
            </div>
            <div className="space-y-2 rounded-2xl border bg-card p-4 text-xs">
              <div className="text-muted-foreground">Clone URL</div>
              <code className="block rounded-lg bg-muted px-3 py-2 text-foreground">
                {cloneUrl}
              </code>
              <p className="text-muted-foreground">
                Use with your host, e.g. <code>git clone http://host{cloneUrl}</code>
              </p>
            </div>
          </div>
        </header>

        <section className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <div className="space-y-6">
            <div className="rounded-2xl border bg-card">
              <div className="border-b px-5 py-3 text-sm font-semibold">Files</div>
              <div className="divide-y">
                {files.length === 0 ? (
                  <p className="p-5 text-sm text-muted-foreground">No files yet.</p>
                ) : (
                  files.map((file) => (
                    <div key={file} className="px-5 py-3 font-mono text-sm">
                      {file}
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="rounded-2xl border bg-card">
              <div className="border-b px-5 py-3 text-sm font-semibold">
                {readme?.path || "README"}
              </div>
              <pre className="max-h-[520px] overflow-auto whitespace-pre-wrap p-5 text-sm leading-7 text-muted-foreground">
                {readme?.content || "No README found."}
              </pre>
            </div>
          </div>

          <aside className="space-y-6">
            <form
              action={`/api/repositories/${repository.name}/files`}
              method="post"
              className="space-y-4 rounded-2xl border bg-card p-5"
            >
              <div>
                <h2 className="font-semibold">Commit a file</h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  Writes into the worktree, commits, pushes to the bare repo, and updates clone metadata.
                </p>
              </div>
              <label className="block space-y-2 text-sm">
                <span>Path</span>
                <input
                  required
                  name="path"
                  placeholder="docs/hello.md"
                  className="w-full rounded-xl border bg-background px-3 py-2 outline-none focus:ring-2 focus:ring-ring"
                />
              </label>
              <label className="block space-y-2 text-sm">
                <span>Commit message</span>
                <input
                  name="message"
                  placeholder="Add docs"
                  className="w-full rounded-xl border bg-background px-3 py-2 outline-none focus:ring-2 focus:ring-ring"
                />
              </label>
              <label className="block space-y-2 text-sm">
                <span>Content</span>
                <textarea
                  required
                  name="content"
                  className="min-h-36 w-full rounded-xl border bg-background px-3 py-2 font-mono text-xs outline-none focus:ring-2 focus:ring-ring"
                />
              </label>
              <button className="w-full rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
                Commit file
              </button>
            </form>

            <div className="rounded-2xl border bg-card">
              <div className="border-b px-5 py-3 text-sm font-semibold">Commits</div>
              <div className="divide-y">
                {commits.map((commit) => (
                  <div key={commit.sha} className="space-y-1 px-5 py-3 text-sm">
                    <div className="font-medium">{commit.message}</div>
                    <div className="font-mono text-xs text-muted-foreground">
                      {commit.sha.slice(0, 7)} · {new Date(commit.date).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </section>
      </section>
    </main>
  )
}
