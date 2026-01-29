CREATE TABLE `pipeline_events` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`run_id` integer NOT NULL,
	`type` text NOT NULL,
	`phase` integer,
	`sub_agent_id` integer,
	`message` text,
	`payload_json` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`run_id`) REFERENCES `pipeline_runs`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `pipeline_events_run_id_idx` ON `pipeline_events` (`run_id`);--> statement-breakpoint
CREATE INDEX `pipeline_events_type_idx` ON `pipeline_events` (`type`);--> statement-breakpoint
CREATE INDEX `pipeline_events_created_at_idx` ON `pipeline_events` (`created_at`);--> statement-breakpoint
CREATE TABLE `pipeline_sub_agents` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`run_id` integer NOT NULL,
	`sub_agent_id` integer NOT NULL,
	`status` text DEFAULT 'running' NOT NULL,
	`agent_names_json` text,
	`goals_json` text,
	`error` text,
	`started_at` integer NOT NULL,
	`completed_at` integer,
	FOREIGN KEY (`run_id`) REFERENCES `pipeline_runs`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `pipeline_sub_agents_run_id_idx` ON `pipeline_sub_agents` (`run_id`);--> statement-breakpoint
CREATE INDEX `pipeline_sub_agents_run_sub_idx` ON `pipeline_sub_agents` (`run_id`,`sub_agent_id`);--> statement-breakpoint
CREATE INDEX `pipeline_sub_agents_status_idx` ON `pipeline_sub_agents` (`status`);--> statement-breakpoint
ALTER TABLE `pipeline_runs` ADD `request_json` text;