"use client"

import Link from "next/link"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import {
  Bun,
  Docker,
  Document,
  Eslint,
  Git,
  Go,
  Image as ImageFile,
  Js,
  License,
  Markdown,
  Next,
  NPM,
  PNPM,
  Python,
  SVG,
  Shell,
  Tailwind,
  Text,
  Tsconfig,
  TypeScript,
  Vite,
  Yaml,
  Yarn,
} from "@react-symbols/icons/files"
import {
  Folder,
  FolderApp,
  FolderAssets,
  FolderConfig,
  FolderFonts,
  FolderHelpers,
  FolderHooks,
  FolderImages,
  FolderReact,
  FolderSrc,
  FolderUtils,
} from "@react-symbols/icons/folders"
import { ChevronRight } from "lucide-react"

import { cn } from "@/lib/utils"
import type { GitHubRepositoryContent } from "@/lib/github"
import Loader from "./Loader"

type RepositoryFileTreeProps = {
  branch?: string
  initialContents: GitHubRepositoryContent[]
  owner: string
  repo: string
  selectedPath?: string
}

export function getRepositoryItemIcon(
  item: Pick<GitHubRepositoryContent, "name" | "type">
) {
  const name = item.name.toLowerCase()

  if (item.type === "dir") {
    if (name === "app") {
      return <FolderApp className="size-4 text-muted-foreground" />
    }

    if (name === "src") {
      return <FolderSrc className="size-4 text-muted-foreground" />
    }

    if (name === "hooks") {
      return <FolderHooks className="size-4 text-muted-foreground" />
    }

    if (name === "components") {
      return <FolderReact className="size-4 text-muted-foreground" />
    }

    if (name === "lib") {
      return <FolderHelpers className="size-4 text-muted-foreground" />
    }

    if (name === "utils") {
      return <FolderUtils className="size-4 text-muted-foreground" />
    }

    if (name === "public") {
      return <FolderAssets className="size-4 text-muted-foreground" />
    }

    if (name === "assets") {
      return <FolderAssets className="size-4 text-muted-foreground" />
    }

    if (name === "images" || name === "img") {
      return <FolderImages className="size-4 text-muted-foreground" />
    }

    if (name === "fonts") {
      return <FolderFonts className="size-4 text-muted-foreground" />
    }

    if (name === "config" || name === "configs") {
      return <FolderConfig className="size-4 text-muted-foreground" />
    }

    return <Folder className="size-4 text-muted-foreground" />
  }

  if (
    name === "dockerfile" ||
    name === "docker-compose.yml" ||
    name === "docker-compose.yaml"
  ) {
    return <Docker className="size-4 text-muted-foreground" />
  }

  if (name === "package.json") {
    return <NPM className="size-4 text-muted-foreground" />
  }

  if (name === "pnpm-lock.yaml") {
    return <PNPM className="size-4 text-muted-foreground" />
  }

  if (name === "yarn.lock") {
    return <Yarn className="size-4 text-muted-foreground" />
  }

  if (name === "bun.lock" || name === "bun.lockb") {
    return <Bun className="size-4 text-muted-foreground" />
  }

  if (name === "package-lock.json") {
    return <NPM className="size-4 text-muted-foreground" />
  }

  if (name.startsWith("tsconfig")) {
    return <Tsconfig className="size-4 text-muted-foreground" />
  }

  if (name.startsWith("tailwind.config.")) {
    return <Tailwind className="size-4 text-muted-foreground" />
  }

  if (
    name === "eslint.config.js" ||
    name === "eslint.config.mjs" ||
    name === "eslint.config.cjs" ||
    name.startsWith(".eslintrc")
  ) {
    return <Eslint className="size-4 text-muted-foreground" />
  }

  if (name.startsWith("vite.config.")) {
    return <Vite className="size-4 text-muted-foreground" />
  }

  if (name.startsWith("next.config.")) {
    return <Next className="size-4 text-muted-foreground" />
  }

  if (name.startsWith(".git")) {
    return <Git className="size-4 text-muted-foreground" />
  }

  if (name === "license" || name.startsWith("license.")) {
    return <License className="size-4 text-muted-foreground" />
  }

  if (name.endsWith(".md") || name.endsWith(".mdx")) {
    return <Markdown className="size-4 text-muted-foreground" />
  }

  if (/\.(ts|tsx)$/.test(name)) {
    return <TypeScript className="size-4 text-muted-foreground" />
  }

  if (/\.(js|jsx|mjs|cjs)$/.test(name)) {
    return <Js className="size-4 text-muted-foreground" />
  }

  if (name.endsWith(".html") || name.endsWith(".htm")) {
    return <Document className="size-4 text-muted-foreground" />
  }

  if (/\.(css|scss|sass|less)$/.test(name)) {
    return <Document className="size-4 text-muted-foreground" />
  }

  if (/\.(json|jsonc)$/.test(name)) {
    return <Document className="size-4 text-muted-foreground" />
  }

  if (name === ".env" || name.startsWith(".env.") || name === ".envrc") {
    return <Document className="size-4 text-muted-foreground" />
  }

  if (
    name === ".prettierrc" ||
    name.startsWith(".prettierrc.") ||
    name === "prettier.config.js" ||
    name === "prettier.config.mjs" ||
    name === "prettier.config.cjs"
  ) {
    return <Document className="size-4 text-muted-foreground" />
  }

  if (/\.(png|jpe?g|gif|webp|avif|bmp|ico)$/.test(name)) {
    return <ImageFile className="size-4 text-muted-foreground" />
  }

  if (name.endsWith(".svg")) {
    return <SVG className="size-4 text-muted-foreground" />
  }

  if (/\.(yml|yaml)$/.test(name)) {
    return <Yaml className="size-4 text-muted-foreground" />
  }

  if (
    /\.(sh|bash|zsh|fish)$/.test(name) ||
    name === ".bashrc" ||
    name === ".zshrc"
  ) {
    return <Shell className="size-4 text-muted-foreground" />
  }

  if (name.endsWith(".py")) {
    return <Python className="size-4 text-muted-foreground" />
  }

  if (name.endsWith(".go")) {
    return <Go aria-label="Go file" className="size-4 text-muted-foreground" />
  }

  if (/\.(txt|ini|toml|xml)$/.test(name)) {
    return <Text className="size-4 text-muted-foreground" />
  }

  return <Document className="size-4 text-muted-foreground" />
}

