import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { listUsersWithRoles, assignRole, createUser } from "@/lib/roles.functions.server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useRoles } from "@/hooks/use-roles";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/utilizadores")({ component: UsersPage });

function UsersPage() {
  const { isAdmin } = useRoles();
  const qc = useQueryClient();
  const fn = useServerFn(listUsersWithRoles);
  const ar = useServerFn(assignRole);
  const cu = useServerFn(createUser);
  const { data } = useQuery({ queryKey: ["users-roles"], queryFn: () => fn() });

  const [email, setEmail] = useState(""); const [pwd, setPwd] = useState(""); const [role, setRole] = useState<"admin" | "gestor" | "candidato">("candidato");

  if (!isAdmin) return <div className="rounded-md border border-destructive/30 bg-destructive/5 p-6">Apenas admins.</div>;

  const inv = () => qc.invalidateQueries({ queryKey: ["users-roles"] });

  const toggle = async (uid: string, r: any, has: boolean) => {
    try { await ar({ data: { user_id: uid, role: r, action: has ? "remove" : "add" } }); inv(); }
    catch (e: any) { toast.error(e.message); }
  };

  const create = async () => {
    try { await cu({ data: { email, password: pwd, role } }); setEmail(""); setPwd(""); inv(); toast.success("Utilizador criado"); }
    catch (e: any) { toast.error(e.message); }
  };

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold">Utilizadores e permissões</h1>

      <Card>
        <CardHeader><CardTitle>Registar novo utilizador</CardTitle></CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-[1fr_1fr_180px_auto]">
          <div className="space-y-1.5"><Label>Email</Label><Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" /></div>
          <div className="space-y-1.5"><Label>Palavra-passe</Label><Input value={pwd} onChange={(e) => setPwd(e.target.value)} type="text" /></div>
          <div className="space-y-1.5"><Label>Papel inicial</Label>
            <Select value={role} onValueChange={(v: any) => setRole(v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="candidato">Candidato</SelectItem><SelectItem value="gestor">Gestor</SelectItem><SelectItem value="admin">Admin</SelectItem></SelectContent>
            </Select>
          </div>
          <div className="self-end"><Button onClick={create}>Criar</Button></div>
        </CardContent>
      </Card>

      <Card><CardContent className="p-0">
        <table className="w-full text-sm">
          <thead className="text-left text-muted-foreground"><tr><th className="p-3">Email</th><th>Papéis</th><th></th></tr></thead>
          <tbody>
            {(data?.users ?? []).map((u) => {
              const roles = u.roles;
              return (
                <tr key={u.id} className="border-t border-border">
                  <td className="p-3">{u.email}</td>
                  <td className="space-x-1">
                    {roles.length === 0 ? <span className="text-muted-foreground">—</span> : roles.map((r) => <Badge key={r} variant="secondary">{r}</Badge>)}
                  </td>
                  <td className="p-3 text-right space-x-1">
                    {(["admin", "gestor", "candidato"] as const).map((r) => {
                      const has = roles.includes(r);
                      return <Button key={r} size="sm" variant={has ? "default" : "outline"} onClick={() => toggle(u.id, r, has)}>{has ? "−" : "+"} {r}</Button>;
                    })}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </CardContent></Card>
    </div>
  );
}
