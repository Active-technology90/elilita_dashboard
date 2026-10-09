// src/components/dashboard/CompanyManagement/LocationPickerModal.tsx
import React, {
  useEffect,
  useRef,
  useState,
  useCallback,
  useMemo,
} from "react";
import { createPortal } from "react-dom";
import {
  X,
  MapPin,
  Search,
  Navigation,
  Check,
  Loader2,
  AlertTriangle,
  Info,
} from "lucide-react";
import booleanPointInPolygon from "@turf/boolean-point-in-polygon";
import { point } from "@turf/helpers";

/* ──────────────────────────────────────────────────────────────────
   Types & Constants
   ────────────────────────────────────────────────────────────────── */

interface LocationPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (lat: string, lon: string) => void;
  onSelectAddress?: (address: string) => void;
  initialLat?: string;
  initialLon?: string;
  initialAddress?: string;
}

interface LatLng {
  lat: number;
  lng: number;
}

// Addis Ababa, Ethiopia — center
const ADDIS_ABABA_CENTER: LatLng = { lat: 9.03, lng: 38.74 };

/**
 * Bounds derived from the polygon below.
 * Covers the FULL extent so nothing inside gets cut off.
 */
const ADDIS_ABABA_BOUNDS = {
  north: 9.0949264,
  south: 8.8342838,
  east: 38.9121271,
  west: 38.6400171,
};

/**
 * Addis Ababa boundary — exact coordinates from your GeoJSON file
 * (3rd feature / largest polygon). This is the FULL city boundary.
 */
const ADDIS_ABABA_POLYGON = {
  type: "Feature" as const,
  properties: {
    fill: "#312E81",
    "fill-opacity": 0.1,
    stroke: "#312E81",
    "stroke-opacity": 0.6,
  },
  geometry: {
    type: "Polygon" as const,
    coordinates: [
      [
        [38.739807, 8.8973726],
        [38.6920357, 8.9365647],
        [38.6400171, 8.9693422],
        [38.6839934, 9.0699516],
        [38.7151664, 9.0864423],
        [38.7652662, 9.0949264],
        [38.8192621, 9.0770977],
        [38.8723135, 9.0818733],
        [38.8868501, 9.0501182],
        [38.9121271, 8.993894],
        [38.9019203, 8.9555833],
        [38.8966715, 8.9337982],
        [38.8612825, 8.9376826],
        [38.878977, 8.9174833],
        [38.8793702, 8.8972829],
        [38.8701951, 8.8717572],
        [38.8625788, 8.8811635],
        [38.8302098, 8.8799093],
        [38.8247933, 8.8419881],
        [38.7947847, 8.8342838],
        [38.7850125, 8.8348411],
        [38.7741632, 8.854495],
        [38.7497522, 8.8562817],
        [38.739807, 8.8973726],
      ],
    ],
  },
};

const OUTSIDE_MESSAGE =
  "This location is outside Addis Ababa. Our service is currently available only within Addis Ababa.";

const roundCoord = (n: number) => n.toFixed(6);
const COORDINATE_REGEX = /^-?\d{1,3}(\.\d+)?$/;

/* ──────────────────────────────────────────────────────────────────
   Point-in-polygon using Turf.js
   ────────────────────────────────────────────────────────────────── */

const isWithinAddisAbaba = (lat: number, lng: number): boolean => {
  if (isNaN(lat) || isNaN(lng)) return false;

  // Quick bounding box check
  if (
    lat < ADDIS_ABABA_BOUNDS.south ||
    lat > ADDIS_ABABA_BOUNDS.north ||
    lng < ADDIS_ABABA_BOUNDS.west ||
    lng > ADDIS_ABABA_BOUNDS.east
  ) {
    return false;
  }

  // Turf.js point-in-polygon
  try {
    return booleanPointInPolygon(
      point([lng, lat]),
      ADDIS_ABABA_POLYGON as any
    );
  } catch {
    return false;
  }
};

/* ──────────────────────────────────────────────────────────────────
   Component
   ────────────────────────────────────────────────────────────────── */

