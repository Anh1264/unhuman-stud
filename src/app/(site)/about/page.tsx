import type { Metadata } from "next";
import Link from "next/link";
import { Reveal } from "@/components/site/Reveal";
import { pageMetadata } from "@/lib/site-metadata";

export const metadata: Metadata = pageMetadata({
  title: "Creator",
  description:
    "Aiden Vu — part artist, part engineer. A one-person studio treating AI as a camera, a crew and a paintbrush.",
  path: "/about",
});

const CAPABILITIES = [
  { label: "AI video / motion", level: "Advanced", value: 90 },
  { label: "AI image / campaign visuals", level: "Advanced", value: 88 },
  { label: "Writing & direction", level: "Strong", value: 82 },
  { label: "Code / automation", level: "Strong", value: 78 },
  { label: "Visual design", level: "Growing", value: 62 },
];

const TOOLS = [
  "Midjourney",
  "Higgsfield",
  "Kling",
  "Veo",
  "Freepik",
  "Nano Banana",
  "Photoshop",
  "Premiere",
  "Python",
  "TypeScript",
];

const FOUNDATIONS = ["Computer Science", "Film Language", "Art History", "Marketing"];

export default function AboutPage() {
  return (
    <section className="mx-auto max-w-[1180px] px-6 py-16 sm:px-8">
      <Reveal className="mb-12 max-w-[640px]">
        <span className="klabel">04 — The creator</span>
        <h1 className="mt-3 text-[clamp(32px,5vw,52px)]">
          Aiden <em className="italic text-crimson-br">Vu</em>
        </h1>
        <p className="mt-3 max-w-[56ch] text-[16px] text-bone-dim">
          Part artist, part engineer. A one-person studio treating AI as a
          camera, a crew and a paintbrush.
        </p>
      </Reveal>

      <Reveal>
        <div className="prose-body max-w-[68ch]">
          <p className="text-[16px]">
            <strong className="font-medium text-bone">
              I build cinematic worlds without a studio behind me.
            </strong>{" "}
            Writing, direction, image and video generation, sound, edit — the
            whole pipeline runs through one person. I care less about &ldquo;AI
            content&rdquo; and more about{" "}
            <em className="serif italic text-ember">
              marketing-literate storytelling
            </em>
            : work that moves people and moves product.
          </p>
          <p className="text-[16px]">
            I&rsquo;m a CS student who codes my own production tooling, and
            I&rsquo;m sharpening a real visual eye alongside it — studying
            fashion, film language and design in public. The goal isn&rsquo;t to
            replace crews; it&rsquo;s to prove one focused operator can ship
            campaign- and festival-grade work.
          </p>
        </div>
      </Reveal>

      <div className="mt-16 grid gap-5 md:grid-cols-2">
        <Reveal>
          <div className="h-full rounded-xl border border-line bg-panel p-7">
            <h2 className="mono mb-6 text-[12px] font-bold uppercase tracking-[0.16em] text-ember">
              Capabilities
            </h2>
            {CAPABILITIES.map((c) => (
              <div key={c.label} className="mb-4">
                <div className="mb-2 flex justify-between text-[14px]">
                  <span>{c.label}</span>
                  <span className="mono text-[11px] text-bone-faint">
                    {c.level}
                  </span>
                </div>
                {/* Decorative: the level ("Advanced") already carries the meaning. */}
                <div
                  aria-hidden
                  className="h-1 overflow-hidden rounded-full bg-bone/10"
                >
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-crimson to-ember"
                    style={{ width: `${c.value}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Reveal>

        <Reveal delay={60}>
          <div className="h-full rounded-xl border border-line bg-panel p-7">
            <h2 className="mono mb-5 text-[12px] font-bold uppercase tracking-[0.16em] text-ember">
              Toolstack
            </h2>
            <div className="flex flex-wrap gap-2">
              {TOOLS.map((tool) => (
                <span
                  key={tool}
                  className="mono rounded-full border border-crimson/50 bg-crimson/15 px-2.5 py-1 text-[10px] uppercase tracking-[0.12em] text-ember"
                >
                  {tool}
                </span>
              ))}
            </div>

            <h2 className="mono mb-5 mt-8 text-[12px] font-bold uppercase tracking-[0.16em] text-ember">
              Foundations
            </h2>
            <div className="flex flex-wrap gap-2">
              {FOUNDATIONS.map((f) => (
                <span
                  key={f}
                  className="mono rounded-full border border-gold/50 bg-gold/12 px-2.5 py-1 text-[10px] uppercase tracking-[0.12em] text-gold"
                >
                  {f}
                </span>
              ))}
            </div>

            <h2 className="mono mb-5 mt-8 text-[12px] font-bold uppercase tracking-[0.16em] text-ember">
              Languages
            </h2>
            <div className="flex flex-wrap gap-2">
              {["English", "Vietnamese"].map((l) => (
                <span
                  key={l}
                  className="mono rounded-full border border-line-2 px-2.5 py-1 text-[10px] uppercase tracking-[0.12em] text-bone-dim"
                >
                  {l}
                </span>
              ))}
            </div>
          </div>
        </Reveal>
      </div>

      <Reveal className="mt-14 border-t border-line pt-10">
        <p className="text-[16px] text-bone-dim">
          Open to commissions and collaborations.{" "}
          <Link
            href="/contact"
            className="mono ml-1 border-b border-ember pb-0.5 text-[13px] uppercase tracking-[0.06em] text-ember hover:border-gold hover:text-gold"
          >
            Get in touch →
          </Link>
        </p>
      </Reveal>
    </section>
  );
}
