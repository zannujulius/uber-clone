import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "@/store";
import { resetRide } from "@/features/ride/rideSlice";
import { wsSend } from "@/features/websocket/websocketSlice";
import Button from "@/components/ui/Button";
import StatusBadge from "@/components/ui/StatusBadge";

const STATUS_CONFIG = {
  idle: {
    icon: "⏳",
    title: "Preparing your trip…",
    sub: "Please wait",
    color: "text-zinc-400",
    ring: "border-zinc-600",
  },
  searching: {
    icon: "🔍",
    title: "Finding your driver…",
    sub: "Matching you with a nearby driver",
    color: "text-accent",
    ring: "border-accent/40",
  },
  driver_assigned: {
    icon: "🚗",
    title: "Driver on the way!",
    sub: "Your driver is heading to your pickup",
    color: "text-green-400",
    ring: "border-green-500/40",
  },
  driver_arriving: {
    icon: "📍",
    title: "Driver is almost there",
    sub: "Your driver is nearby",
    color: "text-blue-400",
    ring: "border-blue-500/40",
  },
  in_progress: {
    icon: "🛣️",
    title: "Trip in progress",
    sub: "Enjoy your ride!",
    color: "text-green-400",
    ring: "border-green-500/40",
  },
  completed: {
    icon: "✅",
    title: "Trip completed!",
    sub: "Thanks for riding with us",
    color: "text-green-400",
    ring: "border-green-500/40",
  },
  cancelled: {
    icon: "❌",
    title: "Trip cancelled",
    sub: "Your trip has been cancelled",
    color: "text-red-400",
    ring: "border-red-500/40",
  },
} as const;

export default function Trip() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { status, tripId, driver, pickup, dropoff, persistedTripStatus } = useAppSelector(
    (s) => s.ride,
  );
  const wsStatus = useAppSelector((s) => s.websocket.status);

  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.idle;

  // Auto-redirect when done
  useEffect(() => {
    if (status === "completed" || status === "cancelled") {
      const t = setTimeout(() => {
        dispatch(resetRide());
        navigate("/home");
      }, 4000);
      return () => clearTimeout(t);
    }
  }, [status]);

  const handleCancel = () => {
    if (window.confirm("Are you sure you want to cancel this trip?")) {
      if (tripId) {
        dispatch(wsSend({ event: "trip:cancel", data: { trip_id: tripId } }));
      } else {
        dispatch(resetRide());
        navigate("/home");
      }
    }
  };

  const isDone = status === "completed" || status === "cancelled";
  const canCancel = status === "searching" || status === "driver_assigned";

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center">
              <span className="text-zinc-900 text-sm">🚗</span>
            </div>
            <span className="text-white font-black tracking-tight">
              RideApp
            </span>
          </div>
          <StatusBadge status={wsStatus} />
        </div>

        {/* Status card */}
        <div className="bg-card border border-border rounded-2xl p-8 flex flex-col items-center text-center">
          <div
            className={`w-24 h-24 rounded-full border-2 ${cfg.ring} flex items-center justify-center text-5xl mb-6 ${status === "searching" ? "animate-pulse" : ""}`}
          >
            {cfg.icon}
          </div>
          <h1 className={`text-2xl font-black mb-2 ${cfg.color}`}>
            {cfg.title}
          </h1>
          <p className="text-zinc-500 text-sm">{cfg.sub}</p>

          {(status === "completed" || status === "cancelled") && (
            <p className="text-zinc-600 text-xs mt-3 animate-pulse">
              Redirecting to home in a moment…
            </p>
          )}
        </div>

        {/* Driver card */}
        {driver && (
          <div className="bg-card border border-border rounded-2xl p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-accent flex items-center justify-center text-zinc-900 font-black text-lg shrink-0">
              {driver.first_name?.[0]}
              {driver.last_name?.[0]}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-bold">
                {driver.first_name} {driver.last_name}
              </p>
              {driver.vehicle_model && (
                <p className="text-zinc-500 text-sm truncate">
                  {driver.vehicle_model} · {driver.vehicle_plate}
                </p>
              )}
              {driver.eta_minutes !== undefined && (
                <p className="text-accent text-xs font-semibold mt-1">
                  ⏱ {driver.eta_minutes} min away
                </p>
              )}
            </div>
            <button className="w-10 h-10 rounded-xl bg-accent/10 border border-accent/20 text-accent flex items-center justify-center hover:bg-accent/20 transition-colors">
              📞
            </button>
          </div>
        )}

        {/* Trip details */}
        <div className="bg-card border border-border rounded-2xl p-5">
          <p className="text-xs font-bold text-zinc-600 uppercase tracking-widest mb-4">
            Trip Details
          </p>
          {tripId && (
            <div className="mb-4 text-xs text-zinc-500">
              <p>Trip ID: <span className="text-zinc-300">{tripId}</span></p>
              {persistedTripStatus && (
                <p>DB Status: <span className="text-zinc-300">{persistedTripStatus}</span></p>
              )}
            </div>
          )}
          <div className="flex items-start gap-3 mb-3">
            <div className="w-3 h-3 rounded-full bg-accent mt-1 shrink-0" />
            <p className="text-sm text-white">{pickup?.address ?? "—"}</p>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-3 h-3 rounded-sm bg-red-500 mt-1 shrink-0" />
            <p className="text-sm text-white">{dropoff?.address ?? "—"}</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3">
          {isDone && (
            <Button
              size="lg"
              fullWidth
              onClick={() => {
                dispatch(resetRide());
                navigate("/home");
              }}
            >
              {status === "completed" ? "Book Another Ride" : "Back to Home"}
            </Button>
          )}
          {canCancel && (
            <Button variant="danger" size="lg" fullWidth onClick={handleCancel}>
              Cancel Trip
            </Button>
          )}
          {!isDone && !canCancel && (
            <Button
              variant="ghost"
              size="lg"
              fullWidth
              onClick={() => navigate("/home")}
            >
              ← Back to Map
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
