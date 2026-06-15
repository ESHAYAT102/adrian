"use client"

import { useRef, useState, type DragEvent, type FormEvent } from "react"
import { UploadCloud, X } from "lucide-react"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"

type RepositoryReleaseFormProps = {
  owner: string
  repo: string
}

export default function RepositoryReleaseForm({ owner, repo }: RepositoryReleaseFormProps) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [files, setFiles] = useState<File[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const addFiles = (nextFiles: FileList | File[]) => {
    setFiles((current) => {
      const byKey = new Map(current.map((file) => [`${file.name}:${file.size}`, file]))
      for (const file of Array.from(nextFiles)) {
        byKey.set(`${file.name}:${file.size}`, file)
      }
      return Array.from(byKey.values())
    })
  }

  const onDrop = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault()
    setIsDragging(false)
    addFiles(event.dataTransfer.files)
  }

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    setIsSubmitting(true)

    const form = event.currentTarget
    const formData = new FormData(form)
    formData.set("owner", owner)
    formData.set("repo", repo)
    formData.delete("assets")
    for (const file of files) formData.append("assets", file)

    try {
      const response = await fetch("/api/repository-releases", {
        body: formData,
        method: "POST",
      })
      if (!response.ok) {
        const payload = await response.json().catch(() => ({})) as { error?: string }
        throw new Error(payload.error || "Could not create release")
      }
      form.reset()
      setFiles([])
      router.refresh()
    } catch (releaseError) {
      setError(releaseError instanceof Error ? releaseError.message : "Could not create release")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 border-b border-border p-5">
      <div className="space-y-1">
        <h3 className="text-sm font-semibold">Create release</h3>
        <p className="text-xs text-muted-foreground">
          Publish a tag with release notes and optional downloadable files.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="space-y-1.5 text-sm font-medium">
          Tag
          <input
            name="tagName"
            required
            placeholder="v1.0.0"
            className="h-10 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none focus:border-ring focus:ring-3 focus:ring-ring/20"
          />
        </label>
        <label className="space-y-1.5 text-sm font-medium">
          Title
          <input
            name="title"
            required
            placeholder="Version 1.0.0"
            className="h-10 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none focus:border-ring focus:ring-3 focus:ring-ring/20"
          />
        </label>
      </div>

      <label className="space-y-1.5 text-sm font-medium">
        Description <span className="text-muted-foreground">optional</span>
        <textarea
          name="description"
          rows={4}
          placeholder="What changed in this release?"
          className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-ring focus:ring-3 focus:ring-ring/20"
        />
      </label>

      <label
        onDragOver={(event) => {
          event.preventDefault()
          setIsDragging(true)
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={onDrop}
        className={[
          "flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed p-6 text-center transition",
          isDragging ? "border-foreground bg-muted" : "border-border hover:bg-muted/60",
        ].join(" ")}
      >
        <UploadCloud className="size-6 text-muted-foreground" />
        <span className="mt-2 text-sm font-medium">Drag and drop files here</span>
        <span className="mt-1 text-xs text-muted-foreground">or click to choose release assets</span>
        <input
          ref={fileInputRef}
          name="assets"
          type="file"
          multiple
          className="sr-only"
          onChange={(event) => event.target.files && addFiles(event.target.files)}
        />
      </label>

      {files.length > 0 ? (
        <div className="space-y-2 rounded-2xl border border-border p-3">
          {files.map((file) => (
            <div key={`${file.name}:${file.size}`} className="flex items-center justify-between gap-3 text-sm">
              <span className="min-w-0 truncate">{file.name}</span>
              <button
                type="button"
                onClick={() => setFiles((current) => current.filter((item) => item !== file))}
                className="rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                aria-label={`Remove ${file.name}`}
              >
                <X className="size-4" />
              </button>
            </div>
          ))}
        </div>
      ) : null}

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <Button type="submit" disabled={isSubmitting} className="rounded-xl">
        {isSubmitting ? "Creating…" : "Create release"}
      </Button>
    </form>
  )
}
