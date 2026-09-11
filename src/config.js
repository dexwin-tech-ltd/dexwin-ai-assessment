import { loadEnv } from "./loadEnv.js";

loadEnv();

export function useFixtures() {
  const flag = (process.env.USE_FIXTURES || "").toLowerCase();
  if (flag === "true" || flag === "1" || flag === "yes") return true;
  if (flag === "false" || flag === "0" || flag === "no") return false;
  return !process.env.OPENAI_API_KEY;
}

export function config() {
  const fixtures = useFixtures();
  return {
    port: Number(process.env.PORT || 3000),
    fixtures,
    apiKey: process.env.OPENAI_API_KEY || "",
    baseUrl: (process.env.OPENAI_BASE_URL || "https://api.openai.com/v1").replace(
      /\/$/,
      "",
    ),
    model: process.env.OPENAI_MODEL || "gpt-4o-mini",
  };
}
