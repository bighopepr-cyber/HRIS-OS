import { ReactNode, useEffect, useState } from "react";
import { PWAInstallBanner } from "@/components/layout/PWAInstallBanner";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";
import { usePermissions } from "@/hooks/usePermissions";
import { useEmployeeStatus } from "@/hooks/useEmployeeStatus";
import { AppModule, Permissions, canAccessReports, canAccessSettings, hasModuleAccess } from "@/lib/permissions";
import { useCompanyBranding } from "@/hooks/useCompanyBranding";
import { REPO_URL } from "@/lib/site";
import {
  Users,
  Calendar,
  Package,
  CreditCard,
  Settings,
  LogOut,
  Menu,
  X,
  Home,
  UserPlus,
  ClipboardList,
  ChevronDown,
  Target,
  BarChart3,
  Clock,
  Building2,
  CalendarDays,
  Bell,
  User,
  Sparkles,
  Receipt,
} from "lucide-react";
import hrHubLogo from "@/assets/hr-hub-logo.svg";
import { APP_VERSION, isAutoUpdatingEnvironment } from "@/lib/version";
import { useVersionCheck } from "@/hooks/useVersionCheck";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { NotificationBell } from "@/components/notifications/NotificationBell";

interface NavItem {
  label: string;
  href: string;
  icon: ReactNode;
  badge?: number;
  /** Hanya ditampilkan kepada pengguna yang lolos pemeriksaan ini; bila dihilangkan = semua orang (layanan mandiri). */
  visible?: (perms: Permissions) => boolean;
}

const canView = (module: AppModule) => (perms: Permissions) => hasModuleAccess(perms, module, "view");

