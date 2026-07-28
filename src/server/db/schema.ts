import {
  pgTable,
  pgEnum,
  uuid,
  text,
  integer,
  boolean,
  timestamp,
  jsonb,
  primaryKey,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

/* ============================================================
   ENUMS
   ============================================================ */

export const userRole = pgEnum("user_role", ["ADMIN", "EDITOR"]);

export const publishStatus = pgEnum("publish_status", [
  "DRAFT",
  "PUBLISHED",
  "ARCHIVED",
]);

export const projectKind = pgEnum("project_kind", [
  "ORIGINAL_FILM",
  "COMMISSIONED",
  "CLIENT_WORK",
  "STUDIO_BRAND",
  "ENGINEERING",
]);

export const filmKind = pgEnum("film_kind", ["FEATURE", "SHORT"]);

export const orientation = pgEnum("orientation", ["LANDSCAPE", "VERTICAL"]);

/**
 * Where a video actually lives. `SELF` means a file we serve from /public
 * (or object storage later); the others are third-party players.
 * Storing this as a column is what makes moving a film from self-hosted to
 * Mux/Cloudflare a data change rather than a code change.
 */
export const videoProvider = pgEnum("video_provider", [
  "SELF",
  "YOUTUBE",
  "VIMEO",
  "MUX",
]);

export const mediaKind = pgEnum("media_kind", ["IMAGE", "VIDEO_POSTER"]);

export const inquiryStatus = pgEnum("inquiry_status", [
  "NEW",
  "READ",
  "REPLIED",
  "ARCHIVED",
]);

/** Every translatable row is keyed by this. v1 only ever writes 'en'. */
export const DEFAULT_LOCALE = "en" as const;

/* ============================================================
   GALLERY SECTIONS
   ============================================================ */

/**
 * A gallery image is one of three things, and the pages lay each out
 * differently: key art is portrait and gets room, frames are stills lifted from
 * a film, and design sheets are documents rather than shots.
 *
 * `gallery_items` has no section column, so the sort order carries it:
 * `project * 1000 + section * 100 + index`. That keeps ordering and grouping in
 * the one number the table already sorts by, and keeps the encode/decode pair
 * here rather than spread between the seed and the pages.
 */
export const GALLERY_SECTIONS = ["KEY_ART", "FRAME", "DESIGN"] as const;

export type GallerySection = (typeof GALLERY_SECTIONS)[number];

export function gallerySortOrder(
  projectOrder: number,
  section: GallerySection,
  index: number,
): number {
  return projectOrder * 1000 + GALLERY_SECTIONS.indexOf(section) * 100 + index;
}

/** Inverse of {@link gallerySortOrder}. Unrecognised orders read as frames. */
export function gallerySection(
  sortOrder: number | null | undefined,
): GallerySection {
  if (typeof sortOrder !== "number") return "FRAME";
  return GALLERY_SECTIONS[Math.floor(sortOrder / 100) % 10] ?? "FRAME";
}

/* ============================================================
   USERS  (shape kept Auth.js-compatible for the admin phase)
   ============================================================ */

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  name: text("name"),
  image: text("image"),
  role: userRole("role").notNull().default("EDITOR"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

/* ============================================================
   MEDIA
   ============================================================ */

export const mediaAssets = pgTable(
  "media_assets",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    kind: mediaKind("kind").notNull().default("IMAGE"),
    /** Path or key. Today: a /public path. Later: an object-storage key. */
    storageKey: text("storage_key").notNull(),
    url: text("url").notNull(),
    width: integer("width").notNull(),
    height: integer("height").notNull(),
    bytes: integer("bytes"),
    mimeType: text("mime_type").notNull().default("image/png"),
    /** Tiny inline placeholder so images fade in instead of popping. */
    blurDataUrl: text("blur_data_url"),
    uploadedById: uuid("uploaded_by_id").references(() => users.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [uniqueIndex("media_assets_storage_key_idx").on(t.storageKey)],
);

export const mediaAssetTranslations = pgTable(
  "media_asset_translations",
  {
    assetId: uuid("asset_id")
      .notNull()
      .references(() => mediaAssets.id, { onDelete: "cascade" }),
    locale: text("locale").notNull().default(DEFAULT_LOCALE),
    /** Required by the upload validator — alt text is not optional. */
    altText: text("alt_text").notNull(),
    caption: text("caption"),
  },
  (t) => [primaryKey({ columns: [t.assetId, t.locale] })],
);

/* ============================================================
   PROJECTS
   ============================================================ */

export const projects = pgTable(
  "projects",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: text("slug").notNull(),
    kind: projectKind("kind").notNull(),
    status: publishStatus("status").notNull().default("DRAFT"),
    year: integer("year"),
    featured: boolean("featured").notNull().default(false),
    sortOrder: integer("sort_order").notNull().default(0),
    coverAssetId: uuid("cover_asset_id").references(() => mediaAssets.id, {
      onDelete: "set null",
    }),
    /** Free-form accent hex pulled from the artwork, used for per-project theming. */
    accentColor: text("accent_color"),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("projects_slug_idx").on(t.slug),
    index("projects_status_published_idx").on(t.status, t.publishedAt),
    index("projects_sort_idx").on(t.sortOrder),
  ],
);

export const projectTranslations = pgTable(
  "project_translations",
  {
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    locale: text("locale").notNull().default(DEFAULT_LOCALE),
    title: text("title").notNull(),
    /** Secondary title — e.g. a Vietnamese title shown alongside the English one. */
    titleAlt: text("title_alt"),
    tagline: text("tagline"),
    summary: text("summary").notNull(),
    body: text("body"),
    seoTitle: text("seo_title"),
    seoDescription: text("seo_description"),
  },
  (t) => [primaryKey({ columns: [t.projectId, t.locale] })],
);

/* ============================================================
   FILMS
   ============================================================ */

export const films = pgTable(
  "films",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: text("slug").notNull(),
    projectId: uuid("project_id").references(() => projects.id, {
      onDelete: "set null",
    }),
    kind: filmKind("kind").notNull().default("SHORT"),
    orientation: orientation("orientation").notNull().default("LANDSCAPE"),
    provider: videoProvider("provider").notNull().default("SELF"),
    /** For SELF this is a path under /public; for YOUTUBE it is the video id. */
    providerVideoId: text("provider_video_id").notNull(),
    durationSeconds: integer("duration_seconds"),
    width: integer("width"),
    height: integer("height"),
    posterAssetId: uuid("poster_asset_id").references(() => mediaAssets.id, {
      onDelete: "set null",
    }),
    status: publishStatus("status").notNull().default("DRAFT"),
    featured: boolean("featured").notNull().default(false),
    sortOrder: integer("sort_order").notNull().default(0),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("films_slug_idx").on(t.slug),
    index("films_status_published_idx").on(t.status, t.publishedAt),
  ],
);

export const filmTranslations = pgTable(
  "film_translations",
  {
    filmId: uuid("film_id")
      .notNull()
      .references(() => films.id, { onDelete: "cascade" }),
    locale: text("locale").notNull().default(DEFAULT_LOCALE),
    title: text("title").notNull(),
    titleAlt: text("title_alt"),
    description: text("description"),
  },
  (t) => [primaryKey({ columns: [t.filmId, t.locale] })],
);

/* ============================================================
   GALLERY
   ============================================================ */

export const galleryItems = pgTable(
  "gallery_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    assetId: uuid("asset_id")
      .notNull()
      .references(() => mediaAssets.id, { onDelete: "cascade" }),
    projectId: uuid("project_id").references(() => projects.id, {
      onDelete: "cascade",
    }),
    status: publishStatus("status").notNull().default("PUBLISHED"),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("gallery_items_sort_idx").on(t.sortOrder)],
);

