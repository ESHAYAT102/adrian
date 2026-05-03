import { cn } from "@/lib/utils"

const frames = ["⣏⠀⣹", "⢾⣉⡷", "⠰⣿⠆", "⠀⠶⠀", "⡁⠀⢈"]

export default function Loader({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "relative mr-2 inline-grid min-w-[3ch] scale-110 place-items-center leading-none whitespace-pre select-none",
        className
      )}
      aria-label="Loading"
    >
      {frames.map((frame, index) => (
        <span
          key={frame}
          className="loader-frame col-start-1 row-start-1"
          style={{ ["--loader-index" as string]: index }}
        >
          {frame}
        </span>
      ))}
    </span>
  )
}
