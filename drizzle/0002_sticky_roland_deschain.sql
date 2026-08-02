CREATE TYPE "public"."prompt_asset_kind" AS ENUM('IMAGE', 'VIDEO');--> statement-breakpoint
CREATE TYPE "public"."prompt_asset_role" AS ENUM('REFERENCE', 'OUTPUT');--> statement-breakpoint
CREATE TYPE "public"."prompt_status" AS ENUM('DRAFT', 'TESTED', 'PROVEN', 'ABANDONED');--> statement-breakpoint
CREATE TABLE "prompt_assets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"entry_id" uuid NOT NULL,
	"role" "prompt_asset_role" NOT NULL,
	"kind" "prompt_asset_kind" DEFAULT 'IMAGE' NOT NULL,
	"file" text NOT NULL,
	"url" text,
	"storage_key" text,
	"width" integer,
	"height" integer,
	"bytes" integer,
	"mime_type" text,
	"blur_data_url" text,
	"note" text,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "prompt_blocks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"entry_id" uuid NOT NULL,
	"label" text NOT NULL,
	"text" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "prompt_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"entry_date" date NOT NULL,
	"status" "prompt_status" DEFAULT 'DRAFT' NOT NULL,
	"prompt_text" text NOT NULL,
	"tool" text,
	"derived_from_id" uuid,
	"outcome_rating" integer,
	"outcome_worked" text,
	"outcome_failed" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "prompt_tags" (
	"entry_id" uuid NOT NULL,
	"tag" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "prompt_tags_entry_id_tag_pk" PRIMARY KEY("entry_id","tag")
);
--> statement-breakpoint
ALTER TABLE "prompt_assets" ADD CONSTRAINT "prompt_assets_entry_id_prompt_entries_id_fk" FOREIGN KEY ("entry_id") REFERENCES "public"."prompt_entries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prompt_blocks" ADD CONSTRAINT "prompt_blocks_entry_id_prompt_entries_id_fk" FOREIGN KEY ("entry_id") REFERENCES "public"."prompt_entries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prompt_entries" ADD CONSTRAINT "prompt_entries_derived_from_id_prompt_entries_id_fk" FOREIGN KEY ("derived_from_id") REFERENCES "public"."prompt_entries"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prompt_tags" ADD CONSTRAINT "prompt_tags_entry_id_prompt_entries_id_fk" FOREIGN KEY ("entry_id") REFERENCES "public"."prompt_entries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "prompt_assets_sort_idx" ON "prompt_assets" USING btree ("entry_id","role","sort_order");--> statement-breakpoint
CREATE INDEX "prompt_blocks_sort_idx" ON "prompt_blocks" USING btree ("entry_id","sort_order");--> statement-breakpoint
CREATE UNIQUE INDEX "prompt_entries_slug_idx" ON "prompt_entries" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "prompt_entries_date_idx" ON "prompt_entries" USING btree ("entry_date");--> statement-breakpoint
CREATE INDEX "prompt_tags_tag_idx" ON "prompt_tags" USING btree ("tag");