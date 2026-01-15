import { useEffect, useState } from "react";
import "./App.css";
import { getCategories, addCategory, deleteCategory } from "./db/categories";
import CategoryManager from "./CategoryManager";
import MapView from "./MapView";
import {
  addPlace,
  getPlaces,
  deletePlaceById,
  removeCategoryFromPlaces,
} from "./db/places";
import { geocodeAddress } from "./utils/geocode";






function TabButton({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1,
        padding: "12px 8px",
        border: "none",
        background: "transparent",
        fontWeight: active ? 700 : 500,
      }}
    >
      {label}
    </button>
  );
}

function Screen({ title, children }) {
  return (
    <div style={{ padding: 16 }}>
      <h2 style={{ margin: "8px 0 16px" }}>{title}</h2>
      {children}
    </div>
  );
}
function AddPlaceForm({ categories, onSaved, onAddCategory }) {
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [type, setType] = useState("restaurant");
  const [category, setCategory] = useState("");
  const [newCat, setNewCat] = useState("");
  const [shareLink, setShareLink] = useState("");



  async function handleSave() {
  if (!name.trim()) {
    alert("請輸入名稱");
    return;
  }

  let lat = null;
let lng = null;

// ① 先用分享連結解析（最穩）
if (shareLink.trim()) {
  try {
    const r = await fetch(`/api/resolve?url=${encodeURIComponent(shareLink.trim())}`);
    const data = await r.json();

    if (data?.ok && typeof data.lat === "number" && typeof data.lng === "number") {
      lat = data.lat;
      lng = data.lng;
    } else {
      console.warn("resolve failed", data);
    }
  } catch (e) {
    console.error("resolve error", e);
  }
}

// ② 沒拿到座標才 fallback 地址 geocode（你原本的）
if ((lat == null || lng == null) && address.trim()) {
  try {
    const geo = await geocodeAddress(address.trim());
    if (geo) {
      lat = geo.lat;
      lng = geo.lng;
    } else {
      alert("找不到此地址，將以無座標方式儲存");
    }
  } catch (e) {
    console.error(e);
    alert("地址轉換失敗，將以無座標方式儲存");
  }
}


  const place = {
    id: crypto.randomUUID(),
    name: name.trim(),
    address: address.trim(),
    shareLink: shareLink.trim(),
    type,
    category: category.trim(),
    lat,
    lng,
    createdAt: Date.now(),
  };

  await addPlace(place);
  if (onSaved) await onSaved();

  setName("");
  setAddress("");
  setCategory("");
  setShareLink("");

  alert("已儲存");
}


  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <input
        placeholder="名稱（必填）"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />

      <input
        placeholder="地址（先當文字）"
        value={address}
        onChange={(e) => setAddress(e.target.value)}
      />
      <input
        placeholder="分享連結（Naver / Kakao，優先使用）"
        value={shareLink}
        onChange={(e) => setShareLink(e.target.value)}
      />

      <select value={type} onChange={(e) => setType(e.target.value)}>
        <option value="restaurant">餐廳</option>
        <option value="attraction">景點</option>
      </select>

      {type === "restaurant" && (
  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
    <select value={category} onChange={(e) => setCategory(e.target.value)}>
      <option value="">（未選）</option>
      {(categories || []).map((c) => (
        <option key={c} value={c}>
          {c}
        </option>
      ))}
    </select>

    <div style={{ display: "flex", gap: 8 }}>
      <input
        placeholder="新增食物類型（例如：部隊鍋）"
        value={newCat}
        onChange={(e) => setNewCat(e.target.value)}
      />
      <button
        type="button"
        onClick={async () => {
          if (!newCat.trim()) return;
          await onAddCategory?.(newCat);
          setCategory(newCat.trim()); // 新增後直接選取
          setNewCat("");
        }}
      >
        加入
      </button>
    </div>
  </div>
)}


      <button onClick={handleSave}>儲存</button>
    </div>
  );
}
function PlacesList({ places, categories, categoryFilter, onChangeFilter, onDelete, onViewOnMap }) {
  if (!places.length) {
    return <p style={{ color: "#666" }}>目前沒有資料。請先到「新增」建立一筆。</p>;
  }

  const chips = ["ALL", ...(categories || [])];

  const filtered =
    categoryFilter === "ALL"
      ? places
      : places.filter((p) => p.type === "restaurant" && p.category === categoryFilter);


  return (
  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 6 }}>
      {chips.map((c) => {
        const active = c === categoryFilter;
        return (
          <button
            key={c}
            onClick={() => onChangeFilter?.(c)}
            style={{
              padding: "8px 10px",
              borderRadius: 999,
              border: "1px solid #eee",
              fontWeight: active ? 700 : 500,
              background: active ? "rgba(100,100,100,0.12)" : "transparent",
            }}
          >
            {c === "ALL" ? "全部" : c}
           </button>
          );
       })}
      </div>
      {filtered.map((p) => (
        <div
          key={p.id}
          style={{
            border: "1px solid #eee",
            borderRadius: 12,
            padding: 12,
            display: "flex",
            justifyContent: "space-between",
            gap: 10,
          }}
        >
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 700 }}>
              {p.name}{" "}
              <span style={{ fontWeight: 500, color: "#666", fontSize: 12 }}>
                {p.type === "restaurant" ? "餐廳" : "景點"}
              </span>
            </div>

            {p.address && (
              <div style={{ fontSize: 13, color: "#666", marginTop: 4 }}>
                地址：{p.address}
              </div>
            )}

            {p.type === "restaurant" && p.category && (
              <div style={{ fontSize: 13, color: "#666", marginTop: 4 }}>
                類型：{p.category}
              </div>
            )}
          </div>

          <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
            <button
              onClick={() => onViewOnMap?.(p)}
            >
              地圖
            </button>

            <button
              onClick={() => onDelete(p.id)}
            >
              刪除
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}



