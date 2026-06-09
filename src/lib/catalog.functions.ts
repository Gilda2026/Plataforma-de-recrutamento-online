import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const listCatalogs = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const [careers, occupations, institutions, provinces, districts] = await Promise.all([
      context.supabase.from("careers").select("*").order("name"),
      context.supabase.from("occupations").select("*").order("name"),
      context.supabase.from("institutions").select("*").order("name"),
      context.supabase.from("provinces").select("*").order("name"),
      context.supabase.from("districts").select("*").order("name"),
    ]);
    return {
      careers: careers.data ?? [],
      occupations: occupations.data ?? [],
      institutions: institutions.data ?? [],
      provinces: provinces.data ?? [],
      districts: districts.data ?? [],
    };
  });

const nameSchema = z.string().min(1).max(200);

export const upsertCareer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid().optional(), name: nameSchema, description: z.string().max(1000).optional() }).parse(d))
  .handler(async ({ data, context }) => {
    if (data.id) {
      const { error } = await context.supabase.from("careers").update({ name: data.name, description: data.description ?? null }).eq("id", data.id);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await context.supabase.from("careers").insert({ name: data.name, description: data.description ?? null });
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });

export const deleteCareer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("careers").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const upsertOccupation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid().optional(), career_id: z.string().uuid(), name: nameSchema, description: z.string().max(1000).optional() }).parse(d))
  .handler(async ({ data, context }) => {
    const payload = { career_id: data.career_id, name: data.name, description: data.description ?? null };
    if (data.id) {
      const { error } = await context.supabase.from("occupations").update(payload).eq("id", data.id);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await context.supabase.from("occupations").insert(payload);
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });

export const deleteOccupation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("occupations").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const upsertInstitution = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid().optional(), name: nameSchema, sector: z.string().max(200).optional() }).parse(d))
  .handler(async ({ data, context }) => {
    const payload = { name: data.name, sector: data.sector ?? null };
    if (data.id) {
      const { error } = await context.supabase.from("institutions").update(payload).eq("id", data.id);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await context.supabase.from("institutions").insert(payload);
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });

export const deleteInstitution = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("institutions").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const upsertProvince = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid().optional(), name: nameSchema }).parse(d))
  .handler(async ({ data, context }) => {
    if (data.id) {
      const { error } = await context.supabase.from("provinces").update({ name: data.name }).eq("id", data.id);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await context.supabase.from("provinces").insert({ name: data.name });
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });

export const upsertDistrict = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid().optional(), province_id: z.string().uuid(), name: nameSchema }).parse(d))
  .handler(async ({ data, context }) => {
    const payload = { province_id: data.province_id, name: data.name };
    if (data.id) {
      const { error } = await context.supabase.from("districts").update(payload).eq("id", data.id);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await context.supabase.from("districts").insert(payload);
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });

export const deleteDistrict = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("districts").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteProvince = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("provinces").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
