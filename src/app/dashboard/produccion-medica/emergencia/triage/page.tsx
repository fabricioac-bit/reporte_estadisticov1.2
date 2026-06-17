'use client';

import React, { useState, useEffect, useCallback } from 'react';
import NavbarUpper from '@/components/layout/NavbarUpper';
import { Workbook } from 'exceljs';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  LabelList,
  Cell,
  PieChart,
  Pie
} from 'recharts';
import {
  Scale,
  Search,
  Eraser,
  Calendar,
  FileSpreadsheet,
  FileText,
  TrendingUp,
  AlertCircle,
  BarChart3,
  Table2,
  Heart,
  Activity,
  ShieldAlert,
  ChevronRight,
  ChevronLeft
} from 'lucide-react';

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-slate-200 p-2 rounded-lg shadow-lg max-w-xs pointer-events-none z-50">
        <p className="text-[10px] font-bold text-slate-900 uppercase tracking-wider mb-1 flex items-center gap-1">
          <span className="w-1.5 h-3 bg-blue-600 rounded-full inline-block"></span>
          {label || payload[0].payload.estado}
        </p>
        <div className="border-t border-slate-100 pt-1 space-y-1">
          {payload.map((item: any, index: number) => (
            <div key={index} className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-sm" style={{ backgroundColor: item.color || item.fill }} />
                <span className="text-[10px] text-slate-500">Pacientes:</span>
              </div>
              <span className="text-[10px] font-bold text-slate-800">{item.value} casos</span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

const obtenerFechasPredefinidasQuery = () => {
  const hoy = new Date();
  const yyyy = hoy.getFullYear();
  const mm = String(hoy.getMonth() + 1).padStart(2, '0');
  const dd = String(hoy.getDate()).padStart(2, '0');

  return {
    inicio: `${yyyy}-${mm}-01`,
    fin: `${yyyy}-${mm}-${dd}`
  };
};

export default function TriajeNutricionalPage() {
  const fechasPredefinidas = obtenerFechasPredefinidasQuery();

  const [loading, setLoading] = useState(false);
  const [fechaInicio, setFechaInicio] = useState(fechasPredefinidas.inicio);
  const [fechaFin, setFechaFin] = useState(fechasPredefinidas.fin);
  const [filtroServicio, setFiltroServicio] = useState('');
  const [tableFiltroNombre, setTableFiltroNombre] = useState('');
  const [tableFiltroDni, setTableFiltroDni] = useState('');
  const [tableFiltroEstado, setTableFiltroEstado] = useState('');
  const [listaServicios, setListaServicios] = useState<{ id: string | number; nombre: string }[]>([]);
  const [showServicioSuggestions, setShowServicioSuggestions] = useState(false);
  const [vistaActiva, setVistaActiva] = useState<'graficos' | 'tablas'>('graficos');

  const [kpis, setKpis] = useState({
    totalMes: 0,
    delgado: 0,
    normal: 0,
    sobrepeso: 0,
    obesidadTotal: 0
  });
  
  const [datosGrafico, setDatosGrafico] = useState<any[]>([]);
  const [datosTabla, setDatosTabla] = useState<any[]>([]);

  // Control secuencial de paginación local
  const [paginaActual, setPaginaActual] = useState(1);
  const filasPorPagina = 5; 

  const fetchDatosTriaje = useCallback(async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        fechaInicio,
        fechaFin,
      });

      // Global filter: servicio
      if (filtroServicio.trim()) queryParams.set('servicio', filtroServicio.trim());
      
      const res = await fetch(`/api/produccion-medica/emergencia/triage?${queryParams.toString()}`);
      if (!res.ok) throw new Error('Error al conectar con el servidor SIGH');
      const data = await res.json();
      
      if (data.kpis) setKpis(data.kpis);
      if (data.grafico) setDatosGrafico(data.grafico);
      if (data.tabla) setDatosTabla(data.tabla);
      
      setPaginaActual(1); 
    } catch (error) {
      console.error("❌ Error de red en módulo triaje:", error);
    } finally {
      setLoading(false);
    }
  }, [fechaInicio, fechaFin, filtroServicio]);

  useEffect(() => {
    fetchDatosTriaje();
  }, [fetchDatosTriaje]);

  // Cargar lista de servicios para autocomplete (triaje necesita TODOS los servicios)
  useEffect(() => {
    const cargarServiciosAPI = async () => {
      try {
        const res = await fetch('/api/produccion-medica/emergencia/servicios?all=true');
        if (!res.ok) throw new Error('Error cargando servicios');
        const data = await res.json();
        setListaServicios(data || []);
      } catch (error) {
        console.error('❌ Error al solicitar servicios:', error);
        setListaServicios([]);
      }
    };

    cargarServiciosAPI();
  }, []);

  const limpiarFiltrosCabecera = () => {
    const rangoMesActual = obtenerFechasPredefinidasQuery();
    setFechaInicio(rangoMesActual.inicio);
    setFechaFin(rangoMesActual.fin);
    setFiltroServicio('');
  };

  const obtenerColorHexEstado = (estado: string) => {
    const norm = estado.toLowerCase();
    if (norm.includes('delgado')) return '#3b82f6';
    if (norm.includes('normal')) return '#10b981';
    if (norm.includes('sobrepeso')) return '#f59e0b';
    if (norm.includes('i')) return '#f97316';
    if (norm.includes('ii')) return '#ef4444';
    return '#991b1b';
  };

  const obtenerEstilosBadge = (estado: string) => {
    const norm = estado.toLowerCase();
    if (norm.includes('normal')) return 'text-emerald-700 bg-emerald-50 border-emerald-100';
    if (norm.includes('delgado')) return 'text-blue-700 bg-blue-50 border-blue-100';
    if (norm.includes('sobrepeso')) return 'text-amber-700 bg-amber-50 border-amber-100';
    if (norm.includes('i')) return 'text-orange-700 bg-orange-50 border-orange-100';
    if (norm.includes('ii')) return 'text-red-600 bg-red-50 border-red-100';
    return 'text-red-900 bg-red-100 border-red-200 font-bold';
  };

  const totalPacientesGrafico = datosGrafico.reduce((acc, curr) => acc + (curr.pacientes || 0), 0);
  const totalMalnutricionExceso = kpis.sobrepeso + kpis.obesidadTotal;
  const tasaExceso = kpis.totalMes > 0 ? ((totalMalnutricionExceso / kpis.totalMes) * 100).toFixed(1) : '0.0';

  const filteredTabla = datosTabla.filter((row: any) => {
    let ok = true;
    if (tableFiltroNombre.trim()) ok = ok && String(row.paciente || '').toLowerCase().includes(tableFiltroNombre.toLowerCase());
    if (tableFiltroDni.trim()) ok = ok && String(row.dniPaciente || '').toLowerCase().includes(tableFiltroDni.toLowerCase());
    if (tableFiltroEstado.trim()) ok = ok && String(row.estadoNutricional || '').toLowerCase().includes(tableFiltroEstado.toLowerCase());
    return ok;
  });

  const exportarPDF = () => {
    if (filteredTabla.length === 0) return;

    const titulo = `Triaje_Nutricional_${fechaInicio}_a_${fechaFin}.pdf`;

    // Crear elemento temporal con la tabla para pasar a html2pdf
    const cont = document.createElement('div');
    cont.style.padding = '12px';
    cont.style.fontFamily = 'Arial, sans-serif';
    const tabla = document.createElement('table');
    tabla.style.width = '100%';
    tabla.style.borderCollapse = 'collapse';

    const thead = document.createElement('thead');
    thead.innerHTML = `
      <tr>
        <th style="border:1px solid #cbd5e1;padding:8px;background:#0f172a;color:#fff;font-size:12px">Paciente</th>
        <th style="border:1px solid #cbd5e1;padding:8px;background:#0f172a;color:#fff;font-size:12px">DNI</th>
        <th style="border:1px solid #cbd5e1;padding:8px;background:#0f172a;color:#fff;font-size:12px">Servicio</th>
        <th style="border:1px solid #cbd5e1;padding:8px;background:#0f172a;color:#fff;font-size:12px">Fecha</th>
        <th style="border:1px solid #cbd5e1;padding:8px;background:#0f172a;color:#fff;font-size:12px">Hora</th>
        <th style="border:1px solid #cbd5e1;padding:8px;background:#0f172a;color:#fff;font-size:12px">Talla</th>
        <th style="border:1px solid #cbd5e1;padding:8px;background:#0f172a;color:#fff;font-size:12px">Peso</th>
        <th style="border:1px solid #cbd5e1;padding:8px;background:#0f172a;color:#fff;font-size:12px">IMC</th>
        <th style="border:1px solid #cbd5e1;padding:8px;background:#0f172a;color:#fff;font-size:12px">Estado</th>
      </tr>
    `;
    tabla.appendChild(thead);

    const cuerpo = document.createElement('tbody');
    filteredTabla.forEach((row: any) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td style="border:1px solid #e2e8f0;padding:8px;font-size:11px">${row.paciente}</td>
        <td style="border:1px solid #e2e8f0;padding:8px;text-align:center;font-size:11px">${row.dniPaciente}</td>
        <td style="border:1px solid #e2e8f0;padding:8px;text-align:center;font-size:11px">${row.areaTriaje}</td>
        <td style="border:1px solid #e2e8f0;padding:8px;text-align:center;font-size:11px">${row.fechaTriaje}</td>
        <td style="border:1px solid #e2e8f0;padding:8px;text-align:center;font-size:11px">${row.horaTriaje}</td>
        <td style="border:1px solid #e2e8f0;padding:8px;text-align:center;font-size:11px">${Number(row.talla).toFixed(2)} cm</td>
        <td style="border:1px solid #e2e8f0;padding:8px;text-align:center;font-size:11px">${Number(row.peso).toFixed(2)} kg</td>
        <td style="border:1px solid #e2e8f0;padding:8px;text-align:center;font-size:11px">${Number(row.imc).toFixed(2)}</td>
        <td style="border:1px solid #e2e8f0;padding:8px;text-align:center;font-size:11px">${row.estadoNutricional}</td>
      `;
      cuerpo.appendChild(tr);
    });
    tabla.appendChild(cuerpo);
    cont.appendChild(tabla);

    const loadHtml2Pdf = () => new Promise<void>((resolve, reject) => {
      if ((window as any).html2pdf) return resolve();
      const s = document.createElement('script');
      s.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.9.2/html2pdf.bundle.min.js';
      s.onload = () => resolve();
      s.onerror = () => reject(new Error('No se pudo cargar html2pdf'));
      document.body.appendChild(s);
    });

    loadHtml2Pdf().then(() => {
      const opt = {
        margin:       10,
        filename:     titulo,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2 },
        jsPDF:        { unit: 'pt', format: 'a4', orientation: 'portrait' }
      };
      (window as any).html2pdf().set(opt).from(cont).save();
    }).catch((err) => {
      console.error('❌ Error generando PDF:', err);
      alert('No se pudo generar PDF. Intenta con el botón de imprimir del navegador.');
    });
  };

  const exportarExcel = async () => {
    if (filteredTabla.length === 0) return;

    const workbook = new Workbook();
    const hoja = workbook.addWorksheet('Triaje Nutricional');

    hoja.columns = [
      { header: 'Paciente', key: 'paciente', width: 35 },
      { header: 'DNI', key: 'dniPaciente', width: 18 },
      { header: 'Servicio', key: 'areaTriaje', width: 22 },
      { header: 'Fecha', key: 'fechaTriaje', width: 14 },
      { header: 'Hora', key: 'horaTriaje', width: 10 },
      { header: 'Talla (cm)', key: 'talla', width: 12 },
      { header: 'Peso (kg)', key: 'peso', width: 12 },
      { header: 'IMC', key: 'imc', width: 12 },
      { header: 'Estado Nutricional', key: 'estadoNutricional', width: 18 },
    ];

    hoja.addRows(filteredTabla.map((row: any) => ({
      paciente: row.paciente,
      dniPaciente: row.dniPaciente,
      areaTriaje: row.areaTriaje,
      fechaTriaje: row.fechaTriaje,
      horaTriaje: row.horaTriaje,
      talla: Number(row.talla).toFixed(2),
      peso: Number(row.peso).toFixed(2),
      imc: Number(row.imc).toFixed(2),
      estadoNutricional: row.estadoNutricional,
    })));

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const url = URL.createObjectURL(blob);
    const enlace = document.createElement('a');
    enlace.href = url;
    enlace.download = `Triaje_Nutricional_${fechaInicio}_a_${fechaFin}.xlsx`;
    enlace.click();
    setTimeout(() => URL.revokeObjectURL(url), 100);
  };

  // Fragmentación secuencial de los datos de la tabla (aplica filtros de tabla)
  const totalPaginas = Math.max(1, Math.ceil(filteredTabla.length / filasPorPagina));
  const indiceUltimoItem = paginaActual * filasPorPagina;
  const indicePrimerItem = indiceUltimoItem - filasPorPagina;
  const filasPaginaActual = filteredTabla.slice(indicePrimerItem, indiceUltimoItem);

  return (
    <div className="space-y-4 w-full text-slate-800">
      <NavbarUpper 
        title="Control de Triaje y Antropometría" 
        description="Auditoría epidemiológica de atenciones externas basadas en Talla, Peso e Índice de Masa Corporal (IMC)."
        onRefresh={fetchDatosTriaje}
        isRefreshLoading={loading}
      />

      {/* FILTROS GENERALES */}
      <div className="bg-white border border-slate-200 rounded-xl p-2.5 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3 w-full">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-2 w-full sm:w-auto flex-1">
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 h-[32px]">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <input type="date" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} className="bg-transparent text-xs font-semibold text-slate-600 outline-none w-full cursor-pointer" />
          </div>
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 h-[32px]">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <input type="date" value={fechaFin} onChange={(e) => setFechaFin(e.target.value)} className="bg-transparent text-xs font-semibold text-slate-600 outline-none w-full cursor-pointer" />
          </div>
          <div className="relative w-full">
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 h-[36px]">
              <BarChart3 className="w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                value={filtroServicio}
                placeholder="Servicio (escribe para buscar)"
                onChange={(e) => { setFiltroServicio(e.target.value); setShowServicioSuggestions(true); }}
                onFocus={() => setShowServicioSuggestions(true)}
                onBlur={() => setTimeout(() => setShowServicioSuggestions(false), 150)}
                className="bg-transparent text-xs font-semibold text-slate-600 outline-none w-full"
              />
            </div>

            {showServicioSuggestions && listaServicios.length > 0 && (
              <div className="absolute z-40 left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-md max-h-40 overflow-auto">
                {listaServicios
                  .filter((s) => s.nombre.toLowerCase().includes(filtroServicio.toLowerCase()))
                  .slice(0, 50)
                  .map((s) => (
                    <div
                      key={s.id}
                      onMouseDown={() => { setFiltroServicio(s.nombre); setShowServicioSuggestions(false); }}
                      className="px-3 py-2 text-sm hover:bg-slate-100 cursor-pointer"
                    >
                      {s.nombre}
                    </div>
                  ))}
                {listaServicios.filter((s) => s.nombre.toLowerCase().includes(filtroServicio.toLowerCase())).length === 0 && (
                  <div className="p-3 text-xs text-slate-500">No se encontraron servicios</div>
                )}
              </div>
            )}
          </div>
        
        </div>

        <div className="flex items-center gap-1.5 shrink-0 w-full sm:w-auto justify-end border-t sm:border-t-0 pt-2 sm:pt-0">
          <button onClick={limpiarFiltrosCabecera} className="p-1.5 hover:bg-slate-100 text-slate-500 rounded-md transition" title="Limpiar Filtros">
            <Eraser className="w-4 h-4" />
          </button>
          <button onClick={fetchDatosTriaje} className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-3 py-1.5 rounded-lg shadow-xs flex items-center gap-1 transition h-[32px]">
            <Search className="w-3.5 h-3.5" /> <span>Consultar</span>
          </button>
        </div>
      </div>

      {/* TARJETAS DE INDICADORES (KPIs) */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
        <div className="bg-gradient-to-br from-blue-600 to-blue-700 p-3 rounded-xl shadow-md flex items-center gap-2.5 transition-all duration-300 hover:-translate-y-1">
          <div className="p-2 bg-white/15 text-white rounded-lg"><Activity className="w-4 h-4" /></div>
          <div>
            <span className="text-[10px] font-bold text-white/80 uppercase tracking-wide block">Evaluados</span>
            <h4 className="text-base font-black text-white leading-tight">{kpis.totalMes} <span className="text-[9px] font-normal text-white/70">pts</span></h4>
          </div>
        </div>

        <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-3 rounded-xl shadow-md flex items-center gap-2.5 transition-all duration-300 hover:-translate-y-1">
          <div className="p-2 bg-white/15 text-white rounded-lg"><Heart className="w-4 h-4" /></div>
          <div>
            <span className="text-[10px] font-bold text-white/80 uppercase tracking-wide block">Normal</span>
            <h4 className="text-base font-black text-white leading-tight">{kpis.normal} <span className="text-[9px] font-normal text-white/70">casos</span></h4>
          </div>
        </div>

        <div className="bg-gradient-to-br from-amber-500 to-orange-600 p-3 rounded-xl shadow-md flex items-center gap-2.5 transition-all duration-300 hover:-translate-y-1">
          <div className="p-2 bg-white/15 text-white rounded-lg"><Scale className="w-4 h-4" /></div>
          <div>
            <span className="text-[10px] font-bold text-white/80 uppercase tracking-wide block">Sobrepeso</span>
            <h4 className="text-base font-black text-white leading-tight">{kpis.sobrepeso}</h4>
          </div>
        </div>

        <div className="bg-gradient-to-br from-red-600 to-rose-700 p-3 rounded-xl shadow-md flex items-center gap-2.5 transition-all duration-300 hover:-translate-y-1">
          <div className="p-2 bg-white/15 text-white rounded-lg"><ShieldAlert className="w-4 h-4" /></div>
          <div>
            <span className="text-[10px] font-bold text-white/80 uppercase tracking-wide block">Obesidad Total</span>
            <h4 className="text-base font-black text-white leading-tight">{kpis.obesidadTotal}</h4>
          </div>
        </div>

        <div className="bg-gradient-to-br from-slate-700 to-slate-800 p-2.5 rounded-xl shadow-md flex flex-col justify-center transition-all duration-300 hover:-translate-y-1">
          <span className="text-[10px] font-bold text-white/80 uppercase tracking-wide block mb-0.5">Exceso Clínico</span>
          <div className="flex items-center justify-between text-xs font-bold text-white">
            <span>Prevalencia: </span>
            <span className="text-amber-400 font-black text-sm">{tasaExceso}%</span>
          </div>
        </div>
      </div>

      {/* SELECTOR DE VISTAS */}
      <div className="flex items-center justify-between bg-slate-100 p-1 rounded-xl max-w-xs border border-slate-200 shadow-3xs">
        <button 
          onClick={() => setVistaActiva('graficos')} // <- Corrección sin tilde
          className={`flex items-center justify-center gap-1.5 flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all duration-200 ${
            vistaActiva === 'graficos' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5" />
          <span>Vista Gráficos</span>
        </button>
        <button 
          onClick={() => setVistaActiva('tablas')}
          className={`flex items-center justify-center gap-1.5 flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all duration-200 ${
            vistaActiva === 'tablas' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Table2 className="w-3.5 h-3.5" />
          <span>Vista Tablas</span>
        </button>
      </div>

      {vistaActiva === 'graficos' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 w-full">
          {/* Gráfico de Barras */}
          <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-2">
              <div>
                <h3 className="font-bold text-sm text-slate-900">Volumen por Clasificación Antropométrica</h3>
                <p className="text-[11px] text-slate-400">Distribución de atenciones según resultados del IMC.</p>
              </div>
            </div>

            <div className="w-full h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={datosGrafico} margin={{ top: 20, right: 5, left: -25, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="estado" stroke="#475569" fontSize={10} fontStyle="bold" tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={9} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="pacientes" radius={[4, 4, 0, 0]} barSize={40}>
                    <LabelList dataKey="pacientes" position="top" fill="#1e293b" fontSize={10} fontWeight="bold" />
                    {datosGrafico.map((entry: any, index: number) => (
                      <Cell key={`c-${index}`} fill={obtenerColorHexEstado(entry.estado)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Gráfico Estadístico de Dona */}
          <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-2">
                <div>
                  <h3 className="font-bold text-sm text-slate-900">Composición Epidemiológica de Carga</h3>
                  <p className="text-[11px] text-slate-400">Porcentaje proporcional capturado.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                <div className="sm:col-span-5 w-full h-[180px] flex items-center justify-center relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Tooltip content={<CustomTooltip />} />
                      <Pie data={datosGrafico} dataKey="pacientes" nameKey="estado" cx="50%" cy="50%" innerRadius={45} outerRadius={65} paddingAngle={2}>
                        {datosGrafico.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={obtenerColorHexEstado(entry.estado)} strokeWidth={1} stroke="#fff" />
                        ))}
                      </Pie>
                      <text x="50%" y="45%" textAnchor="middle" dominantBaseline="middle" className="fill-slate-400 text-[8px] font-bold uppercase tracking-wider">Total</text>
                      <text x="50%" y="58%" textAnchor="middle" dominantBaseline="middle" className="fill-slate-800 text-lg font-black">{totalPacientesGrafico}</text>
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="sm:col-span-7 space-y-1.5">
                  {datosGrafico.map((item: any, index: number) => (
                    <div key={index} className="bg-slate-50 border border-slate-150 p-2 rounded-lg flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: obtenerColorHexEstado(item.estado) }} />
                        <span className="font-semibold text-slate-700">{item.estado}</span>
                      </div>
                      <span className="font-bold text-slate-900">{item.pacientes || 0} <span className="text-[10px] text-slate-400 font-normal">pts</span></span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white border border-blue-100 rounded-xl shadow-sm overflow-hidden w-full border-t-4 border-t-blue-700">
          <div className="p-3.5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-b from-slate-50 to-white">
            <div>
              <h3 className="font-bold text-sm text-slate-900">Registros de Admisión Antropométrica SIGH</h3>
              <p className="text-[11px] text-slate-400">Auditoría cruzada de Talla y Peso extraídos en el periodo.</p>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-md px-2 py-1">
                <Search className="w-3.5 h-3.5 text-slate-400" />
                <input
                  placeholder="Filtrar nombre"
                  value={tableFiltroNombre}
                  onChange={(e) => setTableFiltroNombre(e.target.value)}
                  className="text-xs outline-none w-48 bg-transparent"
                />
              </div>

              <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-md px-2 py-1">
                <ShieldAlert className="w-3.5 h-3.5 text-slate-400" />
                <input
                  placeholder="Filtrar DNI"
                  value={tableFiltroDni}
                  onChange={(e) => setTableFiltroDni(e.target.value)}
                  className="text-xs outline-none w-32 bg-transparent"
                />
              </div>

              <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-md px-2 py-1">
                <Scale className="w-3.5 h-3.5 text-slate-400" />
                <select value={tableFiltroEstado} onChange={(e) => setTableFiltroEstado(e.target.value)} className="text-xs outline-none bg-transparent">
                  <option value="">Todos</option>
                  <option value="Delgado">Delgado</option>
                  <option value="Normal">Normal</option>
                  <option value="Sobrepeso">Sobrepeso</option>
                  <option value="Obesidad I">Obesidad I</option>
                  <option value="Obesidad II">Obesidad II</option>
                  <option value="Obesidad III">Obesidad III</option>
                </select>
              </div>

              <button type="button" onClick={() => { setTableFiltroNombre(''); setTableFiltroDni(''); setTableFiltroEstado(''); }} className="text-xs text-slate-600 px-2 py-1 border border-slate-200 rounded-md">Limpiar</button>
            </div>

            <div className="flex items-center gap-1">
              <button type="button" onClick={exportarPDF} className="p-1.5 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg text-xs font-bold transition flex items-center gap-1"><FileText className="w-3.5 h-3.5 text-red-500" /> <span>PDF</span></button>
              <button type="button" onClick={exportarExcel} className="p-1.5 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg text-xs font-bold transition flex items-center gap-1"><FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" /> <span>Excel</span></button>
            </div>
          </div>

          <div className="overflow-x-auto w-full">
            {datosTabla.length === 0 ? (
              <div className="p-8 flex items-center justify-center gap-3 bg-slate-50/50">
                <AlertCircle className="w-4 h-4 text-blue-600 shrink-0" />
                <p className="text-xs text-slate-600">No se encontraron registros de triajes válidos para este periodo.</p>
              </div>
            ) : (
              <>
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gradient-to-r from-blue-900 to-slate-900 text-white text-[10px] font-bold uppercase tracking-wider shadow-sm">
                      <th className="py-3 px-4 border-b border-blue-950">Paciente Triaje</th>
                      <th className="py-3 px-4 text-center border-b border-blue-950">DNI del paciente</th>
                      <th className="py-3 px-4 text-center border-b border-blue-950">Área de medicion</th>
                      <th className="py-3 px-4 text-center border-b border-blue-950">Fecha de triaje</th>
                      <th className="py-3 px-4 text-center border-b border-blue-950">Hora de ingreso</th>
                      <th className="py-3 px-4 text-center border-b border-blue-950">Talla cm</th>
                      <th className="py-3 px-4 text-center border-b border-blue-950">Peso kg</th>
                      <th className="py-3 px-4 text-center border-b border-blue-950 bg-blue-950/40">IMC Calculado</th>
                      <th className="py-3 px-4 text-center border-b border-blue-950">Estado Nutricional</th>
                    </tr>
                  </thead>
                  <tbody className="text-xs divide-y divide-blue-50/60 text-slate-700 bg-white">
                    {filasPaginaActual.map((row: any, idx: number) => {
                      const stringEstado = row.estadoNutricional || "Normal";
                      return (
                        <tr key={`${row.id || 'triaje'}-${idx}`} className="odd:bg-white even:bg-sky-50/20 hover:bg-sky-100/50 transition-colors">
                          <td className="py-2.5 px-4 font-bold text-blue-950 uppercase border-r border-slate-100/70">
                            <div className="flex items-center gap-1.5">
                              <ChevronRight className="w-3 h-3 text-slate-400" />
                              <span>{row.paciente}</span>
                            </div>
                          </td>
                          <td className="py-2.5 px-4 text-center text-slate-500 font-medium border-r border-slate-100/70">{row.dniPaciente}</td>
                          <td className="py-2.5 px-4 text-center text-slate-500 font-medium border-r border-slate-100/70">{row.areaTriaje}</td>
                          <td className="py-2.5 px-4 text-center text-slate-500 font-medium border-r border-slate-100/70">{row.fechaTriaje}</td>
                          <td className="py-2.5 px-4 text-center text-slate-500 font-medium border-r border-slate-100/70">{row.horaTriaje}</td>
                          <td className="py-2.5 px-4 text-center font-semibold text-slate-600 border-r border-slate-100/70">{Number(row.talla).toFixed(2)} </td>
                          <td className="py-2.5 px-4 text-center font-semibold text-slate-600 border-r border-slate-100/70">{Number(row.peso).toFixed(2)} </td>
                          <td className="py-2.5 px-4 text-center font-black text-blue-900 bg-blue-50/20 border-r border-slate-100/70">
                            {Number(row.imc).toFixed(2)}
                          </td>
                          <td className="py-2.5 px-4 text-center">
                            <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border uppercase ${obtenerEstilosBadge(stringEstado)}`}>
                              {stringEstado}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                {/* CONTROLES DE PAGINACIÓN INTERMEDIA (CENTRADOS PERFECTAMENTE) */}
                {totalPaginas > 1 && (
                  <div className="p-3 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-medium text-slate-500">
                    {/* Sección Izquierda */}
                    <div className="order-2 sm:order-1 text-center sm:text-left w-full sm:w-auto">
                      Total: <span className="font-bold text-slate-700">{datosTabla.length}</span> pacientes
                    </div>
                    
                    {/* Sección Intermedia / Centrada Exacta */}
                    <div className="order-1 sm:order-2 flex justify-center items-center w-full sm:w-auto">
                      <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg p-1 shadow-2xs">
                        <button
                          type="button"
                          onClick={() => setPaginaActual((prev) => Math.max(prev - 1, 1))}
                          disabled={paginaActual === 1}
                          className="p-1 hover:bg-slate-100 rounded text-slate-600 disabled:opacity-30 disabled:hover:bg-transparent transition flex items-center justify-center cursor-pointer disabled:cursor-not-allowed"
                        >
                          <ChevronLeft className="w-3.5 h-3.5" />
                        </button>

                        <span className="text-xs font-bold text-slate-700 px-2.5 select-none tracking-wide min-w-[38px] text-center">
                          {paginaActual} - {totalPaginas}
                        </span>

                        <button
                          type="button"
                          onClick={() => setPaginaActual((prev) => Math.min(prev + 1, totalPaginas))}
                          disabled={paginaActual === totalPaginas}
                          className="p-1 hover:bg-slate-100 rounded text-slate-600 disabled:opacity-30 disabled:hover:bg-transparent transition flex items-center justify-center cursor-pointer disabled:cursor-not-allowed"
                        >
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Espaciador Derecho Simétrico */}
                    <div className="hidden sm:block order-3 w-full sm:w-auto text-right text-[11px] text-slate-400">
                      Página secuencial
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* RECUADRO ANALÍTICO SPREAD INFERIOR */}
      <div className="bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-100 p-3 rounded-xl shadow-xs flex items-start gap-2.5 w-full">
        <div className="bg-indigo-600 text-white p-1.5 rounded-lg shrink-0 mt-0.5">
          <TrendingUp className="w-3.5 h-3.5" />
        </div>
        <div>
          <h4 className="text-[11px] font-bold text-indigo-900 uppercase tracking-wide">Análisis Epidemiológico Corporativo</h4>
          <p className="text-xs text-slate-700 font-medium leading-relaxed">
            Se registra un {tasaExceso}% de pacientes evaluados en el periodo con un peso superior a los parámetros recomendados para su talla. Clasificar and priorizar las alertas de Obesidad Tipo II y Mórbida para canalizar de forma preventiva soporte interdisciplinario.
          </p>
        </div>
      </div>
    </div>
  );
}