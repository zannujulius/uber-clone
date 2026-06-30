import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { GoogleMap, Marker, useJsApiLoader } from "@react-google-maps/api";
import { clearToken, logout } from "@/features/auth/authSlice";
import {
  clearFareEstimate,
  fareEstimateRequested,
  setDropoff,
  setPickup,
  setStatus,
} from "@/features/ride/rideSlice";
import {
  wsConnect,
  wsDisconnect,
  wsSend,
} from "@/features/websocket/websocketSlice";
import { useAppDispatch, useAppSelector } from "@/store";
import Button from "@/components/ui/Button";
import StatusBadge from "@/components/ui/StatusBadge";
import PlacesInput from "@/components/PlacesInput";
import type { Place } from "@/features/ride/types";

const LIBRARIES: "places"[] = ["places"];

const DARK_MAP: google.maps.MapTypeStyle[] = [
  { elementType: "geometry", stylers: [{ color: "#212121" }] },
  { elementType: "labels.icon", stylers: [{ visibility: "off" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#757575" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#212121" }] },
  { featureType: "poi", stylers: [{ visibility: "off" }] },
  { featureType: "transit", stylers: [{ visibility: "off" }] },
  {
    featureType: "road",
    elementType: "geometry.fill",
    stylers: [{ color: "#2c2c2c" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry",
    stylers: [{ color: "#3c3c3c" }],
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#000000" }],
  },
  {
    featureType: "administrative.locality",
    elementType: "labels.text.fill",
    stylers: [{ color: "#bdbdbd" }],
  },
];

export default function Home() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { rider, token } = useAppSelector((s) => s.auth);
  const { pickup, dropoff, status, fareEstimate, fareEstimateStatus, fareEstimateError } =
    useAppSelector((s) => s.ride);
  const wsStatus = useAppSelector((s) => s.websocket.status);

  const mapRef = useRef<google.maps.Map | null>(null);
  const lastEstimateRequestRef = useRef<string | null>(null);
  const [center, setCenter] = useState({ lat: 40.7128, lng: -74.006 });
  const [locating, setLocating] = useState(false);

  const { isLoaded } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries: LIBRARIES,
  });

  const onMapLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
  }, []);

  const setPickupFromCoordinates = useCallback(
    async (lat: number, lng: number) => {
      let address = "Current Location";

      if (isLoaded) {
        try {
          const geocoder = new google.maps.Geocoder();
          const result = await geocoder.geocode({ location: { lat, lng } });
          address = result.results[0]?.formatted_address ?? address;
        } catch (error) {
          console.error("Reverse geocode error:", error);
        }
      }

      dispatch(setPickup({ address, lat, lng }));
      setCenter({ lat, lng });
      mapRef.current?.panTo({ lat, lng });
    },
    [dispatch, isLoaded],
  );

  // Connect WebSocket on mount
  useEffect(() => {
    if (token && wsStatus === "disconnected") dispatch(wsConnect(token));
  }, [dispatch, token, wsStatus]);

  // Get current location
  useEffect(() => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        await setPickupFromCoordinates(lat, lng);
        setLocating(false);
      },
      () => setLocating(false),
    );
  }, [setPickupFromCoordinates]);

  const handlePickup = (place: Place) => {
    dispatch(setPickup(place));
    mapRef.current?.panTo({ lat: place.lat, lng: place.lng });
    mapRef.current?.setZoom(15);
  };

  const handleDropoff = (place: Place) => {
    dispatch(setDropoff(place));
    if (pickup) {
      const bounds = new google.maps.LatLngBounds();
      bounds.extend({ lat: pickup.lat, lng: pickup.lng });
      bounds.extend({ lat: place.lat, lng: place.lng });
      mapRef.current?.fitBounds(bounds, 120);
    }
  };

  const handleConfirmRide = () => {
    if (!pickup || !dropoff || !fareEstimate) return;
    if (wsStatus !== "connected") {
      alert(
        "Not connected to the ride server. Make sure the API gateway and rider WebSocket server are running.",
      );
      return;
    }
    dispatch(
      wsSend({
        event: "trip:request",
        data: {
          pickup_latitude: pickup.lat,
          pickup_longitude: pickup.lng,
          dropoff_latitude: dropoff.lat,
          dropoff_longitude: dropoff.lng,
          pickup_address: pickup.address,
          dropoff_address: dropoff.address,
          estimate_id: fareEstimate.estimateId,
          estimated_fare: fareEstimate.amount,
          currency: fareEstimate.currency,
          distance_km: fareEstimate.distanceKm,
          duration_minutes: fareEstimate.durationMinutes,
        },
      }),
    );
    dispatch(setStatus("searching"));
    navigate("/trip");
  };

  const handleLogout = () => {
    dispatch(wsDisconnect());
    dispatch(logout());
    clearToken();
    navigate("/");
  };

  useEffect(() => {
    if (!pickup || !dropoff) {
      lastEstimateRequestRef.current = null;
      dispatch(clearFareEstimate());
      return;
    }

    if (wsStatus !== "connected" || status === "searching") return;

    const requestKey = [
      pickup.lat.toFixed(6),
      pickup.lng.toFixed(6),
      dropoff.lat.toFixed(6),
      dropoff.lng.toFixed(6),
    ].join(":");

    if (
      requestKey === lastEstimateRequestRef.current &&
      (fareEstimateStatus === "pending" || fareEstimateStatus === "ready")
    ) {
      return;
    }

    const timer = window.setTimeout(() => {
      lastEstimateRequestRef.current = requestKey;
      dispatch(fareEstimateRequested());
      dispatch(
        wsSend({
          event: "trip:estimate",
          data: {
            pickup_latitude: pickup.lat,
            pickup_longitude: pickup.lng,
            dropoff_latitude: dropoff.lat,
            dropoff_longitude: dropoff.lng,
            pickup_address: pickup.address,
            dropoff_address: dropoff.address,
          },
        }),
      );
    }, 350);

    return () => window.clearTimeout(timer);
  }, [dispatch, dropoff, fareEstimateStatus, pickup, status, wsStatus]);

  // Button is enabled as long as both locations are set.
  // WS connection is checked at click time with a clear error message.
  const canBook =
    !!pickup && !!dropoff && fareEstimateStatus === "ready" && !!fareEstimate;
  const isSearching = status === "searching";

  return (
    <div className="h-screen w-screen flex overflow-hidden bg-zinc-950">
      {/* ── Left sidebar panel ─────────────────────────────────────────── */}
      <div className="relative z-10 w-[380px] flex flex-col bg-surface border-r border-border shadow-2xl shrink-0">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center shrink-0">
              <span className="text-zinc-900 text-sm font-black">R</span>
            </div>
            <div>
              <p className="text-xs text-zinc-500">Good day,</p>
              <p className="text-sm font-bold text-white">
                {rider?.first_name ?? "Rider"} 👋
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge status={wsStatus} />
            <button
              onClick={handleLogout}
              className="w-8 h-8 rounded-lg bg-card border border-border flex items-center justify-center text-zinc-500 hover:text-white hover:border-zinc-500 transition-colors"
              title="Logout"
            >
              ↩
            </button>
          </div>
        </div>

        {/* Where to */}
        <div className="flex-1 overflow-y-auto scrollbar-hide">
          <div className="px-5 py-5">
            <h2 className="text-xl font-black text-white mb-5 tracking-tight">
              Where to?
            </h2>

            {/* Location inputs */}
            <div className="bg-card border border-border rounded-2xl overflow-visible mb-4">
              {/* Pickup */}
              <div className="flex items-start gap-3 px-4 py-3.5 relative">
                <div className="flex flex-col items-center gap-1 pt-1 shrink-0">
                  <div className="w-3 h-3 rounded-full bg-accent border-2 border-zinc-900 shadow-lg shadow-accent/30" />
                  <div className="w-px h-8 bg-border" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                      Pickup
                    </p>
                    {pickup && (
                      <span className="text-[10px] text-green-400 font-semibold">
                        ✓ Set
                      </span>
                    )}
                  </div>
                  {locating ? (
                    <p className="text-zinc-500 text-sm animate-pulse">
                      Getting your location…
                    </p>
                  ) : (
                    <PlacesInput
                      placeholder="Set pickup location"
                      defaultValue={pickup?.address ?? ""}
                      onSelect={handlePickup}
                      mapsReady={isLoaded}
                    />
                  )}
                </div>
                <button
                  onClick={() =>
                    navigator.geolocation.getCurrentPosition((p) => {
                      const { latitude: lat, longitude: lng } = p.coords;
                      void setPickupFromCoordinates(lat, lng);
                    })
                  }
                  className="shrink-0 text-accent hover:text-yellow-300 transition-colors text-sm mt-1"
                  title="Use current location"
                >
                  📍
                </button>
              </div>

              <div className="h-px bg-border mx-4" />

              {/* Dropoff */}
              <div className="flex items-start gap-3 px-4 py-3.5 relative">
                <div className="flex flex-col items-center gap-1 pt-1 shrink-0">
                  <div className="w-px h-8 bg-transparent" />
                  <div className="w-3 h-3 rounded-sm bg-red-500 shadow-lg shadow-red-500/30" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                      Drop-off
                    </p>
                    {dropoff && (
                      <span className="text-[10px] text-green-400 font-semibold flex items-center gap-1">
                        ✓ Set
                      </span>
                    )}
                  </div>
                  <PlacesInput
                    placeholder="Search destination…"
                    defaultValue={dropoff?.address ?? ""}
                    onSelect={handleDropoff}
                    mapsReady={isLoaded}
                  />
                </div>
              </div>
            </div>

            {/* Fare estimate */}
            {pickup && dropoff && (
              <div className="flex items-center gap-3 bg-accent/5 border border-accent/20 rounded-xl px-4 py-3 mb-4">
                <span className="text-accent text-lg">🏷️</span>
                <div>
                  <p className="text-xs text-zinc-500">Estimated fare</p>
                  {fareEstimateStatus === "ready" && fareEstimate ? (
                    <div>
                      <p className="text-accent font-bold text-sm">
                        {fareEstimate.currency} {fareEstimate.amount.toLocaleString()}
                      </p>
                      <p className="text-[11px] text-zinc-500">
                        {fareEstimate.distanceKm.toFixed(1)} km ·{" "}
                        {Math.round(fareEstimate.durationMinutes)} min
                      </p>
                    </div>
                  ) : fareEstimateStatus === "error" ? (
                    <p className="text-red-400 font-medium text-sm">
                      {fareEstimateError ?? "Unable to estimate fare"}
                    </p>
                  ) : (
                    <p className="text-accent font-bold text-sm">Calculating…</p>
                  )}
                </div>
              </div>
            )}

            {/* Confirm button */}
            <Button
              size="lg"
              fullWidth
              disabled={!canBook || isSearching}
              loading={isSearching}
              onClick={handleConfirmRide}
            >
              {isSearching ? "Finding your driver…" : "Confirm Ride"}
            </Button>

            {/* Status hints */}
            {!canBook && !isSearching && (
              <p className="text-center text-zinc-600 text-xs mt-3">
                {!pickup
                  ? "Set a pickup location"
                  : !dropoff
                    ? "Select a destination from the dropdown"
                    : fareEstimateStatus === "pending"
                      ? "Calculating fare estimate..."
                      : "Waiting for fare estimate"}
              </p>
            )}
          </div>

          {/* Recent destinations placeholder */}
          {!dropoff && (
            <div className="px-5 pb-5">
              <p className="text-xs font-semibold text-zinc-600 uppercase tracking-widest mb-3">
                Suggestions
              </p>
              {["Home", "Work", "Airport"].map((label) => (
                <div
                  key={label}
                  className="flex items-center gap-3 py-3 border-b border-border/50 last:border-0"
                >
                  <div className="w-8 h-8 rounded-xl bg-card border border-border flex items-center justify-center text-sm">
                    {label === "Home" ? "🏠" : label === "Work" ? "💼" : "✈️"}
                  </div>
                  <div>
                    <p className="text-sm text-white font-medium">{label}</p>
                    <p className="text-xs text-zinc-600">Set location</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Map ─────────────────────────────────────────────────────────── */}
      <div className="flex-1 relative">
        {isLoaded ? (
          <GoogleMap
            mapContainerStyle={{ width: "100%", height: "100%" }}
            center={center}
            zoom={14}
            onLoad={onMapLoad}
            options={{
              styles: DARK_MAP,
              disableDefaultUI: true,
              zoomControl: true,
              zoomControlOptions: {
                position: google.maps.ControlPosition.RIGHT_BOTTOM,
              },
            }}
          >
            {pickup && (
              <Marker
                position={{ lat: pickup.lat, lng: pickup.lng }}
                icon={{
                  path: google.maps.SymbolPath.CIRCLE,
                  scale: 10,
                  fillColor: "#FFD60A",
                  fillOpacity: 1,
                  strokeColor: "#0A0A0A",
                  strokeWeight: 3,
                }}
              />
            )}
            {dropoff && (
              <Marker
                position={{ lat: dropoff.lat, lng: dropoff.lng }}
                icon={{
                  path: google.maps.SymbolPath.CIRCLE,
                  scale: 10,
                  fillColor: "#EF4444",
                  fillOpacity: 1,
                  strokeColor: "#0A0A0A",
                  strokeWeight: 3,
                }}
              />
            )}
          </GoogleMap>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-zinc-900">
            <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>
    </div>
  );
}
