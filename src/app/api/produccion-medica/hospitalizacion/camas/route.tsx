'use client';

import React, { useState } from 'react';
import NavbarUpper from '@/components/layout/NavbarUpper';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  Cell,
} from 'recharts';
import {
  Bed,
  ClipboardList,
  Activity,
  RefreshCcw,
  Search,
  FileSpreadsheet,
  FileText,
} from 'lucide-react';

// Datos simulados: Índice de Giro de Cama por mes
const datosGiroMensual = [
  { mes: 'Ene', indice: 3.2 },
  { mes: 'Feb', indice: 3.5 },
  { mes: 'Mar', indice: 3.8 },
  { mes: 'Abr', indice: 4.1 },
  { mes: 'May', indice: 3.9 },
  { mes: 'Jun', indice: 4.3 },
];

// Censo por Servicios Hospitalarios
const censoServicios = [
  { id: 1, servicio: 'Cirugía General', totalCamas: 45, ocupadas: 42, giro: 4.8, estado: 'Saturación Alta', color: 'bg-red-50 text-red-700' },
  { id: 2, servicio: 'Medicina Interna', totalCamas: 60, ocupadas: 55, giro: 3.5, estado: 'Estable', color: 'bg-emerald-50 text-emerald-700' },
  { id: 3, servicio: 'Pediatría', totalCamas: 30, ocupadas: 12, giro: 2.1, estado: 'Baja Demanda', color: 'bg-blue-50 text-blue-700' },
  { id: 4, servicio: 'Gineco-Obstetricia', totalCamas: 40, ocupadas: 38, giro: 5.2, estado: 'Saturación Alta', color: 'bg-red-50 text-red-700' },
  { id: 5, servicio: 'UCI Adultos', totalCamas: 12, ocupadas: 11, giro: 1.8, estado: 'Crítico', color: 'bg-amber-50 text-amber-700' },
];

