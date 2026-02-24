import { useValidations } from "./useValidations";
import { Validations } from "./Validations";

export default function ValidationsPage() {
  const props = useValidations();
  return <Validations {...props} />;
}
