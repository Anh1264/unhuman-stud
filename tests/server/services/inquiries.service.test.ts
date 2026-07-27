import { beforeEach, describe, expect, it, vi } from "vitest";

const insertInquiry = vi.fn();

vi.mock("@/server/repositories/inquiries.repo", () => ({
  insertInquiry: (...args: unknown[]) => insertInquiry(...args),
}));

const { submitInquiry, inquirySchema } = await import(
  "@/server/services/inquiries.service"
);

type Raw = Record<string, unknown>;

function validInput(overrides: Raw = {}): Raw {
  return {
    name: "Aiden Vu",
    email: "aiden@example.com",
    scope: "A 60-second brand film",
    timelineNote: "Q4",
    referenceLinks: "https://example.com/reel",
    message: "I would like a cinematic teaser for a product launch next quarter.",
    ...overrides,
  };
}

beforeEach(() => {
  insertInquiry.mockReset();
  insertInquiry.mockResolvedValue({ id: "inq_1" });
});

describe("submitInquiry — valid input", () => {
  it("stores the inquiry and returns its id", async () => {
    const result = await submitInquiry(validInput());

    expect(result).toEqual({ ok: true, id: "inq_1" });
    expect(insertInquiry).toHaveBeenCalledTimes(1);
    expect(insertInquiry).toHaveBeenCalledWith({
      name: "Aiden Vu",
      email: "aiden@example.com",
      message:
        "I would like a cinematic teaser for a product launch next quarter.",
      scope: "A 60-second brand film",
      timelineNote: "Q4",
      referenceLinks: "https://example.com/reel",
    });
  });

  it("stores empty optional fields as null rather than empty strings", async () => {
    await submitInquiry(
      validInput({ scope: "", timelineNote: "", referenceLinks: "" }),
    );

    expect(insertInquiry).toHaveBeenCalledWith(
      expect.objectContaining({
        scope: null,
        timelineNote: null,
        referenceLinks: null,
      }),
    );
  });

  it("accepts values sitting exactly on the length limits", async () => {
    const result = await submitInquiry(
      validInput({
        name: "a".repeat(120),
        scope: "s".repeat(200),
        timelineNote: "t".repeat(200),
        referenceLinks: "r".repeat(1000),
        message: "m".repeat(5000),
      }),
    );

    expect(result).toEqual({ ok: true, id: "inq_1" });
  });
});

describe("submitInquiry — invalid input", () => {
  const cases: {
    label: string;
    field: string;
    input: Raw;
    expected: string;
  }[] = [
    {
      label: "name shorter than 2 characters",
      field: "name",
      input: validInput({ name: "A" }),
      expected: "Please tell me your name.",
    },
    {
      label: "name longer than 120 characters",
      field: "name",
      input: validInput({ name: "a".repeat(121) }),
      expected: "That name is longer than 120 characters.",
    },
    {
      label: "malformed email",
      field: "email",
      input: validInput({ email: "not-an-email" }),
      expected: "That email address doesn't look right.",
    },
    {
      label: "email longer than 200 characters",
      field: "email",
      input: validInput({ email: `${"a".repeat(200)}@example.com` }),
      expected: "That email address is longer than 200 characters.",
    },
    {
      label: "scope longer than 200 characters",
      field: "scope",
      input: validInput({ scope: "s".repeat(201) }),
      expected: "Keep the scope under 200 characters.",
    },
    {
      label: "timeline longer than 200 characters",
      field: "timelineNote",
      input: validInput({ timelineNote: "t".repeat(201) }),
      expected: "Keep the timeline under 200 characters.",
    },
    {
      label: "references longer than 1000 characters",
      field: "referenceLinks",
      input: validInput({ referenceLinks: "r".repeat(1001) }),
      expected: "Keep the references under 1000 characters.",
    },
    {
      label: "message shorter than 20 characters",
      field: "message",
      input: validInput({ message: "too short" }),
      expected: "A little more detail, please — at least 20 characters.",
    },
    {
      label: "message longer than 5000 characters",
      field: "message",
      input: validInput({ message: "m".repeat(5001) }),
      expected: "Please keep the message under 5000 characters.",
    },
  ];

  for (const { label, field, input, expected } of cases) {
    it(`rejects ${label} and never touches the repository`, async () => {
      const result = await submitInquiry(input);

      expect(result.ok).toBe(false);
      if (result.ok) throw new Error("expected a failure");
      expect(result.fieldErrors[field as keyof typeof result.fieldErrors]).toContain(
        expected,
      );
      expect(result.formError).toBeUndefined();
      expect(insertInquiry).not.toHaveBeenCalled();
    });
  }

  it("reports every missing field at once", async () => {
    const result = await submitInquiry({});

    expect(result.ok).toBe(false);
    if (result.ok) throw new Error("expected a failure");
    expect(Object.keys(result.fieldErrors).sort()).toEqual([
      "email",
      "message",
      "name",
      "referenceLinks",
      "scope",
      "timelineNote",
    ]);
    expect(insertInquiry).not.toHaveBeenCalled();
  });

  it("rejects a non-object payload", async () => {
    const result = await submitInquiry("nope");

    expect(result.ok).toBe(false);
    expect(insertInquiry).not.toHaveBeenCalled();
  });
});

describe("submitInquiry — repository failure", () => {
  it("returns a form-level error when nothing was written", async () => {
    insertInquiry.mockResolvedValue(null);

    const result = await submitInquiry(validInput());

    expect(result).toEqual({
      ok: false,
      fieldErrors: {},
      formError: "The message could not be saved. Please try again.",
    });
  });

  it("lets a thrown database error propagate to the caller", async () => {
    insertInquiry.mockRejectedValue(new Error("connection lost"));

    await expect(submitInquiry(validInput())).rejects.toThrow("connection lost");
  });
});

describe("inquirySchema", () => {
  it("is exported for reuse and trims nothing it was not asked to trim", () => {
    const parsed = inquirySchema.safeParse(validInput({ name: "  Aiden  " }));

    expect(parsed.success).toBe(true);
    if (!parsed.success) throw new Error("expected success");
    expect(parsed.data.name).toBe("  Aiden  ");
  });
});