function RepositoryFileTreeInner({
  branch,
  initialContents,
  owner,
  repo,
  selectedPath,
}: RepositoryFileTreeProps) {
  const [expandedPaths, setExpandedPaths] = useState<Record<string, boolean>>(
    {}
  )
  const [childrenByPath, setChildrenByPath] = useState<
    Record<string, GitHubRepositoryContent[]>
  >({})
  const [loadingPaths, setLoadingPaths] = useState<Record<string, boolean>>({})
  const inflightRequestsRef = useRef<
    Partial<Record<string, Promise<GitHubRepositoryContent[]>>>
  >({})
  const prefetchedRef = useRef(false)

  const rootItems = useMemo(() => initialContents, [initialContents])

  const loadDirectoryContents = useCallback(
    async (path: string, showLoading = true) => {
      if (childrenByPath[path]) {
        return childrenByPath[path]
      }

      if (inflightRequestsRef.current[path]) {
        return inflightRequestsRef.current[path]
      }

      if (showLoading) {
        setLoadingPaths((current) => ({ ...current, [path]: true }))
      }

      const query = new URLSearchParams({
        ...(branch ? { branch } : {}),
        owner,
        path,
        repo,
      })

      const request = fetch(`/api/repository-contents?${query.toString()}`, {
        cache: "no-store",
      })
        .then(async (response) => {
          if (!response.ok) {
            return []
          }

          const data = (await response.json()) as {
            contents: GitHubRepositoryContent[]
          }

          setChildrenByPath((current) => ({
            ...current,
            [path]: data.contents,
          }))

          return data.contents
        })
        .finally(() => {
          delete inflightRequestsRef.current[path]

          if (showLoading) {
            setLoadingPaths((current) => ({ ...current, [path]: false }))
          }
        })

      inflightRequestsRef.current[path] = request

      return request
    },
    [branch, childrenByPath, owner, repo]
  )

  useEffect(() => {
    if (prefetchedRef.current || initialContents.length === 0) return
    prefetchedRef.current = true

    const directories = initialContents
      .filter((item) => item.type === "dir")
      .map((item) => item.path)

    if (directories.length === 0) return

    Promise.all(
      directories.map((path) => loadDirectoryContents(path, false))
    ).catch(() => {})
  }, [initialContents, loadDirectoryContents])

  const toggleDirectory = async (path: string) => {
    if (expandedPaths[path]) {
      setExpandedPaths((current) => ({ ...current, [path]: false }))
      return
    }

    await loadDirectoryContents(path)
    setExpandedPaths((current) => ({ ...current, [path]: true }))
  }

  const renderItems = (items: GitHubRepositoryContent[], depth = 0) => {
    return items.map((item) => {
      const isDirectory = item.type === "dir"
      const isExpanded = Boolean(expandedPaths[item.path])
      const isSelected = selectedPath === item.path
      const childItems = childrenByPath[item.path] ?? []

      return (
        <div key={item.path}>
          {isDirectory ? (
            <button
              type="button"
              onClick={() => void toggleDirectory(item.path)}
              className={cn(
                "flex w-full items-center gap-2 px-4 py-2 text-left text-sm transition hover:bg-accent/20",
                isSelected ? "bg-accent/30" : undefined
              )}
              style={{ paddingLeft: `${16 + depth * 18}px` }}
            >
              <ChevronRight
                className={cn(
                  "size-4 shrink-0 text-muted-foreground transition-transform",
                  isExpanded ? "rotate-90" : undefined
                )}
              />
              {getRepositoryItemIcon(item)}
              <span className="truncate font-medium">{item.name}</span>
              {loadingPaths[item.path] && (
                <Loader className="ml-auto scale-70 text-muted-foreground" />
              )}
            </button>
          ) : (
            <Link
              href={
                branch
                  ? `/${owner}/${repo}?branch=${encodeURIComponent(branch)}&path=${encodeURIComponent(item.path)}`
                  : `/${owner}/${repo}?path=${encodeURIComponent(item.path)}`
              }
              className={cn(
                "flex items-center gap-2 px-4 py-2 text-sm transition hover:bg-accent/20",
                isSelected ? "bg-accent/30" : undefined
              )}
              style={{ paddingLeft: `${34 + depth * 18}px` }}
            >
              {getRepositoryItemIcon(item)}
              <span className="truncate font-medium">{item.name}</span>
            </Link>
          )}

          {isDirectory && isExpanded && childItems.length > 0
            ? renderItems(childItems, depth + 1)
            : null}
        </div>
      )
    })
  }

  return (
    <div className="divide-y divide-border/0">{renderItems(rootItems)}</div>
  )
}

export default function RepositoryFileTree(props: RepositoryFileTreeProps) {
  const treeKey = `${props.owner}/${props.repo}/${props.branch ?? "default"}`
  return <RepositoryFileTreeInner key={treeKey} {...props} />
}
