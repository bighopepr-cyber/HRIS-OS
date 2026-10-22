import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Clock, LogIn, LogOut, Calendar, Briefcase, Timer, AlertTriangle, MapPin, Loader2, Home, Building2, Pause, Play, Coffee } from "lucide-react";
import { usePagination } from "@/hooks/usePagination";
import { useSorting } from "@/hooks/useSorting";
import { SortableTableHead } from "@/components/ui/sortable-table-head";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { format, parseISO } from "date-fns";
import { useAttendance, useTodayAttendance, useClockIn, useClockOut, useAttendanceReport, LocationData, WorkMode } from "@/hooks/useAttendance";
import { usePermissions } from "@/hooks/usePermissions";
import { useActiveBreak, useBreaksForRecord, usePause, useResume, calculateTotalBreakHours } from "@/hooks/useAttendanceBreaks";
import { useOfficeLocation, getDistanceMeters } from "@/components/settings/OfficeLocationSettings";
import { getExpectedHours, getShiftEndTime } from "@/lib/shiftUtils";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { statusBadgeClass, formatStatus, toneClass } from "@/lib/statusStyles";

const MONTHS = [
  { value: "0", label: "Januari" },
  { value: "1", label: "Februari" },
  { value: "2", label: "Maret" },
  { value: "3", label: "April" },
  { value: "4", label: "Mei" },
  { value: "5", label: "Juni" },
  { value: "6", label: "Juli" },
  { value: "7", label: "Agustus" },
  { value: "8", label: "September" },
  { value: "9", label: "Oktober" },
  { value: "10", label: "November" },
  { value: "11", label: "Desember" },
];

function getStatusBadge(status: string) {
  return <Badge variant="outline" className={statusBadgeClass(status)}>{formatStatus(status)}</Badge>;
}

function WorkModeBadge({ mode }: { mode: WorkMode | null }) {
  if (!mode) return <span className="text-xs text-muted-foreground">-</span>;
  return (
    <Badge variant="outline" className={`text-xs ${mode === "wfo" ? toneClass("info") : toneClass("neutral")}`}>
      {mode === "wfo" ? (
        <><Building2 className="mr-1 h-3 w-3" aria-hidden="true" /> Kantor</>
      ) : (
        <><Home className="mr-1 h-3 w-3" aria-hidden="true" /> Rumah</>
      )}
    </Badge>
  );
}

