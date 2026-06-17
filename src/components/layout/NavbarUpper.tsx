'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import Swal from 'sweetalert2';
import { RefreshCw, Settings, LogOut } from 'lucide-react';

interface NavbarUpperProps {
  title: string;
  description: string;
  onRefresh?: () => void;
  isRefreshLoading?: boolean;
}

export default function NavbarUpper({ title, description, onRefresh, isRefreshLoading }: NavbarUpperProps) {
  const router = useRouter();
  const [usuario, setUsuario] = useState<{ nombre: string; usuario: string } | null>(null);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [reconnecting, setReconnecting] = useState(false);

  // Consultar el usuario de forma independiente en cualquier página
  useEffect(() => {
    const fetchUsuario = async () => {
      try {
        const userRes = await axios.get('/api/auth/me');
        if (userRes.data.success && userRes.data.usuario) {
          setUsuario(userRes.data.usuario);
        }
      } catch (err) {
        console.warn('Sesión de usuario no disponible.');
      }
    };
    fetchUsuario();
  }, []);

  const getUserInitial = () => {
    const name = usuario?.nombre?.trim();
    const username = usuario?.usuario?.trim();
    if (name) return name[0].toUpperCase();
    if (username) return username[0].toUpperCase();
    return 'U';
  };

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

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-6 w-full">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">{title}</h1>
        <p className="text-slate-500 mt-1">{description}</p>
      </div>

      <div className="flex items-center gap-3 self-start md:self-auto">
        {reconnecting && (
          <span className="flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-700 px-3 py-1.5 rounded-xl text-xs font-semibold animate-pulse">
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            SIGH Servidor Reconectando...
          </span>
        )}
        
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={isRefreshLoading}
            className="flex items-center gap-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 px-4 py-2.5 rounded-xl text-sm font-bold shadow-sm transition disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshLoading ? 'animate-spin' : ''}`} />
            <span>Actualizar</span>
          </button>
        )}

        <div className="relative">
          <button
            type="button"
            onClick={() => setProfileMenuOpen((prev) => !prev)}
            className="w-11 h-11 rounded-full bg-slate-900 text-white flex items-center justify-center font-semibold uppercase shadow-lg border border-slate-800"
          >
            {getUserInitial()}
          </button>

          {profileMenuOpen && (
            <div className="absolute right-0 mt-3 w-52 overflow-hidden rounded-3xl border border-slate-200 bg-white text-slate-800 shadow-2xl z-30">
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
  );
}