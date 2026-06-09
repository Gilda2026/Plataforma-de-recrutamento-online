import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listCandidates } from "@/lib/recruitment.functions.server";
import { Users, TrendingUp, CheckCircle2, Clock, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Visão geral — Talvio" }] }),
  component: Dashboard,
});

function Dashboard() {
  const fn = useServerFn(listCandidates);
  const { data } = useQuery({ queryKey: ["candidates"], queryFn: () => fn() });
  const candidates = data?.candidates ?? [];

  const total = candidates.length;
  const shortlist = candidates.filter((c) => c.status === "shortlist").length;
  const avgScore = total ? Math.round(candidates.reduce((s, c) => s + (Number(c.score) || 0), 0) / total) : 0;
  const recent = candidates.slice(0, 5);

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">Visão geral</h1>
          <p className="mt-1 text-sm text-muted-foreground">Acompanhe a sua pipeline de recrutamento.</p>
        </div>
        <Button asChild><Link to="/candidates/new"><Plus className="mr-2 h-4 w-4" /> Novo candidato</Link></Button>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Users} label="Total candidatos" value={total} />
        <StatCard icon={CheckCircle2} label="Shortlist" value={shortlist} accent="success" />
        <StatCard icon={TrendingUp} label="Score médio" value={`${avgScore}/100`} />
        <StatCard icon={Clock} label="Em análise" value={candidates.filter((c) => c.status === "review").length} />
      </div>

      <section className="rounded-xl border border-border bg-card p-6" style={{ boxShadow: "var(--shadow-card)" }}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-lg font-bold">Candidatos recentes</h2>
          <Link to="/candidates" className="text-sm text-accent hover:underline">Ver todos</Link>
        </div>
        {recent.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-muted-foreground">Ainda não tem candidatos.</p>
            <Button asChild className="mt-4"><Link to="/candidates/new">Adicionar o primeiro</Link></Button>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {recent.map((c) => (
              <Link key={c.id} to="/candidates/$id" params={{ id: c.id }} className="flex items-center justify-between py-3 hover:bg-secondary/40 -mx-2 px-2 rounded-md">
                <div>
                  <div className="font-medium">{c.name}</div>
                  <div className="text-xs text-muted-foreground">{c.role_target}</div>
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge status={c.status} />
                  <span className="font-display text-lg font-bold tabular-nums">{Math.round(Number(c.score) || 0)}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, accent }: { icon: any; label: string; value: string | number; accent?: "success" }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5" style={{ boxShadow: "var(--shadow-card)" }}>
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-wide text-muted-foreground">{label}</span>
        <Icon className={`h-4 w-4 ${accent === "success" ? "text-success" : "text-accent"}`} />
      </div>
      <div className="mt-3 font-display text-3xl font-bold">{value}</div>
    </div>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    new: { label: "Novo", cls: "bg-muted text-muted-foreground" },
    review: { label: "Em análise", cls: "bg-warning/15 text-warning-foreground border border-warning/30" },
    shortlist: { label: "Shortlist", cls: "bg-success/15 text-success border border-success/30" },
    interview: { label: "Entrevista", cls: "bg-accent/15 text-accent border border-accent/30" },
    rejected: { label: "Rejeitado", cls: "bg-destructive/10 text-destructive border border-destructive/30" },
    hired: { label: "Contratado", cls: "bg-primary text-primary-foreground" },
  };
  const s = map[status] ?? map.new;
  return <Badge variant="outline" className={s.cls}>{s.label}</Badge>;
}
