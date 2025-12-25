import React from "react";

export function AudioControlBar({
                             item,
                             onPause,
                             isPlaying
                         }: {
    item?: any;
    onPause: () => void;
    isPlaying: boolean;
}) {
    if (!item || !isPlaying) return null;

    return (
        <div className="
            fixed bottom-6 left-1/2 transform -translate-x-1/2 z-[9999]
            bg-gradient-to-r from-blue-900/90 to-purple-900/90
            backdrop-blur-xl
            px-5 py-3 rounded-2xl
            border border-cyan-400/60
            shadow-[0_0_40px_rgba(0,180,255,0.6)]
            flex items-center gap-4
            min-w-[300px] max-w-[90vw]
            animate-fade-in-up
        ">
            <div className="flex-shrink-0">
                <div className="w-12 h-12 rounded-lg overflow-hidden bg-black/40">
                    {item.galeria?.[0]?.url ? (
                        <img
                            src={item.galeria[0].url}
                            alt={item.title}
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-cyan-400">
                            🔊
                        </div>
                    )}
                </div>
            </div>

            <div className="flex-1 min-w-0">
                <div className="text-white text-sm font-bold truncate">
                    {item.title}
                </div>
                <div className="text-cyan-300 text-xs flex items-center gap-2 mt-1">
                    <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
                        <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                        <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                    </div>
                    <span>Narração em reprodução</span>
                </div>
            </div>

            <div className="flex-shrink-0 flex gap-2">
                <button
                    onClick={onPause}
                    className="
                        bg-red-500 hover:bg-red-600
                        text-white
                        w-10 h-10 rounded-full
                        flex items-center justify-center
                        shadow-lg
                        transition-all duration-200
                        active:scale-95
                    "
                    title="Parar narração"
                >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                        <rect x="6" y="5" width="4" height="14"/>
                        <rect x="14" y="5" width="4" height="14"/>
                    </svg>
                </button>

                <div className="text-white/50 text-[10px] text-center w-16">
                    Toque para parar
                </div>
            </div>
        </div>
    );
}