export default function LocationPickerModal({
  isOpen,
  onClose,
  onSelect,
  onSelectAddress,
  initialLat,
  initialLon,
  initialAddress,
}: LocationPickerModalProps) {
  // ── State ────────────────────────────────────────────────────────
  const [selectedLat, setSelectedLat] = useState<string>(
    initialLat || String(ADDIS_ABABA_CENTER.lat)
  );
  const [selectedLon, setSelectedLon] = useState<string>(
    initialLon || String(ADDIS_ABABA_CENTER.lng)
  );
  const [searchQuery, setSearchQuery] = useState<string>(initialAddress || "");
  const [displayAddress, setDisplayAddress] = useState<string>(
    initialAddress || ""
  );
  const [searching, setSearching] = useState(false);
  const [detecting, setDetecting] = useState(false);
  const [leafletLoaded, setLeafletLoaded] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const [initialSetupDone, setInitialSetupDone] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<"error" | "success" | "info">(
    "info"
  );

  // ── Derived state: is current location valid? ─────────────────────
  const isLocationValid = useMemo(() => {
    if (
      !COORDINATE_REGEX.test(selectedLat) ||
      !COORDINATE_REGEX.test(selectedLon)
    ) {
      return false;
    }
    const lat = parseFloat(selectedLat);
    const lng = parseFloat(selectedLon);
    return isWithinAddisAbaba(lat, lng);
  }, [selectedLat, selectedLon]);

  // ── Refs ─────────────────────────────────────────────────────────
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const mapContainerId = useRef(
    "picker-map-" + Math.random().toString(36).slice(2)
  ).current;
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const selectedLatRef = useRef(selectedLat);
  const selectedLonRef = useRef(selectedLon);
  const onSelectAddressRef = useRef(onSelectAddress);
  const onCloseRef = useRef(onClose);
  const onSelectRef = useRef(onSelect);

  // Sync refs
  useEffect(() => {
    selectedLatRef.current = selectedLat;
    selectedLonRef.current = selectedLon;
    onSelectAddressRef.current = onSelectAddress;
    onCloseRef.current = onClose;
    onSelectRef.current = onSelect;
  });

  // ── Toast helper ──────────────────────────────────────────────────
  const showToast = useCallback(
    (msg: string, type: "error" | "success" | "info" = "info") => {
      setToastMessage(msg);
      setToastType(type);
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
      toastTimerRef.current = setTimeout(() => setToastMessage(null), 4000);
    },
    []
  );

  // ── Load Leaflet ──────────────────────────────────────────────────
  useEffect(() => {
    if (!isOpen) return;

    if ((window as any).L) {
      setLeafletLoaded(true);
      return;
    }

    const linkId = "leaflet-picker-css";
    if (!document.getElementById(linkId)) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      link.id = linkId;
      document.head.appendChild(link);
    }

    const scriptId = "leaflet-picker-js";
    if (!document.getElementById(scriptId)) {
      const script = document.createElement("script");
      script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
      script.id = scriptId;
      script.onload = () => setLeafletLoaded(true);
      script.onerror = () => showToast("Failed to load map library", "error");
      document.head.appendChild(script);
    } else {
      setLeafletLoaded(true);
    }
  }, [isOpen, showToast]);

  // ── Helpers: geocode & reverse geocode ────────────────────────────
  const reverseGeocode = useCallback(
    async (lat: number, lon: number): Promise<string | null> => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1&accept-language=en`
        );
        const data = await res.json();
        return data?.display_name ?? null;
      } catch {
        return null;
      }
    },
    []
  );

  const geocodeAddress = useCallback(
    async (address: string): Promise<LatLng | null> => {
      try {
        const searchQueryStr = `${address}, Addis Ababa, Ethiopia`;
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
            searchQueryStr
          )}&limit=5&accept-language=en&bounded=1&viewbox=38.6400171,9.0949264,38.9121271,8.8342838`
        );
        const data = await res.json();

        if (data?.length > 0) {
          for (const item of data) {
            const lat = parseFloat(item.lat);
            const lng = parseFloat(item.lon);
            if (isWithinAddisAbaba(lat, lng)) {
              return { lat, lng };
            }
          }
          return null;
        }
        return null;
      } catch {
        return null;
      }
    },
    []
  );

  // ─────────────────────────────────────────────────────────────────
  //  Current-location detection helper (reused by auto-detect + button)
  // ─────────────────────────────────────────────────────────────────
  const detectCurrentLocation = useCallback(
    (opts: { silentOnDenied?: boolean } = {}) =>
      new Promise<LatLng | null>((resolve) => {
        if (!navigator.geolocation) {
          if (!opts.silentOnDenied) {
            showToast("Geolocation not supported by your browser.", "error");
          }
          resolve(null);
          return;
        }

        setDetecting(true);

        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const curLat = position.coords.latitude;
            const curLon = position.coords.longitude;

            if (!isWithinAddisAbaba(curLat, curLon)) {
              // User's real position is outside Addis Ababa:
              // fall back to whatever we had before and inform the user.
              showToast(OUTSIDE_MESSAGE, "error");
              setDetecting(false);
              resolve(null);
              return;
            }

            const latStr = roundCoord(curLat);
            const lonStr = roundCoord(curLon);

            setSelectedLat(latStr);
            setSelectedLon(lonStr);

            const cb = onSelectAddressRef.current;
            const address = await reverseGeocode(curLat, curLon);
            const finalAddress =
              address || `${curLat.toFixed(6)}, ${curLon.toFixed(6)}`;
            if (cb) cb(finalAddress);
            setDisplayAddress(finalAddress);
            setSearchQuery(finalAddress);

            setDetecting(false);
            resolve({ lat: curLat, lng: curLon });
          },
          (err) => {
            setDetecting(false);
            if (!opts.silentOnDenied) {
              showToast(
                err.code === 1
                  ? "Location permission denied. Enable location access."
                  : "Unable to retrieve location.",
                "error"
              );
            }
            resolve(null);
          },
          { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
      }),
    [reverseGeocode, showToast]
  );

  // ── Initial setup (runs once per open) — AUTO-DETECT CURRENT LOCATION ──
  useEffect(() => {
    if (!isOpen) {
      setInitialSetupDone(false);
      setToastMessage(null);
      return;
    }

    if (initialSetupDone) return;
    setInitialSetupDone(true);

    const init = async () => {
      // 👉 Primary behavior: auto-detect the user's current location.
      const detected = await detectCurrentLocation({ silentOnDenied: true });
      if (detected) return; // Success — we're done.

      // 👉 Fallback #1: use stored/initial coordinates if provided & valid
      if (
        initialLat &&
        initialLon &&
        COORDINATE_REGEX.test(initialLat) &&
        COORDINATE_REGEX.test(initialLon)
      ) {
        const lat = parseFloat(initialLat);
        const lng = parseFloat(initialLon);

        if (isWithinAddisAbaba(lat, lng)) {
          setSelectedLat(initialLat);
          setSelectedLon(initialLon);
          setSearchQuery(initialAddress || "");
          setDisplayAddress(initialAddress || "");
          return;
        }

        setSelectedLat(String(ADDIS_ABABA_CENTER.lat));
        setSelectedLon(String(ADDIS_ABABA_CENTER.lng));
        setSearchQuery("");
        setDisplayAddress("");
        showToast(OUTSIDE_MESSAGE, "error");
        return;
      }

      // 👉 Fallback #2: geocode the stored address
      if (initialAddress && initialAddress.trim() !== "") {
        setSearching(true);
        setSearchQuery(initialAddress);
        const coords = await geocodeAddress(initialAddress);
        if (coords) {
          setSelectedLat(roundCoord(coords.lat));
          setSelectedLon(roundCoord(coords.lng));
          setDisplayAddress(initialAddress);
        } else {
          showToast(
            "Could not locate the company address in Addis Ababa. Using default location.",
            "info"
          );
          setSelectedLat(String(ADDIS_ABABA_CENTER.lat));
          setSelectedLon(String(ADDIS_ABABA_CENTER.lng));
          setDisplayAddress("");
        }
        setSearching(false);
        return;
      }

      // 👉 Fallback #3: default center of Addis Ababa
      setSelectedLat(String(ADDIS_ABABA_CENTER.lat));
      setSelectedLon(String(ADDIS_ABABA_CENTER.lng));
      setDisplayAddress("");
    };

    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, initialSetupDone]);

  // ── Map creation ──────────────────────────────────────────────────
  useEffect(() => {
    if (!isOpen || !leafletLoaded || !initialSetupDone) return;

    const L = (window as any).L;
    if (!L) return;

    if (mapRef.current) return;

    const startLat =
      parseFloat(selectedLatRef.current) || ADDIS_ABABA_CENTER.lat;
    const startLng =
      parseFloat(selectedLonRef.current) || ADDIS_ABABA_CENTER.lng;

    const container = document.getElementById(mapContainerId);
    if (!container) return;

    // Map instance with restricted bounds to Addis Ababa
    const map = L.map(container, {
      zoomControl: false,
      attributionControl: false,
      maxBounds: [
        [ADDIS_ABABA_BOUNDS.south, ADDIS_ABABA_BOUNDS.west],
        [ADDIS_ABABA_BOUNDS.north, ADDIS_ABABA_BOUNDS.east],
      ],
      maxBoundsViscosity: 1.0,
      minZoom: 11,
    }).setView([startLat, startLng], 15); // closer zoom for current location
    mapRef.current = map;

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      noWrap: true,
    }).addTo(map);

    // Addis Ababa polygon overlay
    L.geoJSON(ADDIS_ABABA_POLYGON, {
      style: {
        fillColor: "#312E81",
        fillOpacity: 0.05,
        color: "#312E81",
        weight: 2,
        opacity: 0.5,
        dashArray: "5, 5",
      },
    }).addTo(map);

    const pinIcon = L.icon({
      iconUrl:
        "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzYiIGhlaWdodD0iNDgiIHZpZXdCb3g9IjAgMCAzNiA0OCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTE4IDBDOC4wNjcgMCAwIDguMDY3IDAgMThDMCAzMS41IDE4IDQ4IDE4IDQ4QzE4IDQ4IDM2IDMxLjUgMzYgMThDMzYgOC4wNjcgMjcuOTMzIDAgMTggMFoiIGZpbGw9IiM2NzRGQTMiLz4KPGNpcmNsZSBjeD0iMTgiIGN5PSIxOCIgcj0iNyIgZmlsbD0id2hpdGUiLz4KPC9zdmc+",
      iconSize: [36, 48],
      iconAnchor: [18, 48],
      popupAnchor: [0, -48],
    });

    const marker = L.marker([startLat, startLng], {
      draggable: true,
      icon: pinIcon,
    }).addTo(map);
    markerRef.current = marker;

    const handleCoordUpdate = async (lat: number, lng: number) => {
      const latStr = roundCoord(lat);
      const lngStr = roundCoord(lng);
      setSelectedLat(latStr);
      setSelectedLon(lngStr);

      const cb = onSelectAddressRef.current;
      if (cb) {
        const address = await reverseGeocode(lat, lng);
        const finalAddress = address || `${latStr}, ${lngStr}`;
        cb(finalAddress);
        setDisplayAddress(finalAddress);
        setSearchQuery(finalAddress);
      } else {
        setDisplayAddress(`${latStr}, ${lngStr}`);
      }
    };

    // ── Marker drag: reject if outside ──
    marker.on("dragend", async () => {
      const pos = marker.getLatLng();
      if (!isWithinAddisAbaba(pos.lat, pos.lng)) {
        showToast(OUTSIDE_MESSAGE, "error");
        const lastLat = parseFloat(selectedLatRef.current);
        const lastLng = parseFloat(selectedLonRef.current);
        if (!isNaN(lastLat) && !isNaN(lastLng)) {
          marker.setLatLng([lastLat, lastLng]);
        } else {
          marker.setLatLng([ADDIS_ABABA_CENTER.lat, ADDIS_ABABA_CENTER.lng]);
        }
        return;
      }
      await handleCoordUpdate(pos.lat, pos.lng);
    });

    // ── Map click: reject if outside ──
    map.on("click", async (e: any) => {
      const { lat, lng } = e.latlng;
      if (!isWithinAddisAbaba(lat, lng)) {
        showToast(OUTSIDE_MESSAGE, "error");
        return;
      }
      marker.setLatLng(e.latlng);
      await handleCoordUpdate(lat, lng);
    });

    setMapReady(true);

    const resizeObserver = new ResizeObserver(() => {
      map.invalidateSize();
    });
    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
      setMapReady(false);
    };
  }, [isOpen, leafletLoaded, initialSetupDone, reverseGeocode, showToast]);

  // ── Sync map view when selected coordinates change ────────────────
  useEffect(() => {
    if (!mapReady || !mapRef.current || !markerRef.current) return;

    const lat = parseFloat(selectedLat) || ADDIS_ABABA_CENTER.lat;
    const lng = parseFloat(selectedLon) || ADDIS_ABABA_CENTER.lng;

    mapRef.current.setView([lat, lng], mapRef.current.getZoom());
    markerRef.current.setLatLng([lat, lng]);
  }, [selectedLat, selectedLon, mapReady]);

  // ── Search handler ────────────────────────────────────────────────
  const performSearch = useCallback(
    async (query: string) => {
      if (!query.trim() || !mapRef.current) return;

      setSearching(true);
      setToastMessage(null);
      try {
        const coords = await geocodeAddress(query);
        if (coords) {
          setSelectedLat(roundCoord(coords.lat));
          setSelectedLon(roundCoord(coords.lng));
          const cb = onSelectAddressRef.current;
          const fullAddr = await reverseGeocode(coords.lat, coords.lng);
          const finalAddress = fullAddr || query;
          if (cb) cb(finalAddress);
          setDisplayAddress(finalAddress);
          setSearchQuery(finalAddress);
        } else {
          showToast(OUTSIDE_MESSAGE, "error");
        }
      } catch {
        showToast("Search failed. Check your connection.", "error");
      } finally {
        setSearching(false);
      }
    },
    [geocodeAddress, reverseGeocode, showToast]
  );

  const handleSearchInputChange = (value: string) => {
    setSearchQuery(value);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    if (value.trim().length >= 3) {
      searchTimerRef.current = setTimeout(() => performSearch(value), 600);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    performSearch(searchQuery);
  };

  const clearSearch = () => {
    setSearchQuery("");
    setDisplayAddress("");
  };

  // ── Manual "My Location" button ──────────────────────────────────
  const handleDetectLocation = () => {
    detectCurrentLocation({ silentOnDenied: false });
  };

  // ── Save ──────────────────────────────────────────────────────────
  const handleSave = () => {
    if (
      !COORDINATE_REGEX.test(selectedLat) ||
      !COORDINATE_REGEX.test(selectedLon)
    ) {
      showToast("Invalid coordinates", "error");
      return;
    }

    const lat = parseFloat(selectedLat);
    const lng = parseFloat(selectedLon);

    if (!isWithinAddisAbaba(lat, lng)) {
      showToast(OUTSIDE_MESSAGE, "error");
      return;
    }

    onSelectRef.current(selectedLat, selectedLon);
    onCloseRef.current();
  };

  // ── Cleanup timers on unmount ────────────────────────────────────
  useEffect(() => {
    return () => {
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, []);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/60 backdrop-blur-md p-0 sm:p-4 md:p-6">
      <div className="bg-white w-full h-full sm:h-auto sm:max-h-[90vh] md:h-[85vh] md:max-h-[85vh] md:max-w-6xl flex flex-col overflow-hidden shadow-2xl border border-gray-100 rounded-none sm:rounded-2xl">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-purple-50/50 via-white to-indigo-50/50 shrink-0">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="p-2.5 bg-gradient-to-br from-secondary/15 to-secondary-light/15 rounded-2xl shadow-inner shrink-0">
              <MapPin className="h-5 w-5 text-secondary" />
            </div>
            <div className="min-w-0">
              <h3 className="text-base sm:text-lg font-bold text-gray-900 leading-tight truncate">
                Select Company Location
              </h3>
              <p className="text-[11px] sm:text-xs text-gray-500 font-medium mt-0.5">
                Addis Ababa, Ethiopia — Search, move the marker, or use GPS
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-3 hover:bg-gray-100 text-gray-500 hover:text-gray-800 rounded-full transition-all duration-200 shrink-0"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Map Area */}
          <div className="relative md:w-[65%] h-[45vh] md:h-full order-1 md:order-1">
            {(!leafletLoaded || !initialSetupDone) && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-white z-10 gap-3">
                <Loader2 className="h-8 w-8 text-secondary animate-spin" />
                <p className="text-xs text-gray-500 font-medium">
                  {!leafletLoaded
                    ? "Loading map..."
                    : detecting
                    ? "Detecting your current location..."
                    : "Preparing location..."}
                </p>
              </div>
            )}

            <div id={mapContainerId} className="w-full h-full" />

            {leafletLoaded && initialSetupDone && (
              <button
                onClick={handleDetectLocation}
                disabled={detecting}
                className="absolute top-4 left-4 z-10 bg-white hover:bg-gray-50 text-gray-800 p-3 rounded-2xl shadow-lg border border-gray-100 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2 font-bold text-xs"
              >
                {detecting ? (
                  <Loader2 className="h-4 w-4 animate-spin text-secondary" />
                ) : (
                  <Navigation className="h-4 w-4 text-secondary" />
                )}
                <span className="hidden sm:inline">
                  {detecting ? "Locating..." : "My Location"}
                </span>
              </button>
            )}

            {leafletLoaded && initialSetupDone && (
              <div className="absolute top-4 right-4 z-10 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-lg border border-gray-100 flex items-center gap-1.5">
                <MapPin className="h-3 w-3 text-secondary" />
                <span className="text-[10px] font-bold text-gray-700">
                  Addis Ababa
                </span>
              </div>
            )}

            {toastMessage && (
              <div
                className={`absolute bottom-4 left-4 right-4 z-20 rounded-lg p-3 text-xs flex items-start gap-2 shadow-lg ${
                  toastType === "error"
                    ? "bg-red-50 border border-red-200 text-red-700"
                    : toastType === "success"
                    ? "bg-green-50 border border-green-200 text-green-700"
                    : "bg-blue-50 border border-blue-200 text-blue-700"
                }`}
              >
                {toastType === "error" ? (
                  <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                ) : toastType === "success" ? (
                  <Check className="h-4 w-4 flex-shrink-0" />
                ) : (
                  <Info className="h-4 w-4 flex-shrink-0" />
                )}
                <span className="flex-1">{toastMessage}</span>
                <button
                  onClick={() => setToastMessage(null)}
                  className="text-current opacity-70 hover:opacity-100"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="flex-1 border-t md:border-t-0 md:border-l border-gray-100 flex flex-col bg-gradient-to-b from-white to-gray-50/50 overflow-y-auto order-2 md:order-2">
            <div className="p-4 sm:p-5 space-y-3 md:space-y-5 flex-1">
              {/* Search Bar */}
              <form onSubmit={handleSearchSubmit} className="relative">
                <input
                  type="text"
                  placeholder="Search address or place in Addis Ababa..."
                  value={searchQuery}
                  onChange={(e) => handleSearchInputChange(e.target.value)}
                  className="w-full pl-10 pr-12 py-3 text-sm border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-secondary/20 focus:border-secondary transition-all bg-white shadow-sm"
                />
                <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-gray-400" />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={clearSearch}
                    className="absolute right-10 top-3.5 text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
                <button
                  type="submit"
                  disabled={searching}
                  className="absolute right-2 top-2.5 p-1.5 bg-gray-100 hover:bg-secondary text-gray-500 hover:text-white rounded-lg transition-all"
                >
                  {searching ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Check className="h-4 w-4" />
                  )}
                </button>
              </form>

              {/* Search restriction notice */}
              <div className="flex items-center gap-2 px-3 py-2 bg-indigo-50/60 border border-indigo-100 rounded-xl">
                <Info className="h-3.5 w-3.5 text-indigo-500 flex-shrink-0" />
                <p className="text-[10px] text-indigo-600 font-medium">
                  Search is restricted to Addis Ababa, Ethiopia
                </p>
              </div>

              {/* Location validity warning */}
              {!isLocationValid && (
                <div className="flex items-start gap-2.5 px-3.5 py-3 bg-red-50 border border-red-200 rounded-xl">
                  <AlertTriangle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-[11px] font-bold text-red-700">
                      Outside Addis Ababa
                    </p>
                    <p className="text-[10px] text-red-600 mt-0.5 leading-relaxed">
                      {OUTSIDE_MESSAGE}
                    </p>
                  </div>
                </div>
              )}

              {/* Coordinates Card */}
              <div
                className={`bg-white rounded-2xl border p-4 space-y-2 md:space-y-4 shadow-sm transition-colors ${
                  isLocationValid ? "border-gray-200" : "border-red-200"
                }`}
              >
                <h4 className="text-xs font-bold text-secondary uppercase tracking-wider flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Target Coordinates
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-500 uppercase mb-1">
                      Latitude
                    </label>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={selectedLat}
                      onChange={(e) => setSelectedLat(e.target.value)}
                      className={`w-full border rounded-lg p-2 text-sm font-mono bg-gray-50 focus:bg-white focus:ring-1 ${
                        isLocationValid
                          ? "border-gray-200 focus:ring-secondary/30"
                          : "border-red-300 focus:ring-red-300/30"
                      }`}
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-500 uppercase mb-1">
                      Longitude
                    </label>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={selectedLon}
                      onChange={(e) => setSelectedLon(e.target.value)}
                      className={`w-full border rounded-lg p-2 text-sm font-mono bg-gray-50 focus:bg-white focus:ring-1 ${
                        isLocationValid
                          ? "border-gray-200 focus:ring-secondary/30"
                          : "border-red-300 focus:ring-red-300/30"
                      }`}
                    />
                  </div>
                </div>
              </div>

              {/* Address Preview */}
              <div className="bg-white rounded-2xl border border-gray-200 p-4 space-y-2 shadow-sm">
                <h4 className="text-xs font-bold text-secondary uppercase tracking-wider flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Selected Address
                </h4>
                <p className="text-sm text-gray-700 leading-relaxed break-words min-h-[2rem]">
                  {displayAddress || "—"}
                </p>
              </div>

              {/* Info note */}
              <div className="hidden md:p-3.5 bg-amber-50/60 border border-amber-100 rounded-xl">
                <p className="text-[11px] text-amber-700 leading-relaxed font-medium">
                  💡 Accurate coordinates ensure precise delivery routes, fees,
                  and dispatch sequences within Addis Ababa.
                </p>
              </div>
            </div>

            {/* Sticky Action Bar */}
            <div className="p-4 border-t border-gray-100 bg-white/80 backdrop-blur-sm flex flex-row gap-3 shrink-0">
              <button
                onClick={onClose}
                className="flex-1 py-3 border-2 border-gray-200 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-50 active:scale-[0.98] transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={!isLocationValid}
                title={!isLocationValid ? OUTSIDE_MESSAGE : "Apply this location"}
                className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                  isLocationValid
                    ? "bg-gradient-to-r from-secondary to-secondary-light hover:from-[#5b4694] hover:to-[#6b55a8] text-white shadow-lg shadow-purple-100 active:scale-[0.98]"
                    : "bg-gray-200 text-gray-400 cursor-not-allowed"
                }`}
              >
                <Check className="h-5 w-5" />
                Apply Location
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}