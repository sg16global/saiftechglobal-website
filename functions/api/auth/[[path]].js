import { router } from "../../../server/router.js";
import { authRoutes } from "../../../server/auth.js";

export const onRequest = router("/api/auth", authRoutes);
