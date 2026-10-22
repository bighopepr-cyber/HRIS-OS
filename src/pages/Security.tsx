import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Shield, Lock, Server, Eye, CheckCircle, AlertTriangle, Key, RefreshCw } from "lucide-react";
import Footer from "@/components/layout/Footer";
import PublicHeader from "@/components/layout/PublicHeader";
import PublicPageBadge from "@/components/layout/PublicPageBadge";

const Security = () => {
  const securityFeatures = [
    {
      icon: Lock,
      title: "Enkripsi",
      description: "Semua data terenkripsi saat disimpan dan saat dikirim menggunakan enkripsi AES-256 serta protokol TLS 1.3 sesuai standar industri."
    },
    {
      icon: Server,
      title: "Infrastruktur Aman",
      description: "Infrastruktur kami berada di platform cloud kelas perusahaan dengan sertifikasi SOC 2 Type II dan SLA uptime 99,9%."
    },
    {
      icon: Key,
      title: "Kontrol Akses",
      description: "Kontrol akses berbasis peran, autentikasi multifaktor, dan single sign-on (SSO) untuk melindungi akun Anda."
    },
    {
      icon: Eye,
      title: "Pemantauan & Pencatatan Log",
      description: "Pemantauan keamanan 24/7 dengan log audit yang komprehensif dan sistem deteksi ancaman secara real-time."
    },
    {
      icon: RefreshCw,
      title: "Pencadangan Berkala",
      description: "Pencadangan harian otomatis dengan pemulihan point-in-time dan penyimpanan geo-redundan di beberapa wilayah."
    },
    {
      icon: AlertTriangle,
      title: "Respons Insiden",
      description: "Tim keamanan khusus dengan prosedur respons insiden serta protokol komunikasi yang telah ditetapkan."
    }
  ];

  const certifications = [
    "SOC 2 Type II Compliant",
    "GDPR Compliant",
    "ISO 27001 Standards",
    "CCPA Compliant",
    "HIPAA Ready",
    "PCI DSS Standards"
  ];

  const securityPractices = [
    {
      title: "Manajemen Kerentanan",
      items: [
        "Penilaian keamanan berkala dan pengujian penetrasi",
        "Pemindaian kerentanan otomatis pada seluruh sistem",
        "Program pengungkapan bertanggung jawab untuk peneliti keamanan",
        "Penambalan dan pembaruan seluruh komponen perangkat lunak secara tepat waktu"
      ]
    },
    {
      title: "Keamanan Karyawan",
      items: [
        "Pemeriksaan latar belakang bagi seluruh karyawan",
        "Pelatihan kesadaran keamanan secara berkala",
        "Kontrol akses ketat berdasarkan peran dan kebutuhan",
        "Praktik pengembangan yang aman dan peninjauan kode"
      ]
    },
    {
      title: "Perlindungan Data",
      items: [
        "Minimalisasi data dan pembatasan tujuan",
        "Penghapusan data secara aman atas permintaan",
        "Perjanjian pemrosesan data dengan seluruh pemasok",
        "Penilaian dampak perlindungan data secara berkala"
      ]
    },
    {
      title: "Keberlanjutan Bisnis",
      items: [
        "Rencana dan prosedur pemulihan dari disaster",
        "Pengujian dan validasi pencadangan berkala",
        "Pilihan ketersediaan lintas wilayah",
        "Prosedur komunikasi insiden"
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <PublicHeader />

      {/* Bagian Hero */}
      <section className="py-20 md:py-28">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <PublicPageBadge icon={<Shield />} className="mb-6">Keamanan kelas perusahaan</PublicPageBadge>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
            Keamanan yang Dapat Dipercayai
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
            Kami menganggap serius keamanan data Anda. Pelajari langkah-langkah yang kami lakukan untuk melindungi informasi Anda.
          </p>
        </div>
      </section>

      {/* Kisi Fitur Keamanan */}
      <section className="py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Fitur Keamanan</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Platform kami dibangun dengan keamanan sebagai inti, dengan implementasi beberapa lapisan perlindungan.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {securityFeatures.map((feature, index) => (
              <Card key={index} className="h-full hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="p-3 rounded-xl bg-primary/10 text-primary w-fit mb-4">
                    <feature.icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground text-sm">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Sertifikasi */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Kepatuhan & Sertifikasi</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Kami menjaga kepatuhan terhadap standar industri dan regulasi agar data Anda terlindungi.
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-4 max-w-4xl mx-auto">
            {certifications.map((cert, index) => (
              <div key={index} className="flex items-center gap-2 px-4 py-3 bg-background rounded-lg border">
                <CheckCircle className="h-5 w-5 text-primary" />
                <span className="font-medium">{cert}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Praktik Keamanan */}
      <section className="py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Praktik Keamanan Kami</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Kami mengikuti praktik terbaik industri dan terus memperbaiki keamanan kami.
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {securityPractices.map((practice, index) => (
              <Card key={index}>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-4">{practice.title}</h3>
                  <ul className="space-y-3">
                    {practice.items.map((item, itemIndex) => (
                      <li key={itemIndex} className="flex items-start gap-3 text-muted-foreground">
                        <CheckCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Laporkan Masalah Keamanan */}
      <section className="py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <Card className="max-w-3xl mx-auto">
            <CardContent className="p-8 text-center">
              <AlertTriangle className="h-12 w-12 text-primary mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-4">Laporkan Masalah Keamanan</h2>
              <p className="text-muted-foreground mb-6">
                Jika Anda yakin telah menemukan kerentanan keamanan pada layanan kami, mohon laporkannya kepada
                kami secara bertanggung jawab. Kami menghargai bantuan Anda dalam menjaga keamanan platform dan
                pengguna kami.
              </p>
              <Button asChild>
                <a href="https://redmonk.in/contact-us/" target="_blank" rel="noopener noreferrer">
                  Hubungi Tim Keamanan
                </a>
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Security;
