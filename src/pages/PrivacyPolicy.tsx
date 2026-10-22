import { Card, CardContent } from "@/components/ui/card";
import { Shield, Eye, Lock, UserCheck, Database, Mail } from "lucide-react";
import Footer from "@/components/layout/Footer";
import PublicHeader from "@/components/layout/PublicHeader";
import PublicPageBadge from "@/components/layout/PublicPageBadge";

/** Perbarui nilai ini setiap kali teks kebijakan di bawah ini berubah. */
const LAST_UPDATED = "6 Maret 2026";

const PrivacyPolicy = () => {
  const sections = [
    {
      icon: Eye,
      title: "Informasi yang Kami Kumpulkan",
      content: [
        "Informasi identitas pribadi (nama, alamat email, nomor telepon, dan sebagainya)",
        "Informasi terkait pekerjaan ketika Anda menggunakan layanan SDM kami",
        "Data penggunaan dan analitik untuk meningkatkan layanan kami",
        "Informasi perangkat dan peramban untuk keperluan keamanan",
        "Cookie dan teknologi pelacakan serupa"
      ]
    },
    {
      icon: Database,
      title: "Cara Kami Menggunakan Informasi Anda",
      content: [
        "Untuk menyediakan dan mengelola layanan manajemen SDM kami",
        "Untuk memberitahukan Anda tentang perubahan pada layanan kami",
        "Untuk memberikan dukungan pelanggan dan menjawab pertanyaan",
        "Untuk menghimpun analisis atau informasi berharga guna meningkatkan layanan kami",
        "Untuk mendeteksi, mencegah, dan menyelesaikan masalah teknis",
        "Untuk mematuhi kewajiban hukum"
      ]
    },
    {
      icon: Lock,
      title: "Keamanan Data",
      content: [
        "Kami menerapkan langkah keamanan sesuai standar industri untuk melindungi data Anda",
        "Seluruh transmisi data dienkripsi menggunakan protokol SSL/TLS",
        "Audit keamanan dan penilaian kerentanan secara berkala",
        "Kontrol akses dan mekanisme autentikasi",
        "Pusat data aman dengan pengukuran keamanan fisik"
      ]
    },
    {
      icon: UserCheck,
      title: "Hak Anda",
      content: [
        "Hak untuk mengakses data pribadi Anda",
        "Hak untuk memperbaiki data pribadi yang tidak akurat",
        "Hak atas penghapusan ('hak untuk dilupakan')",
        "Hak untuk membatasi pemrosesan data Anda",
        "Hak atas portabilitas data",
        "Hak atas penolakan terhadap pemrosesan",
        "Hak untuk mencabut persetujuan kapan saja"
      ]
    },
    {
      icon: Shield,
      title: "Retensi Data",
      content: [
        "Kami menyimpan data pribadi hanya selama diperlukan",
        "Data disimpan untuk memenuhi tujuan yang diuraikan dalam kebijakan ini",
        "Persyaratan hukum dan regulasi mungkin mengharuskan penyimpanan lebih lama",
        "Anda dapat meminta penghapusan data Anda kapan saja",
        "Salinan cadangan mungkin disimpan untuk jangka waktu terbatas"
      ]
    },
    {
      icon: Mail,
      title: "Hubungi Kami",
      content: [
        "Untuk pertanyaan atau kekhawatiran terkait privasi, silakan hubungi kami",
        "Kami berusaha menjawab seluruh pertanyaan dalam waktu 30 hari",
        "Anda juga dapat mengajukan keluhan kepada otoritas perlindungan data setempat"
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <PublicHeader />

      {/* Bagian Hero */}
      <section className="py-20 md:py-28">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <PublicPageBadge icon={<Shield />} className="mb-6">Privasi Anda penting bagi kami</PublicPageBadge>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
            Kebijakan Privasi
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto mb-4">
            Kami berkomitmen melindungi privasi Anda dan memastikan keamanan informasi pribadi Anda.
          </p>
          <p className="text-sm text-muted-foreground">
            Terakhir diperbarui: {LAST_UPDATED}
          </p>
        </div>
      </section>

      {/* Pendahuluan */}
      <section className="pb-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <Card className="max-w-4xl mx-auto">
            <CardContent className="p-8">
              <p className="text-muted-foreground leading-relaxed">
                Kebijakan Privasi ini menjelaskan bagaimana HRISINDO ("kami") mengumpulkan, menggunakan, dan
                membagikan informasi tentang Anda ketika Anda menggunakan platform manajemen SDM serta layanan
                terkait kami. Dengan menggunakan layanan kami, Anda menyetujui pengumpulan dan penggunaan
                informasi sesuai dengan kebijakan ini. Kami mengajak Anda membaca kebijakan ini
                dengan saksama agar memahami praktik kami mengenai data pribadi Anda dan cara kami
                memperlakukannya.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Bagian Kebijakan */}
      <section className="py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto space-y-8">
            {sections.map((section, index) => (
              <Card key={index} className="overflow-hidden">
                <CardContent className="p-8">
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-xl bg-primary/10 text-primary shrink-0">
                      <section.icon className="h-6 w-6" />
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold mb-4">{section.title}</h2>
                      <ul className="space-y-3">
                        {section.content.map((item, itemIndex) => (
                          <li key={itemIndex} className="flex items-start gap-3 text-muted-foreground">
                            <div className="h-1.5 w-1.5 rounded-full bg-primary mt-2 shrink-0" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Informasi Tambahan */}
      <section className="py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <Card className="max-w-4xl mx-auto">
            <CardContent className="p-8">
              <h2 className="text-xl font-semibold mb-4">Perubahan atas Kebijakan Privasi Ini</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Kami mungkin memperbarui Kebijakan Privasi ini dari waktu ke waktu. Kami akan memberitahukan
                Anda tentang setiap perubahan dengan memuat Kebijakan Privasi terbaru di halaman ini dan
                memperbarui tanggal "Terakhir diperbarui" di bagian atas kebijakan ini.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                Kami saran agar Anda meninjau Kebijakan Privasi ini secara berkala untuk mengetahui setiap
                perubahan. Perubahan atas Kebijakan Privasi ini berlaku sejak dimuat di halaman ini.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default PrivacyPolicy;
