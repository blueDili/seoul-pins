export default function Offline({ isOnline }) {
  if (isOnline) return null;

  return (
    <div style={{ padding: 12 }}>
      目前離線
    </div>
  );
}
