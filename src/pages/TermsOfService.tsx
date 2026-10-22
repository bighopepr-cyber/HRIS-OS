import { Card, CardContent } from "@/components/ui/card";
import { FileText, Users, CreditCard, AlertTriangle, Scale, Ban } from "lucide-react";
import Footer from "@/components/layout/Footer";
import PublicHeader from "@/components/layout/PublicHeader";
import PublicPageBadge from "@/components/layout/PublicPageBadge";

/** Perbarui nilai ini setiap kali teks ketentuan di bawah ini berubah. */
const LAST_UPDATED = "6 Maret 2026";

const TermsOfService = () => {
  const sections = [
    {
      icon: Users,
      title: "Ketentuan Akun",
      content: [
        "Anda harus berusia 18 tahun atau lebih untuk menggunakan layanan ini",
        "Anda harus memberikan informasi pendaftaran yang akurat dan lengkap",
        "Anda bertanggung jawab menjaga keamanan kredensial akun Anda",
        "Anda bertanggung jawab atas seluruh aktivitas yang terjadi pada akun Anda",
        "Anda harus segera memberi tahu kami atas penggunaan akun Anda yang tidak sah",
        "Satu orang atau badan hukum tidak boleh memiliki lebih dari satu akun"
      ]
    },
    {
      icon: FileText,
      title: "Penggunaan yang Diterima",
      content: [
        "Anda setuju menggunakan layanan ini hanya untuk tujuan yang sah",
        "Anda tidak boleh melanggar hukum atau regulasi yang berlaku",
        "Anda tidak boleh melanggar hak orang lain",
        "Anda tidak boleh mencoba memperoleh akses tidak sah ke sistem kami",
        "Anda tidak boleh mengirim kode berbahaya maupun konten yang merugikan",
        "Anda tidak boleh menggunakan layanan ini untuk mengirim spam atau komunikasi yang tidak diminta"
      ]
    },
    {
      icon: CreditCard,
      title: "Ketentuan Pembayaran",
      content: [
        "Paket berbayar ditagihkan di muka secara bulanan atau tahunan",
        "Seluruh biaya belum termasuk pajak yang berlaku kecuali dinyatakan lain",
        "Anda bertanggung jawab memberikan informasi penagihan yang akurat",
        "Kegagalan pembayaran dapat menyebabkan penangguhan atau penghentian akun Anda",
        "Pengembalian dana diberikan sesuai kebijakan pengembalian dana kami",
        "Harga dapat berubah dengan pemberitahuan yang wajar"
      ]
    },
    {
      icon: Ban,
      title: "Aktivitas yang Dilarang",
      content: [
        "Menjual kembali atau mendistribusikan ulang layanan ini tanpa izin",
        "Menggunakan layanan ini untuk kegiatan yang ilegal atau kecurangan",
        "Berusaha melakukan rekayasa balik atau dekompilasi perangkat lunak ini",
        "Mengganggu atau mengganggu layanan maupun server",
        "Mengumpulkan atau memanen data pengguna tanpa persetujuan",
        "Menyamar sebagai orang atau badan lain"
      ]
    },
    {
      icon: AlertTriangle,
      title: "Pembatasan Tanggung Jawab",
      content: [
        "Layanan ini disediakan 'apa adanya' tanpa jaminan dalam bentuk apa pun",
        "Kami tidak menjamin layanan yang tanpa gangguan atau bebas kesalahan",
        "Kami tidak bertanggung jawab atas kerugian tidak langsung, insidental, atau ikutan",
        "Total tanggung jawab kami tidak akan melebihi biaya yang dibayarkan dalam 12 bulan terakhir",
        "Beberapa yurisdiksi tidak memperbolehkan pembatasan tanggung jawab, sehingga ketentuan ini mungkin tidak berlaku",
        "Kami tidak bertanggung jawab atas layanan atau konten pihak ketiga"
      ]
    },
    {
      icon: Scale,
      title: "Hukum yang Berlaku",
      content: [
        "Ketentuan ini tunduk pada hukum yang berlaku",
        "Setiap perselisihan diselesaikan melalui jalur hukum yang sesuai",
        "Anda setuju tunduk pada yurisdiksi pengadilan yang berwenang",
        "Jika suatu ketentuan dinyatakan tidak dapat ditegakkan, ketentuan lainnya tetap berlaku",
        "Ketentuan ini merupakan keseluruhan perjanjian antara para pihak",
        "Pelepasan atas suatu ketentuan tidak berarti pelepasan berkelanjutan atas ketentuan tersebut"
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <PublicHeader />

      {/* Bagian Hero */}
      <section className="py-20 md:py-28">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <PublicPageBadge icon={<FileText />} className="mb-6">Perjanjian hukum</PublicPageBadge>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
            Ketentuan Layanan
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto mb-4">
            Harap baca ketentuan ini dengan saksama sebelum menggunakan layanan kami.
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
                Selamat datang di HRISINDO. Dengan mengakses atau menggunakan platform manajemen SDM dan
                layanan kami, Anda menyetujui untuk terikat oleh Ketentuan Layanan ini ("Ketentuan"). Jika Anda
                tidak setuju dengan bagian mana pun dari ketentuan ini, Anda tidak boleh mengakses layanan ini.
                Ketentuan ini berlaku bagi seluruh pengunjung, pengguna, dan pihak lain yang mengakses atau
                menggunakan layanan ini.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Bagian Ketentuan */}
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

      {/* Penghentian */}
      <section className="py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <Card className="max-w-4xl mx-auto">
            <CardContent className="p-8">
              <h2 className="text-xl font-semibold mb-4">Penghentian</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Kami dapat menghentikan atau menangguhkan akun Anda secara langsung, tanpa pemberitahuan
                sebelumnya maupun kewajiban apa pun, dengan alasan apa pun, termasuk tanpa batasan apabila Anda
                melanggar Ketentuan. Setelah penghentian, hak Anda untuk menggunakan layanan ini akan langsung
                berakhir.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                Jika Anda ingin menghentikan akun Anda, Anda cukup menghentikan penggunaan layanan ini atau
                menghubungi kami untuk meminta penghapusan akun. Seluruh ketentuan yang menurut sifatnya
                seharusnya tetap berlaku setelah penghentian akan tetap berlaku setelah penghentian.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Kontak */}
      <section className="py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <Card className="max-w-4xl mx-auto">
            <CardContent className="p-8">
              <h2 className="text-xl font-semibold mb-4">Hubungi Kami</h2>
              <p className="text-muted-foreground leading-relaxed">
                Jika Anda memiliki pertanyaan mengenai Ketentuan ini, silakan hubungi kami. Kami akan
                melakukan segala upaya untuk menyelesaikan setiap masalah dan menjawab pertanyaan Anda
                secara tepat waktu.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default TermsOfService;
