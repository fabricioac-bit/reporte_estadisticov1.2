'use client';

import React, { useState } from 'react';
import NavbarUpper from '@/components/layout/NavbarUpper';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import {
  Clock,
  Hourglass,
  TrendingDown,
  AlertCircle,
  Search,
  FileSpreadsheet,
  FileText,
} from 'lucide-react';

// Datos simulados de indicadores por mes
const datosHistoricosTiempos = [
  { mes: 'Ene', tiempoSala: 42, diasDiferimiento: 14, metaSala: 30 },
  { mes: 'Feb', tiempoSala: 38, diasDiferimiento: 12, metaSala: 30 },
  { mes: 'Mar', tiempoSala: 45, diasDiferimiento: 15, metaSala: 30 },
  { mes: 'Abr', tiempoSala: 29, diasDiferimiento: 9,  metaSala: 30 },
  { mes: 'May', tiempoSala: 25, diasDiferimiento: 7,  metaSala: 30 },
  { mes: 'Jun', tiempoSala: 22, diasDiferimiento: 6,  metaSala: 30 },
];

// Detalle analítico por especialidad médica
const reporteEspecialidades = [
  { id: 1, especialidad: 'Pediatría', diferimiento: '5 días', esperaSala: '18 min', nivelAlerta: 'Óptimo', color: 'bg-emerald-50 text-emerald-700' },
  { id: 2, especialidad: 'Ginecología', diferimiento: '11 días', esperaSala: '34 min', nivelAlerta: 'Ligeramente Demorado', color: 'bg-amber-50 text-amber-700' },
  { id: 3, especialidad: 'Medicina Interna', diferimiento: '16 días', esperaSala: '48 min', nivelAlerta: 'Crítico', color: 'bg-red-50 text-red-700' },
  { id: 4, especialidad: 'Cardiología', diferimiento: '8 días', esperaSala: '25 min', nivelAlerta: 'Óptimo', color: 'bg-emerald-50 text-emerald-700' },
];

