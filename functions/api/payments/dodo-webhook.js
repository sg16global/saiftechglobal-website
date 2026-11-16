// Dodo Payments webhook (server-to-server; authenticated by Standard Webhooks signature, not by origin).
import { handler } from "../../../server/http.js";
import { dodoWebhook } from "../../../server/payments.js";

export const onRequestPost = handler(dodoWebhook, { csrf: false });
