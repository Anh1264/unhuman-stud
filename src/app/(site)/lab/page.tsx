import type { Metadata } from "next";
import { PromptLibrary } from "@/components/site/PromptLibrary";
import { Reveal } from "@/components/site/Reveal";
import { getPromptEntries } from "@/server/services/prompts.service";
import { pageMetadata } from "@/lib/site-metadata";

export const metadata: Metadata = pageMetadata({
  title: "Prompt lab",
  description:
    "The open notebook behind the films — every prompt Unhuman Stud has run, written out in full, with the references it was fed, what came back, and which parts are worth reusing.",
  path: "/lab",
});

export default async function LabPage() {
  const entries = await getPromptEntries();

  return (
    <section className="mx-auto max-w-site px-6 py-16 sm:px-8">
      <Reveal className="mb-12 max-w-[640px]">
        <span className="klabel">04 — Working notes</span>
        <h1 className="mt-3 text-[clamp(32px,5vw,52px)]">
          Prompt <em className="italic text-crimson-br">lab</em>
        </h1>
        <p className="mt-3 max-w-[56ch] text-[16px] text-bone-dim">
          Every prompt behind the work, kept exactly as it was written — line
          breaks, spelling and all. Open one for the full text, the references
          it was given, and the named blocks worth lifting into the next
          attempt.
        </p>
      </Reveal>

      {entries.length > 0 ? (
        <PromptLibrary entries={entries} />
      ) : (
        <Reveal>
          <p className="serif max-w-[46ch] text-[20px] italic text-bone-dim">
            The first prompt has not been filed yet.
          </p>
        </Reveal>
      )}
    </section>
  );
}
