CREATE TABLE `voice_sessions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`session_id` text NOT NULL,
	`page_type` text,
	`voice_mode` text,
	`entity_slug` text,
	`duration_ms` integer,
	`status` text NOT NULL,
	`error_message` text,
	`started_at` integer NOT NULL,
	`ended_at` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `voice_sessions_session_id_unique` ON `voice_sessions` (`session_id`);--> statement-breakpoint
CREATE INDEX `voice_sessions_session_id_idx` ON `voice_sessions` (`session_id`);--> statement-breakpoint
CREATE INDEX `voice_sessions_status_idx` ON `voice_sessions` (`status`);--> statement-breakpoint
CREATE INDEX `voice_sessions_started_at_idx` ON `voice_sessions` (`started_at`);