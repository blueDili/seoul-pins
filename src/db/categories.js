import { supabase } from "./supabase";

export async function getCategories() {
  const { data, error } = await supabase
    .from("categories")
    .select("name")
    .order("name", { ascending: true });

  if (error) throw error;
  return (data || []).map((r) => r.name);
}

export async function addCategory(name) {
  const { error } = await supabase.from("categories").upsert({ name });
  if (error) throw error;
}

export async function deleteCategory(name) {
  const { error } = await supabase.from("categories").delete().eq("name", name);
  if (error) throw error;
}
