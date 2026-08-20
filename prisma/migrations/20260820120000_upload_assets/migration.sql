-- CreateTable
CREATE TABLE "UploadAsset" (
    "id" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "bytes" BYTEA NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UploadAsset_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UploadAsset_filename_key" ON "UploadAsset"("filename");

-- CreateIndex
CREATE INDEX "UploadAsset_createdAt_idx" ON "UploadAsset"("createdAt");
