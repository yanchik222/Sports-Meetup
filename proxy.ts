import { authkitProxy } from "@workos-inc/authkit-nextjs";

// Every page requires login except the landing page and the auth routes.
export default authkitProxy({
  middlewareAuth: {
    enabled: true,
    unauthenticatedPaths: ["/", "/sign-in", "/sign-up", "/callback"],
  },
});

export const config = {
  // Run on every route except Next.js internals and static files.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};
