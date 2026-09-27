import React, { useState, useRef } from 'react';
import { Player, RankTier, BonusCategory, Tournament, TournamentMatch } from '../types/ranked';
import { RankBadge } from './RankBadge';
import { getDivisionForElo, calculateTeamPower } from '../utils/rankedDefaults';
import { sounds } from '../utils/audio';

interface TournamentViewProps {
  allPlayers: Player[];
  currentUser: Player;
  ranks: RankTier[];
  categories: BonusCategory[];
  isAdmin: boolean;
  onClose: () => void;
  onSelectPlayer: (player: Player) => void;
  divisionImages?: Record<string, string>;
}

export const TournamentView: React.FC<TournamentViewProps> = ({
  allPlayers,
  currentUser,
  ranks,
  categories,
  isAdmin,
  onClose,
  onSelectPlayer,
  divisionImages,
}) => {
  const [tournamentSize, setTournamentSize] = useState<8 | 16>(8);
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [selectedPlayerToSwap, setSelectedPlayerToSwap] = useState<{
    matchId: string;
    teamKey: 'teamA' | 'teamB';
    playerIndex: number;
    player: Player;
  } | null>(null);
  const [replaceTarget, setReplaceTarget] = useState<{
    matchId: string;
    teamKey: 'teamA' | 'teamB';
    playerIndex: number;
    current: Player;
  } | null>(null);
  const [substituteSearch, setSubstituteSearch] = useState('');

  const pressTimer = useRef<NodeJS.Timeout | null>(null);
  const isLongPressTriggered = useRef(false);

  const handleGenerateTournament = (size: 8 | 16) => {
    sounds.playTap();
    // In tournament, no players can repeat: extract strictly unique players by ID
    const seenIds = new Set<string>();
    const uniqueSorted: Player[] = [];
    for (const p of [...allPlayers].sort((a, b) => b.elo - a.elo)) {
      if (!seenIds.has(p.id)) {
        seenIds.add(p.id);
        uniqueSorted.push(p);
      }
    }

    const neededPlayersCount = size * 3;
    const pool = uniqueSorted.slice(0, neededPlayersCount);

    const matches: TournamentMatch[] = [];
    const numMatchesRound1 = size / 2;

    for (let m = 0; m < numMatchesRound1; m++) {
      const teamAIndex = m * 2;
      const teamBIndex = m * 2 + 1;

      const teamAPlayers = pool.slice(teamAIndex * 3, teamAIndex * 3 + 3);
      const teamBPlayers = pool.slice(teamBIndex * 3, teamBIndex * 3 + 3);

      matches.push({
        id: `match_r1_${m + 1}`,
        round: 1,
        matchIndex: m,
        teamA: {
          id: `team_${teamAIndex + 1}`,
          name: `Escuadrón ${teamAPlayers[0]?.name || 'Alpha'}`,
          players: teamAPlayers,
          totalPower: calculateTeamPower(teamAPlayers, categories),
        },
        teamB: {
          id: `team_${teamBIndex + 1}`,
          name: `Escuadrón ${teamBPlayers[0]?.name || 'Omega'}`,
          players: teamBPlayers,
          totalPower: calculateTeamPower(teamBPlayers, categories),
        },
      });
    }

    const totalRounds = size === 8 ? 3 : 4;

    setTournament({
      id: `tourney_${Date.now()}`,
      name: `Torneo Clasificatorio (${size} Equipos)`,
      size,
      currentRound: 1,
      totalRounds,
      matches,
      isCompleted: false,
    });
    setSelectedPlayerToSwap(null);
  };

  const handleNextRound = () => {
    if (!tournament || tournament.isCompleted) return;
    sounds.playRadarPing();

    const updatedMatches = tournament.matches.map((match) => {
      if (match.round !== tournament.currentRound || match.winnerTeamId) return match;

      const powerA = calculateTeamPower(match.teamA.players, categories);
      const powerB = calculateTeamPower(match.teamB.players, categories);

      const winOddsA = powerA / (powerA + powerB);
      const roll = Math.random();
      const teamAWins = roll < winOddsA;

      const winnerId = teamAWins ? match.teamA.id : match.teamB.id;

      return {
        ...match,
        teamA: { ...match.teamA, totalPower: powerA, score: teamAWins ? 2 : 1 },
        teamB: { ...match.teamB, totalPower: powerB, score: teamAWins ? 1 : 2 },
        winnerTeamId: winnerId,
      };
    });

    const isFinalRound = tournament.currentRound >= tournament.totalRounds;

    if (isFinalRound) {
      const finalMatch = updatedMatches.find((m) => m.round === tournament.totalRounds);
      const champion =
        finalMatch?.winnerTeamId === finalMatch?.teamA.id ? finalMatch?.teamA : finalMatch?.teamB;
      sounds.playVictory();

      setTournament({
        ...tournament,
        matches: updatedMatches,
        isCompleted: true,
        championTeam: champion
          ? { id: champion.id, name: champion.name, players: champion.players }
          : undefined,
      });
      return;
    }

    const nextRoundNumber = tournament.currentRound + 1;
    const evaluatedCurrentRound = updatedMatches.filter((m) => m.round === tournament.currentRound);
    const winningTeams = evaluatedCurrentRound.map((m) =>
      m.winnerTeamId === m.teamA.id ? m.teamA : m.teamB
    );

    const nextRoundMatches: TournamentMatch[] = [];
    const pairsCount = winningTeams.length / 2;

    for (let i = 0; i < pairsCount; i++) {
      const teamA = winningTeams[i * 2];
      const teamB = winningTeams[i * 2 + 1];

      nextRoundMatches.push({
        id: `match_r${nextRoundNumber}_${i + 1}`,
        round: nextRoundNumber,
        matchIndex: i,
        teamA: {
          id: teamA.id,
          name: teamA.name,
          players: [...teamA.players],
          totalPower: calculateTeamPower(teamA.players, categories),
        },
        teamB: {
          id: teamB.id,
          name: teamB.name,
          players: [...teamB.players],
          totalPower: calculateTeamPower(teamB.players, categories),
        },
      });
    }

    setTournament({
      ...tournament,
      currentRound: nextRoundNumber,
      matches: [...updatedMatches, ...nextRoundMatches],
    });
  };

  const handlePlayerTouch = (
    matchId: string,
    teamKey: 'teamA' | 'teamB',
    playerIndex: number,
    player: Player
  ) => {
    if (!isAdmin) {
      onSelectPlayer(player);
      return;
    }

    if (isLongPressTriggered.current) {
      isLongPressTriggered.current = false;
      return;
    }

    if (!selectedPlayerToSwap) {
      sounds.playTap();
      setSelectedPlayerToSwap({ matchId, teamKey, playerIndex, player });
      return;
    }

    if (selectedPlayerToSwap.player.id === player.id) {
      setSelectedPlayerToSwap(null);
      return;
    }

    sounds.playVictory();
    if (!tournament) return;

    // Swap the two players in the tournament matches (preserving 100% uniqueness)
    const newMatches = tournament.matches.map((m) => {
      const matchCopy = { ...m };

      // Case 1: Swapping within the exact same match and same team
      if (
        m.id === selectedPlayerToSwap.matchId &&
        m.id === matchId &&
        selectedPlayerToSwap.teamKey === teamKey
      ) {
        const team = m[teamKey];
        const newPlayers = [...team.players];
        newPlayers[selectedPlayerToSwap.playerIndex] = player;
        newPlayers[playerIndex] = selectedPlayerToSwap.player;
        matchCopy[teamKey] = {
          ...team,
          players: newPlayers,
          totalPower: calculateTeamPower(newPlayers, categories),
        };
        return matchCopy;
      }

      // Case 2: Swapping between different teams or different matches
      if (m.id === selectedPlayerToSwap.matchId) {
        const team = m[selectedPlayerToSwap.teamKey];
        const newPlayers = [...team.players];
        newPlayers[selectedPlayerToSwap.playerIndex] = player;
        matchCopy[selectedPlayerToSwap.teamKey] = {
          ...team,
          players: newPlayers,
          totalPower: calculateTeamPower(newPlayers, categories),
        };
      }

      if (m.id === matchId) {
        const team = m[teamKey];
        const newPlayers = [...team.players];
        newPlayers[playerIndex] = selectedPlayerToSwap.player;
        matchCopy[teamKey] = {
          ...team,
          players: newPlayers,
          totalPower: calculateTeamPower(newPlayers, categories),
        };
      }

      return matchCopy;
    });

    setTournament({ ...tournament, matches: newMatches });
    setSelectedPlayerToSwap(null);
  };

  const handleTouchStart = (
    matchId: string,
    teamKey: 'teamA' | 'teamB',
    playerIndex: number,
    current: Player
  ) => {
    if (!isAdmin) return;
    isLongPressTriggered.current = false;
    if (pressTimer.current) clearTimeout(pressTimer.current);
    pressTimer.current = setTimeout(() => {
      isLongPressTriggered.current = true;
      sounds.playTap();
      setReplaceTarget({ matchId, teamKey, playerIndex, current });
      setSubstituteSearch('');
      setSelectedPlayerToSwap(null);
    }, 450);
  };

  const handleTouchEnd = () => {
    if (pressTimer.current) {
      clearTimeout(pressTimer.current);
      pressTimer.current = null;
    }
  };

  const handleSubstitutePlayer = (newPlayer: Player) => {
    if (!tournament || !replaceTarget) return;
    // Strictly prevent repeating any player currently in the tournament
    if (activeTournamentPlayerIds.has(newPlayer.id)) return;
    sounds.playVictory();

    const newMatches = tournament.matches.map((m) => {
      if (m.id !== replaceTarget.matchId) return m;
      const team = m[replaceTarget.teamKey];
      const updatedPlayers = [...team.players];
      updatedPlayers[replaceTarget.playerIndex] = newPlayer;

      return {
        ...m,
        [replaceTarget.teamKey]: {
          ...team,
          players: updatedPlayers,
          totalPower: calculateTeamPower(updatedPlayers, categories),
        },
      };
    });

    setTournament({ ...tournament, matches: newMatches });
    setReplaceTarget(null);
    setSubstituteSearch('');
  };

  const sortedRankedPlayers = React.useMemo(() => {
    const seen = new Set<string>();
    const list: Player[] = [];
    for (const p of allPlayers) {
      if (p && p.id && !seen.has(p.id)) {
        seen.add(p.id);
        list.push(p);
      }
    }
    return list.sort((a, b) => b.elo - a.elo);
  }, [allPlayers]);

  // Set of all player IDs currently playing in the active tournament round
  const activeTournamentPlayerIds = React.useMemo(() => {
    if (!tournament) return new Set<string>();
    const ids = new Set<string>();
    tournament.matches
      .filter((m) => m.round === tournament.currentRound)
      .forEach((m) => {
        m.teamA.players.forEach((p) => ids.add(p.id));
        m.teamB.players.forEach((p) => ids.add(p.id));
      });
    return ids;
  }, [tournament]);

  // Server players who are NOT in the tournament (strictly no duplicates)
  const candidatesOutsideTournament = React.useMemo(() => {
    return sortedRankedPlayers.filter((p) => !activeTournamentPlayerIds.has(p.id));
  }, [sortedRankedPlayers, activeTournamentPlayerIds]);

  const filteredCandidates = React.useMemo(() => {
    const q = substituteSearch.toLowerCase().trim();
    if (!q) return candidatesOutsideTournament;
    return candidatesOutsideTournament.filter((p) =>
      p.name.toLowerCase().includes(q)
    );
  }, [candidatesOutsideTournament, substituteSearch]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-white tracking-tight">
              Torneo de Campeones 3v3
            </h3>
            <p className="text-[11px] text-slate-400">
              Esquema de llaves y eliminación directa
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

        {/* Content */}
        <div className="p-4 overflow-y-auto flex-1 text-sm space-y-4">
          {!tournament ? (
            <div className="text-center py-8 space-y-4">
              <h4 className="text-base font-bold text-white mb-1">
                Crear Torneo Clasificatorio
              </h4>
              <p className="text-xs text-slate-400 max-w-xs mx-auto">
                Los equipos de 3 se formarán entre los mejores amigos y jugadores más competitivos del ranking.
              </p>

              <div className="flex justify-center gap-3 pt-2">
                <button
                  onClick={() => handleGenerateTournament(8)}
                  className="px-5 py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md active:scale-95 transition-all"
                >
                  Torneo 8 Equipos (24 Bots)
                </button>
                <button
                  onClick={() => handleGenerateTournament(16)}
                  className="px-5 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-700 active:scale-95 transition-all"
                >
                  Torneo 16 Equipos (48 Bots)
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Status Bar */}
              <div className="flex items-center justify-between bg-slate-950/80 p-3 rounded-2xl border border-slate-800">
                <div>
                  <span className="text-xs font-bold text-white block">
                    {tournament.name}
                  </span>
                  <span className="text-[11px] text-amber-400 font-mono">
                    {tournament.isCompleted
                      ? 'Torneo Concluido'
                      : `Ronda ${tournament.currentRound} de ${tournament.totalRounds}`}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleGenerateTournament(tournament.size)}
                    className="px-2.5 py-1.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white text-xs font-bold"
                  >
                    Reiniciar
                  </button>

                  {!tournament.isCompleted && (
                    <button
                      onClick={handleNextRound}
                      className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md active:scale-95 transition-all"
                    >
                      Next Round
                    </button>
                  )}
                </div>
              </div>

              {/* Champion Banner */}
              {tournament.isCompleted && tournament.championTeam && (
                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/40 text-center">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-amber-300">
                    Equipo Campeón del Torneo
                  </span>
                  <h4 className="text-lg font-black text-white mt-0.5">
                    {tournament.championTeam.name}
                  </h4>
                  <div className="flex justify-center gap-2 mt-2">
                    {tournament.championTeam.players.map((p, idx) => (
                      <span
                        key={`champ_${p.id}_${idx}`}
                        className="text-xs font-bold px-2 py-0.5 rounded bg-slate-900 border border-amber-500/40 text-amber-300"
                      >
                        {p.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {isAdmin && !tournament.isCompleted && (
                <div className="p-3 rounded-2xl bg-purple-950/40 border border-purple-800/50 text-[11px] text-purple-300 space-y-1">
                  <div className="font-bold text-white flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                    Reglas del Torneo (Admin):
                  </div>
                  <p className="text-amber-300 font-semibold">
                    No se pueden repetir jugadores en el torneo.
                  </p>
                  <p className="text-slate-300">
                    • <strong>Intercambiar de sitio:</strong> Toca un jugador y luego otro para intercambiar sus posiciones.
                  </p>
                  <p className="text-slate-300">
                    • <strong>Sustituir:</strong> Mantén presionado un jugador (o pulsa el botón ⇄) para elegir otro jugador del server que <strong>no está en el torneo</strong>.
                  </p>
                </div>
              )}

              {selectedPlayerToSwap && (
                <div className="p-2.5 rounded-xl bg-amber-500/20 border border-amber-500/40 text-xs text-amber-300 text-center animate-pulse">
                  Intercambiando a: <strong>{selectedPlayerToSwap.player.name}</strong>. Toca otro jugador para cambiarlo de sitio.
                </div>
              )}

              {/* Matches Bracket */}
              <div className="space-y-3">
                {tournament.matches
                  .filter((m) => m.round === tournament.currentRound)
                  .map((match, mIdx) => (
                    <div
                      key={match.id}
                      className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800/90 space-y-2.5"
                    >
                      <div className="flex items-center justify-between text-[11px] text-slate-400 border-b border-slate-800/60 pb-1.5">
                        <span className="font-bold text-white">Match #{mIdx + 1}</span>
                        {match.winnerTeamId && (
                          <span className="text-emerald-400 font-semibold">Resuelto</span>
                        )}
                      </div>

                      {/* Team A */}
                      <div
                        className={`p-2.5 rounded-xl border transition-all ${
                          match.winnerTeamId === match.teamA.id
                            ? 'bg-amber-500/10 border-amber-500/40'
                            : 'bg-slate-900/80 border-slate-800'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs font-bold text-white">{match.teamA.name}</span>
                          <span className="text-[10px] font-mono font-bold text-amber-400">
                            Poder: {match.teamA.totalPower}
                          </span>
                        </div>
                        <div className="grid grid-cols-3 gap-1.5">
                          {match.teamA.players.map((player, pIdx) => {
                            const isSelected = selectedPlayerToSwap?.player.id === player.id;
                            const div = getDivisionForElo(player.elo, ranks);

                            return (
                              <div key={`match_${match.id}_teamA_${player.id}_${pIdx}`} className="relative">
                                <button
                                  onClick={() => handlePlayerTouch(match.id, 'teamA', pIdx, player)}
                                  onTouchStart={() => handleTouchStart(match.id, 'teamA', pIdx, player)}
                                  onTouchEnd={handleTouchEnd}
                                  onMouseDown={() => handleTouchStart(match.id, 'teamA', pIdx, player)}
                                  onMouseUp={handleTouchEnd}
                                  onMouseLeave={handleTouchEnd}
                                  className={`w-full p-1.5 rounded-lg border text-center transition-all ${
                                    isSelected
                                      ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold shadow-md'
                                      : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-200'
                                  }`}
                                >
                                  <span className="text-[11px] font-bold block truncate">{player.name}</span>
                                  <div className="flex justify-center mt-1">
                                    <RankBadge rank={div} size="sm" divisionImages={divisionImages} />
                                  </div>
                                </button>
                                {isAdmin && !tournament.isCompleted && (
                                  <button
                                    title="Sustituir por jugador del server no presente en el torneo"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      sounds.playTap();
                                      setReplaceTarget({ matchId: match.id, teamKey: 'teamA', playerIndex: pIdx, current: player });
                                      setSubstituteSearch('');
                                      setSelectedPlayerToSwap(null);
                                    }}
                                    className="absolute -top-1 -right-1 bg-slate-900 border border-slate-700 hover:border-amber-400 text-slate-300 hover:text-amber-300 text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center shadow"
                                  >
                                    ⇄
                                  </button>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      <div className="text-center text-[10px] font-bold text-slate-500 tracking-wider">
                        VS
                      </div>

                      {/* Team B */}
                      <div
                        className={`p-2.5 rounded-xl border transition-all ${
                          match.winnerTeamId === match.teamB.id
                            ? 'bg-amber-500/10 border-amber-500/40'
                            : 'bg-slate-900/80 border-slate-800'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs font-bold text-white">{match.teamB.name}</span>
                          <span className="text-[10px] font-mono font-bold text-amber-400">
                            Poder: {match.teamB.totalPower}
                          </span>
                        </div>
                        <div className="grid grid-cols-3 gap-1.5">
                          {match.teamB.players.map((player, pIdx) => {
                            const isSelected = selectedPlayerToSwap?.player.id === player.id;
                            const div = getDivisionForElo(player.elo, ranks);

                            return (
                              <div key={`match_${match.id}_teamB_${player.id}_${pIdx}`} className="relative">
                                <button
                                  onClick={() => handlePlayerTouch(match.id, 'teamB', pIdx, player)}
                                  onTouchStart={() => handleTouchStart(match.id, 'teamB', pIdx, player)}
                                  onTouchEnd={handleTouchEnd}
                                  onMouseDown={() => handleTouchStart(match.id, 'teamB', pIdx, player)}
                                  onMouseUp={handleTouchEnd}
                                  onMouseLeave={handleTouchEnd}
                                  className={`w-full p-1.5 rounded-lg border text-center transition-all ${
                                    isSelected
                                      ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold shadow-md'
                                      : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-200'
                                  }`}
                                >
                                  <span className="text-[11px] font-bold block truncate">{player.name}</span>
                                  <div className="flex justify-center mt-1">
                                    <RankBadge rank={div} size="sm" divisionImages={divisionImages} />
                                  </div>
                                </button>
                                {isAdmin && !tournament.isCompleted && (
                                  <button
                                    title="Sustituir por jugador del server no presente en el torneo"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      sounds.playTap();
                                      setReplaceTarget({ matchId: match.id, teamKey: 'teamB', playerIndex: pIdx, current: player });
                                      setSubstituteSearch('');
                                      setSelectedPlayerToSwap(null);
                                    }}
                                    className="absolute -top-1 -right-1 bg-slate-900 border border-slate-700 hover:border-amber-400 text-slate-300 hover:text-amber-300 text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center shadow"
                                  >
                                    ⇄
                                  </button>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </>
          )}
        </div>

        {/* Modal for Long-Press Admin Substitution: ONLY PLAYERS NOT IN THE TOURNAMENT */}
        {replaceTarget && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md">
            <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-4 shadow-2xl flex flex-col max-h-[82vh]">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div>
                  <h4 className="text-sm font-bold text-white">Sustituir Jugador</h4>
                  <p className="text-[11px] text-amber-400">
                    Reemplazar a <strong>{replaceTarget.current.name}</strong>
                  </p>
                  <span className="text-[10px] text-slate-400 block mt-0.5">
                    Jugadores del server que <strong>no están en el torneo</strong>
                  </span>
                </div>
                <button
                  onClick={() => {
                    sounds.playTap();
                    setReplaceTarget(null);
                    setSubstituteSearch('');
                  }}
                  className="w-7 h-7 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300 font-bold transition-colors"
                >
                  ✕
                </button>
              </div>

              {/* Search Bar for Available Candidates */}
              <div className="pt-2.5 pb-2 border-b border-slate-800/60">
                <input
                  type="text"
                  value={substituteSearch}
                  onChange={(e) => setSubstituteSearch(e.target.value)}
                  placeholder="Buscar jugador disponible fuera del torneo..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
                <span className="text-[10px] text-slate-400 block mt-1">
                  {filteredCandidates.length} jugador(es) disponible(s) fuera del torneo
                </span>
              </div>

              {/* Candidates List */}
              <div className="overflow-y-auto space-y-1.5 p-1 flex-1 mt-2">
                {filteredCandidates.length === 0 ? (
                  <div className="text-center py-8 text-xs text-slate-400">
                    No se encontraron jugadores disponibles fuera del torneo.
                  </div>
                ) : (
                  filteredCandidates.map((cand, idx) => {
                    const cDiv = getDivisionForElo(cand.elo, ranks);
                    return (
                      <button
                        key={`cand_${cand.id}_${idx}`}
                        onClick={() => handleSubstitutePlayer(cand)}
                        className="w-full p-2 rounded-xl bg-slate-950/70 border border-slate-800/80 hover:border-amber-500/60 hover:bg-slate-800/70 flex items-center justify-between text-left text-xs transition-colors"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="font-mono text-slate-500 w-5 shrink-0">#{idx + 1}</span>
                          <RankBadge rank={cDiv} size="sm" divisionImages={divisionImages} />
                          <div className="min-w-0">
                            <span className="font-bold text-white block truncate">{cand.name}</span>
                          </div>
                        </div>
                        <span className="font-mono text-amber-400 font-semibold shrink-0 ml-2">{cand.elo} pts</span>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
