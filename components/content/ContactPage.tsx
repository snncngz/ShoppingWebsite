import { Camera, CirclePlay, Globe } from "lucide-react";

import { Breadcrumbs } from "@/components/category/Breadcrumbs";
import { ContactForm } from "@/components/content/ContactForm";
import { DEMO_ADDRESS, DEMO_USER } from "@/lib/auth";

const socialLinks = [
  { label: "Instagram", href: "#", icon: Camera },
  { label: "Facebook", href: "#", icon: Globe },
  { label: "YouTube", href: "#", icon: CirclePlay },
] as const;

export function ContactPage() {
  return (
    <section className="bg-ivory px-6 py-12 lg:px-8 lg:py-16">
      <div className="mx-auto max-w-7xl">
        <Breadcrumbs
          items={[
            { label: "Anasayfa", href: "/" },
            { label: "İletişim", href: "/iletisim" },
          ]}
        />
        <p className="mt-8 text-12 tracking-label text-taupe">Atelier</p>
        <h1 className="mt-3 font-heading text-32 text-black lg:text-48">İletişim</h1>
        <p className="mt-4 max-w-xl text-16 text-charcoal">
          Sipariş, beden veya koleksiyon sorularınız için yazın. Form yalnızca
          tarayıcınızda çalışır; gerçek bir e-posta gönderilmez.
        </p>

        <div className="mt-16 grid gap-16 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-24">
          <ContactForm />

          <aside className="flex flex-col gap-10">
            <div>
              <p className="text-12 tracking-label text-taupe">E-posta</p>
              <p className="mt-3 text-16 text-charcoal">atelier@lucienperrin.com</p>
            </div>
            <div>
              <p className="text-12 tracking-label text-taupe">Telefon</p>
              <p className="mt-3 text-16 text-charcoal">{DEMO_USER.phone}</p>
            </div>
            <div>
              <p className="text-12 tracking-label text-taupe">Mağaza</p>
              <p className="mt-3 text-16 text-charcoal">{DEMO_ADDRESS.full}</p>
              <p className="mt-3 text-14 text-taupe">
                Salı–Cumartesi 11:00–19:00
                <br />
                Pazar 12:00–18:00
                <br />
                Pazartesi kapalı
              </p>
            </div>
            <div>
              <p className="text-12 tracking-label text-taupe">Sosyal</p>
              <ul className="mt-4 flex items-center gap-4">
                {socialLinks.map((social) => (
                  <li key={social.label}>
                    <a
                      href={social.href}
                      aria-label={social.label}
                      className="flex h-11 w-11 items-center justify-center text-charcoal transition-colors hover:text-black"
                    >
                      <social.icon size={18} strokeWidth={1.4} />
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}
