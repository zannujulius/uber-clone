import type { WsStatus } from '@/features/websocket/websocketSlice';

const MAP: Record<WsStatus, { label: string; dot: string; ring: string }> = {
  connected:    { label: 'Live',         dot: 'bg-green-400',  ring: 'border-green-500/40'  },
  connecting:   { label: 'Connecting…',  dot: 'bg-yellow-400 animate-pulse', ring: 'border-yellow-500/40' },
  disconnected: { label: 'Offline',      dot: 'bg-zinc-500',   ring: 'border-zinc-600/40'   },
  error:        { label: 'Error',        dot: 'bg-red-400',    ring: 'border-red-500/40'    },
};

export default function StatusBadge({ status }: { status: WsStatus }) {
  const { label, dot, ring } = MAP[status];
  return (
    <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-semibold bg-card ${ring}`}>
      <span className={`w-2 h-2 rounded-full ${dot}`} />
      <span className="text-zinc-300">{label}</span>
    </div>
  );
}
