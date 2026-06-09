import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { listCatalogs } from "@/lib/catalog.functions";
import { createContest } from "@/lib/contests.functions.server";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { EducationLevel } from "@/lib/contests.functions.server";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Trash2, Plus } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute(
  "/_authenticated/admin/concursos/novo"
)({ component: NewContest });


function NewContest() {
  const nav = useNavigate();
  const fn = useServerFn(listCatalogs);
  const create = useServerFn(createContest);
  const { data } = useQuery({
    queryKey: ["catalogs"],
    queryFn: () => fn(),
  });

  const [designation, setDesignation] = useState("");
  const [year, setYear] = useState(new Date().getFullYear());
  const [institutionId, setInstitutionId] = useState("");

  // ✅ FIX PRINCIPAL AQUI (evita string genérico → causa do erro "never")
  const [educationLevel, setEducationLevel] =
    useState<EducationLevel | "">("");

  const [provinces, setProvinces] = useState<string[]>([]);
  const [positions, setPositions] = useState<
    { occupation_id: string; vacancies: number }[]
  >([]);

  const toggleProv = (id: string) =>
    setProvinces((p) =>
      p.includes(id) ? p.filter((x) => x !== id) : [...p, id]
    );

  const addPos = () =>
    setPositions((p) => [...p, { occupation_id: "", vacancies: 1 }]);

  const updPos = (
    i: number,
    patch: Partial<{ occupation_id: string; vacancies: number }>
  ) =>
    setPositions((p) =>
      p.map((x, j) => (j === i ? { ...x, ...patch } : x))
    );

  const rmPos = (i: number) =>
    setPositions((p) => p.filter((_, j) => j !== i));

  const submit = async () => {
    if (
      !designation ||
      !institutionId ||
      !educationLevel ||
      provinces.length === 0 ||
      positions.length === 0 ||
      positions.some((p) => !p.occupation_id)
    ) {
      return toast.error("Preencha todos os campos");
    }

    try {
      const r = await create({
        data: {
          designation,
          year,
          institution_id: institutionId,
          education_level: educationLevel,
          province_ids: provinces,
          positions,
        },
      });

      toast.success("Concurso criado");
      nav({
        to: "/admin/concursos/$id",
        params: { id: r.contest.id },
      });
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold">Abrir concurso</h1>

      <Card>
        <CardHeader>
          <CardTitle>Dados gerais</CardTitle>
        </CardHeader>

        <CardContent className="grid gap-4 md:grid-cols-3">
          <div className="md:col-span-2 space-y-1.5">
            <Label>Designação</Label>
            <Input
              value={designation}
              onChange={(e) => setDesignation(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label>Ano</Label>
            <Input
              type="number"
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
            />
          </div>

          <div className="md:col-span-3 space-y-1.5">
            <Label>Instituição</Label>
            <Select value={institutionId} onValueChange={setInstitutionId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {(data?.institutions ?? []).map((i: any) => (
                  <SelectItem key={i.id} value={i.id}>
                    {i.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="md:col-span-3 space-y-1.5">
            <Label>Habilitação literária</Label>

            <Select
              value={educationLevel}
              onValueChange={(v) =>
                setEducationLevel(v as EducationLevel)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Nível de qualificação" />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="basico">Básico</SelectItem>
                <SelectItem value="medio">Médio</SelectItem>
                <SelectItem value="tecnico">
                  Técnico Profissional
                </SelectItem>
                <SelectItem value="licenciatura">
                  Licenciatura
                </SelectItem>
                <SelectItem value="pos">Pós-graduação</SelectItem>
                <SelectItem value="mestrado">Mestrado</SelectItem>
                <SelectItem value="doutoramento">
                  Doutoramento
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Províncias abrangidas</CardTitle>
        </CardHeader>

        <CardContent className="grid grid-cols-2 gap-2 md:grid-cols-3">
          {(data?.provinces ?? []).map((p: any) => (
            <label
              key={p.id}
              className="flex items-center gap-2 rounded-md border border-border p-2 cursor-pointer"
            >
              <Checkbox
                checked={provinces.includes(p.id)}
                onCheckedChange={() => toggleProv(p.id)}
              />
              <span className="text-sm">{p.name}</span>
            </label>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Ocupações e vagas</CardTitle>
          <Button size="sm" variant="outline" onClick={addPos}>
            <Plus className="mr-1 h-4 w-4" />
            Adicionar
          </Button>
        </CardHeader>

        <CardContent className="space-y-2">
          {positions.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Adicione pelo menos uma ocupação.
            </p>
          )}

          {positions.map((p, i) => (
            <div
              key={i}
              className="grid grid-cols-[1fr_120px_auto] gap-2"
            >
              <Select
                value={p.occupation_id}
                onValueChange={(v) =>
                  updPos(i, { occupation_id: v })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Ocupação" />
                </SelectTrigger>

                <SelectContent>
                  {(data?.occupations ?? []).map((o: any) => {
                    const c = (data?.careers ?? []).find(
                      (x: any) => x.id === o.career_id
                    );
                    return (
                      <SelectItem key={o.id} value={o.id}>
                        {c?.name} · {o.name}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>

              <Input
                type="number"
                min={1}
                value={p.vacancies}
                onChange={(e) =>
                  updPos(i, {
                    vacancies: Number(e.target.value),
                  })
                }
                placeholder="Vagas"
              />

              <Button
                size="icon"
                variant="ghost"
                onClick={() => rmPos(i)}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        <Button variant="ghost" onClick={() => nav({ to: "/admin/concursos" })}>
          Cancelar
        </Button>

        <Button onClick={submit}>
          Criar concurso (rascunho)
        </Button>
      </div>
    </div>
  );
}