import { router } from "../../../server/router.js";
import { engagementRoutes } from "../../../server/engagements.js";

export const onRequest = router("/api/wm", engagementRoutes);
