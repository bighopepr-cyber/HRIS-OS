import { useQuery } from "@tanstack/react-query";
import { APP_VERSION, checkForUpdates, VersionResponse } from "@/lib/version";

export function useVersionCheck(enabled: boolean = true) {
  return useQuery<VersionResponse | null>({
    // sertakan APP_VERSION untuk mencegah null hasil cache basi di antara rilis/build
    queryKey: ["version-check", APP_VERSION],
    queryFn: checkForUpdates,
    enabled,
    staleTime: 1000 * 60 * 60 * 24 * 7, // 1 minggu
    refetchInterval: 1000 * 60 * 60 * 24 * 7, // Periksa sekali seminggu
    retry: 1,
  });
}
