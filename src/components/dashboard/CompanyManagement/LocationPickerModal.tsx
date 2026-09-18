// src/components/dashboard/CompanyManagement/LocationPickerModal.tsx
import React, { useEffect, useRef, useState, useCallback } from "react";
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

const DEFAULT_CENTER: LatLng = { lat: 9.03, lng: 38.74 }; // Addis Ababa
const roundCoord = (n: number) => n.toFixed(6);
const COORDINATE_REGEX = /^-?\d{1,3}(\.\d+)?$/;

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
    initialLat || String(DEFAULT_CENTER.lat)
  );
  const [selectedLon, setSelectedLon] = useState<string>(
    initialLon || String(DEFAULT_CENTER.lng)
  );
  const [searchQuery, setSearchQuery] = useState<string>(
    initialAddress || ""
  );
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

  // ── Refs ─────────────────────────────────────────────────────────
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const mapContainerId = useRef(
    "picker-map-" + Math.random().toString(36).slice(2)
  ).current;
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Keep latest values to avoid stale closures in Leaflet event handlers
  const selectedLatRef = useRef(selectedLat);
  const selectedLonRef = useRef(selectedLon);
  const onSelectAddressRef = useRef(onSelectAddress);
  const onCloseRef = useRef(onClose);
  const onSelectRef = useRef(onSelect);
  const displayAddressRef = useRef(displayAddress);
  const searchQueryRef = useRef(searchQuery);

  // Sync refs
  useEffect(() => {
    selectedLatRef.current = selectedLat;
    selectedLonRef.current = selectedLon;
    onSelectAddressRef.current = onSelectAddress;
    onCloseRef.current = onClose;
    onSelectRef.current = onSelect;
    displayAddressRef.current = displayAddress;
    searchQueryRef.current = searchQuery;
  });

  // ── Toast helper ──────────────────────────────────────────────────
  const showToast = useCallback(
    (msg: string, type: "error" | "success" | "info" = "info") => {
      setToastMessage(msg);
      setToastType(type);
      setTimeout(() => setToastMessage(null), 4000);
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
      script.onerror = () =>
        showToast("Failed to load map library", "error");
      document.head.appendChild(script);
    } else {
      setLeafletLoaded(true);
    }
  }, [isOpen, showToast]);

  // ── Helpers: geocode & reverse geocode ───────────────────────────
  const reverseGeocode = useCallback(
    async (lat: number, lon: number): Promise<string | null> => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`
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
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`
        );
        const data = await res.json();
        if (data?.length > 0) {
          return {
            lat: parseFloat(data[0].lat),
            lng: parseFloat(data[0].lon),
          };
        }
        return null;
      } catch {
        return null;
      }
    },
    []
  );

  // ── Initial coordinates setup (runs once per open) ───────────────
  useEffect(() => {
    if (!isOpen) {
      setInitialSetupDone(false);
      setToastMessage(null);
      return;
    }

    if (initialSetupDone) return;
    setInitialSetupDone(true);

    const init = async () => {
      // 1. Use explicit coordinates if both provided and valid
      if (
        initialLat &&
        initialLon &&
        COORDINATE_REGEX.test(initialLat) &&
        COORDINATE_REGEX.test(initialLon)
      ) {
        setSelectedLat(initialLat);
        setSelectedLon(initialLon);
        setSearchQuery(initialAddress || "");
        setDisplayAddress(initialAddress || "");
        return;
      }

      // 2. Geocode stored address
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
            "Could not locate the company address. Using default location.",
            "info"
          );
          setSelectedLat(String(DEFAULT_CENTER.lat));
          setSelectedLon(String(DEFAULT_CENTER.lng));
          setDisplayAddress("");
        }
        setSearching(false);
        return;
      }

      // 3. Default center
      setSelectedLat(String(DEFAULT_CENTER.lat));
      setSelectedLon(String(DEFAULT_CENTER.lng));
      setDisplayAddress("");
    };

    init();
  }, [isOpen, initialLat, initialLon, initialAddress, initialSetupDone, geocodeAddress, showToast]);

  // ── Map creation (once per open, after initial coordinates are set) ─
  useEffect(() => {
    if (!isOpen || !leafletLoaded || !initialSetupDone) return;

    const L = (window as any).L;
    if (!L) return;

    // Prevent duplicate creation
    if (mapRef.current) return;

    const startLat = parseFloat(selectedLatRef.current) || DEFAULT_CENTER.lat;
    const startLng = parseFloat(selectedLonRef.current) || DEFAULT_CENTER.lng;

    const container = document.getElementById(mapContainerId);
    if (!container) return;

    // Map instance
    const map = L.map(container, {
      zoomControl: false,
      attributionControl: false,
    }).setView([startLat, startLng], 13);
    mapRef.current = map;

    // Tile layer
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
    }).addTo(map);

    // Custom marker icon (modern pin)
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

    // ── Helper to update everything when coordinates change ────────
    const handleCoordUpdate = async (lat: number, lng: number) => {
      const latStr = roundCoord(lat);
      const lngStr = roundCoord(lng);
      setSelectedLat(latStr);
      setSelectedLon(lngStr);

      // Reverse geocode
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

    // Marker drag
    marker.on("dragend", async () => {
      const pos = marker.getLatLng();
      await handleCoordUpdate(pos.lat, pos.lng);
    });

    // Map click
    map.on("click", async (e: any) => {
      marker.setLatLng(e.latlng);
      await handleCoordUpdate(e.latlng.lat, e.latlng.lng);
    });

    setMapReady(true);

    // ResizeObserver
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
  }, [isOpen, leafletLoaded, initialSetupDone, reverseGeocode]);

  // ── Sync map view when selected coordinates change (from search/GPS) ─
  useEffect(() => {
    if (!mapReady || !mapRef.current || !markerRef.current) return;

    const lat = parseFloat(selectedLat) || DEFAULT_CENTER.lat;
    const lng = parseFloat(selectedLon) || DEFAULT_CENTER.lng;

    mapRef.current.setView([lat, lng], mapRef.current.getZoom());
    markerRef.current.setLatLng([lat, lng]);
  }, [selectedLat, selectedLon, mapReady]);

  // ── Search handler ───────────────────────────────────────────────
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
          showToast("Address not found. Please try a different search.", "error");
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

  // ── GPS detection ─────────────────────────────────────────────────
  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      showToast("Geolocation not supported by your browser.", "error");
      return;
    }

    setDetecting(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const curLat = position.coords.latitude;
        const curLon = position.coords.longitude;
        setSelectedLat(roundCoord(curLat));
        setSelectedLon(roundCoord(curLon));

        const cb = onSelectAddressRef.current;
        const address = await reverseGeocode(curLat, curLon);
        const finalAddress = address || `${curLat.toFixed(6)}, ${curLon.toFixed(6)}`;
        if (cb) cb(finalAddress);
        setDisplayAddress(finalAddress);
        setSearchQuery(finalAddress);
        setDetecting(false);
      },
      (err) => {
        showToast(
          err.code === 1
            ? "Location permission denied. Enable location access."
            : "Unable to retrieve location.",
          "error"
        );
        setDetecting(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // ── Copy coordinates ──────────────────────────────────────────────
  // const copyCoordinates = () => {
  //   const text = `${selectedLat}, ${selectedLon}`;
  //   navigator.clipboard.writeText(text).then(
  //     () => showToast("Coordinates copied to clipboard", "success"),
  //     () => showToast("Failed to copy", "error")
  //   );
  // };

  // ── Save ──────────────────────────────────────────────────────────
  const handleSave = () => {
    if (
      !COORDINATE_REGEX.test(selectedLat) ||
      !COORDINATE_REGEX.test(selectedLon)
    ) {
      showToast("Invalid coordinates", "error");
      return;
    }
    onSelectRef.current(selectedLat, selectedLon);
    onCloseRef.current();
  };

  // ── Cleanup timers on unmount ────────────────────────────────────
  useEffect(() => {
    return () => {
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
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
                Search, move the marker, or use GPS
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
                    : "Locating company address..."}
                </p>
              </div>
            )}

            <div id={mapContainerId} className="w-full h-full" />

            {/* Floating GPS button */}
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

            {/* Toast / Error display on map area */}
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
                  placeholder="Search address or place..."
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

              {/* Coordinates Card */}
              <div className="bg-white rounded-2xl border border-gray-200 p-4 space-y-2 md:space-y-4 shadow-sm">
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
                      className="w-full border border-gray-200 rounded-lg p-2 text-sm font-mono bg-gray-50 focus:bg-white focus:ring-1 focus:ring-secondary/30"
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
                      className="w-full border border-gray-200 rounded-lg p-2 text-sm font-mono bg-gray-50 focus:bg-white focus:ring-1 focus:ring-secondary/30"
                    />
                  </div>
                </div>
                {/* <button
                  onClick={copyCoordinates}
                  className="w-full py-2 border border-gray-200 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-100 active:scale-[0.98] transition-all flex items-center justify-center gap-1.5"
                >
                  <Copy className="h-3.5 w-3.5" />
                  Copy Coordinates
                </button> */}
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
                  and dispatch sequences.
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
                className="flex-1 py-3 bg-gradient-to-r from-secondary to-secondary-light hover:from-[#5b4694] hover:to-[#6b55a8] text-white rounded-xl text-sm font-bold shadow-lg shadow-purple-100 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
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