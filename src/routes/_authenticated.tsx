import { useEffect, useState } from "react";
import { createFileRoute, Outlet, useNavigate, Link, useLocation } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useRoles } from "@/hooks/use-roles";
import { Sparkles, LayoutDashboard, Users, FileText, User, ClipboardList, Shield, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated")({
  component: AuthedLayout,
});


function AuthedLayout() {
  const { user, loading } = useAuth();
  const { isStaff, isCandidate } = useRoles();
  const nav = useNavigate();
  const loc = useLocation();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!loading) {
      if (!user) nav({ to: "/auth" });
      else setReady(true);
    }
  }, [user, loading, nav]);

  if (!ready) {
    return <div className="grid min-h-screen place-items-center text-muted-foreground">A carregar…</div>;
  }

  const candidateItems = [
    { to: "/concursos", label: "Concursos", icon: FileText },
    { to: "/minhas-candidaturas", label: "Minhas candidaturas", icon: ClipboardList },
    { to: "/perfil", label: "Meu perfil", icon: User },
  ];
  const staffItems = [
    { to: "/dashboard", label: "Pipeline IA", icon: LayoutDashboard },
    { to: "/candidates/new", label: "Candidatos IA", icon: Users },
    { to: "/admin", label: "Administração", icon: Shield },
  ];

  return (
    <div className="grid min-h-screen md:grid-cols-[260px_1fr] print:block print:bg-white" style={{ background: "var(--gradient-subtle)" }}>
      <aside className="hidden md:flex flex-col bg-sidebar text-sidebar-foreground print:hidden">
        <div className="flex h-16 items-center gap-2 border-b border-sidebar-border px-6">
          <div className="grid h-8 w-8 place-items-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground">
            <Sparkles className="h-4 w-4" />
          </div>
          <span className="font-display text-lg font-bold">Talvio</span>
        </div>
        <nav className="flex-1 space-y-1 p-4">
          {(isCandidate || !isStaff) && (
            <>
              <div className="px-3 py-2 text-[10px] uppercase tracking-wider text-sidebar-foreground/40">Candidato</div>
              {candidateItems.map((it) => renderItem(it, loc.pathname))}
            </>
          )}
          {isStaff && (
            <>
              <div className="mt-4 px-3 py-2 text-[10px] uppercase tracking-wider text-sidebar-foreground/40">Recrutador</div>
              {staffItems.map((it) => renderItem(it, loc.pathname))}
            </>
          )}
        </nav>
        <div className="border-t border-sidebar-border p-4">
          <div className="mb-3 truncate text-xs text-sidebar-foreground/60">{user?.email}</div>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground"
            onClick={async () => { await supabase.auth.signOut(); nav({ to: "/" }); }}
          >
            <LogOut className="mr-2 h-4 w-4" /> Sair
          </Button>
        </div>
      </aside>

      <main className="min-w-0">
        <div className="flex h-14 items-center justify-between border-b border-border bg-background px-4 md:hidden print:hidden">
          <Link to="/concursos" className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-accent" />
            <span className="font-display font-bold">Talvio</span>
          </Link>
          <Button variant="ghost" size="sm" onClick={async () => { await supabase.auth.signOut(); nav({ to: "/" }); }}>Sair</Button>
        </div>
        <div className="mx-auto max-w-6xl px-4 py-8 md:px-8 print:max-w-none print:p-0">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

function renderItem(it: { to: string; label: string; icon: any }, pathname: string) {
  const active = pathname === it.to || (it.to !== "/dashboard" && it.to !== "/" && pathname.startsWith(it.to));
  return (
    <Link
      key={it.to}
      to={it.to}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
        active ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
      )}
    >
      <it.icon className="h-4 w-4" />
      {it.label}
    </Link>
  );

  
}


