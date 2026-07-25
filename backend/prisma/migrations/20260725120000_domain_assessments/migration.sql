-- CreateTable
CREATE TABLE "domain_assessments" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "domain_id" TEXT NOT NULL,
    "answers" JSONB NOT NULL,
    "profile" JSONB NOT NULL,
    "plan" JSONB NOT NULL,
    "plan_version" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "domain_assessments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "domain_assessments_user_id_domain_id_key" ON "domain_assessments"("user_id", "domain_id");

-- AddForeignKey
ALTER TABLE "domain_assessments" ADD CONSTRAINT "domain_assessments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "domain_assessments" ADD CONSTRAINT "domain_assessments_domain_id_fkey" FOREIGN KEY ("domain_id") REFERENCES "domains"("id") ON DELETE CASCADE ON UPDATE CASCADE;
