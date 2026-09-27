import React, { useState } from 'react';
import { sounds } from '../utils/audio';

interface UsernameModalProps {
  isOpen: boolean;
  onSave: (username: string) => void;
}

export const UsernameModal: React.FC<UsernameModalProps> = ({ isOpen, onSave }) => {
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = username.trim();
    if (!clean) {
      setError('Ingresa un nombre para competir');
      return;
    }
    if (clean.length < 3) {
      setError('El nombre debe tener al menos 3 caracteres');
      return;
    }
    sounds.playVictory();
    onSave(clean);
  };

  const suggestions = ['NovaBlade', 'CyberValk', 'ApexStriker', 'ShadowRift', 'QuantumAce'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl text-center">
        <div className="inline-block px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold tracking-wider uppercase mb-3">
          Registro de Jugador
        </div>

        <h2 className="text-xl font-bold text-white mb-1.5 tracking-tight">
          Bienvenido a Ranked Arena
        </h2>
        <p className="text-xs text-slate-400 mb-6">
          Ingresa tu nombre para comenzar tu trayectoria en el simulador de rangos y divisiones.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            value={username}
            onChange={(e) => {
              setUsername(e.target.value);
              if (error) setError('');
            }}
            placeholder="Ej: PhantomX"
            maxLength={16}
            autoFocus
            className="w-full px-4 py-3.5 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 text-center font-medium"
          />

          {error && (
            <p className="text-xs text-rose-400 font-medium">{error}</p>
          )}

          <div className="pt-1">
            <p className="text-[11px] text-slate-500 mb-2">Sugerencias rápidas:</p>
            <div className="flex flex-wrap justify-center gap-1.5">
              {suggestions.map((sug) => (
                <button
                  key={sug}
                  type="button"
                  onClick={() => {
                    sounds.playTap();
                    setUsername(sug);
                    setError('');
                  }}
                  className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                >
                  {sug}
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            className="w-full h-12 mt-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm rounded-xl shadow-lg shadow-amber-500/25 flex items-center justify-center active:scale-[0.98] transition-transform"
          >
            Entrar a Ranked
          </button>
        </form>
      </div>
    </div>
  );
};
