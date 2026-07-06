import type { Person, Role } from "@/generated/prisma/enums";

declare module "next-auth" {
  interface User {
    person: Person;
    role: Role;
  }

  interface Session {
    user: {
      id: string;
      email: string;
      person: Person;
      role: Role;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    person: Person;
    role: Role;
  }
}
