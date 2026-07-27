import type { Metadata } from "next";
import { ContactForm } from "@/components/site/ContactForm";
import { Reveal } from "@/components/site/Reveal";
import { getSiteSettings } from "@/server/services/content.service";
import { pageMetadata } from "@/lib/site-metadata";

export const metadata: Metadata = pageMetadata({
  title: "Contact",
  description:
    "Commissions, collaborations and brand campaigns — get in touch with Unhuman Stud.",
  path: "/contact",
});

export default async function ContactPage() {
  const { contactEmail, socials } = await getSiteSettings();

  return (
    <section className="mx-auto max-w-[1140px] px-6 py-16 sm:px-8">
      <div className="grid items-start gap-12 md:grid-cols-2">
        <Reveal>
          <span className="klabel">05 — Contact</span>
          <h1 className="mt-3 text-[clamp(32px,5vw,52px)] leading-[1.02]">
            Let&rsquo;s make
            <br />
            something <em className="italic text-crimson-br">unhuman.</em>
          </h1>
          <p className="mt-5 max-w-[42ch] text-[17px] text-bone-dim">
            Open to commissions, collaborations and brand campaigns. Tell me the
            world you want to build.
          </p>

          <div className="mt-9 flex flex-col">
            {socials.map((social) => (
              <a
                key={social.label}
                href={social.url}
                className="serif flex items-center justify-between border-t border-line py-4 text-[19px] transition-all duration-300 last:border-b hover:pl-3 hover:text-ember"
              >
                <span>{social.label}</span>
                <span className="mono text-[12px] tracking-[0.08em] text-bone-faint">
                  {social.handle} →
                </span>
              </a>
            ))}
          </div>
        </Reveal>

        <Reveal delay={80}>
          <div className="rounded-xl border border-line bg-panel p-8">
            <span className="eyebrow text-[17px]">Direct line</span>
            <a
              href={`mailto:${contactEmail}`}
              className="serif mt-3 block break-all text-[clamp(20px,3vw,26px)] font-medium transition-colors hover:text-ember"
            >
              {contactEmail}
            </a>
            <p className="mt-6 text-[14.5px] text-bone-dim">
              Typical reply within 24–48h. For commissions, include timeline,
              references and scope.
            </p>
            <a
              href={`mailto:${contactEmail}?subject=${encodeURIComponent("Project inquiry — Unhuman Stud")}`}
              className="mt-7 inline-block rounded-full bg-crimson px-6 py-3.5 text-[12px] font-semibold uppercase tracking-[0.1em] text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-crimson-br"
            >
              Start a project →
            </a>
          </div>
        </Reveal>
      </div>

      <Reveal delay={120} className="mt-16">
        <ContactForm />
      </Reveal>
    </section>
  );
}
