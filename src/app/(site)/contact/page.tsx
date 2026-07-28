import type { Metadata } from "next";
import { Reveal } from "@/components/site/Reveal";
import { getSiteSettings } from "@/server/services/content.service";
import { pageMetadata } from "@/lib/site-metadata";

export const metadata: Metadata = pageMetadata({
  title: "Contact",
  description:
    "Commissions, collaborations and brand campaigns — get in touch with Unhuman Stud.",
  path: "/contact",
});

/**
 * The site is a static export, so there is no server to post a form to. The
 * brief is collected by opening the visitor's mail client with the questions
 * already written into the body — same information, no backend.
 * See "Re-enabling the contact form" in README.md.
 */
const BRIEF_SUBJECT = "Project brief — Unhuman Stud";

const BRIEF_BODY = [
  "Name:",
  "Scope (short film, brand campaign, key art…):",
  "Timeline or key dates:",
  "References (moodboards, films, decks):",
  "",
  "What are we building? — the world, the mood, the constraints:",
  "",
].join("\n");

const BRIEF_PROMPTS = [
  { label: "Scope", hint: "Short film, brand campaign, key art…" },
  { label: "Timeline", hint: "Delivery window or key dates" },
  { label: "References", hint: "Links to moodboards, films or decks" },
  { label: "The world", hint: "The mood, the constraints, the feeling" },
];

export default async function ContactPage() {
  const { contactEmail, socials } = await getSiteSettings();

  return (
    <section className="mx-auto max-w-site px-6 py-16 sm:px-8">
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
        <div className="rounded-xl border border-line bg-panel p-6 sm:p-8">
          <span className="klabel">Project brief</span>
          <h2 className="mt-3 text-[clamp(22px,3.2vw,32px)]">
            Tell me the <em className="italic text-crimson-br">shape</em> of it.
          </h2>
          <p className="mt-3 max-w-[56ch] text-[15px] text-bone-dim">
            One email is enough to start. The button below opens your mail app
            with these questions already written in — answer the ones that
            apply and delete the rest.
          </p>

          <ul className="mt-7 grid gap-px overflow-hidden rounded-lg border border-line bg-line sm:grid-cols-2">
            {BRIEF_PROMPTS.map(({ label, hint }) => (
              <li key={label} className="bg-bg-2 px-5 py-4">
                <span className="klabel block">{label}</span>
                <span className="mt-1.5 block text-[14.5px] text-bone-dim">
                  {hint}
                </span>
              </li>
            ))}
          </ul>

          <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-3">
            <a
              href={`mailto:${contactEmail}?subject=${encodeURIComponent(BRIEF_SUBJECT)}&body=${encodeURIComponent(BRIEF_BODY)}`}
              className="rounded-full bg-crimson px-6 py-3.5 text-[12px] font-semibold uppercase tracking-[0.1em] text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-crimson-br"
            >
              Write the brief →
            </a>
            <p className="text-[14px] text-bone-dim">
              Or send it yourself to{" "}
              <a
                href={`mailto:${contactEmail}`}
                className="break-all font-medium text-bone transition-colors hover:text-ember"
              >
                {contactEmail}
              </a>
              .
            </p>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
