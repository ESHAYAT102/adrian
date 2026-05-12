"use client"

import {
  type ChangeEvent,
  type KeyboardEvent as ReactKeyboardEvent,
  type MutableRefObject,
  useMemo,
  useRef,
  useState,
} from "react"
import { useRouter } from "next/navigation"
import { Edit3, Loader2, Save } from "lucide-react"
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { handleTextareaVsCodeKeydown } from "@/lib/textarea-vscode-shortcuts"

type FileEditorDialogProps = {
  branch: string
  canEdit: boolean
  iconOnly?: boolean
  initialContent: string
  owner: string
  path: string
  repo: string
  sha: string
}

type EditorSnapshot = {
  content: string
  selectionEnd: number
  selectionStart: number
}

const MAX_HISTORY_ENTRIES = 100

function getLanguageFromPath(path: string) {
  const normalizedPath = path.toLowerCase()

  if (normalizedPath.endsWith(".tsx")) return "tsx"
  if (normalizedPath.endsWith(".ts")) return "typescript"
  if (normalizedPath.endsWith(".jsx")) return "jsx"
  if (normalizedPath.endsWith(".js") || normalizedPath.endsWith(".mjs")) return "javascript"
  if (normalizedPath.endsWith(".json")) return "json"
  if (normalizedPath.endsWith(".css")) return "css"
  if (normalizedPath.endsWith(".html")) return "html"
  if (normalizedPath.endsWith(".md")) return "markdown"
  if (normalizedPath.endsWith(".py")) return "python"
  if (normalizedPath.endsWith(".sh")) return "bash"
  if (normalizedPath.endsWith(".yml") || normalizedPath.endsWith(".yaml")) return "yaml"
  if (normalizedPath.endsWith(".rs")) return "rust"
  if (normalizedPath.endsWith(".go")) return "go"
  if (normalizedPath.endsWith(".java")) return "java"
  return "text"
}

