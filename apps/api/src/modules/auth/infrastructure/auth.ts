import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "@oston/database";
import { loadEnv } from "../../../config/env.js";

function createAuth() {
  const env = loadEnv();

  return betterAuth({
    database: prismaAdapter(prisma, { provider: "postgresql" }),
    secret: env.BETTER_AUTH_SECRET,
    baseURL: env.BETTER_AUTH_URL,
    trustedOrigins: env.webOrigins,
    emailAndPassword: {
      enabled: true,
      disableSignUp: true,
      minPasswordLength: 12,
      maxPasswordLength: 128,
    },
    session: {
      expiresIn: 60 * 60 * 24 * 7,
      updateAge: 60 * 60 * 24,
      cookieCache: {
        enabled: false,
      },
    },
    user: {
      additionalFields: {
        role: {
          type: ["OWNER", "ADMIN", "EDITOR"],
          required: false,
          defaultValue: "EDITOR",
          input: false,
        },
      },
    },
    rateLimit: {
      enabled: true,
      window: 60,
      max: 30,
      storage: "database",
      modelName: "rateLimit",
      customRules: {
        "/sign-in/email": {
          window: 60,
          max: 8,
        },
        "/request-password-reset": {
          window: 60,
          max: 5,
        },
      },
    },
    advanced: {
      useSecureCookies: env.isProduction,
      defaultCookieAttributes: {
        httpOnly: true,
        sameSite: "lax",
        secure: env.isProduction,
        path: "/",
      },
    },
    disabledPaths: ["/sign-up/email"],
  });
}

type Auth = ReturnType<typeof createAuth>;

let instance: Auth | undefined;

export function getAuth() {
  if (!instance) {
    instance = createAuth();
  }
  return instance;
}

export const auth = new Proxy({} as Auth, {
  get(_target, prop, receiver) {
    return Reflect.get(getAuth(), prop, receiver);
  },
});
