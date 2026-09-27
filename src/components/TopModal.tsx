import React, { useState } from 'react';
import { Player, RankTier } from '../types/ranked';
import { RankBadge } from './RankBadge';
import { getDivisionForElo } from '../utils/rankedDefaults';
import { sounds } from '../utils/audio';

interface TopModalProps {
  isOpen: boolean;
  onClose: () => void;
  allPlayers: Player[];
  ranks: RankTier[];
  onSelectPlayer: (player: Player) => void;
  currentUserId: string;
  divisionImages?: Record<string, string>;
}

export const TopModal: React.FC<TopModalProps> = ({
  isOpen,
  onClose,
  allPlayers,
  ranks,
  onSelectPlayer,
  currentUserId,
  divisionImages,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const uniquePlayers = React.useMemo(() => {
    const seen = new Set<string>();
    const list: Player[] = [];
    for (const p of allPlayers) {
      if (p && p.id && !seen.has(p.id)) {
        seen.add(p.id);
        list.push(p);
      }
    }
    return list;
  }, [allPlayers]);

  if (!isOpen) return null;

  // Real-time sort by highest Elo to lowest Elo
  const sortedPlayers = [...uniquePlayers].sort((a, b) => {
    if (b.elo !== a.elo) return b.elo - a.elo;
    return b.wins - a.wins;
  });

  const filtered = sortedPlayers.filter((p) =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[88vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white tracking-tight">
                Top Rango Actual
              </h3>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            </div>
            <p className="text-[11px] text-slate-400">
              Ranking en tiempo real · {uniquePlayers.length} competidores
            </p>
          </div>

          <button
            onClick={() => {
              sounds.playTap();
              onClose();
            }}
            className="w-8 h-8 rounded-full bg-slate-800/80 hover:bg-slate-700 flex items-center justify-center text-slate-300 font-bold text-sm transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-3 border-b border-slate-800/60 bg-slate-950/40">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar jugador por nombre..."
            className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
          />
        </div>

        {/* Column Headers */}
        <div className="px-4 py-2 bg-slate-950/90 text-[11px] font-semibold text-slate-400 flex items-center justify-between border-b border-slate-800/60">
          <div className="flex items-center gap-3">
            <span className="w-8 text-center"># TOP</span>
            <span>JUGADOR</span>
          </div>
          <span>RANGO ACTUAL</span>
        </div>

        {/* Rows: número top / nombre / rango actual (No avatar photos, only names!) */}
        <div className="overflow-y-auto p-2 space-y-1.5 flex-1 divide-y divide-slate-800/30">
          {filtered.map((player, pIdx) => {
            const rankPosition = sortedPlayers.findIndex((p) => p.id === player.id) + 1;
            const divInfo = getDivisionForElo(player.elo, ranks);
            const isUser = player.id === currentUserId;

            return (
              <button
                key={`top_${player.id}_${pIdx}`}
                onClick={() => {
                  sounds.playTap();
                  onSelectPlayer(player);
                }}
                className={`w-full py-2.5 px-3 rounded-xl flex items-center justify-between text-left transition-all active:scale-[0.99] ${
                  isUser
                    ? 'bg-amber-500/10 border border-amber-500/30 hover:bg-amber-500/20'
                    : 'hover:bg-slate-800/60'
                }`}
              >
                {/* Left: Top Number + Name */}
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 text-center shrink-0 flex items-center justify-center font-mono font-bold text-xs">
                    {rankPosition === 1 ? (
                      <span className="w-6 h-6 rounded-full bg-yellow-500/20 text-yellow-400 flex items-center justify-center border border-yellow-500/40">
                        1
                      </span>
                    ) : rankPosition === 2 ? (
                      <span className="w-6 h-6 rounded-full bg-slate-300/20 text-slate-300 flex items-center justify-center border border-slate-400/40">
                        2
                      </span>
                    ) : rankPosition === 3 ? (
                      <span className="w-6 h-6 rounded-full bg-amber-700/20 text-amber-500 flex items-center justify-center border border-amber-600/40">
                        3
                      </span>
                    ) : (
                      <span className="text-slate-400">{rankPosition}</span>
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className={`text-xs font-bold truncate ${isUser ? 'text-amber-400' : 'text-slate-200'}`}>
                        {player.name}
                      </span>
                      {isUser && (
                        <span className="text-[9px] font-bold uppercase px-1.5 py-0.2 bg-amber-500 text-slate-950 rounded">
                          Tú
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono tabular-nums">
                      {player.elo.toLocaleString()} pts
                    </span>
                  </div>
                </div>

                {/* Right: Rango actual with Division Image (Icono URL más grande) */}
                <div className="shrink-0 ml-3">
                  <RankBadge rank={divInfo} size="md" divisionImages={divisionImages} />
                </div>
              </button>
            );
          })}

          {filtered.length === 0 && (
            <div className="py-8 text-center text-xs text-slate-500">
              No se encontraron jugadores
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
