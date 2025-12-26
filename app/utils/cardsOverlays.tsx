import React, {useEffect, useRef, useState} from "react";
import {useStableHeading} from "~/utils/compassUtilities";
import {getBearing, getDistance} from "~/utils/geoUtilities";

export function FloatingCardsOverlay({
                                         items,
                                         userPos,
                                         onAudioPlay,
                                         onAudioPause,
                                         currentAudioId,
                                         isAudioPlaying,
                                     }: {
    items: any[];
    userPos: [number, number];
    onAudioPlay: (itemId: string, fileKey: string) => void;
    onAudioPause: () => void;
    currentAudioId: string | null;
    isAudioPlaying: boolean;
}) {
    // 1. O hook agora retorna um objeto { heading, pitch }
    const orientation = useStableHeading();
    const heading = orientation?.heading;
    const pitch = orientation?.pitch;

    const audioRef = useRef<HTMLAudioElement>(null);
    const [currentPlayingId, setCurrentPlayingId] = useState<string | null>(null);
    const [hiddenItems, setHiddenItems] = useState<Set<string>>(new Set());
    const [prevUserPos, setPrevUserPos] = useState<[number, number] | null>(null);

    useEffect(() => {
        if (userPos && prevUserPos) {
            const distance = getDistance(
                userPos[0], userPos[1],
                prevUserPos[0], prevUserPos[1]
            );

            if (distance > 2) {
                setPrevUserPos(userPos);
            }
        } else if (userPos && !prevUserPos) {
            setPrevUserPos(userPos);
        }
    }, [userPos, prevUserPos]);

    const handleAudioPlay = (e: React.MouseEvent, itemId: string, fileKey: string) => {
        e.stopPropagation();
        onAudioPlay(itemId, fileKey);
    };

    const handleCloseItem = (e: React.MouseEvent, itemId: string) => {
        e.stopPropagation();
        setHiddenItems(prev => new Set(prev).add(itemId));

        if (currentPlayingId === itemId && audioRef.current) {
            audioRef.current.pause();
            setCurrentPlayingId(null);
        }
    };

    const restoreAllItems = () => {
        setHiddenItems(new Set());
    };

    if (!heading) {
        return (
            <div className="absolute inset-0 z-[9000] flex items-center justify-center">
                <div className="bg-black/70 px-6 py-4 rounded-2xl text-white text-center">
                    <div className="text-cyan-400 text-2xl mb-2">🧭</div>
                    <div>A aguardar sensores...</div>
                </div>
            </div>
        );
    }

    const visibleItems = items
        .filter(i => i.coordenadas && !hiddenItems.has(i._id))
        .map(item => {
            const distance = getDistance(
                (prevUserPos || userPos)[0],
                (prevUserPos || userPos)[1],
                item.coordenadas.lat,
                item.coordenadas.lng
            );

            const bearing = getBearing(
                (prevUserPos || userPos)[0],
                (prevUserPos || userPos)[1],
                item.coordenadas.lat,
                item.coordenadas.lng
            );

            let relative =  bearing - heading  ;
            if (relative > 180) relative -= 360;
            if (relative < -180) relative += 360;

            return {
                item,
                distance,
                relative,
                // Reduzimos o FOV para 40 para o card sair mais rápido da tela ao girar
                isVisible: Math.abs(relative) <= 30
            };
        })
        .filter(i => i.isVisible && i.distance > 15) // NÃO MOSTRAR pontos a menos de 15 metros em AR
        .sort((a, b) => a.distance - b.distance);

    function calculateSizeScale(distance: number): number {
        const maxDistance = 50;
        const minScale = 0.5;
        const maxScale = 1.00;

        if (distance <= 0) return maxScale;
        if (distance >= maxDistance) return minScale;

        const normalizedDistance = distance / maxDistance;
        return maxScale - (normalizedDistance * (maxScale - minScale));
    }

    const hasHiddenItems = hiddenItems.size > 0;
    const allItemsHidden = hiddenItems.size === items.filter(i => i.coordenadas).length;

    if (allItemsHidden) {
        return (
            <div className="absolute inset-0 flex items-center justify-center">
                <div className="bg-black/70 backdrop-blur-sm px-6 py-4 rounded-2xl text-white text-center">
                    <div className="text-cyan-400 text-2xl mb-2">👁️</div>
                    <div>Todos os pontos de interesse foram fechados</div>
                    <button
                        onClick={restoreAllItems}
                        className="mt-3 bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded-lg text-sm transition-colors"
                    >
                        Restaurar todos os pontos
                    </button>
                </div>
            </div>
        );
    }

    if (visibleItems.length === 0) {
        return null;
    }

    return (
        <div className="absolute inset-0">
            {/* Botão flutuante para restaurar itens (se houver fechados) */}
            {hasHiddenItems && (
                <button
                    onClick={restoreAllItems}
                    className="
                        absolute top-20 right-4 z-[9999]
                        bg-cyan-600/80 hover:bg-cyan-700/80
                        text-white text-xs font-bold
                        px-3 py-1.5 rounded-full
                        backdrop-blur-sm
                        border border-cyan-400/50
                        shadow-lg
                        transition-all duration-200
                        flex items-center gap-1
                    "
                    title={`Restaurar ${hiddenItems.size} ponto(s) fechado(s)`}
                >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z"/>
                    </svg>
                    {hiddenItems.size}
                </button>
            )}

            {visibleItems.map(({ item, distance, relative }) => {

                // --- CÁLCULO HORIZONTAL ---
                // Se o telefone gira 30 graus, o card deve estar na borda (100% ou 0%)
                const hFOV = 60;
                const screenX = 50 + (relative / (hFOV / 2)) * 50;


                const horizonBase = 40; // Subimos um pouco a linha do horizonte base
// No modo paisagem, o pitch (beta) costuma andar perto de 0 quando vertical
// ou 90 dependendo da orientação. Vamos normalizar:
                // Em vez de usar apenas o pitch puro, aplicamos uma zona morta ou suavização
                const currentPitch = pitch || 0;
// Limitamos a influência do pitch para que os cartões fiquem mais "presos" ao horizonte
                let calculatedY = 50 + (currentPitch * 0.8); // Reduzido de 1.5 para 0.8
                const screenY = Math.max(20, Math.min(80, calculatedY));


                const sizeScale = calculateSizeScale(distance);
                const opacity = Math.max(0.4, 1 - (distance / 1500));
                const arrowRotation = relative;
                return (
                    <div
                        key={item._id}
                        style={{
                            position: 'absolute',
                            left: `${screenX}%`,
                            top: `${screenY}%`,
                            transform: `translate(-50%, -50%) scale(${sizeScale})`,
                            transition: 'left 0.2s ease-out, top 0.2s ease-out',
                            opacity: opacity,
                            zIndex: 9000,
                            pointerEvents: 'auto',
                            // Se usares imagem de fundo, garante que o card tem tamanho
                            ...(item.galeria?.[0]?.url && {
                                backgroundImage: `url(${item.galeria[0].url})`,
                                backgroundSize: 'cover',
                                backgroundPosition: 'center',
                            })
                        }}
                        // Remove o transition temporariamente para veres onde eles estão sem lag
                        className="px-4 py-3 rounded-2xl min-w-[180px] min-h-[120px] text-center shadow-2xl flex flex-col justify-between"
                    >
                        {/* Botão de fechar */}
                        <button
                            onClick={(e) => handleCloseItem(e, item._id)}
                            className="
                                absolute top-0 right-0 z-30
                                bg-red-500
                                text-white
                                w-7 h-7 rounded-full
                                flex items-center justify-center
                                shadow-lg
                                border-2 border-white
                                hover:bg-red-600
                                active:bg-red-700
                                active:scale-90
                                transition-all duration-150
                                opacity-100 !important
                            "
                            title="Fechar este ponto"
                            aria-label="Fechar"
                        >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                            </svg>
                        </button>

                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent"></div>

                        <div className="relative z-10">
                            <div className="bg-gradient-to-r from-black/80 to-black/60 backdrop-blur-sm px-3 py-1 rounded-t-2xl -mx-4 -mt-3 mb-2">
                                <div className="text-white text-[10px] font-black uppercase">
                                    {item.title}
                                </div>
                            </div>

                            <div className="bg-black/80 backdrop-blur-sm inline-block px-3 py-1 rounded-full mb-1">
                                <div className="text-cyan-300 font-mono text-xl font-bold">
                                    {Math.round(distance)}m
                                </div>
                            </div>

                            {/* ÁUDIO */}
                            {item.audioNarracao?.fileKey && (
                                <div className="mt-2 bg-blue-900/50 rounded-lg p-2 border border-blue-400/50 flex items-center gap-3">
                                    <button
                                        onClick={(e) => handleAudioPlay(e, item._id, item.audioNarracao.fileKey)}
                                        className="bg-blue-600 hover:bg-blue-700 text-white rounded-full p-2 shadow-sm flex-shrink-0 transition-colors"
                                    >
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                                            {currentPlayingId === item._id ? (
                                                <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
                                            ) : (
                                                <path d="M8 5v14l11-7z"/>
                                            )}
                                        </svg>
                                    </button>
                                    <div className="flex flex-col">
                                        <span className="text-[9px] font-bold text-blue-200 uppercase">
                                            Narração
                                        </span>
                                        <span className="text-[8px] text-blue-300">
                                            {currentPlayingId === item._id ? 'A tocar...' : 'Ouvir narração'}
                                        </span>
                                    </div>
                                </div>
                            )}

                            {item.categoria && (
                                <div className="bg-black/70 backdrop-blur-sm inline-block px-2 py-0.5 rounded-full mt-2">
                                    <div className="text-white/90 text-[8px]">
                                        {item.categoria}
                                    </div>
                                </div>
                            )}

                            {distance < 50 && (
                                <div className="bg-gradient-to-r from-green-500/30 to-green-700/30 backdrop-blur-sm px-2 py-0.5 rounded-full mt-2 inline-block">
                                    <div className="text-green-300 text-[8px] animate-pulse">
                                        ⭐ PRÓXIMO
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}