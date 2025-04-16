-- CreateEnum
CREATE TYPE "Role" AS ENUM ('user', 'admin', 'member');

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "sid" TEXT NOT NULL,
    "data" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "board" (
    "message_id" SERIAL NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "text" TEXT NOT NULL,
    "message_created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "title" TEXT NOT NULL,

    CONSTRAINT "board_pkey" PRIMARY KEY ("message_id")
);

-- CreateTable
CREATE TABLE "users" (
    "user_id" SERIAL NOT NULL,
    "first_name" VARCHAR(50) NOT NULL,
    "last_name" VARCHAR(50) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" "Role" DEFAULT 'user',
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "visits" INTEGER DEFAULT 1,

    CONSTRAINT "users_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "resources" (
    "resource_id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "url_address" TEXT NOT NULL,
    "public_id" VARCHAR(255) NOT NULL,
    "resource_type" VARCHAR(50) NOT NULL DEFAULT 'image',
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB,

    CONSTRAINT "resources_pkey" PRIMARY KEY ("resource_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Session_sid_key" ON "Session"("sid");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "resources_public_id_key" ON "resources"("public_id");

-- AddForeignKey
ALTER TABLE "board" ADD CONSTRAINT "board_email_fkey" FOREIGN KEY ("email") REFERENCES "users"("email") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "resources" ADD CONSTRAINT "resources_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;
