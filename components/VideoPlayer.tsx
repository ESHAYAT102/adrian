"use client"

import {
  Maximize,
  Minimize,
  Pause,
  Play,
  Volume1,
  Volume2,
  VolumeX,
} from "lucide-react"
import {
  type CSSProperties,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type VideoPlayerProps = {
  className?: string
  height?: number | string
  onError?: () => void
  src: string
  style?: CSSProperties
  title?: string
  videoClassName?: string
  width?: number | string
}

function formatTime(value: number) {
  if (!Number.isFinite(value) || value <= 0) return "0:00"

  const seconds = Math.floor(value % 60)
  const minutes = Math.floor((value / 60) % 60)
  const hours = Math.floor(value / 3600)

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}`
  }

  return `${minutes}:${seconds.toString().padStart(2, "0")}`
}

export default function VideoPlayer({
  className,
  height,
  onError,
  src,
  style,
  title = "Video",
  videoClassName,
  width,
}: VideoPlayerProps) {
  const rootRef = useRef<HTMLDivElement | null>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [volume, setVolume] = useState(1)

  const progress = useMemo(() => {
    if (!duration) return 0
    return Math.min(100, Math.max(0, (currentTime / duration) * 100))
  }, [currentTime, duration])

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const syncTime = () => setCurrentTime(video.currentTime)
    const syncMetadata = () => {
      setCurrentTime(video.currentTime)
      setDuration(Number.isFinite(video.duration) ? video.duration : 0)
    }
    const syncPlayback = () => setIsPlaying(!video.paused)
    const syncVolume = () => {
      setIsMuted(video.muted)
      setVolume(video.volume)
    }

    syncMetadata()
    syncPlayback()
    syncVolume()

    video.addEventListener("durationchange", syncMetadata)
    video.addEventListener("loadedmetadata", syncMetadata)
    video.addEventListener("pause", syncPlayback)
    video.addEventListener("play", syncPlayback)
    video.addEventListener("timeupdate", syncTime)
    video.addEventListener("volumechange", syncVolume)

    return () => {
      video.removeEventListener("durationchange", syncMetadata)
      video.removeEventListener("loadedmetadata", syncMetadata)
      video.removeEventListener("pause", syncPlayback)
      video.removeEventListener("play", syncPlayback)
      video.removeEventListener("timeupdate", syncTime)
      video.removeEventListener("volumechange", syncVolume)
    }
  }, [src])

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(document.fullscreenElement === rootRef.current)
    }

    document.addEventListener("fullscreenchange", handleFullscreenChange)
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange)
    }
  }, [])

  async function togglePlayback() {
    const video = videoRef.current
    if (!video) return

    if (video.paused) {
      await video.play().catch(() => {})
      return
    }

    video.pause()
  }

  function handleSeek(value: string) {
    const video = videoRef.current
    if (!video) return

    const nextTime = Number(value)
    video.currentTime = nextTime
    setCurrentTime(nextTime)
  }

  function handleVolume(value: string) {
    const video = videoRef.current
    if (!video) return

    const nextVolume = Number(value)
    video.volume = nextVolume
    video.muted = nextVolume === 0
  }

  function toggleMute() {
    const video = videoRef.current
    if (!video) return

    video.muted = !video.muted
  }

  async function toggleFullscreen() {
    const root = rootRef.current
    if (!root) return

    if (document.fullscreenElement) {
      await document.exitFullscreen().catch(() => {})
      return
    }

    await root.requestFullscreen().catch(() => {})
  }

  const VolumeIcon =
    isMuted || volume === 0 ? VolumeX : volume < 0.5 ? Volume1 : Volume2

  return (
    <div
      ref={rootRef}
      className={cn(
        "group/video relative inline-block max-w-full overflow-hidden rounded-xl bg-black text-white shadow-sm",
        className
      )}
      style={style}
    >
      <video
        ref={videoRef}
        className={cn(
          "block max-h-[inherit] max-w-full object-contain",
          isFullscreen && "h-full w-full max-h-none",
          videoClassName
        )}
        height={height}
        onClick={togglePlayback}
        onError={onError}
        playsInline
        preload="metadata"
        src={src}
        width={width}
      >
        <track kind="captions" />
      </video>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-linear-to-t from-black/85 via-black/45 to-transparent px-3 pt-12 pb-3 opacity-100 transition-opacity duration-200 md:opacity-0 md:group-hover/video:opacity-100 md:group-focus-within/video:opacity-100">
        <div className="pointer-events-auto space-y-2">
          <div className="relative flex h-3 items-center">
            <div className="pointer-events-none absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 overflow-hidden rounded-full bg-white/20">
              <div
                className="h-full rounded-full bg-white"
                style={{ width: `${progress}%` }}
              />
            </div>
            <input
              aria-label={`Seek ${title}`}
              className="video-player-range relative h-3 w-full cursor-pointer appearance-none bg-transparent accent-white"
              max={duration || 0}
              min={0}
              onChange={(event) => handleSeek(event.target.value)}
              step="0.01"
              type="range"
              value={duration ? currentTime : 0}
            />
          </div>

          <div className="flex items-center gap-2">
            <Button
              aria-label={isPlaying ? "Pause video" : "Play video"}
              className="size-8 rounded-xl bg-white/10 text-white hover:bg-white/20 hover:text-white"
              onClick={togglePlayback}
              size="icon-sm"
              type="button"
              variant="ghost"
            >
              {isPlaying ? <Pause /> : <Play />}
            </Button>

            <div className="min-w-22 text-xs tabular-nums text-white/85">
              {formatTime(currentTime)} / {formatTime(duration)}
            </div>

            <div className="ml-auto flex items-center gap-1.5">
              <Button
                aria-label={isMuted ? "Unmute video" : "Mute video"}
                className="size-8 rounded-xl bg-white/10 text-white hover:bg-white/20 hover:text-white"
                onClick={toggleMute}
                size="icon-sm"
                type="button"
                variant="ghost"
              >
                <VolumeIcon />
              </Button>

              <div className="relative hidden h-3 w-20 items-center sm:flex">
                <div className="pointer-events-none absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 overflow-hidden rounded-full bg-white/20">
                  <div
                    className="h-full rounded-full bg-white"
                    style={{ width: `${(isMuted ? 0 : volume) * 100}%` }}
                  />
                </div>
                <input
                  aria-label="Video volume"
                  className="video-player-range relative h-3 w-full cursor-pointer appearance-none bg-transparent accent-white"
                  max={1}
                  min={0}
                  onChange={(event) => handleVolume(event.target.value)}
                  step="0.01"
                  type="range"
                  value={isMuted ? 0 : volume}
                />
              </div>

              <Button
                aria-label={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
                className="size-8 rounded-xl bg-white/10 text-white hover:bg-white/20 hover:text-white"
                onClick={toggleFullscreen}
                size="icon-sm"
                type="button"
                variant="ghost"
              >
                {isFullscreen ? <Minimize /> : <Maximize />}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
