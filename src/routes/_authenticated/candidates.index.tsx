import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listCandidates } from "@/lib/recruitment.functions.server";
import { StatusBadge } from "./dashboard";
import { Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";

export const Route = createFileRoute("/_authenticated/candidates/")({
  head: () => ({ meta: [{ title: "Candidatos — Talvio" }] }),
  component: List,
});

function List() {
  const fn = useServerFn(listCandidates);
  const { data, isLoading } = useQuery({ queryKey: ["candidates"], queryFn: () => fn() });
  const [q, setQ] = useState("");
  const filtered = (data?.candidates ?? []).filter((c) =>
    [c.name, c.role_target, c.email].filter(Boolean).join(" ").toLowerCase().includes(q.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold">Candidatos</h1>
          <p className="mt-1 text-sm text-muted-foreground">Todos os candidatos analisados pela IA.</p>
        </div>
        <Button asChild><Link to="/candidates/new"><Plus className="mr-2 h-4 w-4" /> Novo</Link></Button>
      </header>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input className="pl-9" placeholder="Procurar por nome, cargo ou e-mail…" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card" style={{ boxShadow: "var(--shadow-card)" }}>
        <table className="w-full text-sm">
          <thead className="bg-secondary/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Nome</th>
              <th className="px-4 py-3">Cargo</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3 text-right">Score</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={4} className="px-4 py-10 text-center text-muted-foreground">A carregar…</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={4} className="px-4 py-10 text-center text-muted-foreground">Sem candidatos.</td></tr>
            ) : filtered.map((c) => (
              <tr key={c.id} className="border-t border-border hover:bg-secondary/30">
                <td className="px-4 py-3">
                  <Link to="/candidates/$id" params={{ id: c.id }} className="font-medium hover:text-accent">{c.name}</Link>
                  {c.email && <div className="text-xs text-muted-foreground">{c.email}</div>}
                </td>
                <td className="px-4 py-3 text-muted-foreground">{c.role_target}</td>
                <td className="px-4 py-3"><StatusBadge status={c.status} /></td>
                <td className="px-4 py-3 text-right font-display text-lg font-bold tabular-nums">{Math.round(Number(c.score) || 0)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
