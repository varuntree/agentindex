DROP INDEX `sales_agent_sale_date_idx`;--> statement-breakpoint
CREATE INDEX `sales_agent_date_idx` ON `sales` (`agent_id`,`sale_date`);--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_agent_suburbs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`agent_id` integer NOT NULL,
	`suburb_id` integer NOT NULL,
	`is_primary` integer DEFAULT false,
	`sales_count` integer DEFAULT 0,
	FOREIGN KEY (`agent_id`) REFERENCES `agents`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`suburb_id`) REFERENCES `suburbs`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_agent_suburbs`("id", "agent_id", "suburb_id", "is_primary", "sales_count") SELECT "id", "agent_id", "suburb_id", "is_primary", "sales_count" FROM `agent_suburbs`;--> statement-breakpoint
DROP TABLE `agent_suburbs`;--> statement-breakpoint
ALTER TABLE `__new_agent_suburbs` RENAME TO `agent_suburbs`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `agent_suburbs_agent_suburb_idx` ON `agent_suburbs` (`agent_id`,`suburb_id`);--> statement-breakpoint
CREATE INDEX `agent_suburbs_suburb_id_idx` ON `agent_suburbs` (`suburb_id`);--> statement-breakpoint
CREATE INDEX `agent_suburbs_agent_id_idx` ON `agent_suburbs` (`agent_id`);--> statement-breakpoint
CREATE TABLE `__new_pipeline_runs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`started_at` integer NOT NULL,
	`completed_at` integer,
	`status` text DEFAULT 'pending' NOT NULL,
	`agent_model` text,
	`target_location` text,
	`agencies_found` integer DEFAULT 0,
	`agents_found` integer DEFAULT 0,
	`sales_found` integer DEFAULT 0,
	`reviews_found` integer DEFAULT 0,
	`total_cost_usd` real DEFAULT 0,
	`error_log` text,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_pipeline_runs`("id", "started_at", "completed_at", "status", "agent_model", "target_location", "agencies_found", "agents_found", "sales_found", "reviews_found", "total_cost_usd", "error_log", "created_at") SELECT "id", "started_at", "completed_at", "status", "agent_model", "target_location", "agencies_found", "agents_found", "sales_found", "reviews_found", "total_cost_usd", "error_log", "created_at" FROM `pipeline_runs`;--> statement-breakpoint
DROP TABLE `pipeline_runs`;--> statement-breakpoint
ALTER TABLE `__new_pipeline_runs` RENAME TO `pipeline_runs`;--> statement-breakpoint
CREATE INDEX `pipeline_runs_status_idx` ON `pipeline_runs` (`status`);--> statement-breakpoint
CREATE INDEX `pipeline_runs_started_at_idx` ON `pipeline_runs` (`started_at`);