export default function TiemposPage() {
  const [loading, setLoading] = useState(false);
  const [especialidad, setEspecialidad] = useState('Todas');
  const [mesFiltro, setMesFiltro] = useState('2026-06');

  const handleRefreshData = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 1000);
  };

  return (
    <div className="space-y-8 w-full">
      {/* CABECERA UNIFICADA GLOBAL */}
      <NavbarUpper 
        title="Tiempos e Indicadores de Oportunidad" 
        description="Auditoría de calidad sobre el diferimiento de citas y el tiempo de espera en sala del paciente."
        onRefresh={handleRefreshData}
        isRefreshLoading={loading}
      />

      {/* BLOQUE DE FILTROS */}
      <div className="bg-white border border-slate-100 p-6 rounded-3xl shadow-sm flex flex-col sm:flex-row gap-4 items-end justify-between">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-1 w-full">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Mes de Análisis</label>
            <input 
              type="month" 
              value={mesFiltro} 
              onChange={(e) => setMesFiltro(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-500" 
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Filtro de Servicio</label>
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
        </div>
        <button className="w-full sm:w-48 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm px-4 py-2.5 rounded-xl shadow-md shadow-blue-500/10 flex items-center justify-center gap-2 transition h-[40px]">
          <Search className="w-4 h-4" />
          <span>Procesar Datos</span>
        </button>
      </div>

      {/* TARJETAS DE INDICADORES CLAVE (KPIs) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white border border-slate-100 p-6 rounded-3xl shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Espera Media en Sala</span>
            <h3 className="text-2xl font-black text-slate-800">29.3 <span className="text-sm font-semibold text-slate-400">Minutos</span></h3>
            <span className="text-xs text-emerald-600 font-medium bg-emerald-50 px-2 py-0.5 rounded-md inline-block">Dentro de la meta institucional</span>
          </div>
          <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center text-slate-500">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white border border-slate-100 p-6 rounded-3xl shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Diferimiento de Cita</span>
            <h3 className="text-2xl font-black text-slate-800">9.1 <span className="text-sm font-semibold text-slate-400">Días promedio</span></h3>
            <span className="text-xs text-blue-600 font-medium bg-blue-50 px-2 py-0.5 rounded-md inline-block">Mejora del 14% vs mes anterior</span>
          </div>
          <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-500">
            <Hourglass className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white border border-slate-100 p-6 rounded-3xl shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Tasa de Deserción de Citas</span>
            <h3 className="text-2xl font-black text-slate-800">4.8%</h3>
            <span className="text-xs text-amber-600 font-medium bg-amber-50 px-2 py-0.5 rounded-md inline-block">Pacientes que abandonaron sala</span>
          </div>
          <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center text-red-500">
            <AlertCircle className="w-6 h-6 text-amber-500" />
          </div>
        </div>
      </div>

      {/* GRÁFICO HISTÓRICO MIXTO */}
      <div className="bg-white border border-slate-100 p-6 rounded-3xl shadow-sm space-y-4">
        <div>
          <h3 className="font-extrabold text-lg text-slate-900">Evolución Semestral de Tiempos de Oportunidad</h3>
          <p className="text-xs text-slate-400 mt-0.5">Cruce analítico entre los días que tomó conseguir la cita (Barras) y los minutos de espera en sala antes de ingresar (Línea)</p>
        </div>
        <div className="w-full h-80">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={datosHistoricosTiempos} margin={{ top: 20, right: -10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="mes" stroke="#94a3b8" fontSize={12} tickLine={false} />
              <YAxis yAxisId="left" stroke="#94a3b8" fontSize={12} tickLine={false} label={{ value: 'Días Diferimiento', angle: -90, position: 'insideLeft', style: {textAnchor: 'middle', fill: '#94a3b8', fontSize: 11, fontWeight: 600} }} />
              <YAxis yAxisId="right" orientation="right" stroke="#94a3b8" fontSize={12} tickLine={false} label={{ value: 'Minutos en Sala', angle: 90, position: 'insideRight', style: {textAnchor: 'middle', fill: '#94a3b8', fontSize: 11, fontWeight: 600} }} />
              <Tooltip
                contentStyle={{ background: '#0f172a', color: '#fff', borderRadius: '12px', border: 'none' }}
                itemStyle={{ color: '#60a5fa' }}
              />
              <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: 12, fontWeight: 500 }} />
              <Bar yAxisId="left" dataKey="diasDiferimiento" barSize={35} fill="#3b82f6" radius={[6, 6, 0, 0]} name="Días de Diferimiento" />
              <Line yAxisId="right" type="monotone" dataKey="tiempoSala" stroke="#f59e0b" strokeWidth={3} dot={{ r: 4 }} name="Minutos Espera en Sala" />
              <Line yAxisId="right" type="monotone" dataKey="metaSala" stroke="#ef4444" strokeWidth={1.5} strokeDasharray="5 5" dot={false} name="Meta Umbral Máximo (30m)" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* REPORTES POR ESPECIALIDAD */}
      <div className="bg-white border border-slate-100 rounded-3xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="font-extrabold text-lg text-slate-900">Indicadores Críticos por Servicio</h3>
            <p className="text-xs text-slate-400 mt-0.5">Identificación de cuellos de botella por consultorios físicos externos</p>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button className="flex items-center gap-1.5 border border-slate-200 hover:bg-slate-50 text-slate-600 px-3 py-2 rounded-xl text-xs font-bold transition">
              <FileText className="w-4 h-4 text-red-500" /> 
              <span>Exportar PDF</span>
            </button>
            <button className="flex items-center gap-1.5 border border-slate-200 hover:bg-slate-50 text-slate-600 px-3 py-2 rounded-xl text-xs font-bold transition">
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>Censo en Excel</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 text-xs font-bold uppercase tracking-wider">
                <th className="py-4 px-6">Especialidad Clínica</th>
                <th className="py-4 px-6">Tiempo Diferimiento promedio</th>
                <th className="py-4 px-6">Tiempo de Espera Pre-Atención</th>
                <th className="py-4 px-6">Estatus de Calidad</th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-slate-50 text-slate-700">
              {reporteEspecialidades.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-4 px-6 font-bold text-slate-800">{item.especialidad}</td>
                  <td className="py-4 px-6 font-medium text-slate-600">{item.diferimiento}</td>
                  <td className="py-4 px-6 font-semibold text-blue-600">{item.esperaSala}</td>
                  <td className="py-4 px-6">
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${item.color}`}>
                      {item.nivelAlerta}
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