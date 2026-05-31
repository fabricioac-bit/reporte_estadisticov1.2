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
  AreaChart,
  Area,
} from 'recharts';
import {
  Activity,
  UserCheck,
  AlertTriangle,
  Bed,
  LogOut,
  User,
  FileText,
  Signature,
  ShieldCheck,
  Settings,
  RefreshCw,
  HeartPulse,
  Menu,
} from 'lucide-react';

// Estructura estricta basada en el contrato del DashboardService
interface DashboardContract {
  kpis: {
    consultas_medicas: number;
    consultas_tendencia: number;
    cirugias_exitosas: number;
    cirugias_tendencia: number;
    atenciones_emergencia: number;
    emergencia_tendencia: number;
    ocupacion_camas: number;
    camas_tendencia: number;
  };
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
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<string[]>([]);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  // Consolidación de peticiones en un único flujo asíncrono
  const loadDashboardData = async (isRetry = false) => {
    if (isRetry) setReconnecting(true);
    try {
      // Petición directa a la nueva API unificada de 3 capas
      const dashboardRes = await axios.get('/api/dashboard');
      setData(dashboardRes.data);

      // Carga paralela controlada de la sesión del usuario administrativo
      try {
        const userRes = await axios.get('/api/auth/me');
        if (userRes.data.success && userRes.data.usuario) {
          setUsuario(userRes.data.usuario);
        }
      } catch (err) {
        console.warn('Sesión de usuario no disponible en el servidor de autenticación.');
      }

      setLoading(false);
      setReconnecting(false);
    } catch (err: any) {
      console.error('Fallo en la comunicación con la infraestructura del Dashboard:', err);
      setReconnecting(true);
      
      // Reintentar de forma resiliente cada 5 segundos si el servidor SQL no responde
      setTimeout(() => {
        loadDashboardData(true);
      }, 5000);
    }
  };

  useEffect(() => {
    setMounted(true);
    loadDashboardData();
  }, []);

