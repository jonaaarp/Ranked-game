import React, { useState, useEffect, useMemo } from 'react';
import { 
  Player, RankTier, BonusCategory, MatchResult 
} from './types/ranked';
import { 
  DEFAULT_RANKS, DEFAULT_CATEGORIES, generate100Bots, 
  getDivisionForElo, getNextDivision, getRankTierIndex, 
  calculateTeamPower, calculateResetRank, syncPlayerRecordRank 
} from './utils/rankedDefaults';
import { 
  getDivisionImageUrl, 
  getDefaultDivisionImages 
} from './utils/rankImages';
import { sounds } from './utils/audio';
import { RankBadge } from './components/RankBadge';
import { UsernameModal } from './components/UsernameModal';
import { ProfileModal } from './components/ProfileModal';
import { FriendsModal } from './components/FriendsModal';
import { TopModal } from './components/TopModal';
import { RankInfoModal } from './components/RankInfoModal';
import { MatchmakingModal } from './components/MatchmakingModal';
import { TournamentView } from './components/TournamentView';
import { AdminPanelModal } from './components/AdminPanelModal';

const arenaBanner = '/src/assets/images/ranked_arena_banner_1790529009478.jpg';

function deduplicatePlayers(players: Player[]): Player[] {
  const seen = new Set<string>();
  const list: Player[] = [];
  for (const p of players) {
    if (p && p.id && !seen.has(p.id)) {
      seen.add(p.id);
      list.push(p);
    }
  }
  return list;
}

