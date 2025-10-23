-- CreateEnum
CREATE TYPE "DemoPostStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateTable
CREATE TABLE "DemoUser" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DemoUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DemoPost" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT,
    "status" "DemoPostStatus" NOT NULL DEFAULT 'DRAFT',
    "authorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DemoPost_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DemoUser_name_key" ON "DemoUser"("name");

-- CreateIndex
CREATE UNIQUE INDEX "DemoUser_email_key" ON "DemoUser"("email");

-- CreateIndex
CREATE INDEX "DemoPost_authorId_idx" ON "DemoPost"("authorId");

-- AddForeignKey
ALTER TABLE "DemoPost" ADD CONSTRAINT "DemoPost_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "DemoUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;
