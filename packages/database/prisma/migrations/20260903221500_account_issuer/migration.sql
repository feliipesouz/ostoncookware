-- Better Auth 1.7 keys credential accounts on (issuer, accountId).
-- Synthetic issuer for email/password is `local:credential`.

ALTER TABLE "account" ADD COLUMN "issuer" TEXT NOT NULL DEFAULT 'local:credential';

ALTER TABLE "account" ALTER COLUMN "issuer" DROP DEFAULT;

CREATE UNIQUE INDEX "account_issuer_accountId_key" ON "account"("issuer", "accountId");
