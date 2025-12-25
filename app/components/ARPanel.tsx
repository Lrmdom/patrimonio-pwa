import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

/* ============================
   UTILITÁRIOS GEO
============================ */
function getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
    const R = 6371e3;
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a =
        Math.sin(Δφ / 2) ** 2 +
        Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;

    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function getBearing(lat1: number, lon1: number, lat2: number, lon2: number) {
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const y = Math.sin(Δλ) * Math.cos(φ2);
    const x =
        Math.cos(φ1) * Math.sin(φ2) -
        Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);

    return (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;
}

/* =========================
   HEADING (bússola real)
========================= */
function useHeading() {
    const [heading, setHeading] = useState<number | null>(null);
    const [permissionAsked, setPermissionAsked] = useState(false);

    useEffect(() => {
        const requestPermission = async () => {
            if (typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
                try {
                    const permission = await (DeviceOrientationEvent as any).requestPermission();
                    if (permission === 'granted') {
                        startListening();
                    }
                } catch (error) {
                    console.error('Permissão negada para orientação:', error);
                }
                setPermissionAsked(true);
            } else {
                startListening();
            }
        };

        const startListening = () => {
            const handler = (e: DeviceOrientationEvent) => {
                if (e.alpha !== null) {
                    setHeading(e.alpha);
                }
            };

            window.addEventListener('deviceorientation', handler, true);

            return () => {
                window.removeEventListener('deviceorientation', handler);
            };
        };

        requestPermission();
    }, []);

    return heading;
}


    function FloatingCardsOverlay({
                                      items,
                                      userPos,
                                  }: {
        items: any[];
        userPos: [number, number];
    }) {
        const heading = useHeading();
        const audioRef = useRef<HTMLAudioElement>(null); // <-- ADICIONAR
        const [currentPlayingId, setCurrentPlayingId] = useState<string | null>(null); // <-- ADICIONAR
        const R2_PUBLIC_URL = "https://pub-72037178c35c4cb1b3448777a2c80f0a.r2.dev";

        const handleAudioPlay = (e: React.MouseEvent, itemId: string, fileKey: string) => {
            e.stopPropagation();

            if (!audioRef.current) {
                audioRef.current = new Audio();
            }

            const audio = audioRef.current;

            if (currentPlayingId === itemId && !audio.paused) {
                // Pausar se já está a tocar
                audio.pause();
                setCurrentPlayingId(null);
            } else {
                // Tocar novo áudio
                if (currentPlayingId) {
                    audio.pause();
                }

                audio.src = `${R2_PUBLIC_URL}/${fileKey}`;
                audio.play()
                    .then(() => {
                        setCurrentPlayingId(itemId);
                    })
                    .catch(err => {
                        console.error('Erro ao reproduzir áudio:', err);
                    });
            }
        };

        if (!heading) {
            return (
                <div className="absolute inset-0 z-[9000] flex items-center justify-center">
                    <div className="bg-black/70 px-6 py-4 rounded-2xl text-white text-center">
                        <div className="text-cyan-400 text-2xl mb-2">🧭</div>
                        <div>Gire o dispositivo para calibrar a bússola</div>
                        <div className="text-sm text-white/50 mt-2">Permita acesso ao sensor de orientação</div>
                    </div>
                </div>
            );
        }

        const visibleItems = items
            .filter(i => i.coordenadas)
            .map(item => {
                const distance = getDistance(
                    userPos[0],
                    userPos[1],
                    item.coordenadas.lat,
                    item.coordenadas.lng
                );

                const bearing = getBearing(
                    userPos[0],
                    userPos[1],
                    item.coordenadas.lat,
                    item.coordenadas.lng
                );

                const relative = ((bearing - heading + 540) % 360) - 180;

                return { item, distance, bearing, relative };
            })
            .filter(i => Math.abs(i.relative) < 30)
            .sort((a, b) => a.distance - b.distance)
            .slice(0, 5)
            .map((item, index) => ({
                ...item,
                zIndex: 9000 + (5 - index),
                sizeScale: calculateSizeScale(item.distance),
            }));

        function calculateSizeScale(distance: number): number {
            const maxDistance = 1000;
            const minScale = 0.7;
            const maxScale = 1.2;

            if (distance <= 0) return maxScale;
            if (distance >= maxDistance) return minScale;

            const normalizedDistance = distance / maxDistance;
            return maxScale - (normalizedDistance * (maxScale - minScale));
        }

        if (visibleItems.length === 0) {
            return null;
        }

        return (
            <div className="absolute inset-0">
                {/* Elemento de áudio escondido */}
                <audio ref={audioRef} style={{ display: 'none' }} />

                {visibleItems.map(({ item, distance, relative, zIndex, sizeScale }) => {
                    const screenX = 50 + (relative / 30) * 50;
                    const angleScale = Math.max(0.8, 1 - Math.abs(relative) / 40);
                    const finalScale = angleScale * sizeScale;
                    const angleOpacity = Math.max(0.7, 1 - Math.abs(relative) / 60);
                    const distanceOpacity = Math.max(0.5, 1 - (distance / 2000));
                    const opacity = Math.min(angleOpacity, distanceOpacity);

                    return (
                        <div
                            key={item._id}
                            style={{
                                position: 'absolute',
                                left: `${screenX}%`,
                                top: '45%',
                                transform: `translateX(-50%) scale(${finalScale})`,
                                opacity: opacity,
                                zIndex: zIndex,
                                marginTop: `${(distance / 100) * 2}px`,
                                pointerEvents: 'auto', // <-- IMPORTANTE: permitir interação
                                ...(item.galeria?.[0]?.url ? {
                                    backgroundImage: `url(${item.galeria[0].url})`,
                                    backgroundSize: 'cover',
                                    backgroundPosition: 'center',
                                } : {
                                    backgroundColor: 'rgba(0, 0, 0, 0.8)'
                                })
                            }}
                            className="
                            px-4 py-3 rounded-2xl
                            min-w-[160px]
                            text-center
                            transition-all duration-300
                            relative overflow-hidden
                            border border-cyan-400/50
                            shadow-[0_0_30px_rgba(0,255,255,0.3)]
                        "
                        >
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

                                {/* ÁUDIO - CORRIGIDO */}
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

                                <div className="mt-2 h-1 w-full bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent"></div>
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    }

/* =========================
   COMPONENTE AR SIMPLIFICADO
========================= */
export default function ARPanel({
                                    items,
                                    onClose,
                                }: {
    items: any[];
    onClose: () => void;
}) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [userPos, setUserPos] = useState<[number, number] | null>(null);
    const [arActive, setArActive] = useState(false);
    const [cameraError, setCameraError] = useState<string | null>(null);
    const [debugInfo, setDebugInfo] = useState<string>('');

    // 1. Obter localização
    useEffect(() => {
        if (!navigator.geolocation) {
            setCameraError('GPS não suportado');
            return;
        }

        const watchId = navigator.geolocation.watchPosition(
            (position) => {
                setUserPos([
                    position.coords.latitude,
                    position.coords.longitude
                ]);
                setDebugInfo(`GPS: ${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)}`);
            },
            (error) => {
                console.error('Erro GPS:', error);
                setCameraError('Ative a localização para usar o AR');
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0
            }
        );

        return () => navigator.geolocation.clearWatch(watchId);
    }, []);

    // 2. Iniciar câmara
    const startCamera = async () => {
        try {
            setCameraError(null);

            // Limpar vídeo anterior
            if (videoRef.current && videoRef.current.srcObject) {
                const stream = videoRef.current.srcObject as MediaStream;
                stream.getTracks().forEach(track => track.stop());
            }

            // Configurar constraints - IMPORTANTE para mobile
            const constraints: MediaStreamConstraints = {
                video: {
                    facingMode: { ideal: 'environment' }, // Câmara traseira
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                    frameRate: { ideal: 30 }
                },
                audio: false
            };

            // Verificar se é iOS Safari
            const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
            const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

            if (isIOS && isSafari) {
                // Safari iOS tem constraints específicas
                constraints.video = {
                    facingMode: { exact: 'environment' } as any,
                    width: { ideal: window.innerWidth },
                    height: { ideal: window.innerHeight }
                };
            }

            const stream = await navigator.mediaDevices.getUserMedia(constraints);

            if (videoRef.current) {
                videoRef.current.srcObject = stream;

                // Aguardar o vídeo estar pronto
                videoRef.current.onloadedmetadata = () => {
                    videoRef.current?.play().catch(e => {
                        console.error('Erro ao reproduzir vídeo:', e);
                        setCameraError('Não foi possível iniciar a câmara');
                    });
                };
            }

            setArActive(true);

            // Feedback tátil
            if (navigator.vibrate) navigator.vibrate([50]);

        } catch (error: any) {
            console.error('Erro câmara detalhado:', error);

            let errorMsg = 'Não foi possível aceder à câmara';

            if (error.name === 'NotAllowedError') {
                errorMsg = 'Permissão da câmara negada. Ative nas configurações do dispositivo.';
            } else if (error.name === 'NotFoundError') {
                errorMsg = 'Câmara traseira não encontrada';
            } else if (error.name === 'NotReadableError') {
                errorMsg = 'Câmara já em uso por outra aplicação';
            } else if (error.name === 'OverconstrainedError') {
                errorMsg = 'Configuração da câmara não suportada';
            }

            setCameraError(errorMsg);
            setArActive(false);
        }
    };

    // 3. Parar câmara
    const stopCamera = () => {
        if (videoRef.current && videoRef.current.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream;
            stream.getTracks().forEach(track => {
                track.stop();
            });
            videoRef.current.srcObject = null;
        }
        setArActive(false);
    };

    // 4. Limpar ao desmontar
    useEffect(() => {
        return () => {
            stopCamera();
        };
    }, []);

    return (
        <div
            ref={containerRef}
            className="fixed inset-0 z-[5000] bg-black overflow-hidden"
            style={{
                // Forçar orientação paisagem no mobile
                transform: 'rotate(0deg)'
            }}
        >
            {/* Video da câmara em tela cheia */}
            <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="absolute inset-0 w-full h-full object-cover z-0"
                style={{
                    transform: 'scaleX(-1)' // Espelhar para parecer normal
                }}
            />

            {/* Overlay escuro para melhor contraste */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent z-10"></div>

            {/* Cards flutuantes */}
            {userPos && arActive && !cameraError && (
                <FloatingCardsOverlay items={items} userPos={userPos} />
            )}

            {/* Splash inicial */}
            {!arActive && (
                <div className="absolute inset-0 z-[6000] flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-black to-slate-900 px-8">
                    <div className="text-center mb-10">
                        <div className="text-cyan-400 text-5xl mb-6">🌍</div>
                        <h2 className="text-white text-3xl font-bold mb-4">
                            Guia Turístico AR
                        </h2>
                        <p className="text-white/70 text-sm max-w-md mb-2">
                            Aponte a câmara para o mundo real e veja pontos de interesse
                        </p>
                        <div className="text-white/50 text-xs">
                            Funciona melhor em <strong>modo paisagem</strong>
                        </div>
                    </div>

                    {/* Status da localização */}
                    <div className="mb-8 p-5 bg-black/40 rounded-2xl border border-cyan-800/50 w-full max-w-sm">
                        <div className="flex items-center justify-between mb-3">
                            <div className="text-white text-sm">📍 Localização</div>
                            <div className={`w-3 h-3 rounded-full ${userPos ? 'bg-green-500' : 'bg-yellow-500 animate-pulse'}`}></div>
                        </div>
                        {userPos ? (
                            <div className="text-cyan-400 font-mono text-sm">
                                Lat: {userPos[0].toFixed(6)}
                                <br />
                                Lon: {userPos[1].toFixed(6)}
                            </div>
                        ) : (
                            <div className="text-yellow-400 text-sm">
                                A obter localização GPS...
                            </div>
                        )}
                    </div>

                    {/* Botão principal */}
                    <button
                        onClick={startCamera}
                        disabled={cameraError !== null}
                        className={`
                            ${cameraError ? 'bg-gray-700 cursor-not-allowed' : 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:shadow-[0_0_40px_rgba(0,255,255,0.7)] hover:scale-105'}
                            text-white font-black px-12 py-5 
                            rounded-2xl text-xl uppercase 
                            shadow-[0_0_30px_rgba(0,255,255,0.5)]
                            transition-all duration-300
                            mb-6
                        `}
                    >
                        {cameraError ? '❌ ERRO CÂMARA' : '🚀 ATIVAR REALIDADE AUMENTADA'}
                    </button>

                    {cameraError && (
                        <div className="bg-red-900/50 border border-red-700 rounded-xl p-4 max-w-sm mb-6">
                            <div className="text-red-300 text-sm font-bold mb-1">Erro:</div>
                            <div className="text-red-200 text-xs">{cameraError}</div>
                            <button
                                onClick={() => setCameraError(null)}
                                className="mt-3 text-cyan-400 text-sm hover:underline"
                            >
                                Tentar novamente
                            </button>
                        </div>
                    )}

                    {/* Instruções */}
                    <div className="mt-4 text-white/40 text-xs text-center max-w-sm">
                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-cyan-500 rounded-full"></div>
                                <span>Permita câmara</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-cyan-500 rounded-full"></div>
                                <span>Use GPS</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-cyan-500 rounded-full"></div>
                                <span>Boa iluminação</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-cyan-500 rounded-full"></div>
                                <span>Modo paisagem</span>
                            </div>
                        </div>
                        <div className="text-[10px]">
                            Compatível com iOS 13+ e Android 8+
                        </div>
                    </div>
                </div>
            )}

            {/* Botão fechar */}
            <button
                onClick={() => {
                    stopCamera();
                    onClose();
                }}
                className="
                    absolute top-6 right-6 z-[7000]
                    text-white bg-black/60 hover:bg-black/80
                    w-14 h-14 rounded-full
                    flex items-center justify-center
                    backdrop-blur
                    border border-white/20
                    shadow-lg
                    transition-all duration-200
                    hover:scale-110
                "
                aria-label="Fechar AR"
            >
                ✕
            </button>

            {/* Indicador AR ativo */}
            {arActive && !cameraError && (
                <div className="
                    absolute top-6 left-6 z-[7000]
                    bg-gradient-to-r from-green-500/20 to-cyan-500/20 backdrop-blur
                    px-4 py-2 rounded-full
                    border border-green-500/50
                    text-green-400 text-sm font-bold
                    flex items-center gap-2
                    animate-pulse
                ">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    AR ATIVO • {items.filter(i => i.coordenadas).length} LOCAIS
                </div>
            )}

            {/* Debug info (apenas desenvolvimento) */}
            {process.env.NODE_ENV === 'development' && (
                <div className="absolute bottom-4 left-4 z-[7000] bg-black/80 text-white text-xs p-3 rounded-lg font-mono">
                    <div>AR: {arActive ? 'ON' : 'OFF'}</div>
                    <div>GPS: {userPos ? 'OK' : '...'}</div>
                    <div>Erro: {cameraError || 'none'}</div>
                    <div>Items: {items.length}</div>
                    <div className="text-[10px] mt-1">{debugInfo}</div>
                </div>
            )}

            {/* Aviso de orientação */}
            {arActive && window.innerHeight > window.innerWidth && (
                <div className="
                    absolute inset-0 z-[8000]
                    bg-black/90
                    flex flex-col items-center justify-center
                    text-center p-6
                ">
                    <div className="text-cyan-400 text-6xl mb-6 animate-bounce">↻</div>
                    <h3 className="text-white text-2xl font-bold mb-4">
                        Gire para Modo Paisagem
                    </h3>
                    <p className="text-white/70 mb-6 max-w-md">
                        Para melhor experiência, vire o dispositivo horizontalmente
                    </p>
                    <div className="text-white/50 text-sm">
                        A câmara continuará ativa
                    </div>
                </div>
            )}
        </div>
    );
}