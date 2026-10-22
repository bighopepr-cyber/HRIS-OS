import { REPO_URL } from "@/lib/site";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useVersionCheck } from "@/hooks/useVersionCheck";
import { APP_VERSION, ChangelogEntry, FALLBACK_VERSION_RESPONSE, isAutoUpdatingEnvironment } from "@/lib/version";
import { 
  Sparkles, 
  Bug, 
  Shield, 
  FileText, 
  AlertTriangle,
  ExternalLink,
  RefreshCw,
  CheckCircle2,
  ArrowUpCircle
} from "lucide-react";
import { format } from "date-fns";

const changeTypeConfig = {
  feature: { icon: Sparkles, label: "Fitur baru", className: "bg-green-500/10 text-green-800 dark:text-green-400" },
  fix: { icon: Bug, label: "Perbaikan bug", className: "bg-yellow-500/10 text-amber-800 dark:text-yellow-400" },
  security: { icon: Shield, label: "Keamanan", className: "bg-red-500/10 text-red-800 dark:text-red-400" },
  docs: { icon: FileText, label: "Dokumentasi", className: "bg-blue-500/10 text-blue-800 dark:text-blue-400" },
  breaking: { icon: AlertTriangle, label: "Perubahan tidak kompatibel", className: "bg-orange-500/10 text-orange-800 dark:text-orange-400" },
};

const versionTypeConfig = {
  major: { label: "Rilis utama", className: "bg-primary text-primary-foreground" },
  minor: { label: "Rilis minor", className: "bg-secondary text-secondary-foreground" },
  patch: { label: "Patch", className: "bg-muted text-muted-foreground" },
};