export default function App() {
  const [tab, setTab] = useState("map");
  const [places, setPlaces] = useState([]);
  const [categories, setCategories] = useState([]);
  const [categoryFilter, setCategoryFilter] = useState("ALL"); // ALL 或某個類別名稱
  const [userLocation, setUserLocation] = useState(null);
  const [jumpToUserSignal, setJumpToUserSignal] = useState(0);
  const [mapCategoryFilter, setMapCategoryFilter] = useState("ALL"); // ALL 或類別名
  const [mapTypeFilter, setMapTypeFilter] = useState("ALL"); // ALL / restaurant / attraction
  const [flyToTarget, setFlyToTarget] = useState(null); // {lat,lng,name}
  const [flyToSignal, setFlyToSignal] = useState(0);
  const [isOnline, setIsOnline] = useState(navigator.onLine);






  async function handleAddCategory(name) {
    await addCategory(name);
    await refreshCategories();
  }

  async function handleDeleteCategory(name) {
    // 1) 刪類別
    await deleteCategory(name);
    // 2) 清掉 places 內引用
    await removeCategoryFromPlaces(name);
    // 3) 重新讀資料讓 UI 同步
    await refreshPlaces();
    await refreshCategories();
  }

  async function refreshPlaces() {
    const data = await getPlaces();
  // 依建立時間新到舊
    data.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    setPlaces(data);
  }

  function locateMe() {
  if (!navigator.geolocation) {
    alert("你的裝置不支援定位");
    return;
  }

  navigator.geolocation.getCurrentPosition(
    (pos) => {
      const next = {
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
      };

      setUserLocation(next);

      // ✅ 延後觸發，避免 race condition
      setTimeout(() => {
        setJumpToUserSignal((n) => n + 1);
      }, 0);
    },
    (err) => {
      alert("定位失敗：請允許定位權限");
      console.error(err);
    },
    { enableHighAccuracy: true, timeout: 10000 }
  );
}



  async function refreshCategories() {
    const data = await getCategories();
    data.sort((a, b) => a.localeCompare(b));
    setCategories(data);
  }


// 一進 App 就讀一次
  useEffect(() => {
    function onOnline() { setIsOnline(true); }
    function onOffline() { setIsOnline(false); }

    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);

    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  // ✅ App 啟動：先拉一次雲端資料
useEffect(() => {
  (async () => {
    await refreshCategories();
    await refreshPlaces();
  })();
}, []);

// ✅ MVP：每 5 秒拉一次，做到跨裝置自動同步
useEffect(() => {
  const t = setInterval(() => {
    refreshPlaces();
    refreshCategories();
  }, 5000);

  return () => clearInterval(t);
}, []);



  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      {/* 上方標題列 */}
      <header style={{ padding: 16, borderBottom: "1px solid #eee" }}>
        <h1 style={{ margin: 0, fontSize: 20 }}>Seoul Pins</h1>
        <div style={{ marginTop: 6, fontSize: 12, color: "#666" }}>
          自建景點 / 餐廳清單（PWA）
        </div>
      </header>

      {/* 中間內容區 */}
      <main style={{ flex: 1, overflow: "auto", paddingBottom: 80 }}>
        {!isOnline && (
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
        )}
        {tab === "add" && (
          <Screen title="新增">
            <AddPlaceForm
              categories={categories}
              onSaved={async () => {
                await refreshPlaces();
                await refreshCategories();
              }}
              onAddCategory={async (name) => {
                await addCategory(name);
                await refreshCategories();
              }}
            />

          </Screen>
        )}


        {tab === "list" && (
          <Screen title="清單">
            <PlacesList
              places={places}
              categories={categories}
              categoryFilter={categoryFilter}
              onChangeFilter={setCategoryFilter}
              onDelete={async (id) => {
                await deletePlaceById(id);
                await refreshPlaces();
              }}
              onViewOnMap={(p) => {
                if (typeof p.lat === "number" && typeof p.lng === "number") {
                  setFlyToTarget({ lat: p.lat, lng: p.lng, name: p.name });
                  setFlyToSignal((n) => n + 1);
                  setTab("map"); // ✅ 切到地圖
                } else {
                  alert("這筆資料沒有座標（請確認地址能成功轉座標）");
                }
              }}
            />

            {/* ↓↓↓ 這裡就是新增的類別管理區塊 ↓↓↓ */}
            <hr style={{ margin: "18px 0", opacity: 0.2 }} />

            <div style={{ fontWeight: 800, marginBottom: 10 }}>
              食物類型管理
            </div>

            <CategoryManager
              categories={categories}
              onAddCategory={handleAddCategory}
              onDeleteCategory={handleDeleteCategory}
            />
          </Screen>
        )}

        {tab === "map" && (
          <Screen title="地圖">
            <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
              <button onClick={locateMe}>顯示我的位置</button>
            </div>

    {/* ✅ 地圖篩選 chips */}
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
      {["ALL", "restaurant", "attraction"].map((t) => {
        const active = mapTypeFilter === t;
        const label = t === "ALL" ? "全部" : t === "restaurant" ? "餐廳" : "景點";
        return (
          <button
            key={t}
            onClick={() => setMapTypeFilter(t)}
            style={{
              padding: "8px 10px",
              borderRadius: 999,
              border: "1px solid #eee",
              fontWeight: active ? 700 : 500,
              background: active ? "rgba(100,100,100,0.12)" : "transparent",
            }}
          >
            {label}
          </button>
        );
      })}

      {["ALL", ...(categories || [])].map((c) => {
        const active = mapCategoryFilter === c;
        return (
          <button
            key={c}
            onClick={() => setMapCategoryFilter(c)}
            style={{
              padding: "8px 10px",
              borderRadius: 999,
              border: "1px solid #eee",
              fontWeight: active ? 700 : 500,
              background: active ? "rgba(100,100,100,0.12)" : "transparent",
            }}
          >
            {c === "ALL" ? "全部類別" : c}
          </button>
        );
      })}
    </div>

    <MapView
      places={places}
      userMappingFilter={{
        type: mapTypeFilter,
        category: mapCategoryFilter,
      }}
      userLocation={userLocation}
      jumpToUserSignal={jumpToUserSignal}
      flyToTarget={flyToTarget}
      flyToSignal={flyToSignal}
    />
  </Screen>
)}



        
      </main>

      {/* 底部選單 */}
      <nav
        style={{
          display: "flex",
          borderTop: "1px solid #eee",
          position: "sticky",
          bottom: 0,
          background: "black",
        }}
      >
        <TabButton label="地圖" active={tab === "map"} onClick={() => setTab("map")} />
        <TabButton label="清單" active={tab === "list"} onClick={() => setTab("list")} />
        <TabButton label="新增" active={tab === "add"} onClick={() => setTab("add")} />
      </nav>
    </div>
  );
}

