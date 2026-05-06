CREATE TABLE `billing_accounts` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`stripe_customer_id` text,
	`credit_balance` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `billing_accounts_user_id_unique` ON `billing_accounts` (`user_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `billing_accounts_stripe_customer_id_unique` ON `billing_accounts` (`stripe_customer_id`);--> statement-breakpoint
DROP TABLE `subscriptions`;