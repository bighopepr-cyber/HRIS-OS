import type { Database } from "@/integrations/supabase/types";

export type AppModule = Database["public"]["Enums"]["app_module"];
export type PermissionLevel = Database["public"]["Enums"]["permission_level"];
export type AppRole = Database["public"]["Enums"]["app_role"];

/**
 * Modul yang dapat diberi akses, sesuai urutan tampilan. Setiap pemberian akses
 * adalah "view" (baca seluruh organisasi) atau "manage" (edit dan setujui).
 * Harus sesuai dengan enum app_module di database.
 */
export const MODULES: { key: AppModule; label: string; description: string }[] = [
  { key: "employees", label: "Karyawan", description: "Catatan karyawan, departemen, dan dokumen" },
  { key: "onboarding", label: "Onboarding", description: "Undangan, permintaan onboarding, dan k baru" },
  { key: "attendance", label: "Absensi", description: "Catatan absensi semua karyawan" },
  { key: "leaves", label: "Cuti", description: "Permintaan cuti, jenis cuti, dan saldo" },
  { key: "reimbursements", label: "Penggantian", description: "Klaim pengeluaran, persetujuan, dan pembayaran" },
  { key: "performance", label: "Kinerja", description: "Ulasan, tujuan, dan analitik tim" },
  { key: "assets", label: "Aset", description: "Aset perusahaan dan penugasan" },
  { key: "payroll", label: "Gaji", description: "Struktur gaji, proses payroll, dan detail bank" },
  { key: "calendar", label: "Kalender", description: "Acara dan hari libur perusahaan" },
  { key: "settings", label: "Pengaturan", description: "Branding, domain whitelist, lokasi kantor, dan code karyawan" },
];

export const PERMISSION_LEVELS: { key: PermissionLevel; label: string }[] = [
  { key: "view", label: "Lihat" },
  { key: "manage", label: "Kelola" },
];

const LEVEL_RANK: Record<PermissionLevel, number> = { view: 1, manage: 2 };

export type ModuleLevels = Partial<Record<AppModule, PermissionLevel>>;

export interface Permissions {
  isAdmin: boolean;
  isBlocked: boolean;
  roles: AppRole[];
  modules: ModuleLevels;
}

export const NO_PERMISSIONS: Permissions = { isAdmin: false, isBlocked: false, roles: [], modules: {} };

/** Apakah `granted` memenuhi persyaratan `required`? */
export function levelSatisfies(granted: PermissionLevel | undefined, required: PermissionLevel): boolean {
  return granted !== undefined && LEVEL_RANK[granted] >= LEVEL_RANK[required];
}

/** Check a permission set. Admins can do everything; blocked users nothing. */
export function hasModuleAccess(perms: Permissions, module: AppModule, level: PermissionLevel = "view"): boolean {
  if (perms.isBlocked) return false;
  if (perms.isAdmin) return true;
  return levelSatisfies(perms.modules[module], level);
}

/** True if the user has been given access to at least one module. */
export function hasAnyModuleAccess(perms: Permissions): boolean {
  if (perms.isBlocked) return false;
  return perms.isAdmin || Object.keys(perms.modules).length > 0;
}

/** Parse the JSON returned by the get_my_permissions() database function. */
export function parsePermissions(raw: unknown): Permissions {
  if (!raw || typeof raw !== "object") return NO_PERMISSIONS;
  const data = raw as { is_admin?: unknown; is_blocked?: unknown; roles?: unknown; modules?: unknown };
  const validModules = new Set<string>(MODULES.map((m) => m.key));
  const modules: ModuleLevels = {};
  if (data.modules && typeof data.modules === "object") {
    for (const [key, value] of Object.entries(data.modules as Record<string, unknown>)) {
      if (validModules.has(key) && (value === "view" || value === "manage")) {
        modules[key as AppModule] = value;
      }
    }
  }
  return {
    isAdmin: data.is_admin === true,
    isBlocked: data.is_blocked === true,
    roles: Array.isArray(data.roles) ? (data.roles.filter((r) => typeof r === "string") as AppRole[]) : [],
    modules,
  };
}

/** Settings tabs are split by module: departments, leave types, organisation settings. */
export const SETTINGS_MODULES: AppModule[] = ["employees", "leaves", "settings"];

/** Can the user open Settings at all (admin, or manage on any settings module)? */
export function canAccessSettings(perms: Permissions): boolean {
  if (perms.isBlocked) return false;
  return perms.isAdmin || SETTINGS_MODULES.some((m) => hasModuleAccess(perms, m, "manage"));
}

/** Each report reads one module's data, so it's shown to people who can view that module. */
export const REPORT_MODULES: AppModule[] = ["employees", "attendance", "leaves", "payroll", "assets"];

export function canAccessReports(perms: Permissions): boolean {
  return REPORT_MODULES.some((m) => hasModuleAccess(perms, m, "view"));
}

/**
 * Permissions implied by roles alone, matching the default role setup (admin:
 * everything; HR: manage on every module; others: self-service). Used when
 * the database doesn't have get_my_permissions() yet, i.e. the app was
 * deployed before the migrations, so the UI keeps working instead of hanging.
 */
export function permissionsFromRoles(roles: AppRole[]): Permissions {
  const isAdmin = roles.includes("admin");
  const modules: ModuleLevels = {};
  if (!isAdmin && roles.includes("hr")) {
    for (const m of MODULES) modules[m.key] = "manage";
  }
  return { isAdmin, isBlocked: false, roles, modules };
}

/** PostgREST/Postgres error for a function that doesn't exist (not deployed yet). */
export function isMissingFunctionError(error: unknown): boolean {
  const code = (error as { code?: unknown } | null)?.code;
  return code === "PGRST202" || code === "42883";
}
