import type { VercelRequest, VercelResponse } from "@vercel/node";

function asUrl(input: string): URL | null {
  try {
    return new URL(input);
  } catch {
    return null;
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(204).end();

  const raw = (req.query.url as string) || "";
  const u = asUrl(raw);

  if (!u || (u.protocol !== "http:" && u.protocol !== "https:")) {
    return res.status(400).json({
      ok: false,
      reason: "INVALID_URL",
      got: raw,
      usage: "/api/resolve?url=https%3A%2F%2Fnaver.me%2Fxxxx"
    });
  }

  return res.status(200).json({
    ok: true,
    message: "resolve api alive",
    inputUrl: raw,
    host: u.hostname
  });
}
