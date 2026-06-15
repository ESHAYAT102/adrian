"use client"

import { Check, Copy } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

type EmptyRepositoryInstructionsProps = {
  remoteUrl: string
}

export function buildEmptyRepositoryCommands(remoteUrl: string) {
  return `git init
git add .
git commit -m "initial commit"
git branch -M main
git remote add origin ${remoteUrl}
git push -u origin main`
}

export default function EmptyRepositoryInstructions({
  remoteUrl,
}: EmptyRepositoryInstructionsProps) {
  const [copied, setCopied] = useState(false)

  const commands = buildEmptyRepositoryCommands(remoteUrl)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(commands)
      setCopied(true)
      toast.success("Git commands copied")
      window.setTimeout(() => setCopied(false), 1800)
    } catch {
      toast.error("Could not copy git commands")
    }
  }

  return (
    <Card className="rounded-2xl">
      <CardHeader className="border-b border-border px-5 py-4">
        <div className="flex items-center justify-between gap-4">
          <CardTitle className="text-base">
            This repository is empty. Push your first commit with Git:
          </CardTitle>
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            className="rounded-xl"
            onClick={handleCopy}
            aria-label="Copy git commands"
            title="Copy git commands"
          >
            {copied ? <Check /> : <Copy />}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="px-5 py-5">
        <pre className="overflow-x-auto rounded-xl border border-border bg-card px-4 py-4 text-xs leading-6 text-foreground">
          {commands}
        </pre>
      </CardContent>
    </Card>
  )
}
