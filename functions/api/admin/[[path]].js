import { router } from "../../../server/router.js";
import { adminRoutes } from "../../../server/admin.js";

export const onRequest = router("/api/admin", adminRoutes);
