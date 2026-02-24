import { useReports } from "./useReports";
import { Reports } from "./Reports";

export default function ReportsPage() {
  const props = useReports();
  return <Reports {...props} />;
}