const Attendance = () => {
  const { user } = useAuth();
  const { can } = usePermissions();
  // Insight keterlambatan dan lembur ditujukan bagi orang yang mengawasi kehadiran
  const canViewAttendanceInsights = can("attendance", "view");
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth().toString());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [workMode, setWorkMode] = useState<WorkMode>('wfo');
  const [showEarlyClockOutWarning, setShowEarlyClockOutWarning] = useState(false);
  const [earlyClockOutReasons, setEarlyClockOutReasons] = useState<{ beforeEndTime: boolean; insufficientHours: boolean }>({ beforeEndTime: false, insufficientHours: false });
  const [showLateClockOutDialog, setShowLateClockOutDialog] = useState(false);
  const [lateClockOutMode, setLateClockOutMode] = useState<"overtime" | "missed" | null>(null);
  const [missedClockOutTime, setMissedClockOutTime] = useState("");
  

  const targetDate = new Date(parseInt(selectedYear), parseInt(selectedMonth), 1);

  // Ambil karyawan saat ini beserta jadwal kerjanya - ambil terlebih dahulu
  const { data: currentEmployee } = useQuery({
    queryKey: ["current-employee-schedule"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("employees")
        .select("id, first_name, last_name, working_hours_start, working_hours_end, working_days")
        .eq("user_id", user?.id)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Sekarang ambil kehadiran hari ini secara khusus untuk karyawan saat ini
  const { data: todayRecord, isLoading: todayLoading } = useTodayAttendance(currentEmployee?.id);
  const { data: attendanceRecords, isLoading: recordsLoading } = useAttendance(targetDate, currentEmployee?.id);
  const { data: reportData, isLoading: reportLoading } = useAttendanceReport(targetDate);
  const { data: activeBreak } = useActiveBreak(todayRecord?.id);
  const { data: todayBreaks } = useBreaksForRecord(todayRecord?.id);
  const { data: officeLocation } = useOfficeLocation();
  const clockIn = useClockIn();
  const clockOut = useClockOut();
  const pauseMutation = usePause();
  const resumeMutation = useResume();
  // Format waktu untuk tampilan (mis., "09:00:00" -> "9:00 AM")
  const formatTimeDisplay = (time: string | null): string => {
    if (!time) return "--:--";
    const [hours, minutes] = time.split(':').map(Number);
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const hour12 = hours % 12 || 12;
    return `${hour12}:${minutes.toString().padStart(2, '0')} ${ampm}`;
  };

  // Ambil nama hari untuk hari kerja
  const getDayNames = (days: number[] | null): string => {
    if (!days || days.length === 0) return "Belum diatur";
    const dayNames = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
    return days.sort((a, b) => a - b).map(d => dayNames[d]).join(', ');
  };

  // Periksa apakah hari ini adalah hari kerja
  const isWorkingDay = (days: number[] | null): boolean => {
    const today = new Date().getDay();
    return (days || [1, 2, 3, 4, 5]).includes(today);
  };

  // Hitung lembur untuk sebuah catatan berdasarkan jadwal kerja karyawan pada catatan tersebut
  const calculateOvertime = (record: { clock_in: string | null; clock_out: string | null; total_hours: number | null; employee?: { working_hours_start: string | null; working_hours_end: string | null } }): number => {
    if (!record.clock_out || !record.total_hours) return 0;
    
    const workStart = record.employee?.working_hours_start || currentEmployee?.working_hours_start || "09:00:00";
    const workEnd = record.employee?.working_hours_end || currentEmployee?.working_hours_end || "18:00:00";
    
    // Hitung jam kerja yang diharapkan dengan mempertimbangkan shift yang melewati tengah malam
    const expectedHours = getExpectedHours(workStart, workEnd);
    
    // Lembur adalah jam kerja yang melebihi jam yang diharapkan
    const overtime = record.total_hours - expectedHours;
    return overtime > 0 ? overtime : 0;
  };

  // Hitung total lembur untuk bulan ini
  const calculateMonthlyOvertime = (): number => {
    if (!attendanceRecords) return 0;
    return attendanceRecords.reduce((total, record) => total + calculateOvertime(record), 0);
  };

  // Hitung keterlambatan dalam menit menggunakan jadwal kerja karyawan pada catatan tersebut
  const calculateLateArrival = (clockIn: string | null, employeeSchedule?: { working_hours_start: string | null; working_hours_end: string | null }): number => {
    if (!clockIn) return 0;
    
    const workStart = employeeSchedule?.working_hours_start || currentEmployee?.working_hours_start || "09:00:00";
    const [startHour, startMin] = workStart.split(':').map(Number);
    
    const clockInDate = new Date(clockIn);
    const clockInHour = clockInDate.getHours();
    const clockInMinute = clockInDate.getMinutes();
    
    // Hitung menit keterlambatan (toleransi 1 menit untuk memperhitungkan detik)
    const scheduledMinutes = startHour * 60 + startMin;
    const actualMinutes = clockInHour * 60 + clockInMinute;
    const lateMinutes = actualMinutes - scheduledMinutes;
    
    return lateMinutes > 1 ? lateMinutes : 0;
  };

  // Format durasi keterlambatan untuk tampilan
  const formatLateDuration = (minutes: number): string => {
    if (minutes < 60) return `${minutes} mnt`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours} jam ${mins} mnt` : `${hours} jam`;
  };

  // Hitung jumlah keterlambatan untuk bulan ini
  const countLateArrivals = (): number => {
    if (!attendanceRecords) return 0;
    return attendanceRecords.filter(record => calculateLateArrival(record.clock_in, record.employee) > 0).length;
  };

  // Pengurutan untuk riwayat kehadiran
  const historySorting = useSorting(attendanceRecords || []);
  
  // Paginasi untuk riwayat kehadiran (menggunakan item yang sudah diurutkan)
  const historyPagination = usePagination(historySorting.sortedItems, { initialPageSize: 10 });

  // Ambil lokasi saat ini
  const getCurrentLocation = (): Promise<LocationData | undefined> => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        toast.error("Geolokasi tidak didukung oleh peramban Anda");
        resolve(undefined);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          
          // Coba ambil nama lokasi melalui geocoding terbalik
          let locationName: string | undefined;
          try {
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`
            );
            const data = await response.json();
            if (data.address) {
              // Susun alamat yang mudah dibaca beserta kota
              const addr = data.address;
              const parts: string[] = [];
              
              // Tambahkan detail tingkat jalan
              if (addr.road) parts.push(addr.road);
              else if (addr.neighbourhood) parts.push(addr.neighbourhood);
              else if (addr.suburb) parts.push(addr.suburb);
              
              // Tambahkan area/wilayah
              if (addr.suburb && !parts.includes(addr.suburb)) parts.push(addr.suburb);
              else if (addr.neighbourhood && !parts.includes(addr.neighbourhood)) parts.push(addr.neighbourhood);
              
              // Tambahkan kota
              const city = addr.city || addr.town || addr.village || addr.municipality || addr.county;
              if (city) parts.push(city);
              
              // Tambahkan provinsi jika berbeda dengan kota
              if (addr.state && addr.state !== city) parts.push(addr.state);
              
              locationName = parts.slice(0, 4).join(", ");
            } else if (data.display_name) {
              // Cadangan gunakan display_name
              const parts = data.display_name.split(", ");
              locationName = parts.slice(0, 4).join(", ");
            }
          } catch (error) {
            console.error("Gagal mendapatkan nama lokasi:", error);
          }

          resolve({ latitude, longitude, locationName });
        },
        (error) => {
          console.error("Kesalahan geolokasi:", error);
          switch (error.code) {
            case error.PERMISSION_DENIED:
              toast.error("Akses lokasi diperlukan untuk presensi masuk. Aktifkan izin lokasi di pengaturan peramban Anda lalu coba lagi.");
              break;
            case error.POSITION_UNAVAILABLE:
              toast.error("Informasi lokasi tidak tersedia. Presensi masuk memerlukan akses lokasi.");
              break;
            case error.TIMEOUT:
              toast.error("Permintaan lokasi habis waktu. Silakan coba lagi.");
              break;
            default:
              toast.error("Gagal mendapatkan lokasi. Presensi masuk memerlukan akses lokasi.");
          }
          resolve(undefined);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      );
    });
  };

  const handleClockIn = async (mode: WorkMode) => {
    if (!currentEmployee) {
      toast.error("Profil karyawan tidak ditemukan");
      return;
    }

    try {
      toast.info("Mengambil lokasi Anda...");
      const location = await getCurrentLocation();

      // Untuk WFO, lokasi wajib diisi; untuk WFH bersifat opsional
      if (mode === 'wfo' && !location) {
        toast.error("Lokasi diperlukan untuk presensi masuk dari kantor");
        return;
      }

      // Deteksi mode kerja otomatis hanya jika lokasi tersedia dan kantor sudah dikonfigurasi
      let detectedMode = mode;
      if (location && officeLocation?.latitude && officeLocation?.longitude) {
        const distance = getDistanceMeters(
          location.latitude, location.longitude,
          officeLocation.latitude, officeLocation.longitude
        );
        const radius = officeLocation.radius_meters || 500;
        detectedMode = distance <= radius ? 'wfo' : 'wfh';

        // Jika pengguna memilih WFO tetapi berada di luar radius kantor, blokir
        if (mode === 'wfo' && detectedMode === 'wfh') {
          toast.error(`Anda tidak berada di lokasi kantor (${Math.round(distance)} m). Silakan pilih Kerja dari Rumah.`);
          return;
        }
      }

      await clockIn.mutateAsync({ employeeId: currentEmployee.id, location, workMode: detectedMode });
      const modeLabel = detectedMode === 'wfh' ? 'Kerja dari Rumah' : 'Kerja dari Kantor';
      toast.success(location ? `Presensi masuk (${modeLabel}) dengan lokasi` : `Presensi masuk (${modeLabel})`);
    } catch (error) {
      toast.error("Gagal melakukan presensi masuk");
    }
  };

  // Hitung jam kerja saat ini untuk peringatan keluar lebih awal
  const calculateCurrentHoursWorked = (): number => {
    if (!todayRecord?.clock_in) return 0;
    const clockInTime = new Date(todayRecord.clock_in);
    const now = new Date();
    return (now.getTime() - clockInTime.getTime()) / (1000 * 60 * 60);
  };

  // Periksa apakah waktu saat ini sebelum waktu selesai yang dijadwalkan (menangani shift yang melewati tengah malam)
  const isBeforeEndTime = (): boolean => {
    if (!currentEmployee?.working_hours_end || !currentEmployee?.working_hours_start || !todayRecord?.clock_in) return false;
    const clockInTime = new Date(todayRecord.clock_in);
    const endTime = getShiftEndTime(clockInTime, currentEmployee.working_hours_start, currentEmployee.working_hours_end);
    return new Date() < endTime;
  };

  const handleClockOutAttempt = () => {
    if (!todayRecord || !todayRecord.clock_in) {
      toast.error("Tidak ditemukan presensi masuk yang aktif");
      return;
    }

    const hoursWorked = calculateCurrentHoursWorked();
    const workStart = currentEmployee?.working_hours_start || "09:00:00";
    const workEnd = currentEmployee?.working_hours_end || "18:00:00";
    const requiredHours = getExpectedHours(workStart, workEnd);
    const beforeEndTime = isBeforeEndTime();
    const insufficientHours = hoursWorked < requiredHours;

    if (beforeEndTime || insufficientHours) {
      setEarlyClockOutReasons({ beforeEndTime, insufficientHours });
      setShowEarlyClockOutWarning(true);
    } else {
      // Sudah melewati waktu selesai - periksa apakah lembur atau lupa melakukan presensi keluar
      const isAfterEndTime = !isBeforeEndTime();
      if (isAfterEndTime && hoursWorked > requiredHours) {
        setLateClockOutMode(null);
        setMissedClockOutTime(workEnd.substring(0, 5));
        setShowLateClockOutDialog(true);
      } else {
        handleClockOut();
      }
    }
  };

  const handleLateClockOutConfirm = async () => {
    if (!todayRecord || !todayRecord.clock_in) return;
    setShowLateClockOutDialog(false);

    if (lateClockOutMode === "overtime") {
      handleClockOut();
    } else if (lateClockOutMode === "missed" && missedClockOutTime) {
      try {
        toast.info("Mengambil lokasi Anda...");
        const location = await getCurrentLocation();
        
        // Susun tanggal keluar dari tanggal hari ini + waktu yang dimasukkan
        const [hours, minutes] = missedClockOutTime.split(":").map(Number);
        const customTime = new Date(todayRecord.clock_in);
        customTime.setHours(hours, minutes, 0, 0);
        
        // Jika waktu kustom lebih awal dari waktu masuk, kemungkinan hari berikutnya (melewati tengah malam)
        if (customTime <= new Date(todayRecord.clock_in)) {
          customTime.setDate(customTime.getDate() + 1);
        }
        
        await clockOut.mutateAsync({ recordId: todayRecord.id, clockIn: todayRecord.clock_in, location, customClockOut: customTime });
        toast.success("Presensi keluar dilakukan dengan waktu yang dikoreksi");
      } catch (error) {
        toast.error("Gagal melakukan presensi keluar");
      }
    }
  };

  const handleClockOut = async () => {
    if (!todayRecord || !todayRecord.clock_in) {
      toast.error("Tidak ditemukan presensi masuk yang aktif");
      return;
    }

    setShowEarlyClockOutWarning(false);

    try {
      toast.info("Mengambil lokasi Anda...");
      const location = await getCurrentLocation();
      await clockOut.mutateAsync({ recordId: todayRecord.id, clockIn: todayRecord.clock_in, location });
      toast.success(location ? "Presensi keluar dengan lokasi" : "Presensi keluar berhasil");
    } catch (error) {
      toast.error("Gagal melakukan presensi keluar");
    }
  };

  // Format jam kerja untuk ditampilkan dalam peringatan
  const formatHoursWorked = (hours: number): string => {
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return m > 0 ? `${h} jam ${m} mnt` : `${h} jam`;
  };

  const handlePause = async () => {
    if (!todayRecord) return;
    try {
      toast.info("Mengambil lokasi Anda...");
      const location = await getCurrentLocation();
      if (!location) return;
      await pauseMutation.mutateAsync({ attendanceRecordId: todayRecord.id, location });
      toast.success("Kerja dijeda — istirahat dimulai");
    } catch (error) {
      toast.error("Gagal menjeda kerja");
    }
  };

  const handleResume = async () => {
    if (!activeBreak) return;
    try {
      toast.info("Mengambil lokasi Anda...");
      const location = await getCurrentLocation();
      if (!location) return;
      await resumeMutation.mutateAsync({ breakId: activeBreak.id, location });
      toast.success("Kerja dilanjutkan");
    } catch (error) {
      toast.error("Gagal melanjutkan kerja");
    }
  };

  const totalBreakHours = todayBreaks ? calculateTotalBreakHours(todayBreaks) : 0;
  const isPaused = !!activeBreak;

  const currentTime = new Date();
  const isClockedIn = todayRecord?.clock_in && !todayRecord?.clock_out;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground sm:text-3xl">Kehadiran</h1>
            <p className="text-muted-foreground">Placak kehadiran harian Anda dan lihat riwayat</p>
          </div>
          <div className="flex items-center gap-2">
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="w-[140px]" aria-label="Bulan">
                <SelectValue placeholder="Bulan" />
              </SelectTrigger>
              <SelectContent>
                {MONTHS.map((month) => (
                  <SelectItem key={month.value} value={month.value}>
                    {month.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger className="w-[100px]" aria-label="Tahun">
                <SelectValue placeholder="Tahun" />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map((year) => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Kartu Presensi Masuk/Keluar */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              Kehadiran Hari Ini
            </CardTitle>
            <CardDescription>{format(currentTime, "EEEE, MMMM d, yyyy")}</CardDescription>
          </CardHeader>
          <CardContent>
            {todayLoading ? (
              <Skeleton className="h-20 w-full" />
            ) : (
              <div className="flex flex-col gap-4">
                <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
                  <div className="flex flex-col gap-2 text-center sm:text-left">
                    <div className="flex items-center gap-4 flex-wrap">
                      <div>
                        <p className="text-sm text-muted-foreground">Presensi Masuk</p>
                        <div className="flex items-center gap-2">
                          <p className="text-lg font-semibold">
                            {todayRecord?.clock_in
                              ? format(new Date(todayRecord.clock_in), "hh:mm a")
                              : "--:--"}
                          </p>
                          {canViewAttendanceInsights && todayRecord?.clock_in && calculateLateArrival(todayRecord.clock_in) > 0 && (
                            <Badge variant="outline" className={`text-xs ${toneClass("danger")}`}>
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              {formatLateDuration(calculateLateArrival(todayRecord.clock_in))} terlambat
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Presensi Keluar</p>
                        <p className="text-lg font-semibold">
                          {todayRecord?.clock_out
                            ? format(new Date(todayRecord.clock_out), "hh:mm a")
                            : "--:--"}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Total Jam</p>
                        <p className="text-lg font-semibold">
                          {todayRecord?.total_hours
                            ? `${todayRecord.total_hours.toFixed(2)} jam`
                            : "--"}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col gap-3 items-center sm:items-end">
                    {!isClockedIn && !todayRecord?.clock_out && (
                      <div className="flex flex-col gap-2">
                        <p className="text-xs text-muted-foreground text-center sm:text-right">Pilih mode kerja:</p>
                        <div className="flex gap-2">
                          <Button 
                            onClick={() => handleClockIn('wfo')} 
                            disabled={clockIn.isPending}
                            variant="default"
                          >
                            {clockIn.isPending ? (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                              <Building2 className="mr-2 h-4 w-4" />
                            )}
                            Kantor
                          </Button>
                          <Button 
                            onClick={() => handleClockIn('wfh')} 
                            disabled={clockIn.isPending}
                            variant="secondary"
                          >
                            {clockIn.isPending ? (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                              <Home className="mr-2 h-4 w-4" />
                            )}
                            Rumah
                          </Button>
                        </div>
                      </div>
                    )}
                    {isClockedIn && (
                      <div className="flex flex-col gap-2 items-center sm:items-end">
                        <div className="flex items-center gap-2 flex-wrap justify-center sm:justify-end">
                          {todayRecord?.work_mode && (
                            <Badge variant={todayRecord.work_mode === 'wfo' ? 'default' : 'secondary'}>
                              {todayRecord.work_mode === 'wfo' ? (
                                <><Building2 className="h-3 w-3 mr-1" /> Kantor</>
                              ) : (
                                <><Home className="h-3 w-3 mr-1" /> Rumah</>
                              )}
                            </Badge>
                          )}
                          {isPaused ? (
                            <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/20">
                              <Coffee className="h-3 w-3 mr-1" /> Istirahat
                            </Badge>
                          ) : null}
                        </div>
                        <div className="flex items-center gap-2">
                          {isPaused ? (
                            <Button onClick={handleResume} variant="default" disabled={resumeMutation.isPending}>
                              {resumeMutation.isPending ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              ) : (
                                <Play className="mr-2 h-4 w-4" />
                              )}
                              Lanjutkan
                            </Button>
                          ) : (
                            <>
                              <Button onClick={handlePause} variant="secondary" disabled={pauseMutation.isPending}>
                                {pauseMutation.isPending ? (
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                  <Pause className="mr-2 h-4 w-4" />
                                )}
                                Jeda
                              </Button>
                              <Button onClick={handleClockOutAttempt} variant="outline" disabled={clockOut.isPending}>
                                {clockOut.isPending ? (
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                  <LogOut className="mr-2 h-4 w-4" />
                                )}
                                Presensi Keluar
                              </Button>
                            </>
                          )}
                        </div>
                        {todayBreaks && todayBreaks.length > 0 && (
                          <p className="text-xs text-muted-foreground">
                            {todayBreaks.length} istirahat · total {totalBreakHours.toFixed(1)} jam
                          </p>
                        )}
                      </div>
                    )}
                    {todayRecord?.clock_out && (
                      <div className="flex items-center gap-2">
                        {todayRecord?.work_mode && (
                          <Badge variant={todayRecord.work_mode === 'wfo' ? 'default' : 'secondary'}>
                            {todayRecord.work_mode === 'wfo' ? (
                              <><Building2 className="h-3 w-3 mr-1" /> Kantor</>
                            ) : (
                              <><Home className="h-3 w-3 mr-1" /> Rumah</>
                            )}
                          </Badge>
                        )}
                        <Badge variant="outline" className="text-sm">
                          Selesai untuk hari ini
                        </Badge>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Tampilan Lokasi */}
                {(todayRecord?.clock_in_location_name || todayRecord?.clock_out_location_name) && (
                  <div className="flex flex-col gap-2 pt-2 border-t border-border">
                    {todayRecord?.clock_in_location_name && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className="h-3.5 w-3.5 text-primary" />
                        <span>Presensi Masuk:</span>
                        <span className="text-foreground">{todayRecord.clock_in_location_name}</span>
                      </div>
                    )}
                    {todayRecord?.clock_out_location_name && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className="h-3.5 w-3.5 text-primary" />
                        <span>Presensi Keluar:</span>
                        <span className="text-foreground">{todayRecord.clock_out_location_name}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Kartu Jadwal Kerja */}
        {currentEmployee && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-primary" />
                Jadwal Kerja Saya
              </CardTitle>
              <CardDescription>Jam dan hari kerja Anda yang dikonfigurasi untuk pengingat kehadiran</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="grid grid-cols-2 gap-6 sm:flex sm:gap-8">
                  <div>
                    <p className="text-sm text-muted-foreground">Waktu Mulai</p>
                    <p className="text-lg font-semibold">
                      {formatTimeDisplay(currentEmployee.working_hours_start)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Waktu Selesai</p>
                    <p className="text-lg font-semibold">
                      {formatTimeDisplay(currentEmployee.working_hours_end)}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-sm text-muted-foreground">Hari Kerja</p>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'].map((day, index) => {
                        const workingDays = currentEmployee.working_days || [1, 2, 3, 4, 5];
                        const isActive = workingDays.includes(index);
                        const isToday = new Date().getDay() === index;
                        return (
                          <Badge 
                            key={day} 
                            variant={isActive ? "default" : "outline"}
                            className={`${isToday ? 'ring-2 ring-primary ring-offset-2' : ''} ${!isActive ? 'text-muted-foreground' : ''}`}
                          >
                            {day}
                          </Badge>
                        );
                      })}
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-start gap-2 sm:items-end">
                  {isWorkingDay(currentEmployee.working_days) ? (
                    <Badge variant="outline" className={toneClass("success")}>Hari kerja</Badge>
                  ) : (
                    <Badge variant="outline" className={toneClass("neutral")}>Hari libur</Badge>
                  )}
                  <a href="/profile" className="text-sm text-primary hover:underline">
                    Sunting Jadwal →
                  </a>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Ringkasan Bulanan Saya */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              <div>
                <CardTitle>Ringkasan Bulanan Saya</CardTitle>
                <CardDescription>
                  {MONTHS[parseInt(selectedMonth)].label} {selectedYear}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {reportLoading ? (
              <Skeleton className="h-24 w-full" />
            ) : (() => {
              const myData = reportData?.find((emp) => emp.employeeId === currentEmployee?.id);
              if (!myData) {
                return (
                  <div className="flex h-24 items-center justify-center text-muted-foreground">
                    Tidak ada catatan kehadiran untuk bulan ini
                  </div>
                );
              }
              return (
                <div className={`grid grid-cols-2 gap-3 sm:gap-4 ${canViewAttendanceInsights ? "sm:grid-cols-3 lg:grid-cols-5" : "sm:grid-cols-4"}`}>
                  <div className="rounded-lg border bg-muted/50 p-3 sm:p-4">
                    <p className="text-sm text-muted-foreground">Hari hadir</p>
                    <p className="text-xl font-bold sm:text-2xl">{myData.presentDays}</p>
                  </div>
                  <div className="rounded-lg border bg-primary/10 p-3 sm:p-4">
                    <p className="text-sm text-muted-foreground">Dari kantor</p>
                    <p className="text-xl font-bold text-primary sm:text-2xl">{myData.wfoDays}</p>
                  </div>
                  <div className="rounded-lg border bg-muted/50 p-3 sm:p-4">
                    <p className="text-sm text-muted-foreground">Total jam</p>
                    <p className="text-xl font-bold sm:text-2xl">{myData.totalHours.toFixed(1)} jam</p>
                  </div>
                  <div className="rounded-lg border bg-muted/50 p-3 sm:p-4">
                    <p className="text-sm text-muted-foreground">Rata-rata jam/hari</p>
                    <p className="text-xl font-bold sm:text-2xl">
                      {myData.totalDays > 0 ? (myData.totalHours / myData.totalDays).toFixed(1) : "0"} jam
                    </p>
                  </div>
                  {canViewAttendanceInsights && (
                    <div className="col-span-2 rounded-lg border bg-muted/50 p-3 sm:col-span-1 sm:p-4">
                      <p className="text-sm text-muted-foreground">Keterlambatan</p>
                      <p className="text-xl font-bold sm:text-2xl">{myData.lateDays}</p>
                    </div>
                  )}
                </div>
              );
            })()}
          </CardContent>
        </Card>

        {/* Riwayat Kehadiran Saya */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-4">
            <div>
              <CardTitle>Riwayat Kehadiran Saya</CardTitle>
              <CardDescription>Catatan kehadiran Anda untuk {MONTHS[parseInt(selectedMonth)].label}</CardDescription>
            </div>
            {attendanceRecords && attendanceRecords.length > 0 && (
              <div className="flex flex-wrap items-center gap-3">
                {canViewAttendanceInsights && countLateArrivals() > 0 && (
                  <div className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm ${toneClass("danger")}`}>
                    <AlertTriangle className="h-4 w-4" aria-hidden="true" />
                    <span>Keterlambatan: <span className="font-semibold">{countLateArrivals()}</span></span>
                  </div>
                )}
                {canViewAttendanceInsights && (
                  <div className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm ${toneClass("warning")}`}>
                    <Timer className="h-4 w-4" aria-hidden="true" />
                    <span>Lembur: <span className="font-semibold">{calculateMonthlyOvertime().toFixed(2)} jam</span></span>
                  </div>
                )}
              </div>
            )}
          </CardHeader>
          <CardContent>
            {recordsLoading ? (
              <Skeleton className="h-64 w-full" />
            ) : attendanceRecords && attendanceRecords.length > 0 ? (
            <>
              {/* Mobile: kartu bertumpuk */}
              <ul className="space-y-3 sm:hidden">
                {historyPagination.paginatedItems.map((record) => {
                  const overtime = calculateOvertime(record);
                  const lateMinutes = calculateLateArrival(record.clock_in, record.employee);
                  return (
                    <li key={record.id} className="rounded-lg border p-3">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-medium">{format(parseISO(record.date), "EEE, MMM d, yyyy")}</p>
                        {getStatusBadge(record.status)}
                      </div>
                      <dl className="mt-2 grid grid-cols-3 gap-2 text-sm">
                        <div>
                          <dt className="text-xs text-muted-foreground">Masuk</dt>
                          <dd className="font-medium">{record.clock_in ? format(new Date(record.clock_in), "hh:mm a") : "-"}</dd>
                        </div>
                        <div>
                          <dt className="text-xs text-muted-foreground">Keluar</dt>
                          <dd className="font-medium">{record.clock_out ? format(new Date(record.clock_out), "hh:mm a") : "-"}</dd>
                        </div>
                        <div>
                          <dt className="text-xs text-muted-foreground">Total</dt>
                          <dd className="font-medium">{record.total_hours ? `${record.total_hours.toFixed(2)} jam` : "-"}</dd>
                        </div>
                      </dl>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <WorkModeBadge mode={record.work_mode} />
                        {canViewAttendanceInsights && lateMinutes > 0 && (
                          <Badge variant="outline" className={`text-xs ${toneClass("danger")}`}>
                            <AlertTriangle className="mr-1 h-3 w-3" aria-hidden="true" />
                            {formatLateDuration(lateMinutes)} terlambat
                          </Badge>
                        )}
                        {canViewAttendanceInsights && overtime > 0 && (
                          <Badge variant="outline" className={`text-xs ${toneClass("warning")}`}>
                            +{overtime.toFixed(2)} jam lembur
                          </Badge>
                        )}
                      </div>
                      {(record.clock_in_location_name || record.clock_out_location_name) && (
                        <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                          {record.clock_in_location_name && (
                            <p className="flex items-start gap-1.5">
                              <MapPin className="mt-0.5 h-3 w-3 shrink-0 text-primary" aria-hidden="true" />
                              <span className="min-w-0 break-words">Masuk: {record.clock_in_location_name}</span>
                            </p>
                          )}
                          {record.clock_out_location_name && (
                            <p className="flex items-start gap-1.5">
                              <MapPin className="mt-0.5 h-3 w-3 shrink-0 text-primary" aria-hidden="true" />
                              <span className="min-w-0 break-words">Keluar: {record.clock_out_location_name}</span>
                            </p>
                          )}
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
              <div
                className="hidden overflow-x-auto rounded-md border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:block"
                tabIndex={0}
                role="region"
                aria-label="Tabel riwayat kehadiran"
              >
                <Table>
                  <TableHeader>
                    <TableRow>
                      <SortableTableHead
                        sortKey="date"
                        currentSortKey={historySorting.sortConfig.key as string | null}
                        direction={historySorting.sortConfig.key === "date" ? historySorting.sortConfig.direction : null}
                        onSort={(key) => historySorting.requestSort(key as keyof typeof historySorting.sortedItems[0])}
                      >
                        Tanggal
                      </SortableTableHead>
                      <TableHead>Presensi Masuk</TableHead>
                      <TableHead>Presensi Keluar</TableHead>
                      <SortableTableHead
                        sortKey="total_hours"
                        currentSortKey={historySorting.sortConfig.key as string | null}
                        direction={historySorting.sortConfig.key === "total_hours" ? historySorting.sortConfig.direction : null}
                        onSort={(key) => historySorting.requestSort(key as keyof typeof historySorting.sortedItems[0])}
                      >
                        Total Jam
                      </SortableTableHead>
                      {canViewAttendanceInsights && <TableHead>Lembur</TableHead>}
                      <TableHead>Mode</TableHead>
                      <TableHead>Lokasi</TableHead>
                      <SortableTableHead
                        sortKey="status"
                        currentSortKey={historySorting.sortConfig.key as string | null}
                        direction={historySorting.sortConfig.key === "status" ? historySorting.sortConfig.direction : null}
                        onSort={(key) => historySorting.requestSort(key as keyof typeof historySorting.sortedItems[0])}
                      >
                        Status
                      </SortableTableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {historyPagination.paginatedItems.map((record) => {
                      const overtime = calculateOvertime(record);
                      const lateMinutes = calculateLateArrival(record.clock_in, record.employee);
                      return (
                        <TableRow key={record.id}>
                          <TableCell className="whitespace-nowrap">{format(parseISO(record.date), "MMM d, yyyy")}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2 whitespace-nowrap">
                              {record.clock_in ? format(new Date(record.clock_in), "hh:mm a") : "-"}
                              {canViewAttendanceInsights && lateMinutes > 0 && (
                                <Badge variant="outline" className={`text-xs ${toneClass("danger")}`}>
                                  <AlertTriangle className="h-3 w-3 mr-1" />
                                  {formatLateDuration(lateMinutes)} terlambat
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            {record.clock_out ? format(new Date(record.clock_out), "hh:mm a") : "-"}
                          </TableCell>
                          <TableCell>
                            {record.total_hours ? `${record.total_hours.toFixed(2)} jam` : "-"}
                          </TableCell>
                          {canViewAttendanceInsights && (
                            <TableCell>
                              {overtime > 0 ? (
                                <Badge variant="outline" className={`whitespace-nowrap text-xs ${toneClass("warning")}`}>
                                  +{overtime.toFixed(2)} jam
                                </Badge>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </TableCell>
                          )}
                          <TableCell>
                            <WorkModeBadge mode={record.work_mode} />
                          </TableCell>
                          <TableCell>
                            {(record.clock_in_location_name || record.clock_out_location_name) ? (
                              <TooltipProvider>
                                <div className="flex flex-col gap-1 max-w-[200px]">
                                  {record.clock_in_location_name && (
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <div className="flex items-start gap-1.5 text-xs cursor-help">
                                          <MapPin className="h-3 w-3 text-primary shrink-0 mt-0.5" />
                                          <span className="text-muted-foreground truncate">
                                            Masuk: {record.clock_in_location_name}
                                          </span>
                                        </div>
                                      </TooltipTrigger>
                                      <TooltipContent side="top" className="max-w-[300px]">
                                        <p className="text-sm font-medium">Lokasi Presensi Masuk</p>
                                        <p className="text-xs text-muted-foreground">{record.clock_in_location_name}</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  )}
                                  {record.clock_out_location_name && (
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <div className="flex items-start gap-1.5 text-xs cursor-help">
                                          <MapPin className="h-3 w-3 text-primary shrink-0 mt-0.5" />
                                          <span className="text-muted-foreground truncate">
                                            Keluar: {record.clock_out_location_name}
                                          </span>
                                        </div>
                                      </TooltipTrigger>
                                      <TooltipContent side="top" className="max-w-[300px]">
                                        <p className="text-sm font-medium">Lokasi Presensi Keluar</p>
                                        <p className="text-xs text-muted-foreground">{record.clock_out_location_name}</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  )}
                                </div>
                              </TooltipProvider>
                            ) : (
                              <span className="text-muted-foreground text-xs">-</span>
                            )}
                          </TableCell>
                          <TableCell>{getStatusBadge(record.status)}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
              {/* Paginasi untuk riwayat */}
              {historyPagination.totalPages > 1 && (
                <div className="mt-4 flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>Tampilkan</span>
                    <Select value={historyPagination.pageSize.toString()} onValueChange={(v) => historyPagination.setPageSize(Number(v))}>
                      <SelectTrigger className="h-8 w-[70px]" aria-label="Baris per halaman">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[5, 10, 20, 50].map((size) => (
                          <SelectItem key={size} value={size.toString()}>{size}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <span>dari {historyPagination.totalItems} catatan</span>
                  </div>
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          onClick={() => historyPagination.canGoPrevious && historyPagination.goToPreviousPage()}
                          className={!historyPagination.canGoPrevious ? "pointer-events-none opacity-50" : "cursor-pointer"}
                        />
                      </PaginationItem>
                      {(() => {
                        const pages: (number | "ellipsis")[] = [];
                        const { currentPage, totalPages } = historyPagination;
                        if (totalPages <= 7) {
                          for (let i = 1; i <= totalPages; i++) pages.push(i);
                        } else {
                          pages.push(1);
                          if (currentPage > 3) pages.push("ellipsis");
                          for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
                            pages.push(i);
                          }
                          if (currentPage < totalPages - 2) pages.push("ellipsis");
                          pages.push(totalPages);
                        }
                        return pages.map((page, idx) =>
                          page === "ellipsis" ? (
                            <PaginationItem key={`ellipsis-${idx}`}>
                              <PaginationEllipsis />
                            </PaginationItem>
                          ) : (
                            <PaginationItem key={page}>
                              <PaginationLink
                                onClick={() => historyPagination.setPage(page)}
                                isActive={historyPagination.currentPage === page}
                                className="cursor-pointer"
                              >
                                {page}
                              </PaginationLink>
                            </PaginationItem>
                          )
                        );
                      })()}
                      <PaginationItem>
                        <PaginationNext
                          onClick={() => historyPagination.canGoNext && historyPagination.goToNextPage()}
                          className={!historyPagination.canGoNext ? "pointer-events-none opacity-50" : "cursor-pointer"}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
              </>
            ) : (
              <div className="flex h-32 items-center justify-center text-muted-foreground">
                Tidak ada catatan kehadiran ditemukan
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Dialog Peringatan Presensi Keluar Lebih Awal */}
      <AlertDialog open={showEarlyClockOutWarning} onOpenChange={setShowEarlyClockOutWarning}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Peringatan Presensi Keluar Lebih Awal
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2">
                {earlyClockOutReasons.insufficientHours && (
                  <p>
                    Anda hanya bekerja <span className="font-semibold">{formatHoursWorked(calculateCurrentHoursWorked())}</span> hari ini. 
                    Minimum yang diperlukan adalah <span className="font-semibold">9 jam</span>.
                  </p>
                )}
                {earlyClockOutReasons.beforeEndTime && currentEmployee?.working_hours_end && (
                  <p>
                    Waktu selesai yang dijadwalkan adalah <span className="font-semibold">{formatTimeDisplay(currentEmployee.working_hours_end)}</span>.
                  </p>
                )}
                <p className="pt-2">Anda yakin ingin melakukan presensi keluar lebih awal?</p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Lanjutkan Bekerja</AlertDialogCancel>
            <AlertDialogAction onClick={handleClockOut}>
              Tetap Keluar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog Presensi Keluar Setelah Waktu Selesai */}
      <AlertDialog open={showLateClockOutDialog} onOpenChange={setShowLateClockOutDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Timer className="h-5 w-5 text-orange-500" />
              Presensi Keluar Setelah Waktu Selesai
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-4">
                <p>
                  Waktu selesai yang dijadwalkan adalah <span className="font-semibold">{formatTimeDisplay(currentEmployee?.working_hours_end || "18:00:00")}</span> dan Anda telah bekerja <span className="font-semibold">{formatHoursWorked(calculateCurrentHoursWorked())}</span>.
                </p>
                <p>Apakah ini lembur atau Anda lupa melakukan presensi keluar?</p>
                <div className="flex flex-col gap-2 pt-2">
                  <Button
                    variant={lateClockOutMode === "overtime" ? "default" : "outline"}
                    className="justify-start"
                    onClick={() => setLateClockOutMode("overtime")}
                  >
                    <Timer className="mr-2 h-4 w-4" />
                    Itu lembur — gunakan waktu saat ini
                  </Button>
                  <Button
                    variant={lateClockOutMode === "missed" ? "default" : "outline"}
                    className="justify-start"
                    onClick={() => setLateClockOutMode("missed")}
                  >
                    <Clock className="mr-2 h-4 w-4" />
                    Saya lupa melakukan presensi keluar — masukkan waktu sebenarnya
                  </Button>
                </div>
                {lateClockOutMode === "missed" && (
                  <div className="space-y-2 pt-2">
                    <Label htmlFor="missed-time">Waktu presensi keluar sebenarnya</Label>
                    <Input
                      id="missed-time"
                      type="time"
                      value={missedClockOutTime}
                      onChange={(e) => setMissedClockOutTime(e.target.value)}
                    />
                  </div>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setLateClockOutMode(null)}>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleLateClockOutConfirm}
              disabled={!lateClockOutMode || (lateClockOutMode === "missed" && !missedClockOutTime)}
            >
              Konfirmasi Presensi Keluar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
};

export default Attendance;
