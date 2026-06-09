import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";


/**
 * ✅ SINGLE SOURCE OF TRUTH (IMPORTANTE)
 */
export const EDUCATION_LEVELS = [
  "basico",
  "medio",
  "tecnico",
  "licenciatura",
  "pos",
  "mestrado",
  "doutoramento",
] as const;

export type EducationLevel = typeof EDUCATION_LEVELS[number];

export const listContests = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("contests")
      .select("*, institutions(name)")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return { contests: data ?? [] };
  });

export const getContest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const [c, provs, positions] = await Promise.all([
      context.supabase.from("contests").select("*, institutions(name)").eq("id", data.id).single(),
      context.supabase.from("contest_provinces").select("province_id, provinces(name)").eq("contest_id", data.id),
      context.supabase.from("contest_positions").select("*, occupations(id, name, career_id, careers(id, name))").eq("contest_id", data.id),
    ]);
    if (c.error) throw new Error(c.error.message);
    return { contest: c.data, provinces: provs.data ?? [], positions: positions.data ?? [] };
  });

export const createContest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])

  .inputValidator((d) =>
    z
      .object({
        designation: z.string().min(2).max(300),
        year: z.number().int().min(2000).max(2100),
        institution_id: z.string().uuid(),

        education_level: z.enum(EDUCATION_LEVELS),

        province_ids: z.array(z.string().uuid()).min(1),

        positions: z
          .array(
            z.object({
              occupation_id: z.string().uuid(),
              vacancies: z.number().int().min(1).max(1000),
            })
          )
          .min(1),
      })
      .parse(d)
  )

  .handler(async ({ data, context }) => {
    const { data: contest, error } = await context.supabase
      .from("contests")
      .insert({
        designation: data.designation,
        year: data.year,
        institution_id: data.institution_id,
        education_level: data.education_level,
        created_by: context.userId,
        status: "rascunho",
      })
      .select()
      .single();

    if (error) throw new Error(error.message);

    await context.supabase.from("contest_provinces").insert(
      data.province_ids.map((p) => ({
        contest_id: contest.id,
        province_id: p,
      }))
    );

    await context.supabase.from("contest_positions").insert(
      data.positions.map((p) => ({
        contest_id: contest.id,
        occupation_id: p.occupation_id,
        vacancies: p.vacancies,
      }))
    );

    return { contest };
  });
export const setContestStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    id: z.string().uuid(),
    status: z.enum(["rascunho", "publicado", "encerrado"]),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const patch: { status: string; published_at?: string } = { status: data.status };
    if (data.status === "publicado") patch.published_at = new Date().toISOString();
    const { error } = await context.supabase.from("contests").update(patch).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// === Candidaturas ===
export const apply = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({
      contest_id: z.string().uuid(),
      contest_position_id: z.string().uuid(),
    }).parse(d)
  )
  .handler(async ({ data, context }) => {

    // garantir que tem perfil
    const { data: profile, error: profileError } = await context.supabase
      .from("candidate_profiles")
      .select("id")
      .eq("user_id", context.userId)
      .maybeSingle();

    if (profileError) throw new Error(profileError.message);

    if (!profile) {
      throw new Error("Complete o seu perfil antes de se candidatar.");
    }

    // inserir candidatura com ligação ao profile
    const { error } = await context.supabase.from("applications").insert({
      user_id: context.userId,
      candidate_profile_id: profile.id, // 🔥 ESTA LINHA É A CHAVE
      contest_id: data.contest_id,
      contest_position_id: data.contest_position_id,
    });

    if (error) {
      if (error.message.includes("duplicate")) {
        throw new Error("Já se candidatou a esta vaga.");
      }
      throw new Error(error.message);
    }

    return { ok: true };
  });

export const myApplications = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("applications")
      .select(`
        id,
        status,
        final_score,
        created_at,
        updated_at,

        contests (
          id,
          designation,
          year,
          institutions (name)
        ),

        contest_positions (
          occupations (
            id,
            name,
            careers (
              id,
              name
            )
          )
        )
      `)
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);

    return { applications: data ?? [] };
  });
export const contestApplications = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ contest_id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: apps, error } = await context.supabase
      .from("applications")
      .select("*, contest_positions(occupations(name)), candidate_profiles!inner(full_name, phone, doc_number)")
      .eq("contest_id", data.contest_id)
      .order("final_score", { ascending: false, nullsFirst: false });
    if (error) {
      // fallback sem join no perfil (caso o candidato ainda não tenha perfil)
      const { data: apps2 } = await context.supabase
        .from("applications")
        .select("*, contest_positions(occupations(name))")
        .eq("contest_id", data.contest_id);
      return { applications: apps2 ?? [] };
    }
    return { applications: apps ?? [] };
  });

export const updateApplicationStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    id: z.string().uuid(),
    status: z.enum(["submetida", "em_analise", "entrevista", "aprovado", "rejeitado"]),
    final_score: z.number().min(0).max(100).optional(),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const patch: { status: string; final_score?: number } = { status: data.status };
    if (data.final_score != null) patch.final_score = data.final_score;
    const { error } = await context.supabase.from("applications").update(patch).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
