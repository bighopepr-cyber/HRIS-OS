import { ArrowRight, Github } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Backdrop } from "@/components/landing/Backdrop";
import { REPO_URL } from "@/lib/site";
import { DEMO_URL } from "./publicSite";

interface PublicCtaSectionProps {
  title?: string;
  description?: string;
}

/** Pita ajakan bertindak penutup yang dipakai bersama oleh halaman pemasaran publik. */
const PublicCtaSection = ({
  title = "Siap untuk HR yang lebih tenang?",
  description = "Hosting HRISINDO sendiri secara gratis, atau pesan demo dan kami akan menyiapkannya untuk Anda. HRISINDO bersifat open source di bawah lisensi AGPL-3.0.",
}: PublicCtaSectionProps) => (
  <section className="px-4 py-16 sm:py-20">
    <div className="container relative mx-auto overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-sky-700 to-sky-900 px-6 py-14 text-center text-primary-foreground shadow-2xl shadow-primary/30 sm:py-16">
      <Backdrop tone="light" className="opacity-50" />
      <div className="relative mx-auto max-w-3xl space-y-6">
        <h2 className="text-3xl font-bold tracking-tight md:text-4xl">{title}</h2>
        <p className="text-lg text-white/90">{description}</p>
        <div className="flex flex-col justify-center gap-3 pt-2 sm:flex-row sm:gap-4">
          <Button asChild size="lg" variant="secondary" className="group h-12 gap-2 px-8">
            <a href={DEMO_URL} target="_blank" rel="noopener noreferrer">
              Pesan Demo <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
            </a>
          </Button>
          <Button
            asChild
            size="lg"
            variant="outline"
            className="h-12 gap-2 border-white/50 bg-transparent px-8 text-white hover:bg-white/10 hover:text-white"
          >
            <a href={REPO_URL} target="_blank" rel="noopener noreferrer">
              <Github className="h-4 w-4" aria-hidden="true" />
              Bintangkan di GitHub
            </a>
          </Button>
        </div>
      </div>
    </div>
  </section>
);

export default PublicCtaSection;
