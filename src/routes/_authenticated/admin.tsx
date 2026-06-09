import { createFileRoute, Outlet, redirect, Link, useLocation } from "@tanstack/react-router";
import { useRoles } from "@/hooks/use-roles";
import { LayoutDashboard, Users, Briefcase, Building2, MapPin, FileText, ListChecks, UserCog } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/admin")({
  component: AdminLayout,
});

const items = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/admin/utilizadores", label: "Utilizadores", icon: UserCog, adminOnly: true },
  { to: "/admin/carreiras", label: "Carreiras", icon: Briefcase },
  { to: "/admin/ocupacoes", label: "Ocupações", icon: ListChecks },
  { to: "/admin/instituicoes", label: "Instituições", icon: Building2 },
  { to: "/admin/localidades", label: "Localidades", icon: MapPin },
  { to: "/admin/concursos", label: "Concursos", icon: FileText },
];

function AdminLayout() {
  const { isStaff, isAdmin, loading } = useRoles();
  const loc = useLocation();
  if (loading) return <p className="text-muted-foreground">A carregar…</p>;
  if (!isStaff) return <div className="rounded-md border border-destructive/30 bg-destructive/5 p-6">Sem permissão. Esta área é restrita a administradores.</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2 border-b border-border pb-3">
        {items.filter((i) => !i.adminOnly || isAdmin).map((i) => {
          const active = i.exact ? loc.pathname === i.to : loc.pathname.startsWith(i.to);
          return (
            <Link key={i.to} to={i.to} className={cn("flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm transition", active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary")}>
              <i.icon className="h-4 w-4" />{i.label}
            </Link>
          );
        })}
      </div>
      <Outlet />
    </div>
  );
}
