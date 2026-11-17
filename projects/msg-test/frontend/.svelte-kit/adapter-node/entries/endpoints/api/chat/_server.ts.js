import { error, json } from "@sveltejs/kit";
import { b as private_env } from "../../../../chunks/shared-server.js";
const OLLAMA_URL = private_env.OLLAMA_URL ?? "http://localhost:11434";
const POST = async ({ request }) => {
  const { model, messages } = await request.json();
  let res;
  try {
    res = await fetch(`${OLLAMA_URL}/api/chat`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ model, messages, stream: false })
    });
  } catch {
    throw error(503, "Ollama is not reachable. Make sure it is running.");
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw error(res.status, data.error ?? "Ollama error");
  return json({ message: data.message });
};
export {
  POST
};
