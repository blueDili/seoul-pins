// src/utils/geocode.js
export async function geocodeAddress(address) {
  if (!address || !address.trim()) return null;

  // 旅遊情境：優先在韓國搜尋
  const q = encodeURIComponent(address + " Korea");

  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${q}&limit=1`;

  const res = await fetch(url, {
    headers: {
      // Nominatim 要求加上 User-Agent
      "User-Agent": "SeoulPins/1.0 (contact: example@example.com)",
    },
  });

  if (!res.ok) return null;

  const data = await res.json();
  if (!Array.isArray(data) || data.length === 0) return null;

  return {
    lat: parseFloat(data[0].lat),
    lng: parseFloat(data[0].lon),
    displayName: data[0].display_name,
  };
}
