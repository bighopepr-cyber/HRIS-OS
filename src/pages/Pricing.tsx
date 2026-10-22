import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Check,
  ArrowRight,
  Github,
  Cloud,
  Zap,
  HeartHandshake,
  ChevronDown
} from "lucide-react";
import Footer from "@/components/layout/Footer";
import PublicHeader from "@/components/layout/PublicHeader";
import PublicCtaSection from "@/components/layout/PublicCtaSection";
import PublicPageBadge from "@/components/layout/PublicPageBadge";
import { DEMO_URL } from "@/components/layout/publicSite";

const plans = [
  {
    name: "Sumber Terbuka",
    price: "Gratis",
    description: "Hosting sendiri di infrastruktur Anda sendiri. Semua fitur, berlisensi AGPL-3.0.",
    icon: <Github className="h-6 w-6" />,
    features: [
      "Karyawan tanpa batas",
      "Semua fitur inti sudah termasuk",
      "Akses penuh ke kode sumber",
      "Dukungan komunitas",
      "Deploy di mana saja",
      "Data Anda, server Anda"
    ],
    cta: "Lihat di GitHub",
    ctaLink: "https://github.com/redmonkin/core-hr-hub",
    variant: "outline" as const,
    highlight: false
  },
  {
    name: "Hosting Cloud",
    price: "₹3,500",
    period: "/bulan",
    description: "Kami menangani hosting, pembaruan, dan pencadangan. Anda fokus pada bisnis Anda.",
    icon: <Cloud className="h-6 w-6" />,
    features: [
      "Maksimal 50 karyawan",
      "Semua fitur inti sudah termasuk",
      "Pembaruan otomatis",
      "Pencadangan harian",
      "Dukungan melalui email",
      "SLA uptime 99,9%"
    ],
    cta: "Ajukan akses",
    ctaLink: DEMO_URL,
    variant: "default" as const,
    highlight: true
  },
  {
    name: "Enterprise",
    price: "Kustom",
    description: "Untuk organisasi yang lebih besar dengan kebutuhan dan persyaratan khusus.",
    icon: <Zap className="h-6 w-6" />,
    features: [
      "Karyawan tanpa batas",
      "Dukungan prioritas",
      "Integrasi khusus",
      "Infrastruktur khusus",
      "SSO dan keamanan tingkat lanjut",
      "Bantuan onboarding"
    ],
    cta: "Hubungi tim penjualan",
    ctaLink: DEMO_URL,
    variant: "outline" as const,
    highlight: false
  }
];

const faqs = [
  {
    question: "Apakah HRISINDO benar-benar gratis?",
    answer: "Ya. HRISINDO bersifat sumber terbuka di bawah lisensi AGPL-3.0, sehingga Anda dapat meng-hosting sendiri seluruh fiturnya di infrastruktur Anda sendiri tanpa biaya apa pun. Opsi hosting cloud merupakan layanan berbayar bagi tim yang memilih hosting terkelola."
  },
  {
    question: "Bisakah saya bermigrasi dari hosting sendiri ke cloud?",
    answer: "Bisa. Keduanya menjalankan aplikasi sumber terbuka dan skema basis data yang sama, sehingga kami dapat memindahkan data Anda ke kedua arah."
  },
  {
    question: "Bagaimana cara mendapatkan ruang kerja terkelola?",
    answer: "Pesan demo dan kami akan menyiapkan ruang kerja untuk perusahaan Anda. Akun hanya dapat dibuat melalui undangan, sehingga begitu siap Anda mengundang tim Anda dari dalam HRISINDO."
  },
  {
    question: "Apa arti lisensi AGPL-3.0 bagi perusahaan saya?",
    answer: "Anda dapat menggunakan, menjalankan, dan memodifikasi HRISINDO secara bebas untuk organisasi Anda sendiri. Jika Anda mengubahnya dan menawarkannya kepada orang lain melalui jaringan, Anda harus membagikan perubahan tersebut di bawah lisensi yang sama. Penggunaannya secara internal untuk staf Anda sendiri tidak mengharuskan penerbitan apa pun."
  },
  {
    question: "Di mana data kami disimpan?",
    answer: "Saat Anda hosting sendiri, semuanya berada di proyek Supabase Anda sendiri: basis data, penyimpanan berkas, dan wilayah Anda. Tidak ada yang dikirim kepada kami."
  },
  {
    question: "Siapa yang dapat melihat gaji dan data pribadi?",
    answer: "Hanya orang yang Anda beri akses. Modul penggajian, data karyawan, dan modul lainnya memiliki tingkatan lihat dan kelola, yang ditegakkan langsung oleh basis data."
  },
  {
    question: "Bisakah karyawan mendaftar sendiri?",
    answer: "Tidak. Akun hanya dapat dibuat melalui undangan. Tim SDM menambahkan setiap karyawan baru, yang kemudian menerima email berisi tautan untuk mengatur akunnya; mereka menjadi aktif begitu tautannya selesai digunakan."
  },
  {
    question: "Bisakah beberapa perusahaan berbagi satu HRISINDO?",
    answer: "Tidak. Setiap deployment HRISINDO merupakan ruang kerja satu perusahaan yang terikat pada domain email Anda, sehingga data Anda tidak pernah berada di samping organisasi lain. Hosting sendiri di lingkungan Anda, atau pesan demo dan kami akan menyiapkan ruang kerja khusus untuk Anda."
  },
  {
    question: "Apakah dapat digunakan di ponsel?",
    answer: "Bisa. HRISINDO adalah progressive web app (aplikasi web progresif), sehingga orang dapat mencatat absensi, mengajukan cuti, dan memeriksa slip gaji dari ponselnya serta menerima notifikasi push."
  },
  {
    question: "Apakah Anda menawarkan diskon untuk LSM?",
    answer: "Tentu! Organisasi nirlaba dan institutes pendidikan mendapat diskon 50% untuk semua paket berbayar. Hubungi kami untuk mengajukan."
  }
];

