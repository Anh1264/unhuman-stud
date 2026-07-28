CREATE TABLE "character_translations" (
	"character_id" uuid NOT NULL,
	"locale" text DEFAULT 'en' NOT NULL,
	"name" text NOT NULL,
	"epithet" text,
	"traits" jsonb,
	CONSTRAINT "character_translations_character_id_locale_pk" PRIMARY KEY("character_id","locale")
);
--> statement-breakpoint
CREATE TABLE "characters" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"slug" text NOT NULL,
	"image_asset_id" uuid,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "project_world_field_translations" (
	"field_id" uuid NOT NULL,
	"locale" text DEFAULT 'en' NOT NULL,
	"label" text NOT NULL,
	"value" text,
	CONSTRAINT "project_world_field_translations_field_id_locale_pk" PRIMARY KEY("field_id","locale")
);
--> statement-breakpoint
CREATE TABLE "project_world_fields" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "character_translations" ADD CONSTRAINT "character_translations_character_id_characters_id_fk" FOREIGN KEY ("character_id") REFERENCES "public"."characters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "characters" ADD CONSTRAINT "characters_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "characters" ADD CONSTRAINT "characters_image_asset_id_media_assets_id_fk" FOREIGN KEY ("image_asset_id") REFERENCES "public"."media_assets"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_world_field_translations" ADD CONSTRAINT "project_world_field_translations_field_id_project_world_fields_id_fk" FOREIGN KEY ("field_id") REFERENCES "public"."project_world_fields"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_world_fields" ADD CONSTRAINT "project_world_fields_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "characters_project_slug_idx" ON "characters" USING btree ("project_id","slug");--> statement-breakpoint
CREATE INDEX "characters_sort_idx" ON "characters" USING btree ("project_id","sort_order");--> statement-breakpoint
CREATE INDEX "project_world_fields_sort_idx" ON "project_world_fields" USING btree ("project_id","sort_order");