import { fixtureComplete } from "./fixtures.js";

export async function complete({ system, user, question, context, cfg }) {
  if (cfg.fixtures) {
    return {
      text: fixtureComplete({ system, context, question }),
      fixture: true,
      model: "fixture",
    };
  }

  if (!cfg.apiKey) {
    throw new Error(
      "OPENAI_API_KEY is empty. Set USE_FIXTURES=true or provide a capped org key.",
    );
  }

  const res = await fetch(`${cfg.baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${cfg.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: cfg.model,
      temperature: 0,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`LLM HTTP ${res.status}: ${body.slice(0, 400)}`);
  }

  const data = await res.json();
  const text = data?.choices?.[0]?.message?.content?.trim() || "";
  return { text, fixture: false, model: cfg.model };
}
