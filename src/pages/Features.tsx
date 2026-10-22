import type { ComponentType, ReactNode } from "react";
import {
  BarChart3,
  Bell,
  CalendarDays,
  Clock,
  CreditCard,
  Package,
  Receipt,
  ShieldCheck,
  Sparkles,
  Target,
  UserPlus,
  Users,
} from "lucide-react";
import Footer from "@/components/layout/Footer";
import PublicHeader from "@/components/layout/PublicHeader";
import PublicCtaSection from "@/components/layout/PublicCtaSection";
import { Backdrop } from "@/components/landing/Backdrop";
import { Reveal } from "@/components/landing/Reveal";
import {
  AssetsMock,
  AttendanceMock,
  LeaveMock,
  NotificationsMock,
  OnboardingMock,
  PayrollMock,
  PeopleMock,
  PerformanceMock,
  PermissionsMock,
  ReimbursementMock,
  ReportsMock,
} from "@/components/landing/FeatureMocks";

interface Feature {
  id: string;
  icon: ComponentType<{ className?: string }>;
  label: string;
  title: string;
  description: string;
  points: string[];
  mock: ReactNode;
}

const features: Feature[] = [
  {
    id: "people",
    icon: Users,
    label: "Karyawan",
    title: "Semua orang dalam satu tempat",
    description: "Satu catatan per orang dengan detail pekerjaan, atasan, dokumen, cuti, aset, dan slip gaji, yang tersusun berdasarkan departemen.",
    points: [
      "Profil berisi detail pekerjaan, kontak, dan data pribadi",
      "Departemen, atasan, dan struktur pelaporan",
      "Dokumen tersimpan aman untuk setiap karyawan",
      "Direktori rekan kerja yang hanya menampilkan kolom yang aman",
    ],
    mock: <PeopleMock />,
  },
  {
    id: "onboarding",
    icon: UserPlus,
    label: "Onboarding",
    title: "Tambahkan karyawan baru, dan mereka langsung diundang",
    description: "Tambahkan seseorang sekali saja dan HRISINDO mengirim email berisi tautan untuk mengatur akunnya. Anda melihat siapa yang belum bergabung, dan mereka aktif begitu akunnya selesai dibuat.",
    points: [
      "Satu formulir untuk detail pekerjaan, jadwal, gaji, dan dokumen",
      "Undangan dikirim langsung, lengkap dengan kirim ulang dan batalkan",
      "Status Menunggu menunjukkan siapa yang belum mengatur akunnya",
      "Berstatus Aktif beserta saldo cuti begitu memilih kata sandi",
    ],
    mock: <OnboardingMock />,
  },
  {
    id: "attendance",
    icon: Clock,
    label: "Absensi",
    title: "Absensi yang berjalan sendiri",
    description: "Karyawan mencatat masuk dan keluar dari perangkat mana pun, beserta lokasi dan jeda kerja, serta mendapat pengingat sebelum hari kerja dimulai dan berakhir.",
    points: [
      "Catat masuk dan keluar beserta lokasi",
      "Jeda kerja dilacak dan dipotong dari jam kerja",
      "Jadwal kerja per orang, dengan mode kantor atau kerja jarak jauh",
      "Pengingat untuk mencatat masuk dan keluar",
    ],
    mock: <AttendanceMock />,
  },
  {
    id: "leave",
    icon: CalendarDays,
    label: "Cuti",
    title: "Cuti tanpa banyak tanya",
    description: "Karyawan melihat saldo cutinya dan mengajukan dalam hitungan detik. Atasan menerima notifikasi dan menyetujui cukup sekali sentuh, dan semua orang melihat siapa yang sedang cuti.",
    points: [
      "Jenis cuti, jatah, dan kelayakan sesuai kebijakan Anda",
      "Persetujuan atasan disertai catatan, dengan peringatan email dan push",
      "Kalender tim dan daftar hari libur perusahaan",
      "Setiap permintaan selalu berstatus Menunggu; tidak ada yang menyetujui permintaannya sendiri",
    ],
    mock: <LeaveMock />,
  },
  {
    id: "payroll",
    icon: CreditCard,
    label: "Penggajian",
    title: "Penggajian dalam rupee, selesai bulanan",
    description: "Struktur gaji dengan tunjangan dan potongan, proses penggajian bulanan, serta slip gaji berlogo yang dapat diunduh tim Anda.",
    points: [
      "Struktur gaji dengan HRA, tunjangan, PF, dan pajak",
      "Proses penggajian bulanan, dengan prorate untuk karyawan yang bergabung di tengah bulan",
      "Slip gaji PDF dengan logo dan warna perusahaan Anda",
      "Data bank disimpan pada tabel tersendiri yang dikunci",
    ],
    mock: <PayrollMock />,
  },
  {
    id: "performance",
    icon: Target,
    label: "Kinerja",
    title: "Penilaian yang benar-benar diselesaikan",
    description: "Tetapkan KPI, pantau kemajuan selama siklus, dan jalankan penilaian dengan nilai dari diri sendiri serta atasan yang kemudian dikonfirmasi karyawan.",
    points: [
      "KPI dengan prioritas, tenggat, dan kemajuan",
      "Siklus penilaian dengan nilai dari diri sendiri dan atasan",
      "Karyawan mengonfirmasi penilaian yang telah diselesaikan",
      "Analitik tim dan peringkat untuk para atasan",
    ],
    mock: <PerformanceMock />,
  },
  {
    id: "reimbursements",
    icon: Receipt,
    label: "Reimbursement",
    title: "Klaim biaya dengan nota",
    description: "Karyawan mengajukan klaim beserta foto nota. Atasan menyetujuinya dan bagian keuangan menandainya telah dibayar, dengan setiap langkah tercatat.",
    points: [
      "Klaim dikelompokkan per kategori, dengan unggah nota",
      "Persetujuan atau penolakan atasan disertai catatan",
      "Tandai klaim sebagai telah dibayar setelah diselesaikan",
      "Notifikasi pada setiap langkah",
    ],
    mock: <ReimbursementMock />,
  },
  {
    id: "assets",
    icon: Package,
    label: "Aset",
    title: "Tahukan siapa memegang apa",
    description: "Lacak laptop, ponsel, dan peralatan lain, siapa yang ditugaskan kepadanya, serta riwayat lengkapnya, sehingga tidak ada barang yang keluar tanpa jejak.",
    points: [
      "Aset per tipe dengan nomor seri, pemasok, dan tanggal pembelian",
      "Penugasan dan pengembalian dengan riwayat lengkap",
      "Status tersedia, ditugaskan, dalam perbaikan, dan tidak aktif",
      "Karyawan melihat aset yang dipegangnya",
    ],
    mock: <AssetsMock />,
  },
  {
    id: "reports",
    icon: BarChart3,
    label: "Laporan",
    title: "Laporan yang bisa diserahkan ke bagian keuangan",
    description: "Laporan jumlah karyawan, absensi, saldo cuti, penggajian, dan aset, yang siap diekspor kapan pun ada yang meminta.",
    points: [
      "Jumlah karyawan dan pertumbuhan per departemen",
      "Laporan absensi dan saldo cuti",
      "Ringkasan penggajian bulanan",
      "Ekspor ke CSV dan PDF",
    ],
    mock: <ReportsMock />,
  },
  {
    id: "permissions",
    icon: ShieldCheck,
    label: "Izin",
    title: "Akses per modul",
    description: "Peran menetapkan pengaturan bawaan untuk setiap modul. Berikan akses lebih kepada satu orang saat dibutuhkan, dan database yang menegakkannya, bukan hanya tampilan layarnya.",
    points: [
      "Akses lihat atau kelola per modul, per peran",
      "Akses tambahan untuk satu orang, misalnya hanya Assets",
      "Pengguna yang diblokir terkunci di seluruh sistem",
      "Keamanan baris (row-level security) pada setiap tabel",
    ],
    mock: <PermissionsMock />,
  },
  {
    id: "notifications",
    icon: Bell,
    label: "Notifikasi",
    title: "Peringatan yang tepat, di perangkat apa pun",
    description: "Notifikasi dalam aplikasi, email, dan push untuk persetujuan, pengingat, dan slip gaji. HRISINDO dapat diinstal di ponsel seperti aplikasi biasa.",
    points: [
      "Notifikasi push di ponsel dan komputer",
      "Email untuk persetujuan, pengingat, dan pengumuman",
      "Setiap orang memilih apa yang ingin diterimanya",
      "Dapat diinstal di layar utama Android dan iOS",
    ],
    mock: <NotificationsMock />,
  },
];

