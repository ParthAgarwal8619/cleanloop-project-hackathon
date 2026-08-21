import { useState } from 'react';
import { cn } from '@/lib/utils';
import { priorityDot } from '@/lib/format';

export interface MapMarker {
  id: string;
  latitude: number;
  longitude: number;
  priority: string;
  label?: string;
  reportId?: string;
  wasteType?: string;
  status?: string;
  time?: string;
  onClick?: () => void;
}

interface CityMapProps {
  markers: MapMarker[];
  height?: string;
  showLegend?: boolean;
  centerLat?: number;
  centerLng?: number;
  className?: string;
}

export function CityMap({
  markers,
  height = '500px',
  showLegend = true,
  centerLat = 12.9716,
  centerLng = 77.5946,
  className,
}: CityMapProps) {
  const [selected, setSelected] = useState<MapMarker | null>(null);

  const latRange = 0.08;
  const lngRange = 0.08;

  const toX = (lng: number) => ((lng - (centerLng - lngRange)) / (lngRange * 2)) * 100;
  const toY = (lat: number) => ((centerLat + latRange - lat) / (latRange * 2)) * 100;

  return (
    <div
      className={cn('relative overflow-hidden rounded-xl border border-border bg-emerald-50', className)}
      style={{ height }}
    >
      {/* Map background with grid pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 via-teal-50/50 to-cyan-50">
        <svg className="absolute inset-0 h-full w-full opacity-30" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#86efac" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>

        {/* Simulated roads */}
        <svg className="absolute inset-0 h-full w-full" xmlns="http://www.w3.org/2000/svg">
          <path d="M 0 30% Q 50% 25%, 100% 35%" fill="none" stroke="#d1fae5" strokeWidth="8" opacity="0.6" />
          <path d="M 20% 0 Q 25% 50%, 15% 100%" fill="none" stroke="#d1fae5" strokeWidth="6" opacity="0.5" />
          <path d="M 0 70% Q 60% 65%, 100% 75%" fill="none" stroke="#d1fae5" strokeWidth="7" opacity="0.5" />
          <path d="M 70% 0 Q 75% 40%, 80% 100%" fill="none" stroke="#d1fae5" strokeWidth="5" opacity="0.4" />
          <path d="M 40% 0 L 45% 100%" fill="none" stroke="#d1fae5" strokeWidth="4" opacity="0.4" />
          <path d="M 0 50% L 100% 50%" fill="none" stroke="#d1fae5" strokeWidth="5" opacity="0.4" />
        </svg>

        {/* Simulated water body */}
        <div
          className="absolute rounded-full bg-cyan-200/40"
          style={{ left: '60%', top: '55%', width: '120px', height: '60px' }}
        />
        <div
          className="absolute rounded-full bg-cyan-200/30"
          style={{ left: '15%', top: '20%', width: '80px', height: '40px' }}
        />

        {/* Zone labels */}
        <span className="absolute text-[10px] font-semibold text-emerald-600/60" style={{ left: '15%', top: '15%' }}>Zone A</span>
        <span className="absolute text-[10px] font-semibold text-emerald-600/60" style={{ left: '70%', top: '20%' }}>Zone B</span>
        <span className="absolute text-[10px] font-semibold text-emerald-600/60" style={{ left: '25%', top: '65%' }}>Zone C</span>
        <span className="absolute text-[10px] font-semibold text-emerald-600/60" style={{ left: '75%', top: '70%' }}>Zone D</span>
      </div>

      {/* Markers */}
      {markers.map((marker) => {
        const x = toX(marker.longitude);
        const y = toY(marker.latitude);
        if (x < 0 || x > 100 || y < 0 || y > 100) return null;
        return (
          <button
            key={marker.id}
            onClick={() => {
              setSelected(marker);
              marker.onClick?.();
            }}
            className="absolute -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${x}%`, top: `${y}%` }}
          >
            <span className={cn('relative flex h-3.5 w-3.5')}>
              {marker.priority === 'CRITICAL' && (
                <span className="absolute inline-flex h-full w-full animate-pulse-ring rounded-full bg-red-400" />
              )}
              <span className={cn('relative inline-flex h-3.5 w-3.5 rounded-full border-2 border-white shadow-md', priorityDot(marker.priority))} />
            </span>
          </button>
        );
      })}

      {/* Legend */}
      {showLegend && (
        <div className="absolute bottom-4 left-4 rounded-lg border border-border bg-white/90 p-3 shadow-sm backdrop-blur-sm">
          <p className="mb-2 text-xs font-semibold text-foreground">Priority</p>
          <div className="flex flex-col gap-1.5">
            <LegendItem color="bg-red-500" label="Critical" />
            <LegendItem color="bg-orange-500" label="High" />
            <LegendItem color="bg-yellow-500" label="Medium" />
            <LegendItem color="bg-green-500" label="Resolved" />
          </div>
        </div>
      )}

      {/* Selected marker popup */}
      {selected && (
        <div className="absolute bottom-4 right-4 w-64 rounded-lg border border-border bg-white p-4 shadow-lg">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-bold text-foreground">{selected.reportId || 'Report'}</p>
              {selected.wasteType && (
                <p className="text-xs text-muted-foreground">{selected.wasteType}</p>
              )}
            </div>
            <span className={cn('h-2.5 w-2.5 rounded-full', priorityDot(selected.priority))} />
          </div>
          {selected.status && (
            <p className="mt-2 text-xs text-muted-foreground">Status: {selected.status}</p>
          )}
          {selected.time && <p className="text-xs text-muted-foreground">{selected.time}</p>}
        </div>
      )}
    </div>
  );
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className={cn('h-2.5 w-2.5 rounded-full', color)} />
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  );
}