  const handleLogout = async () => {
    Swal.fire({
      title: '¿Desea cerrar sesión?',
      text: 'Se eliminarán sus cookies seguras del navegador.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#2563eb',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Sí, Salir',
      cancelButtonText: 'Cancelar',
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await axios.post('/api/auth/logout');
          Swal.fire({
            title: 'Sesión Cerrada',
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

  const handleToggleSidebar = () => {
    setSidebarCollapsed((prev) => !prev);
    setExpandedGroups([]);
  };

  const handleMenuToggle = (menuKey: string) => {
    if (sidebarCollapsed) {
      setSidebarCollapsed(false);
      setExpandedGroups([menuKey]);
      return;
    }
    setExpandedGroups((prev) => {
      if (prev.includes(menuKey)) return prev.filter((k) => k !== menuKey);
      return [...prev, menuKey];
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
        <input id="swal-current-password" type="password" class="swal2-input" placeholder="Contraseña actual" />
        <input id="swal-new-password" type="password" class="swal2-input" placeholder="Nueva contraseña" />
        <input id="swal-confirm-password" type="password" class="swal2-input" placeholder="Confirmar contraseña" />
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
          Swal.showValidationMessage('La nueva contraseña debe tener al menos 6 caracteres.');
          return null;
        }
        if (newPassword !== confirmPassword) {
          Swal.showValidationMessage('Las contraseñas no coinciden.');
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
        text: 'Su nueva contraseña se ha guardado correctamente.',
        icon: 'success',
        timer: 1400,
        showConfirmButton: false,
      });
    } catch (error: any) {
      Swal.fire({
        title: 'Error',
        text: error?.response?.data?.mensaje || 'No se pudo cambiar la contraseña.',
        icon: 'error',
      });
    }
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row text-slate-800">
      
      {/* SIDEBAR */}
      <aside className={`relative flex-shrink-0 h-screen sticky top-0 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-200 flex flex-col transition-all duration-300 ease-in-out ${sidebarCollapsed ? 'w-20 md:w-20' : 'w-full md:w-72'}`}>
        <div className="p-6 border-b border-slate-800/60 flex items-center justify-between gap-3">
          {!sidebarCollapsed ? (
            <>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-sky-500/20 flex items-center justify-center border border-sky-500/30">
                  <HeartPulse className="w-6 h-6 text-sky-400" />
                </div>
                <div>
                  <h2 className="font-extrabold text-white text-lg tracking-tight leading-none">REZOLA</h2>
                  <span className="text-xs text-slate-500 font-semibold tracking-wider uppercase">Hospitalario</span>
                </div>
              </div>
              <button
                type="button"
                onClick={handleToggleSidebar}
                className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-800/90 bg-slate-950/90 text-sky-200 shadow-inner shadow-slate-950 transition hover:border-sky-500 hover:text-white hover:bg-slate-900"
                aria-label="Colapsar menú"
              >
                <Menu className="w-5 h-5" />
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={handleToggleSidebar}
              className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-800/90 bg-slate-950/90 text-sky-200 shadow-inner shadow-slate-950 transition hover:border-sky-500 hover:text-white hover:bg-slate-900"
              aria-label="Abrir menú"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}
        </div>

        <nav className="relative flex-1 overflow-y-auto p-5 space-y-4 bg-slate-950/30 backdrop-blur-xl">
          {!sidebarCollapsed && <div className="mb-4 px-2 text-xs uppercase tracking-[0.3em] text-sky-300">Módulos clínicos</div>}
          {[
            {
              key: 'produccion',
              label: 'Producción Médica',
              icon: <Activity className="w-5 h-5" />,
              items: [
                { label: 'Consulta Externa', icon: <FileText className="w-4 h-4" /> },
                { label: 'Emergencia', icon: <AlertTriangle className="w-4 h-4" /> },
                { label: 'Hospitalización', icon: <Bed className="w-4 h-4" /> },
              ],
            },
            {
              key: 'programas',
              label: 'Prog. Estratégicos',
              icon: <ShieldCheck className="w-5 h-5" />,
              items: [
                { label: 'Etapa Vida Niño', icon: <HeartPulse className="w-4 h-4" /> },
                { label: 'Planif. Familiar', icon: <UserCheck className="w-4 h-4" /> },
                { label: 'Programa Cáncer', icon: <AlertTriangle className="w-4 h-4" /> },
              ],
            },
          ].map((group) => (
            <div key={group.key} className="space-y-2">
              <button
                type="button"
                onClick={() => handleMenuToggle(group.key)}
                className={`w-full flex items-center justify-between gap-3 text-white transition-all duration-300 ${sidebarCollapsed ? 'justify-center bg-slate-900/90 px-0 py-3' : 'bg-blue-600 hover:bg-blue-700 rounded-2xl px-3 py-3'}`}
                title={group.label}
              >
                <div className="flex items-center gap-3">
                  <span className="rounded-xl bg-white p-2 text-slate-900 shadow-sm">{group.icon}</span>
                  <span className={`${sidebarCollapsed ? 'hidden' : 'block'} font-semibold`}>{group.label}</span>
                </div>
                <span className={`chevron text-xs ${sidebarCollapsed ? 'hidden' : 'block'}`}>▼</span>
              </button>

              {!sidebarCollapsed && expandedGroups.includes(group.key) && (
                <ul className="mt-1 space-y-1">
                  {group.items.map((item) => (
                    <li key={item.label}>
                      <button
                        type="button"
                        className="w-full block rounded-xl px-3 py-2 text-left text-slate-300 hover:text-white hover:bg-slate-800 transition-all duration-200"
                      >
                        <span className="submenu-item inline-flex items-center gap-2 text-sm">
                          <span>{item.icon}</span>
                          {item.label}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </nav>
      </aside>

      {/* CONTENIDO PRINCIPAL */}
      <main className="flex-1 min-h-0 h-screen overflow-y-auto p-6 md:p-10 space-y-8">
        
        {/* BANNER SUPERIOR */}
        <header className="sticky top-0 z-20 bg-white shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-6">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Panel de Control Clínico</h1>
            <p className="text-slate-500 mt-1">Estadística hospitalaria integral y productividad de personal en tiempo real.</p>
          </div>

          <div className="flex items-center gap-3 self-start md:self-auto">
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
        </header>

        {loading || !data ? (
          <div className="min-h-[400px] flex flex-col items-center justify-center bg-white border border-slate-100 rounded-3xl p-10 shadow-sm">
            <div className="w-12 h-12 border-4 border-slate-100 border-t-blue-500 rounded-full animate-spin mb-4"></div>
            <p className="text-slate-500 text-sm font-semibold">Consolidando métricas de la Intranet Hospitalaria...</p>
          </div>
        ) : (
          <>
            {/* GRID DE CARDS KPI CONECTADOS A DATA REAL */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              
              {/* Card 1: Consulta Externa */}
              <div className="bg-white border border-slate-100 p-6 rounded-3xl shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex items-center justify-between group">
                <div className="space-y-2">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Consultas Médicas</span>
                  <h3 className="text-3xl font-extrabold text-slate-800 tracking-tight">
                    {data.kpis.consultas_medicas.toLocaleString()}
                  </h3>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full inline-block ${data.kpis.consultas_tendencia >= 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                    {data.kpis.consultas_tendencia >= 0 ? `+${data.kpis.consultas_tendencia}%` : `${data.kpis.consultas_tendencia}%`} vs mes anterior
                  </span>
                </div>
                <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
                  <UserCheck className="w-8 h-8 text-sky-500" />
                </div>
              </div>

              {/* Card 2: Cirugías */}
              <div className="bg-white border border-slate-100 p-6 rounded-3xl shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex items-center justify-between group">
                <div className="space-y-2">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Cirugías Exitosas</span>
                  <h3 className="text-3xl font-extrabold text-slate-800 tracking-tight">
                    {data.kpis.cirugias_exitosas.toLocaleString()}
                  </h3>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full inline-block ${data.kpis.cirugias_tendencia >= 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                    {data.kpis.cirugias_tendencia >= 0 ? `+${data.kpis.cirugias_tendencia}%` : `${data.kpis.cirugias_tendencia}%`} vs mes anterior
                  </span>
                </div>
                <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
                  <Activity className="w-8 h-8 text-blue-500" />
                </div>
              </div>

              {/* Card 3: Emergencias */}
              <div className="bg-white border border-slate-100 p-6 rounded-3xl shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex items-center justify-between group">
                <div className="space-y-2">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Atenciones Emergencia</span>
                  <h3 className="text-3xl font-extrabold text-slate-800 tracking-tight">
                    {data.kpis.atenciones_emergencia.toLocaleString()}
                  </h3>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full inline-block ${data.kpis.emergencia_tendencia >= 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                    {data.kpis.emergencia_tendencia >= 0 ? `+${data.kpis.emergencia_tendencia}%` : `${data.kpis.emergencia_tendencia}%`} vs mes anterior
                  </span>
                </div>
                <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
                  <AlertTriangle className="w-8 h-8 text-amber-500" />
                </div>
              </div>

              {/* Card 4: Camas */}
              <div className="bg-white border border-slate-100 p-6 rounded-3xl shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex items-center justify-between group">
                <div className="space-y-2">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Ocupación de Camas</span>
                  <h3 className="text-3xl font-extrabold text-slate-800 tracking-tight">
                    {data.kpis.ocupacion_camas}%
                  </h3>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full inline-block ${data.kpis.camas_tendencia >= 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                    {data.kpis.camas_tendencia >= 0 ? `+${data.kpis.camas_tendencia}%` : `${data.kpis.camas_tendencia}%`} esta semana
                  </span>
                </div>
                <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
                  <Bed className="w-8 h-8 text-teal-500" />
                </div>
              </div>

            </div>

            {/* SECCIÓN DE GRÁFICOS INTERACTIVOS */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              
              {/* GRÁFICO 1: RENDIMIENTO DE CONSULTAS (BARRAS) */}
              <div className="bg-white border border-slate-100 p-6 md:p-8 rounded-3xl shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <h3 className="font-extrabold text-lg text-slate-900">Rendimiento Mensual de Consultas</h3>
                  <span className="text-xs font-bold text-sky-500 uppercase bg-sky-50 px-2.5 py-1 rounded-full">
                    SIGH Principal
                  </span>
                </div>
                <div className="w-full h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.rendimiento_mensual} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="mes" stroke="#94a3b8" fontSize={12} tickLine={false} />
                      <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} />
                      <Tooltip
                        contentStyle={{ background: '#0f172a', color: '#fff', borderRadius: '12px', border: 'none' }}
                        itemStyle={{ color: '#38bdf8' }}
                      />
                      {/* Mapeo del eje de consultas usando el campo "cantidad" devuelto por el servicio */}
                      <Bar dataKey="cantidad" fill="#2563eb" radius={[6, 6, 0, 0]} name="Atenciones" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* GRÁFICO 2: HISTORIAL QUIRÚRGICO (ÁREA) */}
              <div className="bg-white border border-slate-100 p-6 md:p-8 rounded-3xl shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <h3 className="font-extrabold text-lg text-slate-900">Historial Quirúrgico Complejo</h3>
                  <span className="text-xs font-bold text-emerald-500 uppercase bg-emerald-50 px-2.5 py-1 rounded-full">
                    SIGH Externa
                  </span>
                </div>
                <div className="w-full h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data.historial_quirurgico} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorCirugia" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="mes" stroke="#94a3b8" fontSize={12} tickLine={false} />
                      <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} />
                      <Tooltip
                        contentStyle={{ background: '#0f172a', color: '#fff', borderRadius: '12px', border: 'none' }}
                        itemStyle={{ color: '#10b981' }}
                      />
                      {/* Mapeo del eje quirúrgico usando el campo "cantidad" devuelto por el servicio */}
                      <Area
                        type="monotone"
                        dataKey="cantidad"
                        stroke="#10b981"
                        strokeWidth={3}
                        fillOpacity={1}
                        fill="url(#colorCirugia)"
                        name="Cirugías"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

            </div>

            {/* SECCIÓN INFERIOR: ACCESOS RÁPIDOS */}
            <div className="bg-gradient-to-br from-white to-slate-50 border border-slate-100 p-8 rounded-[32px] shadow-sm space-y-6">
              <div>
                <h3 className="font-extrabold text-xl text-slate-900">Módulos Administrativos y de Control</h3>
                <p className="text-slate-500 text-sm mt-1">
                  Accesos directos para la gestión del hospital y análisis de interoperabilidad.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm hover:shadow-md transition flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                    <Signature className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 text-sm">Firma Digital</h4>
                    <p className="text-slate-400 text-xs mt-1.5">
                      Firma recetas médicas, órdenes de laboratorio y consentimientos digitales de forma legal y segura.
                    </p>
                  </div>
                </div>

                <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm hover:shadow-md transition flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-6 h-6 text-indigo-600" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 text-sm">Auditoría & Logs</h4>
                    <p className="text-slate-400 text-xs mt-1.5">
                      Monitorea quién consultó, modificó o descargó información sensible del servidor.
                    </p>
                  </div>
                </div>

                <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm hover:shadow-md transition flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
                    <FileText className="w-6 h-6 text-emerald-600" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 text-sm">Exportación en Un Clic</h4>
                    <p className="text-slate-400 text-xs mt-1.5">
                      Descarga resúmenes ejecutivos e indicadores de rendimiento directamente en formato PDF o Excel.
                    </p>
                  </div>
                </div>
              </div>

            </div>
          </>
        )}
      </main>
    </div>
  );
}