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
  Users,
  UserX,
  Trash2,
  Clock,
  Search,
  Eraser,
  Calendar,
  Layers,
  FileSpreadsheet,
  FileText,
  TrendingUp,
  AlertCircle,
  BarChart3,
  Table2
} from 'lucide-react';

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-slate-200 p-2 rounded-lg shadow-lg max-w-xs pointer-events-none z-50">
        <p className="text-[10px] font-bold text-slate-900 uppercase tracking-wider mb-1 flex items-center gap-1">
          <span className="w-1.5 h-3 bg-blue-600 rounded-full inline-block"></span>
          {label || payload[0].name || payload[0].payload.prioridadName}
        </p>
        <div className="border-t border-slate-100 pt-1 space-y-1">
          {payload.map((item: any, index: number) => (
            <div key={index} className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-sm" style={{ backgroundColor: item.color || item.fill }} />
                <span className="text-[10px] text-slate-500 capitalize">
                  {item.name === 'pacientes' || item.name === 'Cantidad' ? 'Pacientes' : item.name}:
                </span>
              </div>
              <span className="text-[10px] font-bold text-slate-800">{item.value} pts</span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

const obtenerFechasMesActual = () => {
  const ahora = new Date();
  const anio = ahora.getFullYear();
  const mes = String(ahora.getMonth() + 1).padStart(2, '0');
  const diaHoy = String(ahora.getDate()).padStart(2, '0');
  
  return {
    inicio: `${anio}-${mes}-01`, 
    fin: `${anio}-${mes}-${diaHoy}`   
  };
};

export default function FrecuenciaAtencionesPage() {
  const fechasPredefinidas = obtenerFechasMesActual();

  const [loading, setLoading] = useState(false);
  const [fechaInicio, setFechaInicio] = useState(fechasPredefinidas.inicio);
  const [fechaFin, setFechaFin] = useState(fechasPredefinidas.fin);
  const [servicio, setServicio] = useState('Todos');
  
  const [listaServicios, setListaServicios] = useState<{ id: string | number; nombre: string }[]>([]);
  
  const [prioridadFiltro, setPrioridadFiltro] = useState('');
  const [turnoFiltro, setTurnoFiltro] = useState('');
  const [busquedaEjecutada, setBusquedaEjecutada] = useState(false);
  const [vistaActiva, setVistaActiva] = useState<'graficos' | 'tablas'>('graficos');

  const [kpis, setKpis] = useState({
    totalMes: 0,
    noAtendidos: 0,
    eliminados: 0,
    turnoMayorDemanda: 'Mañana',
    altaEnServicio: 0,
    sinAlta: 0
  });
  
  const [datosGrafico, setDatosGrafico] = useState<any[]>([]);
  const [datosTurnos, setDatosTurnos] = useState<any[]>([]);
  const [datosMedicosServicio, setDatosMedicosServicio] = useState<any[]>([]);
  const [resumenDemanda, setResumenDemanda] = useState<string>(" ");
  const [resumenIngresos, setResumenIngresos] = useState<any[]>([]);

  const esVistaGeneral = servicio === 'Todos';

  // 📈 DISTRIBUCIÓN ASISTENCIAL SIN DUPLICADOS EN P1
  const obtenerDatosGraficoProcesados = () => {
    if (esVistaGeneral) return datosGrafico;
    if (!datosGrafico || datosGrafico.length === 0) return [];

    const itemServicio = datosGrafico[0];
    const totalPacientes = Number(itemServicio.pacientes ?? 0);
    const tieneFiltroActivo = ['P1', 'P2', 'P3', 'P4'].includes(prioridadFiltro);

    return [
      { 
        prioridadName: 'P1 (Rojo)', 
        Cantidad: tieneFiltroActivo ? (prioridadFiltro === 'P1' ? totalPacientes : 0) : Number(itemServicio.p1 ?? 0) 
      },
      { 
        prioridadName: 'P2 (Naranja)', 
        Cantidad: tieneFiltroActivo ? (prioridadFiltro === 'P2' ? totalPacientes : 0) : Number(itemServicio.p2 ?? 0) 
      },
      { 
        prioridadName: 'P3 (Amarillo)', 
        Cantidad: tieneFiltroActivo ? (prioridadFiltro === 'P3' ? totalPacientes : 0) : Number(itemServicio.p3 ?? 0) 
      },
      { 
        prioridadName: 'P4 (Verde)', 
        Cantidad: tieneFiltroActivo ? (prioridadFiltro === 'P4' ? totalPacientes : 0) : Number(itemServicio.p4 ?? 0) 
      }
    ];
  };

  const datosGraficoAdaptados = obtenerDatosGraficoProcesados();

  // Catálogo inicial de la API
  useEffect(() => {
    const cargarServiciosAPI = async () => {
      try {
        const res = await fetch('/api/produccion-medica/emergencia/servicios');
        if (res.ok) {
          const data = await res.json();
          setListaServicios(data);
        }
      } catch (error) {
        console.error("❌ Error al solicitar servicios:", error);
      }
    };
    cargarServiciosAPI();
  }, []);

  // Función asíncrona centralizadora
  const fetchDatosHospitalarios = useCallback(async (ignorarRestriccionTabla = false) => {
    try {
      setLoading(true);

      if (!esVistaGeneral && !ignorarRestriccionTabla && (!prioridadFiltro || !turnoFiltro)) {
        setResumenIngresos([]);
        setBusquedaEjecutada(false);
      }

      const queryParams = new URLSearchParams({ 
        fechaInicio, 
        fechaFin, 
        servicio,
        ...(prioridadFiltro && { prioridad: prioridadFiltro }),
        ...(turnoFiltro && turnoFiltro !== 'Todos' && { turno: turnoFiltro })
      });
      
      const res = await fetch(`/api/produccion-medica/emergencia/atenciones?${queryParams.toString()}`);
      if (!res.ok) throw new Error('Error al conectar con el servidor');
      const data = await res.json();
      
      if (data.kpis) setKpis(data.kpis);
      if (data.grafico) setDatosGrafico(data.grafico);
      if (data.turnos) setDatosTurnos(data.turnos);
      if (data.resumenDemanda) setResumenDemanda(data.resumenDemanda);
      if (data.tabla) setResumenIngresos(data.tabla);

      if (!esVistaGeneral && (ignorarRestriccionTabla || (prioridadFiltro && turnoFiltro))) {
        setBusquedaEjecutada(true);
      }
    } catch (error) {
      console.error("❌ Error de red:", error);
    } finally {
      setLoading(false);
    }
  }, [fechaInicio, fechaFin, servicio, prioridadFiltro, turnoFiltro, esVistaGeneral]);

  // Actualización inmediata por reactividad al alternar especialidades en cabecera
  useEffect(() => {
    setPrioridadFiltro('');
    setTurnoFiltro('');
    setBusquedaEjecutada(false);
    
    const queryParams = new URLSearchParams({ fechaInicio, fechaFin, servicio });
    fetch(`/api/produccion-medica/emergencia/atenciones?${queryParams.toString()}`)
      .then(res => res.json())
      .then(data => {
        if (data.kpis) setKpis(data.kpis);
        if (data.grafico) setDatosGrafico(data.grafico);
        if (data.turnos) setDatosTurnos(data.turnos);
        if (data.resumenDemanda) setResumenDemanda(data.resumenDemanda);
        if (esVistaGeneral && data.tabla) {
          setResumenIngresos(data.tabla);
        } else {
          setResumenIngresos([]);
        }
      })
      .catch(err => console.error("Error al actualizar la base:", err));

  }, [servicio]);

  // 📋 CARGAR MÉDICOS DEL SERVICIO CUANDO ESTAMOS EN VISTA TABLAS
  useEffect(() => {
    if (vistaActiva === 'tablas' && !esVistaGeneral) {
      const queryParams = new URLSearchParams({ fechaInicio, fechaFin, servicio });
      fetch(`/api/produccion-medica/emergencia/atenciones?${queryParams.toString()}`)
        .then(res => res.json())
        .then(data => {
          if (data.tabla) {
            // Filtrar solo médicos con atendidos > 0
            const medicosFiltrados = data.tabla.filter((row: any) => {
              const atendidosReal = Number(row.AtendidosReal ?? row.pacientes ?? 0);
              return atendidosReal > 0;
            });
            setDatosMedicosServicio(medicosFiltrados);
          }
        })
        .catch(err => console.error("Error al cargar médicos del servicio:", err));
    } else {
      setDatosMedicosServicio([]);
    }
  }, [vistaActiva, servicio, fechaInicio, fechaFin, esVistaGeneral]);

  const manejarBuscarMedicosTabla = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prioridadFiltro || !turnoFiltro) return;
    fetchDatosHospitalarios(true);
  };

  // 🔄 LIMPIEZA ASÍNCRONA DINÁMICA
  const limpiarFiltrosTabla = () => {
    setPrioridadFiltro('');
    setTurnoFiltro('');
    setBusquedaEjecutada(false);
    
    const queryParams = new URLSearchParams({ fechaInicio, fechaFin, servicio });
    fetch(`/api/produccion-medica/emergencia/atenciones?${queryParams.toString()}`)
      .then(res => res.json())
      .then(data => {
        if (data.kpis) setKpis(data.kpis);
        if (data.grafico) setDatosGrafico(data.grafico);
        if (data.turnos) setDatosTurnos(data.turnos);
        if (data.resumenDemanda) setResumenDemanda(data.resumenDemanda);
        setResumenIngresos([]);
      })
      .catch(err => console.error("Error de recarga al borrar filtros:", err));
  };

  const obtenerColorHexTurno = (turno: string) => {
    if (turno === 'Mañana') return '#00cee6'; 
    if (turno === 'Tarde') return '#445ee2';  
    return '#0b2253';                          
  };

  const totalCargaPacientes = datosTurnos.reduce((acc, curr) => acc + (curr.pacientes || 0), 0);

  const manejarLimpiezaFiltrosCabecera = () => {
    const defaultDates = obtenerFechasMesActual();
    setFechaInicio(defaultDates.inicio);
    setFechaFin(defaultDates.fin);
    setServicio('Todos');
    setPrioridadFiltro('');
    setTurnoFiltro('');
    setBusquedaEjecutada(false);
  };

  // 📊 EXPORTAR PDF - TABLA DE SERVICIOS O MÉDICOS
  const exportarPDF = () => {
    if (resumenIngresos.length === 0) return;

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

      const titulo = esVistaGeneral ? 'Servicios de Emergencia' : `Médicos - ${servicio}`;
      const encabezadoHtml = esVistaGeneral
        ? `
            <table style="width: 100%; border-collapse: collapse;">
              <thead>
                <tr style="background-color: #1d4ed8; color: white;">
                  <th style="border: 1px solid #ccc; padding: 8px; text-align: left;">Tópico</th>
                  <th style="border: 1px solid #ccc; padding: 8px; text-align: center;">Atendidos</th>
                  <th style="border: 1px solid #ccc; padding: 8px; text-align: center;">Fugas</th>
                  <th style="border: 1px solid #ccc; padding: 8px; text-align: center;">Anulados</th>
                  <th style="border: 1px solid #ccc; padding: 8px; text-align: center;">Efectividad</th>
                  <th style="border: 1px solid #ccc; padding: 8px; text-align: center;">Turno</th>
                </tr>
              </thead>
              <tbody>
                ${resumenIngresos.map((row: any) => {
                  const totalPacientes = Number(row.pacientes ?? 0);
                  const totalFugas = Number(row.fugas ?? 0);
                  const totalAnulados = Number(row.anulados ?? 0);
                  const volumenTotal = totalPacientes + totalFugas + totalAnulados;
                  const tasa = volumenTotal === 0 ? '0.0%' : `${((1 - ((totalFugas + totalAnulados) / volumenTotal)) * 100).toFixed(1)}%`;
                  return `
                    <tr>
                      <td style="border: 1px solid #ccc; padding: 8px;">${row.servicio}</td>
                      <td style="border: 1px solid #ccc; padding: 8px; text-align: center; font-weight: bold;">${totalPacientes}</td>
                      <td style="border: 1px solid #ccc; padding: 8px; text-align: center; color: #dc2626; font-weight: bold;">${totalFugas}</td>
                      <td style="border: 1px solid #ccc; padding: 8px; text-align: center;">${totalAnulados}</td>
                      <td style="border: 1px solid #ccc; padding: 8px; text-align: center; font-weight: bold;">${tasa}</td>
                      <td style="border: 1px solid #ccc; padding: 8px; text-align: center;">${row.turnoCritico || 'Sin datos'}</td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          `
        : `
            <table style="width: 100%; border-collapse: collapse;">
              <thead>
                <tr style="background-color: #1d4ed8; color: white;">
                  <th style="border: 1px solid #ccc; padding: 8px; text-align: left;">Médico</th>
                  <th style="border: 1px solid #ccc; padding: 8px; text-align: center;">Prioridad</th>
                  <th style="border: 1px solid #ccc; padding: 8px; text-align: center;">Atendidos</th>
                  <th style="border: 1px solid #ccc; padding: 8px; text-align: center;">Fugas</th>
                  <th style="border: 1px solid #ccc; padding: 8px; text-align: center;">Turno</th>
                </tr>
              </thead>
              <tbody>
                ${resumenIngresos.map((row: any) => `
                  <tr>
                    <td style="border: 1px solid #ccc; padding: 8px;">${row.Medico || 'Especialista Clínico'}</td>
                    <td style="border: 1px solid #ccc; padding: 8px; text-align: center; font-weight: bold;">${row.Prioridad || 'P3'}</td>
                    <td style="border: 1px solid #ccc; padding: 8px; text-align: center; font-weight: bold;">${Number(row.AtendidosReal ?? 0)}</td>
                    <td style="border: 1px solid #ccc; padding: 8px; text-align: center; color: #dc2626; font-weight: bold;">${Number(row.FugasReal ?? 0)}</td>
                    <td style="border: 1px solid #ccc; padding: 8px; text-align: center;">${row.Turno || 'Sin datos'}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          `;

      container.innerHTML = `
        <h2 style="text-align: center; margin-bottom: 20px; font-size: 18px; font-weight: bold;">
          Frecuencia de Atenciones en Emergencia - ${titulo}
        </h2>
        <p style="text-align: center; margin-bottom: 20px; font-size: 12px; color: #666;">
          Período: ${fechaInicio} al ${fechaFin}
        </p>
        ${encabezadoHtml}
      `;

      const opt = {
        margin: 10,
        filename: `Atenciones_Emergencia_${esVistaGeneral ? 'Servicios' : servicio}_${fechaInicio}_a_${fechaFin}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'pt', format: 'a4', orientation: 'portrait' }
      };
      (window as any).html2pdf().set(opt).from(container).save();
    });
  };

  // 📈 EXPORTAR EXCEL - TABLA DE SERVICIOS O MÉDICOS
  const exportarExcel = async () => {
    if (resumenIngresos.length === 0) return;

    const workbook = new Workbook();
    const hoja = workbook.addWorksheet(esVistaGeneral ? 'Servicios' : 'Médicos');

    if (esVistaGeneral) {
      hoja.columns = [
        { header: 'Tópico de Emergencia', key: 'servicio', width: 30 },
        { header: 'Pacientes Atendidos', key: 'atendidos', width: 18 },
        { header: 'Pacientes No Atendidos (Fugas)', key: 'fugas', width: 25 },
        { header: 'Anulados', key: 'anulados', width: 15 },
        { header: 'Tasa de Efectividad', key: 'efectividad', width: 18 },
        { header: 'Turno de Carga', key: 'turno', width: 18 },
      ];

      const filaCabecera = hoja.addRow(Array.from(hoja.columns || []).map((col: any) => col.header));
      filaCabecera.eachCell((cell) => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1D4ED8' } };
        cell.font = { color: { argb: 'FFFFFFFF' }, bold: true };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
      });

      resumenIngresos.forEach((row: any) => {
        const totalPacientes = Number(row.pacientes ?? 0);
        const totalFugas = Number(row.fugas ?? 0);
        const totalAnulados = Number(row.anulados ?? 0);
        const volumenTotal = totalPacientes + totalFugas + totalAnulados;
        const tasa = volumenTotal === 0 ? '0.0%' : `${((1 - ((totalFugas + totalAnulados) / volumenTotal)) * 100).toFixed(1)}%`;
        hoja.addRow([row.servicio, totalPacientes, totalFugas, totalAnulados, tasa, row.turnoCritico || 'Sin datos']);
      });
    } else {
      hoja.columns = [
        { header: 'Médico del Servicio', key: 'medico', width: 30 },
        { header: 'Prioridad', key: 'prioridad', width: 12 },
        { header: 'Atendidos Real', key: 'atendidos', width: 15 },
        { header: 'No Atendidos (Fugas)', key: 'fugas', width: 20 },
        { header: 'Turno Computado', key: 'turno', width: 18 },
      ];

      const filaCabecera = hoja.addRow(Array.from(hoja.columns || []).map((col: any) => col.header));
      filaCabecera.eachCell((cell) => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1D4ED8' } };
        cell.font = { color: { argb: 'FFFFFFFF' }, bold: true };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
      });

      resumenIngresos.forEach((row: any) => {
        hoja.addRow([row.Medico || 'Especialista Clínico', row.Prioridad || 'P3', Number(row.AtendidosReal ?? 0), Number(row.FugasReal ?? 0), row.Turno || 'Sin datos']);
      });
    }

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const url = URL.createObjectURL(blob);
    const enlace = document.createElement('a');
    enlace.href = url;
    enlace.download = `Atenciones_Emergencia_${esVistaGeneral ? 'Servicios' : servicio}_${fechaInicio}_a_${fechaFin}.xlsx`;
    enlace.click();
    setTimeout(() => URL.revokeObjectURL(url), 100);
  };

  return (
    <div className="space-y-4 w-full text-slate-800">
      <NavbarUpper 
        title="Frecuencia de Atenciones en Emergencia" 
        description="Monitoreo analítico del volumen de ingresos, saturación por tópicos e índices de gravedad."
        onRefresh={() => fetchDatosHospitalarios(busquedaEjecutada || esVistaGeneral)}
        isRefreshLoading={loading}
      />

      {/* FILTROS GENERALES */}
      <div className="bg-white border border-slate-200 rounded-xl p-2.5 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3 w-full">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 w-full sm:w-auto flex-1">
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 h-[32px]">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <input type="date" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} className="bg-transparent text-xs font-semibold text-slate-600 outline-none w-full cursor-pointer" />
          </div>
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 h-[32px]">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <input type="date" value={fechaFin} onChange={(e) => setFechaFin(e.target.value)} className="bg-transparent text-xs font-semibold text-slate-600 outline-none w-full cursor-pointer" />
          </div>
          
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 h-[32px]">
            <Layers className="w-3.5 h-3.5 text-slate-400" />
            <select 
              value={servicio} 
              onChange={(e) => setServicio(e.target.value)} 
              className="bg-transparent text-xs font-bold text-slate-700 outline-none w-full cursor-pointer appearance-none"
            >
              <option value="Todos">Todos los Servicios</option>
              {listaServicios.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.nombre}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0 w-full sm:w-auto justify-end border-t sm:border-t-0 pt-2 sm:pt-0">
          <button onClick={manejarLimpiezaFiltrosCabecera} className="p-1.5 hover:bg-slate-100 text-slate-500 rounded-md transition" title="Limpiar Filtros">
            <Eraser className="w-4 h-4" />
          </button>
          <button onClick={() => fetchDatosHospitalarios(esVistaGeneral || busquedaEjecutada)} className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-3 py-1.5 rounded-lg shadow-xs flex items-center gap-1 transition h-[32px]">
            <Search className="w-3.5 h-3.5" /> <span>Filtrar</span>
          </button>
        </div>
      </div>

      {/* KPIs DE RENDIMIENTO */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
        <div className="bg-gradient-to-br from-blue-600 to-blue-700 p-3 rounded-xl shadow-md flex items-center gap-2.5 transition-all duration-300 hover:-translate-y-1.5">
          <div className="p-2 bg-white/15 text-white rounded-lg"><Users className="w-4 h-4" /></div>
          <div>
            <span className="text-[10px] font-bold text-white/80 uppercase tracking-wide block">Atendidos</span>
            <h4 className="text-base font-black text-white leading-tight">{kpis.totalMes} <span className="text-[9px] font-normal text-white/70">pts</span></h4>
          </div>
        </div>

        <div className="bg-gradient-to-br from-rose-500 to-red-600 p-3 rounded-xl shadow-md flex items-center gap-2.5 transition-all duration-300 hover:-translate-y-1.5">
          <div className="p-2 bg-white/15 text-white rounded-lg"><UserX className="w-4 h-4" /></div>
          <div>
            <span className="text-[10px] font-bold text-white/80 uppercase tracking-wide block">Fugas</span>
            <h4 className="text-base font-black text-white leading-tight">{kpis.noAtendidos} <span className="text-[9px] font-normal text-white/70">casos</span></h4>
          </div>
        </div>

        <div className="bg-gradient-to-br from-slate-600 to-slate-700 p-3 rounded-xl shadow-md flex items-center gap-2.5 transition-all duration-300 hover:-translate-y-1.5">
          <div className="p-2 bg-white/15 text-white rounded-lg"><Trash2 className="w-4 h-4" /></div>
          <div>
            <span className="text-[10px] font-bold text-white/80 uppercase tracking-wide block">Anulados</span>
            <h4 className="text-base font-black text-white leading-tight">{kpis.eliminados}</h4>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-600 to-indigo-700 p-3 rounded-xl shadow-md flex items-center gap-2.5 transition-all duration-300 hover:-translate-y-1.5">
          <div className="p-2 bg-white/15 text-white rounded-lg"><Clock className="w-4 h-4" /></div>
          <div>
            <span className="text-[10px] font-bold text-white/80 uppercase tracking-wide block">Turno Crítico</span>
            <h4 className="text-sm font-black text-white leading-tight">Turno {kpis.turnoMayorDemanda}</h4>
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-amber-600 p-2.5 rounded-xl shadow-md flex flex-col justify-center transition-all duration-300 hover:-translate-y-1.5">
          <span className="text-[10px] font-bold text-white/80 uppercase tracking-wide block mb-0.5">Altas Auditadas</span>
          <div className="flex items-center justify-between text-xs font-bold text-white">
            <span>Sí: <span className="text-white/90 font-black">{kpis.altaEnServicio}</span></span>
            <span className="text-white/30">|</span>
            <span>No: <span className="text-white/90 font-black">{kpis.sinAlta}</span></span>
          </div>
        </div>
      </div>

      {/* SELECCIÓN VISTA */}
      <div className="flex items-center justify-between bg-slate-100 p-1 rounded-xl max-w-xs border border-slate-200 shadow-3xs">
        <button 
          onClick={() => setVistaActiva('graficos')}
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
          {/* MÓDULO ANÁLISIS DE BARRAS */}
          <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-2">
              <div>
                <h3 className="font-bold text-sm text-slate-900">{esVistaGeneral ? "Demanda Total por Especialidades" : `Demanda por Prioridades`}</h3>
                <p className="text-[11px] text-slate-400">Distribución de ingresos según severidad.</p>
              </div>
              <div className="flex items-center gap-1.5 text-[9px] font-bold bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                <span className="flex items-center gap-0.5"><span className="w-1.5 h-1.5 bg-[#ef4444] rounded-sm"></span> P1</span>
                <span className="flex items-center gap-0.5"><span className="w-1.5 h-1.5 bg-[#ea580c] rounded-sm"></span> P2</span>
                <span className="flex items-center gap-0.5"><span className="w-1.5 h-1.5 bg-[#f59e0b] rounded-sm"></span> P3</span>
                <span className="flex items-center gap-0.5"><span className="w-1.5 h-1.5 bg-[#3b82f6] rounded-sm"></span> P4</span>
              </div>
            </div>

            <div className="w-full h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                {esVistaGeneral ? (
                  <BarChart data={datosGrafico} margin={{ top: 10, right: 5, left: -25, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="servicio" stroke="#94a3b8" fontSize={8} tickLine={false} interval={0} angle={-30} textAnchor="end" height={60} />
                    <YAxis stroke="#94a3b8" fontSize={9} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="p4" stackId="emergencia" fill="#3b82f6" />
                    <Bar dataKey="p3" stackId="emergencia" fill="#f59e0b" />
                    <Bar dataKey="p2" stackId="emergencia" fill="#ea580c" />
                    <Bar dataKey="p1" stackId="emergencia" fill="#ef4444" radius={[2, 2, 0, 0]} />
                  </BarChart>
                ) : (
                  <BarChart data={datosGraficoAdaptados} margin={{ top: 20, right: 5, left: -25, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="prioridadName" stroke="#475569" fontSize={10} fontStyle="bold" tickLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={9} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="Cantidad" radius={[4, 4, 0, 0]} barSize={45}>
                      <LabelList dataKey="Cantidad" position="top" fill="#1e293b" fontSize={10} fontWeight="bold" />
                      {datosGraficoAdaptados.map((entry: any, index: number) => {
                        const name = String(entry.prioridadName || '').toUpperCase();
                        let colorPrioridad = '#3b82f6';
                        if (name.includes('P1')) colorPrioridad = '#ef4444';
                        else if (name.includes('P2')) colorPrioridad = '#ea580c';
                        else if (name.includes('P3')) colorPrioridad = '#f59e0b';
                        return <Cell key={`c-${index}`} fill={colorPrioridad} />;
                      })}
                    </Bar>
                  </BarChart>
                )}
              </ResponsiveContainer>
            </div>
          </div>

          {/* MÓDULO ANÁLISIS DE TURNOS */}
          <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-2">
                <div>
                  <h3 className="font-bold text-sm text-slate-900">{esVistaGeneral ? "Distribución por Turnos" : `Distribución por Turnos del Servicio`}</h3>
                  <p className="text-[11px] text-slate-400">Demanda según bloques horarios de guardia.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                <div className="sm:col-span-5 w-full h-[180px] flex items-center justify-center relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Tooltip content={<CustomTooltip />} />
                      <Pie data={datosTurnos} dataKey="pacientes" nameKey="turno" cx="50%" cy="50%" innerRadius={40} outerRadius={65} paddingAngle={2}>
                        {datosTurnos.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={obtenerColorHexTurno(entry.turno)} strokeWidth={1} stroke="#fff" />
                        ))}
                      </Pie>
                      <text x="50%" y="45%" textAnchor="middle" dominantBaseline="middle" className="fill-slate-400 text-[8px] font-bold uppercase tracking-wider">Total</text>
                      <text x="50%" y="58%" textAnchor="middle" dominantBaseline="middle" className="fill-slate-800 text-lg font-black">{totalCargaPacientes}</text>
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="sm:col-span-7 space-y-1.5">
                  {datosTurnos.map((item: any, index: number) => (
                    <div key={index} className="bg-slate-50 border border-slate-150 p-2 rounded-lg flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: obtenerColorHexTurno(item.turno) }} />
                        <span className="font-semibold text-slate-700">Turno {item.turno}</span>
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
        /* ================= SECCIÓN DE TABLAS ANALÍTICAS ================= */
        <div className="bg-white border border-blue-100 rounded-xl shadow-sm overflow-hidden w-full border-t-4 border-t-blue-700">
          <div className="p-3.5 border-b border-slate-200 flex flex-col xl:flex-row xl:items-center justify-between gap-3 bg-gradient-to-b from-slate-50 to-white">
            <div>
              <h3 className="font-bold text-sm text-slate-900">
                {esVistaGeneral ? "Consolidado Asistencial por Tópicos (Reporte General)" : `Nómina Operativa de Médicos en Turno`}
              </h3>
            </div>

            {!esVistaGeneral && (
              <form onSubmit={manejarBuscarMedicosTabla} className="flex flex-wrap items-center gap-2 bg-white p-1.5 border border-blue-200 rounded-xl shadow-2xs">
                <select 
                  required 
                  value={prioridadFiltro} 
                  onChange={(e) => setPrioridadFiltro(e.target.value)} 
                  className="bg-slate-50 border border-slate-200 text-[11px] font-bold text-slate-600 rounded-md px-2 py-1 outline-none cursor-pointer h-[28px]"
                >
                  <option value="" disabled>Prioridad *</option>
                  <option value="P1">P1 (Rojo)</option>
                  <option value="P2">P2 (Naranja)</option>
                  <option value="P3">P3 (Amarillo)</option>
                  <option value="P4">P4 (Verde)</option>
                </select>

                <select 
                  required 
                  value={turnoFiltro} 
                  onChange={(e) => setTurnoFiltro(e.target.value)} 
                  className="bg-slate-50 border border-slate-200 text-[11px] font-bold text-slate-600 rounded-md px-2 py-1 outline-none cursor-pointer h-[28px]"
                >
                  <option value="" disabled>Turno *</option>
                  <option value="Todos">☀️ Todos los Turnos</option>
                  <option value="Mañana">☀️ Mañana</option>
                  <option value="Tarde">⛅ Tarde</option>
                  <option value="Noche">🌙 Noche</option>
                </select>

                <div className="flex items-center gap-1">
                  {(prioridadFiltro || turnoFiltro) && (
                    <button type="button" onClick={limpiarFiltrosTabla} className="p-1 hover:bg-red-50 text-red-500 rounded transition" title="Limpiar Filtros Internos">
                      <Eraser className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button 
                    type="submit" 
                    disabled={!prioridadFiltro || !turnoFiltro || loading}
                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold text-[11px] px-3 py-1 rounded-md flex items-center gap-1 transition h-[26px]"
                  >
                    <Search className="w-3 h-3" />
                    <span>Consultar</span>
                  </button>
                </div>

                <div className="hidden sm:block border-l border-slate-200 h-5 mx-1" />

                <div className="flex items-center gap-1">
                  <button type="button" onClick={exportarPDF} className="p-1.5 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg text-xs font-bold transition flex items-center gap-1" title="Exportar PDF">
                    <FileText className="w-3.5 h-3.5 text-red-500" /> <span className="hidden sm:inline text-[11px]">PDF</span>
                  </button>
                  <button type="button" onClick={exportarExcel} className="p-1.5 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg text-xs font-bold transition flex items-center gap-1" title="Exportar Excel">
                    <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" /> <span className="hidden sm:inline text-[11px]">Excel</span>
                  </button>
                </div>
              </form>
            )}

            {esVistaGeneral && (
              <div className="flex items-center gap-1">
                <button type="button" onClick={exportarPDF} className="p-1.5 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg text-xs font-bold transition flex items-center gap-1"><FileText className="w-3.5 h-3.5 text-red-500" /> <span>PDF</span></button>
                <button type="button" onClick={exportarExcel} className="p-1.5 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg text-xs font-bold transition flex items-center gap-1"><FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" /> <span>Excel</span></button>
              </div>
            )}
          </div>

          <div className="overflow-x-auto w-full">
            {!esVistaGeneral && (!prioridadFiltro || !turnoFiltro || !busquedaEjecutada) ? (
              <div className="p-8 flex items-center justify-center gap-3 bg-slate-50/50">
                <AlertCircle className="w-4 h-4 text-blue-600 shrink-0" />
                <p className="text-xs text-slate-600">
                  Por favor, configure la <span className="font-bold text-blue-700">Prioridad</span> y el <span className="font-bold text-blue-700">Turno</span> en los selectores de arriba para cargar la nómina analítica de médicos.
                </p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gradient-to-r from-blue-900 to-slate-900 text-white text-[10px] font-bold uppercase tracking-wider shadow-sm">
                    {esVistaGeneral ? (
                      <>
                        <th className="py-3 px-4 border-b border-blue-950">Tópico de Emergencia</th>
                        <th className="py-3 px-4 text-center border-b border-blue-950">PACIENTES ATENDIDOS</th>
                        <th className="py-3 px-4 text-center border-b border-blue-950">PACIENTES NO ATENDIDOS (FUGAS)</th>
                        <th className="py-3 px-4 text-center border-b border-blue-950">ANULADOS</th>
                        <th className="py-3 px-4 text-center border-b border-blue-950">Tasa de Efectividad</th>
                        <th className="py-3 px-4 border-b border-blue-950">Turno de Carga</th>
                      </>
                    ) : (
                      <>
                        <th className="py-3 px-4 border-b border-blue-950">Médicos del Servicio</th>
                        <th className="py-3 px-4 text-center border-b border-blue-950">Prioridad</th>
                        <th className="py-3 px-4 text-center border-b border-blue-950">Atendidos Real</th>
                        <th className="py-3 px-4 text-center border-b border-blue-950">No Atendidos (Fugas)</th>
                        <th className="py-3 px-4 text-center border-b border-blue-950">Turno Computado</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody className="text-xs divide-y divide-blue-50/60 text-slate-700 bg-white">
                  {resumenIngresos.map((row: any, idx: number) => {
                    if (esVistaGeneral) {
                      const totalPacientes = Number(row.pacientes ?? 0);
                      const totalFugas = Number(row.fugas ?? 0);
                      const totalAnulados = Number(row.anulados ?? 0);
                      const volumenTotalMovimientos = totalPacientes + totalFugas + totalAnulados;
                      
                      let tasaEfectividadCalculada = '0.0%';
                      let esServicioInactivo = false;

                      if (volumenTotalMovimientos === 0) {
                        tasaEfectividadCalculada = '0.0%'; 
                        esServicioInactivo = true;
                      } else {
                        const perdidasAsistenciales = totalFugas + totalAnulados;
                        const calculoPorcentaje = (1 - (perdidasAsistenciales / volumenTotalMovimientos)) * 100;
                        tasaEfectividadCalculada = `${calculoPorcentaje.toFixed(1)}%`;
                      }

                      return (
                        <tr key={`${row.id || 'servicio'}-${idx}`} className="odd:bg-white even:bg-sky-50/20 hover:bg-sky-100/50 transition-colors">
                          <td className="py-3 px-4 font-bold text-blue-950 border-r border-slate-100/70">{row.servicio}</td>
                          <td className="py-3 px-4 font-bold text-slate-800 text-center border-r border-slate-100/70">{totalPacientes} pts</td>
                          <td className="py-3 px-4 text-center border-r border-slate-100/70">
                            <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${totalFugas > 0 ? 'text-red-700 bg-red-50' : 'text-slate-500 bg-slate-50'}`}>
                              {totalFugas} casos
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center border-r border-slate-100/70">
                            <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${totalAnulados > 0 ? 'text-slate-700 bg-slate-100 border border-slate-200' : 'text-slate-400 bg-slate-50'}`}>
                              {totalAnulados} registros
                            </span>
                          </td>
                          <td className={`py-3 px-4 text-center font-bold border-r border-slate-100/70 ${esServicioInactivo ? 'text-red-500 font-bold' : 'text-emerald-600'}`}>
                            {tasaEfectividadCalculada}
                          </td>
                          <td className="py-3 px-4">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                              row.turnoCritico === 'Mañana' ? 'text-cyan-700 bg-cyan-50 border border-cyan-100' :
                              row.turnoCritico === 'Tarde' ? 'text-blue-700 bg-blue-50 border border-blue-100' :
                              row.turnoCritico === 'Noche' ? 'text-indigo-900 bg-indigo-50 border border-indigo-100' :
                              'text-slate-500 bg-slate-100'
                            }`}>
                              {row.turnoCritico === 'Sin datos' || !row.turnoCritico ? 'Sin datos' : `⚡ ${row.turnoCritico}`}
                            </span>
                          </td>
                        </tr>
                      );
                    } else {
                      // 🩺 REGLA ASISTENCIAL ORIGINAL: Oculta médicos sin atenciones reales
                      const atendidosReal = Number(row.AtendidosReal ?? row.pacientes ?? 0);
                      if (atendidosReal === 0) return null;

                      const nombreMedicoReal = row.Medico || "Especialista Clínico";
                      const idDelMedico = row.IdMedico ? `ID: ${row.IdMedico}` : "SIGH Reg";
                      const areaConsultorio = row.Servicio || "Tópico Integrado";
                      const fugasReal = row.FugasReal ?? row.fugas ?? 0;
                      const stringTurnoSQL = row.Turno || turnoFiltro;

                      const badgePrioridad = 
                        prioridadFiltro === 'P1' ? 'text-red-700 bg-red-50 border-red-100' :
                        prioridadFiltro === 'P2' ? 'text-orange-700 bg-orange-50 border-orange-100' : 
                        prioridadFiltro === 'P3' ? 'text-amber-700 bg-amber-50 border-amber-100' :
                        'text-blue-700 bg-blue-50 border-blue-100';

                      return (
                        <tr key={`${row.IdMedico || 'medico'}-${idx}`} className="odd:bg-white even:bg-sky-50/20 hover:bg-sky-100/50 transition-colors">
                          <td className="py-2.5 px-4 border-r border-slate-100/70">
                            <div className="flex flex-col">
                              <span className="font-bold text-blue-950 uppercase">{nombreMedicoReal}</span>
                              <span className="text-[9px] text-slate-400 font-medium">
                                {idDelMedico} • <span className="text-blue-600 font-bold uppercase">{areaConsultorio}</span>
                              </span>
                            </div>
                          </td>
                          <td className="py-2.5 px-4 text-center border-r border-slate-100/70">
                            <span className={`text-[9px] font-bold px-2 py-0.5 rounded border ${badgePrioridad} uppercase`}>
                              {prioridadFiltro}
                            </span>
                          </td>
                          <td className="py-2.5 px-4 font-black text-slate-900 text-center border-r border-slate-100/70 bg-blue-50/30">
                            {atendidosReal} pts
                          </td>
                          <td className="py-2.5 px-4 text-center border-r border-slate-100/70">
                            <span className={`font-bold px-2 py-0.5 rounded text-[10px] ${Number(fugasReal) > 0 ? 'text-red-600 bg-red-50' : 'text-slate-400 bg-slate-50'}`}>
                              {fugasReal} casos
                            </span>
                          </td>
                          <td className="py-2.5 px-4 text-center">
                            <span className="text-[9px] font-bold text-blue-900 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded">
                              Turno {stringTurnoSQL}
                            </span>
                          </td>
                        </tr>
                      );
                    }
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* RECUADRO ANALÍTICO SPREAD */}
      {resumenDemanda && resumenDemanda.trim() !== "" && (
        <div className="bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-100 p-3 rounded-xl shadow-xs flex items-start gap-2.5 w-full">
          <div className="bg-indigo-600 text-white p-1.5 rounded-lg shrink-0 mt-0.5">
            <TrendingUp className="w-3.5 h-3.5" />
          </div>
          <div>
            <h4 className="text-[11px] font-bold text-indigo-900 uppercase tracking-wide">Análisis Horario de Guardia</h4>
            <p className="text-xs text-slate-700 font-medium leading-relaxed">{resumenDemanda}</p>
          </div>
        </div>
      )}
    </div>
  );
}