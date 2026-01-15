import { useState } from "react";

export default function CategoryManager({
  categories,
  onAddCategory,
  onDeleteCategory,
}) {
  const [name, setName] = useState("");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {/* 新增 */}
      <div
        style={{
          display: "flex",
          gap: 8,
          alignItems: "center",
          border: "1px solid #eee",
          borderRadius: 12,
          padding: 12,
        }}
      >
        <input
          placeholder="新增食物類型（例如：部隊鍋）"
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={{ flex: 1 }}
        />
        <button
          type="button"
          onClick={async () => {
            const n = name.trim();
            if (!n) return;
            await onAddCategory?.(n);
            setName("");
          }}
        >
          加入
        </button>
      </div>

      {/* 清單 */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {(!categories || categories.length === 0) && (
          <div style={{ color: "#666" }}>目前沒有任何類別。</div>
        )}

        {(categories || []).map((c) => (
          <div
            key={c}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              border: "1px solid #eee",
              borderRadius: 12,
              padding: 12,
            }}
          >
            <div style={{ fontWeight: 700 }}>{c}</div>
            <button
              type="button"
              onClick={() => onDeleteCategory?.(c)}
            >
              刪除
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
