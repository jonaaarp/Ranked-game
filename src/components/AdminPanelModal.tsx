import React, { useState, useEffect } from 'react';
import { Player, RankTier, BonusCategory, BotPersonality } from '../types/ranked';
import { RankBadge } from './RankBadge';
import { 
  getDivisionForElo, 
  syncPlayerRecordRank, 
  getAllDivisions 
} from '../utils/rankedDefaults';
import { 
  ALL_DIVISIONS, 
  generateDefaultBadgeSvg, 
  getDivisionImageUrl,
  getDefaultDivisionImages 
} from '../utils/rankImages';
import { sounds } from '../utils/audio';

interface AdminPanelModalProps {
  isOpen: boolean;
  onClose: () => void;
  ranks: RankTier[];
  onUpdateRanks: (ranks: RankTier[]) => void;
  categories: BonusCategory[];
  onUpdateCategories: (categories: BonusCategory[]) => void;
  allPlayers: Player[];
  onUpdatePlayer: (player: Player) => void;
  onCreateBot: (newBot: Player) => void;
  divisionImages: Record<string, string>;
  onUpdateDivisionImages: (images: Record<string, string>) => void;
  onResetAllBots: () => void;
  onExecuteRankReset: () => void;
  editingPlayerInitial?: Player | null;
}

