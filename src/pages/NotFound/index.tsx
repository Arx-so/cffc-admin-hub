import { useNotFound } from "./useNotFound";
import { NotFound } from "./NotFound";

export default function NotFoundPage() {
  useNotFound();
  return <NotFound />;
}
