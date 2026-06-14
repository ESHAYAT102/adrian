"use client"

import { useState } from "react"
import { Loader2, Pencil, Save } from "lucide-react"
import { toast } from "sonner"

import A from "@/components/A"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import type { GitHubRepository } from "@/lib/github"

type RepositoryAboutEditorProps = {
  canEdit: boolean
  initialDescription: string | null
  initialHomepage: string | null
  owner: string
  repo: string
}

export default function RepositoryAboutEditor({
  canEdit,
  initialDescription,
  initialHomepage,
  owner,
  repo,
}: RepositoryAboutEditorProps) {
  const [description, setDescription] = useState(initialDescription ?? "")
  const [homepage, setHomepage] = useState(initialHomepage ?? "")
  const [isSaving, setIsSaving] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleSave = async () => {
    setIsSaving(true)
    setNotice(null)
    setError(null)

    const response = await fetch("/api/repository", {
      body: JSON.stringify({
        description: description || null,
        homepage: homepage || null,
        owner,
        repo,
      }),
      headers: {
        "Content-Type": "application/json",
      },
      method: "PATCH",
    })

    const data = (await response.json()) as {
      error?: string
      repository?: GitHubRepository
    }

    setIsSaving(false)

    if (!response.ok) {
      const message =
        data.error === "forbidden"
          ? "You do not have permission to edit this repository from the current Adrian session."
          : data.error === "validation_failed"
            ? "GitHub rejected one of the values. Check the description or homepage and try again."
            : "Saving failed. Please try again."
      setError(message)
      toast.error(message)
      return
    }

    if (data.repository) {
      setDescription(data.repository.description ?? "")
      setHomepage(data.repository.homepage ?? "")
    }

    setNotice("Repository details saved.")
    toast.success("Repository details saved")
    setIsOpen(false)
  }

  return (
    <>
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          {description || "No description provided."}
        </p>

        {homepage ? (
          <A
            href={homepage}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            {homepage.replace(/^https?:\/\//, "")}
          </A>
        ) : null}

        {canEdit ? (
          <Button
            variant="outline"
            size="sm"
            className="w-full rounded-xl"
            onClick={() => {
              setNotice(null)
              setError(null)
              setIsOpen(true)
            }}
          >
            <Pencil className="mr-2" />
            Edit details
          </Button>
        ) : (
          <p className="text-xs text-muted-foreground">
            Repository details can only be edited from repos you own with the
            current Adrian session.
          </p>
        )}

        {notice ? <p className="text-xs text-foreground">{notice}</p> : null}
        {error ? <p className="text-xs text-destructive">{error}</p> : null}
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-lg rounded-2xl" showCloseButton>
          <DialogHeader>
            <DialogTitle>Edit repository details</DialogTitle>
            <DialogDescription>
              Update the description and website link for this repository.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5">
            <FieldGroup>
              <Field>
                <FieldLabel>Description</FieldLabel>
                <FieldContent>
                  <Textarea
                    disabled={isSaving}
                    placeholder="No description provided."
                    rows={4}
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                  />
                </FieldContent>
              </Field>

              <Field>
                <FieldLabel>Website</FieldLabel>
                <FieldContent>
                  <Input
                    disabled={isSaving}
                    placeholder="https://example.com"
                    value={homepage}
                    onChange={(event) => setHomepage(event.target.value)}
                  />
                  {homepage ? (
                    <FieldDescription>
                      <A
                        href={homepage}
                        target="_blank"
                        rel="noreferrer"
                        className="hover:text-foreground"
                      >
                        {homepage.replace(/^https?:\/\//, "")}
                      </A>
                    </FieldDescription>
                  ) : null}
                </FieldContent>
              </Field>
            </FieldGroup>

            {error ? <p className="text-xs text-destructive">{error}</p> : null}

            <DialogFooter>
              <Button
                variant="ghost"
                className="rounded-xl"
                onClick={() => setIsOpen(false)}
              >
                Cancel
              </Button>
              <Button
                disabled={isSaving}
                className="rounded-xl"
                onClick={handleSave}
              >
                {isSaving ? <Loader2 className="animate-spin" /> : <Save />}
                Save
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
