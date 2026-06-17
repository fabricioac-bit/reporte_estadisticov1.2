'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import Swal from 'sweetalert2';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import {
  Activity,
  UserCheck,
  AlertTriangle,
  LogOut,
  Settings,
  RefreshCw,
} from 'lucide-react';

interface DashboardContract {
  kpis: {
    consultas_medicas: number;
    consultas_tendencia: number;
    atenciones_emergencia: number;
    emergencia_tendencia: number;
  };
  emergencia_mensual: Array<{ mes: string; cantidad: number }>;
  rendimiento_mensual: Array<{ mes: string; cantidad: number }>;
  historial_quirurgico: Array<{ mes: string; cantidad: number }>;
}

export default function DashboardPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [data, setData] = useState<DashboardContract | null>(null);
  const [loading, setLoading] = useState(true);
  const [reconnecting, setReconnecting] = useState(false);
  const [usuario, setUsuario] = useState<{ nombre: string; usuario: string } | null>(null);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [filtroAnio, setFiltroAnio] = useState<number>(new Date().getFullYear());
  const [filtroMes, setFiltroMes] = useState<number>(new Date().getMonth() + 1);

  const loadDashboardData = async (isRetry = false) => {
    if (isRetry) setReconnecting(true);
    try {
      const dashboardRes = await axios.get('/api/dashboard', {
        params: { anio: filtroAnio, mes: filtroMes }
      });
      setData(dashboardRes.data);

      try {
        const userRes = await axios.get('/api/auth/me');
        if (userRes.data.success && userRes.data.usuario) {
          setUsuario(userRes.data.usuario);
        }
      } catch (err) {
        console.warn('Sesion de usuario no disponible en el servidor de autenticacion.');
      }

      setLoading(false);
      setReconnecting(false);
    } catch (err: any) {
      console.error('Fallo en la comunicacion con la infraestructura del Dashboard:', err);
      setReconnecting(true);
      
      setTimeout(() => {
        loadDashboardData(true);
      }, 5000);
    }
  };

  useEffect(() => {
    setMounted(true);
    loadDashboardData();

    const interval = setInterval(() => {
      loadDashboardData();
    }, 60000);

    return () => clearInterval(interval);
  }, [filtroAnio, filtroMes]);

  const handleLogout = async () => {
    Swal.fire({
      title: '¿Desea cerrar sesion?',
      text: 'Se eliminaran sus cookies seguras del navegador.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#2563eb',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Si, Salir',
      cancelButtonText: 'Cancelar',
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await axios.post('/api/auth/logout');
          Swal.fire({
            title: 'Sesion Cerrada',
            text: 'Ha salido del sistema hospitalario de forma segura.',
            icon: 'success',
            timer: 1200,
            showConfirmButton: false,
          }).then(() => {
            router.push('/login');
            router.refresh();
          });
        } catch (e) {
          document.cookie = 'sigh_session=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
          router.push('/login');
        }
      }
    });
  };

  const getUserInitial = () => {
    const name = usuario?.nombre?.trim();
    const username = usuario?.usuario?.trim();
    if (name) return name[0].toUpperCase();
    if (username) return username[0].toUpperCase();
    return 'U';
  };

  const handleChangePassword = async () => {
    setProfileMenuOpen(false);
    const result = await Swal.fire({
      title: 'Cambiar clave',
      html: `
        <input id="swal-current-password" type="password" class="swal2-input" placeholder="Contrasena actual" />
        <input id="swal-new-password" type="password" class="swal2-input" placeholder="Nueva contrasena" />
        <input id="swal-confirm-password" type="password" class="swal2-input" placeholder="Confirmar contrasena" />
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: 'Confirmar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#2563eb',
      cancelButtonColor: '#64748b',
      preConfirm: () => {
        const currentPassword = (document.getElementById('swal-current-password') as HTMLInputElement)?.value;
        const newPassword = (document.getElementById('swal-new-password') as HTMLInputElement)?.value;
        const confirmPassword = (document.getElementById('swal-confirm-password') as HTMLInputElement)?.value;

        if (!currentPassword || !newPassword || !confirmPassword) {
          Swal.showValidationMessage('Complete todos los campos.');
          return null;
        }
        if (newPassword.length < 6) {
          Swal.showValidationMessage('La nueva contrasena debe tener al menos 6 caracteres.');
          return null;
        }
        if (newPassword !== confirmPassword) {
          Swal.showValidationMessage('Las contrasenas no coinciden.');
          return null;
        }
        return { currentPassword, newPassword, confirmPassword };
      },
    });

    if (!result.isConfirmed || !result.value) return;

    try {
      await axios.post('/api/auth/change-password', {
        currentPassword: result.value.currentPassword,
        newPassword: result.value.newPassword,
        confirmPassword: result.value.confirmPassword,
      });
      Swal.fire({
        title: 'Clave cambiada',
        text: 'Su nueva contrasena se ha guardado correctamente.',
        icon: 'success',
        timer: 1400,
        showConfirmButton: false,
      });
    } catch (error: any) {
      Swal.fire({
        title: 'Error',
        text: error?.response?.data?.mensaje || 'No se pudo cambiar la contrasena.',
        icon: 'error',
      });
    }
  };

  if (!mounted) return null;

  return (
    <div className="w-full space-y-5">
      {/* CABECERA AJUSTADA PARA PREVENIR DESBORDAMIENTOS */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">Panel de Control Clínico</h1>
          <p className="text-slate-500 mt-0.5 text-sm">Estadística hospitalaria integral en tiempo real.</p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto flex-wrap">
          {/* Filtros de Año y Mes */}
          <select
            value={filtroAnio}
            onChange={(e) => setFiltroAnio(Number(e.target.value))}
            className="bg-white border border-slate-200 text-slate-700 px-3 py-2 rounded-xl text-sm font-bold shadow-sm transition hover:bg-slate-50 cursor-pointer"
          >
            {[2024, 2025, 2026, 2027].map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <select
            value={filtroMes}
            onChange={(e) => setFiltroMes(Number(e.target.value))}
            className="bg-white border border-slate-200 text-slate-700 px-3 py-2 rounded-xl text-sm font-bold shadow-sm transition hover:bg-slate-50 cursor-pointer"
          >
            {[
              { val: 1, label: 'Enero' },
              { val: 2, label: 'Febrero' },
              { val: 3, label: 'Marzo' },
              { val: 4, label: 'Abril' },
              { val: 5, label: 'Mayo' },
              { val: 6, label: 'Junio' },
              { val: 7, label: 'Julio' },
              { val: 8, label: 'Agosto' },
              { val: 9, label: 'Septiembre' },
              { val: 10, label: 'Octubre' },
              { val: 11, label: 'Noviembre' },
              { val: 12, label: 'Diciembre' },
            ].map((m) => (
              <option key={m.val} value={m.val}>{m.label}</option>
            ))}
          </select>
          {reconnecting && (
            <span className="flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-700 px-3 py-1.5 rounded-xl text-xs font-semibold animate-pulse">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              SIGH Servidor Reconectando...
            </span>
          )}
          <button
            onClick={() => {
              setLoading(true);
              loadDashboardData();
            }}
            className="flex items-center gap-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 px-4 py-2.5 rounded-xl text-sm font-bold shadow-sm transition"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Actualizar</span>
          </button>

          <div className="relative">
            <button
              type="button"
              onClick={() => setProfileMenuOpen((prev) => !prev)}
              className="w-11 h-11 rounded-full bg-slate-900 text-white flex items-center justify-center font-semibold uppercase shadow-lg border border-slate-800"
            >
              {getUserInitial()}
            </button>

            {profileMenuOpen && (
              <div className="absolute right-0 mt-3 w-52 overflow-hidden rounded-3xl border border-slate-200 bg-white text-slate-800 shadow-2xl z-20">
                <button
                  type="button"
                  onClick={handleChangePassword}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left text-slate-700 hover:bg-slate-50 transition"
                >
                  <Settings className="w-4 h-4 text-slate-500" />
                  <span>Cambiar clave</span>
                </button>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left text-slate-700 hover:bg-slate-50 transition"
                >
                  <LogOut className="w-4 h-4 text-slate-500" />
                  <span>Cerrar sesión</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {loading || !data ? (
        <div className="min-h-[400px] flex flex-col items-center justify-center bg-white border border-slate-100 rounded-3xl p-10 shadow-sm">
          <div className="w-12 h-12 border-4 border-slate-100 border-t-blue-500 rounded-full animate-spin mb-4"></div>
          <p className="text-slate-500 text-sm font-semibold">Consolidando métricas de la Intranet Hospitalaria...</p>
        </div>
      ) : (
        <>
            {/* GRID DE CARDS KPI CONECTADOS A DATA REAL */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            
            {/* Card 1: Consulta Externa */}
            <div className="bg-white border border-slate-100 p-5 rounded-3xl shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex items-center justify-between group">
              <div className="space-y-1.5">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Consulta Externa</span>
                <h3 className="text-3xl font-extrabold text-slate-800 tracking-tight">
                  {data.kpis.consultas_medicas.toLocaleString()}
                </h3>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full inline-block ${data.kpis.consultas_tendencia >= 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                  {data.kpis.consultas_tendencia >= 0 ? `+${data.kpis.consultas_tendencia}%` : `${data.kpis.consultas_tendencia}%`} vs mes anterior
                </span>
              </div>
              <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
                <UserCheck className="w-7 h-7 text-sky-500" />
              </div>
            </div>

            {/* Card 2: Emergencia */}
            <div className="bg-white border border-slate-100 p-5 rounded-3xl shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex items-center justify-between group">
              <div className="space-y-1.5">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Emergencia</span>
                <h3 className="text-3xl font-extrabold text-slate-800 tracking-tight">
                  {data.kpis.atenciones_emergencia.toLocaleString()}
                </h3>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full inline-block ${data.kpis.emergencia_tendencia >= 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                  {data.kpis.emergencia_tendencia >= 0 ? `+${data.kpis.emergencia_tendencia}%` : `${data.kpis.emergencia_tendencia}%`} vs mes anterior
                </span>
              </div>
              <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
                <AlertTriangle className="w-7 h-7 text-amber-500" />
              </div>
            </div>

          </div>

          {/* SECCIÓN DE GRÁFICOS INTERACTIVOS */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            
            {/* GRAFICO 1: RENDIMIENTO DE CONSULTAS (BARRAS) */}
            <div className="bg-white border border-slate-100 p-6 md:p-8 rounded-3xl shadow-sm space-y-4 min-w-0">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <h3 className="font-extrabold text-lg text-slate-900">Rendimiento Mensual de Consultas</h3>
                <span className="text-xs font-bold text-sky-500 uppercase bg-sky-50 px-2.5 py-1 rounded-full">
                  CONSULTA EXTERNA
                </span>
              </div>
              <div className="w-full h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.rendimiento_mensual} margin={{ top: 25, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="mes" stroke="#94a3b8" fontSize={12} tickLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} />
                    <Tooltip
                      contentStyle={{ background: '#0f172a', color: '#fff', borderRadius: '12px', border: 'none' }}
                      itemStyle={{ color: '#38bdf8' }}
                    />
                    <Bar 
                      dataKey="cantidad" 
                      fill="#2563eb" 
                      radius={[6, 6, 0, 0]} 
                      name="Atenciones"
                      label={{ position: 'top', fontSize: 11, fontWeight: 700, fill: '#475569', formatter: (v: number) => v.toLocaleString() }}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* GRAFICO 2: RENDIMIENTO DE EMERGENCIA (BARRAS) */}
            <div className="bg-white border border-slate-100 p-6 md:p-8 rounded-3xl shadow-sm space-y-4 min-w-0">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <h3 className="font-extrabold text-lg text-slate-900">Emergencia Mensual</h3>
                <span className="text-xs font-bold text-amber-500 uppercase bg-amber-50 px-2.5 py-1 rounded-full">
                  EMERGENCIA
                </span>
              </div>
              <div className="w-full h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.emergencia_mensual} margin={{ top: 25, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="mes" stroke="#94a3b8" fontSize={12} tickLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} />
                    <Tooltip
                      contentStyle={{ background: '#0f172a', color: '#fff', borderRadius: '12px', border: 'none' }}
                      itemStyle={{ color: '#f59e0b' }}
                    />
                    <Bar 
                      dataKey="cantidad" 
                      fill="#f59e0b" 
                      radius={[6, 6, 0, 0]} 
                      name="Emergencias"
                      label={{ position: 'top', fontSize: 11, fontWeight: 700, fill: '#475569', formatter: (v: number) => v.toLocaleString() }}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>

          {/* SECCION INFERIOR: SERVICIOS HOSPITALARIOS */}
          <div className="bg-gradient-to-br from-white to-slate-50 border border-slate-100 p-6 rounded-[28px] shadow-sm space-y-5">
            <div>
              <h3 className="font-extrabold text-lg text-slate-900">Servicios Hospitalarios</h3>
              <p className="text-slate-500 text-xs mt-0.5">
                Módulos de atención médica principal del hospital.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white border border-slate-100 p-4 rounded-2xl shadow-sm hover:shadow-md transition flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-sky-50 flex items-center justify-center shrink-0">
                  <UserCheck className="w-5 h-5 text-sky-600" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 text-sm">Consulta Externa</h4>
                  <p className="text-slate-400 text-xs mt-1">
                    Atención ambulatoria con especialidades médicas y control de pacientes.
                  </p>
                </div>
              </div>

              <div className="bg-white border border-slate-100 p-4 rounded-2xl shadow-sm hover:shadow-md transition flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 text-sm">Emergencia</h4>
                  <p className="text-slate-400 text-xs mt-1">
                    Atención inmediata de urgencias las 24 horas del día.
                  </p>
                </div>
              </div>

              <div className="bg-white border border-slate-100 p-4 rounded-2xl shadow-sm hover:shadow-md transition flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
                  <Activity className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 text-sm">Hospitalización</h4>
                  <p className="text-slate-400 text-xs mt-1">
                    Internación de pacientes con monitoreo y cuidados continuos.
                  </p>
                </div>
              </div>
            </div>

          </div>
        </>
      )}
    </div>
  );
}