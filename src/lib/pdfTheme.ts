// Gaya PDF bersama sehingga setiap dokumen yang dihasilkan (slip gaji, laporan, ekspor)
// dibaca sebagai satu sistem yang konsisten dan formal, bukan setiap file mencari
// gaya header/footer/warna sendiri.

// Font Helvetica bawaan jsPDF tidak memiliki glip Rupiah — "₹" dari Intl render
// sebagai superscript yang rusak di PDF, jadi format angka sendiri dan awali
// "Rs." sebagai teks ASCII alih-alih menggunakan style: "currency". Gunakan ini
// (bukan pemformat ₹ di layar) untuk setiap jumlah yang dicetak ke PDF.
export const formatCurrencyForPdf = (amount: number) => {
  const formatted = new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
  return `Rs. ${formatted}`;
};

export const PDF_COLORS = {
  accent: [51, 65, 85] as [number, number, number], // Slate
  rule: [203, 213, 225] as [number, number, number], // Light slate rule
  ruleLight: [226, 232, 240] as [number, number, number],
  gray: [100, 116, 139] as [number, number, number],
  dark: [15, 23, 42] as [number, number, number],
};

// style head/baris selang selang autoTable yang dibagikan di setiap tabel laporan.
export const PDF_TABLE_HEAD_STYLE = {
  fillColor: PDF_COLORS.accent,
  textColor: [255, 255, 255] as [number, number, number],
  fontStyle: "bold" as const,
  fontSize: 9,
};

export const PDF_TABLE_ALT_ROW_STYLE = {
  fillColor: [248, 250, 252] as [number, number, number],
};

export interface PdfBrandingInfo {
  companyName?: string;
  companyAddress?: string;
  logoDataUrl?: string;
}

interface DrawPdfHeaderOptions extends PdfBrandingInfo {
  title: string;
  subtitle?: string;
  pageWidth: number;
  margin: number;
}

/**
 * Menggambar header dokumen standar (branding perusahaan di kiri, judul/subtitle
 * dokumen di kanan, garis aksen tipis di bawah) dan mengembalikan posisi Y di
 * mana konten harus dilanjutkan.
 */
export function drawPdfHeader(
  doc: import("jspdf").jsPDF,
  { title, subtitle, companyName, companyAddress, logoDataUrl, pageWidth, margin }: DrawPdfHeaderOptions
): number {
// Logo adalah tanda kecil di samping nama, bukan penggantinya — nama/alamat
// masih perlu dirender meskipun logo ada.
  let textX = margin;
  if (logoDataUrl) {
    try {
      doc.addImage(logoDataUrl, margin, 6, 14, 14, undefined, "FAST");
      textX = margin + 18;
    } catch {
      // Data gambar yang rusak/tidak didukung tidak boleh memblokir pembuatan laporan.
    }
  }

  doc.setTextColor(...PDF_COLORS.dark);
  doc.setFontSize(15);
  doc.setFont("helvetica", "bold");
  doc.text(companyName || "PEOPLO HR", textX, 15);

  if (companyAddress) {
    doc.setTextColor(...PDF_COLORS.gray);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text(companyAddress, textX, 21, { maxWidth: pageWidth / 2 - textX });
  }

  doc.setTextColor(...PDF_COLORS.dark);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text(title, pageWidth - margin, 15, { align: "right" });

  if (subtitle) {
    doc.setTextColor(...PDF_COLORS.gray);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(subtitle, pageWidth - margin, 21, { align: "right" });
  }

  doc.setDrawColor(...PDF_COLORS.accent);
  doc.setLineWidth(0.8);
  doc.line(margin, 36, pageWidth - margin, 36);

  return 48;
}

interface DrawPdfFooterOptions {
  pageWidth: number;
  pageHeight: number;
  margin: number;
  pageNumber?: number;
  totalPages?: number;
}

/** Menggambar footer standar "Dibuat pada <tanggal>" + nomor halaman. */
export function drawPdfFooter(
  doc: import("jspdf").jsPDF,
  { pageWidth, pageHeight, margin, pageNumber, totalPages }: DrawPdfFooterOptions
): void {
  doc.setDrawColor(...PDF_COLORS.ruleLight);
  doc.setLineWidth(0.3);
  doc.line(margin, pageHeight - 18, pageWidth - margin, pageHeight - 18);

  doc.setTextColor(...PDF_COLORS.gray);
  doc.setFontSize(8);
  doc.setFont("helvetica", "italic");
  doc.text(
    `Dibuat pada ${new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}`,
    margin,
    pageHeight - 10
  );

  if (pageNumber && totalPages) {
    doc.setFont("helvetica", "normal");
    doc.text(`Halaman ${pageNumber} dari ${totalPages}`, pageWidth - margin, pageHeight - 10, { align: "right" });
  }
}

/**
 * Mengambil URL gambar dan mengonversinya ke data URL base64, karena
 * addImage() jsPDF membutuhkan data gambar sebenarnya bukan URL remote.
 * Mengembalikan undefined pada kegagalan apa pun sehingga logo yang hilang/rusak
 * tidak pernah memblokir pembuatan PDF.
 */
export async function fetchImageAsDataUrl(url?: string | null): Promise<string | undefined> {
  if (!url) return undefined;
  try {
    const response = await fetch(url);
    if (!response.ok) return undefined;
    const blob = await response.blob();
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error("Gagal membaca gambar"));
      reader.readAsDataURL(blob);
    });
  } catch {
    return undefined;
  }
}
