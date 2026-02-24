import { useLogin } from "./useLogin";
import { Login } from "./Login";

export default function LoginPage() {
  const props = useLogin();
  return <Login {...props} />;
}
