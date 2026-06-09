import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const getMyProfile = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const uid = context.userId;
    const [p, edu, exp, intern, courses] = await Promise.all([
      context.supabase.from("candidate_profiles").select("*").eq("user_id", uid).maybeSingle(),
      context.supabase.from("candidate_education").select("*").eq("user_id", uid).order("year", { ascending: false }),
      context.supabase.from("candidate_experience").select("*").eq("user_id", uid).order("start_date", { ascending: false }),
      context.supabase.from("candidate_internships").select("*").eq("user_id", uid).order("start_date", { ascending: false }),
      context.supabase.from("candidate_courses").select("*").eq("user_id", uid).order("year", { ascending: false }),
    ]);
    return {
      profile: p.data,
      education: edu.data ?? [],
      experience: exp.data ?? [],
      internships: intern.data ?? [],
      courses: courses.data ?? [],
    };
  });

const profileSchema = z.object({
  full_name: z.string().min(2).max(200),
  gender: z.string().max(20).optional().nullable(),
  marital_status: z.string().max(30).optional().nullable(),
  birth_date: z.string().optional().nullable(),
  father_name: z.string().max(200).optional().nullable(),
  mother_name: z.string().max(200).optional().nullable(),
  province_id: z.string().uuid().optional().nullable(),
  district_id: z.string().uuid().optional().nullable(),
  phone: z.string().max(30).optional().nullable(),
  doc_type: z.string().max(20).optional().nullable(),
  doc_number: z.string().max(50).optional().nullable(),
  doc_validity: z.string().optional().nullable(),
  education_level: z.string().max(100).optional().nullable(),
});

export const upsertMyProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => profileSchema.parse(d))
  .handler(async ({ data, context }) => {
    const payload = { ...data, user_id: context.userId };
    const { error } = await context.supabase
      .from("candidate_profiles")
      .upsert(payload, { onConflict: "user_id" });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// Subitens (educação, experiência, etc.)
type Sub = "candidate_education" | "candidate_experience" | "candidate_internships" | "candidate_courses";

export const addEducation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    kind: z.string().min(1).max(50),
    institution: z.string().min(1).max(200),
    course: z.string().min(1).max(200),
    year: z.number().int().min(1900).max(2100).optional(),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("candidate_education").insert({ ...data, user_id: context.userId });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const addExperience = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    company: z.string().min(1).max(200),
    role: z.string().min(1).max(200),
    start_date: z.string().optional().nullable(),
    end_date: z.string().optional().nullable(),
    description: z.string().max(1000).optional().nullable(),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("candidate_experience").insert({ ...data, user_id: context.userId });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const addInternship = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    institution: z.string().min(1).max(200),
    area: z.string().max(200).optional().nullable(),
    start_date: z.string().optional().nullable(),
    end_date: z.string().optional().nullable(),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("candidate_internships").insert({ ...data, user_id: context.userId });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const addCourse = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    name: z.string().min(1).max(200),
    institution: z.string().max(200).optional().nullable(),
    year: z.number().int().min(1900).max(2100).optional(),
    hours: z.number().int().min(0).max(10000).optional(),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("candidate_courses").insert({ ...data, user_id: context.userId });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteSubItem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    table: z.enum(["candidate_education","candidate_experience","candidate_internships","candidate_courses"]),
    id: z.string().uuid(),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from(data.table as Sub).delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
