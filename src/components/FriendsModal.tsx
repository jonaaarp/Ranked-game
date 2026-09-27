import React from 'react';
import { Player, RankTier } from '../types/ranked';
import { RankBadge } from './RankBadge';
import { getDivisionForElo } from '../utils/rankedDefaults';
import { sounds } from '../utils/audio';

interface FriendsModalProps {
  isOpen: boolean;
  onClose: () => void;
  friends: Player[];
  allPlayers: Player[];
  ranks: RankTier[];
  onSelectPlayer: (player: Player) => void;
  onRemoveFriend: (playerId: string) => void;
  onInviteToTeam?: (player: Player) => void;
  onOpenTop: () => void;
  divisionImages?: Record<string, string>;
}

export const FriendsModal: React.FC<FriendsModalProps> = ({
  isOpen,
  onClose,
  friends,
  allPlayers,
  ranks,
  onSelectPlayer,
  onRemoveFriend,
  onInviteToTeam,
  onOpenTop,
  divisionImages,
}) => {
  if (!isOpen) return null;

  const getStatusBadge = (friend: Player) => {
    switch (friend.status) {
      case 'disponible':
        return (
          <span className="text-[11px] font-semibold text-emerald-400">
            🟢 Disponible
          </span>
        );
      case 'en_equipo':
        return (
          <span className="text-[11px] font-semibold text-amber-400">
            🟡 En equipo
          </span>
        );
      case 'no_disponible':
      default:
        return (
          <span className="text-[11px] font-semibold text-rose-400">
            🔴 No disponible
          </span>
        );
    }
  };

  const getTeammateNames = (friend: Player): string[] => {
    if (friend.status !== 'en_equipo') return [];
    if (friend.currentTeamMembers && friend.currentTeamMembers.length > 0) {
      return friend.currentTeamMembers.map((id) => {
        const p = allPlayers.find((pl) => pl.id === id);
        return p ? p.name : id;
      });
    }
    const otherFriends = friend.friendIds
      .map((id) => allPlayers.find((p) => p.id === id))
      .filter((p): p is Player => p !== undefined)
      .slice(0, 2);
    if (otherFriends.length >= 2) {
      return [otherFriends[0].name, otherFriends[1].name];
    }
    return ['Compañero 1', 'Compañero 2'];
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[88vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
          <div>
            <h3 className="text-base font-bold text-white tracking-tight">
              Lista de Amistad
            </h3>
            <p className="text-[11px] text-slate-400">
              {friends.length} {friends.length === 1 ? 'amigo agregado' : 'amigos agregados'}
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

        {/* Friends Content */}
        <div className="p-4 overflow-y-auto space-y-3 flex-1">
          {friends.length === 0 ? (
            <div className="py-12 px-4 text-center">
              <h4 className="text-sm font-bold text-slate-300 mb-1">
                No tienes amigos agregados aún
              </h4>
              <p className="text-xs text-slate-400 mb-4 max-w-xs mx-auto">
                Solo se verán a tus amigos agregados. Visita el ranking Top para enviar solicitudes a los jugadores.
              </p>
              <button
                onClick={() => {
                  sounds.playTap();
                  onClose();
                  onOpenTop();
                }}
                className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md transition-all active:scale-95"
              >
                Abrir Ranking Top
              </button>
            </div>
          ) : (
            friends.map((friend, fIdx) => {
              const divInfo = getDivisionForElo(friend.elo, ranks);
              const teammates = getTeammateNames(friend);

              return (
                <div
                  key={`friend_${friend.id}_${fIdx}`}
                  className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80 hover:border-slate-700/80 transition-all"
                >
                  <div className="flex items-center justify-between gap-3">
                    <button
                      onClick={() => {
                        sounds.playTap();
                        onSelectPlayer(friend);
                      }}
                      className="flex items-center gap-3 text-left flex-1 min-w-0 group"
                    >
                      {/* Status indicator dot (No photo) */}
                      <div className="w-9 h-9 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center shrink-0">
                        <span
                          className={`w-3 h-3 rounded-full ${
                            friend.status === 'disponible'
                              ? 'bg-emerald-500 shadow-sm shadow-emerald-500/50'
                              : friend.status === 'en_equipo'
                              ? 'bg-amber-400'
                              : 'bg-rose-500'
                          }`}
                        />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-white text-sm truncate group-hover:text-amber-400 transition-colors">
                            {friend.name}
                          </span>
                          <span className="text-[10px] font-mono text-rose-400 font-bold ml-1">
                            {friend.heartsWithUser}/5
                          </span>
                        </div>

                        <div className="flex items-center gap-2 mt-1">
                          <RankBadge rank={divInfo} size="sm" divisionImages={divisionImages} />
                          <span className="text-[11px] font-mono font-medium text-slate-400">
                            {friend.elo} pts
                          </span>
                        </div>
                      </div>
                    </button>

                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      {getStatusBadge(friend)}

                      <div className="flex items-center gap-1">
                        {onInviteToTeam && friend.status === 'disponible' && (
                          <button
                            onClick={() => {
                              sounds.playTap();
                              onInviteToTeam(friend);
                              onClose();
                            }}
                            className="px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 border border-amber-500/40 rounded-lg text-[10px] font-bold uppercase transition-colors"
                          >
                            Invitar
                          </button>
                        )}

                        <button
                          onClick={() => {
                            sounds.playTap();
                            onRemoveFriend(friend.id);
                          }}
                          className="px-2 py-1 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg text-[10px] font-semibold transition-colors"
                          title="Eliminar de amigos"
                        >
                          Eliminar
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* If in team, show teammates names */}
                  {friend.status === 'en_equipo' && teammates.length > 0 && (
                    <div className="mt-2.5 pt-2 border-t border-slate-800/60 text-[10px] text-slate-400 flex items-center gap-1.5">
                      <span className="text-slate-500">En equipo con:</span>
                      <span className="text-slate-300 font-medium truncate">
                        {teammates.join(' y ')}
                      </span>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
