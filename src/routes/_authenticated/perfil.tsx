import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState, useEffect } from "react";
import { getMyProfile, upsertMyProfile, addEducation, addExperience, addInternship, addCourse, deleteSubItem } from "@/lib/profile.functions";
import { listCatalogs } from "@/lib/catalog.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Trash2, Plus } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/perfil")({
  head: () => ({ meta: [{ title: "Meu perfil — Talvio" }] }),
  component: PerfilPage,
});

function PerfilPage() {
  const qc = useQueryClient();
  const getProfile = useServerFn(getMyProfile);
  const getCats = useServerFn(listCatalogs);
  const upsert = useServerFn(upsertMyProfile);
  const { data } = useQuery({ queryKey: ["my-profile"], queryFn: () => getProfile() });
  const { data: cats } = useQuery({ queryKey: ["catalogs"], queryFn: () => getCats() });

  const [form, setForm] = useState<Record<string, string>>({});
  useEffect(() => {
    if (data?.profile) {
      const p = data.profile;
      setForm({
        full_name: p.full_name ?? "",
        gender: p.gender ?? "",
        marital_status: p.marital_status ?? "",
        birth_date: p.birth_date ?? "",
        father_name: p.father_name ?? "",
        mother_name: p.mother_name ?? "",
        province_id: p.province_id ?? "",
        district_id: p.district_id ?? "",
        phone: p.phone ?? "",
        doc_type: p.doc_type ?? "",
        doc_number: p.doc_number ?? "",
        doc_validity: p.doc_validity ?? "",
        education_level: p.education_level ?? "",
      });
    }
  }, [data?.profile]);

  const set = (k: string, v: string) => setForm((s) => ({ ...s, [k]: v }));
  const districts = (cats?.districts ?? []).filter((d) => d.province_id === form.province_id);

  const save = async () => {
    try {
      await upsert({ data: {
        full_name: form.full_name,
        gender: form.gender || null,
        marital_status: form.marital_status || null,
        birth_date: form.birth_date || null,
        father_name: form.father_name || null,
        mother_name: form.mother_name || null,
        province_id: form.province_id || null,
        district_id: form.district_id || null,
        phone: form.phone || null,
        doc_type: form.doc_type || null,
        doc_number: form.doc_number || null,
        doc_validity: form.doc_validity || null,
        education_level: form.education_level || null,
      }});
      toast.success("Perfil guardado");
      qc.invalidateQueries({ queryKey: ["my-profile"] });
    } catch (e: any) { toast.error(e.message); }
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-3xl font-bold">Meu perfil</h1>
        <p className="text-sm text-muted-foreground">Complete o seu perfil para se candidatar a concursos.</p>
      </header>

      <Card>
        <CardHeader><CardTitle>Dados pessoais</CardTitle></CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <Field label="Nome completo *"><Input value={form.full_name ?? ""} onChange={(e) => set("full_name", e.target.value)} /></Field>
          <Field label="Género">
            <Select value={form.gender ?? ""} onValueChange={(v) => set("gender", v)}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent><SelectItem value="masculino">Masculino</SelectItem><SelectItem value="feminino">Feminino</SelectItem></SelectContent>
            </Select>
          </Field>
          <Field label="Estado civil">
            <Select value={form.marital_status ?? ""} onValueChange={(v) => set("marital_status", v)}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="solteiro">Solteiro(a)</SelectItem><SelectItem value="casado">Casado(a)</SelectItem>
                <SelectItem value="divorciado">Divorciado(a)</SelectItem><SelectItem value="viuvo">Viúvo(a)</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Data de nascimento"><Input type="date" value={form.birth_date ?? ""} onChange={(e) => set("birth_date", e.target.value)} /></Field>
          <Field label="Nome do pai"><Input value={form.father_name ?? ""} onChange={(e) => set("father_name", e.target.value)} /></Field>
          <Field label="Nome da mãe"><Input value={form.mother_name ?? ""} onChange={(e) => set("mother_name", e.target.value)} /></Field>
          <Field label="Província">
            <Select value={form.province_id ?? ""} onValueChange={(v) => { set("province_id", v); set("district_id", ""); }}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>{(cats?.provinces ?? []).map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
          <Field label="Distrito">
            <Select value={form.district_id ?? ""} onValueChange={(v) => set("district_id", v)} disabled={!form.province_id}>
              <SelectTrigger><SelectValue placeholder={districts.length ? "Selecione" : "Adicione distritos"} /></SelectTrigger>
              <SelectContent>{districts.map((d) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
          <Field label="Telefone"><Input value={form.phone ?? ""} onChange={(e) => set("phone", e.target.value)} /></Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Documento de identificação</CardTitle></CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <Field label="Tipo">
            <Select value={form.doc_type ?? ""} onValueChange={(v) => set("doc_type", v)}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent><SelectItem value="BI">Bilhete de Identidade</SelectItem><SelectItem value="Passaporte">Passaporte</SelectItem><SelectItem value="DIRE">DIRE</SelectItem></SelectContent>
            </Select>
          </Field>
          <Field label="Nº do documento"><Input value={form.doc_number ?? ""} onChange={(e) => set("doc_number", e.target.value)} /></Field>
          <Field label="Validade"><Input type="date" value={form.doc_validity ?? ""} onChange={(e) => set("doc_validity", e.target.value)} /></Field>
          <Field label="Habilitação literária">
            <Select value={form.education_level ?? ""} onValueChange={(v) => set("education_level", v)}>
              <SelectTrigger><SelectValue placeholder="Nível de qualificação" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="basico">Básico</SelectItem><SelectItem value="medio">Médio</SelectItem>
                <SelectItem value="tecnico">Técnico Profissional</SelectItem><SelectItem value="licenciatura">Licenciatura</SelectItem>
                <SelectItem value="pos-graduacao">Pós-graduação</SelectItem><SelectItem value="mestrado">Mestrado</SelectItem><SelectItem value="doutoramento">Doutoramento</SelectItem>
              </SelectContent>
            </Select>
          </Field>
        </CardContent>
      </Card>

      <div className="flex justify-end"><Button onClick={save}>Guardar dados pessoais</Button></div>

      <SubSection
        title="Formação complementar"
        items={data?.education ?? []}
        renderItem={(i: any) => `${i.kind} · ${i.course} — ${i.institution}${i.year ? ` (${i.year})` : ""}`}
        table="candidate_education"
        fields={[
          { name: "kind", label: "Tipo", type: "select", options: [["pos","Pós-graduação"],["mestrado","Mestrado"],["doutoramento","Doutoramento"],["formacao","Formação / Aperfeiçoamento"]] },
          { name: "institution", label: "Instituição" },
          { name: "course", label: "Curso" },
          { name: "year", label: "Ano", type: "number" },
        ]}
        onAdd={(d: any) => addEducation({ data: { kind: d.kind, institution: d.institution, course: d.course, year: d.year ? Number(d.year) : undefined } })}
      />

      <SubSection
        title="Experiência profissional"
        items={data?.experience ?? []}
        renderItem={(i: any) => `${i.role} @ ${i.company}${i.start_date ? ` (${i.start_date} → ${i.end_date ?? "atual"})` : ""}`}
        table="candidate_experience"
        fields={[
          { name: "company", label: "Empresa" },
          { name: "role", label: "Cargo" },
          { name: "start_date", label: "Início", type: "date" },
          { name: "end_date", label: "Fim", type: "date" },
          { name: "description", label: "Descrição", type: "textarea" },
        ]}
        onAdd={(d: any) => addExperience({ data: { company: d.company, role: d.role, start_date: d.start_date || null, end_date: d.end_date || null, description: d.description || null } })}
      />

      <SubSection
        title="Estágios pré-profissionais"
        items={data?.internships ?? []}
        renderItem={(i: any) => `${i.institution}${i.area ? ` — ${i.area}` : ""}`}
        table="candidate_internships"
        fields={[
          { name: "institution", label: "Instituição" },
          { name: "area", label: "Área" },
          { name: "start_date", label: "Início", type: "date" },
          { name: "end_date", label: "Fim", type: "date" },
        ]}
        onAdd={(d: any) => addInternship({ data: { institution: d.institution, area: d.area || null, start_date: d.start_date || null, end_date: d.end_date || null } })}
      />

      <SubSection
        title="Cursos de formação específica"
        items={data?.courses ?? []}
        renderItem={(i: any) => `${i.name}${i.institution ? ` — ${i.institution}` : ""}${i.year ? ` (${i.year})` : ""}${i.hours ? ` · ${i.hours}h` : ""}`}
        table="candidate_courses"
        fields={[
          { name: "name", label: "Nome do curso" },
          { name: "institution", label: "Instituição" },
          { name: "year", label: "Ano", type: "number" },
          { name: "hours", label: "Carga horária", type: "number" },
        ]}
        onAdd={(d: any) => addCourse({ data: { name: d.name, institution: d.institution || null, year: d.year ? Number(d.year) : undefined, hours: d.hours ? Number(d.hours) : undefined } })}
      />
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1.5"><Label>{label}</Label>{children}</div>;
}

function SubSection({ title, items, renderItem, table, fields, onAdd }: any) {
  const qc = useQueryClient();
  const del = useServerFn(deleteSubItem);
  const [form, setForm] = useState<Record<string, string>>({});
  const [open, setOpen] = useState(false);

  const submit = async () => {
    try {
      for (const f of fields) {
        if (!f.optional && !form[f.name] && f.type !== "date" && f.name !== "year" && f.name !== "hours" && f.name !== "description" && f.name !== "end_date" && f.name !== "area" && f.name !== "institution") {
          // basic check
        }
      }
      await onAdd(form);
      toast.success("Adicionado");
      setForm({}); setOpen(false);
      qc.invalidateQueries({ queryKey: ["my-profile"] });
    } catch (e: any) { toast.error(e.message); }
  };
  const remove = async (id: string) => {
    await del({ data: { table, id } });
    qc.invalidateQueries({ queryKey: ["my-profile"] });
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{title}</CardTitle>
        <Button size="sm" variant="outline" onClick={() => setOpen((o) => !o)}><Plus className="mr-1 h-4 w-4" />Adicionar</Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {open && (
          <div className="rounded-md border border-border p-4 space-y-3">
            <div className="grid gap-3 md:grid-cols-2">
              {fields.map((f: any) => (
                <Field key={f.name} label={f.label}>
                  {f.type === "textarea" ? (
                    <Textarea value={form[f.name] ?? ""} onChange={(e) => setForm({ ...form, [f.name]: e.target.value })} />
                  ) : f.type === "select" ? (
                    <Select value={form[f.name] ?? ""} onValueChange={(v) => setForm({ ...form, [f.name]: v })}>
                      <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                      <SelectContent>{f.options.map(([v, l]: [string, string]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}</SelectContent>
                    </Select>
                  ) : (
                    <Input type={f.type ?? "text"} value={form[f.name] ?? ""} onChange={(e) => setForm({ ...form, [f.name]: e.target.value })} />
                  )}
                </Field>
              ))}
            </div>
            <div className="flex justify-end gap-2"><Button variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button><Button onClick={submit}>Adicionar</Button></div>
          </div>
        )}
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sem registos.</p>
        ) : (
          <ul className="divide-y divide-border">
            {items.map((i: any) => (
              <li key={i.id} className="flex items-center justify-between py-2 text-sm">
                <span>{renderItem(i)}</span>
                <Button size="sm" variant="ghost" onClick={() => remove(i.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
