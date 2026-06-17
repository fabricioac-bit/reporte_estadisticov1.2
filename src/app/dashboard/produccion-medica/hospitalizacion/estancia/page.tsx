'use client';

import React, { useState, useEffect, useCallback } from 'react';
import NavbarUpper from '@/components/layout/NavbarUpper';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  LabelList
} from 'recharts';
import {
  Search,
  Eraser,
  Calendar,
  FileText,
  TrendingUp,
  BarChart3,
  Table2,
  ChevronRight,
  ChevronLeft,
  Clock,
  Users,
  AlertTriangle,
  DoorOpen,
  BriefcaseMedical
} from 'lucide-react';

const obtenerRangoFechasDefault = () => {
  const hoy = new Date();
  return {
    inicio: '2024-01-01', // Fecha base de tu consulta de DBeaver
    fin: `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`
  };
};

export default function EstanciaHospitalariaPage() {
  const rangoDefault = obtenerRangoFechasDefault();

  const [loading, setLoading] = useState(false);
  const [fechaInicio, setFechaInicio] = useState(rangoDefault.inicio);
  const [fechaFin, setFechaFin] = useState(rangoDefault.fin);
  const [servicioFiltro, setServicioFiltro] = useState('Todos');
  const [vistaActiva, setVistaActiva] = useState<'tablas' | 'graficos'>('tablas');

  const [kpis, setKpis] = useState({ totalEnEspera: 0, pendientesFisicos: 0, tiempoPromedioTexto: '0h 0m', criticosDemora: 0 });
  const [datosGrafico, setDatosGrafico] = useState<any[]>([]);
  const [datosTabla, setDatosTabla] = useState<any[]>([]);

  const [paginaActual, setPaginaActual] = useState(1);
  const filasPorPagina = 8;

  const fetchEstancias = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ fechaInicio, fechaFin, servicio: servicioFiltro });
      
      // 🛠️ FIJADO: Ruta corregida agregando '/estancia' al final para romper el error 404
      const res = await fetch(`/api/produccion-medica/hospitalizacion/estancia?${params.toString()}`);
      if (!res.ok) throw new Error('Error al conectar con el endpoint de estancia hospitalaria');
      
      const data = await res.json();
      if (data.kpis) setKpis(data.kpis);
      if (data.grafico) setDatosGrafico(data.grafico);
      if (data.tabla) setDatosTabla(data.tabla);
      setPaginaActual(1);
    } catch (error) {
      console.error("❌ Fallo en fetch de estancias:", error);
    } finally {
      setLoading(false);
    }
  }, [fechaInicio, fechaFin, servicioFiltro]);

  useEffect(() => {
    fetchEstancias();
  }, [servicioFiltro]);

  const limpiarFiltros = () => {
    const rango = obtenerRangoFechasDefault();
    setFechaInicio(rango.inicio);
    setFechaFin(rango.fin);
    setServicioFiltro('Todos');
  };

  const formatearAlertaTiempo = (intervalo: string) => {
    if (!intervalo) return 'text-slate-600 bg-slate-50 border-slate-100';
    const horas = parseInt(intervalo.split(':')[0] || '0');
    if (horas >= 24) return 'text-red-700 bg-red-100 border-red-200 font-black animate-pulse';
    if (horas >= 12) return 'text-orange-700 bg-orange-50 border-orange-200 font-bold';
    return 'text-slate-600 bg-slate-50 border-slate-100';
  };

  const totalPaginas = Math.ceil(datosTabla.length / filasPorPagina) || 1;
  const registrosPaginados = datosTabla.slice((paginaActual - 1) * filasPorPagina, paginaActual * filasPorPagina);

  return (
    <div className="space-y-4 w-full text-slate-800">
      <NavbarUpper 
        title="Panel de Monitoreo de Estancia y Distribución de Camas" 
        description="Seguimiento analítico operacional en tiempo real de pacientes con orden de transferencia de Emergencia a Hospitalización."
        onRefresh={fetchEstancias}
        isRefreshLoading={loading}
      />

      {/* FILTROS EJECUTIVOS */}
      <div className="bg-white border border-slate-200 rounded-xl p-2.5 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3 w-full">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 w-full sm:w-auto flex-1">
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 h-[32px]">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <input type="date" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} className="bg-transparent text-xs font-semibold text-slate-600 outline-none w-full" />
          </div>
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 h-[32px]">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <input type="date" value={fechaFin} onChange={(e) => setFechaFin(e.target.value)} className="bg-transparent text-xs font-semibold text-slate-600 outline-none w-full" />
          </div>
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 h-[32px]">
            <BriefcaseMedical className="w-3.5 h-3.5 text-slate-400" />
            <select value={servicioFiltro} onChange={(e) => setServicioFiltro(e.target.value)} className="bg-transparent text-xs font-bold text-slate-700 outline-none w-full cursor-pointer appearance-none">
              <option value="Todos">Todos los Servicios Destino</option>
              <option value="MEDICINA INTERNA 1 - CE.">Medicina Interna</option>
              <option value="CIRUGIA GENERAL 1 - CE.">Cirugía General</option>
              <option value="PEDIATRIA 1 - CE.">Pediatría</option>
            </select>
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <button onClick={limpiarFiltros} className="p-1.5 hover:bg-slate-100 text-slate-500 rounded-md transition"><Eraser className="w-4 h-4" /></button>
          <button onClick={fetchEstancias} className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-3 py-1.5 rounded-lg flex items-center gap-1 transition h-[32px]"><Search className="w-3.5 h-3.5" /> <span>Consultar</span></button>
        </div>
      </div>

      {/* DASHBOARD KPIS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-3 rounded-xl shadow-md text-white">
          <div className="flex items-center justify-between opacity-80 mb-1"><span className="text-[10px] uppercase font-bold">Espera Activa</span><Users className="w-3.5 h-3.5" /></div>
          <h4 className="text-xl font-black">{kpis.totalEnEspera} <span className="text-xs font-normal">pacientes</span></h4>
        </div>
        <div className="bg-gradient-to-br from-amber-500 to-orange-600 p-3 rounded-xl shadow-md text-white">
          <div className="flex items-center justify-between opacity-80 mb-1"><span className="text-[10px] uppercase font-bold">Sin Recepción Física</span><DoorOpen className="w-3.5 h-3.5" /></div>
          <h4 className="text-xl font-black">{kpis.pendientesFisicos} <span className="text-xs font-normal">casos</span></h4>
        </div>
        <div className="bg-gradient-to-br from-emerald-600 to-teal-700 p-3 rounded-xl shadow-md text-white">
          <div className="flex items-center justify-between opacity-80 mb-1"><span className="text-[10px] uppercase font-bold">Tiempo Promedio</span><Clock className="w-3.5 h-3.5" /></div>
          <h4 className="text-xl font-black">{kpis.tiempoPromedioTexto}</h4>
        </div>
        <div className="bg-gradient-to-br from-rose-600 to-red-700 p-3 rounded-xl shadow-md text-white">
          <div className="flex items-center justify-between opacity-80 mb-1"><span className="text-[10px] uppercase font-bold">Retraso Crítico (+12h)</span><AlertTriangle className="w-3.5 h-3.5" /></div>
          <h4 className="text-xl font-black">{kpis.criticosDemora} <span className="text-xs font-normal">alertas</span></h4>
        </div>
      </div>

      {/* CONTROL DE VISTAS */}
      <div className="flex items-center justify-between bg-slate-100 p-1 rounded-xl max-w-xs border border-slate-200">
        <button onClick={() => setVistaActiva('tablas')} className={`flex items-center justify-center gap-1.5 flex-1 py-1 px-2.5 rounded-lg text-xs font-bold transition-all ${vistaActiva === 'tablas' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-500'}`}><Table2 className="w-3.5 h-3.5" /> Monitor Activo</button>
        <button onClick={() => setVistaActiva('graficos')} className={`flex items-center justify-center gap-1.5 flex-1 py-1 px-2.5 rounded-lg text-xs font-bold transition-all ${vistaActiva === 'graficos' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-500'}`}><BarChart3 className="w-3.5 h-3.5" /> Distribución</button>
      </div>

      {/* VISTA DINÁMICA */}
      {vistaActiva === 'graficos' ? (
        <div className="bg-white border border-slate-200 p-4 rounded-xl">
          <h3 className="font-bold text-sm text-slate-900 mb-0.5">Saturación por Especialidad Hospitalaria Destino</h3>
          <p className="text-[11px] text-slate-400 mb-3">Conteo acumulado de solicitudes pendientes de asignación de cama física.</p>
          <div className="w-full h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={datosGrafico} margin={{ top: 20, right: 5, left: -25, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="servicio" stroke="#475569" fontSize={9} fontStyle="bold" tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={9} tickLine={false} />
                <Tooltip />
                <Bar dataKey="pacientes" radius={[4, 4, 0, 0]} barSize={38} fill="#2563eb">
                  <LabelList dataKey="pacientes" position="top" fill="#1e293b" fontSize={10} fontWeight="bold" />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden border-t-4 border-t-blue-700">
          <div className="p-3 bg-slate-50 border-b border-slate-200 flex justify-between items-center flex-wrap gap-2">
            <div>
              <h3 className="font-bold text-sm text-slate-900">Pacientes en Espera Activa de Piso (SIGH)</h3>
              <p className="text-[11px] text-slate-400">Auditoría en tiempo real de intervalos transcurridos desde el envío de guardia.</p>
            </div>
            <button className="p-1.5 border bg-white text-xs font-bold rounded-lg flex items-center gap-1"><FileText className="w-3.5 h-3.5 text-red-500" /> Guardar PDF</button>
          </div>

          <div className="overflow-x-auto">
            {datosTabla.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500">No se registran pacientes en espera activa bajo estos parámetros.</div>
            ) : (
              <>
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-900 text-white text-[10px] uppercase font-bold tracking-wider">
                      <th className="py-2.5 px-4">Cuenta / Paciente</th>
                      <th className="py-2.5 px-4 text-center">Fecha Envío</th>
                      <th className="py-2.5 px-4 text-center">Hora Envío</th>
                      <th className="py-2.5 px-4 text-center">Intervalo Transcurrido</th>
                      <th className="py-2.5 px-4 text-center">Servicio Destino</th>
                      <th className="py-2.5 px-4 text-center">¿Llegó a Piso?</th>
                    </tr>
                  </thead>
                  <tbody className="text-xs divide-y divide-slate-100 bg-white">
                    {registrosPaginados.map((row: any, i: number) => (
                      <tr key={row.idCuenta || i} className="hover:bg-slate-50/80 transition">
                        <td className="py-2.5 px-4 font-bold text-slate-900">
                          <div className="flex flex-col">
                            <span className="text-[10px] text-indigo-600 font-mono">#{row.idCuenta}</span>
                            <span className="uppercase text-slate-900 flex items-center gap-0.5"><ChevronRight className="w-3 h-3 text-slate-400" /> {row.PACIENTE}</span>
                          </div>
                        </td>
                        <td className="py-2.5 px-4 text-center text-slate-500 font-medium">{row.FECHA_ENVIO}</td>
                        <td className="py-2.5 px-4 text-center text-slate-600 font-bold">{row.HORA_ENVIO}</td>
                        <td className="py-2.5 px-4 text-center">
                          <span className={`px-2.5 py-0.5 rounded-md text-[11px] font-black border ${formatearAlertaTiempo(row.INTERVALO_TIEMPO)}`}>
                            {row.INTERVALO_TIEMPO} hrs
                          </span>
                        </td>
                        <td className="py-2.5 px-4 text-center font-bold text-slate-700 text-[10px] uppercase">{row.SERVICIO_FINAL}</td>
                        <td className="py-2.5 px-4 text-center">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${row.LLEGO_AL_SERVICIO === 'SI' ? 'text-emerald-700 bg-emerald-50 border-emerald-200' : 'text-rose-700 bg-rose-50 border-rose-200 animate-pulse'}`}>
                            {row.LLEGO_AL_SERVICIO}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* PAGINACIÓN */}
                {totalPaginas > 1 && (
                  <div className="p-3 bg-slate-50 border-t flex items-center justify-between text-xs text-slate-500">
                    <div>Total en cola: <span className="font-bold text-slate-700">{datosTabla.length}</span> registros</div>
                    <div className="flex items-center gap-1.5 bg-white border rounded-lg p-0.5 shadow-2xs">
                      <button disabled={paginaActual === 1} onClick={() => setPaginaActual(p => p - 1)} className="p-1 hover:bg-slate-100 disabled:opacity-20"><ChevronLeft className="w-3.5 h-3.5" /></button>
                      <span className="font-bold text-slate-700 px-2">{paginaActual} de {totalPaginas}</span>
                      <button disabled={paginaActual === totalPaginas} onClick={() => setPaginaActual(p => p + 1)} className="p-1 hover:bg-slate-100 disabled:opacity-20"><ChevronRight className="w-3.5 h-3.5" /></button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* REPORTE DE ALERTAS */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 p-3 rounded-xl flex items-start gap-2.5 w-full">
        <div className="bg-blue-600 text-white p-1.5 rounded-lg shrink-0"><TrendingUp className="w-3.5 h-3.5" /></div>
        <div>
          <h4 className="text-[11px] font-bold text-blue-900 uppercase tracking-wide">Reporte Técnico de Flujo Asistencial</h4>
          <p className="text-xs text-slate-700 font-medium leading-relaxed">
            Se detectan <span className="font-bold text-amber-600">{kpis.pendientesFisicos} pacientes</span> esperando confirmación. Es necesario coordinar la liberación de camas físicas en los pisos de hospitalización correspondientes.
          </p>
        </div>
      </div>
    </div>
  );
}