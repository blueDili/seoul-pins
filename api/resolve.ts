import type { VercelRequest, VercelResponse } from "@vercel/node";

const UA =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1";

function asUrl(input: string): URL | null {
  try {
    return new URL(input);
  } catch {
    return null;
  }
}

function withTimeout(ms: number) {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), ms);
  return { signal: controller.signal, cancel: () => clearTimeout(t) };
}

async function followRedirects(start: string, maxSteps = 10, timeoutMs = 6000) {
  let current = start;
  let steps = 0;

  for (; steps < maxSteps; steps++) {
    const { signal, cancel } = withTimeout(timeoutMs);
    try {
      const r = await fetch(current, {
        method: "GET",
        redirect: "manual",
        signal,
        headers: {
          "User-Agent": UA,
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "Accept-Language": "ko-KR,ko;q=0.9,en;q=0.8,zh-TW;q=0.7",
        },
      });

      cancel();

      if (r.status >= 200 && r.status < 300) return { finalUrl: current, steps, status: r.status };
      if (r.status >= 300 && r.status < 400) {
        const loc = r.headers.get("location");
        if (!loc) return { finalUrl: current, steps, status: r.status };
        current = new URL(loc, current).toString();
        continue;
      }

      return { finalUrl: current, steps, status: r.status };
    } catch {
      cancel();
      return { finalUrl: current, steps, status: 0 };
    }
  }

  return { finalUrl: current, steps, status: 0 };
}

async function fetchHtml(url: string, timeoutMs = 6000) {
  const { signal, cancel } = withTimeout(timeoutMs);
  try {
    const r = await fetch(url, {
      method: "GET",
      signal,
      headers: {
        "User-Agent": UA,
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "ko-KR,ko;q=0.9,en;q=0.8,zh-TW;q=0.7",
      },
    });
    const text = await r.text();
    cancel();
    return { ok: r.ok, status: r.status, text };
  } catch {
    cancel();
    return { ok: false, status: 0, text: "" };
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(204).end();

  const debug = String(req.query.debug || "") === "1";
  const raw = (req.query.url as string) || "";
  const u = asUrl(raw);

  if (!u || (u.protocol !== "http:" && u.protocol !== "https:")) {
    return res.status(400).json({ ok: false, reason: "INVALID_URL" });
  }

  // --- NAVER (naver.me) ---
  if (u.hostname === "naver.me") {
    const r1 = await followRedirects(u.toString(), 10);
    // 你的案例會停在 appLink.naver：用 pinId 組 placeUrl
    let placeId: string | null = null;
    try {
      const uf = new URL(r1.finalUrl);
      placeId = uf.searchParams.get("pinId");
    } catch {}

    const placeUrl = placeId ? `https://m.place.naver.com/place/${placeId}` : null;

    let lat: number | null = null;
    let lng: number | null = null;

    if (placeUrl) {
      const h = await fetchHtml(placeUrl, 6000);
      if (h.ok) {
        const html = h.text;
        const patterns: RegExp[] = [
          /["']x["']\s*:\s*["']?([0-9]+\.[0-9]+)["']?.{0,80}["']y["']\s*:\s*["']?([0-9]+\.[0-9]+)["']?/s,
          /"x"\s*:\s*([0-9]+\.[0-9]+)\s*,\s*"y"\s*:\s*([0-9]+\.[0-9]+)/s,
          /lng["']?\s*:\s*([0-9]+\.[0-9]+).{0,80}lat["']?\s*:\s*([0-9]+\.[0-9]+)/s,
        ];
        for (const re of patterns) {
          const m = html.match(re);
          if (!m) continue;
          const x = Number(m[1]); // lng
          const y = Number(m[2]); // lat
          if (Number.isFinite(x) && Number.isFinite(y)) {
            lng = x;
            lat = y;
            break;
          }
        }
      }
    }

    // ✅ 上線用最小回傳
    if (!debug) {
      if (lat != null && lng != null) return res.status(200).json({ ok: true, provider: "naver", lat, lng });
      return res.status(200).json({ ok: false, provider: "naver", reason: "PARSE_FAIL" });
    }

    // 🧪 debug=1 才回完整資訊
    return res.status(200).json({
      ok: lat != null && lng != null,
      provider: "naver",
      inputUrl: raw,
      finalUrl: r1.finalUrl,
      steps: r1.steps,
      status: r1.status,
      placeId,
      placeUrl,
      lat,
      lng,
    });
  }

  // 其他來源先回不支援（你要快上線就先不做 Kakao）
  return res.status(200).json({ ok: false, reason: "UNSUPPORTED" });
}