export const AdminPanelModal: React.FC<AdminPanelModalProps> = ({
  isOpen,
  onClose,
  ranks,
  onUpdateRanks,
  categories,
  onUpdateCategories,
  allPlayers,
  onUpdatePlayer,
  onCreateBot,
  divisionImages,
  onUpdateDivisionImages,
  onResetAllBots,
  onExecuteRankReset,
  editingPlayerInitial,
}) => {
  const [activeTab, setActiveTab] = useState<'ranks' | 'urls' | 'categories' | 'players' | 'reset'>(
    editingPlayerInitial ? 'players' : 'urls'
  );

  // Local state for Ranks
  const [localRanks, setLocalRanks] = useState<RankTier[]>(ranks);

  // Local state for Division Images URLs
  const [localDivisionImages, setLocalDivisionImages] = useState<Record<string, string>>(divisionImages);
  const [urlSaveSuccess, setUrlSaveSuccess] = useState(false);

  // Local state for Categories
  const [localCategories, setLocalCategories] = useState<BonusCategory[]>(categories);
  const [newCatName, setNewCatName] = useState('');
  const [newCatBonus, setNewCatBonus] = useState(10);
  const [newCatDesc, setNewCatDesc] = useState('');

  // Local state for Player editor
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>(
    editingPlayerInitial ? editingPlayerInitial.id : (allPlayers[0]?.id || '')
  );
  const selectedPlayer = allPlayers.find((p) => p.id === selectedPlayerId) || allPlayers[0];
  const [playerForm, setPlayerForm] = useState<Player | null>(selectedPlayer || null);
  const [playerSearch, setPlayerSearch] = useState('');

  // State for Creating a New Bot
  const [isCreatingBot, setIsCreatingBot] = useState(false);
  const [newBotName, setNewBotName] = useState('');
  const [newBotElo, setNewBotElo] = useState(400);
  const [newBotPersonality, setNewBotPersonality] = useState<BotPersonality>('sociable');
  const [newBotCategoryIds, setNewBotCategoryIds] = useState<string[]>([]);
  const [botCreateFeedback, setBotCreateFeedback] = useState<string | null>(null);

  useEffect(() => {
    setLocalDivisionImages(divisionImages);
  }, [divisionImages]);

  useEffect(() => {
    if (editingPlayerInitial) {
      setSelectedPlayerId(editingPlayerInitial.id);
      setPlayerForm(editingPlayerInitial);
      setActiveTab('players');
    }
  }, [editingPlayerInitial]);

  useEffect(() => {
    if (selectedPlayerId) {
      const pl = allPlayers.find((p) => p.id === selectedPlayerId);
      if (pl) setPlayerForm(pl);
    }
  }, [selectedPlayerId, allPlayers]);

  const filteredPlayers = allPlayers.filter((p) =>
    p.name.toLowerCase().includes(playerSearch.toLowerCase())
  );

  if (!isOpen) return null;

  // Handlers for Ranks
  const handleRankChange = (index: number, field: keyof RankTier, value: any) => {
    const updated = [...localRanks];
    updated[index] = { ...updated[index], [field]: value };
    setLocalRanks(updated);
  };

  const handleSaveRanks = () => {
    sounds.playVictory();
    onUpdateRanks(localRanks);
  };

  // Handlers for URLs
  const handleDivisionUrlChange = (divisionKey: string, url: string) => {
    setLocalDivisionImages((prev) => ({
      ...prev,
      [divisionKey]: url,
    }));
  };

  const handleSaveDivisionUrls = () => {
    sounds.playVictory();
    onUpdateDivisionImages(localDivisionImages);
    setUrlSaveSuccess(true);
    setTimeout(() => setUrlSaveSuccess(false), 3000);
  };

  const handleResetToDefaultUrls = () => {
    sounds.playTap();
    const defaults = getDefaultDivisionImages();
    setLocalDivisionImages(defaults);
    onUpdateDivisionImages(defaults);
    setUrlSaveSuccess(true);
    setTimeout(() => setUrlSaveSuccess(false), 3000);
  };

  // Handlers for Categories
  const handleAddCategory = () => {
    if (!newCatName.trim()) return;
    const newCat: BonusCategory = {
      id: `cat_${Date.now()}`,
      name: newCatName.trim(),
      bonusPercent: Number(newCatBonus) || 10,
      description: newCatDesc.trim() || `Bonus de +${newCatBonus}% de elo en equipo.`,
      color: '#f59e0b',
    };
    const updated = [...localCategories, newCat];
    setLocalCategories(updated);
    onUpdateCategories(updated);
    setNewCatName('');
    setNewCatDesc('');
    sounds.playTap();
  };

  const handleDeleteCategory = (catId: string) => {
    const updated = localCategories.filter((c) => c.id !== catId);
    setLocalCategories(updated);
    onUpdateCategories(updated);
    sounds.playTap();
  };

  // Handler for Saving Player
  const handleSavePlayer = () => {
    if (!playerForm) return;
    sounds.playVictory();
    // Enforce: El rango record debe de acompañar al rango actual si es que el rango actual es mayor que el rango record
    const updated = syncPlayerRecordRank(playerForm, localRanks);
    onUpdatePlayer(updated);
  };

  // Handler for Creating New Bot
  const handleCreateBotSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = newBotName.trim();
    if (!cleanName) {
      setBotCreateFeedback('El nombre no puede estar vacío');
      return;
    }
    const cleanElo = Math.max(0, Number(newBotElo) || 0);
    const div = getDivisionForElo(cleanElo, localRanks);

    const newBot: Player = {
      id: `bot_custom_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      name: cleanName,
      avatar: '',
      isUser: false,
      elo: cleanElo,
      recordElo: cleanElo,
      recordRank: div.fullName,
      currentRank: div.fullName,
      teamRecordRank: div.fullName,
      wins: 0,
      losses: 0,
      streak: 0,
      personality: newBotPersonality,
      categoryId: newBotCategoryIds[0] || undefined,
      categoryIds: newBotCategoryIds,
      status: 'disponible',
      heartsWithUser: 0,
      friendIds: [],
    };

    sounds.playVictory();
    onCreateBot(newBot);
    setBotCreateFeedback(`¡Bot "${cleanName}" creado con éxito en ${div.fullName}!`);
    setNewBotName('');
    setNewBotElo(400);
    setNewBotCategoryIds([]);
    setIsCreatingBot(false);
    setSelectedPlayerId(newBot.id);
    setPlayerForm(newBot);
    setTimeout(() => setBotCreateFeedback(null), 4000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-white tracking-tight">
              Panel de Administrador
            </h3>
            <p className="text-[11px] text-slate-400">
              Control de rangos, URLs de imágenes, bots del server y progresión
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

        {/* Navigation Tabs */}
        <div className="grid grid-cols-5 border-b border-slate-800 bg-slate-950/60 p-1.5 gap-1 text-[11px]">
          <button
            onClick={() => {
              sounds.playTap();
              setActiveTab('urls');
            }}
            className={`py-2 px-1 rounded-xl font-bold transition-all text-center ${
              activeTab === 'urls'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            URLs Rangos
          </button>
          <button
            onClick={() => {
              sounds.playTap();
              setActiveTab('players');
            }}
            className={`py-2 px-1 rounded-xl font-bold transition-all text-center ${
              activeTab === 'players'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            Bots & Admin
          </button>
          <button
            onClick={() => {
              sounds.playTap();
              setActiveTab('ranks');
            }}
            className={`py-2 px-1 rounded-xl font-bold transition-all text-center ${
              activeTab === 'ranks'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            Config Rangos
          </button>
          <button
            onClick={() => {
              sounds.playTap();
              setActiveTab('categories');
            }}
            className={`py-2 px-1 rounded-xl font-bold transition-all text-center ${
              activeTab === 'categories'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            Categorías
          </button>
          <button
            onClick={() => {
              sounds.playTap();
              setActiveTab('reset');
            }}
            className={`py-2 px-1 rounded-xl font-bold transition-all text-center ${
              activeTab === 'reset'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            Reset
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-4 overflow-y-auto flex-1 text-xs space-y-4">
          
          {/* TAB 1: URLs DE RANGOS */}
          {activeTab === 'urls' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-white text-sm">
                    URLs de Imágenes de Rangos
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    Define la URL de imagen para cada división (Bronce 1 hasta Pro). La app usará estas imágenes en todo el juego.
                  </p>
                </div>
                <button
                  onClick={handleSaveDivisionUrls}
                  className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold transition-all shrink-0"
                >
                  Guardar URLs
                </button>
              </div>

              {urlSaveSuccess && (
                <div className="p-3 bg-emerald-950/60 border border-emerald-500/50 rounded-xl text-emerald-300 font-bold text-xs flex items-center justify-between">
                  <span>¡URLs de imágenes de rangos guardadas y actualizadas en toda la app!</span>
                </div>
              )}

              <div className="flex gap-2">
                <button
                  onClick={handleResetToDefaultUrls}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-[11px] font-semibold transition-colors"
                >
                  Restablecer Emblemas Predeterminados
                </button>
              </div>

              {/* List of all 22 divisions with URL input and live preview */}
              <div className="space-y-2.5">
                {ALL_DIVISIONS.map((divItem) => {
                  const currentUrl = localDivisionImages[divItem.key] || '';
                  const previewSrc = currentUrl.trim() !== '' ? currentUrl.trim() : generateDefaultBadgeSvg(divItem);

                  return (
                    <div
                      key={divItem.key}
                      className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center gap-3"
                    >
                      {/* Live Image Preview */}
                      <div
                        className="w-14 h-14 rounded-2xl p-1 bg-slate-900 border flex items-center justify-center shrink-0 shadow-inner"
                        style={{ borderColor: divItem.color }}
                      >
                        <img
                          src={previewSrc}
                          alt={divItem.name}
                          className="w-full h-full object-contain"
                          onError={(e) => {
                            // If invalid URL, fallback to default SVG
                            (e.currentTarget as HTMLImageElement).src = generateDefaultBadgeSvg(divItem);
                          }}
                        />
                      </div>

                      {/* Division Name and URL Input */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-white text-xs">
                            URL de {divItem.name}
                          </span>
                        </div>
                        <input
                          type="url"
                          value={currentUrl}
                          onChange={(e) => handleDivisionUrlChange(divItem.key, e.target.value)}
                          placeholder="https://ejemplo.com/emblema.png (o deja vacío para diseño oficial)"
                          className="w-full bg-slate-900 border border-slate-800 focus:border-purple-500 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder-slate-600 focus:outline-none font-mono"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="pt-2">
                <button
                  onClick={handleSaveDivisionUrls}
                  className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs uppercase tracking-wider transition-all"
                >
                  Guardar Todas las URLs de Rangos
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: JUGADORES Y CREAR BOTS */}
          {activeTab === 'players' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-white text-sm">Gestión de Bots y Jugadores</h4>
                  <p className="text-[11px] text-slate-400">
                    Crea nuevos bots en el servidor o edita stats del admin y bots existentes.
                  </p>
                </div>
                <button
                  onClick={() => setIsCreatingBot(!isCreatingBot)}
                  className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors shrink-0"
                >
                  {isCreatingBot ? 'Cerrar Creador' : '+ Crear Nuevo Bot'}
                </button>
              </div>

              {botCreateFeedback && (
                <div className="p-3 bg-emerald-950/60 border border-emerald-500/50 rounded-xl text-emerald-300 font-bold text-xs">
                  {botCreateFeedback}
                </div>
              )}

              {/* Form: Crear Nuevo Bot */}
              {isCreatingBot && (
                <form
                  onSubmit={handleCreateBotSubmit}
                  className="p-4 rounded-2xl bg-slate-950 border border-emerald-500/40 space-y-3"
                >
                  <h5 className="font-bold text-emerald-400 text-xs uppercase tracking-wide">
                    Crear Nuevo Bot en el Servidor
                  </h5>

                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1">Nombre del Bot</label>
                    <input
                      type="text"
                      value={newBotName}
                      onChange={(e) => setNewBotName(e.target.value)}
                      placeholder="Ej: ApexCyber, Valkyrie_99..."
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white text-xs font-semibold focus:outline-none focus:border-emerald-400"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-slate-400 block mb-1">Elo Inicial</label>
                      <input
                        type="number"
                        value={newBotElo}
                        onChange={(e) => setNewBotElo(Number(e.target.value))}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-mono text-xs focus:outline-none focus:border-emerald-400"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] text-slate-400 block mb-1">Personalidad</label>
                      <select
                        value={newBotPersonality}
                        onChange={(e) => setNewBotPersonality(e.target.value as BotPersonality)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-white text-xs"
                      >
                        <option value="sociable">Sociable</option>
                        <option value="elite">Élite</option>
                        <option value="rechazador">Rechazador</option>
                        <option value="solitario">Solitario</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1">
                      Categorías Bonus de Equipo ({newBotCategoryIds.length} activas)
                    </label>
                    <div className="grid grid-cols-2 gap-1.5 max-h-28 overflow-y-auto p-1 bg-slate-900 rounded-lg border border-slate-800">
                      {localCategories.map((c) => {
                        const isSelected = newBotCategoryIds.includes(c.id);
                        return (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => {
                              setNewBotCategoryIds((prev) =>
                                isSelected ? prev.filter((id) => id !== c.id) : [...prev, c.id]
                              );
                            }}
                            className={`p-1.5 rounded-lg border text-left text-xs transition-colors flex items-center justify-between ${
                              isSelected
                                ? 'bg-purple-900/60 border-purple-500 text-purple-200'
                                : 'bg-slate-950 border-slate-800 text-slate-400'
                            }`}
                          >
                            <span className="truncate text-[11px] font-semibold">
                              {isSelected ? '✓ ' : ''}{c.name}
                            </span>
                            <span className="text-[10px] font-mono font-bold text-amber-400 shrink-0 ml-1">
                              +{c.bonusPercent}%
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-all"
                  >
                    Guardar y Crear Bot en Servidor
                  </button>
                </form>
              )}

              {/* Bot / Player Search and Select */}
              <div className="space-y-2">
                <input
                  type="text"
                  value={playerSearch}
                  onChange={(e) => setPlayerSearch(e.target.value)}
                  placeholder="Buscar bot o jugador por nombre..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                />

                <select
                  value={selectedPlayerId}
                  onChange={(e) => {
                    setSelectedPlayerId(e.target.value);
                    const p = allPlayers.find((pl) => pl.id === e.target.value);
                    if (p) setPlayerForm(p);
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                >
                  {filteredPlayers.map((p, idx) => (
                    <option key={`admin_opt_${p.id}_${idx}`} value={p.id}>
                      {p.name} {p.isUser ? '(Admin/Tú)' : '(Bot)'} — {p.elo} pts
                    </option>
                  ))}
                </select>
              </div>

              {/* Edit Selected Player Form */}
              {playerForm && (
                <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-bold text-white text-sm">{playerForm.name}</span>
                      <span className="text-[10px] text-slate-400 block">
                        {playerForm.isUser ? 'Cuenta de Administrador' : 'Bot del Servidor'}
                      </span>
                    </div>
                    <RankBadge
                      rank={getDivisionForElo(playerForm.elo, localRanks)}
                      size="sm"
                      divisionImages={localDivisionImages}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-slate-400 block mb-0.5">Nombre</label>
                      <input
                        type="text"
                        value={playerForm.name}
                        onChange={(e) => setPlayerForm({ ...playerForm, name: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-white text-xs font-semibold"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] text-slate-400 block mb-0.5">Elo Actual</label>
                      <input
                        type="number"
                        value={playerForm.elo}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setPlayerForm({
                            ...playerForm,
                            elo: val,
                            // Note: record accompanies current if current is greater
                            recordElo: Math.max(playerForm.recordElo, val),
                          });
                        }}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-white font-mono text-xs"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] text-slate-400 block mb-0.5">Elo Récord</label>
                      <input
                        type="number"
                        value={playerForm.recordElo}
                        onChange={(e) =>
                          setPlayerForm({ ...playerForm, recordElo: Number(e.target.value) })
                        }
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-amber-300 font-mono text-xs"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] text-slate-400 block mb-0.5">Victorias (Wins)</label>
                      <input
                        type="number"
                        value={playerForm.wins}
                        onChange={(e) =>
                          setPlayerForm({ ...playerForm, wins: Number(e.target.value) })
                        }
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-emerald-400 font-mono text-xs"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] text-slate-400 block mb-0.5">Derrotas (Losses)</label>
                      <input
                        type="number"
                        value={playerForm.losses}
                        onChange={(e) =>
                          setPlayerForm({ ...playerForm, losses: Number(e.target.value) })
                        }
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-rose-400 font-mono text-xs"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] text-slate-400 block mb-0.5">Personalidad</label>
                      <select
                        value={playerForm.personality}
                        onChange={(e) =>
                          setPlayerForm({
                            ...playerForm,
                            personality: e.target.value as BotPersonality,
                          })
                        }
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-white text-xs"
                      >
                        <option value="sociable">Sociable</option>
                        <option value="elite">Élite</option>
                        <option value="rechazador">Rechazador</option>
                        <option value="solitario">Solitario</option>
                      </select>
                    </div>

                    <div className="col-span-2">
                      <label className="text-[10px] text-slate-400 block mb-1">
                        Categorías Bonus de Equipo ({((playerForm.categoryIds && playerForm.categoryIds.length > 0) ? playerForm.categoryIds : playerForm.categoryId ? [playerForm.categoryId] : []).length} activas)
                      </label>
                      <div className="grid grid-cols-2 gap-1.5 max-h-28 overflow-y-auto p-1 bg-slate-950 rounded-lg border border-slate-800">
                        {localCategories.map((c) => {
                          const activeIds = (playerForm.categoryIds && playerForm.categoryIds.length > 0)
                            ? playerForm.categoryIds
                            : playerForm.categoryId ? [playerForm.categoryId] : [];
                          const isSelected = activeIds.includes(c.id);
                          return (
                            <button
                              key={c.id}
                              type="button"
                              onClick={() => {
                                const nextIds = isSelected
                                  ? activeIds.filter((id) => id !== c.id)
                                  : [...activeIds, c.id];
                                setPlayerForm({
                                  ...playerForm,
                                  categoryIds: nextIds,
                                  categoryId: nextIds[0] || undefined,
                                });
                              }}
                              className={`p-1.5 rounded-lg border text-left text-xs transition-colors flex items-center justify-between ${
                                isSelected
                                  ? 'bg-purple-900/60 border-purple-500 text-purple-200'
                                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                              }`}
                            >
                              <span className="truncate text-[11px] font-semibold">
                                {isSelected ? '✓ ' : ''}{c.name}
                              </span>
                              <span className="text-[10px] font-mono font-bold text-amber-400 shrink-0 ml-1">
                                +{c.bonusPercent}%
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={handleSavePlayer}
                    className="w-full py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl transition-all"
                  >
                    Guardar Cambios del Jugador
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: CONFIGURACIÓN DE RANGOS */}
          {activeTab === 'ranks' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-white text-sm">Configuración de Rangos</h4>
                  <p className="text-[11px] text-slate-400">
                    Modifica intervalos de Elo, puntos por victoria/derrota y colores. Cada rango se divide en 3 divisiones (I, II, III).
                  </p>
                </div>
                <button
                  onClick={handleSaveRanks}
                  className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold transition-all"
                >
                  Guardar
                </button>
              </div>

              <div className="space-y-2.5">
                {localRanks.map((r, idx) => (
                  <div
                    key={r.id}
                    className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={r.color}
                          onChange={(e) => handleRankChange(idx, 'color', e.target.value)}
                          className="w-6 h-6 rounded-md bg-transparent border-0 cursor-pointer"
                        />
                        <input
                          type="text"
                          value={r.name}
                          onChange={(e) => handleRankChange(idx, 'name', e.target.value)}
                          className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-white font-bold w-28 text-xs"
                        />
                      </div>
                      <RankBadge rank={r} size="sm" divisionImages={localDivisionImages} />
                    </div>

                    <div className="grid grid-cols-4 gap-2">
                      <div>
                        <label className="text-[10px] text-slate-400 block mb-0.5">Min Elo</label>
                        <input
                          type="number"
                          value={r.minElo}
                          onChange={(e) => handleRankChange(idx, 'minElo', Number(e.target.value))}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-white font-mono text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-400 block mb-0.5">Max Elo</label>
                        <input
                          type="number"
                          value={r.maxElo}
                          onChange={(e) => handleRankChange(idx, 'maxElo', Number(e.target.value))}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-white font-mono text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-emerald-400 block mb-0.5">Victoria (+W)</label>
                        <input
                          type="number"
                          value={r.winElo}
                          onChange={(e) => handleRankChange(idx, 'winElo', Number(e.target.value))}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-emerald-300 font-mono text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-rose-400 block mb-0.5">Derrota (-L)</label>
                        <input
                          type="number"
                          value={r.lossElo}
                          onChange={(e) => handleRankChange(idx, 'lossElo', Number(e.target.value))}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-rose-300 font-mono text-xs"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: CATEGORÍAS */}
          {activeTab === 'categories' && (
            <div className="space-y-4">
              <div>
                <h4 className="font-bold text-white text-sm">Categorías de Bonus de Equipo</h4>
                <p className="text-[11px] text-slate-400">
                  Crea o elimina categorías con multiplicadores para el cálculo de elo en partidas 3v3.
                </p>
              </div>

              {/* Add category form */}
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2.5">
                <span className="font-bold text-purple-300 block text-xs">Nueva Categoría</span>
                <div className="grid grid-cols-3 gap-2">
                  <input
                    type="text"
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    placeholder="Nombre (ej: Vanguardia)"
                    className="col-span-2 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white text-xs"
                  />
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      value={newCatBonus}
                      onChange={(e) => setNewCatBonus(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-amber-400 font-mono text-xs font-bold"
                    />
                    <span className="text-amber-400 font-bold">%</span>
                  </div>
                </div>
                <input
                  type="text"
                  value={newCatDesc}
                  onChange={(e) => setNewCatDesc(e.target.value)}
                  placeholder="Descripción del bonus..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white text-xs"
                />
                <button
                  onClick={handleAddCategory}
                  className="w-full py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl transition-all"
                >
                  Crear Categoría
                </button>
              </div>

              {/* List of categories */}
              <div className="space-y-2">
                {localCategories.map((c) => (
                  <div
                    key={c.id}
                    className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800 flex items-center justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-sm">{c.name}</span>
                        <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-400 font-mono font-bold text-xs">
                          +{c.bonusPercent}%
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">{c.description}</p>
                    </div>

                    <button
                      onClick={() => handleDeleteCategory(c.id)}
                      className="px-2.5 py-1 rounded-lg text-slate-500 hover:text-rose-400 text-xs font-bold"
                    >
                      Eliminar
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: RESET */}
          {activeTab === 'reset' && (
            <div className="space-y-4">
              <div>
                <h4 className="font-bold text-white text-sm">Resets y Temporadas</h4>
                <p className="text-[11px] text-slate-400">
                  Acciones globales sobre todos los competidores del servidor.
                </p>
              </div>

              {/* Official rank reset: -2 full ranks */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-purple-900/50 space-y-2">
                <span className="font-bold text-purple-300 block text-sm">
                  Reset Oficial de Rango (-2 Rangos Completos)
                </span>
                <p className="text-[11px] text-slate-400">
                  Aplica la regla oficial: todos los jugadores (incluido tú) bajan exactamente 2 rangos completos (6 divisiones).
                </p>
                <button
                  onClick={() => {
                    sounds.playRankUp();
                    onExecuteRankReset();
                    onClose();
                  }}
                  className="w-full py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl transition-all"
                >
                  Ejecutar Reset Oficial (-6 Divisiones)
                </button>
              </div>

              {/* Hard reset to 0 */}
              <div className="p-4 rounded-2xl bg-rose-950/30 border border-rose-900/50 space-y-2">
                <span className="font-bold text-rose-400 block text-sm">
                  Reinicio Total a 0 Elo (Bronce I)
                </span>
                <p className="text-[11px] text-slate-400">
                  Reinicia a todos los 100 bots y al jugador a 0 puntos de Elo.
                </p>
                <button
                  onClick={() => {
                    sounds.playDefeat();
                    onResetAllBots();
                    onClose();
                  }}
                  className="w-full py-2.5 bg-rose-600/80 hover:bg-rose-600 text-white font-bold rounded-xl transition-all"
                >
                  Hard Reset: Todos a 0 Elo
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