const Pricing = () => {
  return (
    <div className="min-h-screen bg-background">
      <PublicHeader />

      {/* Bagian Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5" />
        <div className="container mx-auto px-4 py-20 lg:py-28 relative">
          <div className="max-w-4xl mx-auto text-center space-y-6">
            <PublicPageBadge icon={<HeartHandshake />}>Sumber terbuka lebih dulu</PublicPageBadge>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-tight">
              Harga yang <span className="text-primary">Sederhana</span> dan Transparan
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Gratis selamanya untuk hosting sendiri. Hosting cloud terjangkau bagi yang memilih infrastruktur terkelola.
            </p>
          </div>
        </div>
      </section>

      {/* Kartu Paket Harga */}
      <section className="container mx-auto px-4 pb-20">
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {plans.map((plan, index) => (
            <Card 
              key={index}
              className={`relative hover:shadow-lg transition-all duration-300 ${
                plan.highlight 
                  ? 'border-primary shadow-lg ring-1 ring-primary' 
                  : 'hover:border-primary/30'
              }`}
            >
              {plan.highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs font-medium px-4 py-1.5 rounded-full">
                  Paling Populer
                </div>
              )}
              <CardContent className="p-8">
                <div className="h-14 w-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-5">
                  {plan.icon}
                </div>
                <h3 className="text-xl font-semibold mb-2">{plan.name}</h3>
                <div className="flex items-baseline gap-1 mb-3">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  {plan.period && (
                    <span className="text-muted-foreground text-lg">{plan.period}</span>
                  )}
                </div>
                <p className="text-muted-foreground mb-8">{plan.description}</p>
                <ul className="space-y-4 mb-8">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center gap-3">
                      <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Check className="h-3 w-3 text-primary" />
                      </div>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                {plan.ctaLink.startsWith('http') ? (
                  <Button asChild variant={plan.variant} className="w-full gap-2 h-12">
                    <a href={plan.ctaLink} target="_blank" rel="noopener noreferrer">
                      {plan.name === "Sumber Terbuka" && <Github className="h-4 w-4" />}
                      {plan.cta}
                      {plan.name !== "Sumber Terbuka" && <ArrowRight className="h-4 w-4" />}
                    </a>
                  </Button>
                ) : (
                  <Button asChild variant={plan.variant} className="w-full gap-2 h-12">
                    <Link to={plan.ctaLink}>
                      {plan.cta} <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Bagian FAQ */}
      <section className="bg-muted/30 py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <Badge variant="outline" className="mb-4">FAQ</Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Pertanyaan yang Sering Diajukan
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Harga, lisensi, data, dan cara kerja HRISINDO bagi tim Anda.
            </p>
          </div>
          <div className="mx-auto max-w-3xl divide-y divide-border rounded-2xl border border-border bg-card">
            {faqs.map((faq) => (
              <details key={faq.question} className="group px-5 [&_summary::-webkit-details-marker]:hidden">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 text-left text-base font-semibold text-foreground transition-colors hover:text-primary">
                  <h3>{faq.question}</h3>
                  <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 group-open:rotate-180" aria-hidden="true" />
                </summary>
                <p className="pb-5 text-base text-muted-foreground">{faq.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <PublicCtaSection
        title="Mulai gratis hari ini"
        description="Hosting sendiri secara gratis di bawah AGPL-3.0, atau pesan demo dan kami akan menjalankannya untuk Anda."
      />

      <Footer />
    </div>
  );
};

export default Pricing;
