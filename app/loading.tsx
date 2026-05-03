import Loader from "@/components/Loader"

export default function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background text-foreground">
      <Loader className="text-muted-foreground" />
    </div>
  )
}
