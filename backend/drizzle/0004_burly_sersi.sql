ALTER TABLE `nodes` ADD `position_x` real;--> statement-breakpoint
ALTER TABLE `nodes` ADD `position_y` real;--> statement-breakpoint
ALTER TABLE `subscriptions` ADD `ai_generations_used` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `subscriptions` ADD `ai_usage_month` text;