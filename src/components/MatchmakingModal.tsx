import React, { useState } from 'react';
import { Player, RankTier, BonusCategory, MatchResult } from '../types/ranked';
import { RankBadge } from './RankBadge';
import { 
  getDivisionForElo, 
  getRankTierIndex, 
  calculateTeamPower, 
  canBotAcceptInvite 
} from '../utils/rankedDefaults';
import { sounds } from '../utils/audio';

interface MatchmakingModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: Player;
  allPlayers: Player[];
  ranks: RankTier[];
  categories: BonusCategory[];
  onCompleteMatch: (result: MatchResult) => void;
  onSelectPlayer: (player: Player) => void;
  userRankPosition: number;
  divisionImages?: Record<string, string>;
}

type Step = 'select_mode' | 'select_team' | 'searching' | 'clash' | 'result';

export const MatchmakingModal: React.FC<MatchmakingModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  allPlayers,
  ranks,
  categories,
  onCompleteMatch,
  onSelectPlayer,
  userRankPosition,
  divisionImages,
}) => {
  const [step, setStep] = useState<Step>('select_mode');
  const [mode, setMode] = useState<'solo' | 'equipo'>('solo');
  const [selectedAllies, setSelectedAllies] = useState<Player[]>([]);
  const [rivalTeam, setRivalTeam] = useState<Player[]>([]);
  const [matchResult, setMatchResult] = useState<MatchResult | null>(null);
  const [currentRoundIndex, setCurrentRoundIndex] = useState(0);
  const [isSimulatingRounds, setIsSimulatingRounds] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);

  if (!isOpen) return null;

  const userDiv = getDivisionForElo(currentUser.elo, ranks);
  const userRankIdx = getRankTierIndex(userDiv.tierName, ranks);

  // Eligible rivals within ±2 tiers
  const eligibleRivals = allPlayers.filter((p) => {
    if (p.id === currentUser.id) return false;
    const pDiv = getDivisionForElo(p.elo, ranks);
    const pIdx = getRankTierIndex(pDiv.tierName, ranks);
    return Math.abs(pIdx - userRankIdx) <= 2;
  });

  const handleStartSearching = (teamAllies: Player[]) => {
    setStep('searching');
    sounds.playRadarPing();

    setTimeout(() => {
      // Exclude currentUser and teamAllies from rival candidates
      const excludedIds = new Set<string>([currentUser.id, ...teamAllies.map((a) => a.id)]);
      const availablePool = allPlayers.filter((p) => !excludedIds.has(p.id));

      const rankedPool = availablePool.filter((p) => {
        const pDiv = getDivisionForElo(p.elo, ranks);
        const pIdx = getRankTierIndex(pDiv.tierName, ranks);
        return Math.abs(pIdx - userRankIdx) <= 2;
      });

      const primaryCandidates = rankedPool.length >= 3 ? rankedPool : availablePool;
      const shuffled = [...primaryCandidates].sort(() => Math.random() - 0.5);

      const rivals: Player[] = [];
      const chosenRivalIds = new Set<string>();

      for (const candidate of shuffled) {
        if (!chosenRivalIds.has(candidate.id)) {
          chosenRivalIds.add(candidate.id);
          rivals.push(candidate);
          if (rivals.length === 3) break;
        }
      }

      // If still fewer than 3, grab from any remaining available pool players
      if (rivals.length < 3) {
        const remaining = availablePool.filter((p) => !chosenRivalIds.has(p.id)).sort(() => Math.random() - 0.5);
        for (const candidate of remaining) {
          chosenRivalIds.add(candidate.id);
          rivals.push(candidate);
          if (rivals.length === 3) break;
        }
      }

      setRivalTeam(rivals);
      setStep('clash');
      sounds.playRadarPing();
    }, 2000);
  };

  const handleExecuteMatch = () => {
    const fullUserTeam = [currentUser, ...selectedAllies];
    const userTeamPower = calculateTeamPower(fullUserTeam, categories);
    const rivalTeamPower = calculateTeamPower(rivalTeam, categories);

    const winProbability = userTeamPower / (userTeamPower + rivalTeamPower);
    const roll = Math.random();
    const userWins = roll < winProbability * 0.9 + 0.05;

    const userEloChange = userWins ? userDiv.winElo : -userDiv.lossElo;

    const rounds = [
      {
        roundNumber: 1,
        userScore: userWins ? 1 : 0,
        rivalScore: userWins ? 0 : 1,
        highlight: userWins ? 'Dominio táctico en primera ronda' : 'El rival toma ventaja en R1',
      },
      {
        roundNumber: 2,
        userScore: 1,
        rivalScore: 1,
        highlight: 'Ronda equilibrada con respuesta inmediata',
      },
      {
        roundNumber: 3,
        userScore: userWins ? 2 : 1,
        rivalScore: userWins ? 1 : 2,
        highlight: userWins ? 'Cierre decisivo para sellar la victoria' : 'El rival define el combate en R3',
      },
    ];

    const heartsChanges: MatchResult['heartsChanges'] = [];

    selectedAllies.forEach((ally) => {
      if (userWins) {
        const newHearts = Math.min(5, ally.heartsWithUser + 1);
        heartsChanges.push({
          playerId: ally.id,
          playerName: ally.name,
          change: 1,
          newTotal: newHearts,
          reason: 'Victoria en equipo (+1 afinidad)',
        });
      }
    });

    rivalTeam.forEach((rival) => {
      if (currentUser.friendIds.includes(rival.id) && userWins) {
        const newHearts = Math.max(0, rival.heartsWithUser - 1);
        heartsChanges.push({
          playerId: rival.id,
          playerName: rival.name,
          change: -1,
          newTotal: newHearts,
          reason: 'Derrotaste a tu amigo en ranked (-1 afinidad)',
        });
      }
    });

    const result: MatchResult = {
      winner: userWins ? 'user' : 'rival',
      userTeam: fullUserTeam,
      rivalTeam,
      userEloChange,
      alliesEloChange: userEloChange,
      rivalsEloChange: -userEloChange,
      rounds,
      heartsChanges,
    };

    setMatchResult(result);
    setIsSimulatingRounds(true);
    setCurrentRoundIndex(0);

    setTimeout(() => setCurrentRoundIndex(1), 600);
    setTimeout(() => setCurrentRoundIndex(2), 1200);
    setTimeout(() => {
      setIsSimulatingRounds(false);
      setStep('result');
      if (userWins) {
        sounds.playVictory();
      } else {
        sounds.playDefeat();
      }
    }, 1800);
  };

  const handleSelectAlly = (bot: Player) => {
    setInviteError(null);
    if (selectedAllies.some((a) => a.id === bot.id)) {
      setSelectedAllies(selectedAllies.filter((a) => a.id !== bot.id));
      return;
    }

    if (selectedAllies.length >= 2) {
      setInviteError('El equipo ya tiene 3 miembros (tú + 2 compañeros).');
      return;
    }

    const check = canBotAcceptInvite(bot, currentUser, userRankPosition, ranks);
    if (!check.accepted) {
      sounds.playDefeat();
      setInviteError(`"${bot.name}" rechazó la invitación: ${check.reason}`);
      return;
    }

    sounds.playTap();
    setSelectedAllies([...selectedAllies, bot]);
  };

  const fullTeam = [currentUser, ...selectedAllies];
  const userPower = calculateTeamPower(fullTeam, categories);
  const rivalPower = rivalTeam.length > 0 ? calculateTeamPower(rivalTeam, categories) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-white tracking-tight">
              {step === 'select_mode' && 'Modo de Partida'}
              {step === 'select_team' && 'Formar Equipo 3v3'}
              {step === 'searching' && 'Buscando Rivales (±2 Rangos)'}
              {step === 'clash' && 'Duelo 3v3 Confirmado'}
              {step === 'result' && (matchResult?.winner === 'user' ? 'Victoria de Ranked' : 'Derrota en Ranked')}
            </h3>
            <p className="text-[11px] text-slate-400">
              Matchmaking 3v3 competitivo
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

        {/* Content Body */}
        <div className="p-5 overflow-y-auto flex-1 text-sm">
          {/* STEP 1: Select Mode */}
          {step === 'select_mode' && (
            <div className="space-y-4">
              <p className="text-xs text-slate-400 text-center">
                Selecciona la modalidad para competir:
              </p>

              <div className="space-y-3">
                <button
                  onClick={() => {
                    sounds.playTap();
                    setMode('solo');
                    const nonUserPool = allPlayers.filter((p) => p.id !== currentUser.id);
                    const rankedAllies = nonUserPool.filter((p) => {
                      const pDiv = getDivisionForElo(p.elo, ranks);
                      const pIdx = getRankTierIndex(pDiv.tierName, ranks);
                      return Math.abs(pIdx - userRankIdx) <= 2;
                    });
                    const alliesPool = rankedAllies.length >= 2 ? rankedAllies : nonUserPool;
                    const shuffled = [...alliesPool].sort(() => Math.random() - 0.5);
                    const chosenAllies: Player[] = [];
                    const chosenAllyIds = new Set<string>();
                    for (const candidate of shuffled) {
                      if (!chosenAllyIds.has(candidate.id)) {
                        chosenAllyIds.add(candidate.id);
                        chosenAllies.push(candidate);
                        if (chosenAllies.length === 2) break;
                      }
                    }
                    setSelectedAllies(chosenAllies);
                    handleStartSearching(chosenAllies);
                  }}
                  className="w-full p-4 rounded-2xl bg-slate-950/70 border border-slate-800 hover:border-amber-500/60 hover:bg-slate-800/40 text-left transition-all"
                >
                  <h4 className="font-bold text-white text-sm mb-0.5">
                    Jugar Ranked en solitario
                  </h4>
                  <span className="text-[11px] text-slate-400">
                    El sistema te empareja con 2 compañeros acordes a tu rango.
                  </span>
                </button>

                <button
                  onClick={() => {
                    sounds.playTap();
                    setMode('equipo');
                    setSelectedAllies([]);
                    setStep('select_team');
                  }}
                  className="w-full p-4 rounded-2xl bg-slate-950/70 border border-slate-800 hover:border-amber-500/60 hover:bg-slate-800/40 text-left transition-all"
                >
                  <div className="flex items-center justify-between mb-0.5">
                    <h4 className="font-bold text-white text-sm">
                      Jugar Ranked en equipo
                    </h4>
                    <span className="text-[10px] uppercase font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                      Obligatorio 3/3
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Elige a 2 amigos o bots disponibles para formar tu escuadrón completo.
                  </p>
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: Select Team */}
          {step === 'select_team' && (
            <div className="space-y-4">
              <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-3.5">
                <span className="text-xs font-semibold text-slate-400 block mb-2">
                  Tu Escuadrón ({fullTeam.length}/3):
                </span>
                <div className="grid grid-cols-3 gap-2">
                  <div className="p-3 rounded-xl bg-slate-900 border border-amber-500/40 text-center flex flex-col justify-center">
                    <span className="text-xs font-bold text-amber-400 block truncate">{currentUser.name}</span>
                    <span className="text-[10px] text-slate-400 font-mono mt-0.5">Tú</span>
                  </div>

                  {[0, 1].map((index) => {
                    const ally = selectedAllies[index];
                    return (
                      <div
                        key={index}
                        className={`p-3 rounded-xl border text-center flex flex-col items-center justify-center ${
                          ally
                            ? 'bg-slate-900 border-slate-700'
                            : 'bg-slate-950/40 border-dashed border-slate-800 text-slate-500'
                        }`}
                      >
                        {ally ? (
                          <>
                            <span className="text-xs font-bold text-white block truncate w-full">{ally.name}</span>
                            <button
                              onClick={() => handleSelectAlly(ally)}
                              className="text-[10px] text-rose-400 hover:underline mt-1 font-semibold"
                            >
                              Quitar
                            </button>
                          </>
                        ) : (
                          <span className="text-[11px]">Aliado {index + 1}</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {inviteError && (
                <div className="p-3 bg-rose-950/40 border border-rose-800/50 rounded-xl text-xs text-rose-300">
                  {inviteError}
                </div>
              )}

              <div>
                <span className="text-xs font-semibold text-slate-300 block mb-2">
                  Invitar Amigos y Bots (±2 Rangos):
                </span>
                <div className="max-h-52 overflow-y-auto space-y-2 pr-1">
                  {eligibleRivals.slice(0, 15).map((bot, bIdx) => {
                    const isSelected = selectedAllies.some((a) => a.id === bot.id);
                    const isFriend = currentUser.friendIds.includes(bot.id);
                    const divInfo = getDivisionForElo(bot.elo, ranks);

                    return (
                      <button
                        key={`eligible_bot_${bot.id}_${bIdx}`}
                        onClick={() => handleSelectAlly(bot)}
                        className={`w-full p-2.5 rounded-xl flex items-center justify-between text-left border transition-all ${
                          isSelected
                            ? 'bg-amber-500/10 border-amber-500/40'
                            : 'bg-slate-950/60 border-slate-800/80 hover:bg-slate-800/40'
                        }`}
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-white truncate">{bot.name}</span>
                            {isFriend && (
                              <span className="text-[10px] font-mono text-rose-400 font-bold">
                                {bot.heartsWithUser}/5
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-400 capitalize block mt-0.5">
                            {bot.personality} · {bot.elo} pts
                          </span>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <RankBadge rank={divInfo} size="sm" divisionImages={divisionImages} />
                          <span
                            className={`text-xs font-bold px-2 py-1 rounded-lg ${
                              isSelected
                                ? 'bg-rose-500/20 text-rose-400'
                                : 'bg-amber-500/20 text-amber-400'
                            }`}
                          >
                            {isSelected ? 'Quitar' : 'Añadir'}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <button
                disabled={selectedAllies.length !== 2}
                onClick={() => handleStartSearching(selectedAllies)}
                className={`w-full h-12 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center transition-all ${
                  selectedAllies.length === 2
                    ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-lg shadow-amber-500/25 active:scale-98'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                }`}
              >
                Buscar Rival 3v3 ({fullTeam.length}/3)
              </button>
            </div>
          )}

          {/* STEP 3: Radar Searching */}
          {step === 'searching' && (
            <div className="py-12 text-center space-y-4">
              <div className="w-16 h-16 mx-auto rounded-full bg-slate-900 border-2 border-amber-400 flex items-center justify-center font-bold text-amber-400 animate-pulse text-xs uppercase">
                Radar
              </div>

              <div>
                <h4 className="text-base font-bold text-white mb-1">
                  Escaneando rivales en el lobby...
                </h4>
                <p className="text-xs text-slate-400 max-w-xs mx-auto">
                  Filtrando {allPlayers.length} jugadores dentro de ±2 rangos de {userDiv.fullName}
                </p>
              </div>
            </div>
          )}

          {/* STEP 4: Clash Presentation */}
          {step === 'clash' && (
            <div className="space-y-4">
              <div className="text-center">
                <span className="text-[11px] font-bold uppercase tracking-widest text-amber-400">
                  Enfrentamiento 3v3
                </span>
                <p className="text-xs text-slate-400">
                  Evaluando Elo Total + Bonus de Categoría
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-2xl bg-amber-950/20 border border-amber-600/40 text-center">
                  <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wide block mb-1">
                    Tu Equipo (3)
                  </span>
                  <div className="space-y-1.5 mb-2">
                    {fullTeam.map((p, pIdx) => {
                      const cat = categories.find((c) => c.id === p.categoryId);
                      return (
                        <div key={`full_team_${p.id}_${pIdx}`} className="p-1.5 rounded-lg bg-slate-950/70 flex items-center justify-between text-[11px]">
                          <span className="font-semibold text-slate-200 truncate">{p.name}</span>
                          {cat && (
                            <span className="text-[10px] font-mono text-amber-400">+{cat.bonusPercent}%</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  <div className="pt-2 border-t border-amber-800/40">
                    <span className="text-[10px] text-slate-400 block">Poder Efectivo:</span>
                    <span className="text-base font-mono font-bold text-amber-300">
                      {userPower.toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-rose-950/20 border border-rose-600/40 text-center">
                  <span className="text-[11px] font-bold text-rose-400 uppercase tracking-wide block mb-1">
                    Equipo Rival (3)
                  </span>
                  <div className="space-y-1.5 mb-2">
                    {rivalTeam.map((p, pIdx) => {
                      const cat = categories.find((c) => c.id === p.categoryId);
                      return (
                        <div key={`rival_team_${p.id}_${pIdx}`} className="p-1.5 rounded-lg bg-slate-950/70 flex items-center justify-between text-[11px]">
                          <span className="font-semibold text-slate-200 truncate">{p.name}</span>
                          {cat && (
                            <span className="text-[10px] font-mono text-purple-400">+{cat.bonusPercent}%</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  <div className="pt-2 border-t border-rose-800/40">
                    <span className="text-[10px] text-slate-400 block">Poder Efectivo:</span>
                    <span className="text-base font-mono font-bold text-rose-300">
                      {rivalPower.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={handleExecuteMatch}
                disabled={isSimulatingRounds}
                className="w-full h-12 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm uppercase tracking-wider rounded-xl shadow-lg shadow-amber-500/25 flex items-center justify-center active:scale-98 transition-transform"
              >
                {isSimulatingRounds ? 'Disputando Rondas...' : 'Iniciar Enfrentamiento 3v3'}
              </button>
            </div>
          )}

          {/* STEP 5: Final Match Result */}
          {step === 'result' && matchResult && (
            <div className="space-y-4">
              <div
                className={`p-5 rounded-2xl text-center border ${
                  matchResult.winner === 'user'
                    ? 'bg-emerald-950/30 border-emerald-500/50'
                    : 'bg-rose-950/30 border-rose-500/50'
                }`}
              >
                <h3 className="text-xl font-black text-white">
                  {matchResult.winner === 'user' ? 'VICTORIA' : 'DERROTA'}
                </h3>

                <div className="mt-2 flex items-center justify-center gap-3">
                  <div className="px-3 py-1 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono font-bold">
                    Elo:{' '}
                    <span
                      className={
                        matchResult.userEloChange > 0 ? 'text-emerald-400' : 'text-rose-400'
                      }
                    >
                      {matchResult.userEloChange > 0 ? `+${matchResult.userEloChange}` : matchResult.userEloChange} pts
                    </span>
                  </div>
                </div>
              </div>

              {/* Rounds Recap */}
              <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-3.5 space-y-2">
                <span className="text-xs font-semibold text-slate-400 block mb-1">
                  Resumen de Rondas:
                </span>
                {matchResult.rounds.map((r, rIdx) => (
                  <div
                    key={`match_round_${r.roundNumber}_${rIdx}`}
                    className="p-2 rounded-xl bg-slate-900/80 border border-slate-800/80 flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-bold text-white block">Ronda {r.roundNumber}</span>
                      <span className="text-[11px] text-slate-400">{r.highlight}</span>
                    </div>
                    <div className="font-mono font-bold text-xs tabular-nums text-slate-200">
                      {r.userScore} - {r.rivalScore}
                    </div>
                  </div>
                ))}
              </div>

              {/* Hearts Changes Notifications */}
              {matchResult.heartsChanges.length > 0 && (
                <div className="bg-rose-950/20 border border-rose-800/40 rounded-2xl p-3.5 space-y-1.5">
                  <span className="text-xs font-bold text-rose-400 block mb-1">
                    Cambios de Afinidad:
                  </span>
                  {matchResult.heartsChanges.map((hc, hcIdx) => (
                    <div
                      key={`heart_ch_${hc.playerId}_${hcIdx}`}
                      className="text-xs text-slate-300 flex items-center justify-between py-1 border-b border-rose-900/30 last:border-none"
                    >
                      <span>{hc.playerName}:</span>
                      <span className="font-semibold text-rose-400">
                        {hc.change > 0 ? `+${hc.change}` : hc.change} ({hc.newTotal}/5)
                      </span>
                    </div>
                  ))}
                </div>
              )}

              <button
                onClick={() => {
                  sounds.playTap();
                  onCompleteMatch(matchResult);
                  onClose();
                }}
                className="w-full h-12 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-colors active:scale-98"
              >
                Continuar
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
