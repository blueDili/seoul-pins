import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

const defaultIcon = L.icon({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

function JumpToUser({ userLocation, jumpToUserSignal }) {
  const map = useMap();

  useEffect(() => {
  if (!userLocation) return;
  map.flyTo([userLocation.lat, userLocation.lng], 15, { animate: true });
}, [jumpToUserSignal, userLocation]);


  return null;
}

function JumpToTarget({ flyToTarget, flyToSignal }) {
  const map = useMap();

  useEffect(() => {
    if (!flyToTarget) return;
    map.flyTo([flyToTarget.lat, flyToTarget.lng], 16, { animate: true });
  }, [flyToSignal]);

  return null;
}

delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

export default function MapView({ places, userLocation, jumpToUserSignal, userMappingFilter,flyToTarget, flyToSignal }) {

  const seoul = [37.5665, 126.9780];

  const filteredPlaces = (places || []).filter((p) => {
  if (typeof p.lat !== "number" || typeof p.lng !== "number") return false;

  const typeF = userMappingFilter?.type ?? "ALL";
  const catF = userMappingFilter?.category ?? "ALL";

  if (typeF !== "ALL" && p.type !== typeF) return false;

  // 類別只對餐廳有效
  if (catF !== "ALL") {
    if (p.type !== "restaurant") return false;
    if ((p.category || "") !== catF) return false;
  }

  return true;
});


  return (
    <div style={{ height: "55vh", borderRadius: 16, overflow: "hidden" }}>
      <MapContainer center={seoul} zoom={12} style={{ height: "100%", width: "100%" }}>
        <TileLayer
          attribution='&copy; OpenStreetMap contributors &copy; CARTO'
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        />

        <JumpToUser userLocation={userLocation} jumpToUserSignal={jumpToUserSignal} />
        <JumpToTarget flyToTarget={flyToTarget} flyToSignal={flyToSignal} />


        {userLocation && (
          <Marker position={[userLocation.lat, userLocation.lng]}icon={defaultIcon}>
            <Popup>你的位置</Popup>
          </Marker>
        )}

        {filteredPlaces.map((p) => (
          <Marker key={p.id} position={[p.lat, p.lng]}icon={defaultIcon}>
            <Popup>
              <div style={{ fontWeight: 700 }}>{p.name}</div>
              <div style={{ fontSize: 12, opacity: 0.8 }}>
                {p.type === "restaurant" ? "餐廳" : "景點"}
                {p.category ? "｜" + p.category : ""}
              </div>
              {p.address ? <div style={{ fontSize: 12 }}>{p.address}</div> : null}
            </Popup>
          </Marker>
        ))}

      </MapContainer>
    </div>
  );
}
