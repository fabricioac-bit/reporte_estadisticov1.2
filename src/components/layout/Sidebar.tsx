'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import {
  Activity,
  HeartPulse,
  Menu,
  ChevronDown,
  BarChart3,
  Clock,
  Coins,
  User,
} from 'lucide-react';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export default function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const router = useRouter();

  return (
    <aside className={`h-screen sticky top-0 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-200 flex flex-col transition-all duration-300 ease-in-out z-30 flex-shrink-0 ${collapsed ? 'w-20' : 'w-72'}`}>
      
      {/* CABECERA DEL LOGO */}
      <div className="p-6 border-b border-slate-800/60 flex items-center justify-between gap-3 min-h-[89px]">
        {!collapsed ? (
          <>
            <div 
              onClick={() => router.push('/dashboard')} 
              className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition"
              title="Volver al Panel Principal"
            >
              <div className="w-10 h-10 rounded-xl bg-sky-500/20 flex items-center justify-center border border-sky-500/30">
                <HeartPulse className="w-6 h-6 text-sky-400" />
              </div>
              <div>
                <h2 className="font-extrabold text-white text-lg tracking-tight leading-none">REZOLA</h2>
                <span className="text-xs text-slate-500 font-semibold tracking-wider uppercase">Hospitalario</span>
              </div>
            </div>
            <button
              type="button"
              onClick={onToggle}
              className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-800/90 bg-slate-950/90 text-sky-200 shadow-inner shadow-slate-950 transition hover:border-sky-500 hover:text-white hover:bg-slate-900"
            >
              <Menu className="w-5 h-5" />
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={onToggle}
            className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-800/90 bg-slate-950/90 text-sky-200 shadow-inner shadow-slate-950 transition hover:border-sky-500 hover:text-white hover:bg-slate-900"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* NAVEGACIÓN */}
      <nav className="flex-1 overflow-y-auto p-5 space-y-4 bg-slate-950/30 backdrop-blur-xl">
        {!collapsed && <div className="mb-4 px-2 text-xs uppercase tracking-[0.3em] text-sky-300">Modulos clinicos</div>}
        
        <div className="space-y-2">
          <div className={`w-full flex items-center justify-between gap-3 text-white bg-blue-600 rounded-2xl px-3 py-3 ${collapsed ? 'justify-center bg-slate-900/90 px-0 py-3 rounded-xl' : ''}`}>
            <div className="flex items-center gap-3">
              <span className="rounded-xl bg-white p-2 text-slate-900 shadow-sm">
                <Activity className="w-5 h-5" />
              </span>
              <span className={`${collapsed ? 'hidden' : 'block'} font-semibold`}>Produccion Medica</span>
            </div>
            <ChevronDown className={`w-4 h-4 text-white/70 ${collapsed ? 'hidden' : 'block'} rotate-180`} />
          </div>

          {!collapsed && (
            <ul className="mt-1 pl-2 space-y-1 border-l border-slate-800/80 ml-5">
              <li>
                <div className="w-full flex items-center justify-between rounded-xl px-3 py-2.5 text-left text-slate-300">
                  <span className="inline-flex items-center gap-2 text-sm font-medium">
                    <User className="w-4 h-4 text-sky-400" />
                    <span>Consulta Externa</span>
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-500 rotate-180" />
                </div>

                <ul className="mt-1 pl-4 space-y-1 bg-slate-950/20 rounded-xl p-1.5 border border-slate-900">
                  <li>
                    <button 
                      type="button"
                      onClick={() => router.push('/dashboard/productividad')}
                      className="w-full flex items-center gap-2 rounded-lg px-3 py-2 text-xs text-white bg-slate-800 font-medium transition"
                    >
                      <BarChart3 className="w-3.5 h-3.5 text-blue-500" />
                      <span>Productividad</span>
                    </button>
                  </li>
                  <li>
                    <button 
                      type="button"
                      onClick={() => router.push('/dashboard/tiempos')}
                      className="w-full flex items-center gap-2 rounded-lg px-3 py-2 text-xs text-slate-400 hover:text-white hover:bg-slate-800/50 transition"
                    >
                      <Clock className="w-3.5 h-3.5 text-amber-500" />
                      <span>Tiempos e Indicadores</span>
                    </button>
                  </li>
                  <li>
                    <button 
                      type="button"
                      onClick={() => router.push('/dashboard/financiamiento')}
                      className="w-full flex items-center gap-2 rounded-lg px-3 py-2 text-xs text-slate-400 hover:text-white hover:bg-slate-800/50 transition"
                    >
                      <Coins className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Financiamiento (SIS)</span>
                    </button>
                  </li>
                </ul>
              </li>
            </ul>
          )}
        </div>
      </nav>
    </aside>
  );
}