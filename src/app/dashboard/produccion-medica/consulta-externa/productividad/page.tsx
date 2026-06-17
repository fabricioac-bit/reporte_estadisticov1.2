'use client';

import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import NavbarUpper from '@/components/layout/NavbarUpper';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LabelList,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import {
  Search,
  Table2,
  BarChart3,
  X,
  FileSpreadsheet,
} from 'lucide-react';
import { Workbook } from 'exceljs';

interface ProduccionDiaria {
  Medico: string;
  TipoEmpleado: string;
  Especialidad: string;
  Turno: string;
  [dia: string]: any;
  TOTAL: number;
}

interface CurvaPunto {
  dia: string;
  atenciones: number;
}

interface DepartamentoFiltro {
  IdDepartamento: number;
  Nombre: string;
}

interface EspecialidadFiltro {
  IdEspecialidad: number;
  Nombre: string;
  IdDepartamento: number;
}

interface MedicoFiltro {
  IdMedico: number;
  Medico: string;
  TipoEmpleado: string;
}

interface AnioFiltro {
  anio: number;
}

interface FiltrosCarga {
  mes?: string;
  fechaInicio?: string;
  fechaFin?: string;
  departamentoId?: string;
  especialidadId?: string;
  medicoId?: string;
  turno?: string;
}

const formatearFecha = (fecha: Date) => {
  const anio = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const dia = String(fecha.getDate()).padStart(2, '0');
  return `${anio}-${mes}-${dia}`;
};

const meses = [
  { valor: '01', nombre: 'Enero' },
  { valor: '02', nombre: 'Febrero' },
  { valor: '03', nombre: 'Marzo' },
  { valor: '04', nombre: 'Abril' },
  { valor: '05', nombre: 'Mayo' },
  { valor: '06', nombre: 'Junio' },
  { valor: '07', nombre: 'Julio' },
  { valor: '08', nombre: 'Agosto' },
  { valor: '09', nombre: 'Septiembre' },
  { valor: '10', nombre: 'Octubre' },
  { valor: '11', nombre: 'Noviembre' },
  { valor: '12', nombre: 'Diciembre' },
];

const obtenerAnios = () => {
  const anioActual = new Date().getFullYear();
  return Array.from({ length: 12 }, (_, index) => anioActual - 10 + index);
};

const obtenerRangoDelMes = (mes: string) => {
  const [anio, mesNumero] = mes.split('-').map(Number);
  const fechaInicio = new Date(anio, mesNumero - 1, 1);
  const fechaFin = new Date(anio, mesNumero, 0);

  return {
    fechaInicio: formatearFecha(fechaInicio),
    fechaFin: formatearFecha(fechaFin),
  };
};

const obtenerDiasDelMes = (mes: string) => {
  const { fechaInicio, fechaFin } = obtenerRangoDelMes(mes);
  return obtenerDiasDelRango(fechaInicio, fechaFin);
};

const obtenerDiasDelRango = (fechaInicio: string, fechaFin: string) => {
  const [anioInicio, mesInicio, diaInicio] = fechaInicio.split('-').map(Number);
  const [anioFin, mesFin, diaFin] = fechaFin.split('-').map(Number);

  const inicio = new Date(anioInicio, mesInicio - 1, diaInicio);
  const fin = new Date(anioFin, mesFin - 1, diaFin);
  const dias: string[] = [];

  const actual = new Date(inicio);
  while (actual <= fin) {
    dias.push(String(actual.getDate()).padStart(2, '0'));
    actual.setDate(actual.getDate() + 1);
  }

  return dias;
};

const formatearFechaLarga = (fecha: string) => {
  const [anio, mes, dia] = fecha.split('-');
  return `${dia}/${mes}/${anio}`;
};

const obtenerNombreMes = (fecha: string) => {
  const [, mes] = fecha.split('-').map(Number);
  const meses = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
  ];

  return meses[mes - 1] || '';
};

const obtenerColumnaExcel = (index: number) => {
  let columna = index;
  let letras = '';

  while (columna > 0) {
    const residuo = (columna - 1) % 26;
    letras = String.fromCharCode(65 + residuo) + letras;
    columna = Math.floor((columna - 1) / 26);
  }

  return letras;
};