const Features = () => {
  return (
    <div className="min-h-screen overflow-x-clip bg-background">
      <PublicHeader />

      <main>
        {/* Bagian Hero */}
        <section className="relative">
          <Backdrop />
          <div className="container relative mx-auto px-4 pb-16 pt-16 text-center md:pt-24">
            <p className="mx-auto mb-6 inline-flex animate-fade-up items-center gap-2 rounded-full border border-primary/20 bg-background/70 px-3 py-1 text-sm font-medium text-foreground shadow-sm backdrop-blur">
              <Sparkles className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
              Setiap modul, sumber terbuka
            </p>
            <h1
              className="mx-auto mb-6 max-w-4xl animate-fade-up text-4xl font-bold tracking-tight text-foreground sm:text-5xl md:text-6xl"
              style={{ animationDelay: "80ms" }}
            >
              Semua yang dibutuhkan tim SDM Anda,{" "}
              <span className="text-shimmer animate-shimmer motion-reduce:animate-none">dalam satu tempat.</span>
            </h1>
            <p
              className="mx-auto mb-10 max-w-2xl animate-fade-up text-lg text-muted-foreground md:text-xl"
              style={{ animationDelay: "160ms" }}
            >
              Mulai dari undangan pertama hingga slip gaji bulanan. Inilah tampilan setiap bagian dari HRISINDO.
            </p>
            <nav aria-label="Fitur" className="mx-auto flex max-w-4xl animate-fade-up flex-wrap justify-center gap-2" style={{ animationDelay: "240ms" }}>
              {features.map((feature) => (
                <a
                  key={feature.id}
                  href={`#${feature.id}`}
                  className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card/80 px-3 py-1.5 text-sm text-foreground backdrop-blur transition-colors hover:border-primary/40 hover:text-primary"
                >
                  <feature.icon className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
                  {feature.label}
                </a>
              ))}
            </nav>
          </div>
        </section>

        {/* Fitur */}
        {features.map((feature, index) => {
          const flipped = index % 2 === 1;
          return (
            <section
              key={feature.id}
              id={feature.id}
              className={`scroll-mt-20 py-16 md:py-24 ${flipped ? "border-y border-border bg-card/60" : ""}`}
            >
              <div className="container mx-auto grid items-center gap-10 px-4 lg:grid-cols-2 lg:gap-16">
                <Reveal className={flipped ? "lg:order-2" : ""}>
                  <p className="mb-3 inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-primary">
                    <feature.icon className="h-4 w-4" aria-hidden="true" />
                    {feature.label}
                  </p>
                  <h2 className="mb-4 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">{feature.title}</h2>
                  <p className="mb-6 text-lg text-muted-foreground">{feature.description}</p>
                  <ul className="space-y-3">
                    {feature.points.map((point) => (
                      <li key={point} className="flex items-start gap-3">
                        <span className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10" aria-hidden="true">
                          <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                        </span>
                        <span className="text-foreground">{point}</span>
                      </li>
                    ))}
                  </ul>
                </Reveal>
                <Reveal delay={120} className={flipped ? "lg:order-1" : ""}>
                  {feature.mock}
                </Reveal>
              </div>
            </section>
          );
        })}
      </main>

      <PublicCtaSection />

      <Footer />
    </div>
  );
};

export default Features;
