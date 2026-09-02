import { useEffect, useState } from "react";
import { Loader2, Play } from "lucide-react";

const PLACEHOLDER_THUMB =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='225' viewBox='0 0 400 225'%3E%3Crect fill='%23e5e7eb' width='400' height='225'/%3E%3Ctext fill='%239ca3af' x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='14'%3ESem capa%3C/text%3E%3C/svg%3E";

export function VideoPreview({
  signedThumbUrl,
  signedVideoUrl,
  title,
  onPlay,
  className,
  size = "default",
}: {
  signedThumbUrl: string | null;
  signedVideoUrl: string | null;
  title: string | null;
  onPlay: () => void;
  className?: string;
  size?: "default" | "sm";
}) {
  const canPlay = !!signedVideoUrl;
  const isSm = size === "sm";
  const hasMediaToLoad = !!(signedThumbUrl || signedVideoUrl);
  const [mediaLoaded, setMediaLoaded] = useState(!hasMediaToLoad);

  useEffect(() => {
    setMediaLoaded(!hasMediaToLoad);
  }, [signedThumbUrl, signedVideoUrl, hasMediaToLoad]);

  return (
    <div
      className={`relative group ${className ?? ""}`}
      onClick={canPlay && mediaLoaded ? onPlay : undefined}
      onKeyDown={canPlay && mediaLoaded ? (e) => e.key === "Enter" && onPlay() : undefined}
      role={canPlay && mediaLoaded ? "button" : undefined}
      tabIndex={canPlay && mediaLoaded ? 0 : undefined}
    >
      {!signedThumbUrl && (
        <img
          src={PLACEHOLDER_THUMB}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
          aria-hidden
        />
      )}
      {signedThumbUrl ? (
        <img
          src={signedThumbUrl}
          alt={title ?? "Vídeo"}
          className="absolute inset-0 w-full h-full object-cover"
          onLoad={() => setMediaLoaded(true)}
        />
      ) : signedVideoUrl ? (
        <video
          src={signedVideoUrl}
          preload="auto"
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
          onLoadedData={(e) => {
            const el = e.currentTarget;
            el.currentTime = 0;
            el.pause();
            setMediaLoaded(true);
          }}
          aria-label={title ?? "Vídeo"}
        />
      ) : null}
      <div
        className={`absolute inset-0 flex items-center justify-center transition-opacity ${
          !mediaLoaded ? "bg-muted" : "bg-black/30"
        } ${canPlay && mediaLoaded ? "group-hover:bg-black/40 cursor-pointer" : ""}`}
      >
        {!mediaLoaded ? (
          <Loader2 className={`animate-spin text-muted-foreground ${isSm ? "h-4 w-4" : "h-8 w-8"}`} />
        ) : (
          <div
            className={`rounded-full bg-white/25 backdrop-blur-sm flex items-center justify-center ${isSm ? "p-1.5" : "p-3"} ${canPlay ? "group-hover:bg-white/40 group-hover:scale-110 transition-transform" : "opacity-80"}`}
          >
            <Play className={`text-foreground fill-foreground ml-0.5 ${isSm ? "h-4 w-4" : "h-8 w-8"}`} />
          </div>
        )}
      </div>
    </div>
  );
}
