import type { VercelRequest, VercelResponse } from "@vercel/node";

const UA =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1";

async function followRedirects(start: string, maxSteps = 6) {
  let current = start;
  let steps = 0;

  for (; steps < maxSteps; steps++) {
    const r = await fetch(current, {
      method: "GET",
      redirect: "manual",
      headers: {
        "User-Agent": UA,
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "ko-KR,ko;q=0.9,en;q=0.8,zh-TW;q=0.7"
      }
    });

    // 2xx：到站了
    if (r.status >= 200 && r.status < 300) {
      return { finalUrl: current, steps, status: r.status };
    }

    // 3xx：跳轉
    if (r.status >= 300 && r.status < 400) {
      const loc = r.headers.get("location");
      if (!loc) return { finalUrl: current, steps, status: r.status };
      current = new URL(loc, current).toString();
      continue;
    }

    // 403/429/5xx：被擋或失敗
    return { finalUrl: current, steps, status: r.status };
  }

  return { finalUrl: current, steps, status: 0 };
}

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

  // ✅ 先處理 naver.me 短網址：追 redirect 拿 finalUrl
if (u.hostname === "naver.me") {
  // 先追 naver.me
  let r = await followRedirects(u.toString(), 10);

  // 如果停在 appLink，再追一次
  if (r.finalUrl.includes("appLink.naver")) {
    const r2 = await followRedirects(r.finalUrl, 10);
    // 把 step 合併（方便你看總共跳幾次）
    r = { ...r2, steps: r.steps + r2.steps };
  }

  // 嘗試從 expandedUrl 解析 ?c=lng,lat（如果有）
  let lat: number | null = null;
  let lng: number | null = null;

  try {
    const uf = new URL(r.finalUrl);
    const c = uf.searchParams.get("c");
    if (c) {
      const parts = c.split(",").map((s) => s.trim()).filter(Boolean);
      if (parts.length >= 2) {
        const lngNum = Number(parts[0]);
        const latNum = Number(parts[1]);
        if (Number.isFinite(latNum) && Number.isFinite(lngNum)) {
          lat = latNum;
          lng = lngNum;
        }
      }
    }
  } catch {}

  return res.status(200).json({
    ok: true,
    provider: "naver",
    inputUrl: raw,
    host: u.hostname,
    finalUrl: r.finalUrl,       // ✅ 你最關心的：最後展開後的 URL
    steps: r.steps,
    status: r.status,
    lat,
    lng
  });
}


// 其他先維持原樣
return res.status(200).json({
  ok: true,
  message: "resolve api alive",
  inputUrl: raw,
  host: u.hostname
});

}