/* ============================================================
   CHARACTERS
   ============================================================ */

/**
 * A character in a project's film. First-class rather than a caption on a
 * gallery image: the design sheet is one *view* of a character, and the name,
 * the epithet and the trait words are the character itself.
 *
 * Everything the owner has not written yet is nullable, so a character that is
 * only a name and a sheet is a valid row rather than a half-filled one.
 */
export const characters = pgTable(
  "characters",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    /** Stable key within the project — "nu", "tib". */
    slug: text("slug").notNull(),
    /** The character sheet or portrait, when there is one. */
    imageAssetId: uuid("image_asset_id").references(() => mediaAssets.id, {
      onDelete: "set null",
    }),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("characters_project_slug_idx").on(t.projectId, t.slug),
    index("characters_sort_idx").on(t.projectId, t.sortOrder),
  ],
);

export const characterTranslations = pgTable(
  "character_translations",
  {
    characterId: uuid("character_id")
      .notNull()
      .references(() => characters.id, { onDelete: "cascade" }),
    locale: text("locale").notNull().default(DEFAULT_LOCALE),
    /** Display name — "NU", "TIB". */
    name: text("name").notNull(),
    /** Short role line, e.g. "The one who …". Null until it is written. */
    epithet: text("epithet"),
    /**
     * Ordered list of one-to-three-word trait words. An ordered array of bare
     * strings is exactly the shape the UI renders, and the words carry no other
     * attributes, so they live with the rest of the character's copy rather
     * than in a table of their own.
     */
    traits: jsonb("traits").$type<string[]>(),
  },
  (t) => [primaryKey({ columns: [t.characterId, t.locale] })],
);

