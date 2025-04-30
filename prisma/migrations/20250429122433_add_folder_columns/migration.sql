-- AlterTable
ALTER TABLE "resources" ADD COLUMN     "is_folder" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "parent_folder" TEXT;