export default function App() {
  const USER_KEY = 'ranked_arena_user_v2';
  const BOTS_KEY = 'ranked_arena_bots_v2';
  const RANKS_KEY = 'ranked_arena_ranks_v2';
  const CATS_KEY = 'ranked_arena_categories_v2';
  const DIVISION_IMAGES_KEY = 'ranked_arena_division_images_v2';

  // State: Ranks and Categories
  const [ranks, setRanks] = useState<RankTier[]>(() => {
    const saved = localStorage.getItem(RANKS_KEY);
    return saved ? JSON.parse(saved) : DEFAULT_RANKS;
  });

  const [categories, setCategories] = useState<BonusCategory[]>(() => {
    const saved = localStorage.getItem(CATS_KEY);
    return saved ? JSON.parse(saved) : DEFAULT_CATEGORIES;
  });

  // State: Division Images URLs
  const [divisionImages, setDivisionImages] = useState<Record<string, string>>(() => {
    const saved = localStorage.getItem(DIVISION_IMAGES_KEY);
    return saved ? JSON.parse(saved) : getDefaultDivisionImages();
  });

  // State: User (sanitized with syncPlayerRecordRank)
  const [currentUser, setCurrentUser] = useState<Player>(() => {
    const saved = localStorage.getItem(USER_KEY);
    const initialRank = 'Bronce I';
    const baseUser: Player = saved
      ? JSON.parse(saved)
      : {
          id: 'user_player',
          name: '',
          avatar: '',
          isUser: true,
          elo: 0,
          recordElo: 0,
          recordRank: initialRank,
          currentRank: initialRank,
          teamRecordRank: initialRank,
          wins: 0,
          losses: 0,
          streak: 0,
          personality: 'sociable',
          status: 'disponible',
          heartsWithUser: 5,
          friendIds: [],
        };
    return syncPlayerRecordRank(baseUser, DEFAULT_RANKS);
  });

  // State: Server Bots (persisted and sanitized with syncPlayerRecordRank)
  const [bots, setBots] = useState<Player[]>(() => {
    try {
      const saved = localStorage.getItem(BOTS_KEY);
      const rawBots: Player[] = saved ? JSON.parse(saved) : generate100Bots();
      const uniqueBots = deduplicatePlayers(rawBots);
      return uniqueBots.map((b) => syncPlayerRecordRank(b, DEFAULT_RANKS));
    } catch {
      return deduplicatePlayers(generate100Bots()).map((b) => syncPlayerRecordRank(b, DEFAULT_RANKS));
    }
  });

  // State: Modals & Overlays
  const [isUsernameModalOpen, setIsUsernameModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [inspectingPlayer, setInspectingPlayer] = useState<Player | null>(null);
  const [isFriendsModalOpen, setIsFriendsModalOpen] = useState(false);
  const [isTopModalOpen, setIsTopModalOpen] = useState(false);
  const [isRankInfoModalOpen, setIsRankInfoModalOpen] = useState(false);
  const [isMatchmakingOpen, setIsMatchmakingOpen] = useState(false);
  const [isTournamentOpen, setIsTournamentOpen] = useState(false);
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);
  const [editingAdminPlayer, setEditingAdminPlayer] = useState<Player | null>(null);

  // Sound and Admin Modes
  const [isMuted, setIsMuted] = useState(false);
  const [isAdmin, setIsAdmin] = useState(true); // Admin by default

  // Auto-Play State
  const [isAutoPlayActive, setIsAutoPlayActive] = useState(false);
  const [autoMatchesCount, setAutoMatchesCount] = useState(0);
  const [recentLiveEvents, setRecentLiveEvents] = useState<string[]>([]);

  // Prompt username if empty
  useEffect(() => {
    if (!currentUser.name || currentUser.name.trim() === '') {
      setIsUsernameModalOpen(true);
    }
  }, [currentUser.name]);

  useEffect(() => {
    sounds.enabled = !isMuted;
  }, [isMuted]);

  useEffect(() => {
    localStorage.setItem(USER_KEY, JSON.stringify(currentUser));
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem(BOTS_KEY, JSON.stringify(bots));
  }, [bots]);

  useEffect(() => {
    localStorage.setItem(RANKS_KEY, JSON.stringify(ranks));
  }, [ranks]);

  useEffect(() => {
    localStorage.setItem(CATS_KEY, JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    localStorage.setItem(DIVISION_IMAGES_KEY, JSON.stringify(divisionImages));
  }, [divisionImages]);

  const allPlayers = useMemo(() => {
    return deduplicatePlayers([currentUser, ...bots.filter((b) => b.id !== currentUser.id)]);
  }, [currentUser, bots]);

  const sortedPlayers = useMemo(() => {
    return [...allPlayers].sort((a, b) => b.elo - a.elo);
  }, [allPlayers]);

  const userRankPosition = sortedPlayers.findIndex((p) => p.id === currentUser.id) + 1;

  const currentDiv = getDivisionForElo(currentUser.elo, ranks);
  const { nextDiv, progress } = getNextDivision(currentUser.elo, ranks);
  
  const userFriends = useMemo(() => {
    const friendSet = new Set(currentUser.friendIds);
    return deduplicatePlayers(bots.filter((b) => friendSet.has(b.id)));
  }, [currentUser.friendIds, bots]);

  // Handler: Set username
  const handleSaveUsername = (name: string) => {
    setCurrentUser((prev) => ({
      ...prev,
      name,
      avatar: '',
    }));
    setIsUsernameModalOpen(false);
  };

  // Handler: Friend management
  const handleSendFriendRequest = (player: Player) => {
    if (currentUser.friendIds.includes(player.id)) return;
    sounds.playTap();
    setCurrentUser((prev) => ({
      ...prev,
      friendIds: Array.from(new Set([...prev.friendIds, player.id])),
    }));
    setBots((prev) =>
      prev.map((b) =>
        b.id === player.id
          ? {
              ...b,
              heartsWithUser: Math.min(5, b.heartsWithUser + 1),
            }
          : b
      )
    );
  };

  const handleRemoveFriend = (playerId: string) => {
    sounds.playTap();
    setCurrentUser((prev) => ({
      ...prev,
      friendIds: prev.friendIds.filter((id) => id !== playerId),
    }));
  };

  // Admin creates new bot
  const handleCreateBot = (newBot: Player) => {
    setBots((prev) => [newBot, ...prev.filter((b) => b.id !== newBot.id)]);
    setRecentLiveEvents((prev) => [
      `¡Nuevo bot creado: ${newBot.name} (${newBot.currentRank})!`,
      ...prev.slice(0, 4),
    ]);
  };

  // Admin directly updates player / bot name from profile
  const handleUpdatePlayerName = (playerId: string, newName: string) => {
    if (currentUser.id === playerId) {
      setCurrentUser((prev) => syncPlayerRecordRank({ ...prev, name: newName }, ranks));
      if (inspectingPlayer?.id === playerId) {
        setInspectingPlayer((prev) => (prev ? syncPlayerRecordRank({ ...prev, name: newName }, ranks) : null));
      }
      return;
    }

    setBots((prev) =>
      prev.map((b) => (b.id === playerId ? syncPlayerRecordRank({ ...b, name: newName }, ranks) : b))
    );
    if (inspectingPlayer?.id === playerId) {
      setInspectingPlayer((prev) => (prev ? syncPlayerRecordRank({ ...prev, name: newName }, ranks) : null));
    }
  };

  // Admin directly grants / changes multiple categories from profile
  const handleUpdatePlayerCategories = (playerId: string, categoryIds: string[]) => {
    const primaryCategoryId = categoryIds[0] || undefined;
    if (currentUser.id === playerId) {
      setCurrentUser((prev) => ({
        ...prev,
        categoryIds,
        categoryId: primaryCategoryId,
      }));
      if (inspectingPlayer?.id === playerId) {
        setInspectingPlayer((prev) =>
          prev
            ? {
                ...prev,
                categoryIds,
                categoryId: primaryCategoryId,
              }
            : null
        );
      }
      return;
    }

    setBots((prev) =>
      prev.map((b) =>
        b.id === playerId
          ? {
              ...b,
              categoryIds,
              categoryId: primaryCategoryId,
            }
          : b
      )
    );
    if (inspectingPlayer?.id === playerId) {
      setInspectingPlayer((prev) =>
        prev
          ? {
              ...prev,
              categoryIds,
              categoryId: primaryCategoryId,
            }
          : null
      );
    }
  };

  // Admin directly grants / changes category from profile (legacy compatibility)
  const handleAssignCategory = (playerId: string, categoryId: string | undefined) => {
    handleUpdatePlayerCategories(playerId, categoryId ? [categoryId] : []);
  };

  // Complete User Match with guaranteed sync:
  // "El rango record debe de acompañar al rango actual si es que el rango actual es mayor que el rango record."
  const handleCompleteMatch = (result: MatchResult) => {
    const oldElo = currentUser.elo;
    const newElo = Math.max(0, oldElo + result.userEloChange);
    const newDiv = getDivisionForElo(newElo, ranks);
    const isWin = result.winner === 'user';

    const oldDivIndex = currentDiv.divisionGlobalIndex;
    const newDivIndex = newDiv.divisionGlobalIndex;

    if (newDivIndex > oldDivIndex) {
      sounds.playRankUp();
    }

    setCurrentUser((prev) => {
      const raw = {
        ...prev,
        elo: newElo,
        wins: isWin ? prev.wins + 1 : prev.wins,
        losses: !isWin ? prev.losses + 1 : prev.losses,
        streak: isWin ? prev.streak + 1 : 0,
      };
      return syncPlayerRecordRank(raw, ranks);
    });

    const allyIds = result.userTeam.filter((p) => !p.isUser).map((p) => p.id);
    const rivalIds = result.rivalTeam.map((p) => p.id);

    setBots((prevBots) =>
      prevBots.map((bot) => {
        if (allyIds.includes(bot.id)) {
          const delta = result.alliesEloChange;
          const bElo = Math.max(0, bot.elo + delta);
          const heartChange = result.heartsChanges.find((hc) => hc.playerId === bot.id);
          const raw = {
            ...bot,
            elo: bElo,
            wins: isWin ? bot.wins + 1 : bot.wins,
            losses: !isWin ? bot.losses + 1 : bot.losses,
            heartsWithUser: heartChange ? heartChange.newTotal : bot.heartsWithUser,
          };
          return syncPlayerRecordRank(raw, ranks);
        }

        if (rivalIds.includes(bot.id)) {
          const delta = result.rivalsEloChange;
          const bElo = Math.max(0, bot.elo + delta);
          const heartChange = result.heartsChanges.find((hc) => hc.playerId === bot.id);
          const raw = {
            ...bot,
            elo: bElo,
            wins: !isWin ? bot.wins + 1 : bot.wins,
            losses: isWin ? bot.losses + 1 : bot.losses,
            heartsWithUser: heartChange ? heartChange.newTotal : bot.heartsWithUser,
          };
          return syncPlayerRecordRank(raw, ranks);
        }

        return bot;
      })
    );
  };

  // Reset de Rangos (-2 rangos completos / 6 divisiones)
  const handleExecuteRankReset = () => {
    // 1. Reset user
    const userReset = calculateResetRank(currentUser, ranks);
    setCurrentUser((prev) => ({
      ...prev,
      elo: userReset.newElo,
      currentRank: userReset.newDivision.fullName,
    }));

    // 2. Reset all bots
    setBots((prevBots) =>
      prevBots.map((bot) => {
        const botReset = calculateResetRank(bot, ranks);
        return {
          ...bot,
          elo: botReset.newElo,
          currentRank: botReset.newDivision.fullName,
        };
      })
    );

    setRecentLiveEvents([
      '¡Reset oficial de rangos ejecutado! Todos los jugadores descendieron 2 rangos completos (6 divisiones).',
    ]);
  };

  // Hard Reset All to 0
  const handleResetAllBots = () => {
    const initialRank = 'Bronce I';
    const freshBots = deduplicatePlayers(generate100Bots()).map((b) => ({
      ...b,
      avatar: '',
      elo: 0,
      recordElo: 0,
      currentRank: initialRank,
      recordRank: initialRank,
      teamRecordRank: initialRank,
      wins: 0,
      losses: 0,
      streak: 0,
      heartsWithUser: 0,
      friendIds: [],
    }));

    setBots(freshBots);
    setCurrentUser((prev) => ({
      ...prev,
      elo: 0,
      recordElo: 0,
      currentRank: initialRank,
      recordRank: initialRank,
      teamRecordRank: initialRank,
      wins: 0,
      losses: 0,
      streak: 0,
      friendIds: [],
    }));
    setAutoMatchesCount(0);
    setRecentLiveEvents(['Todos los bots y el jugador se han reiniciado a 0 Elo (Bronce I).']);
  };

  // Auto-Play: Runs every 2 seconds
  useEffect(() => {
    if (!isAutoPlayActive) return;

    const interval = setInterval(() => {
      const now = Date.now();

      setBots((prevBots) => {
        const updatedBots = prevBots.map((b) => {
          if (b.restUntil && now >= b.restUntil) {
            return {
              ...b,
              restUntil: undefined,
              status: 'disponible' as const,
            };
          }
          return b;
        });

        const availableBots = updatedBots.filter((b) => !b.restUntil);
        const botsToRestCount = Math.floor(Math.random() * 4) + 6;

        for (let i = 0; i < botsToRestCount && availableBots.length > 12; i++) {
          const randomIndex = Math.floor(Math.random() * availableBots.length);
          const chosen = availableBots[randomIndex];
          if (chosen) {
            const restDuration = (Math.floor(Math.random() * 5) + 5) * 1000;
            chosen.restUntil = now + restDuration;
            chosen.status = 'no_disponible';
          }
        }

        const activeCombatants = updatedBots.filter((b) => !b.restUntil);
        const shuffled = [...activeCombatants].sort(() => Math.random() - 0.5);

        const newEvents: string[] = [];
        let matchBatchCount = 0;
        const matchedBotIds = new Set<string>();

        for (let i = 0; i < shuffled.length; i++) {
          const lead = shuffled[i];
          if (matchedBotIds.has(lead.id)) continue;

          const leadDiv = getDivisionForElo(lead.elo, ranks);
          const leadTierIdx = getRankTierIndex(leadDiv.tierName, ranks);

          const peers = shuffled.filter(
            (p) =>
              p.id !== lead.id &&
              !matchedBotIds.has(p.id) &&
              Math.abs(getRankTierIndex(getDivisionForElo(p.elo, ranks).tierName, ranks) - leadTierIdx) <= 2
          );

          if (peers.length >= 5) {
            const teamA = [lead, peers[0], peers[1]];
            const teamB = [peers[2], peers[3], peers[4]];

            [lead, ...peers.slice(0, 5)].forEach((b) => matchedBotIds.add(b.id));

            const powerA = calculateTeamPower(teamA, categories);
            const powerB = calculateTeamPower(teamB, categories);

            const oddsA = powerA / (powerA + powerB);
            const roll = Math.random();
            const teamAWins = roll < oddsA;

            teamA.forEach((bot) => {
              const bDiv = getDivisionForElo(bot.elo, ranks);
              const change = teamAWins ? bDiv.winElo : -bDiv.lossElo;
              const newElo = Math.max(0, bot.elo + change);
              bot.elo = newElo;
              // Sync record with current if current > record
              const synced = syncPlayerRecordRank(bot, ranks);
              bot.currentRank = synced.currentRank;
              bot.recordRank = synced.recordRank;
              bot.recordElo = synced.recordElo;
              bot.teamRecordRank = synced.teamRecordRank;
              if (teamAWins) {
                bot.wins += 1;
                bot.status = 'en_equipo';
                bot.currentTeamMembers = teamA.filter((p) => p.id !== bot.id).map((p) => p.name);
              } else {
                bot.losses += 1;
                bot.status = 'disponible';
                bot.currentTeamMembers = undefined;
              }
            });

            teamB.forEach((bot) => {
              const bDiv = getDivisionForElo(bot.elo, ranks);
              const change = !teamAWins ? bDiv.winElo : -bDiv.lossElo;
              const newElo = Math.max(0, bot.elo + change);
              bot.elo = newElo;
              // Sync record with current if current > record
              const synced = syncPlayerRecordRank(bot, ranks);
              bot.currentRank = synced.currentRank;
              bot.recordRank = synced.recordRank;
              bot.recordElo = synced.recordElo;
              bot.teamRecordRank = synced.teamRecordRank;
              if (!teamAWins) {
                bot.wins += 1;
                bot.status = 'en_equipo';
                bot.currentTeamMembers = teamB.filter((p) => p.id !== bot.id).map((p) => p.name);
              } else {
                bot.losses += 1;
                bot.status = 'disponible';
                bot.currentTeamMembers = undefined;
              }
            });

            matchBatchCount++;
            if (newEvents.length < 2) {
              newEvents.push(
                `${teamAWins ? teamA[0].name : teamB[0].name} ganó su match 3v3 (+${leadDiv.winElo} pts)`
              );
            }
          }
        }

        if (newEvents.length > 0) {
          setRecentLiveEvents((prev) => [...newEvents, ...prev].slice(0, 5));
        }

        setAutoMatchesCount((c) => c + matchBatchCount);
        return [...updatedBots];
      });
    }, 2000);

    return () => clearInterval(interval);
  }, [isAutoPlayActive, ranks, categories]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex justify-center selection:bg-amber-500/30 selection:text-amber-200">
      <div className="w-full max-w-md min-h-screen flex flex-col bg-slate-950 relative border-x border-slate-900 shadow-2xl pb-16">
        
        {/* Sticky Mobile Top App Bar */}
        <header className="sticky top-0 z-30 h-14 bg-slate-950/90 backdrop-blur-md border-b border-slate-800/80 px-4 flex items-center justify-between">
          <span className="font-extrabold text-sm tracking-wider uppercase text-amber-400">
            Ranked Arena
          </span>

          <div className="flex items-center gap-2">
            {isAutoPlayActive && (
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-[10px] text-emerald-400 font-semibold">
                Auto 2s
              </span>
            )}

            <button
              onClick={() => {
                setIsMuted(!isMuted);
                sounds.playTap();
              }}
              className="px-2 py-1 rounded-lg bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-300 hover:text-white"
            >
              {isMuted ? 'Mute' : 'Audio'}
            </button>

            <button
              onClick={() => {
                sounds.playTap();
                setIsAdminPanelOpen(true);
              }}
              className="px-2.5 py-1 rounded-lg bg-purple-950/60 border border-purple-700/60 text-purple-300 font-bold text-xs hover:bg-purple-900/60 transition-colors"
            >
              Admin
            </button>
          </div>
        </header>

        {/* Scrollable Main View */}
        <main className="flex-1 p-4 space-y-4 overflow-y-auto">
          {/* Header Card */}
          <div className="relative rounded-3xl overflow-hidden border border-slate-800 shadow-xl bg-slate-900">
            <div className="h-32 w-full relative overflow-hidden bg-slate-950">
              <img
                src={arenaBanner}
                alt="Ranked Arena"
                className="w-full h-full object-cover opacity-40"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent" />
              
              <div className="absolute top-3 right-3">
                <span className="px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-[11px] font-mono font-bold text-amber-400">
                  TOP #{userRankPosition}
                </span>
              </div>
            </div>

            {/* User Profile Overview: No photos, only name and official Rank division image from URL */}
            <div className="px-4 pb-4 -mt-10 relative z-10">
              <div className="flex items-end justify-between mb-3">
                <div className="flex items-end gap-3">
                  {/* Division Rank Image (From URL) */}
                  <div className="relative shrink-0">
                    <div
                      className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-slate-950 border-2 p-2 shadow-2xl flex items-center justify-center -mt-4 transition-transform hover:scale-105"
                      style={{ borderColor: currentDiv.color }}
                    >
                      <img
                        src={getDivisionImageUrl(currentDiv.fullName, divisionImages)}
                        alt={currentDiv.fullName}
                        className="w-full h-full object-contain drop-shadow-md"
                      />
                    </div>
                    <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-slate-900 bg-emerald-500" />
                  </div>

                  <div>
                    <h2 className="text-base font-extrabold text-white tracking-tight leading-tight">
                      {currentUser.name || 'Sin Nombre'}
                    </h2>
                    <div className="flex items-center gap-2 mt-1">
                      <RankBadge rank={currentDiv} size="md" divisionImages={divisionImages} />
                      <span className="text-xs font-mono font-bold text-amber-400 tabular-nums">
                        {currentUser.elo.toLocaleString()} pts
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block">Récord</span>
                  <span className="text-xs font-mono font-bold text-slate-200">
                    {currentUser.recordElo.toLocaleString()} pts
                  </span>
                </div>
              </div>

              {/* Progress Bar to Next Division */}
              <div className="bg-slate-950/80 rounded-2xl p-3 border border-slate-800/80 space-y-1.5">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-400 font-medium">
                    Progreso a {nextDiv ? nextDiv.fullName : 'Rango Máximo'}
                  </span>
                  <span className="font-mono font-bold text-amber-400">
                    {progress}%
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-900 overflow-hidden p-0.5 border border-slate-800">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${progress}%`,
                      backgroundColor: currentDiv.color,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            {/* ROW 1: [ PERFIL ] and [ AMISTAD ] */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => {
                  sounds.playTap();
                  setInspectingPlayer(currentUser);
                  setIsProfileModalOpen(true);
                }}
                className="h-20 p-3.5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 flex flex-col justify-between text-left shadow-lg active:scale-[0.98] transition-all"
              >
                <span className="text-[10px] font-mono text-slate-500">Mi Perfil</span>
                <div>
                  <span className="text-sm font-bold text-white block leading-tight">
                    Perfil
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Récords y estadísticas
                  </span>
                </div>
              </button>

              <button
                onClick={() => {
                  sounds.playTap();
                  setIsFriendsModalOpen(true);
                }}
                className="h-20 p-3.5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 flex flex-col justify-between text-left shadow-lg active:scale-[0.98] transition-all"
              >
                <div className="flex justify-end">
                  <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 font-mono font-bold text-[10px]">
                    {userFriends.length} Amigos
                  </span>
                </div>
                <div>
                  <span className="text-sm font-bold text-white block leading-tight">
                    Amistad
                  </span>
                  <span className="text-[11px] text-slate-400">
                    🟢 Disp. 🟡 Equipo 🔴 No
                  </span>
                </div>
              </button>
            </div>

            {/* ROW 2: [ TORNEO ] and [ TOP RANKING ] */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => {
                  sounds.playTap();
                  setIsTournamentOpen(true);
                }}
                className="h-16 p-3 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 flex flex-col justify-center text-left shadow-md active:scale-[0.98] transition-all"
              >
                <span className="text-xs font-bold text-white block truncate">
                  Torneo 3v3
                </span>
                <span className="text-[10px] text-slate-400 block truncate">
                  8–16 Equipos
                </span>
              </button>

              <button
                onClick={() => {
                  sounds.playTap();
                  setIsTopModalOpen(true);
                }}
                className="h-16 p-3 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 flex flex-col justify-center text-left shadow-md active:scale-[0.98] transition-all"
              >
                <span className="text-xs font-bold text-white block truncate">
                  Top Ranking
                </span>
                <span className="text-[10px] text-slate-400 block truncate">
                  En tiempo real
                </span>
              </button>
            </div>

            {/* ROW 3: [ JUGAR ] and [ INFORMATIVO RANKED ] */}
            <div className="grid grid-cols-4 gap-2.5 pt-1">
              <button
                onClick={() => {
                  sounds.playTap();
                  setIsMatchmakingOpen(true);
                }}
                className="col-span-3 h-14 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm uppercase tracking-wider rounded-2xl shadow-xl flex items-center justify-center active:scale-[0.98] transition-all"
              >
                Jugar Ranked 3v3
              </button>

              <button
                onClick={() => {
                  sounds.playTap();
                  setIsRankInfoModalOpen(true);
                }}
                className="col-span-1 h-14 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-2xl flex flex-col items-center justify-center text-slate-300 hover:text-white transition-all shadow-md active:scale-95"
              >
                <span className="text-xs font-bold">Info</span>
                <span className="text-[9px] text-slate-400">Reglas</span>
              </button>
            </div>

            {/* ROW 4: PLAY AUTOMÁTICO (CADA 2 SEGUNDOS) */}
            <div className="pt-2">
              <button
                onClick={() => {
                  sounds.playTap();
                  setIsAutoPlayActive(!isAutoPlayActive);
                }}
                className={`w-full p-3.5 rounded-2xl border flex items-center justify-between transition-all ${
                  isAutoPlayActive
                    ? 'bg-emerald-950/30 border-emerald-500/50 shadow-lg'
                    : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="text-left">
                  <span className="text-xs font-bold text-white block">
                    {isAutoPlayActive ? 'Play Automático Activado' : 'Play Automático'}
                  </span>
                  <span className="text-[11px] text-slate-400 block">
                    Partidas de bots cada 2s · Descansos 5-9s
                  </span>
                </div>

                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block">Simuladas</span>
                  <span className="text-xs font-mono font-bold text-amber-400 tabular-nums">
                    {autoMatchesCount}
                  </span>
                </div>
              </button>
            </div>
          </div>

          {/* Live Activity Feed */}
          {recentLiveEvents.length > 0 && (
            <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Actividad Reciente del Servidor
              </span>
              <div className="space-y-1">
                {recentLiveEvents.map((ev, i) => (
                  <p key={i} className="text-xs text-slate-300 truncate">
                    • {ev}
                  </p>
                ))}
              </div>
            </div>
          )}

          {/* Ranks breakdown cards */}
          <div className="pt-2">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Escala de Rangos
              </span>
              <button
                onClick={() => setIsRankInfoModalOpen(true)}
                className="text-[11px] text-amber-400 hover:underline font-semibold"
              >
                Ver divisiones
              </button>
            </div>

            <div className="grid grid-cols-4 gap-1.5">
              {ranks.slice(0, 4).map((r) => (
                <div
                  key={r.id}
                  className="p-2 rounded-xl bg-slate-900/60 border border-slate-800/80 text-center"
                >
                  <span
                    className="block font-bold text-[11px] truncate mb-0.5"
                    style={{ color: r.color }}
                  >
                    {r.name}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono block">
                    {r.minElo}+ pts
                  </span>
                </div>
              ))}
            </div>
          </div>
        </main>

        {/* ----------------- MODALS ----------------- */}
        <UsernameModal
          isOpen={isUsernameModalOpen}
          onSave={handleSaveUsername}
        />

        {/* Profile Modal has z-[100] */}
        <ProfileModal
          isOpen={isProfileModalOpen}
          onClose={() => setIsProfileModalOpen(false)}
          player={inspectingPlayer}
          currentUser={currentUser}
          ranks={ranks}
          categories={categories}
          isAdmin={isAdmin}
          onSendFriendRequest={handleSendFriendRequest}
          onRemoveFriend={handleRemoveFriend}
          onAssignCategory={handleAssignCategory}
          onUpdatePlayerName={handleUpdatePlayerName}
          onUpdatePlayerCategories={handleUpdatePlayerCategories}
          onOpenAdminEdit={(p) => {
            setIsProfileModalOpen(false);
            setEditingAdminPlayer(p);
            setIsAdminPanelOpen(true);
          }}
          userRankPosition={userRankPosition}
          divisionImages={divisionImages}
        />

        <FriendsModal
          isOpen={isFriendsModalOpen}
          onClose={() => setIsFriendsModalOpen(false)}
          friends={userFriends}
          allPlayers={allPlayers}
          ranks={ranks}
          onSelectPlayer={(p) => {
            setInspectingPlayer(p);
            setIsProfileModalOpen(true);
          }}
          onRemoveFriend={handleRemoveFriend}
          onOpenTop={() => setIsTopModalOpen(true)}
          onInviteToTeam={() => {
            setIsFriendsModalOpen(false);
            setIsMatchmakingOpen(true);
          }}
          divisionImages={divisionImages}
        />

        <TopModal
          isOpen={isTopModalOpen}
          onClose={() => setIsTopModalOpen(false)}
          allPlayers={allPlayers}
          ranks={ranks}
          onSelectPlayer={(p) => {
            setInspectingPlayer(p);
            setIsProfileModalOpen(true);
          }}
          currentUserId={currentUser.id}
          divisionImages={divisionImages}
        />

        <RankInfoModal
          isOpen={isRankInfoModalOpen}
          onClose={() => setIsRankInfoModalOpen(false)}
          ranks={ranks}
          categories={categories}
          isAdmin={isAdmin}
          onOpenAdminRanks={() => setIsAdminPanelOpen(true)}
        />

        <MatchmakingModal
          isOpen={isMatchmakingOpen}
          onClose={() => setIsMatchmakingOpen(false)}
          currentUser={currentUser}
          allPlayers={allPlayers}
          ranks={ranks}
          categories={categories}
          onCompleteMatch={handleCompleteMatch}
          onSelectPlayer={(p) => {
            setInspectingPlayer(p);
            setIsProfileModalOpen(true);
          }}
          userRankPosition={userRankPosition}
          divisionImages={divisionImages}
        />

        {isTournamentOpen && (
          <TournamentView
            allPlayers={allPlayers}
            currentUser={currentUser}
            ranks={ranks}
            categories={categories}
            isAdmin={isAdmin}
            onClose={() => setIsTournamentOpen(false)}
            onSelectPlayer={(p) => {
              setInspectingPlayer(p);
              setIsProfileModalOpen(true);
            }}
            divisionImages={divisionImages}
          />
        )}

        {isAdminPanelOpen && (
          <AdminPanelModal
            isOpen={isAdminPanelOpen}
            onClose={() => {
              setIsAdminPanelOpen(false);
              setEditingAdminPlayer(null);
            }}
            ranks={ranks}
            onUpdateRanks={(updated) => setRanks(updated)}
            categories={categories}
            onUpdateCategories={(updated) => setCategories(updated)}
            allPlayers={allPlayers}
            onUpdatePlayer={(updatedPlayer) => {
              const synced = syncPlayerRecordRank(updatedPlayer, ranks);
              if (synced.isUser) {
                setCurrentUser(synced);
              } else {
                setBots((prev) =>
                  prev.map((b) => (b.id === synced.id ? synced : b))
                );
              }
            }}
            onCreateBot={handleCreateBot}
            divisionImages={divisionImages}
            onUpdateDivisionImages={(imgs) => setDivisionImages(imgs)}
            onResetAllBots={handleResetAllBots}
            onExecuteRankReset={handleExecuteRankReset}
            editingPlayerInitial={editingAdminPlayer}
          />
        )}
      </div>
    </div>
  );
}
