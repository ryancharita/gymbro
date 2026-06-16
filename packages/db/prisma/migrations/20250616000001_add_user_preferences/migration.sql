-- AlterTable
ALTER TABLE "users" ADD COLUMN "experience_level" TEXT,
ADD COLUMN "training_style_tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "goals" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "notify_on_follow" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "notify_on_like" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "notify_on_comment" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "notify_weekly_summary" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "opt_out_buddy_finder" BOOLEAN NOT NULL DEFAULT false;
