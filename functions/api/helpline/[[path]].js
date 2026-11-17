import { router } from "../../../server/router.js";
import { helplineRoutes } from "../../../server/helpline.js";

export const onRequest = router("/api/helpline", helplineRoutes);
