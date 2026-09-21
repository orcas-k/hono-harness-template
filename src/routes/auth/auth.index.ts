import { createRouter } from "@/lib/create-app";

import * as handlers from "./auth.handlers";
import * as routes from "./auth.routes";

export const authRouter = createRouter()
  .openapi(routes.login, handlers.login)
  .openapi(routes.refresh, handlers.refresh)
  .openapi(routes.logout, handlers.logout);

export default authRouter;
