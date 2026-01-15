import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import "leaflet/dist/leaflet.css";
{!isOnline && (
  <div style={{ padding: 12, margin: 16, borderRadius: 12, border: "1px solid #444", color: "#ddd" }}>
    目前離線：清單可用，地圖底圖可能無法載入。
  </div>
)}


createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
