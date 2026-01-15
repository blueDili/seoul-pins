import { get, set } from "idb-keyval";

const KEY = "categories";

/** 取得所有類別（字串陣列） */
export async function getCategories() {
  const data = await get(KEY);
  return Array.isArray(data) ? data : [];
}

/** 新增類別（去空白 + 不分大小寫去重） */
export async function addCategory(name) {
  const n = (name || "").trim();
  if (!n) return;

  const current = await getCategories();
  const exists = current.some((x) => x.toLowerCase() === n.toLowerCase());
  if (exists) return;

  const next = [...current, n];
  await set(KEY, next);
}

/** 刪除類別（用名稱） */
export async function deleteCategory(name) {
  const current = await getCategories();
  const next = current.filter((x) => x !== name);
  await set(KEY, next);
}
