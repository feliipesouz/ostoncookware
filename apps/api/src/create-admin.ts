import { prisma } from "@oston/database";
import { auth } from "./modules/auth/infrastructure/auth.js";
import { assertBootstrapPassword } from "./lib/password.js";

async function main() {
  const email = process.env.ADMIN_EMAIL?.trim();
  const password = process.env.ADMIN_PASSWORD;
  const name = process.env.ADMIN_NAME?.trim() || "Owner";

  if (!email || !password) {
    throw new Error("ADMIN_EMAIL e ADMIN_PASSWORD são obrigatórios.");
  }

  assertBootstrapPassword(password);

  const ownerExists = await prisma.user.findFirst({ where: { role: "OWNER" } });
  if (ownerExists) {
    throw new Error("Já existe um OWNER. O bootstrap não altera contas existentes.");
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new Error("Este e-mail já está cadastrado. O bootstrap não promove usuários existentes.");
  }

  const ctx = await auth.$context;
  const hash = await ctx.password.hash(password);
  const id = ctx.generateId({ model: "user" }) as string;

  await prisma.user.create({
    data: {
      id,
      name,
      email,
      emailVerified: true,
      role: "OWNER",
      accounts: {
        create: {
          id: ctx.generateId({ model: "account" }) as string,
          issuer: "local:credential",
          accountId: id,
          providerId: "credential",
          password: hash,
        },
      },
    },
  });

  console.log("Administrador OWNER criado.");
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : "Falha ao criar administrador.");
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
