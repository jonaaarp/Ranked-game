import React, { useState, useEffect } from 'react';
import { Player, RankTier, BonusCategory } from '../types/ranked';
import { RankBadge } from './RankBadge';
import { getDivisionForElo } from '../utils/rankedDefaults';
import { getDivisionImageUrl } from '../utils/rankImages';
import { sounds } from '../utils/audio';

interface ProfileModalProps {
  player: Player | null;
  currentUser: Player;
  ranks: RankTier[];
  categories: BonusCategory[];
  isAdmin: boolean;
  isOpen: boolean;
  onClose: () => void;
  onSendFriendRequest: (player: Player) => void;
  onRemoveFriend: (playerId: string) => void;
  onOpenAdminEdit?: (player: Player) => void;
  onAssignCategory?: (playerId: string, categoryId: string | undefined) => void;
  onUpdatePlayerName?: (playerId: string, newName: string) => void;
  onUpdatePlayerCategories?: (playerId: string, categoryIds: string[]) => void;
  userRankPosition?: number;
  divisionImages?: Record<string, string>;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  player,
  currentUser,
  ranks,
  categories,
  isAdmin,
  isOpen,
  onClose,
  onSendFriendRequest,
  onRemoveFriend,
  onOpenAdminEdit,
  onAssignCategory,
  onUpdatePlayerName,
  onUpdatePlayerCategories,
  userRankPosition,
  divisionImages,
}) => {
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [nameSaveFeedback, setNameSaveFeedback] = useState(false);

  useEffect(() => {
    if (player) {
      setNameInput(player.name);
      setIsEditingName(false);
      setNameSaveFeedback(false);
    }
  }, [player?.id, player?.name]);

  if (!isOpen || !player) return null;

  const isSelf = player.id === currentUser.id;
  const isFriend = currentUser.friendIds.includes(player.id);
  const currentDiv = getDivisionForElo(player.elo, ranks);

  // Active category IDs (supports both multiple categoryIds and fallback to single categoryId)
  const activeCategoryIds =
    player.categoryIds && Array.isArray(player.categoryIds) && player.categoryIds.length > 0
      ? player.categoryIds
      : player.categoryId
      ? [player.categoryId]
      : [];

  const assignedCategories = categories.filter((c) => activeCategoryIds.includes(c.id));
  const totalBonusPercent = assignedCategories.reduce((acc, c) => acc + c.bonusPercent, 0);

  const getPersonalityLabel = (type: Player['personality']) => {
    switch (type) {
      case 'sociable':
        return { title: 'El Sociable', desc: 'Acepta a todos y le gusta jugar en equipo.' };
      case 'elite':
        return { title: 'Jugador de Élite', desc: 'Solo acepta jugar con los mejores del top o récord alto.' };
      case 'rechazador':
        return { title: 'El Rechazador', desc: 'Desconfiado. No juega con cualquiera a menos que acumulen amistad.' };
      case 'solitario':
        return { title: 'El Solitario', desc: 'Prefiere jugar solo. Rechaza invitaciones de equipo.' };
      default:
        return { title: 'Competidor', desc: 'Jugador estándar' };
    }
  };

  const personalityInfo = getPersonalityLabel(player.personality);
  const winRate =
    player.wins + player.losses > 0
      ? Math.round((player.wins / (player.wins + player.losses)) * 100)
      : 0;

  const handleSaveName = () => {
    const trimmed = nameInput.trim();
    if (!trimmed) return;
    sounds.playVictory();
    if (onUpdatePlayerName) {
      onUpdatePlayerName(player.id, trimmed);
    }
    setIsEditingName(false);
    setNameSaveFeedback(true);
    setTimeout(() => setNameSaveFeedback(false), 2500);
  };

  const handleToggleCategory = (catId: string) => {
    sounds.playTap();
    const updatedIds = activeCategoryIds.includes(catId)
      ? activeCategoryIds.filter((id) => id !== catId)
      : [...activeCategoryIds, catId];

    if (onUpdatePlayerCategories) {
      onUpdatePlayerCategories(player.id, updatedIds);
    } else if (onAssignCategory) {
      onAssignCategory(player.id, updatedIds[0] || undefined);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* Header with Rank Color Gradient */}
        <div
          className="relative px-5 pt-6 pb-4 border-b border-slate-800"
          style={{
            background: `linear-gradient(180deg, ${currentDiv.color}22 0%, #0f172a 100%)`,
          }}
        >
          <button
            onClick={() => {
              sounds.playTap();
              onClose();
            }}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-800/80 hover:bg-slate-700 flex items-center justify-center text-slate-300 hover:text-white transition-colors text-sm font-bold"
          >
            ✕
          </button>

          <div className="flex items-center gap-4">
            <div className="relative shrink-0">
              <div
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl p-2 border-2 shadow-2xl bg-slate-950 flex items-center justify-center transition-transform hover:scale-105"
                style={{ borderColor: currentDiv.color }}
              >
                <img
                  src={getDivisionImageUrl(currentDiv.fullName, divisionImages)}
                  alt={currentDiv.fullName}
                  className="w-full h-full object-contain drop-shadow-md"
                />
              </div>
              <span
                className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-slate-900 ${
                  player.status === 'disponible'
                    ? 'bg-emerald-500'
                    : player.status === 'en_equipo'
                    ? 'bg-amber-400'
                    : 'bg-rose-500'
                }`}
                title={player.status}
              />
            </div>

            <div className="flex-1 min-w-0">
              {/* Name section with Direct Admin Inline Editing */}
              {isEditingName && isAdmin ? (
                <div className="space-y-1.5">
                  <input
                    type="text"
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveName();
                      if (e.key === 'Escape') setIsEditingName(false);
                    }}
                    placeholder="Nuevo nombre"
                    className="w-full bg-slate-950 border border-purple-500 rounded-lg px-2.5 py-1 text-white font-bold text-sm focus:outline-none"
                    autoFocus
                  />
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={handleSaveName}
                      className="px-2.5 py-1 bg-purple-600 hover:bg-purple-500 text-white font-bold text-[11px] rounded-md uppercase tracking-wider"
                    >
                      Guardar
                    </button>
                    <button
                      onClick={() => {
                        setNameInput(player.name);
                        setIsEditingName(false);
                      }}
                      className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-[11px] rounded-md uppercase tracking-wider"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-lg font-bold text-white truncate tracking-tight">
                      {player.name}
                    </h3>
                    {isSelf && (
                      <span className="text-[10px] font-semibold uppercase px-2 py-0.5 bg-amber-500/20 text-amber-400 rounded-md border border-amber-500/30">
                        Tú
                      </span>
                    )}
                    {isAdmin && (
                      <button
                        onClick={() => setIsEditingName(true)}
                        className="px-2 py-0.5 bg-purple-900/70 hover:bg-purple-800 border border-purple-600/50 text-purple-200 text-[10px] font-bold uppercase rounded-md tracking-wider transition-colors"
                        title="Editar nombre directamente"
                      >
                        Editar Nombre
                      </button>
                    )}
                  </div>
                  {nameSaveFeedback && (
                    <span className="text-[11px] text-emerald-400 font-semibold block animate-pulse">
                      ¡Nombre actualizado correctamente!
                    </span>
                  )}
                </div>
              )}

              <div className="mt-1 flex items-center gap-2">
                <RankBadge rank={currentDiv} size="md" divisionImages={divisionImages} />
                <span className="text-xs font-mono font-semibold text-slate-300 tabular-nums">
                  {player.elo.toLocaleString()} pts
                </span>
              </div>
            </div>
          </div>

          {/* Hearts / Afinidad (Visual Text without icons) */}
          {!isSelf && (
            <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between text-xs">
              <span className="text-slate-400">Afinidad con jugador:</span>
              <div className="flex items-center gap-1.5 font-mono font-bold text-rose-400">
                <span>Nivel {player.heartsWithUser} / 5</span>
              </div>
            </div>
          )}
        </div>

        {/* Scrollable Stats Body */}
        <div className="p-4 sm:p-5 space-y-4 overflow-y-auto text-sm">
          {/* Main 6 Required Fields:
              Nombre, Rango record, Elo record, Rango actual, Elo actual, Rango en equipo record */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4">
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
              Estadísticas Oficiales
            </h4>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800">
                <span className="text-slate-400 block text-[11px] mb-1">Rango Actual</span>
                <RankBadge rank={currentDiv} size="md" divisionImages={divisionImages} />
              </div>

              <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800">
                <span className="text-slate-400 block text-[11px] mb-1">Elo Actual</span>
                <span className="text-base font-bold text-white font-mono tabular-nums">
                  {player.elo.toLocaleString()}
                </span>
              </div>

              <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800">
                <span className="text-slate-400 block text-[11px] mb-1">Rango Récord</span>
                <span className="text-xs font-bold text-amber-400 block truncate">
                  {player.recordRank}
                </span>
              </div>

              <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800">
                <span className="text-slate-400 block text-[11px] mb-1">Elo Récord</span>
                <span className="text-base font-bold text-amber-300 font-mono tabular-nums">
                  {player.recordElo.toLocaleString()}
                </span>
              </div>

              <div className="col-span-2 p-3 bg-slate-900/80 rounded-xl border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-slate-400 block text-[11px] mb-1">Rango en Equipo Récord</span>
                  <span className="text-xs font-bold text-slate-200 block truncate">
                    {player.teamRecordRank}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[11px] text-slate-400 block mb-1">Victorias / Derrotas</span>
                  <span className="text-xs font-semibold text-slate-200">
                    <span className="text-emerald-400 font-mono">{player.wins}W</span>
                    <span className="text-slate-500 mx-1">/</span>
                    <span className="text-rose-400 font-mono">{player.losses}L</span>
                    <span className="text-slate-400 ml-1.5 font-mono">({winRate}%)</span>
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* ADMIN DIRECT CONTROL 1: Edit Bot Name */}
          {isAdmin && (
            <div className="p-3.5 bg-purple-950/30 border border-purple-800/40 rounded-2xl space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-purple-300 block">
                Editar Nombre del Bot (Admin Directo)
              </span>
              <p className="text-[11px] text-slate-400 leading-snug">
                Cambia el nombre oficial del bot de forma directa. Se reflejará en el top, en el matchmaking y en todo el juego.
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
                  placeholder="Escribe el nuevo nombre"
                  className="flex-1 bg-slate-900 border border-purple-700/60 rounded-xl px-3 py-2 text-xs text-white font-semibold focus:outline-none focus:border-purple-400"
                />
                <button
                  onClick={handleSaveName}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl uppercase tracking-wider transition-colors shrink-0"
                >
                  Guardar
                </button>
              </div>
            </div>
          )}

          {/* ADMIN DIRECT CONTROL 2: Add multiple categories */}
          {/* "El administrador puede editar directamente desde los perfiles el nombre del bot, añadirle varias categorías." */}
          {isAdmin && (
            <div className="p-3.5 bg-purple-950/30 border border-purple-800/40 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-purple-300">
                  Añadir Varias Categorías (Admin Directo)
                </span>
                <span className="px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-300 text-[10px] font-mono font-bold">
                  {activeCategoryIds.length} activas
                </span>
              </div>
              <p className="text-[11px] text-slate-400 leading-snug">
                Selecciona una o varias categorías para otorgarle a este bot. Los % de bonus de Elo se acumularán en las partidas 3v3 de equipo.
              </p>

              {/* Multiple categories selectable items */}
              <div className="space-y-2">
                {categories.map((cat) => {
                  const isSelected = activeCategoryIds.includes(cat.id);
                  return (
                    <div
                      key={cat.id}
                      onClick={() => handleToggleCategory(cat.id)}
                      className={`p-2.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between gap-3 ${
                        isSelected
                          ? 'bg-purple-900/50 border-purple-500 text-white shadow-sm'
                          : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <div
                          className={`w-5 h-5 rounded-md flex items-center justify-center text-xs font-bold font-mono transition-colors shrink-0 ${
                            isSelected
                              ? 'bg-purple-500 text-white'
                              : 'bg-slate-800 border border-slate-700 text-transparent'
                          }`}
                        >
                          {isSelected ? '✓' : ''}
                        </div>
                        <div className="min-w-0">
                          <span className="text-xs font-bold block truncate text-white">
                            {cat.name}
                          </span>
                          <span className="text-[10px] text-slate-400 block truncate">
                            {cat.description}
                          </span>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold ${
                            isSelected
                              ? 'bg-purple-400 text-purple-950 font-black'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          +{cat.bonusPercent}% Elo
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Total bonus summary banner */}
              <div className="pt-2 border-t border-purple-800/40 flex items-center justify-between text-xs">
                <span className="text-purple-300 font-semibold text-[11px]">
                  Bonus Total Acumulado:
                </span>
                <span className="text-amber-400 font-mono font-bold text-xs">
                  +{totalBonusPercent}% Elo en Equipo 3v3
                </span>
              </div>
            </div>
          )}

          {/* If NOT Admin, but has categories assigned */}
          {!isAdmin && assignedCategories.length > 0 && (
            <div className="bg-amber-950/20 border border-amber-800/40 rounded-2xl p-4 space-y-2.5">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                    Categorías Especiales en Equipo ({assignedCategories.length})
                  </span>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Otorga bonus acumulativo en partidas 3v3
                  </p>
                </div>
                <div className="px-3 py-1.5 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-300 font-mono font-bold text-sm tabular-nums">
                  +{totalBonusPercent}% Total
                </div>
              </div>

              <div className="space-y-1.5">
                {assignedCategories.map((c) => (
                  <div
                    key={c.id}
                    className="p-2 bg-slate-900/80 rounded-xl border border-amber-900/30 flex items-center justify-between"
                  >
                    <div>
                      <span className="text-xs font-bold text-white block">{c.name}</span>
                      <span className="text-[10px] text-slate-400 block">{c.description}</span>
                    </div>
                    <span className="text-xs font-mono font-bold text-amber-300">
                      +{c.bonusPercent}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Personality Box (if Bot) */}
          {!player.isUser && (
            <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4">
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Personalidad del Bot
              </h4>
              <p className="text-sm font-bold text-white mb-0.5">{personalityInfo.title}</p>
              <p className="text-xs text-slate-400 leading-relaxed">{personalityInfo.desc}</p>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/90 flex flex-col gap-2">
          {!isSelf && (
            <div className="flex gap-2">
              {!isFriend ? (
                <button
                  onClick={() => {
                    sounds.playTap();
                    onSendFriendRequest(player);
                  }}
                  className="flex-1 h-11 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs uppercase tracking-wider rounded-xl shadow-md active:scale-[0.98] transition-all"
                >
                  Enviar Solicitud de Amistad
                </button>
              ) : (
                <button
                  onClick={() => {
                    sounds.playTap();
                    onRemoveFriend(player.id);
                  }}
                  className="flex-1 h-11 bg-slate-800 hover:bg-rose-950/60 hover:text-rose-300 text-slate-300 border border-slate-700 font-bold text-xs rounded-xl transition-colors"
                >
                  Amigo Agregado (Eliminar)
                </button>
              )}
            </div>
          )}

          {/* Admin Full Player Edit Trigger */}
          {isAdmin && onOpenAdminEdit && (
            <button
              onClick={() => {
                sounds.playTap();
                onOpenAdminEdit(player);
              }}
              className="w-full h-10 bg-purple-950/40 hover:bg-purple-900/40 border border-purple-700/50 text-purple-300 font-semibold text-xs rounded-xl flex items-center justify-center transition-colors"
            >
              Modificar todos los datos del bot en Admin Panel
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
