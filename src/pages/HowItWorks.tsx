import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Download,
  Settings,
  Users,
  Rocket,
  CheckCircle,
  Database,
  Server,
  Cloud,
  Sparkles
} from "lucide-react";
import Footer from "@/components/layout/Footer";
import PublicHeader from "@/components/layout/PublicHeader";
import PublicCtaSection from "@/components/layout/PublicCtaSection";
import PublicPageBadge from "@/components/layout/PublicPageBadge";

const steps = [
  {
    number: "01",
    icon: <Download className="h-8 w-8" />,
    title: "Deploy atau Daftar",
    description: "Pilih untuk hosting sendiri di infrastruktur Anda atau gunakan solusi hosting kami. Apa pun pilihannya, Anda dapat langsung menjalankan dalam hitungan menit.",
    details: [
      "Deploy sekali klik ke Vercel, Railway, atau Docker",
      "Atau daftar untuk opsi cloud terkelola kami",
      "Kontrol penuh atas data dan infrastruktur Anda"
    ]
  },
  {
    number: "02",
    icon: <Settings className="h-8 w-8" />,
    title: "Konfigurasi Organisasi Anda",
    description: "Siapkan struktur perusahaan, departemen, kebijakan cuti, dan sesuaikan pengaturan agar sesuai dengan alur kerja Anda.",
    details: [
      "Tentukan departemen dan struktur pelaporan",
      "Konfigurasi jenis cuti dan kebijakannya",
      "Siapkan komponen penggajian dan potongan"
    ]
  },
  {
    number: "03",
    icon: <Users className="h-8 w-8" />,
    title: "Tambahkan Tim Anda",
    description: "Impor atau tambahkan karyawan, tetapkan peran dan atasan, serta lengkapi profil mereka dengan semua informasi yang diperlukan.",
    details: [
      "Impor massal karyawan melalui CSV",
      "Tetapkan peran: Admin, HR, Manager, atau Employee",
      "Siapkan profil karyawan dan dokumen"
    ]
  },
  {
    number: "04",
    icon: <Rocket className="h-8 w-8" />,
    title: "Mulai Mengelola",
    description: "Sekarang tim Anda dapat mencatat absensi, mengajukan cuti, memantau sasaran, dan banyak lagi. Tim SDM memiliki visibilitas serta kendali penuh.",
    details: [
      "Karyawan dapat melayani permintaan umum secara mandiri",
      "Atasan menyetujui dan mengawasi timnya",
      "Tim SDM memperoleh dasbor dan laporan yang komprehensif"
    ]
  }
];

const deployOptions = [
  {
    icon: <Server className="h-6 w-6" />,
    title: "Hosting Sendiri",
    description: "Deploy di server Anda sendiri dengan Docker atau langsung pada hosting Node.js mana pun."
  },
  {
    icon: <Cloud className="h-6 w-6" />,
    title: "Platform Cloud",
    description: "Deploy sekali klik ke Vercel, Railway, Render, atau platform cloud mana pun."
  },
  {
    icon: <Database className="h-6 w-6" />,
    title: "Backend Supabase",
    description: "Menggunakan Supabase untuk autentikasi, basis data, dan penyimpanan — tersedia paket gratis."
  }
];

const HowItWorks = () => {
  return (
    <div className="min-h-screen bg-background">
      <PublicHeader />

      {/* Bagian Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5" />
        <div className="container mx-auto px-4 py-20 lg:py-28 relative">
          <div className="max-w-4xl mx-auto text-center space-y-6">
            <PublicPageBadge icon={<Sparkles />}>Penyiapan sederhana</PublicPageBadge>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-tight">
              Mulai dalam{" "}
              <span className="text-primary">Empat Langkah Sederhana</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Tidak diperlukan penyiapan yang rumit. Aktifkan sistem SDM Anda dengan cepat melalui
              proses onboarding yang kami ringkas.
            </p>
          </div>
        </div>
      </section>

      {/* Garis Waktu Langkah */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <ol className="space-y-10 md:space-y-12">
              {steps.map((step, index) => (
                <li key={step.number} className="relative flex flex-col gap-4 md:flex-row md:gap-8">
                  {/* Penghubung garis waktu: berjalan di antara penanda langkah, tidak pernah menembus kartu */}
                  {index < steps.length - 1 && (
                    <div
                      aria-hidden="true"
                      className="absolute left-8 top-20 -bottom-10 hidden w-0.5 -translate-x-1/2 bg-gradient-to-b from-primary/50 to-primary/10 md:block"
                    />
                  )}

                  {/* Nomor langkah */}
                  <div className="relative z-10 flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-primary text-lg font-bold text-primary-foreground shadow-lg md:h-16 md:w-16 md:rounded-2xl md:text-2xl">
                    <span className="sr-only">Langkah </span>
                    {step.number}
                  </div>

                  {/* Kartu konten */}
                  <Card className="flex-1 transition-all duration-300 hover:border-primary/30 hover:shadow-lg">
                    <CardContent className="p-6 md:p-8">
                      <div className="mb-3 flex items-center gap-3">
                        <div
                          aria-hidden="true"
                          className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary [&_svg]:h-5 [&_svg]:w-5"
                        >
                          {step.icon}
                        </div>
                        <h3 className="text-xl font-bold md:text-3xl">{step.title}</h3>
                      </div>
                      <p className="mb-6 text-base leading-relaxed text-muted-foreground md:text-lg">
                        {step.description}
                      </p>
                      <ul className="space-y-3">
                        {step.details.map((detail) => (
                          <li key={detail} className="flex items-start gap-3">
                            <div className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary/10">
                              <CheckCircle className="h-4 w-4 text-primary" aria-hidden="true" />
                            </div>
                            <span className="text-foreground">{detail}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* Pilihan Deployment */}
      <section className="bg-muted/30 py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <Badge variant="outline" className="mb-4">Deployment</Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Pilihan Deployment yang Fleksibel</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Tentukan cara Anda menjalankan HRISINDO. Data Anda, aturan Anda, infrastruktur Anda.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {deployOptions.map((option, index) => (
              <Card 
                key={index}
                className="text-center hover:shadow-lg transition-all duration-300 hover:border-primary/30"
              >
                <CardContent className="p-8">
                  <div className="h-14 w-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-5">
                    {option.icon}
                  </div>
                  <h3 className="font-semibold text-lg mb-3">{option.title}</h3>
                  <p className="text-muted-foreground">{option.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <PublicCtaSection
        title="Siap menyederhanakan SDM Anda?"
        description="Hosting sendiri secara gratis di bawah AGPL-3.0, atau pesan demo dan kami akan menyiapkannya untuk Anda."
      />

      <Footer />
    </div>
  );
};

export default HowItWorks;
