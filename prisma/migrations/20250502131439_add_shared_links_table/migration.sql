-- CreateTable
CREATE TABLE "share" (
    "id" TEXT NOT NULL,
    "user_id" INTEGER NOT NULL,
    "asset_folder" TEXT NOT NULL,
    "parent_folder" TEXT,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "share_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "share" ADD CONSTRAINT "share_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;
