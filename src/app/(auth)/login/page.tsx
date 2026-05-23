'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, LoginInput } from '@/lib/validations';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import Swal from 'sweetalert2';
import {
  HeartPulse,
  User,
  Lock,
  Eye,
  EyeOff,
  LogIn,
  AlertCircle,
  Stethoscope,
  TrendingUp,
  FlaskConical,
} from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [hasErrorShake, setHasErrorShake] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginInput) => {
    setIsLoading(true);
    setErrorMsg(null);
    setHasErrorShake(false);

    try {
      const response = await axios.post('/api/auth/login', {
        usuario: data.usuario.trim(),
        password: data.password.trim(),
      });

      if (response.data.success) {
        // Simular loader por 1.8 segundos para emular la experiencia original
        setTimeout(() => {
          setIsLoading(false);
          Swal.fire({
            title: '¡Acceso Concedido!',
            text: `Bienvenido al sistema, ${response.data.usuario?.nombre || 'Usuario'}`,
            icon: 'success',
            confirmButtonColor: '#2563eb',
            timer: 1500,
            showConfirmButton: false,
          }).then(() => {
            router.push('/dashboard');
            router.refresh();
          });
        }, 1800);
      }
    } catch (err: any) {
      setIsLoading(false);
      const msg = err.response?.data?.mensaje || 'Error al conectar con el servidor.';
      setErrorMsg(msg);
      setHasErrorShake(true);

      // Desactivar animación de sacudida tras 500ms
      setTimeout(() => {
        setHasErrorShake(false);
      }, 500);
    }
  };

  return (
    <main className="min-height-100vh w-full min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 via-sky-50 to-slate-50 relative overflow-hidden px-4">
      {/* CAPA DE FONDO */}
      <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_top_left,rgba(37,99,235,0.15),transparent_40%),radial-gradient(circle_at_bottom_right,rgba(14,165,233,0.12),transparent_40%)] pointer-events-none" />

      {/* CONTENEDOR LOGIN */}
      <div className="w-full max-w-[1100px] min-h-[600px] grid grid-cols-1 md:grid-cols-2 rounded-[30px] overflow-hidden shadow-2xl relative z-10 glass-panel">
        
        {/* PANEL IZQUIERDO (Hospital Info) */}
        <div className="hidden md:flex flex-col justify-center relative p-12 text-white bg-gradient-to-br from-sky-500 to-blue-600 overflow-hidden">
          {/* Círculo decorativo */}
          <div className="absolute -top-32 -right-32 w-80 h-80 bg-white/10 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-blue-900/10 rounded-full blur-2xl pointer-events-none" />

          <div className="w-20 h-20 rounded-[24px] flex items-center justify-center text-4xl bg-white/20 backdrop-blur-md mb-8 shadow-inner">
            <HeartPulse className="w-12 h-12 text-white animate-pulse" />
          </div>

          <h1 className="text-4xl font-extrabold tracking-tight mb-4 text-white font-sans drop-shadow-sm">
            Rezola Hospitalario
          </h1>

          <p className="text-slate-100/95 leading-relaxed text-base mb-10 font-sans font-light">
            Plataforma inteligente de gestión médica, análisis clínico y monitoreo de productividad de profesionales de la salud.
          </p>

          {/* LISTA MEDICA */}
          <div className="flex flex-col gap-5 w-full">
            <div className="flex items-center gap-4 bg-white/10 backdrop-blur-md px-5 py-4 rounded-2xl hover:bg-white/15 transition duration-300">
              <Stethoscope className="w-6 h-6 text-sky-200" />
              <span className="font-sans text-sm font-medium">Gestión Médica Integral</span>
            </div>

            <div className="flex items-center gap-4 bg-white/10 backdrop-blur-md px-5 py-4 rounded-2xl hover:bg-white/15 transition duration-300">
              <TrendingUp className="w-6 h-6 text-sky-200" />
              <span className="font-sans text-sm font-medium">Estadísticas & KPIs Inteligentes</span>
            </div>

            <div className="flex items-center gap-4 bg-white/10 backdrop-blur-md px-5 py-4 rounded-2xl hover:bg-white/15 transition duration-300">
              <FlaskConical className="w-6 h-6 text-sky-200" />
              <span className="font-sans text-sm font-medium">Análisis de Productividad</span>
            </div>
          </div>
        </div>

        {/* PANEL DERECHO (Formulario de Login) */}
        <div className="flex flex-col justify-center bg-white p-8 md:p-14">
          <div className="mb-8">
            <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">
              INICIO DE SESIÓN
            </h2>
            <p className="text-slate-500 mt-2 text-sm">
              Accede al portal administrativo y clínico
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            
            {/* GRUPO USUARIO */}
            <div className="space-y-2">
              <label className="block text-sm font-bold text-slate-700">Usuario</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-blue-500" />
                </span>
                <input
                  type="text"
                  placeholder="Ingrese su usuario"
                  {...register('usuario')}
                  className={`w-full pl-12 pr-4 py-4 bg-slate-50 border rounded-2xl text-slate-800 text-sm focus:outline-none transition duration-300 ${
                    errors.usuario || hasErrorShake
                      ? 'border-red-500 focus:border-red-500 focus:ring-4 focus:ring-red-100 animate-shake'
                      : 'border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100'
                  }`}
                />
              </div>
              {errors.usuario && (
                <p className="text-xs text-red-500 font-semibold">{errors.usuario.message}</p>
              )}
            </div>

            {/* GRUPO CONTRASEÑA */}
            <div className="space-y-2">
              <label className="block text-sm font-bold text-slate-700">Contraseña</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-blue-500" />
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Ingrese su contraseña"
                  {...register('password')}
                  className={`w-full pl-12 pr-12 py-4 bg-slate-50 border rounded-2xl text-slate-800 text-sm focus:outline-none transition duration-300 ${
                    errors.password || hasErrorShake
                      ? 'border-red-500 focus:border-red-500 focus:ring-4 focus:ring-red-100 animate-shake'
                      : 'border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-blue-500 transition duration-200"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-red-500 font-semibold">{errors.password.message}</p>
              )}
            </div>

            {/* OPCIONES EXTRA */}
            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 cursor-pointer text-slate-600 font-medium">
                <input
                  type="checkbox"
                  className="rounded text-blue-600 focus:ring-blue-500 border-slate-300 w-4 h-4 cursor-pointer"
                />
                <span>Recordarme</span>
              </label>
              <a href="#" className="text-blue-600 hover:underline font-semibold transition">
                ¿Olvidó su contraseña?
              </a>
            </div>

            {/* BOTÓN SUBMIT */}
            <button
              type="submit"
              className="w-full py-4 px-6 flex items-center justify-center gap-3 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white rounded-2xl font-bold shadow-lg shadow-blue-500/20 hover:shadow-blue-500/35 hover:-translate-y-[2px] active:translate-y-0 transition-all duration-300"
            >
              <LogIn className="w-5 h-5" />
              <span>Ingresar al Sistema</span>
            </button>
          </form>

          {/* MENSAJE DE ERROR LOCAL (Shake y Alerta roja) */}
          {errorMsg && (
            <div className="mt-6 flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 px-5 py-4 rounded-2xl text-sm font-medium animate-fadeIn">
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}
        </div>
      </div>

      {/* CAPA DE LOADER DE AUTENTICACIÓN */}
      {isLoading && (
        <div className="fixed inset-0 z-[9999] bg-slate-900/75 backdrop-blur-md flex items-center justify-center animate-fadeIn">
          <div className="bg-white p-10 rounded-[28px] text-center w-80 shadow-2xl flex flex-col items-center">
            <div className="w-16 h-16 border-4 border-slate-100 border-t-sky-500 rounded-full animate-spin mb-6"></div>
            <h3 className="text-xl font-extrabold text-slate-800">
              Ingresando al sistema...
            </h3>
            <p className="text-slate-400 mt-2 text-sm">
              Verificando credenciales
            </p>
          </div>
        </div>
      )}
    </main>
  );
}
