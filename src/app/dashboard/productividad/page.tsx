'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import {
  RefreshCw,
  Calendar,
  Users,
  UserCheck,
  UserX,
  Search,
  FileSpreadsheet,
  FileText,
  UserPlus,
  Settings,
  LogOut,
} from 'lucide-react';

// Importamos el molde que acabas de crear en tu carpeta de layouts
import Sidebar from '@/components/layout/Sidebar';

const datosHoraManana = [
  { hora: '08:00', atenciones: 25 },
  { hora: '09:00', atenciones: 48 },
  { hora: '10:00', atenciones: 65 },
  { hora: '11:00', atenciones: 42 },
  { hora: '12:00', atenciones: 15 },
];

const rankingMedicosHumano = [
  { id: 1, nombre: 'Dr. Alejandro Gomez M.', especialidad: 'Pediatria', agendadas: 20, atendidos: 16, adicionales: 4, ausentes: 4, estado: 'Interrumpido por Emergencia' },
  { id: 2, nombre: 'Dra. Elena Rostworowski', especialidad: 'Ginecologia', agendadas: 24, atendidos: 18, adicionales: 2, ausentes: 6, estado: 'Atendiendo con Normalidad' },
  { id: 3, nombre: 'Dr. Carlos Mendoza V.', especialidad: 'Medicina Interna', agendadas: 18, atendidos: 15, adicionales: 5, ausentes: 3, estado: 'Consultorio Demorado' },
  { id: 4, nombre: 'Dra. Sofia Benavides K.', especialidad: 'Cardiologia', agendadas: 15, atendidos: 12, adicionales: 1, ausentes: 3, estado: 'Atendiendo con Normalidad' },
];