/* ============================================================
   WORLD FIELDS
   ============================================================ */

/**
 * In-world metadata for a project — "SETTING", "TONE", and whatever else the
 * film wants to state about itself. The labels are bespoke per project, so this
 * is an ordered list of label/value pairs rather than a fixed set of columns:
 * adding a field to one project must not add a null column to every other.
 */
export const projectWorldFields = pgTable(
  "project_world_fields",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("project_world_fields_sort_idx").on(t.projectId, t.sortOrder)],
);

export const projectWorldFieldTranslations = pgTable(
  "project_world_field_translations",
  {
    fieldId: uuid("field_id")
      .notNull()
      .references(() => projectWorldFields.id, { onDelete: "cascade" }),
    locale: text("locale").notNull().default(DEFAULT_LOCALE),
    /** The small caps label — "SETTING", "TONE". */
    label: text("label").notNull(),
    /** Short string. Nullable so a labelled-but-unwritten field is still valid. */
    value: text("value"),
  },
  (t) => [primaryKey({ columns: [t.fieldId, t.locale] })],
);

/* ============================================================
   TAGS
   ============================================================ */

export const tags = pgTable(
  "tags",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: text("slug").notNull(),
  },
  (t) => [uniqueIndex("tags_slug_idx").on(t.slug)],
);

export const tagTranslations = pgTable(
  "tag_translations",
  {
    tagId: uuid("tag_id")
      .notNull()
      .references(() => tags.id, { onDelete: "cascade" }),
    locale: text("locale").notNull().default(DEFAULT_LOCALE),
    label: text("label").notNull(),
  },
  (t) => [primaryKey({ columns: [t.tagId, t.locale] })],
);

export const projectTags = pgTable(
  "project_tags",
  {
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    tagId: uuid("tag_id")
      .notNull()
      .references(() => tags.id, { onDelete: "cascade" }),
    sortOrder: integer("sort_order").notNull().default(0),
  },
  (t) => [primaryKey({ columns: [t.projectId, t.tagId] })],
);

/* ============================================================
   INQUIRIES  (contact form persistence)
   ============================================================ */

export const inquiries = pgTable(
  "inquiries",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    email: text("email").notNull(),
    message: text("message").notNull(),
    scope: text("scope"),
    timelineNote: text("timeline_note"),
    referenceLinks: text("reference_links"),
    status: inquiryStatus("status").notNull().default("NEW"),
    /** Hashed, never raw — we want rate limiting without storing personal data. */
    ipHash: text("ip_hash"),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("inquiries_status_created_idx").on(t.status, t.createdAt)],
);

/* ============================================================
   AUDIT LOG
   ============================================================ */

