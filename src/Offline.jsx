export default function Offline({ isOnline }) {
  if (isOnline) return null;

  return (
    <div
      style={{
        padding: 12,
        margin: 16,
        borderRadius: 12,
        border: "1px solid #444",
        background: "rgba(255,255,255,0.05)",
        color: "#ddd",
        fontSize: 14,
      }}
    >
      目前離線：清單仍可使用，地圖底圖可能無法載入。
    </div>
  );
}
