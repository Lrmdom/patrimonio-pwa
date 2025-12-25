import React, {useCallback, useEffect, useRef, useState} from 'react';
import {useSmartGPS} from "~/utils/geoUtilities";
import {AudioControlBar} from "~/utils/audioUtilities";
import {FloatingCardsOverlay} from "~/utils/cardsOverlays";

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
    const audioRef = useRef<HTMLAudioElement>(null);
    const [currentAudioId, setCurrentAudioId] = useState<string | null>(null);
    const [isAudioPlaying, setIsAudioPlaying] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const [arActive, setArActive] = useState(false);
    const [cameraError, setCameraError] = useState<string | null>(null);
    const [debugInfo, setDebugInfo] = useState<string>('');

    const userPos = useSmartGPS(5, 15000, 30000);

    useEffect(() => {
        if (userPos) {
            setDebugInfo(`GPS: ${userPos[0].toFixed(6)}, ${userPos[1].toFixed(6)}`);
        }
    }, [userPos]);

    const startCamera = async () => {
        try {
            setCameraError(null);

            if (videoRef.current && videoRef.current.srcObject) {
                const stream = videoRef.current.srcObject as MediaStream;
                stream.getTracks().forEach(track => track.stop());
            }

            const constraints: MediaStreamConstraints = {
                video: {
                    facingMode: { ideal: 'environment' },
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                    frameRate: { ideal: 30 }
                },
                audio: false
            };

            const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
            const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

            if (isIOS && isSafari) {
                constraints.video = {
                    facingMode: { exact: 'environment' } as any,
                    width: { ideal: window.innerWidth },
                    height: { ideal: window.innerHeight }
                };
            }

            const stream = await navigator.mediaDevices.getUserMedia(constraints);

            if (videoRef.current) {
                videoRef.current.srcObject = stream;

                videoRef.current.onloadedmetadata = () => {
                    videoRef.current?.play().catch(e => {
                        console.error('Erro ao reproduzir vídeo:', e);
                        setCameraError('Não foi possível iniciar a câmara');
                    });
                };
            }

            setArActive(true);

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

    useEffect(() => {
        return () => {
            stopCamera();
        };
    }, []);

    const handleAudioPlay = useCallback((itemId: string, fileKey: string) => {
        if (!audioRef.current) {
            audioRef.current = new Audio();
            audioRef.current.preload = 'none';

            audioRef.current.addEventListener('ended', () => {
                setCurrentAudioId(null);
                setIsAudioPlaying(false);
            });

            audioRef.current.addEventListener('pause', () => {
                setIsAudioPlaying(false);
            });
        }

        const audio = audioRef.current;

        if (currentAudioId === itemId && isAudioPlaying) {
            audio.pause();
            setCurrentAudioId(null);
            setIsAudioPlaying(false);
            return;
        }

        if (currentAudioId && currentAudioId !== itemId) {
            audio.pause();
        }

        const audioUrl = `https://pub-72037178c35c4cb1b3448777a2c80f0a.r2.dev/${fileKey}`;

        if (audio.src !== audioUrl) {
            audio.src = audioUrl;
        }

        audio.play()
            .then(() => {
                setCurrentAudioId(itemId);
                setIsAudioPlaying(true);
            })
            .catch(error => {
                console.error('Erro áudio:', error);
            });
    }, [currentAudioId, isAudioPlaying]);

    const handleAudioPause = useCallback(() => {
        if (audioRef.current) {
            audioRef.current.pause();
            setCurrentAudioId(null);
            setIsAudioPlaying(false);
        }
    }, []);

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        const handlePlay = () => setIsAudioPlaying(true);
        const handlePause = () => setIsAudioPlaying(false);
        const handleEnded = () => {
            setCurrentAudioId(null);
            setIsAudioPlaying(false);
        };

        audio.addEventListener('play', handlePlay);
        audio.addEventListener('pause', handlePause);
        audio.addEventListener('ended', handleEnded);

        return () => {
            audio.removeEventListener('play', handlePlay);
            audio.removeEventListener('pause', handlePause);
            audio.removeEventListener('ended', handleEnded);
        };
    }, []);

    return (
        <div
            ref={containerRef}
            className="fixed inset-0 z-[5000] bg-black overflow-hidden"
            style={{
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
                    transform: 'scaleX(-1)'
                }}
            />

            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent z-10"></div>

            {userPos && arActive && !cameraError && (
                <FloatingCardsOverlay
                    items={items}
                    userPos={userPos}
                    onAudioPlay={handleAudioPlay}
                    onAudioPause={handleAudioPause}
                    currentAudioId={currentAudioId}
                    isAudioPlaying={isAudioPlaying}
                />
            )}
            <audio ref={audioRef} style={{ display: 'none' }} />

            <AudioControlBar
                item={items.find(i => i._id === currentAudioId)}
                isPlaying={isAudioPlaying}
                onPause={() => {
                    audioRef.current?.pause();
                    setIsAudioPlaying(false);
                }}
            />

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

                    <div className="mb-8 p-5 bg-black/40 rounded-2xl border border-cyan-800/50 w-full max-w-sm">
                        <div className="flex items-center justify-between mb-3">
                            <div className="text-white text-sm">📍 Localização</div>
                            <div className={`w-3 h-3 rounded-full ${userPos ? 'bg-green-500 animate-pulse' : 'bg-yellow-500 animate-pulse'}`}></div>
                        </div>
                        {userPos ? (
                            <div className="text-cyan-400 font-mono text-sm">
                                Lat: {userPos[0].toFixed(6)}
                                <br />
                                Lon: {userPos[1].toFixed(6)}
                                <br />
                                <span className="text-green-400 text-xs">✓ GPS estável (atualiza a cada 10m)</span>
                            </div>
                        ) : (
                            <div className="text-yellow-400 text-sm">
                                A obter localização GPS...
                                <br />
                                <span className="text-xs">Precisão: 10 metros</span>
                            </div>
                        )}
                    </div>

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

            {process.env.NODE_ENV === 'development' && (
                <div className="absolute bottom-4 left-4 z-[7000] bg-black/80 text-white text-xs p-3 rounded-lg font-mono">
                    <div>AR: {arActive ? 'ON' : 'OFF'}</div>
                    <div>GPS: {userPos ? 'OK' : '...'}</div>
                    <div>Erro: {cameraError || 'none'}</div>
                    <div>Items: {items.length}</div>
                    <div className="text-[10px] mt-1">{debugInfo}</div>
                </div>
            )}

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