export const auditLogs = pgTable("audit_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  actorId: uuid("actor_id").references(() => users.id, { onDelete: "set null" }),
  action: text("action").notNull(),
  entityType: text("entity_type").notNull(),
  entityId: text("entity_id"),
  before: jsonb("before"),
  after: jsonb("after"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

/* ============================================================
   SITE SETTINGS  (singleton)
   ============================================================ */

export const siteSettings = pgTable("site_settings", {
  id: text("id").primaryKey().default("singleton"),
  contactEmail: text("contact_email").notNull(),
  socials: jsonb("socials").$type<{ label: string; handle: string; url: string }[]>(),
  resumeUrl: text("resume_url"),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

/* ============================================================
   RELATIONS
   ============================================================ */

export const projectsRelations = relations(projects, ({ one, many }) => ({
  translations: many(projectTranslations),
  cover: one(mediaAssets, {
    fields: [projects.coverAssetId],
    references: [mediaAssets.id],
  }),
  films: many(films),
  galleryItems: many(galleryItems),
  projectTags: many(projectTags),
  characters: many(characters),
  worldFields: many(projectWorldFields),
}));

export const charactersRelations = relations(characters, ({ one, many }) => ({
  translations: many(characterTranslations),
  project: one(projects, {
    fields: [characters.projectId],
    references: [projects.id],
  }),
  image: one(mediaAssets, {
    fields: [characters.imageAssetId],
    references: [mediaAssets.id],
  }),
}));

export const characterTranslationsRelations = relations(
  characterTranslations,
  ({ one }) => ({
    character: one(characters, {
      fields: [characterTranslations.characterId],
      references: [characters.id],
    }),
  }),
);

export const projectWorldFieldsRelations = relations(
  projectWorldFields,
  ({ one, many }) => ({
    translations: many(projectWorldFieldTranslations),
    project: one(projects, {
      fields: [projectWorldFields.projectId],
      references: [projects.id],
    }),
  }),
);

export const projectWorldFieldTranslationsRelations = relations(
  projectWorldFieldTranslations,
  ({ one }) => ({
    field: one(projectWorldFields, {
      fields: [projectWorldFieldTranslations.fieldId],
      references: [projectWorldFields.id],
    }),
  }),
);

export const projectTranslationsRelations = relations(
  projectTranslations,
  ({ one }) => ({
    project: one(projects, {
      fields: [projectTranslations.projectId],
      references: [projects.id],
    }),
  }),
);

export const filmsRelations = relations(films, ({ one, many }) => ({
  translations: many(filmTranslations),
  project: one(projects, {
    fields: [films.projectId],
    references: [projects.id],
  }),
  poster: one(mediaAssets, {
    fields: [films.posterAssetId],
    references: [mediaAssets.id],
  }),
}));

export const filmTranslationsRelations = relations(
  filmTranslations,
  ({ one }) => ({
    film: one(films, {
      fields: [filmTranslations.filmId],
      references: [films.id],
    }),
  }),
);

export const mediaAssetsRelations = relations(mediaAssets, ({ many }) => ({
  translations: many(mediaAssetTranslations),
}));

export const mediaAssetTranslationsRelations = relations(
  mediaAssetTranslations,
  ({ one }) => ({
    asset: one(mediaAssets, {
      fields: [mediaAssetTranslations.assetId],
      references: [mediaAssets.id],
    }),
  }),
);

export const galleryItemsRelations = relations(galleryItems, ({ one }) => ({
  asset: one(mediaAssets, {
    fields: [galleryItems.assetId],
    references: [mediaAssets.id],
  }),
  project: one(projects, {
    fields: [galleryItems.projectId],
    references: [projects.id],
  }),
}));

export const tagsRelations = relations(tags, ({ many }) => ({
  translations: many(tagTranslations),
  projectTags: many(projectTags),
}));

export const tagTranslationsRelations = relations(tagTranslations, ({ one }) => ({
  tag: one(tags, { fields: [tagTranslations.tagId], references: [tags.id] }),
}));

export const projectTagsRelations = relations(projectTags, ({ one }) => ({
  project: one(projects, {
    fields: [projectTags.projectId],
    references: [projects.id],
  }),
  tag: one(tags, { fields: [projectTags.tagId], references: [tags.id] }),
}));
