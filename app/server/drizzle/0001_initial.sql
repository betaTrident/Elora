CREATE TABLE `activity_logs` (
	`id` varchar(36) NOT NULL DEFAULT (UUID()),
	`shop_id` varchar(36) NOT NULL,
	`actor_type` enum('merchant','system') NOT NULL DEFAULT 'merchant',
	`actor_id` varchar(255),
	`action` varchar(100) NOT NULL,
	`entity_type` varchar(50) NOT NULL,
	`entity_id` varchar(36),
	`summary` text NOT NULL,
	`before_json` json,
	`after_json` json,
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `activity_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `alerts` (
	`id` varchar(36) NOT NULL DEFAULT (UUID()),
	`shop_id` varchar(36) NOT NULL,
	`ritual_id` varchar(36) NOT NULL,
	`type` enum('low_score','component_unavailable') NOT NULL,
	`severity` enum('warning','critical') NOT NULL DEFAULT 'warning',
	`message` text NOT NULL,
	`status` enum('open','resolved') NOT NULL DEFAULT 'open',
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`resolved_at` datetime,
	CONSTRAINT `alerts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `shops` (
	`id` varchar(36) NOT NULL DEFAULT (UUID()),
	`shop_domain` varchar(255) NOT NULL,
	`access_token` text NOT NULL,
	`scope` varchar(500),
	`installed_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`uninstalled_at` datetime,
	CONSTRAINT `shops_id` PRIMARY KEY(`id`),
	CONSTRAINT `shops_shop_domain_unique` UNIQUE(`shop_domain`)
);
--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` varchar(255) NOT NULL,
	`shop` varchar(255) NOT NULL,
	`state` varchar(255),
	`is_online` boolean NOT NULL DEFAULT false,
	`scope` varchar(500),
	`expires` datetime,
	`access_token` text,
	`user_id` varchar(255),
	CONSTRAINT `sessions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `shop_settings` (
	`shop_id` varchar(36) NOT NULL,
	`default_threshold` int NOT NULL DEFAULT 70,
	CONSTRAINT `shop_settings_shop_id` PRIMARY KEY(`shop_id`)
);
--> statement-breakpoint
CREATE TABLE `rituals` (
	`id` varchar(36) NOT NULL DEFAULT (UUID()),
	`shop_id` varchar(36) NOT NULL,
	`title` varchar(120) NOT NULL,
	`description` text,
	`status` enum('active','archived') NOT NULL DEFAULT 'active',
	`score_threshold` int NOT NULL DEFAULT 70,
	`last_score` int,
	`last_scored_at` datetime,
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `rituals_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ritual_components` (
	`id` varchar(36) NOT NULL DEFAULT (UUID()),
	`ritual_id` varchar(36) NOT NULL,
	`shopify_product_id` varchar(100) NOT NULL,
	`shopify_variant_id` varchar(100),
	`product_title_cache` varchar(255),
	`role` enum('cleanse','treat','seal','scent') NOT NULL,
	`quantity` int NOT NULL DEFAULT 1,
	`unit_cost` decimal(10,2),
	`sort_order` int NOT NULL DEFAULT 0,
	CONSTRAINT `ritual_components_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `score_snapshots` (
	`id` varchar(36) NOT NULL DEFAULT (UUID()),
	`ritual_id` varchar(36) NOT NULL,
	`score` int NOT NULL,
	`breakdown_json` json NOT NULL,
	`computed_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `score_snapshots_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `activity_logs` ADD CONSTRAINT `activity_logs_shop_id_shops_id_fk` FOREIGN KEY (`shop_id`) REFERENCES `shops`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `alerts` ADD CONSTRAINT `alerts_shop_id_shops_id_fk` FOREIGN KEY (`shop_id`) REFERENCES `shops`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `alerts` ADD CONSTRAINT `alerts_ritual_id_rituals_id_fk` FOREIGN KEY (`ritual_id`) REFERENCES `rituals`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `shop_settings` ADD CONSTRAINT `shop_settings_shop_id_shops_id_fk` FOREIGN KEY (`shop_id`) REFERENCES `shops`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `rituals` ADD CONSTRAINT `rituals_shop_id_shops_id_fk` FOREIGN KEY (`shop_id`) REFERENCES `shops`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `ritual_components` ADD CONSTRAINT `ritual_components_ritual_id_rituals_id_fk` FOREIGN KEY (`ritual_id`) REFERENCES `rituals`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `score_snapshots` ADD CONSTRAINT `score_snapshots_ritual_id_rituals_id_fk` FOREIGN KEY (`ritual_id`) REFERENCES `rituals`(`id`) ON DELETE no action ON UPDATE no action;