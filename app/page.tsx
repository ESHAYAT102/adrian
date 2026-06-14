import Link from "next/link"

import { listLocalRepositories } from "@/lib/local-git"

function Brand() {
  return (
    <Link href="/" className="text-2xl font-black tracking-tight text-foreground">
      Adrian
    </Link>
  )
}

export default function HomePage() {
  const repositories = listLocalRepositories()

  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="mx-auto flex w-full max-w-5xl flex-col gap-10 px-4 py-10 md:px-8">
        <header className="flex flex-col gap-4 border-b border-border pb-8 md:flex-row md:items-center md:justify-between">
          <div className="space-y-3">
            <Brand />
            <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
              A self-hostable Git workspace with local repositories, browser-based
              repo discovery, and plain Git clone endpoints — no GitHub required.
            </p>
          </div>
          <code className="rounded-full border bg-muted px-3 py-1 text-xs text-muted-foreground">
            git clone /git/&lt;repo&gt;.git
          </code>
        </header>

        <section className="grid gap-6 md:grid-cols-[1fr_340px]">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h1 className="text-xl font-semibold">Repositories</h1>
              <span className="text-xs text-muted-foreground">
                {repositories.length} total
              </span>
            </div>

            {repositories.length === 0 ? (
              <div className="rounded-2xl border border-dashed bg-card p-10 text-center text-sm text-muted-foreground">
                No repositories yet. Create one to start hosting Git locally.
              </div>
            ) : (
              <div className="grid gap-3">
                {repositories.map((repo) => (
                  <Link
                    key={repo.name}
                    href={`/${repo.name}`}
                    className="group rounded-2xl border bg-card p-5 transition hover:border-primary/50 hover:bg-muted/40"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-2">
                        <h2 className="text-lg font-semibold group-hover:text-primary">
                          {repo.name}
                        </h2>
                        <p className="text-sm text-muted-foreground">
                          {repo.description || "No description provided."}
                        </p>
                      </div>
                      <span className="rounded-full border px-2 py-1 text-[11px] text-muted-foreground">
                        {repo.defaultBranch}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          <form
            action="/api/repositories"
            method="post"
            className="h-fit space-y-4 rounded-2xl border bg-card p-5"
          >
            <div>
              <h2 className="font-semibold">Create repository</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                Creates a real Git repository on the mounted data volume.
              </p>
            </div>
            <label className="block space-y-2 text-sm">
              <span>Name</span>
              <input
                required
                name="name"
                pattern="[A-Za-z0-9][A-Za-z0-9._-]{0,99}"
                placeholder="my-project"
                className="w-full rounded-xl border bg-background px-3 py-2 outline-none focus:ring-2 focus:ring-ring"
              />
            </label>
            <label className="block space-y-2 text-sm">
              <span>Description</span>
              <textarea
                name="description"
                placeholder="What is this repo for?"
                className="min-h-24 w-full rounded-xl border bg-background px-3 py-2 outline-none focus:ring-2 focus:ring-ring"
              />
            </label>
            <button className="w-full rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
              Create repo
            </button>
          </form>
        </section>
      </section>
    </main>
  )
}
