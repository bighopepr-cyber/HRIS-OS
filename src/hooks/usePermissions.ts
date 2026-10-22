import { useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import {
  AppModule,
  AppRole,
  NO_PERMISSIONS,
  PermissionLevel,
  Permissions,
  hasAnyModuleAccess,
  hasModuleAccess,
  isMissingFunctionError,
  parsePermissions,
  permissionsFromRoles,
} from "@/lib/permissions";

/**
 * Hak akses modul efektif dari pengguna yang sedang masuk (berasal dari peran
 * dan pemberian akses langsung). Hook ini hanya menentukan apa yang
 * ditampilkan UI; basis data menerapkan aturan yang sama melalui RLS.
 */
export function usePermissions() {
  const { user } = useAuth();

  const query = useQuery({
    queryKey: ["permissions", user?.id],
    queryFn: async (): Promise<Permissions> => {
      const { data, error } = await supabase.rpc("get_my_permissions");
      if (!error) return parsePermissions(data);
      if (!isMissingFunctionError(error)) throw error;

      // Basis data belum dimigrasikan ke hak akses modul: gunakan peran
      // pengguna sebagai cadangan, bukan gagal (atau mencoba tanpa henti).
      console.warn("get_my_permissions() tidak ditemukan; menggunakan hak akses berbasis peran sampai migrasi diterapkan");
      const { data: roleRows, error: rolesError } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user!.id);
      if (rolesError) throw rolesError;
      return permissionsFromRoles((roleRows ?? []).map((r) => r.role as AppRole));
    },
    enabled: !!user?.id,
    staleTime: 60 * 1000,
    retry: (failureCount, error) => !isMissingFunctionError(error) && failureCount < 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000),
  });

  const perms = query.data ?? NO_PERMISSIONS;

  const can = useCallback(
    (module: AppModule, level: PermissionLevel = "view") => hasModuleAccess(perms, module, level),
    [perms]
  );

  return {
    ...perms,
    can,
    hasAnyModuleAccess: hasAnyModuleAccess(perms),
    isLoading: !!user?.id && query.isLoading,
    error: query.error,
  };
}
