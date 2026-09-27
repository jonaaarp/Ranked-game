import React from 'react';
import { RankTier, BonusCategory } from '../types/ranked';
import { RankBadge } from './RankBadge';
import { getAllDivisions } from '../utils/rankedDefaults';
import { sounds } from '../utils/audio';

interface RankInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  ranks: RankTier[];
  categories: BonusCategory[];
  isAdmin: boolean;
  onOpenAdminRanks?: () => void;
}

export const RankInfoModal: React.FC<RankInfoModalProps> = ({
  isOpen,
  onClose,
  ranks,
  categories,
  isAdmin,
  onOpenAdminRanks,
}) => {
  if (!isOpen) return null;

  const allDivs = getAllDivisions(ranks);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[88vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-white tracking-tight">
              Reglamento de Ranked y Divisiones
            </h3>
            <p className="text-[11px] text-slate-400">
              Rangos oficiales, divisiones I, II, III y matchmaking 3v3
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

        {/* Scrollable Information Body */}
        <div className="p-4 overflow-y-auto space-y-4 flex-1 text-xs text-slate-300">
          {/* Matchmaking Section */}
          <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800">
            <span className="font-bold text-amber-400 block mb-1">
              Matchmaking Dinámico (±2 Rangos)
            </span>
            <p className="text-slate-400 leading-relaxed">
              El sistema busca rivales equilibrados que se encuentren 2 rangos por encima o 2 rangos por abajo de tu rango actual.
            </p>
          </div>

          {/* 3v3 Team Power & Admin Bonus */}
          <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800">
            <span className="font-bold text-purple-400 block mb-1">
              Evaluación 3v3 y Categorías de Bonus
            </span>
            <p className="text-slate-400 leading-relaxed mb-2">
              Se evalúa el Elo total del equipo. El administrador puede otorgar categorías desde el perfil de cada jugador otorgando un bonus % de aumento de elo en equipo.
            </p>
            <div className="grid grid-cols-2 gap-1.5 pt-1">
              {categories.map((c) => (
                <div key={c.id} className="p-2 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between">
                  <span className="font-medium text-[11px] text-slate-200 truncate">{c.name}</span>
                  <span className="font-mono font-bold text-amber-400 shrink-0">+{c.bonusPercent}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* Reset Information */}
          <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800">
            <span className="font-bold text-rose-400 block mb-1">
              Sistema de Reset de Rangos
            </span>
            <p className="text-slate-400 leading-relaxed">
              El administrador puede ejecutar un Reset de Rangos cuando lo decida. Cada jugador baja exactamente 2 rangos completos (6 divisiones). Por ejemplo, Legendario II desciende a Diamante II, recalculando su Elo automáticamente.
            </p>
          </div>

          {/* Ranks & Divisions Breakdown */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-bold text-white text-xs uppercase tracking-wider">
                Estructura de Rangos y Divisiones
              </h4>
              {isAdmin && onOpenAdminRanks && (
                <button
                  onClick={() => {
                    sounds.playTap();
                    onClose();
                    onOpenAdminRanks();
                  }}
                  className="text-[11px] text-purple-400 hover:text-purple-300 font-semibold"
                >
                  Configurar Rangos
                </button>
              )}
            </div>

            <div className="space-y-2">
              {ranks.map((tier) => (
                <div
                  key={tier.id}
                  className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800/80 space-y-1.5"
                  style={{ borderLeftColor: tier.color, borderLeftWidth: '4px' }}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm" style={{ color: tier.color }}>
                      {tier.name}
                    </span>
                    <span className="text-[11px] font-mono text-slate-400">
                      {tier.minElo.toLocaleString()} {tier.maxElo < 900000 ? `– ${tier.maxElo.toLocaleString()}` : '+'} Elo
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">
                      {tier.hasDivisions ? 'Divisiones: I, II y III' : 'Sin divisiones (Único)'}
                    </span>
                    <div className="font-mono text-[10px]">
                      <span className="text-emerald-400">+{tier.winElo}W</span>
                      <span className="text-slate-500 mx-1">/</span>
                      <span className="text-rose-400">-{tier.lossElo}L</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3.5 border-t border-slate-800 bg-slate-950/90 text-center">
          <button
            onClick={() => {
              sounds.playTap();
              onClose();
            }}
            className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-xs transition-colors"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};