function ChangelogEntrySkeleton() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-5 w-24" />
          </div>
          <Skeleton className="h-4 w-32" />
        </div>
        <Skeleton className="h-6 w-48 mt-2" />
        <Skeleton className="h-4 w-full mt-1" />
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-8 w-full" />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function ChangelogEntryCard({ entry, isCurrentVersion }: { entry: ChangelogEntry; isCurrentVersion: boolean }) {
  const versionConfig = versionTypeConfig[entry.type];

  return (
    <Card className={isCurrentVersion ? "border-primary/50" : ""}>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className={versionConfig.className}>
              v{entry.version}
            </Badge>
            <Badge variant="outline">{versionConfig.label}</Badge>
            {isCurrentVersion && (
              <Badge variant="secondary" className="gap-1">
                <CheckCircle2 className="h-3 w-3" />
                Saat ini
              </Badge>
            )}
          </div>
          <span className="text-sm text-muted-foreground">
            {format(new Date(entry.date), "MMMM d, yyyy")}
          </span>
        </div>
        <CardTitle className="mt-2 text-lg leading-snug sm:text-2xl">{entry.title}</CardTitle>
        <CardDescription>{entry.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {entry.changes.map((change, index) => {
            const config = changeTypeConfig[change.type];
            const Icon = config.icon;
            return (
              <li key={index} className="flex flex-col items-start gap-1.5 sm:flex-row sm:gap-3">
                <span className={`inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-2 py-1 text-xs font-medium ${config.className}`}>
                  <Icon className="h-3 w-3" aria-hidden="true" />
                  {config.label}
                </span>
                <span className="text-sm text-foreground">{change.text}</span>
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}

export default function Changelog() {
  const { data: versionData, isLoading, isError, refetch, isRefetching } = useVersionCheck();
  const effectiveVersionData = versionData ?? FALLBACK_VERSION_RESPONSE;
  // Pemeriksaan jarak jauh dapat gagal atau kembali tanpa catatan perubahan; dalam
  // hal tersebut kami tidak dapat menyatakan pengguna sudah mutakhir, sehingga
  // kami kembali ke catatan perubahan yang disertakan bersama aplikasi.
  // checkForUpdates() menghasilkan cadangan bawaan (array catatan perubahan yang sama) ketika tidak ada server yang menjawab.
  const usedFallback = !!versionData && versionData.changelog === FALLBACK_VERSION_RESPONSE.changelog;
  const checkFailed = isError || !versionData || !versionData.currentVersion || usedFallback;
  const remoteChangelog = versionData?.changelog;
  const changelog =
    remoteChangelog && remoteChangelog.length > 0 ? remoteChangelog : FALLBACK_VERSION_RESPONSE.changelog;
  const showingBundledChangelog = !(remoteChangelog && remoteChangelog.length > 0);
  
  // Untuk lingkungan yang pembaruan otomatis, selalu tampilkan versi terbaru dari GitHub
  // Untuk hosting sendiri: jika tidak ada pembaruan yang tersedia (pengguna sudah mutakhir),
  // tampilkan versi terbaru dari GitHub karena mereka telah menerapkan kode terbaru
  // Jika ada pembaruan yang tersedia, tampilkan APP_VERSION lokal agar pengguna tahu bahwa mereka perlu memperbarui
  const displayVersion = isAutoUpdatingEnvironment()
    ? (versionData?.currentVersion ?? APP_VERSION)
    : (effectiveVersionData.hasUpdate ? APP_VERSION : (versionData?.currentVersion ?? APP_VERSION));

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight lg:text-3xl">Catatan Perubahan</h1>
            <p className="text-muted-foreground">
              Lihat pembaruan dan peningkatan terbaru pada Peoplo
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isRefetching}
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${isRefetching ? "animate-spin" : ""}`} />
              Periksa pembaruan
            </Button>
            <Button size="sm" asChild>
              <a
                href={`${REPO_URL}/releases`}
                target="_blank"
                rel="noopener noreferrer"
              >
                Rilis GitHub
                <ExternalLink className="ml-1.5 h-3.5 w-3.5" />
              </a>
            </Button>
          </div>
        </div>

        {/* Kartu Status Versi */}
        <Card>
          <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="rounded-full bg-primary/10 p-3" aria-hidden="true">
                {isLoading ? (
                  <RefreshCw className="h-6 w-6 animate-spin text-primary" />
                ) : checkFailed ? (
                  <AlertTriangle className="h-6 w-6 text-amber-600" />
                ) : effectiveVersionData.hasUpdate ? (
                  <ArrowUpCircle className="h-6 w-6 text-primary" />
                ) : (
                  <CheckCircle2 className="h-6 w-6 text-green-600" />
                )}
              </div>
              <div>
                <p className="font-medium">
                  {isLoading
                    ? "Memeriksa pembaruan…"
                    : checkFailed
                      ? "Tidak dapat memeriksa pembaruan"
                      : effectiveVersionData.hasUpdate
                        ? "Pembaruan tersedia"
                        : "Anda sudah menggunakan versi terbaru"}
                </p>
                <p className="text-sm text-muted-foreground">
                  Versi saat ini: <strong>v{displayVersion}</strong>
                  {!checkFailed && effectiveVersionData.hasUpdate && (
                    <> · Terbaru: <strong>v{effectiveVersionData.currentVersion}</strong></>
                  )}
                </p>
              </div>
            </div>
            {!checkFailed && effectiveVersionData.hasUpdate && (
              <Button asChild>
                <a
                  href={effectiveVersionData.updateUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Unduh pembaruan
                  <ExternalLink className="ml-1.5 h-4 w-4" />
                </a>
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Entri Catatan Perubahan */}
        <div className="space-y-6">
          <h2 className="text-lg font-semibold">Riwayat rilis</h2>
          
          {isLoading ? (
            <div className="space-y-6">
              <ChangelogEntrySkeleton />
              <ChangelogEntrySkeleton />
            </div>
          ) : changelog.length > 0 ? (
            <div className="space-y-6">
              {checkFailed && showingBundledChangelog && (
                <p className="text-sm text-muted-foreground">
                  Menampilkan catatan rilis yang disertakan dalam versi ini. Rilis yang lebih baru mungkin tercantum di GitHub.
                </p>
              )}
              {changelog.map((entry) => (
                <ChangelogEntryCard
                  key={entry.version}
                  entry={entry}
                  isCurrentVersion={entry.version === displayVersion}
                />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground/50" />
                <p className="mt-4 text-center text-muted-foreground">
                  Tidak dapat memuat catatan perubahan. Silakan periksa koneksi Anda dan coba lagi.
                </p>
                <Button variant="outline" className="mt-4" onClick={() => refetch()}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Coba Lagi
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
