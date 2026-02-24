import { useVideos } from "./useVideos";
import { Videos } from "./Videos";

export default function VideosPage() {
  const props = useVideos();
  return <Videos {...props} />;
}
