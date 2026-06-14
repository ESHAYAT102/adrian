import Link from "next/link"

export default function NotFoundPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-4 text-center text-foreground">
      <div className="text-8xl font-black">404</div>
      <h1 className="text-xl font-semibold">Repository not found</h1>
      <p className="max-w-md text-sm text-muted-foreground">
        The self-hosted repository or page you requested does not exist.
      </p>
      <Link
        href="/"
        className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
      >
        Go home
      </Link>
    </main>
  )
}
