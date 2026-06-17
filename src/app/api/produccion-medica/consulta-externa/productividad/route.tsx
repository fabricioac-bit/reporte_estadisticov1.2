'use client';

import React, { useState } from 'react';
import NavbarUpper from '@/components/layout/NavbarUpper';
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
  Calendar,
  UserCheck,
  UserX,
  Search,
  FileSpreadsheet,
  FileText,
  UserPlus,
} from 'lucide-react';

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
  const [loading, setLoading] = useState(false);
  
  // Filtros de control
  const [fechaInicio, setFechaInicio] = useState('2026-06-01');
  const [fechaFin, setFechaFin] = useState('2026-06-02');
  const [turno, setTurno] = useState('Manana');
  const [especialidad, setEspecialidad] = useState('Todas');

  // Simulación de actualización desde el NavbarUpper
  const handleRefreshData = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 1000);
  };

  // Cálculos dinámicos basados en tus datos estáticos para las tarjetas KPI
  const totalAgendadas = rankingMedicosHumano.reduce((acc, med) => acc + med.agendadas, 0);
  const totalAtendidos = rankingMedicosHumano.reduce((acc, med) => acc + med.atendidos, 0);
  const totalAdicionales = rankingMedicosHumano.reduce((acc, med) => acc + med.adicionales, 0);
  const totalAusentes = rankingMedicosHumano.reduce((acc, med) => acc + med.ausentes, 0);

  return (
    <div className="space-y-8 w-full">
      {/* SECCIÓN DE CABECERA UNIFICADA GLOBAL */}
      <NavbarUpper 
        title="Productividad Hospitalaria Real"
        description="Análisis contextualizado en la actividad real del consultorio basando turnos, reprogramaciones por emergencias y sobrecupos."
        onRefresh={handleRefreshData}
        isRefreshLoading={loading}
      />

      {/* BLOQUE DE FILTROS */}
      <div className="bg-white border border-slate-100 p-6 rounded-3xl shadow-sm grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Fecha Inicio</label>
          <input 
            type="date" 
            value={fechaInicio} 
            onChange={(e) => setFechaInicio(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-500" 
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Fecha Fin</label>
          <input 
            type="date" 
            value={fechaFin} 
            onChange={(e) => setFechaFin(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-500" 
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Turno Clínico</label>
          <select 
            value={turno} 
            onChange={(e) => setTurno(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-500"
          >
            <option value="Manana">Mañana (08:00 AM - 12:00 PM)</option>
            <option value="Tarde">Tarde (12:00 PM - 04:00 PM)</option>
            <option value="Noche">Noche (04:00 PM - 08:00 PM)</option>
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Especialidad Médico Asignado</label>
          <select 
            value={especialidad} 
            onChange={(e) => setEspecialidad(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-500"
          >
            <option value="Todas">Todas las Especialidades</option>
            <option value="Pediatria">Pediatría</option>
            <option value="Ginecologia">Ginecología</option>
            <option value="Medicina Interna">Medicina Interna</option>
            <option value="Cardiologia">Cardiología</option>
          </select>
        </div>
        <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm px-4 py-2.5 rounded-xl shadow-md shadow-blue-500/10 flex items-center justify-center gap-2 transition">
          <Search className="w-4 h-4" />
          <span>Filtrar Panel</span>
        </button>
      </div>

      {/* GRID DE FILAS KPI */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white border border-slate-100 p-6 rounded-3xl shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Citas Ofertadas</span>
            <h3 className="text-2xl font-black text-slate-800">{totalAgendadas}</h3>
          </div>
          <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center text-slate-500"><Calendar className="w-6 h-6" /></div>
        </div>

        <div className="bg-white border border-slate-100 p-6 rounded-3xl shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Citados Atendidos</span>
            <h3 className="text-2xl font-black text-slate-800">{totalAtendidos}</h3>
          </div>
          <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-500"><UserCheck className="w-6 h-6" /></div>
        </div>

        <div className="bg-white border border-slate-100 p-6 rounded-3xl shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Pacientes Adicionales</span>
            <h3 className="text-2xl font-black text-slate-800">+{totalAdicionales}</h3>
          </div>
          <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-500"><UserPlus className="w-6 h-6" /></div>
        </div>

        <div className="bg-white border border-slate-100 p-6 rounded-3xl shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Ausentes / Cupos Perdidos</span>
            <h3 className="text-2xl font-black text-slate-800">{totalAusentes}</h3>
          </div>
          <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center text-red-500"><UserX className="w-6 h-6" /></div>
        </div>
      </div>

      {/* GRÁFICO DE FLUJO DE ATENCIONES */}
      <div className="bg-white border border-slate-100 p-6 rounded-3xl shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h3 className="font-extrabold text-lg text-slate-900">Curva Dinámica de Carga de Pacientes</h3>
            <p className="text-xs text-slate-400 mt-0.5">Atenciones completadas desglosadas por intervalos horarios en el turno seleccionado</p>
          </div>
          <span className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full uppercase tracking-wider">Turno Mañana</span>
        </div>
        <div className="w-full h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={datosHoraManana} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorProductividad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="hora" stroke="#94a3b8" fontSize={12} tickLine={false} />
              <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} />
              <Tooltip
                contentStyle={{ background: '#0f172a', color: '#fff', borderRadius: '12px', border: 'none' }}
                itemStyle={{ color: '#60a5fa' }}
              />
              <Area type="monotone" dataKey="atenciones" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorProductividad)" name="Pacientes Atendidos" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* TABLA DE DETALLE / RANKING DE MÉDICOS */}
      <div className="bg-white border border-slate-100 rounded-3xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="font-extrabold text-lg text-slate-900">Rendimiento Operativo por Facultativo</h3>
            <p className="text-xs text-slate-400 mt-0.5">Monitoreo detallado de cupos y estatus asistencial por médico en tiempo real</p>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button className="flex items-center gap-1.5 border border-slate-200 hover:bg-slate-50 text-slate-600 px-3 py-2 rounded-xl text-xs font-bold transition">
              <FileText className="w-4 h-4 text-red-500" /> 
              <span>Generar PDF</span>
            </button>
            <button className="flex items-center gap-1.5 border border-slate-200 hover:bg-slate-50 text-slate-600 px-3 py-2 rounded-xl text-xs font-bold transition">
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>Exportar Excel</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 text-xs font-bold uppercase tracking-wider">
                <th className="py-4 px-6">Médico Especialista</th>
                <th className="py-4 px-6">Cupos Ofertados</th>
                <th className="py-4 px-6">Atendidos</th>
                <th className="py-4 px-6">Adicionales</th>
                <th className="py-4 px-6">Ausentes</th>
                <th className="py-4 px-6">Estatus Operativo</th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-slate-50 text-slate-700">
              {rankingMedicosHumano.map((medico) => (
                <tr key={medico.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-4 px-6">
                    <div className="font-bold text-slate-800">{medico.nombre}</div>
                    <div className="text-xs text-slate-400 font-medium">{medico.especialidad}</div>
                  </td>
                  <td className="py-4 px-6 font-semibold">{medico.agendadas}</td>
                  <td className="py-4 px-6 text-blue-600 font-bold">{medico.atendidos}</td>
                  <td className="py-4 px-6 text-emerald-600 font-medium">+{medico.adicionales}</td>
                  <td className="py-4 px-6 text-red-400">{medico.ausentes}</td>
                  <td className="py-4 px-6">
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                      medico.estado === 'Atendiendo con Normalidad' 
                        ? 'bg-emerald-50 text-emerald-700' 
                        : medico.estado === 'Consultorio Demorado' 
                        ? 'bg-amber-50 text-amber-700' 
                        : 'bg-red-50 text-red-700'
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
    </div>
  );
}