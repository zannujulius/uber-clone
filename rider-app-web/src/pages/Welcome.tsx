import { Link } from 'react-router-dom';
import Button from '@/components/ui/Button';

export default function Welcome() {
  return (
    <div className="min-h-screen bg-zinc-950 flex">
      {/* Left panel */}
      <div className="flex flex-col justify-between w-full max-w-lg px-12 py-14">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center">
            <span className="text-zinc-900 text-xl">🚗</span>
          </div>
          <span className="text-white font-black text-xl tracking-tight">RideApp</span>
        </div>

        {/* Hero */}
        <div>
          <div className="inline-flex items-center gap-2 bg-accent/10 border border-accent/20 text-accent text-xs font-semibold px-3 py-1.5 rounded-full mb-8">
            ⚡ Powered by real-time WebSockets
          </div>
          <h1 className="text-6xl font-black text-white leading-[1.05] tracking-tight mb-6">
            Your ride,<br />
            <span className="text-accent">your way.</span>
          </h1>
          <p className="text-zinc-400 text-lg leading-relaxed max-w-sm mb-10">
            Fast, reliable rides at your fingertips. Get where you need to go — instantly.
          </p>

          <div className="flex flex-col gap-3">
            <Link to="/register">
              <Button size="lg" fullWidth>Get Started →</Button>
            </Link>
            <Link to="/login">
              <Button variant="ghost" size="lg" fullWidth>I already have an account</Button>
            </Link>
          </div>
        </div>

        {/* Features */}
        <div className="flex gap-6">
          {[
            { icon: '⚡', label: 'Instant booking' },
            { icon: '📍', label: 'Live tracking' },
            { icon: '🛡️', label: 'Safe rides' },
          ].map((f) => (
            <div key={f.label} className="flex items-center gap-2 text-zinc-500 text-sm">
              <span>{f.icon}</span>
              <span>{f.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right decorative panel */}
      <div className="hidden lg:flex flex-1 relative overflow-hidden bg-zinc-900">
        {/* Decorative map-like grid */}
        <div className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: 'linear-gradient(rgba(255,214,10,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,214,10,0.3) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />
        {/* Glowing accent circles */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/3 w-64 h-64 bg-accent/10 rounded-full blur-2xl" />

        {/* Floating cards */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 bg-card border border-border rounded-2xl p-5 shadow-2xl w-72">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center text-zinc-900 font-bold">J</div>
            <div>
              <p className="text-white font-semibold text-sm">John is on his way</p>
              <p className="text-zinc-500 text-xs">Arriving in 3 min</p>
            </div>
            <div className="ml-auto w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          </div>
          <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
            <div className="h-full bg-accent rounded-full w-2/3 transition-all" />
          </div>
        </div>

        <div className="absolute bottom-1/4 left-1/2 -translate-x-1/3 bg-card border border-border rounded-2xl p-4 shadow-2xl w-56">
          <p className="text-zinc-500 text-xs mb-1">Estimated fare</p>
          <p className="text-accent font-black text-2xl">$12.50</p>
          <p className="text-zinc-600 text-xs mt-1">4.2 miles · 12 min</p>
        </div>
      </div>
    </div>
  );
}