const aplicarEstiloTitulo = (cell: any, anchoColumnas: number) => {
  cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1D4ED8' } };
  cell.font = { color: { argb: 'FFFFFFFF' }, bold: true, size: 14 };
  cell.alignment = { horizontal: 'center', vertical: 'middle' };
};

const aplicarEstiloSubtitulo = (cell: any) => {
  cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDBEAFE' } };
  cell.font = { color: { argb: 'FF0F172A' }, bold: true, size: 11 };
  cell.alignment = { horizontal: 'left', vertical: 'middle' };
};

const aplicarBorde = (cell: any, color: string) => {
  cell.border = {
    top: { style: 'thin', color: { argb: color } },
    left: { style: 'thin', color: { argb: color } },
    bottom: { style: 'thin', color: { argb: color } },
    right: { style: 'thin', color: { argb: color } },
  };
};

const crearImagenCurva = async (datos: CurvaPunto[]) => {
  const canvas = document.createElement('canvas');
  const width = 1200;
  const height = 520;
  const padding = { top: 70, right: 40, bottom: 70, left: 80 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext('2d');

  if (!context) {
    return new Uint8Array();
  }

  const maxAtenciones = Math.max(1, ...datos.map((item) => item.atenciones));
  const stepX = datos.length > 18 ? Math.ceil(datos.length / 18) : 1;

  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, width, height);

  context.fillStyle = '#1d4ed8';
  context.font = '700 28px Arial';
  context.textAlign = 'center';
  context.fillText('Tendencia de Atenciones por Día', width / 2, 38);

  context.strokeStyle = '#e2e8f0';
  context.lineWidth = 1;
  context.fillStyle = '#475569';
  context.font = '18px Arial';
  context.textAlign = 'right';

  for (let i = 0; i <= 5; i++) {
    const value = Math.round((maxAtenciones / 5) * i);
    const y = padding.top + chartHeight - (chartHeight / 5) * i;

    context.beginPath();
    context.moveTo(padding.left, y);
    context.lineTo(width - padding.right, y);
    context.stroke();

    context.fillText(String(value), padding.left - 12, y + 6);
  }

  context.strokeStyle = '#94a3b8';
  context.lineWidth = 2;
  context.beginPath();
  context.moveTo(padding.left, padding.top);
  context.lineTo(padding.left, padding.top + chartHeight);
  context.lineTo(width - padding.right, padding.top + chartHeight);
  context.stroke();

  if (datos.length > 0) {
    const points = datos.map((item, index) => {
      const x = padding.left + (datos.length === 1 ? chartWidth / 2 : (chartWidth / (datos.length - 1)) * index);
      const y = padding.top + chartHeight - (item.atenciones / maxAtenciones) * chartHeight;
      return { x, y, item };
    });

    context.strokeStyle = '#2563eb';
    context.lineWidth = 5;
    context.beginPath();
    points.forEach((point, index) => {
      if (index === 0) context.moveTo(point.x, point.y);
      else context.lineTo(point.x, point.y);
    });
    context.stroke();

    points.forEach((point, index) => {
      if (index % stepX !== 0 && index !== points.length - 1) return;

      context.fillStyle = '#2563eb';
      context.beginPath();
      context.arc(point.x, point.y, 7, 0, Math.PI * 2);
      context.fill();

      context.fillStyle = '#0f172a';
      context.font = '16px Arial';
      context.textAlign = 'center';
      context.fillText(point.item.dia, point.x, padding.top + chartHeight + 34);

      context.fillStyle = '#1d4ed8';
      context.font = '700 18px Arial';
      context.fillText(String(point.item.atenciones), point.x, point.y - 14);
    });
  } else {
    context.fillStyle = '#64748b';
    context.font = '24px Arial';
    context.textAlign = 'center';
    context.fillText('No hay datos para la curva seleccionada', width / 2, padding.top + chartHeight / 2);
  }

  const blob = await new Promise<Blob>((resolve) => canvas.toBlob((resultado) => resolve(resultado || new Blob()), 'image/png'));
  const arrayBuffer = await blob.arrayBuffer();

  return typeof Buffer !== 'undefined' ? Buffer.from(arrayBuffer) : new Uint8Array(arrayBuffer);
};

