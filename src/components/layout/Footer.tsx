import { Link } from "react-router-dom";
import { Heart } from "lucide-react";
import logo from "@/assets/hr-hub-logo.svg";
import { CONTRIBUTING_URL, ISSUES_URL, LICENSE_URL, REPO_URL, SECURITY_POLICY_URL, SELF_HOST_GUIDE_URL } from "@/lib/site";

const linkClass = "inline-block py-1 transition-colors hover:text-foreground";

function ExternalLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={linkClass}>
      {children}
    </a>
  );
}

const Footer = () => {
  return (
    <footer className="border-t bg-card/60">
      <div className="container mx-auto grid grid-cols-2 gap-8 px-4 py-14 md:grid-cols-5">
        <div className="col-span-2">
          <Link to="/" className="mb-3 inline-flex items-center gap-2.5" aria-label="Beranda Peoplo">
            <img src={logo} alt="" className="h-8 w-auto" />
            <span className="text-lg font-semibold text-foreground">Peoplo</span>
          </Link>
          <p className="max-w-sm text-sm text-muted-foreground">
            Sumber daya manusia (HR) open source untuk tim yang bertumbuh: karyawan, absensi, cuti, gaji, dan kinerja. T hosting sendiri atau biarkan kami yang menjalankannya.
          </p>
          <a
            href={LICENSE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1 text-xs font-medium text-foreground transition-colors hover:border-primary/40"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-primary" aria-hidden="true" />
            Berlisensi di bawah AGPL-3.0
          </a>
        </div>
        <div>
          <h4 className="mb-3 text-sm font-semibold">Produk</h4>
          <ul className="space-y-1 text-sm text-muted-foreground">
            <li><Link to="/features" className={linkClass}>Fitur</Link></li>
            <li><Link to="/how-it-works" className={linkClass}>Cara kerjanya</Link></li>
            <li><Link to="/pricing" className={linkClass}>Harga</Link></li>
            <li><Link to="/security" className={linkClass}>Keamanan</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="mb-3 text-sm font-semibold">Sumber Terbuka</h4>
          <ul className="space-y-1 text-sm text-muted-foreground">
            <li><ExternalLink href={REPO_URL}>GitHub</ExternalLink></li>
            <li><ExternalLink href={SELF_HOST_GUIDE_URL}>Panduan hosting mandiri</ExternalLink></li>
            <li><ExternalLink href={CONTRIBUTING_URL}>Berkontribusi</ExternalLink></li>
            <li><ExternalLink href={ISSUES_URL}>Laporkan masalah</ExternalLink></li>
            <li><ExternalLink href={SECURITY_POLICY_URL}>Kebijakan keamanan</ExternalLink></li>
          </ul>
        </div>
        <div>
          <h4 className="mb-3 text-sm font-semibold">Legal</h4>
          <ul className="space-y-1 text-sm text-muted-foreground">
            <li><Link to="/privacy-policy" className={linkClass}>Kebijakan privasi</Link></li>
            <li><Link to="/terms-of-service" className={linkClass}>Ketentuan layanan</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t">
        <div className="container mx-auto flex flex-col items-center justify-between gap-3 px-4 py-6 text-sm text-muted-foreground sm:flex-row">
          <p className="text-center sm:text-left">
            © {new Date().getFullYear()} Peoplo oleh Redmonk. Sumber terbuka di bawah lisensi{" "}
            <a href={LICENSE_URL} target="_blank" rel="noopener noreferrer" className="underline underline-offset-4 hover:text-foreground">
              AGPL-3.0
            </a>{" "}
            .
          </p>
          <p className="flex items-center gap-1.5">
            Dibuat dengan <Heart className="h-3.5 w-3.5 fill-primary text-primary" aria-hidden="true" />
            <span className="sr-only">cinta</span> secara terbuka
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
