import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  pages: {
    signIn: "/login",
  },
  providers: [],
  callbacks: {
    authorized({ auth, request }) {
      const pathname = request.nextUrl.pathname;
      const isLoggedIn = !!auth?.user;
      const isLoginPage = pathname === "/login";

      if (!isLoggedIn && !isLoginPage) {
        return false;
      }

      if (isLoggedIn && isLoginPage) {
        return Response.redirect(new URL("/dashboard", request.nextUrl));
      }

      if (pathname.startsWith("/admin") && auth?.user?.role !== "admin") {
        return Response.redirect(new URL("/dashboard", request.nextUrl));
      }

      return true;
    },
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as "admin" | "user";
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