export default function ProductividadPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [anioFiltro, setAnioFiltro] = useState(() => String(new Date().getFullYear()));
  const [mesFiltro, setMesFiltro] = useState(() => String(new Date().getMonth() + 1).padStart(2, '0'));
  const [departamentoId, setDepartamentoId] = useState('');
  const [especialidadId, setEspecialidadId] = useState('');
  const [medicoId, setMedicoId] = useState('');
  const [turno, setTurno] = useState('Todos');
  const [formato, setFormato] = useState<'tabla' | 'curva'>('tabla');

  const [departamentos, setDepartamentos] = useState<DepartamentoFiltro[]>([]);
  const [especialidades, setEspecialidades] = useState<EspecialidadFiltro[]>([]);
  const [medicos, setMedicos] = useState<MedicoFiltro[]>([]);
  const [anios, setAnios] = useState<AnioFiltro[]>([]);
  const [produccion, setProduccion] = useState<ProduccionDiaria[]>([]);
  const [curva, setCurva] = useState<CurvaPunto[]>([]);
  const [diasColumnas, setDiasColumnas] = useState<string[]>([]);
  const solicitudRef = useRef(0);

  const mesSeleccionado = anioFiltro && mesFiltro ? `${anioFiltro}-${mesFiltro}` : '';
  const rangoMes = mesSeleccionado ? obtenerRangoDelMes(mesSeleccionado) : null;
  const fechaInicio = rangoMes?.fechaInicio || '';
  const fechaFin = rangoMes?.fechaFin || '';

  const handleRefreshData = () => {
    loadData();
  };

  const limpiarFiltros = () => {
    const fechaActual = new Date();
    const anioLimpio = String(fechaActual.getFullYear());
    const mesLimpio = String(fechaActual.getMonth() + 1).padStart(2, '0');
    const { fechaInicio: fechaInicioLimpio, fechaFin: fechaFinLimpio } = obtenerRangoDelMes(`${anioLimpio}-${mesLimpio}`);

    setAnioFiltro(anioLimpio);
    setMesFiltro(mesLimpio);
    setDepartamentoId('');
    setEspecialidadId('');
    setMedicoId('');
    setTurno('Todos');
    loadData({
      mes: `${anioLimpio}-${mesLimpio}`,
      fechaInicio: fechaInicioLimpio,
      fechaFin: fechaFinLimpio,
      departamentoId: '',
      especialidadId: '',
      medicoId: '',
      turno: 'Todos',
    });
  };

  const exportarExcel = async () => {
    const workbook = new Workbook();
    const headers = ['Médico', 'Profesión', 'Especialidad', 'Turno', ...diasColumnas, 'TOTAL'];

    const hojaProduccion = workbook.addWorksheet('Producción');
    hojaProduccion.columns = headers.map((header, index) => ({
      header,
      key: `c${index}`,
      width: index < 4 ? 28 : index === headers.length - 1 ? 12 : 8,
    }));

    const columnaFinal = obtenerColumnaExcel(headers.length);
    const nombreDepartamento = departamentoId
      ? departamentos.find((item) => String(item.IdDepartamento) === departamentoId)?.Nombre || 'Todos'
      : 'Todos';
    const nombreEspecialidad = especialidadId
      ? especialidades.find((item) => String(item.IdEspecialidad) === especialidadId)?.Nombre || 'Todos'
      : 'Todos';
    const nombreMedico = medicoId
      ? medicos.find((item) => String(item.IdMedico) === medicoId)?.Medico || 'Todos'
      : 'Todos';
    const filtrosTexto = ` | Departamento: ${nombreDepartamento} | Especialidad: ${nombreEspecialidad} | Médico: ${nombreMedico} | Turno: ${turno}`;
    const tituloPeriodo = `Año: ${anioFiltro} | Mes: ${obtenerNombreMes(mesSeleccionado)} | Días: ${diasColumnas[0] || '--'} al ${diasColumnas[diasColumnas.length - 1] || '--'}${filtrosTexto}`;

    hojaProduccion.mergeCells(`A1:${columnaFinal}1`);
    hojaProduccion.getCell('A1').value = 'PRODUCTIVIDAD DE CONSULTA EXTERNA';
    aplicarEstiloTitulo(hojaProduccion.getCell('A1'), headers.length);

    hojaProduccion.mergeCells(`A2:${columnaFinal}2`);
    hojaProduccion.getCell('A2').value = tituloPeriodo;
    aplicarEstiloSubtitulo(hojaProduccion.getCell('A2'));

    const filaCabecera = hojaProduccion.addRow(headers);
    filaCabecera.eachCell((cell) => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1D4ED8' } };
      cell.font = { color: { argb: 'FFFFFFFF' }, bold: true };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FF1D4ED8' } },
        left: { style: 'thin', color: { argb: 'FFD9E2F3' } },
        bottom: { style: 'thin', color: { argb: 'FF1D4ED8' } },
        right: { style: 'thin', color: { argb: 'FFD9E2F3' } },
      };
    });

    produccionFiltrada.forEach((row) => {
      hojaProduccion.addRow([
        row.Medico.toUpperCase(),
        (row.TipoEmpleado || '').toUpperCase(),
        (row.Especialidad || 'SIN ESPECIALIDAD').toUpperCase(),
        row.Turno,
        ...diasColumnas.map((dia) => {
          const valor = row[dia];
          return valor === undefined || valor === null || valor === '' ? null : Number(valor);
        }),
        Number(row.TOTAL ?? 0),
      ]);
    });

    hojaProduccion.getRow(1).font = { color: { argb: 'FFFFFFFF' }, bold: true };
    hojaProduccion.views = [
        { state: 'frozen', xSplit: 0, ySplit: 3 }
      ];

    for (let i = 4; i <= hojaProduccion.rowCount; i++) {
      hojaProduccion.getRow(i).eachCell((cell) => {
        cell.font = { color: { argb: 'FF000000' } };
        cell.alignment = { horizontal: typeof cell.value === 'number' ? 'right' : 'left', vertical: 'middle' };
        if (typeof cell.value === 'number') {
          cell.numFmt = '#,##0';
        }
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFE5E7EB' } },
          left: { style: 'thin', color: { argb: 'FFE5E7EB' } },
          bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } },
          right: { style: 'thin', color: { argb: 'FFE5E7EB' } },
        };
      });
    }

    const hojaCurva = workbook.addWorksheet('Curva');
    hojaCurva.columns = [
      { header: 'Día', key: 'dia', width: 12 },
      { header: 'Atenciones', key: 'atenciones', width: 16 },
    ];

    hojaCurva.mergeCells('A1:B1');
    hojaCurva.getCell('A1').value = 'CURVA DE ATENCIONES';
    aplicarEstiloTitulo(hojaCurva.getCell('A1'), 2);

    hojaCurva.mergeCells('A2:B2');
    hojaCurva.getCell('A2').value = tituloPeriodo;
    aplicarEstiloSubtitulo(hojaCurva.getCell('A2'));

    const imagenCurva = await crearImagenCurva(curva);
    const idImagenCurva = workbook.addImage({
      buffer: imagenCurva as any,
      extension: 'png',
    });

    hojaCurva.addImage(idImagenCurva, {
      tl: { col: 0, row: 3 },
      ext: { width: 1200, height: 520 },
    });

    const filaInicioCurva = 38;
    const filaCurva = hojaCurva.getRow(filaInicioCurva);
    filaCurva.values = ['Día', 'Atenciones'];

    filaCurva.eachCell((cell) => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1D4ED8' } };
      cell.font = { color: { argb: 'FFFFFFFF' }, bold: true };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FF1D4ED8' } },
        left: { style: 'thin', color: { argb: 'FFD9E2F3' } },
        bottom: { style: 'thin', color: { argb: 'FF1D4ED8' } },
        right: { style: 'thin', color: { argb: 'FFD9E2F3' } },
      };
    });

    curva.forEach((item, index) => {
      const fila = hojaCurva.getRow(filaInicioCurva + index + 1);
      fila.values = [item.dia, item.atenciones];

      fila.eachCell((cell) => {
        cell.font = { color: { argb: 'FF000000' } };
        cell.alignment = { horizontal: typeof cell.value === 'number' ? 'right' : 'left', vertical: 'middle' };
        if (typeof cell.value === 'number') {
          cell.numFmt = '#,##0';
        }
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFE5E7EB' } },
          left: { style: 'thin', color: { argb: 'FFE5E7EB' } },
          bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } },
          right: { style: 'thin', color: { argb: 'FFE5E7EB' } },
        };
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const url = URL.createObjectURL(blob);
    const enlace = document.createElement('a');
    enlace.href = url;
    enlace.download = `Productividad_Consulta_Externa_${fechaInicio}_a_${fechaFin}.xlsx`;
    enlace.click();
    setTimeout(() => URL.revokeObjectURL(url), 100);
  };

  const loadData = async (siguientesFiltros: FiltrosCarga = {}) => {
    if (!mesSeleccionado) {
      setProduccion([]);
      setCurva([]);
      setDiasColumnas([]);
      setLoading(false);
      return;
    }

    const solicitudActual = ++solicitudRef.current;

    setLoading(true);
    setError(null);

    try {
      const filtrosActuales = {
        mes: mesSeleccionado,
        fechaInicio,
        fechaFin,
        departamentoId,
        especialidadId,
        medicoId,
        turno,
      };

      const filtros = {
        ...filtrosActuales,
        ...siguientesFiltros,
      };

      const res = await axios.get('/api/productividad-consulta', {
        params: filtros,
      });

      if (solicitudActual !== solicitudRef.current) return;

      if (res.data.success) {
        if (res.data.data.filtros) {
          const aniosData = res.data.data.filtros.anios || [];
          const aniosConFallback = aniosData.length > 0
            ? aniosData
            : [{ anio: new Date().getFullYear() }];
          setAnios(aniosConFallback);
          if (!aniosConFallback.some((item: AnioFiltro) => String(item.anio) === anioFiltro)) {
            setAnioFiltro(String(aniosConFallback[0].anio));
          }
          setDepartamentos(res.data.data.filtros.departamentos || []);
          setEspecialidades(res.data.data.filtros.especialidades || []);
          setMedicos(res.data.data.filtros.medicos || []);
        }

        setProduccion(res.data.data.produccion || []);
        setCurva(res.data.data.curva || []);
        setDiasColumnas(
          res.data.data.diasColumnas || obtenerDiasDelMes(filtros.mes || mesFiltro)
        );
      } else {
        setError(res.data.mensaje || 'No se pudo cargar la productividad.');
      }
    } catch (err: any) {
      if (solicitudActual !== solicitudRef.current) return;

      console.error('Error al cargar productividad:', err);
      setError(err.response?.data?.mensaje || 'Error al cargar productividad.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const especialidadesFiltradas = departamentoId
    ? especialidades.filter((item) => String(item.IdDepartamento) === departamentoId)
    : especialidades;

  const medicosFiltrados = medicos;

  const produccionFiltrada = turno === 'Todos'
    ? produccion
    : produccion.filter((p) => p.Turno === turno);

  return (
    <div className="space-y-6 w-full">
      <NavbarUpper
        title="Producción de Consulta Externa"
        description="Análisis de producción médica por médico, tipo de empleado, especialidad y día."
        onRefresh={handleRefreshData}
        isRefreshLoading={loading}
      />

      <div className="bg-white border border-slate-100 p-5 rounded-3xl shadow-sm space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-8 gap-4 items-end">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Año</label>
            <select
              value={anioFiltro}
              onChange={(e) => {
                const valor = e.target.value;
                setAnioFiltro(valor);
                if (mesFiltro && valor) {
                  const { fechaInicio: fechaInicioMes, fechaFin: fechaFinMes } = obtenerRangoDelMes(`${valor}-${mesFiltro}`);
                  loadData({
                    mes: `${valor}-${mesFiltro}`,
                    fechaInicio: fechaInicioMes,
                    fechaFin: fechaFinMes,
                  });
                } else {
                  setProduccion([]);
                  setCurva([]);
                  setDiasColumnas([]);
                  setError(null);
                  setLoading(false);
                }
              }}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-500"
            >
              <option value="">Seleccionar</option>
              {anios.map((item) => (
                <option key={item.anio} value={item.anio}>
                  {item.anio}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Mes</label>
            <select
              value={mesFiltro}
              onChange={(e) => {
                const valor = e.target.value;
                setMesFiltro(valor);
                if (anioFiltro && valor) {
                  const { fechaInicio: fechaInicioMes, fechaFin: fechaFinMes } = obtenerRangoDelMes(`${anioFiltro}-${valor}`);
                  loadData({
                    mes: `${anioFiltro}-${valor}`,
                    fechaInicio: fechaInicioMes,
                    fechaFin: fechaFinMes,
                  });
                }
              }}
              disabled={!anioFiltro}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="">Seleccionar</option>
              {meses.map((mes) => (
                <option key={mes.valor} value={mes.valor}>
                  {mes.nombre}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Departamento</label>
            <select
              value={departamentoId}
              onChange={(e) => {
                const valor = e.target.value;
                setDepartamentoId(valor);
                setEspecialidadId('');
                setMedicoId('');
                loadData({
                  departamentoId: valor,
                  especialidadId: '',
                  medicoId: '',
                });
              }}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-500"
            >
              <option value="">Todos</option>
              {departamentos.map((item) => (
                <option key={item.IdDepartamento} value={item.IdDepartamento}>
                  {item.Nombre}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Especialidad</label>
            <select
              value={especialidadId}
              onChange={(e) => {
                const valor = e.target.value;
                setEspecialidadId(valor);
                setMedicoId('');
                loadData({
                  especialidadId: valor,
                  medicoId: '',
                });
              }}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-500"
            >
              <option value="">Todos</option>
              {especialidadesFiltradas.map((item) => (
                <option key={item.IdEspecialidad} value={item.IdEspecialidad}>
                  {item.Nombre}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Médico</label>
            <select
              value={medicoId}
              onChange={(e) => {
                const valor = e.target.value;
                setMedicoId(valor);
                if (!valor) {
                  setDepartamentoId('');
                  setEspecialidadId('');
                  loadData({
                    medicoId: '',
                    departamentoId: '',
                    especialidadId: '',
                  });
                } else {
                  loadData({ medicoId: valor });
                }
              }}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-500"
            >
              <option value="">Todos</option>
              {medicosFiltrados.map((item) => (
                <option key={item.IdMedico} value={item.IdMedico}>
                  {item.Medico}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Turno</label>
            <select
              value={turno}
              onChange={(e) => {
                const valor = e.target.value;
                setTurno(valor);
                loadData({ turno: valor });
              }}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-500"
            >
              <option value="Todos">Todos</option>
              <option value="M">Mañana (M)</option>
              <option value="T">Tarde (T)</option>
            </select>
          </div>
          <button
            onClick={() => loadData()}
            disabled={!mesSeleccionado}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold text-sm px-4 py-2.5 rounded-xl shadow-md shadow-blue-500/10 flex items-center justify-center gap-2 transition"
          >
            <Search className="w-4 h-4" />
            <span>Buscar</span>
          </button>
          <button
            onClick={limpiarFiltros}
            className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm px-4 py-2.5 rounded-xl flex items-center justify-center gap-2 transition border border-slate-200"
          >
            <X className="w-4 h-4" />
            <span>Limpiar</span>
          </button>
        </div>

        <div className="flex gap-2 justify-start">
          <button
            onClick={() => setFormato('tabla')}
            className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition border ${
              formato === 'tabla'
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Table2 className="w-4 h-4" />
            <span>Tabla</span>
          </button>
          <button
            onClick={() => setFormato('curva')}
            className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition border ${
              formato === 'curva'
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Curva</span>
          </button>
          <button
            onClick={exportarExcel}
            disabled={!mesSeleccionado}
            className="flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white border border-emerald-600 font-bold text-xs px-3 py-2 rounded-xl shadow-sm transition"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Excel</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="min-h-[300px] flex flex-col items-center justify-center bg-white border border-slate-100 rounded-3xl p-10 shadow-sm">
          <div className="w-10 h-10 border-4 border-slate-100 border-t-blue-500 rounded-full animate-spin mb-3"></div>
          <p className="text-slate-500 text-sm font-semibold">Cargando datos de producción...</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-100 rounded-3xl p-5 text-red-700 text-sm font-semibold">
          {error}
        </div>
      ) : formato === 'tabla' ? (
        <div className="bg-white border border-slate-100 rounded-3xl shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between gap-4">
            <div>
              <h3 className="font-extrabold text-lg text-slate-900">Producción por Médico</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Atenciones completadas por día. Cabeceras dinámicas del {diasColumnas[0] || '--'} al {diasColumnas[diasColumnas.length - 1] || '--'}.
              </p>
            </div>
            <span className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full whitespace-nowrap">
              {diasColumnas.length} días
            </span>
          </div>
          <div className="overflow-auto max-h-[65vh]">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 text-xs font-bold uppercase tracking-wider">
                  <th className="py-2 px-3 sticky left-0 top-0 bg-slate-50 z-30 min-w-[220px] text-[10px]">Médico</th>
                  <th className="py-2 px-3 sticky left-[220px] top-0 bg-slate-50 z-30 min-w-[150px] text-[10px]">Profesión</th>
                  <th className="py-2 px-3 sticky left-[370px] top-0 bg-slate-50 z-30 min-w-[150px] text-[10px]">Especialidad</th>
                  <th className="py-2 px-3 sticky left-[520px] top-0 bg-slate-50 z-30 min-w-[50px] text-[10px]">Turno</th>
                  {diasColumnas.map((dia) => (
                    <th key={dia} className="py-2 px-2 text-center min-w-[38px] sticky top-0 bg-slate-50 z-20 text-[10px]">{dia}</th>
                  ))}
                  <th className="py-2 px-2 text-center bg-slate-100 font-black text-slate-700 sticky top-0 z-20 text-[10px] min-w-[50px]">TOTAL</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-slate-700">
                {produccionFiltrada.length === 0 ? (
                  <tr>
                    <td colSpan={diasColumnas.length + 5} className="py-10 text-center text-slate-400 text-sm">
                      No hay datos para el rango seleccionado.
                    </td>
                  </tr>
                ) : (
                  produccionFiltrada.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-2 px-3 font-semibold text-slate-800 sticky left-0 bg-white z-10 text-[10px] uppercase tracking-tight">{row.Medico}</td>
                      <td className="py-2 px-3 sticky left-[220px] bg-white z-10 text-[10px] uppercase tracking-tight">{row.TipoEmpleado || ''}</td>
                      <td className="py-2 px-3 sticky left-[370px] bg-white z-10 text-[10px] uppercase tracking-tight">{row.Especialidad || 'SIN ESPECIALIDAD'}</td>
                      <td className="py-2 px-3 sticky left-[520px] bg-white z-10">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                          row.Turno === 'M' ? 'bg-sky-50 text-sky-700' : 'bg-amber-50 text-amber-700'
                        }`}>
                          {row.Turno === 'M' ? 'M' : 'T'}
                        </span>
                      </td>
                      {diasColumnas.map((dia) => (
                        <td key={dia} className="py-2 px-2 text-center font-semibold text-[10px] uppercase">
                          {row[dia] !== undefined && row[dia] !== null && row[dia] !== '' ? row[dia] : ''}
                        </td>
                      ))}
                      <td className="py-2 px-2 text-center font-black text-slate-900 bg-slate-50 text-[10px] uppercase min-w-[50px]">
                        {row.TOTAL ?? 0}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white border border-slate-100 p-6 rounded-3xl shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h3 className="font-extrabold text-lg text-slate-900">Tendencia de Atenciones por Día</h3>
              <p className="text-xs text-slate-400 mt-0.5">Pacientes atendidos por día según los filtros seleccionados</p>
            </div>
            <span className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full uppercase tracking-wider">
              Consulta Externa
            </span>
          </div>
          <div className="w-full h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={curva} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorCurva" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="dia" stroke="#94a3b8" fontSize={12} tickLine={false} tickFormatter={(value) => String(Number(value))} />
                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} />
                <Tooltip
                  labelFormatter={(label) => `Día ${label}`}
                  contentStyle={{ background: '#0f172a', color: '#fff', borderRadius: '12px', border: 'none' }}
                  itemStyle={{ color: '#60a5fa' }}
                />
                <Area
                  type="monotone"
                  dataKey="atenciones"
                  stroke="#3b82f6"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorCurva)"
                  name="Atenciones por día"
                >
                  <LabelList
                    dataKey="atenciones"
                    position="top"
                    fill="#1d4ed8"
                    fontSize={12}
                    fontWeight={700}
                  />
                </Area>
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
