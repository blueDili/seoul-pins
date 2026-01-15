import { supabase } from "./supabase";

export async function getPlaces() {
  const { data, error } = await supabase
    .from("places")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;

  // 對齊你原本欄位命名
  return (data || []).map((r) => ({
    id: r.id,
    name: r.name,
    address: r.address || "",
    shareLink: r.share_link || "",
    type: r.type,
    category: r.category || "",
    lat: r.lat,
    lng: r.lng,
    createdAt: r.created_at,
  }));
}

export async function addPlace(place) {
  const row = {
    id: place.id,
    name: place.name,
    address: place.address || null,
    share_link: place.shareLink || null,
    type: place.type,
    category: place.category || null,
    lat: typeof place.lat === "number" ? place.lat : null,
    lng: typeof place.lng === "number" ? place.lng : null,
    created_at: place.createdAt ?? Date.now(),
  };

  const { error } = await supabase.from("places").upsert(row);
  if (error) throw error;
}

export async function deletePlaceById(id) {
  const { error } = await supabase.from("places").delete().eq("id", id);
  if (error) throw error;
}

// 你原本有 removeCategoryFromPlaces：同樣改成更新
export async function removeCategoryFromPlaces(categoryName) {
  const { error } = await supabase
    .from("places")
    .update({ category: null })
    .eq("type", "restaurant")
    .eq("category", categoryName);

  if (error) throw error;
}
