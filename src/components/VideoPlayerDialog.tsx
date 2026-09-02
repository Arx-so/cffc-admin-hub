import { Dialog, DialogContent } from "@/components/ui/dialog";

export interface PlayingVideo {
  signedVideoUrl: string;
  title: string;
}

export function VideoPlayerDialog({
  video,
  onOpenChange,
}: {
  video: PlayingVideo | null;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={!!video} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl p-0 overflow-hidden">
        {video && (
          <video
            src={video.signedVideoUrl}
            controls
            autoPlay
            className="w-full aspect-video bg-black"
            aria-label={video.title}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
