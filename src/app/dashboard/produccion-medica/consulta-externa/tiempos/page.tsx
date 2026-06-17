'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
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
} from 'recharts';
import {
  Search,
  ClipboardList,
  CheckCircle2,
  AlarmClock,
  Ban,
  BarChart3,
  Table2,
  FileText,
  FileSpreadsheet,
} from 'lucide-react';
import { Workbook } from 'exceljs';

interface IndicadoresConsultaExterna {
  CitasTotales: number;
  CitasAtendidas: number;
  CitasDesiertas: number;
  CitasEliminadas: number;
}

interface EvolucionMensual {
  mes: string;
  atendidas: number;
  desiertas: number;
  eliminadas: number;
}

interface EspecialidadTop {
  Especialidad: string;
  Eliminadas: number;
  SinAtender: number;
  TotalCitas: number;
}

interface TiemposData {
  indicadores: IndicadoresConsultaExterna;
  evolucion: EvolucionMensual[];
  topEliminadas: EspecialidadTop[];
  topSinAtender: EspecialidadTop[];
}

const hoy = new Date();
const primerDiaMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
const formatoFecha = (d: Date) => d.toISOString().split('T')[0];

export default function TiemposPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fechaInicio, setFechaInicio] = useState(formatoFecha(primerDiaMes));
  const [fechaFin, setFechaFin] = useState(formatoFecha(hoy));
  const [data, setData] = useState<TiemposData | null>(null);
  const [vistaActiva, setVistaActiva] = useState<'graficos' | 'tablas'>('graficos');

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get('/api/tiempos-consulta-externa', {
        params: { fechaInicio, fechaFin },
      });
      if (res.data.success) {
        setData(res.data.data);
      } else {
        setError(res.data.mensaje || 'No se pudo cargar los indicadores.');
      }
    } catch (err: any) {
      console.error('Error al cargar indicadores:', err);
      setError(err.response?.data?.mensaje || 'Error al cargar indicadores.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const topEliminadasOrdenado = [...(data?.topEliminadas ?? [])].sort((a, b) => b.Eliminadas - a.Eliminadas);
  const topSinAtenderOrdenado = [...(data?.topSinAtender ?? [])].sort((a, b) => b.SinAtender - a.SinAtender);

  // 📊 EXPORTAR PDF
  const exportarPDF = () => {
    if (!data) return;

    const loadHtml2Pdf = () => new Promise<void>((resolve, reject) => {
      if ((window as any).html2pdf) return resolve();
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.9.2/html2pdf.bundle.min.js';
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Error al cargar html2pdf'));
      document.head.appendChild(script);
    });

    loadHtml2Pdf().then(() => {
      const container = document.createElement('div');
      container.style.padding = '12px';
      container.style.fontFamily = 'Arial, sans-serif';
      container.innerHTML = `
        <h2 style="text-align: center; margin-bottom: 20px; font-size: 18px; font-weight: bold;">
          Indicadores de Consulta Externa
        </h2>
        <p style="text-align: center; margin-bottom: 20px; font-size: 12px; color: #666;">
          Período: ${fechaInicio} al ${fechaFin}
        </p>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
          <thead>
            <tr style="background-color: #1d4ed8; color: white;">
              <th style="border: 1px solid #ccc; padding: 8px; text-align: left; font-weight: bold;">Especialidad</th>
              <th style="border: 1px solid #ccc; padding: 8px; text-align: center; font-weight: bold;">Eliminadas</th>
              <th style="border: 1px solid #ccc; padding: 8px; text-align: center; font-weight: bold;">Total Citas</th>
            </tr>
          </thead>
          <tbody>
            ${topEliminadasOrdenado.map(item => `
              <tr>
                <td style="border: 1px solid #ccc; padding: 8px;">${item.Especialidad}</td>
                <td style="border: 1px solid #ccc; padding: 8px; text-align: center; color: #dc2626; font-weight: bold;">${item.Eliminadas}</td>
                <td style="border: 1px solid #ccc; padding: 8px; text-align: center;">${item.TotalCitas}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        <h3 style="margin-top: 30px; margin-bottom: 15px; font-size: 14px; font-weight: bold;">Especialidades con más citas desiertas</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="background-color: #1d4ed8; color: white;">
              <th style="border: 1px solid #ccc; padding: 8px; text-align: left; font-weight: bold;">Especialidad</th>
              <th style="border: 1px solid #ccc; padding: 8px; text-align: center; font-weight: bold;">Desiertas</th>
              <th style="border: 1px solid #ccc; padding: 8px; text-align: center; font-weight: bold;">Total Citas</th>
            </tr>
          </thead>
          <tbody>
            ${topSinAtenderOrdenado.map(item => `
              <tr>
                <td style="border: 1px solid #ccc; padding: 8px;">${item.Especialidad}</td>
                <td style="border: 1px solid #ccc; padding: 8px; text-align: center; color: #f59e0b; font-weight: bold;">${item.SinAtender}</td>
                <td style="border: 1px solid #ccc; padding: 8px; text-align: center;">${item.TotalCitas}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
      const opt = {
        margin: 10,
        filename: `Indicadores_Consulta_Externa_${fechaInicio}_a_${fechaFin}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'pt', format: 'a4', orientation: 'portrait' }
      };
      (window as any).html2pdf().set(opt).from(container).save();
    });
  };

  // 📈 EXPORTAR EXCEL
  const exportarExcel = async () => {
    if (!data) return;

    const workbook = new Workbook();
    const hoja = workbook.addWorksheet('Especialidades Eliminadas');

    hoja.columns = [
      { header: 'Especialidad', key: 'especialidad', width: 35 },
      { header: 'Citas Eliminadas', key: 'eliminadas', width: 18 },
      { header: 'Total Citas', key: 'total', width: 15 },
    ];

    const filaCabecera = hoja.addRow(['Especialidad', 'Citas Eliminadas', 'Total Citas']);
    filaCabecera.eachCell((cell) => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1D4ED8' } };
      cell.font = { color: { argb: 'FFFFFFFF' }, bold: true };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
    });

    topEliminadasOrdenado.forEach((item) => {
      hoja.addRow([item.Especialidad, item.Eliminadas, item.TotalCitas]);
    });

    const hojaDesiertas = workbook.addWorksheet('Especialidades Desiertas');
    hojaDesiertas.columns = [
      { header: 'Especialidad', key: 'especialidad', width: 35 },
      { header: 'Citas Desiertas', key: 'desiertas', width: 18 },
      { header: 'Total Citas', key: 'total', width: 15 },
    ];

    const filaCabeceraDesiertas = hojaDesiertas.addRow(['Especialidad', 'Citas Desiertas', 'Total Citas']);
    filaCabeceraDesiertas.eachCell((cell) => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1D4ED8' } };
      cell.font = { color: { argb: 'FFFFFFFF' }, bold: true };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
    });

    topSinAtenderOrdenado.forEach((item) => {
      hojaDesiertas.addRow([item.Especialidad, item.SinAtender, item.TotalCitas]);
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const url = URL.createObjectURL(blob);
    const enlace = document.createElement('a');
    enlace.href = url;
    enlace.download = `Indicadores_Consulta_Externa_${fechaInicio}_a_${fechaFin}.xlsx`;
    enlace.click();
    setTimeout(() => URL.revokeObjectURL(url), 100);
  };

  return (
    <div className="flex flex-col h-full w-full">
      {/* CABECERA FIJA */}
      <div className="sticky top-0 z-20 bg-slate-50/80 backdrop-blur-xl border-b border-slate-100 pb-4">
        <NavbarUpper
          title="Indicadores de Consulta Externa"
          description="Seguimiento de citas totales, atendidas, desiertas y eliminadas."
          onRefresh={loadData}
          isRefreshLoading={loading}
        />

        <div className="px-1 space-y-4">
          <div className="bg-white border border-slate-100 p-5 rounded-3xl shadow-sm grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Fecha Inicio</label>
              <input
                type="date"
                value={fechaInicio}
                onChange={(e) => setFechaInicio(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-500"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Fecha Fin</label>
              <input
                type="date"
                value={fechaFin}
                onChange={(e) => setFechaFin(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-500"
              />
            </div>
            <button
              onClick={loadData}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm px-4 py-2.5 rounded-xl shadow-md shadow-blue-500/10 flex items-center justify-center gap-2 transition"
            >
              <Search className="w-4 h-4" />
              <span>Filtrar</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <KpiCard title="Citas Totales" value={data?.indicadores.CitasTotales ?? 0} icon={<ClipboardList />} color="text-blue-600" bg="bg-blue-50" />
            <KpiCard title="Citas Atendidas" value={data?.indicadores.CitasAtendidas ?? 0} icon={<CheckCircle2 />} color="text-emerald-600" bg="bg-emerald-50" />
            <KpiCard title="Citas Desiertas" value={data?.indicadores.CitasDesiertas ?? 0} icon={<AlarmClock />} color="text-amber-600" bg="bg-amber-50" />
            <KpiCard title="Citas Eliminadas" value={data?.indicadores.CitasEliminadas ?? 0} icon={<Ban />} color="text-red-600" bg="bg-red-50" />
          </div>

          {/* BOTONES DE VISTA */}
          <div className="flex gap-3">
            <button
              onClick={() => setVistaActiva('graficos')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition ${
                vistaActiva === 'graficos'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Gráficos</span>
            </button>
            <button
              onClick={() => setVistaActiva('tablas')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition ${
                vistaActiva === 'tablas'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Table2 className="w-4 h-4" />
              <span>Tablas</span>
            </button>

            {/* BOTONES DE EXPORTACIÓN (Solo en vista tablas) */}
            {vistaActiva === 'tablas' && (
              <div className="ml-auto flex items-center gap-2">
                <button
                  onClick={exportarPDF}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm bg-white border border-red-200 text-red-600 hover:bg-red-50 transition"
                >
                  <FileText className="w-4 h-4" />
                  <span>PDF</span>
                </button>
                <button
                  onClick={exportarExcel}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm bg-white border border-emerald-200 text-emerald-600 hover:bg-emerald-50 transition"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>Excel</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* CONTENIDO SCROLLEABLE */}
      <div className="flex-1 overflow-y-auto space-y-6 pt-4 pb-6">
        {loading ? (
          <div className="min-h-[300px] flex flex-col items-center justify-center bg-white border border-slate-100 rounded-3xl p-10 shadow-sm">
            <div className="w-10 h-10 border-4 border-slate-100 border-t-blue-500 rounded-full animate-spin mb-3"></div>
            <p className="text-slate-500 text-sm font-semibold">Cargando indicadores...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-100 rounded-3xl p-5 text-red-700 text-sm font-semibold">
            {error}
          </div>
        ) : data ? (
          <>
            {/* VISTA: GRÁFICOS */}
            {vistaActiva === 'graficos' && (
              <>
                <div className="bg-white border border-slate-100 p-6 rounded-3xl shadow-sm space-y-4">
                  <div>
                    <h3 className="font-extrabold text-lg text-slate-900">Evolución mensual</h3>
                    <p className="text-xs text-slate-400 mt-0.5">Del {fechaInicio} al {fechaFin}</p>
                  </div>
                  <div className="w-full h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={data.evolucion} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="mes" stroke="#94a3b8" fontSize={12} tickLine={false} />
                        <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} allowDecimals={false} />
                        <Tooltip contentStyle={{ background: '#0f172a', color: '#fff', borderRadius: '12px', border: 'none' }} />
                        <Legend />
                        <Bar dataKey="atendidas" fill="#10b981" radius={[4, 4, 0, 0]} name="Atendidas" label={{ position: 'top', fontSize: 10, fill: '#10b981', fontWeight: 'bold' }} />
                        <Bar dataKey="desiertas" fill="#f59e0b" radius={[4, 4, 0, 0]} name="Desiertas" label={{ position: 'top', fontSize: 10, fill: '#f59e0b', fontWeight: 'bold' }} />
                        <Bar dataKey="eliminadas" fill="#ef4444" radius={[4, 4, 0, 0]} name="Eliminadas" label={{ position: 'top', fontSize: 10, fill: '#ef4444', fontWeight: 'bold' }} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </>
            )}

            {/* VISTA: TABLAS */}
            {vistaActiva === 'tablas' && (
              <>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-white border border-slate-100 rounded-3xl shadow-sm overflow-hidden">
                    <div className="p-5 border-b border-slate-100">
                      <h3 className="font-extrabold text-lg text-slate-900">Especialidades que más eliminaron</h3>
                      <p className="text-xs text-slate-400 mt-0.5">Citas con idEstadoAtencion = 0.</p>
                      <div className="mt-2">
                        <span className="text-3xl font-black text-red-600">{data.indicadores.CitasEliminadas}</span>
                        <span className="text-xs text-slate-400 ml-2">eliminadas en total</span>
                      </div>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-sm">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 text-xs font-bold uppercase tracking-wider">
                            <th className="py-3 px-4">#</th>
                            <th className="py-3 px-4">Especialidad</th>
                            <th className="py-3 px-4 text-center">Eliminadas</th>
                            <th className="py-3 px-4 text-center">Total Citas</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 text-slate-700">
                          {topEliminadasOrdenado.length === 0 ? (
                            <tr>
                              <td colSpan={4} className="py-10 text-center text-slate-400 text-sm">No hay datos.</td>
                            </tr>
                          ) : (
                            topEliminadasOrdenado.map((item, i) => (
                              <tr key={i} className="hover:bg-slate-50/80 transition-colors">
                                <td className="py-3 px-4 font-bold text-slate-400">{i + 1}</td>
                                <td className="py-3 px-4 font-bold text-slate-800">{item.Especialidad}</td>
                                <td className="py-3 px-4 text-center font-black text-red-600">{item.Eliminadas}</td>
                                <td className="py-3 px-4 text-center font-semibold text-slate-700">{item.TotalCitas}</td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="bg-white border border-slate-100 rounded-3xl shadow-sm overflow-hidden">
                    <div className="p-5 border-b border-slate-100">
                      <h3 className="font-extrabold text-lg text-slate-900">Especialidades con más citas desiertas</h3>
                      <p className="text-xs text-slate-400 mt-0.5">Citas que nunca fueron atendidas.</p>
                      <div className="mt-2">
                        <span className="text-3xl font-black text-amber-600">{data.indicadores.CitasDesiertas}</span>
                        <span className="text-xs text-slate-400 ml-2">desiertas en total</span>
                      </div>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-sm">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 text-xs font-bold uppercase tracking-wider">
                            <th className="py-3 px-4">#</th>
                            <th className="py-3 px-4">Especialidad</th>
                            <th className="py-3 px-4 text-center">Desiertas</th>
                            <th className="py-3 px-4 text-center">Total Citas</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 text-slate-700">
                          {topSinAtenderOrdenado.length === 0 ? (
                            <tr>
                              <td colSpan={4} className="py-10 text-center text-slate-400 text-sm">No hay datos.</td>
                            </tr>
                          ) : (
                            topSinAtenderOrdenado.map((item, i) => (
                              <tr key={i} className="hover:bg-slate-50/80 transition-colors">
                                <td className="py-3 px-4 font-bold text-slate-400">{i + 1}</td>
                                <td className="py-3 px-4 font-bold text-slate-800">{item.Especialidad}</td>
                                <td className="py-3 px-4 text-center font-black text-amber-600">{item.SinAtender}</td>
                                <td className="py-3 px-4 text-center font-semibold text-slate-700">{item.TotalCitas}</td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </>
            )}
          </>
        ) : null}
      </div>
    </div>
  );
}

function KpiCard({ title, value, icon, color, bg }: { title: string; value: number; icon: React.ReactNode; color: string; bg: string }) {
  return (
    <div className="bg-white border border-slate-100 p-5 rounded-3xl shadow-sm flex items-center justify-between">
      <div className="space-y-1">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">{title}</span>
        <h3 className="text-2xl font-black text-slate-800">{value}</h3>
      </div>
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${bg} ${color}`}>
        {icon}
      </div>
    </div>
  );
}