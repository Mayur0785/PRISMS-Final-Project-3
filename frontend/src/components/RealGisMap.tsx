import React, { useEffect, useRef, useState } from "react";
import type { Market } from "@/lib/prisms";

interface RealGisMapProps {
  markets: Market[];
  userCoords?: { lat: number; lng: number } | null;
  userLocationName?: string;
  selectedMandiId?: string | null;
  onSelectMandi?: (mandiId: string) => void;
  searchRadiusKm?: number;
  searchScope?: "nearby" | "maharashtra";
  searchQuery?: string;
  lang?: "en" | "mr";
  bestMandiId?: string;
  commodityName?: string;
}

export const RealGisMap: React.FC<RealGisMapProps> = ({
  markets,
  userCoords = { lat: 18.9102, lng: 73.3283 }, // Default: Karjat, Raigad
  userLocationName = "Karjat",
  selectedMandiId,
  onSelectMandi,
  searchRadiusKm = 50,
  searchScope = "nearby",
  searchQuery = "",
  lang = "en",
  bestMandiId = "vashi",
  commodityName = "Red Onion",
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersGroupRef = useRef<any>(null);
  const routeLineRef = useRef<any>(null);
  const radiusCircleRef = useRef<any>(null);
  const [mapLayer, setMapLayer] = useState<"voyager" | "satellite" | "osm">("voyager");
  const [leafletLoaded, setLeafletLoaded] = useState(false);

  const cleanLocationName = (userLocationName || "Karjat").replace(/Hub|\(|\)/g, "").trim() || "Karjat";

  const defaultCenter: [number, number] = userCoords
    ? [userCoords.lat, userCoords.lng]
    : [18.9102, 73.3283];

  // Initialize Map safely on client
  useEffect(() => {
    if (typeof window === "undefined" || !mapContainerRef.current) return;

    let isMounted = true;

    import("leaflet").then((L) => {
      if (!isMounted || !mapContainerRef.current) return;

      if (!mapInstanceRef.current) {
        const map = L.map(mapContainerRef.current, {
          center: defaultCenter,
          zoom: 10,
          zoomControl: false,
        });

        mapInstanceRef.current = map;
        markersGroupRef.current = L.layerGroup().addTo(map);

        L.control.zoom({ position: "topright" }).addTo(map);
        setLeafletLoaded(true);
      }
    });

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Handle Tile Layer Changes
  useEffect(() => {
    if (!leafletLoaded || !mapInstanceRef.current) return;

    import("leaflet").then((L) => {
      const map = mapInstanceRef.current;
      if (!map) return;

      // Remove existing tile layers
      map.eachLayer((layer: any) => {
        if (layer instanceof L.TileLayer) {
          map.removeLayer(layer);
        }
      });

      let tileUrl = "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png";
      let attribution = '&copy; <a href="https://carto.com/">CARTO</a>';

      if (mapLayer === "satellite") {
        tileUrl = "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";
        attribution = "Tiles &copy; Esri";
      } else if (mapLayer === "osm") {
        tileUrl = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
        attribution = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';
      }

      L.tileLayer(tileUrl, {
        maxZoom: 19,
        attribution,
      }).addTo(map);
    });
  }, [mapLayer, leafletLoaded]);

  // Update Markers, Farmer Pin, Search Radius, and Routes
  useEffect(() => {
    if (!leafletLoaded || !mapInstanceRef.current || !markersGroupRef.current) return;

    import("leaflet").then((L) => {
      const map = mapInstanceRef.current;
      const markersGroup = markersGroupRef.current;
      if (!map || !markersGroup) return;

      markersGroup.clearLayers();

      const centerLat = userCoords?.lat ?? 19.0330;
      const centerLng = userCoords?.lng ?? 73.0297;

      const calculateKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
        const R = 6371;
        const dLat = ((lat2 - lat1) * Math.PI) / 180;
        const dLon = ((lon2 - lon1) * Math.PI) / 180;
        const a =
          Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos((lat1 * Math.PI) / 180) *
            Math.cos((lat2 * Math.PI) / 180) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return Math.max(5, Math.round(R * c));
      };

      // 1. Farmer Location Pulsing Marker (Navi Mumbai)
      const farmerIcon = L.divIcon({
        className: "farmer-custom-pin",
        html: `
          <div class="relative flex items-center justify-center">
            <div class="w-9 h-9 rounded-full bg-primary text-white flex items-center justify-center shadow-2xl border-2 border-white font-bold text-xs z-10">
              🚜
            </div>
            <div class="absolute w-14 h-14 rounded-full bg-primary/30 animate-ping pointer-events-none"></div>
          </div>
        `,
        iconSize: [36, 36],
        iconAnchor: [18, 18],
      });

      const farmerMarker = L.marker([centerLat, centerLng], { icon: farmerIcon }).addTo(markersGroup);
      farmerMarker.bindPopup(`
        <div style="font-family: sans-serif; font-size: 12px; padding: 2px;">
          <strong style="color: #002b02; font-size: 13px;">${lang === "mr" ? "आपले शेत / संकलन केंद्र (नवी मुंबई)" : "Your Hub (Navi Mumbai)"}</strong>
          <p style="color: #555; margin: 4px 0 0;">${lang === "mr" ? "स्थानिक निर्देशांक" : "Coordinates"}: ${centerLat.toFixed(4)}°N, ${centerLng.toFixed(4)}°E</p>
        </div>
      `);

      // 2. Search Radius Circle (Rendered in Nearby mode)
      if (radiusCircleRef.current) {
        map.removeLayer(radiusCircleRef.current);
      }
      if (searchScope === "nearby") {
        radiusCircleRef.current = L.circle([centerLat, centerLng], {
          radius: searchRadiusKm * 1000,
          color: "#3b6934",
          fillColor: "#3b6934",
          fillOpacity: 0.06,
          weight: 1.5,
          dashArray: "6, 6",
        }).addTo(map);
      }

      // 3. Candidate Markets with dynamic location & distance calculation from Farmer Origin
      const defaultRawMandis = [
        { id: "vashi", name: "Vashi APMC, Navi Mumbai", name_mr: "वाशी APMC (नवी मुंबई)", lat: 19.0745, lng: 73.0031, price: 2606, net: 2390, state: "Maharashtra" },
        { id: "kalyan", name: "Kalyan APMC", name_mr: "कल्याण APMC", lat: 19.2403, lng: 73.1305, price: 2349, net: 2210, state: "Maharashtra" },
        { id: "panvel", name: "Panvel APMC", name_mr: "पनवेल APMC", lat: 18.9894, lng: 73.1093, price: 2380, net: 2260, state: "Maharashtra" },
        { id: "pune", name: "Pune APMC (Gultekdi)", name_mr: "पुणे APMC (गुलटेकडी)", lat: 18.5204, lng: 73.8567, price: 2412, net: 2180, state: "Maharashtra" },
        { id: "baramati", name: "Baramati APMC", name_mr: "बारामती APMC", lat: 18.1517, lng: 74.5815, price: 2443, net: 2150, state: "Maharashtra" },
        { id: "lasalgaon", name: "Lasalgaon Mandi", name_mr: "लासलगाव बाजार समिती (नाशिक)", lat: 20.1418, lng: 74.2255, price: 2414, net: 2138, state: "Maharashtra" },
        { id: "pimpalgaon", name: "Pimpalgaon Baswant APMC", name_mr: "पिंपळगाव बसवंत APMC", lat: 20.1700, lng: 73.9800, price: 2425, net: 2110, state: "Maharashtra" },
        { id: "nashik", name: "Nashik Main APMC", name_mr: "नाशिक मुख्य बाजारपेठ", lat: 19.9975, lng: 73.7898, price: 2448, net: 2085, state: "Maharashtra" },
        { id: "rahuri", name: "Rahuri APMC", name_mr: "राहुरी APMC", lat: 19.3900, lng: 74.6500, price: 2360, net: 2060, state: "Maharashtra" },
      ];

      const rawMandis = (markets && markets.length > 0)
        ? markets.map((m) => {
            const lat = m.latitude ?? (m.location?.coordinates ? m.location.coordinates[1] : undefined);
            const lng = m.longitude ?? (m.location?.coordinates ? m.location.coordinates[0] : undefined);
            const fallback = defaultRawMandis.find((d) => d.id === m.id || m.name.toLowerCase().includes(d.id.toLowerCase()));
            return {
              id: m.id,
              name: m.name,
              name_mr: m.name_mr || m.name,
              lat: lat ?? fallback?.lat ?? 19.0,
              lng: lng ?? fallback?.lng ?? 73.0,
              price: m.pricePerQtl || fallback?.price || 2400,
              net: m.netRealization || fallback?.net || 2100,
              state: m.state || "Maharashtra",
              distance_km: m.distance_km,
            };
          })
        : defaultRawMandis;

      const q = searchQuery ? searchQuery.trim().toLowerCase() : "";
      const mandiList = rawMandis
        .map((m) => {
          const dist = m.distance_km && m.distance_km > 0
            ? Math.round(m.distance_km * 10) / 10
            : calculateKm(centerLat, centerLng, m.lat, m.lng);
          return { ...m, dist };
        })
        .filter((m) => {
          const matchesScope = searchScope === "maharashtra" ? true : m.dist <= searchRadiusKm;
          const matchesSearch = !q ||
            m.name.toLowerCase().includes(q) ||
            m.name_mr.toLowerCase().includes(q) ||
            m.id.toLowerCase().includes(q) ||
            ((m as any).district && (m as any).district.toLowerCase().includes(q)) ||
            ((m as any).city && (m as any).city.toLowerCase().includes(q)) ||
            (m.state && m.state.toLowerCase().includes(q));
          return matchesScope && matchesSearch;
        });

      // Dynamically find nearest mandi to current origin
      const nearestMandiId = [...mandiList].sort((a, b) => a.dist - b.dist)[0]?.id;

      mandiList.forEach((mandi) => {
        const isSelected = mandi.id === selectedMandiId;
        const isBest = mandi.id === bestMandiId || mandi.id === mandiList[0]?.id;
        const isNearest = mandi.id === nearestMandiId;

        const markerHtml = `
          <div class="relative flex flex-col items-center group cursor-pointer" style="transform: translate(-50%, -100%);">
            <div class="px-2 py-0.5 rounded-md text-[10px] font-extrabold whitespace-nowrap shadow-md mb-1 border ${
              isBest
                ? "bg-primary text-white border-primary"
                : isSelected
                ? "bg-inverse-surface text-white border-white/40"
                : "bg-white text-gray-800 border-gray-300"
            }">
              ${isBest ? "⭐ " : isNearest ? "📍 " : ""}${lang === "mr" ? mandi.name_mr.split(" ")[0] : mandi.name.split(" ")[0]}: ₹${mandi.net} (${mandi.dist}km)
            </div>
            <div class="w-7 h-7 rounded-full flex items-center justify-center shadow-lg transition-transform ${
              isSelected
                ? "bg-warning-burnt-orange text-white scale-125 ring-4 ring-orange-200"
                : isBest
                ? "bg-success-sage text-white scale-110"
                : "bg-primary text-white"
            }">
              <span style="font-size: 14px;">🏪</span>
            </div>
          </div>
        `;

        const customIcon = L.divIcon({
          className: "custom-mandi-icon",
          html: markerHtml,
          iconSize: [90, 45],
          iconAnchor: [45, 45],
        });

        const marker = L.marker([mandi.lat, mandi.lng], { icon: customIcon }).addTo(markersGroup);

        marker.on("click", () => {
          if (onSelectMandi) onSelectMandi(mandi.id);
        });

        marker.bindPopup(`
          <div style="font-family: sans-serif; font-size: 12px; min-width: 170px; padding: 4px 2px;">
            <h4 style="margin: 0 0 4px; color: #002b02; font-size: 14px; font-weight: bold;">
              ${lang === "mr" ? mandi.name_mr : mandi.name}
            </h4>
            <p style="margin: 2px 0; color: #666; font-size: 11px;">
              ${lang === "mr" ? "स्थानिक अंतर" : "Distance"}: <strong>${mandi.dist} km</strong>
            </p>
            <div style="margin: 6px 0; padding: 6px; background: #f4fbf1; border-radius: 6px; border: 1px solid #d0ebd0;">
              <div style="color: #24501f; font-size: 11px; font-weight: bold;">
                ${lang === "mr" ? "थेट नफा दर" : "Net Realization"}: <span style="font-size: 15px; color: #1b4d18;">₹${mandi.net}/Qtl</span>
              </div>
            </div>
          </div>
        `);
      });

      // Issue 6: Clear previous route line and only draw transit route if a specific mandi is selected
      if (routeLineRef.current) {
        map.removeLayer(routeLineRef.current);
        routeLineRef.current = null;
      }

      if (selectedMandiId) {
        const activeTargetMandi = mandiList.find((m) => m.id === selectedMandiId);
        if (activeTargetMandi && activeTargetMandi.lat != null && activeTargetMandi.lng != null) {
          const routeCoords: [number, number][] = [
            [centerLat, centerLng],
            [activeTargetMandi.lat, activeTargetMandi.lng],
          ];

          routeLineRef.current = L.polyline(routeCoords, {
            color: "#3b6934",
            weight: 4,
            opacity: 0.8,
            dashArray: "8, 8",
          }).addTo(map);
        }
      }
    });
  }, [markets, userCoords, selectedMandiId, searchRadiusKm, searchScope, searchQuery, bestMandiId, leafletLoaded, lang, cleanLocationName]);

  // Auto-focus map to fit bounds between Farmer Origin and Searched/Selected Mandi Target
  useEffect(() => {
    if (!mapInstanceRef.current || !leafletLoaded || typeof window === "undefined") return;

    import("leaflet").then((L) => {
      const map = mapInstanceRef.current;
      if (!userCoords) return;

      if (searchScope === "maharashtra" && markersGroupRef.current) {
        try {
          const bounds = markersGroupRef.current.getBounds();
          if (bounds && bounds.isValid()) {
            map.fitBounds(bounds, { padding: [50, 50], animate: true, duration: 1.2 });
            return;
          }
        } catch (_) {}
      }

      if (selectedMandiId) {
        const targetMandi = markets.find(
          (m) => m.id === selectedMandiId || m.name.toLowerCase().includes(selectedMandiId.toLowerCase())
        );

        if (targetMandi && targetMandi.latitude != null && targetMandi.longitude != null) {
          const bounds = L.latLngBounds(
            [userCoords.lat, userCoords.lng],
            [targetMandi.latitude, targetMandi.longitude]
          );
          map.fitBounds(bounds, { padding: [60, 60], maxZoom: 13, animate: true, duration: 1.2 });
        }
      } else {
        map.flyTo([userCoords.lat, userCoords.lng], 11, { duration: 1.2 });
      }
    });
  }, [selectedMandiId, searchScope, userCoords, markets, leafletLoaded]);

  const handleCenterFarmer = () => {
    if (mapInstanceRef.current && userCoords) {
      mapInstanceRef.current.flyTo([userCoords.lat, userCoords.lng], 12, { duration: 1.2 });
    }
  };

  const handleFitAll = () => {
    if (mapInstanceRef.current && markersGroupRef.current) {
      const bounds = markersGroupRef.current.getBounds();
      if (bounds.isValid()) {
        mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50] });
      }
    }
  };

  return (
    <div className="relative w-full h-full min-h-[450px]">
      <div className="absolute top-4 left-4 z-[400] bg-surface/90 backdrop-blur-md p-1.5 rounded-xl shadow-lg border border-outline-variant flex items-center gap-1 text-xs font-bold">
        <button
          type="button"
          onClick={() => setMapLayer("voyager")}
          className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 cursor-pointer ${
            mapLayer === "voyager"
              ? "bg-primary text-on-primary shadow-sm"
              : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container"
          }`}
        >
          <span className="material-symbols-outlined text-[16px]">map</span>
          <span>GIS Street</span>
        </button>
        <button
          type="button"
          onClick={() => setMapLayer("satellite")}
          className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 cursor-pointer ${
            mapLayer === "satellite"
              ? "bg-primary text-on-primary shadow-sm"
              : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container"
          }`}
        >
          <span className="material-symbols-outlined text-[16px]">satellite_alt</span>
          <span>Satellite</span>
        </button>
        <button
          type="button"
          onClick={() => setMapLayer("osm")}
          className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 cursor-pointer ${
            mapLayer === "osm"
              ? "bg-primary text-on-primary shadow-sm"
              : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container"
          }`}
        >
          <span className="material-symbols-outlined text-[16px]">layers</span>
          <span>OSM</span>
        </button>
      </div>

      <div ref={mapContainerRef} className="w-full h-full rounded-none" />

      <div className="absolute bottom-6 left-4 z-[400] flex flex-col gap-2">
        <button
          type="button"
          onClick={() => {
            handleCenterFarmer();
            if (onDetectLocation) onDetectLocation();
          }}
          title={lang === "mr" ? `${cleanLocationName} प्रत्यक्ष स्थान शोधा` : `Detect location near ${cleanLocationName}`}
          className="p-2.5 bg-surface text-primary hover:bg-surface-container-high rounded-xl shadow-lg border border-outline-variant flex items-center gap-1.5 text-xs font-bold transition-transform active:scale-95 cursor-pointer"
        >
          <span className="material-symbols-outlined text-[18px]">my_location</span>
          <span className="hidden sm:inline">{cleanLocationName} {lang === "mr" ? "स्थान" : "Origin"}</span>
        </button>
        <button
          type="button"
          onClick={handleFitAll}
          title={lang === "mr" ? "सर्व बाजारपेठा पहा" : "View all mandis"}
          className="p-2.5 bg-surface text-on-surface hover:bg-surface-container-high rounded-xl shadow-lg border border-outline-variant flex items-center gap-1.5 text-xs font-bold transition-transform active:scale-95 cursor-pointer"
        >
          <span className="material-symbols-outlined text-[18px]">fit_screen</span>
          <span className="hidden sm:inline">{lang === "mr" ? "महाराष्ट्र विहंगावलोकन" : "Fit All"}</span>
        </button>
      </div>

      <div className="absolute bottom-6 right-4 z-[400] bg-surface/90 backdrop-blur-md p-3 rounded-xl shadow-xl border border-outline-variant max-w-[240px] text-[11px] font-semibold space-y-1.5 hidden md:block">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-primary flex items-center justify-center text-[8px] text-white">🚜</span>
          <span>{lang === "mr" ? `शेतकरी स्थान (${cleanLocationName})` : `Origin (${cleanLocationName})`}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-success-sage" />
          <span>{lang === "mr" ? "निकटतम APMC बाजार" : "Nearest APMC Mandi"}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-4 h-0.5 border-t-2 border-dashed border-primary" />
          <span>{lang === "mr" ? "थेट वाहतूक मार्ग" : "Optimized Transit Route"}</span>
        </div>
      </div>
    </div>
  );
};
