'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/layout/Sidebar';

interface UsuarioContract {
  nombre: string;
  usuario: string;
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [usuario, setUsuario] = useState<UsuarioContract | null>(null);

  // Redirigir al dashboard al refrescar la página (F5)
  useEffect(() => {
    const navEntry = performance.getEntriesByType?.('navigation')?.[0] as any;
    const isReload = navEntry?.type === 'reload' || navEntry?.type === 'back_forward';
    const pathname = window.location.pathname;

    if (isReload && pathname !== '/dashboard') {
      router.push('/dashboard');
      return;
    }

    const fetchUsuario = async () => {
      try {
        const userRes = await axios.get('/api/auth/me');
        if (userRes.data.success && userRes.data.usuario) {
          setUsuario(userRes.data.usuario);
        }
      } catch (err) {
        console.warn('Sesión de usuario no disponible en el servidor de autenticación.');
      }
    };

    fetchUsuario();
  }, [router]);

  const toggleSidebar = () => {
    setSidebarCollapsed((prev) => !prev);
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 text-slate-800">
      {/* 
        Pasamos los datos del 'usuario' al Sidebar por si los necesitas mostrar ahí abajo,
        o mantén la estructura limpia actual.
      */}
      <Sidebar collapsed={sidebarCollapsed} onToggle={toggleSidebar} />
      
      {/* Contenedor principal derecho flexible */}
      <div className="flex flex-col flex-1 min-w-0 h-full overflow-x-hidden overflow-y-auto p-6 md:p-10 transition-all duration-300 ease-in-out">
        {/* 
          Pasamos el usuario global a las páginas usando React Context o clonando props si es necesario, 
          pero para mantener tu cabecera funcionando en todas partes de manera idéntica, 
          crearemos un componente Header común o lo inyectaremos aquí.
        */}
        {children}
      </div>
    </div>
  );
}