'use client';

import React, { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import {
  Activity,
  HeartPulse,
  Menu,
  ChevronDown,
  BarChart3,
  Clock,
  Coins,
  User,
  ShieldAlert,
  Heart,
  FileCheck,
  AlertTriangle,
  Bed,
  Stethoscope,
  ShieldCheck,
  Syringe,
  ClipboardList
} from 'lucide-react';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export default function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const router = useRouter();
  const pathname = usePathname();

  // Estados para los módulos principales (Nivel 0)
  const [produccionOpen, setProduccionOpen] = useState(true);
  const [proEstrategicosOpen, setProEstrategicosOpen] = useState(false);

  // Estados para los submódulos de Producción Médica (Nivel 1)
  const [consultaExtOpen, setConsultaExtOpen] = useState(true);
  const [emergenciaOpen, setEmergenciaOpen] = useState(false);
  const [hospitalizacionOpen, setHospitalizacionOpen] = useState(false);

  const isActive = (path: string) => pathname === path;

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
      <nav className="flex-1 overflow-y-auto p-5 space-y-6 bg-slate-950/30 backdrop-blur-xl">
        {!collapsed && <div className="mb-2 px-2 text-xs uppercase tracking-[0.3em] text-sky-300 font-bold">Módulos Clínicos</div>}
        
        {/* BLOQUE 1: PRODUCCIÓN MÉDICA */}
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => !collapsed && setProduccionOpen(!produccionOpen)}
            className={`w-full flex items-center bg-slate-900 border border-slate-800/50 rounded-2xl transition hover:bg-slate-850/80 ${
              collapsed ? 'justify-center p-2' : 'justify-between px-3 py-3'
            }`}
          >
            <div className={`flex items-center ${collapsed ? 'justify-center' : 'gap-3'}`}>
              <span className="rounded-xl bg-blue-600 p-2 text-white shadow-sm flex items-center justify-center">
                <Activity className="w-5 h-5" />
              </span>
              {!collapsed && <span className="font-semibold text-sm text-white">Producción Médica</span>}
            </div>
            {!collapsed && (
              <ChevronDown className={`w-4 h-4 text-white/70 transition-transform duration-200 ${produccionOpen ? 'rotate-180' : ''}`} />
            )}
          </button>

          {/* SUBMENÚS DESPLEGABLES (SOLO VISIBLES SI NO ESTÁ COLAPSADO Y PRODUCCIÓN ESTÁ ABIERTO) */}
          {!collapsed && produccionOpen && (
            <ul className="mt-1 pl-2 space-y-3 border-l border-slate-800/80 ml-5 transition-all">
              
              {/* SUBMÓDULO: CONSULTA EXTERNA */}
              <li>
                <button
                  type="button"
                  onClick={() => setConsultaExtOpen(!consultaExtOpen)}
                  className="w-full flex items-center justify-between rounded-xl px-3 py-1 text-left text-slate-400 hover:text-slate-200 transition"
                >
                  <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider">
                    <User className="w-3.5 h-3.5 text-sky-400" />
                    <span>Consulta Externa</span>
                  </span>
                  <ChevronDown className={`w-3.5 h-3.5 text-slate-500 transition-transform duration-200 ${consultaExtOpen ? 'rotate-180' : ''}`} />
                </button>

                {consultaExtOpen && (
                  <ul className="mt-1 pl-2 space-y-1 bg-slate-950/20 rounded-xl p-1 border border-slate-900/60">
                    <li>
                      <button 
                        type="button"
                        onClick={() => router.push('/dashboard/produccion-medica/consulta-externa/productividad')}
                        className={`w-full flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition ${
                          isActive('/dashboard/produccion-medica/consulta-externa/productividad') ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                        }`}
                      >
                        <BarChart3 className="w-3.5 h-3.5" />
                        <span>Productividad</span>
                      </button>
                    </li>
                    <li>
                      <button 
                        type="button"
                        onClick={() => router.push('/dashboard/produccion-medica/consulta-externa/tiempos')}
                        className={`w-full flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition ${
                          isActive('/dashboard/produccion-medica/consulta-externa/tiempos') ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                        }`}
                      >
                        <Clock className="w-3.5 h-3.5" />
                        <span>Indicadores</span>
                      </button>
                    </li>
                  </ul>
                )}
              </li>

              {/* SUBMÓDULO: EMERGENCIA */}
              <li>
                <button
                  type="button"
                  onClick={() => setEmergenciaOpen(!emergenciaOpen)}
                  className="w-full flex items-center justify-between rounded-xl px-3 py-1 text-left text-slate-400 hover:text-slate-200 transition"
                >
                  <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                    <span>Emergencia</span>
                  </span>
                  <ChevronDown className={`w-3.5 h-3.5 text-slate-500 transition-transform duration-200 ${emergenciaOpen ? 'rotate-180' : ''}`} />
                </button>

                {emergenciaOpen && (
                  <ul className="mt-1 pl-2 space-y-1 bg-slate-950/20 rounded-xl p-1 border border-slate-900/60">
                    <li>
                      <button 
                        type="button"
                        onClick={() => router.push('/dashboard/produccion-medica/emergencia/atenciones')}
                        className={`w-full flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition ${
                          isActive('/dashboard/produccion-medica/emergencia/atenciones') ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                        }`}
                      >
                        <Stethoscope className="w-3.5 h-3.5" />
                        <span>Frecuencia de Atenciones</span>
                      </button>
                    </li>
                    <li>
                      <button 
                        type="button"
                        onClick={() => router.push('/dashboard/produccion-medica/emergencia/triage')}
                        className={`w-full flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition ${
                          isActive('/dashboard/produccion-medica/emergencia/triage') ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                        }`}
                      >
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>Triaje y Tiempos</span>
                      </button>
                    </li>
                  </ul>
                )}
              </li>

              {/* SUBMÓDULO: HOSPITALIZACIÓN */}
              <li>
                <button
                  type="button"
                  onClick={() => setHospitalizacionOpen(!hospitalizacionOpen)}
                  className="w-full flex items-center justify-between rounded-xl px-3 py-1 text-left text-slate-400 hover:text-slate-200 transition"
                >
                  <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider">
                    <Bed className="w-3.5 h-3.5 text-teal-400" />
                    <span>Hospitalización</span>
                  </span>
                  <ChevronDown className={`w-3.5 h-3.5 text-slate-500 transition-transform duration-200 ${hospitalizacionOpen ? 'rotate-180' : ''}`} />
                </button>

                {hospitalizacionOpen && (
                  <ul className="mt-1 pl-2 space-y-1 bg-slate-950/20 rounded-xl p-1 border border-slate-900/60">
                    <li>
                      <button 
                        type="button"
                        onClick={() => router.push('/dashboard/produccion-medica/hospitalizacion/camas')}
                        className={`w-full flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition ${
                          isActive('/dashboard/produccion-medica/hospitalizacion/camas') ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                        }`}
                      >
                        <ClipboardList className="w-3.5 h-3.5" />
                        <span>Giro de Camas</span>
                      </button>
                    </li>
                    <li>
                      <button 
                        type="button"
                        onClick={() => router.push('/dashboard/produccion-medica/hospitalizacion/estancia')}
                        className={`w-full flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition ${
                          isActive('/dashboard/produccion-medica/hospitalizacion/estancia') ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                        }`}
                      >
                        <Syringe className="w-3.5 h-3.5" />
                        <span>Promedio de Estancia</span>
                      </button>
                    </li>
                  </ul>
                )}
              </li>

            </ul>
          )}
        </div>
      </nav>
    </aside>
  );
}