export default function GiroCamasPage() {
  const [loading, setLoading] = useState(false);
  const [servicioFiltro, setServicioFiltro] = useState('Todos');

  const handleRefreshData = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 1000);
  };

  return (
    <div className="space-y-8 w-full">
      {/* CABECERA GLOBAL CON SESIÓN DE USUARIO AUTOMÁTICA */}
      <NavbarUpper 
        title="Giro de Camas y Censo Hospitalario" 
        description="Gestión de la rotación de camas, tasa de ocupación y disponibilidad de recursos de internamiento por servicio."
        onRefresh={handleRefreshData}
        isRefreshLoading={loading}
      />

      {/* BLOQUE DE FILTROS DE CENSO */}
      <div className="bg-white border border-slate-100 p-6 rounded-3xl shadow-sm flex flex-col sm:flex-row gap-4 items-end justify-between">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-1 w-full">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Servicio Hospitalario</label>
            <select 
              value={servicioFiltro} 
              onChange={(e) => setServicioFiltro(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-500"
            >
              <option value="Todos">Todos los Servicios</option>
              <option value="Cirugia">Cirugía General</option>
              <option value="Medicina">Medicina Interna</option>
              <option value="Pediatria">Pediatría</option>
              <option value="Gineco">Gineco-Obstetricia</option>
              <option value="UCI">Cuidados Intensivos</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Fecha del Censo</label>
            <input 
              type="date" 
              defaultValue="2026-06-09"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-500" 
            />
          </div>
        </div>
        <button className="w-full sm:w-48 bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm px-4 py-2.5 rounded-xl shadow-md shadow-teal-500/10 flex items-center justify-center gap-2 transition h-[40px]">
          <Search className="w-4 h-4" />
          <span>Consultar Censo</span>
        </button>
      </div>

      {/* INDICADORES DE GESTIÓN DE CAMAS (KPIs) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white border border-slate-100 p-6 rounded-3xl shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Ocupación Global</span>
            <h3 className="text-2xl font-black text-slate-800">85.4%</h3>
            <span className="text-xs text-amber-600 font-medium bg-amber-50 px-2 py-0.5 rounded-md inline-block">Cerca del umbral de saturación</span>
          </div>
          <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center text-slate-500">
            <Bed className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white border border-slate-100 p-6 rounded-3xl shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Índice de Giro de Cama</span>
            <h3 className="text-2xl font-black text-teal-600">4.3 <span className="text-sm font-semibold text-teal-400">Pacientes/Cama</span></h3>
            <span className="text-xs text-teal-600 font-medium bg-teal-50 px-2 py-0.5 rounded-md inline-block">Eficiencia alta este mes</span>
          </div>
          <div className="w-12 h-12 bg-teal-50 rounded-xl flex items-center justify-center text-teal-500">
            <RefreshCcw className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white border border-slate-100 p-6 rounded-3xl shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Intervalo de Sustitución</span>
            <h3 className="text-2xl font-black text-slate-800">12.5 <span className="text-sm font-semibold text-slate-400">Horas</span></h3>
            <span className="text-xs text-blue-600 font-medium bg-blue-50 px-2 py-0.5 rounded-md inline-block">Tiempo promedio de cama vacía</span>
          </div>
          <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-500">
            <Activity className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* GRÁFICO DE TENDENCIA DE GIRO DE CAMA */}
      <div className="bg-white border border-slate-100 p-6 rounded-3xl shadow-sm space-y-4">
        <div>
          <h3 className="font-extrabold text-lg text-slate-900">Evolución Mensual del Índice de Giro</h3>
          <p className="text-xs text-slate-400 mt-0.5">Representación de la frecuencia de uso de las camas instaladas durante el último semestre.</p>
        </div>
        <div className="w-full h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={datosGiroMensual} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="mes" stroke="#94a3b8" fontSize={12} tickLine={false} />
              <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} />
              <Tooltip
                contentStyle={{ background: '#0f172a', color: '#fff', borderRadius: '12px', border: 'none' }}
                cursor={{ fill: '#f8fafc' }}
              />
              <Bar dataKey="indice" name="Índice de Giro" radius={[6, 6, 0, 0]}>
                {datosGiroMensual.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.indice > 4.0 ? '#0d9488' : '#3b82f6'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* TABLA DE CENSO POR SERVICIOS */}
      <div className="bg-white border border-slate-100 rounded-3xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="font-extrabold text-lg text-slate-900">Disponibilidad y Rendimiento por Servicio</h3>
            <p className="text-xs text-slate-400 mt-0.5">Corte de censo hospitalario con detalle de ocupación real vs camas instaladas.</p>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button className="flex items-center gap-1.5 border border-slate-200 hover:bg-slate-50 text-slate-600 px-3 py-2 rounded-xl text-xs font-bold transition">
              <FileText className="w-4 h-4 text-red-500" /> 
              <span>Censo PDF</span>
            </button>
            <button className="flex items-center gap-1.5 border border-slate-200 hover:bg-slate-50 text-slate-600 px-3 py-2 rounded-xl text-xs font-bold transition">
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>Libro Excel</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 text-xs font-bold uppercase tracking-wider">
                <th className="py-4 px-6">Servicio Hospitalario</th>
                <th className="py-4 px-6">Camas Totales</th>
                <th className="py-4 px-6">Camas Ocupadas</th>
                <th className="py-4 px-6">Índice Giro</th>
                <th className="py-4 px-6">Estatus Operativo</th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-slate-50 text-slate-700">
              {censoServicios.map((row) => (
                <tr key={row.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-4 px-6 font-bold text-slate-800">{row.servicio}</td>
                  <td className="py-4 px-6 font-semibold">{row.totalCamas}</td>
                  <td className="py-4 px-6 text-teal-600 font-bold">{row.ocupadas}</td>
                  <td className="py-4 px-6 font-black text-slate-700">{row.giro}</td>
                  <td className="py-4 px-6">
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${row.color}`}>
                      {row.estado}
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