import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchValidations, ProfessionalValidation } from "@/data/mock";
import { queryKeys } from "@/lib/queryKeys";
import { useToast } from "@/hooks/use-toast";

export function useValidations() {
  const queryClient = useQueryClient();
  const { data: validations = [], isLoading, error } = useQuery({
    queryKey: queryKeys.validations.all,
    queryFn: fetchValidations,
  });
  const { toast } = useToast();

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: "aprovado" | "rejeitado" }) => {
      await new Promise((r) => setTimeout(r, 200));
      return { id, status };
    },
    onSuccess: ({ id, status }) => {
      queryClient.setQueryData<ProfessionalValidation[]>(queryKeys.validations.all, (prev) =>
        prev ? prev.map((v) => (v.id === id ? { ...v, status } : v)) : []
      );
      toast({ title: status === "aprovado" ? "Profissional aprovado" : "Profissional rejeitado" });
    },
  });

  return { validations, isLoading, error, updateStatusMutation };
}
