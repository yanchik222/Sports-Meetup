import { handleAuth } from "@workos-inc/authkit-nextjs";

// After signing in, send users into the app unless they were heading somewhere specific.
export const GET = handleAuth({ returnPathname: "/availability" });
