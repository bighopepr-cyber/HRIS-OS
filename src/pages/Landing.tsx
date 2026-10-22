import type { ReactNode } from "react";
import { Link, Navigate } from "react-router-dom";
import {
  ArrowRight,
  Bell,
  CalendarDays,
  CheckCircle,
  Clock,
  Cloud,
  Code2,
  CreditCard,
  Database,
  Github,
  KeyRound,
  Layers,
  Lock,
  MailCheck,
  Package,
  Receipt,
  Scale,
  Server,
  ShieldCheck,
  Target,
  Unlock,
  UserPlus,
  Users,
  BarChart3,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import Footer from "@/components/layout/Footer";
import PublicHeader from "@/components/layout/PublicHeader";
import { DEMO_URL } from "@/components/layout/publicSite";
import { Backdrop } from "@/components/landing/Backdrop";
import { HeroScene } from "@/components/landing/HeroScene";
import { OpenSourceOrbit } from "@/components/landing/OpenSourceOrbit";
import { Reveal } from "@/components/landing/Reveal";
import { LICENSE_URL, REPO_URL, SECURITY_POLICY_URL, SELF_HOST_GUIDE_URL } from "@/lib/site";
import peoploLogoLight from "@/assets/hr-hub-logo-light.svg";

const pillars = [
  { icon: Code2, title: "Sumber terbuka", text: "Setiap baris kode bersifat publik di bawah AGPL-3.0" },
  { icon: ShieldCheck, title: "Aman secara bawaan", text: "Aturan akses ditegakkan di level basis data" },
  { icon: Database, title: "Data Anda", text: "Jalankan pada proyek Supabase milik Anda sendiri" },
  { icon: Unlock, title: "Tanpa ketergantungan vendor", text: "Fork, hosting, dan ubah sesuka Anda" },
];

const features = [
  {
    icon: Users,
    title: "Karyawan & Departemen",
    description: "Satu catatan per orang: detail pekerjaan, atasan, dokumen, aset, dan riwayat, yang tersusun berdasarkan departemen.",
  },
  {
    icon: UserPlus,
    title: "Onboarding khusus undangan",
    description: "Tambahkan karyawan baru sekali saja dan mereka menerima email untuk mengatur akun. Mereka aktif beserta saldo cutinya begitu akun siap digunakan.",
  },
  {
    icon: Clock,
    title: "Absensi",
    description: "Catat masuk dan keluar beserta lokasi dan jeda kerja, jadwal kerja, serta pengingat sebelum dan setelah shift dimulai.",
  },
  {
    icon: CalendarDays,
    title: "Cuti & Hari Libur",
    description: "Jenis cuti dan saldo cuti, persetujuan atasan, kalender tim, dan daftar hari libur perusahaan Anda.",
  },
  {
    icon: CreditCard,
    title: "Penggajian & Slip Gaji",
    description: "Struktur gaji, penggajian bulanan, dan slip gaji berlogo dalam ₹, lengkap dengan PF dan potongan lainnya.",
  },
  {
    icon: Target,
    title: "Kinerja",
    description: "KPI, siklus penilaian dengan penilaian diri dan penilaian atasan, serta analitik tim untuk para atasan.",
  },
  {
    icon: Receipt,
    title: "Reimbursement",
    description: "Karyawan mengajukan klaim beserta nota; atasan menyetujui dan bagian keuangan menandainya sebagai telah dibayar.",
  },
  {
    icon: Package,
    title: "Aset",
    description: "Lacak laptop, ponsel, dan peralatan lainnya, siapa yang memegangnya, serta riwayat penugasan lengkapnya.",
  },
  {
    icon: BarChart3,
    title: "Laporan",
    description: "Laporan jumlah karyawan, absensi, saldo cuti, penggajian, dan aset, yang dapat diekspor ke CSV dan PDF.",
  },
];

const howItWorks = [
  { step: 1, title: "Siapkan perusahaan Anda", description: "Tambahkan departemen, jenis cuti, lokasi kantor, dan merek Anda." },
  { step: 2, title: "Tambahkan tim Anda", description: "Menambahkan seseorang berarti mengundang mereka. Hanya orang yang diundang yang dapat membuat akun." },
  { step: 3, title: "Jalankan rutinitas harian", description: "Absensi, cuti, dan reimbursement mengalir otomatis ke pihak yang berwenang." },
  { step: 4, title: "Bayar dan kembangkan", description: "Jalankan penggajian, bagikan slip gaji, dan tinjau kinerja setiap siklus." },
];

const securityPoints = [
  {
    icon: ShieldCheck,
    title: "Izin di level basis data",
    text: "Keamanan baris PostgreSQL menentukan siapa dapat melihat apa, bukan sekadar tampilan layar. Bug pada antarmuka tidak dapat membocorkan data gaji.",
  },
  {
    icon: KeyRound,
    title: "Akses per modul",
    text: "Berikan hanya akses Assets, atau Payroll dalam mode hanya-lihat. Peran menetapkan pengaturan bawaan; akses tambahan berlaku per orang.",
  },
  {
    icon: MailCheck,
    title: "Akun khusus undangan",
    text: "Tidak ada yang dapat mendaftar tanpa undangan. Domain email dapat dibatasi hanya untuk perusahaan Anda.",
  },
  {
    icon: Lock,
    title: "Perlindungan pada perubahan sensitif",
    text: "Karyawan tidak dapat menyetujui cuti sendiri atau mengubah absensi yang sudah ditutup. Data bank disimpan pada tabel tersendiri yang dikunci.",
  },
];

const selfHostSteps = [
  { prompt: true, text: `git clone ${REPO_URL}.git peoplo` },
  { prompt: true, text: "cd peoplo && npm install" },
  { prompt: true, text: "supabase link --project-ref <your-project>" },
  { prompt: true, text: "supabase db push && supabase functions deploy" },
  { prompt: true, text: "npm run build" },
  { prompt: false, text: "✓ Peoplo milik Anda sendiri, pada infrastruktur yang Anda kendalikan" },
];

const openSourcePoints = [
  { icon: Code2, text: "Baca setiap baris kode sebelum data karyawan Anda dimasukkan." },
  { icon: Layers, text: "Fork dan sesuaikan dengan kebijakan serta alur kerja Anda." },
  { icon: Scale, text: "AGPL-3.0 menjaga tetap terbukanya perbaikan, termasuk pada versi hosting." },
  { icon: Bell, text: "Laporkan masalah dan usulkan fitur secara terbuka di GitHub." },
];

function ExternalLink({ href, className, children }: { href: string; className?: string; children: ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
      {children}
    </a>
  );
}

function SectionHeading({ eyebrow, title, text }: { eyebrow: string; title: string; text: string }) {
  return (
    <Reveal className="mx-auto mb-14 max-w-3xl text-center">
      <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-primary">{eyebrow}</p>
      <h2 className="mb-4 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">{title}</h2>
      <p className="text-lg text-muted-foreground">{text}</p>
    </Reveal>
  );
}

const Landing = () => {
  const { user, isLoading } = useAuth();

  if (!isLoading && user) {
    return <Navigate to="/dashboard" replace />;
  }

    const deploymentOptions = [
    {
      icon: Server,
      name: "Hosting sendiri",
      description: "Jalankan salinan Anda sendiri pada proyek Supabase milik Anda.",
      features: [
        "Gratis dan sumber terbuka (AGPL-3.0)",
        "Basis data, data, dan wilayah Anda sendiri",
        "Deploy frontend di mana saja situs statis berjalan",
        "Ubah sesuai dengan kebijakan Anda",
      ],
      cta: "Baca panduan self-hosting",
      href: SELF_HOST_GUIDE_URL,
      highlight: false,
    },
    {
      icon: Cloud,
      name: "Biarkan kami menjalankannya",
      description: "Ruang kerja khusus terkelola untuk perusahaan Anda.",
      features: [
        "Tidak ada yang perlu dipasang atau dipelihara",
        "Pembaruan dan pencadangan kami tangani untuk Anda",
        "Aplikasi sumber terbuka yang sama, tanpa ketergantungan vendor",
        "Bantuan dalam menyiapkan tim Anda",
      ],
      cta: "Pesan Demo",
      href: DEMO_URL,
      highlight: true,
    },
  ];

  return (
    <div className="min-h-screen overflow-x-clip bg-background">
      <PublicHeader />

      <main>
        {/* Bagian Hero */}
        <section className="relative">
          <Backdrop />
          <div className="container relative mx-auto grid items-center gap-16 px-4 pb-24 pt-14 md:pt-20 lg:grid-cols-[1.05fr_1fr] lg:gap-10 lg:pb-32 lg:pt-24">
            <div className="text-center lg:text-left">
              <ExternalLink
                href={REPO_URL}
                className="mb-6 inline-flex animate-fade-up items-center gap-2 rounded-full border border-primary/20 bg-background/70 px-3 py-1 text-sm font-medium text-foreground shadow-sm backdrop-blur transition-colors hover:border-primary/40"
              >
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-60 motion-reduce:hidden" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
                </span>
                Gratis &amp; sumber terbuka · AGPL-3.0
                <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
              </ExternalLink>
              <h1
                className="mb-6 animate-fade-up text-4xl font-bold tracking-tight text-foreground sm:text-5xl md:text-6xl"
                style={{ animationDelay: "80ms" }}
              >
                SDM yang berjalan sendiri,
                <br />
                <span className="text-shimmer animate-shimmer motion-reduce:animate-none">secara terbuka.</span>
              </h1>
              <p
                className="mx-auto mb-8 max-w-xl animate-fade-up text-lg text-muted-foreground md:text-xl lg:mx-0"
                style={{ animationDelay: "160ms" }}
              >
                Peoplo adalah perangkat lunak SDM gratis dan sumber terbuka untuk tim yang sedang bertumbuh:
                karyawan, absensi, cuti, penggajian, dan kinerja dalam satu tempat aman yang dapat Anda
                hosting sendiri.
              </p>
              <div
                className="flex animate-fade-up flex-col items-center justify-center gap-3 sm:flex-row lg:justify-start"
                style={{ animationDelay: "240ms" }}
              >
                <Button size="lg" className="group w-full gap-2 shadow-lg shadow-primary/25 sm:w-auto" asChild>
                  <ExternalLink href={DEMO_URL}>
                    Pesan Demo
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                  </ExternalLink>
                </Button>
                <Button size="lg" variant="outline" className="w-full gap-2 bg-background/70 backdrop-blur sm:w-auto" asChild>
                  <ExternalLink href={REPO_URL}>
                    <Github className="h-4 w-4" aria-hidden="true" />
                    Lihat di GitHub
                  </ExternalLink>
                </Button>
              </div>
              <ul
                className="mt-8 flex animate-fade-up flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm text-muted-foreground lg:justify-start"
                style={{ animationDelay: "320ms" }}
              >
                {["Hosting sendiri secara gratis", "Dibuat untuk penggajian India", "Tanpa iklan atau pelacak"].map((item) => (
                  <li key={item} className="flex items-center gap-1.5">
                    <CheckCircle className="h-4 w-4 text-primary" aria-hidden="true" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="animate-fade-up px-2 pt-4 sm:px-8 lg:px-0 lg:pt-0" style={{ animationDelay: "200ms" }}>
              <HeroScene />
            </div>
          </div>
        </section>

        {/* Pilar Kepercayaan */}
        <section className="border-y border-border bg-card/70">
          <div className="container mx-auto grid grid-cols-2 gap-px px-4 md:grid-cols-4">
            {pillars.map((pillar, i) => (
              <Reveal key={pillar.title} delay={i * 80} className="flex flex-col items-start gap-3 px-2 py-6 sm:flex-row sm:px-4 md:py-8">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <pillar.icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <div>
                  <p className="font-semibold text-foreground">{pillar.title}</p>
                  <p className="text-sm text-muted-foreground">{pillar.text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* Fitur */}
        <section id="features" className="container mx-auto scroll-mt-20 px-4 py-24 md:py-32">
          <SectionHeading
            eyebrow="Fitur"
            title="Semua yang dibutuhkan tim SDM Anda"
            text="Mulai dari undangan pertama hingga slip gaji bulanan, tanpa perlu menyatukan lima alat berbeda."
          />
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, i) => (
              <Reveal key={feature.title} delay={(i % 3) * 90}>
                <div className="group relative h-full overflow-hidden rounded-2xl border border-border bg-card p-6 transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-xl hover:shadow-primary/10 motion-reduce:hover:translate-y-0">
                  <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-primary/10 opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-100" />
                  <div className="relative mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary/15 to-primary/5 text-primary ring-1 ring-primary/15 transition-colors duration-300 group-hover:from-primary group-hover:to-primary group-hover:text-primary-foreground">
                    <feature.icon className="h-6 w-6" aria-hidden="true" />
                  </div>
                  <h3 className="relative mb-2 text-lg font-semibold text-foreground">{feature.title}</h3>
                  <p className="relative text-muted-foreground">{feature.description}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* Cara Kerjanya */}
        <section id="how-it-works" className="scroll-mt-20 border-y border-border bg-card py-24 md:py-32">
          <div className="container mx-auto px-4">
            <SectionHeading
              eyebrow="Cara Kerjanya"
              title="Siap digunakan dalam satu sore hari"
              text="Atur sekali saja, lalu seluruh aktivitas harian SDM mengalir otomatis ke orang yang tepat."
            />
            <div className="relative">
              <div
                aria-hidden="true"
                className="absolute left-[12.5%] right-[12.5%] top-8 hidden h-px bg-gradient-to-r from-primary/10 via-primary/50 to-primary/10 lg:block"
              />
              <ol className="relative grid gap-10 md:grid-cols-2 lg:grid-cols-4 lg:gap-6">
                {howItWorks.map((step, i) => (
                  <Reveal as="li" key={step.step} delay={i * 120} className="relative text-center">
                    <div className="relative mx-auto mb-5 flex h-16 w-16 items-center justify-center">
                      <span className="absolute inset-0 rounded-2xl bg-primary/20 blur-md" />
                      <span className="relative flex h-16 w-16 rotate-3 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-sky-600 text-2xl font-bold text-primary-foreground shadow-lg shadow-primary/30 transition-transform duration-300 hover:rotate-0">
                        {step.step}
                      </span>
                    </div>
                    <h3 className="mb-2 text-lg font-semibold text-foreground">{step.title}</h3>
                    <p className="mx-auto max-w-xs text-muted-foreground">{step.description}</p>
                  </Reveal>
                ))}
              </ol>
            </div>
          </div>
        </section>

        {/* Sumber Terbuka */}
        <section id="open-source" className="container mx-auto grid scroll-mt-20 items-center gap-14 px-4 py-24 md:py-32 lg:grid-cols-2">
          <div>
            <Reveal>
              <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-primary">Sumber terbuka</p>
              <h2 className="mb-4 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                Sistem SDM Anda tidak seharusnya menjadi kotak hitam.
              </h2>
              <p className="mb-8 text-lg text-muted-foreground">
                Data karyawan adalah data paling sensitif yang dimiliki sebuah perusahaan. Dengan Peoplo Anda
                dapat melihat dengan jelas bagaimana data itu disimpan dan siapa yang dapat mengaksesnya,
                karena semuanya bersifat publik dan berlisensi AGPL-3.0.
              </p>
            </Reveal>
            <ul className="mb-8 space-y-4">
              {openSourcePoints.map((point, i) => (
                <Reveal as="li" key={point.text} delay={i * 80} className="flex items-start gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <point.icon className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <span className="pt-1 text-foreground">{point.text}</span>
                </Reveal>
              ))}
            </ul>
            <Reveal className="flex flex-col gap-3 sm:flex-row">
              <Button className="gap-2" asChild>
                <ExternalLink href={REPO_URL}>
                  <Github className="h-4 w-4" aria-hidden="true" />
                  Beri bintang di GitHub
                </ExternalLink>
              </Button>
              <Button variant="outline" className="gap-2" asChild>
                <ExternalLink href={LICENSE_URL}>
                  <Scale className="h-4 w-4" aria-hidden="true" />
                  Baca lisensi
                </ExternalLink>
              </Button>
            </Reveal>
          </div>
          <Reveal delay={150} className="relative overflow-hidden rounded-3xl bg-[hsl(222_47%_11%)] p-6 sm:p-10">
            <Backdrop tone="light" className="opacity-60" />
            <div className="relative">
              <OpenSourceOrbit />
            </div>
          </Reveal>
        </section>

        {/* Keamanan & Self-Hosting */}
        <section id="security" className="relative scroll-mt-20 overflow-hidden bg-[hsl(222_47%_11%)] py-24 text-slate-100 md:py-32">
          <Backdrop tone="light" className="opacity-60" />
          <div className="container relative mx-auto grid items-center gap-14 px-4 lg:grid-cols-2">
            <div>
              <Reveal>
                <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-sky-400">Kepercayaan</p>
                <h2 className="mb-4 text-3xl font-bold tracking-tight text-white sm:text-4xl">
                  Dibangun secara terbuka.
                  <br />
                  Aman secara bawaan.
                </h2>
                <p className="mb-10 text-lg text-slate-300">
                  Karyawan mempercayakan gaji, dokumen, dan data bank mereka kepada Anda. Peoplo dirancang
                  agar Anda pun dapat mempercayakannya — dan karena kodenya bersifat publik, Anda tidak perlu
                  sekadar menerima kata-kata kami.
                </p>
              </Reveal>
              <div className="grid gap-6 sm:grid-cols-2">
                {securityPoints.map((point, i) => (
                  <Reveal key={point.title} delay={i * 90} className="flex gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-sky-400/10 text-sky-400 ring-1 ring-sky-400/20">
                      <point.icon className="h-4 w-4" aria-hidden="true" />
                    </span>
                    <div>
                      <p className="mb-1 font-semibold text-white">{point.title}</p>
                      <p className="text-sm text-slate-400">{point.text}</p>
                    </div>
                  </Reveal>
                ))}
              </div>
              <Reveal className="mt-10 flex flex-wrap gap-x-6 gap-y-2 text-sm">
                <ExternalLink href={SECURITY_POLICY_URL} className="inline-flex items-center gap-1.5 text-sky-400 underline-offset-4 hover:underline">
                  <ShieldCheck className="h-4 w-4" aria-hidden="true" /> Kebijakan keamanan
                </ExternalLink>
                <ExternalLink href={LICENSE_URL} className="inline-flex items-center gap-1.5 text-sky-400 underline-offset-4 hover:underline">
                  <Scale className="h-4 w-4" aria-hidden="true" /> Lisensi AGPL-3.0
                </ExternalLink>
              </Reveal>
            </div>

            {/* Terminal Self-Hosting */}
            <Reveal delay={150} className="[perspective:1400px]">
              <div className="rounded-2xl border border-white/10 bg-slate-950/80 shadow-2xl shadow-sky-900/40 backdrop-blur transition-transform duration-500 lg:[transform:rotateY(-8deg)_rotateX(4deg)] lg:hover:[transform:rotateY(0deg)_rotateX(0deg)] motion-reduce:transform-none">
                <div className="flex items-center gap-1.5 border-b border-white/10 px-4 py-3">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
                  <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
                  <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
                  <span className="ml-3 font-mono text-xs text-slate-400">self-host.sh</span>
                </div>
                <div className="overflow-x-auto p-5 font-mono text-[13px] leading-7" tabIndex={0} aria-label="Perintah self-hosting">
                  {selfHostSteps.map((line, i) => (
                    <Reveal key={line.text} delay={300 + i * 180} className="whitespace-pre">
                      {line.prompt ? (
                        <>
                          <span className="select-none text-sky-400">$ </span>
                          <span className="text-slate-200">{line.text}</span>
                        </>
                      ) : (
                        <span className="text-emerald-400">{line.text}</span>
                      )}
                    </Reveal>
                  ))}
                  <span className="motion-decor mt-1 inline-block h-4 w-2 animate-pulse bg-sky-400/80 align-middle" aria-hidden="true" />
                </div>
              </div>
              <p className="mt-4 text-center text-sm text-slate-400 lg:text-left">
                Panduan lengkap, termasuk secret, email, dan job terjadwal, tersedia dalam{" "}
                <ExternalLink href={SELF_HOST_GUIDE_URL} className="text-sky-400 underline-offset-4 hover:underline">
                  panduan penyiapan
                </ExternalLink>
                .
              </p>
            </Reveal>
          </div>
        </section>

        {/* Pilihan Deployment */}
        <section id="get-started" className="container mx-auto scroll-mt-20 px-4 py-24 md:py-32">
          <SectionHeading
            eyebrow="Mulai"
            title="Dua cara menjalankan Peoplo"
            text="Aplikasi sumber terbuka yang sama, apa pun pilihan Anda. Hosting sendiri, atau biar kami yang menjalankannya untuk Anda."
          />
          <div className="mx-auto grid max-w-4xl gap-6 md:grid-cols-2">
            {deploymentOptions.map((option, i) => (
              <Reveal key={option.name} delay={i * 120} className="h-full">
                <div
                  className={`relative flex h-full flex-col rounded-2xl border bg-card p-7 transition-shadow duration-300 hover:shadow-xl ${
                    option.highlight ? "border-primary/40 shadow-lg shadow-primary/10" : "border-border"
                  }`}
                >
                  {option.highlight && (
                    <span className="absolute -top-3 left-7 rounded-full bg-primary px-3 py-0.5 text-xs font-semibold text-primary-foreground shadow">
                      Dikelola untuk Anda
                    </span>
                  )}
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <option.icon className="h-6 w-6" aria-hidden="true" />
                  </div>
                  <h3 className="mb-1 text-xl font-semibold text-foreground">{option.name}</h3>
                  <p className="mb-6 text-muted-foreground">{option.description}</p>
                  <ul className="mb-8 space-y-3">
                    {option.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-2 text-sm">
                        <CheckCircle className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                        <span className="text-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button className="mt-auto w-full" variant={option.highlight ? "default" : "outline"} asChild>
                    <ExternalLink href={option.href}>{option.cta}</ExternalLink>
                  </Button>
                </div>
              </Reveal>
            ))}
          </div>
          <p className="mt-8 text-center text-sm text-muted-foreground">
            Ingin melihat detailnya?{" "}
            <Link to="/pricing" className="font-medium text-primary underline-offset-4 hover:underline">
              Bandingkan paket
            </Link>
          </p>
        </section>

        {/* Ajakan Bertindak (CTA) */}
        <section className="px-4 py-24 md:py-32">
          <Reveal className="container relative mx-auto overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-sky-700 to-sky-900 px-6 py-16 text-center text-primary-foreground shadow-2xl shadow-primary/30 md:py-20">
            <Backdrop tone="light" className="opacity-50" />
            <div className="relative">
              <div className="motion-decor mx-auto mb-6 flex h-16 w-16 animate-float items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/25 backdrop-blur">
                <img src={peoploLogoLight} alt="" className="h-10 w-10" />
              </div>
              <h2 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl">Siap untuk SDM yang lebih tenang?</h2>
              <p className="mx-auto mb-8 max-w-2xl text-lg text-white/90">
                Hosting sendiri mulai hari ini, atau pesan demo dan kami akan menyiapkannya untuk Anda. Peoplo
                bersifat sumber terbuka, sehingga Anda dapat membaca kodenya, mengusulkan fitur, dan ikut
                berkontribusi.
              </p>
              <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Button size="lg" variant="secondary" className="group w-full gap-2 sm:w-auto" asChild>
                  <ExternalLink href={DEMO_URL}>
                    Pesan Demo
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                  </ExternalLink>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full gap-2 border-white/50 bg-transparent text-white hover:bg-white/10 hover:text-white sm:w-auto"
                  asChild
                >
                  <ExternalLink href={REPO_URL}>
                    <Github className="h-4 w-4" aria-hidden="true" />
                    Beri bintang di GitHub
                  </ExternalLink>
                </Button>
              </div>
            </div>
          </Reveal>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Landing;