export default function ProductividadPage() {
  const router = useRouter();
  
  // Estado exclusivo para el colapso del menú lateral modular
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  return (
    <div className="w-full min-h-screen bg-slate-50 flex flex-row overflow-hidden text-slate-800">
      
      {/* Invocamos tu Sidebar pasándole el estado y su manejador de click */}
      <Sidebar 
        collapsed={sidebarCollapsed} 
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} 
      />

      {/* ÁREA DE CONTENIDO FLUIDO (Derecha del menú) */}
      <main className="flex-1 h-screen overflow-y-auto p-6 md:p-10 space-y-8 min-w-0">
        
        {/* CABECERA SUPERIOR */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Panel de Control Clinico</h1>
            <p className="text-slate-500 mt-1">Estadistica hospitalaria integral y productividad de personal en tiempo real.</p>
          </div>

          <div className="flex items-center gap-3 self-start md:self-auto">
            <button
              type="button"
              className="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 px-4 py-2.5 rounded-xl text-sm font-bold shadow-sm transition hover:bg-slate-50"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Actualizar</span>
            </button>

            {/* PERFIL ESQUINA SUPERIOR */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                className="w-11 h-11 rounded-full bg-slate-900 text-white flex items-center justify-center font-semibold uppercase shadow-lg border border-slate-800"
              >
                U
              </button>

              {profileMenuOpen && (
                <div className="absolute right-0 mt-3 w-52 overflow-hidden rounded-3xl border border-slate-200 bg-white text-slate-800 shadow-2xl z-20">
                  <button type="button" className="w-full flex items-center gap-3 px-4 py-3 text-left text-slate-700 hover:bg-slate-50 transition">
                    <Settings className="w-4 h-4 text-slate-500" />
                    <span>Cambiar clave</span>
                  </button>
                  <button type="button" onClick={() => router.push('/login')} className="w-full flex items-center gap-3 px-4 py-3 text-left text-slate-700 hover:bg-slate-50 transition">
                    <LogOut className="w-4 h-4 text-slate-500" />
                    <span>Cerrar sesion</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* FILTROS VISUALES */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div>
            <h2 className="text-xl font-extrabold tracking-tight text-slate-900">Productividad Hospitalaria Real</h2>
            <p className="text-slate-500 text-xs mt-0.5">Analisis contextualizado en la actividad real del consultorio basando turnos, reprogramaciones por emergencias y sobrecupos.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-100">
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1">Fecha Inicio</span>
              <div className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 flex items-center justify-between">
                <span>01/06/2026</span>
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1">Fecha Fin</span>
              <div className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 flex items-center justify-between">
                <span>02/06/2026</span>
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1">Turno Clinico</span>
              <div className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-700">
                Manana (08:00 AM - 12:00 PM)
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1">Especialidad</span>
              <div className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-700">
                Todas las Especialidades
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1">Medico Asignado</span>
              <div className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-400 bg-slate-100/50">
                Todos los Medicos del area
              </div>
            </div>

            <div className="flex flex-col justify-end">
              <div className="h-9 flex items-center justify-center gap-2 bg-blue-600 text-white font-bold text-xs rounded-xl shadow-sm opacity-90 cursor-default">
                <Search className="w-3.5 h-3.5" />
                <span>Filtrar Panel</span>
              </div>
            </div>
          </div>
        </div>

        {/* SECCIÓN DE TARJETAS KPI */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white border border-slate-100 p-6 rounded-3xl shadow-sm flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Citas Ofertadas / Agendadas</span>
              <h3 className="text-3xl font-extrabold text-slate-800 tracking-tight">215</h3>
              <p className="text-slate-400 text-[11px] font-medium">Planificacion oficial del turno</p>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center">
              <Users className="w-7 h-7 text-slate-400" />
            </div>
          </div>

          <div className="bg-white border border-slate-100 p-6 rounded-3xl shadow-sm flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Citados Atendidos</span>
              <h3 className="text-3xl font-extrabold text-slate-800 tracking-tight">168</h3>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full inline-block bg-blue-50 text-blue-700">
                78.1% asistencia regular
              </span>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center">
              <UserCheck className="w-7 h-7 text-blue-600" />
            </div>
          </div>

          <div className="bg-white border border-slate-100 p-6 rounded-3xl shadow-sm flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Pacientes Adicionales</span>
              <h3 className="text-3xl font-extrabold text-slate-800 tracking-tight">+18</h3>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full inline-block bg-emerald-50 text-emerald-700">
                Carga extra por pasillo
              </span>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center">
              <UserPlus className="w-7 h-7 text-emerald-600" />
            </div>
          </div>

          <div className="bg-white border border-slate-100 p-6 rounded-3xl shadow-sm flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Ausentes / Cupos Perdidos</span>
              <h3 className="text-3xl font-extrabold text-slate-800 tracking-tight">35</h3>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full inline-block bg-red-50 text-red-700">
                16.2% tiempo muerto generado
              </span>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center">
              <UserX className="w-7 h-7 text-red-500" />
            </div>
          </div>
        </div>

        {/* GRAFICOS Y REPORTES */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* CARGA HORARIA */}
          <div className="bg-white border border-slate-100 p-6 md:p-8 rounded-3xl shadow-sm space-y-4 lg:col-span-7">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 flex-wrap gap-2">
              <div>
                <h3 className="font-extrabold text-lg text-slate-900">Flujo Horario: Turno Manana</h3>
                <p className="text-xs text-slate-400 mt-0.5">Atenciones por hora en el rango de tiempo seleccionado.</p>
              </div>
              
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 bg-white border border-slate-200 text-slate-600 px-2.5 py-1.5 rounded-lg text-[11px] font-bold shadow-sm">
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Excel</span>
                </div>
                <div className="flex items-center gap-1 bg-white border border-slate-200 text-slate-600 px-2.5 py-1.5 rounded-lg text-[11px] font-bold shadow-sm">
                  <FileText className="w-3.5 h-3.5 text-red-500" />
                  <span>PDF</span>
                </div>
              </div>
            </div>

            <div className="w-full h-80 pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={datosHoraManana} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorAtencionesDinamico" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="hora" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <Tooltip
                    contentStyle={{ background: '#0f172a', color: '#fff', borderRadius: '12px', border: 'none', fontSize: '12px' }}
                    itemStyle={{ color: '#38bdf8' }}
                  />
                  <Area type="monotone" dataKey="atenciones" stroke="#2563eb" strokeWidth={3} fillOpacity={1} fill="url(#colorAtencionesDinamico)" name="Pacientes" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* TABLA DE RENDIMIENTO */}
          <div className="bg-white border border-slate-100 p-6 md:p-8 rounded-3xl shadow-sm space-y-4 lg:col-span-5 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4 flex-wrap gap-2">
                <div>
                  <h3 className="font-extrabold text-lg text-slate-900">Rendimiento Clinico Real</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Desempeno evaluando sobrecupos e interrupciones del consultorio.</p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 text-[10px] uppercase tracking-wider font-bold">
                      <th className="pb-3 font-bold">Medico</th>
                      <th className="pb-3 text-center font-bold">Citados</th>
                      <th className="pb-3 text-center font-bold">Adic.</th>
                      <th className="pb-3 text-center font-bold">Aus.</th>
                      <th className="pb-3 text-right font-bold">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 text-xs">
                    {rankingMedicosHumano.map((medico) => (
                      <tr key={medico.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-3 pr-1">
                          <p className="font-bold text-slate-800 text-xs">{medico.nombre}</p>
                          <p className="text-[10px] text-slate-400 font-medium">{medico.especialidad}</p>
                        </td>
                        <td className="py-3 text-center text-slate-600 font-medium">{medico.atendidos}/{medico.agendadas}</td>
                        <td className="py-3 text-center font-bold text-emerald-600 bg-emerald-50/40 rounded-md">{medico.adicionales}</td>
                        <td className="py-3 text-center text-red-500 font-medium">{medico.ausentes}</td>
                        <td className="py-3 text-right">
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full inline-block ${
                            medico.estado === 'Atendiendo con Normalidad' ? 'bg-blue-50 text-blue-700' :
                            medico.estado === 'Interrumpido por Emergencia' ? 'bg-amber-50 text-amber-700' :
                            'bg-slate-100 text-slate-600'
                          }`}>
                            {medico.estado}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            
            <div className="pt-4 border-t border-slate-100 text-[11px] text-slate-400 font-medium">
              * Los adicionales y llamados de emergencia son sincronizados mediante cruces de datos entre modulos de admision y atencion SIGH.
            </div>
          </div>

        </div>

      </main>
    </div>
  );
}