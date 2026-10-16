'use client';

import Link from "next/link";
import React from "react";

export const Header: React.FC<{
    title?: React.ReactNode;
    children?: React.ReactNode;
}> = ({ title = "Visualización de LLM en 3D", children }) => {
    return (
        <header className="flex flex-wrap justify-between items-center px-3 py-1 bg-slate-950 text-white min-h-[2.5rem] border-b border-slate-800 shadow-sm z-20 flex-shrink-0 select-none">
            {/* Sección izquierda: Controles (Info/Ayuda) y Título */}
            <div className="flex items-center gap-3">
                <div className="flex items-center">{children}</div>
                {title && (
                    <div className="text-sm sm:text-base font-semibold tracking-wide text-slate-100 flex items-center gap-2">
                        <span>{title}</span>
                        <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-blue-600/30 text-blue-300 border border-blue-500/30">
                            nanoGPT 3D
                        </span>
                    </div>
                )}
            </div>

            {/* Sección derecha: Insignia de hardware real RTX 3050 y Enlaces */}
            <div className="flex items-center gap-2 sm:gap-3 my-0.5">
                {/* Insignia con métricas de la RTX 3050 */}
                <div className="flex items-center gap-2 px-2.5 py-1 rounded-md bg-slate-900 border border-slate-700/70 shadow-inner text-xs">
                    <span className="flex h-2 w-2 relative" title="GPU Activa">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    <span className="font-semibold text-emerald-400 tracking-tight">RTX 3050</span>
                    <span className="text-slate-600">|</span>
                    <span className="text-slate-300 font-mono text-[11px]">
                        VRAM: <span className="text-emerald-300 font-semibold">3609 MiB</span> / 4096 MiB
                    </span>
                    <span className="text-slate-600 hidden md:inline">|</span>
                    <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[11px] border border-slate-700 hidden md:inline">
                        CUDA 13.3
                    </span>
                </div>

                {/* Enlace al portafolio original */}
                <div className="text-xs text-slate-400 hover:text-white transition-colors">
                    <Link href={"/portfolio"} className="hover:underline flex items-center gap-1">
                        <span>Portafolio</span>
                    </Link>
                </div>
            </div>
        </header>
    );
};
