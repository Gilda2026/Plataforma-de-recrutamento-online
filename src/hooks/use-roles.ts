import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getMyRoles } from "@/lib/roles.functions.server";
import { useAuth } from "./use-auth";

export function useRoles() {
  const { user } = useAuth();
  const fn = useServerFn(getMyRoles);
  const q = useQuery({
    queryKey: ["my-roles", user?.id],
    queryFn: () => fn(),
    enabled: !!user,
  });
  const roles = q.data?.roles ?? [];
  return {
    roles,
    isAdmin: roles.includes("admin"),
    isStaff: roles.includes("admin") || roles.includes("gestor"),
    isCandidate: roles.includes("candidato"),
    loading: q.isLoading,
  };
}
