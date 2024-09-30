import { Registry, collectDefaultMetrics } from "prom-client";

// TODO: 개선
const register = new Registry();
collectDefaultMetrics({ register })

export { register }