const navItems: NavItem[] = [
  { label: "Dasbor", href: "/dashboard", icon: <Home className="h-5 w-5" /> },
  { label: "Karyawan", href: "/employees", icon: <Users className="h-5 w-5" />, visible: canView("employees") },
  { label: "Direktori Tim", href: "/employees", icon: <Users className="h-5 w-5" />, visible: (p) => !hasModuleAccess(p, "employees") },
  { label: "Departemen", href: "/departments", icon: <Building2 className="h-5 w-5" />, visible: canView("employees") },
  { label: "Onboarding", href: "/onboarding", icon: <UserPlus className="h-5 w-5" />, visible: canView("onboarding") },
  { label: "Absensi", href: "/attendance", icon: <Clock className="h-5 w-5" /> },
  { label: "Kalender", href: "/calendar", icon: <CalendarDays className="h-5 w-5" /> },
  { label: "Cuti", href: "/leaves", icon: <Calendar className="h-5 w-5" /> },
  { label: "Penggantian", href: "/reimbursements", icon: <Receipt className="h-5 w-5" /> },
  { label: "Kinerja", href: "/performance", icon: <Target className="h-5 w-5" /> },
  { label: "Aset", href: "/assets", icon: <Package className="h-5 w-5" />, visible: canView("assets") },
  { label: "Gaji", href: "/payroll", icon: <CreditCard className="h-5 w-5" />, visible: canView("payroll") },
  { label: "Laporan", href: "/reports", icon: <ClipboardList className="h-5 w-5" />, visible: canAccessReports },
  { label: "Pengaturan", href: "/settings", icon: <Settings className="h-5 w-5" />, visible: canAccessSettings },
];

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut, isSigningOut } = useAuth();
  const permissions = usePermissions();
  const showSettings = canAccessSettings(permissions);
  const { data: versionData } = useVersionCheck();
  const { data: branding } = useCompanyBranding();

  const { data: employeeStatus } = useEmployeeStatus();
  // Orang yang diundang tetapi belum terhubung ke catatan karyawan dan tidak
  // memiliki akses modul hanya dapat menggunakan dasbor (tempat mereka menyelesaikan onboarding).
  const isPendingInvitee = employeeStatus?.isEmployee === false && !permissions.hasAnyModuleAccess;
  const filteredNavItems = isPendingInvitee
    ? navItems.filter((item) => item.href === "/dashboard")
    : navItems.filter((item) => !item.visible || item.visible(permissions));

  // Tutup menu seluler setiap kali halaman berubah, apa pun penyebabnya
  // (tautan menu, maju/mundur, tautan di dalam halaman, pengalihan).
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.key]);

  // Saat menu seluler terbuka: Escape menutupnya dan halaman di belakangnya
  // tidak dapat digulir.
  useEffect(() => {
    if (!sidebarOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSidebarOpen(false);
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [sidebarOpen]);
  
  // Untuk lingkungan yang memperbarui diri otomatis, tampilkan versi terbaru dari GitHub
  // Untuk hosting mandiri: jika tidak ada pembaruan (sudah terbaru), tampilkan versi terbaru dari GitHub
  // Selain itu, tampilkan APP_VERSION lokal
  const displayVersion = isAutoUpdatingEnvironment() 
    ? (versionData?.currentVersion ?? APP_VERSION)
    : (versionData?.hasUpdate ? APP_VERSION : (versionData?.currentVersion ?? APP_VERSION));

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  const getUserInitials = () => {
    const name = user?.user_metadata?.full_name || user?.email || "Pengguna";
    return name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);
  };

  const getUserName = () => {
    return user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Pengguna";
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Lapisan penutup untuk bilah sisi di perangkat seluler */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-foreground/20 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Bilah sisi */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-50 h-full w-72 transform pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] border-r border-border bg-card transition-transform duration-300 ease-in-out lg:translate-x-0",
          sidebarOpen ? "translate-x-0 shadow-xl" : "-translate-x-full"
        )}
      >
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-20 items-center justify-between border-b border-border px-6">
            <Link to="/dashboard" className="flex items-center gap-3" onClick={() => setSidebarOpen(false)}>
              <img src={branding?.iconUrl || hrHubLogo} alt="HRISINDO" className="h-10 w-auto" />
              <span className="text-xl font-bold text-foreground">HRISINDO</span>
            </Link>
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setSidebarOpen(false)}
              aria-label="Tutup menu"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Navigasi */}
          <nav className="flex-1 overflow-y-auto px-4 py-6">
            <ul className="space-y-2">
              {filteredNavItems.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <li key={item.href}>
                    <Link
                      to={item.href}
                      className={cn(
                        "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200",
                        isActive
                          ? "bg-primary text-primary-foreground shadow-md"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      )}
                      onClick={() => setSidebarOpen(false)}
                    >
                      {item.icon}
                      <span className="flex-1">{item.label}</span>
                      {item.badge && (
                        <Badge
                          variant={isActive ? "secondary" : "default"}
                          className="h-6 min-w-6 justify-center"
                        >
                          {item.badge}
                        </Badge>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Bagian pengguna */}
          <div className="border-t border-border p-4">
            <Link
              to="/profile"
              onClick={() => setSidebarOpen(false)}
              className="flex items-center gap-3 rounded-xl bg-muted/50 p-3 transition-colors hover:bg-muted"
            >
              <Avatar className="h-10 w-10">
                <AvatarImage src={user?.user_metadata?.avatar_url} />
                <AvatarFallback>{getUserInitials()}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{getUserName()}</p>
                <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
              </div>
            </Link>
            {/* Informasi versi, beserta tautan kode sumber yang diminta AGPL-3.0 §13 untuk disediakan oleh layanan jaringan */}
            <div className="mt-3 flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <Link
                to="/changelog"
                onClick={() => setSidebarOpen(false)}
                className="flex items-center gap-2 transition-colors hover:text-foreground"
              >
                <span>v{displayVersion}</span>
                <span className="text-border">•</span>
                <span className="hover:underline">Apa yang Baru</span>
              </Link>
              <span className="text-border">•</span>
              <a
                href={REPO_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="transition-colors hover:text-foreground hover:underline"
              >
                Kode Sumber
              </a>
            </div>
          </div>
        </div>
      </aside>

      {/* Konten utama */}
      <div className="min-w-0 overflow-x-clip lg:pl-72">
        {/* Kepala halaman */}
        <header className="sticky top-0 z-30 box-content flex h-20 items-center pt-[env(safe-area-inset-top)] justify-between border-b border-border bg-card/95 px-4 backdrop-blur-lg lg:px-8">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setSidebarOpen(true)}
              aria-label="Buka menu"
              aria-expanded={sidebarOpen}
            >
              <Menu className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-lg font-semibold text-foreground lg:text-xl">
                {new Date().toLocaleDateString("id-ID", { weekday: "long" })}
              </h1>
              <p className="text-sm text-muted-foreground">
                {new Date().toLocaleDateString("id-ID", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Notifikasi */}
            <NotificationBell />

            {/* Pengaturan - hanya untuk orang yang dapat mengelola sesuatu di sana */}
            {showSettings && (
              <Button variant="ghost" size="icon" asChild>
                <Link to="/settings" aria-label="Pengaturan">
                  <Settings className="h-5 w-5" />
                </Link>
              </Button>
            )}

            {/* Menu pengguna */}
            <DropdownMenu modal={false}>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2 pl-2 pr-3" aria-label="Menu akun">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user?.user_metadata?.avatar_url} />
                    <AvatarFallback>{getUserInitials()}</AvatarFallback>
                  </Avatar>
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Akun Saya</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/profile">
                    <User className="mr-2 h-4 w-4" />
                    Pengaturan Profil
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/notification-preferences">
                    <Bell className="mr-2 h-4 w-4" />
                    Preferensi Notifikasi
                  </Link>
                </DropdownMenuItem>
                {showSettings && (
                  <DropdownMenuItem asChild>
                    <Link to="/settings">
                      <Settings className="mr-2 h-4 w-4" />
                      Pengaturan Akun
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem asChild>
                  <Link to="/changelog">
                    <Sparkles className="mr-2 h-4 w-4" />
                    Apa yang Baru
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive" onClick={handleSignOut} disabled={isSigningOut}>
                  {isSigningOut ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <LogOut className="mr-2 h-4 w-4" />
                  )}
                  {isSigningOut ? "Keluar..." : "Keluar"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Konten halaman */}
        <main className="p-4 lg:p-8">{children}</main>
      </div>

      <PWAInstallBanner />
    </div>
  );
}
