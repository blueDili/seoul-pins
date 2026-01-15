import { get, set } from "idb-keyval";



const KEY = "places";

/** 取得所有地點 */
export async function getPlaces() {
  const data = await get(KEY);
  return Array.isArray(data) ? data : [];
}

/** 新增一個地點 */
export async function addPlace(place) {
  const current = await getPlaces();
  const next = [...current, place];
  await set(KEY, next);
}

/** 刪除一個地點（用 id） */
export async function deletePlaceById(id) {
  const current = await getPlaces();
  const next = current.filter((p) => p.id !== id);
  await set(KEY, next);
}

/** 清空全部（之後除錯會用到） */
export async function clearPlaces() {
  await set(KEY, []);
}

export async function removeCategoryFromPlaces(categoryName) {
  const current = await getPlaces();
  const next = current.map((p) => {
    if (p.type === "restaurant" && p.category === categoryName) {
      return { ...p, category: "" };
    }
    return p;
  });
  await set(KEY, next);
}