export default function FileEditorDialog({
  branch,
  canEdit,
  iconOnly = false,
  initialContent,
  owner,
  path,
  repo,
  sha,
}: FileEditorDialogProps) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [content, setContent] = useState(initialContent)
  const [currentSha, setCurrentSha] = useState(sha)
  const [commitMessage, setCommitMessage] = useState(`Update ${path}`)
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)
  const highlightRef = useRef<HTMLDivElement | null>(null)
  const undoStackRef = useRef<EditorSnapshot[]>([])
  const redoStackRef = useRef<EditorSnapshot[]>([])
  const lastSelectionRef = useRef({ selectionEnd: 0, selectionStart: 0 })
  const language = useMemo(() => getLanguageFromPath(path), [path])

  const syncScroll = () => {
    if (!textareaRef.current || !highlightRef.current) return
    highlightRef.current.scrollTop = textareaRef.current.scrollTop
    highlightRef.current.scrollLeft = textareaRef.current.scrollLeft
  }

  const rememberSelection = (textarea: HTMLTextAreaElement | null) => {
    if (!textarea) return

    lastSelectionRef.current = {
      selectionEnd: textarea.selectionEnd,
      selectionStart: textarea.selectionStart,
    }
  }

  const pushHistory = (
    stack: MutableRefObject<EditorSnapshot[]>,
    snapshot: EditorSnapshot
  ) => {
    stack.current.push(snapshot)
    if (stack.current.length > MAX_HISTORY_ENTRIES) {
      stack.current.shift()
    }
  }

  const restoreSnapshot = (snapshot: EditorSnapshot) => {
    setContent(snapshot.content)
    window.requestAnimationFrame(() => {
      const textarea = textareaRef.current
      if (!textarea) return

      textarea.setSelectionRange(snapshot.selectionStart, snapshot.selectionEnd)
      rememberSelection(textarea)
      syncScroll()
    })
  }

  const getCurrentSnapshot = (): EditorSnapshot => {
    const textarea = textareaRef.current

    return {
      content,
      selectionEnd: textarea?.selectionEnd ?? lastSelectionRef.current.selectionEnd,
      selectionStart:
        textarea?.selectionStart ?? lastSelectionRef.current.selectionStart,
    }
  }

  const undoEdit = () => {
    const snapshot = undoStackRef.current.pop()
    if (!snapshot) return false

    pushHistory(redoStackRef, getCurrentSnapshot())
    restoreSnapshot(snapshot)
    return true
  }

  const redoEdit = () => {
    const snapshot = redoStackRef.current.pop()
    if (!snapshot) return false

    pushHistory(undoStackRef, getCurrentSnapshot())
    restoreSnapshot(snapshot)
    return true
  }

  const handleEditorChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    const nextContent = event.target.value

    if (nextContent !== content) {
      pushHistory(undoStackRef, {
        content,
        selectionEnd: lastSelectionRef.current.selectionEnd,
        selectionStart: lastSelectionRef.current.selectionStart,
      })
      redoStackRef.current = []
    }

    setContent(nextContent)
    rememberSelection(event.target)
  }

  const handleEditorKeyDown = (
    event: ReactKeyboardEvent<HTMLTextAreaElement>
  ) => {
    const isShortcutKey = event.ctrlKey || event.metaKey
    const key = event.key.toLowerCase()

    if (isShortcutKey && !event.altKey && key === "z") {
      event.preventDefault()
      if (event.shiftKey) {
        redoEdit()
      } else {
        undoEdit()
      }
      return
    }

    if (isShortcutKey && !event.altKey && key === "y") {
      event.preventDefault()
      redoEdit()
      return
    }

    rememberSelection(event.currentTarget)
    handleTextareaVsCodeKeydown(event)
  }

  const handleSave = async () => {
    if (!commitMessage.trim()) {
      toast.error("Commit message is required")
      return
    }

    setIsSaving(true)

    const response = await fetch("/api/repository-file", {
      body: JSON.stringify({
        branch,
        content,
        message: commitMessage.trim(),
        owner,
        path,
        repo,
        sha: currentSha,
      }),
      headers: {
        "Content-Type": "application/json",
      },
      method: "PATCH",
    })

    const data = (await response.json()) as {
      commit?: {
        content?: {
          sha: string
        }
      }
      error?: string
    }

    setIsSaving(false)

    if (!response.ok) {
      toast.error(
        data.error === "conflict"
          ? "The file changed on GitHub. Reload the file and try again."
          : data.error === "forbidden"
            ? "You do not have permission to edit this file."
            : "Could not save file changes."
      )
      return
    }

    if (data.commit?.content?.sha) {
      setCurrentSha(data.commit.content.sha)
    }

    toast.success("File saved to GitHub")
    setIsOpen(false)
    router.refresh()
  }

  return (
    <>
      <Button
        variant="outline"
        size={iconOnly ? "icon-sm" : "sm"}
        className="rounded-xl"
        disabled={!canEdit}
        onClick={() => setIsOpen(true)}
        title="Edit file"
        aria-label="Edit file"
      >
        <Edit3 />
        {iconOnly ? null : "Edit file"}
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-5xl rounded-2xl">
          <DialogHeader>
            <DialogTitle>Edit {path}</DialogTitle>
            <DialogDescription>
              Changes will be committed directly to the <code>{branch}</code> branch.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Commit message
              </label>
              <Input
                disabled={isSaving}
                value={commitMessage}
                onChange={(event) => setCommitMessage(event.target.value)}
              />
            </div>

            <div className="relative h-[60vh] overflow-hidden rounded-xl border border-border bg-[#151515]">
              <div
                ref={highlightRef}
                aria-hidden="true"
                className="absolute inset-0 overflow-auto"
              >
                <SyntaxHighlighter
                  language={language}
                  style={oneDark}
                  customStyle={{
                    background: "transparent",
                    margin: 0,
                    minHeight: "100%",
                    padding: "16px",
                  }}
                  codeTagProps={{
                    style: {
                      fontFamily: "var(--font-mono)",
                    },
                  }}
                  lineNumberStyle={{
                    minWidth: "2.5em",
                    opacity: 0.45,
                  }}
                  showLineNumbers
                  wrapLongLines={false}
                >
                  {content || " "}
                </SyntaxHighlighter>
              </div>
              <Textarea
                ref={textareaRef}
                spellCheck={false}
                value={content}
                disabled={isSaving}
                onChange={handleEditorChange}
                onClick={(event) => rememberSelection(event.currentTarget)}
                onFocus={(event) => rememberSelection(event.currentTarget)}
                onKeyDown={handleEditorKeyDown}
                onKeyUp={(event) => rememberSelection(event.currentTarget)}
                onScroll={syncScroll}
                onSelect={(event) => rememberSelection(event.currentTarget)}
                className="absolute inset-0 h-full min-h-0 resize-none border-0 bg-transparent px-14 py-4 font-mono text-sm leading-6 text-transparent caret-white shadow-none outline-none ring-0 selection:bg-white/20 selection:text-transparent focus-visible:ring-0"
              />
            </div>
          </div>

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
              Save changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
