CREATE TABLE IF NOT EXISTS "guild" (
	"id" text PRIMARY KEY NOT NULL,
	"created" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user" (
	"id" text PRIMARY KEY NOT NULL,
	"created" timestamp NOT NULL
);
