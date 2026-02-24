import { useUserManagement } from "./useUserManagement";
import { UserManagement } from "./UserManagement";

export default function UserManagementPage() {
  const props = useUserManagement();
  return <UserManagement {...props} />;
}
