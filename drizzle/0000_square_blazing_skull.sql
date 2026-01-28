CREATE TABLE `agencies` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`slug` text NOT NULL,
	`name` text NOT NULL,
	`brand_name` text,
	`logo_url` text,
	`website_url` text,
	`phone` text,
	`email` text,
	`street_address` text,
	`suburb` text,
	`state` text,
	`postcode` text,
	`lat` real,
	`lng` real,
	`description` text,
	`total_agents` integer DEFAULT 0,
	`total_sales_count` integer DEFAULT 0,
	`total_sales_volume` real DEFAULT 0,
	`source_url` text,
	`last_scraped_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `agencies_slug_unique` ON `agencies` (`slug`);--> statement-breakpoint
CREATE UNIQUE INDEX `agencies_slug_idx` ON `agencies` (`slug`);--> statement-breakpoint
CREATE INDEX `agencies_state_idx` ON `agencies` (`state`);--> statement-breakpoint
CREATE INDEX `agencies_postcode_idx` ON `agencies` (`postcode`);--> statement-breakpoint
CREATE TABLE `agent_suburbs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`agent_id` integer NOT NULL,
	`suburb_id` integer NOT NULL,
	`is_primary` integer DEFAULT 0,
	`sales_count` integer DEFAULT 0,
	FOREIGN KEY (`agent_id`) REFERENCES `agents`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`suburb_id`) REFERENCES `suburbs`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `agent_suburbs_agent_suburb_idx` ON `agent_suburbs` (`agent_id`,`suburb_id`);--> statement-breakpoint
CREATE TABLE `agents` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`slug` text NOT NULL,
	`first_name` text NOT NULL,
	`last_name` text NOT NULL,
	`full_name` text NOT NULL,
	`email` text,
	`phone` text,
	`mobile_phone` text,
	`photo_url` text,
	`license_number` text,
	`license_status` text,
	`license_state` text,
	`agency_id` integer,
	`bio` text,
	`years_active` integer,
	`languages_spoken` text,
	`specializations` text,
	`suburbs_serviced` text,
	`total_sales_count` integer DEFAULT 0,
	`total_sales_volume` real DEFAULT 0,
	`median_sale_price` real,
	`average_days_on_market` real,
	`listing_accuracy` real,
	`ratings_average` real,
	`ratings_count` integer DEFAULT 0,
	`profile_completeness` real DEFAULT 0,
	`data_quality_score` real DEFAULT 0,
	`source_url` text,
	`last_scraped_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`agency_id`) REFERENCES `agencies`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `agents_slug_unique` ON `agents` (`slug`);--> statement-breakpoint
CREATE UNIQUE INDEX `agents_slug_idx` ON `agents` (`slug`);--> statement-breakpoint
CREATE INDEX `agents_agency_id_idx` ON `agents` (`agency_id`);--> statement-breakpoint
CREATE INDEX `agents_license_number_idx` ON `agents` (`license_number`);--> statement-breakpoint
CREATE INDEX `agents_license_state_idx` ON `agents` (`license_state`);--> statement-breakpoint
CREATE INDEX `agents_ratings_average_idx` ON `agents` (`ratings_average`);--> statement-breakpoint
CREATE INDEX `agents_total_sales_count_idx` ON `agents` (`total_sales_count`);--> statement-breakpoint
CREATE INDEX `agents_data_quality_score_idx` ON `agents` (`data_quality_score`);--> statement-breakpoint
CREATE TABLE `pipeline_runs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`started_at` integer,
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
CREATE INDEX `pipeline_runs_status_idx` ON `pipeline_runs` (`status`);--> statement-breakpoint
CREATE INDEX `pipeline_runs_started_at_idx` ON `pipeline_runs` (`started_at`);--> statement-breakpoint
CREATE TABLE `reviews` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`agent_id` integer NOT NULL,
	`reviewer_name` text,
	`review_date` text,
	`reviewer_type` text,
	`overall_rating` real NOT NULL,
	`knowledge_rating` real,
	`communication_rating` real,
	`negotiation_rating` real,
	`review_text` text,
	`price_range` text,
	`source_url` text,
	`source_platform` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`agent_id`) REFERENCES `agents`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `reviews_agent_id_idx` ON `reviews` (`agent_id`);--> statement-breakpoint
CREATE INDEX `reviews_overall_rating_idx` ON `reviews` (`overall_rating`);--> statement-breakpoint
CREATE INDEX `reviews_review_date_idx` ON `reviews` (`review_date`);--> statement-breakpoint
CREATE TABLE `sales` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`agent_id` integer NOT NULL,
	`agency_id` integer,
	`property_address` text NOT NULL,
	`suburb` text,
	`state` text,
	`postcode` text,
	`property_type` text,
	`sale_price` real,
	`listing_price` real,
	`sale_method` text,
	`sale_date` text,
	`days_on_market` integer,
	`bedrooms` integer,
	`bathrooms` integer,
	`car_spaces` integer,
	`land_area` real,
	`floor_area` real,
	`image_url` text,
	`source_url` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`agent_id`) REFERENCES `agents`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`agency_id`) REFERENCES `agencies`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `sales_agent_id_idx` ON `sales` (`agent_id`);--> statement-breakpoint
CREATE INDEX `sales_agency_id_idx` ON `sales` (`agency_id`);--> statement-breakpoint
CREATE INDEX `sales_suburb_idx` ON `sales` (`suburb`);--> statement-breakpoint
CREATE INDEX `sales_sale_date_idx` ON `sales` (`sale_date`);--> statement-breakpoint
CREATE INDEX `sales_property_type_idx` ON `sales` (`property_type`);--> statement-breakpoint
CREATE INDEX `sales_agent_sale_date_idx` ON `sales` (`agent_id`,`sale_date`);--> statement-breakpoint
CREATE TABLE `suburbs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`slug` text NOT NULL,
	`name` text NOT NULL,
	`state` text NOT NULL,
	`postcode` text NOT NULL,
	`lat` real,
	`lng` real,
	`local_government_area` text,
	`state_electorate` text,
	`total_agents` integer DEFAULT 0,
	`median_house_price` real,
	`median_unit_price` real,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `suburbs_slug_unique` ON `suburbs` (`slug`);--> statement-breakpoint
CREATE UNIQUE INDEX `suburbs_slug_idx` ON `suburbs` (`slug`);--> statement-breakpoint
CREATE INDEX `suburbs_state_idx` ON `suburbs` (`state`);--> statement-breakpoint
CREATE INDEX `suburbs_postcode_idx` ON `suburbs` (`postcode`);--> statement-breakpoint
CREATE INDEX `suburbs_name_state_idx` ON `suburbs` (`name`,`state`);