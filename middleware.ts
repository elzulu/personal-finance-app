import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: {
    signIn: "/login",
  },
});

export const config = {
  matcher: [
    // /api/cron se protege con CRON_SECRET (lo llama Vercel Cron, sin sesión)
    "/((?!api/auth|api/register|api/cron|_next/static|_next/image|favicon.ico|login).*)",
  ],
};
