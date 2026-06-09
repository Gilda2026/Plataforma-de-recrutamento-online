import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const getMyRoles = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId);

    if (error) throw new Error(error.message);

    return {
      roles: (data ?? []).map((r) => r.role),
    };
  });

export const listUsersWithRoles = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    // só staff
    const { data: myRoles } = await context.supabase.from("user_roles").select("role").eq("user_id", context.userId);
    const staff = (myRoles ?? []).some((r) => r.role === "admin" || r.role === "gestor");
    if (!staff) throw new Error("Sem permissão");

    const { data: users } = await supabaseAdmin.auth.admin.listUsers({ perPage: 200 });
    const { data: roles } = await supabaseAdmin.from("user_roles").select("user_id, role");
    const map = new Map<string, string[]>();
    (roles ?? []).forEach((r) => {
      const arr = map.get(r.user_id) ?? [];
      arr.push(r.role);
      map.set(r.user_id, arr);
    });
    return {
      users: (users?.users ?? []).map((u) => ({
        id: u.id,
        email: u.email,
        created_at: u.created_at,
        roles: map.get(u.id) ?? [],
      })),
    };
  });

export const assignRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({
      user_id: z.string().uuid(),
      role: z.enum(["admin", "gestor", "candidato"]),
      action: z.enum(["add", "remove"]),
    }).parse(d)
  )
  .handler(async ({ data, context }) => {
    const { data: myRoles } = await context.supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId);

    const isAdmin = (myRoles ?? []).some((r) => r.role === "admin");
    if (!isAdmin) throw new Error("Apenas admin");

    if (data.action === "add") {
      await supabaseAdmin.from("user_roles").insert({
        user_id: data.user_id,
        role: data.role,
      });
    } else {
      await supabaseAdmin
        .from("user_roles")
        .delete()
        .eq("user_id", data.user_id)
        .eq("role", data.role);
    }

    return { ok: true };
  });

export const createUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({
      email: z.string().email(),
      password: z.string().min(8).max(100),
      role: z.enum(["admin", "gestor", "candidato"]),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { data: myRoles } = await context.supabase.from("user_roles").select("role").eq("user_id", context.userId);
    if (!(myRoles ?? []).some((r) => r.role === "admin")) throw new Error("Apenas admin");

    const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
    });
    if (error) throw new Error(error.message);
    if (data.role !== "candidato") {
      await supabaseAdmin.from("user_roles").insert({ user_id: created.user!.id, role: data.role });
    }
    return { ok: true, user_id: created.user!.id };
  });
