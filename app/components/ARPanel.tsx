import React, {useCallback, useEffect, useRef, useState} from 'react';

/* ============================
   UTILITÁRIOS GEO OTIMIZADOS
============================ */
function getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
    const R = 6371e3;
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) ** 2 +
        Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;

    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function getBearing(lat1: number, lon1: number, lat2: number, lon2: number) {
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const y = Math.sin(Δλ) * Math.cos(φ2);
    const x = Math.cos(φ1) * Math.sin(φ2) -
        Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);

    const bearing = Math.atan2(y, x) * 180 / Math.PI;
    return (bearing + 360) % 360;
}

/* =========================
   SISTEMA DE DETECÇÃO DE MOVIMENTO INTELIGENTE
========================= */

// Hook para detecção de orientação com correção de movimento
function useSmartOrientation() {
    const [orientation, setOrientation] = useState<{
        heading: number | null;
        pitch: number | null;
        roll: number | null;
        accuracy: number;
    }>({
        heading: null,
        pitch: null,
        roll: null,
        accuracy: 0
    });

    const lastValues = useRef({
        alpha: 0,
        beta: 0,
        gamma: 0,
        timestamp: 0
    });

    const calibrationData = useRef({
        samples: [] as number[],
        isCalibrated: false,
        offset: 0
    });

    useEffect(() => {
        let mounted = true;
        let animationFrameId: number;

        const updateOrientation = (alpha: number, beta: number, gamma: number) => {
            if (!mounted) return;

            const now = Date.now();
            const timeDiff = now - lastValues.current.timestamp;

            // Calcular mudança
            const deltaAlpha = Math.abs(alpha - lastValues.current.alpha);
            const deltaBeta = Math.abs(beta - lastValues.current.beta);
            const deltaGamma = Math.abs(gamma - lastValues.current.gamma);

            // Calibrar nos primeiros segundos
            if (!calibrationData.current.isCalibrated) {
                calibrationData.current.samples.push(alpha);
                if (calibrationData.current.samples.length > 30) { // ~1.5 segundos
                    const avg = calibrationData.current.samples.reduce((a, b) => a + b, 0) /
                        calibrationData.current.samples.length;
                    calibrationData.current.offset = avg > 180 ? 360 - avg : -avg;
                    calibrationData.current.isCalibrated = true;
                }
            }

            // Aplicar calibração
            let calibratedAlpha = alpha;
            if (calibrationData.current.isCalibrated) {
                calibratedAlpha = (alpha + calibrationData.current.offset) % 360;
                if (calibratedAlpha < 0) calibratedAlpha += 360;
            }

            // Calcular precisão baseada na estabilidade
            const movement = Math.sqrt(deltaAlpha ** 2 + deltaBeta ** 2 + deltaGamma ** 2);
            const accuracy = Math.max(0, 100 - (movement * 10));

            setOrientation({
                heading: calibratedAlpha,
                pitch: beta,
                roll: gamma,
                accuracy: Math.round(accuracy)
            });

            lastValues.current = { alpha, beta, gamma, timestamp: now };
        };

        const handleOrientation = (e: DeviceOrientationEvent) => {
            if (!mounted || e.alpha === null || e.beta === null || e.gamma === null) return;

            // Suavizar valores
            const smoothAlpha = lastValues.current.alpha +
                (e.alpha - lastValues.current.alpha) * 0.3;
            const smoothBeta = lastValues.current.beta +
                (e.beta - lastValues.current.beta) * 0.3;
            const smoothGamma = lastValues.current.gamma +
                (e.gamma - lastValues.current.gamma) * 0.3;

            updateOrientation(smoothAlpha, smoothBeta, smoothGamma);
        };

        // Pedir permissão
        const initOrientation = async () => {
            if (typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
                try {
                    const permission = await (DeviceOrientationEvent as any).requestPermission();
                    if (permission === 'granted' && mounted) {
                        window.addEventListener('deviceorientation', handleOrientation);
                    }
                } catch (error) {
                    console.warn('Permissão de orientação negada');
                }
            } else {
                window.addEventListener('deviceorientation', handleOrientation);
            }
        };

        initOrientation();

        return () => {
            mounted = false;
            window.removeEventListener('deviceorientation', handleOrientation);
            if (animationFrameId) cancelAnimationFrame(animationFrameId);
        };
    }, []);

    return orientation;
}
function AudioControlBar({
                             item,
                             onPause,
                             isPlaying // ← RECEBER PROP
                         }: {
    item?: any;
    onPause: () => void;
    isPlaying: boolean; // ← ADICIONAR TIPO

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
// Hook para GPS com histórico de movimento
function useAdvancedGPS() {
    const [position, setPosition] = useState<[number, number] | null>(null);
    const [speed, setSpeed] = useState<number>(0);
    const [heading, setHeading] = useState<number | null>(null);
    const positionHistory = useRef<Array<{lat: number, lng: number, timestamp: number}>>([]);

    useEffect(() => {
        if (!navigator.geolocation) return;

        const handlePosition = (pos: GeolocationPosition) => {
            const newPos: [number, number] = [pos.coords.latitude, pos.coords.longitude];

            // Calcular velocidade e direção
            const now = Date.now();
            positionHistory.current.push({
                lat: newPos[0],
                lng: newPos[1],
                timestamp: now
            });

            // Manter apenas últimos 10 pontos
            if (positionHistory.current.length > 10) {
                positionHistory.current.shift();
            }

            // Calcular velocidade se tivermos histórico
            if (positionHistory.current.length >= 2) {
                const last = positionHistory.current[positionHistory.current.length - 2];
                const current = positionHistory.current[positionHistory.current.length - 1];

                const distance = getDistance(last.lat, last.lng, current.lat, current.lng);
                const timeDiff = (current.timestamp - last.timestamp) / 1000; // segundos

                if (timeDiff > 0) {
                    const currentSpeed = distance / timeDiff; // m/s
                    setSpeed(currentSpeed);

                    // Calcular direção do movimento
                    if (distance > 1) { // Só calcular se movimento significativo
                        const bearing = getBearing(last.lat, last.lng, current.lat, current.lng);
                        setHeading(bearing);
                    }
                }
            }

            setPosition(newPos);
        };

        const handleError = (error: GeolocationPositionError) => {
            console.warn('Erro GPS:', error.message);
        };

        const options: PositionOptions = {
            enableHighAccuracy: true,
            maximumAge: 1000,
            timeout: 5000
        };

        const watchId = navigator.geolocation.watchPosition(handlePosition, handleError, options);

        return () => navigator.geolocation.clearWatch(watchId);
    }, []);

    return { position, speed, heading };
}

/* =========================
   SISTEMA DE VISIBILIDADE INTELIGENTE
========================= */

function calculateDynamicFOV(pitch: number | null, speed: number): number {
    // FOV dinâmico baseado na inclinação e velocidade
    let baseFOV = 60;

    if (pitch !== null) {
        // Se dispositivo inclinado para baixo (olhando para perto), FOV menor
        if (pitch > 45) {
            baseFOV = 45; // Mais focado
        }
        // Se dispositivo na horizontal, FOV normal
        else if (pitch > -45 && pitch < 45) {
            baseFOV = 60; // Normal
        }
        // Se inclinado para cima (olhando para longe), FOV maior
        else {
            baseFOV = 75; // Mais amplo
        }
    }

    // Ajustar baseado na velocidade
    if (speed > 2) { // > 7.2 km/h
        baseFOV = Math.min(baseFOV + 15, 90); // FOV mais amplo em movimento
    }

    return baseFOV;
}

function getVisibilityScore(
    targetLat: number,
    targetLng: number,
    userLat: number,
    userLng: number,
    deviceHeading: number,
    devicePitch: number | null,
    userSpeed: number,
    userHeading: number | null
): { isVisible: boolean; score: number; screenPosition: number } {

    // 1. Calcular distância e direção para o alvo
    const distance = getDistance(userLat, userLng, targetLat, targetLng);
    const bearingToTarget = getBearing(userLat, userLng, targetLat, targetLng);

    // 2. Calcular FOV dinâmico
    const fov = calculateDynamicFOV(devicePitch, userSpeed);
    const halfFOV = fov / 2;

    // 3. Calcular diferença angular (considerando movimento do utilizador)
    let effectiveDeviceHeading = deviceHeading;

    // Se o utilizador está em movimento, ajustar heading baseado na direção do movimento
    if (userHeading !== null && userSpeed > 1) {
        // Misturar heading do dispositivo com heading do movimento
        effectiveDeviceHeading = (deviceHeading * 0.7 + userHeading * 0.3) % 360;
    }

    let angularDiff = bearingToTarget - effectiveDeviceHeading;

    // Corrigir transição circular
    if (angularDiff > 180) angularDiff -= 360;
    if (angularDiff < -180) angularDiff += 360;

    // 4. Calcular score de visibilidade (0-100)
    let score = 0;

    // Base: diferença angular (quanto mais central, maior score)
    const angularScore = Math.max(0, 100 - (Math.abs(angularDiff) * 100 / halfFOV));

    // Distância: pontos mais próximos têm score maior
    const distanceScore = Math.max(0, 100 - (distance / 100)); // Até 100m = score alto

    // Inclinação: se dispositivo aponta diretamente, score maior
    let pitchScore = 50; // neutro
    if (devicePitch !== null) {
        const absPitch = Math.abs(devicePitch);
        pitchScore = Math.max(0, 100 - (absPitch * 1.5)); // 0° = 100, 60° = 10
    }

    // Score final (pesos diferentes)
    score = (angularScore * 0.5) + (distanceScore * 0.3) + (pitchScore * 0.2);

    // 5. Determinar se está visível
    const isVisible = Math.abs(angularDiff) <= halfFOV && distance < 2000; // Máximo 2km

    // 6. Calcular posição no ecrã
    let screenPosition = 50;
    if (isVisible) {
        const normalizedDiff = angularDiff / halfFOV;
        screenPosition = 50 + (normalizedDiff * 50);
        screenPosition = Math.max(10, Math.min(90, screenPosition));
    }

    return {
        isVisible,
        score: Math.round(score),
        screenPosition
    };
}

/* =========================
   OVERLAY INTELIGENTE COM FEEDBACK DE MOVIMENTO
========================= */

function SmartAROverlay({
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
    const orientation = useSmartOrientation();
    const gpsData = useAdvancedGPS();
    const [hiddenItems, setHiddenItems] = useState<Set<string>>(new Set());
    const [calibrationComplete, setCalibrationComplete] = useState(false);

    // Calibrar por 3 segundos
    useEffect(() => {
        const forceCalibrationTimer = setTimeout(() => {
            if (!calibrationComplete && orientation.heading !== null) {
                console.log('Forçando calibração após timeout');
                setCalibrationComplete(true);
            }
        }, 10000); // 10 segundos máximo

        return () => clearTimeout(forceCalibrationTimer);
    }, [orientation.heading, calibrationComplete]);


    const handleAudioPlay = (e: React.MouseEvent, itemId: string, fileKey: string) => {
        e.stopPropagation();
        onAudioPlay(itemId, fileKey);
    };

    const handleCloseItem = (itemId: string) => {
        setHiddenItems(prev => new Set(prev).add(itemId));
    };

    const restoreAllItems = () => setHiddenItems(new Set());

    if (!calibrationComplete || !orientation.heading) {
        return (
            <div className="absolute inset-0 z-[9000] flex flex-col items-center justify-center bg-black/40 backdrop-blur-sm">
                <div className="bg-black/70 px-8 py-6 rounded-2xl text-white text-center max-w-sm">
                    <div className="text-cyan-400 text-4xl mb-4 animate-pulse">🎯</div>
                    <div className="text-lg font-bold mb-2">Calibrando Sensores</div>
                    <div className="text-gray-300 text-sm mb-4">
                        Mantenha o dispositivo estável por 3 segundos
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2 mb-2">
                        <div
                            className="bg-cyan-500 h-2 rounded-full transition-all duration-1000"
                            style={{ width: `${calibrationComplete ? 100 : 50}%` }}
                        ></div>
                    </div>
                    <div className="text-xs text-gray-400">
                        Precisão: {orientation.accuracy}%
                    </div>
                </div>
            </div>
        );
    }

    if (!userPos) {
        return (
            <div className="absolute inset-0 z-[9000] flex items-center justify-center">
                <div className="bg-black/70 px-6 py-4 rounded-2xl text-white text-center">
                    <div className="text-yellow-400 text-2xl mb-2">📍</div>
                    <div>GPS em atualização...</div>
                    <div className="text-sm text-white/50 mt-2">A mover-se? Mantenha o GPS ativo</div>
                </div>
            </div>
        );
    }

    // CALCULAR VISIBILIDADE INTELIGENTE
    const visibleItems = items
        .filter(item => item.coordenadas && !hiddenItems.has(item._id))
        .map(item => {
            const visibility = getVisibilityScore(
                item.coordenadas.lat,
                item.coordenadas.lng,
                userPos[0],
                userPos[1],
                orientation.heading!,
                orientation.pitch,
                gpsData.speed,
                gpsData.heading
            );

            const distance = getDistance(userPos[0], userPos[1], item.coordenadas.lat, item.coordenadas.lng);

            return {
                item,
                distance,
                visibility,
                scale: 0.7 + (visibility.score / 100) * 0.5, // Escala baseada no score
                opacity: Math.max(0.3, visibility.score / 100),
                priority: distance < 100 ? 1000 : visibility.score // Prioridade: próximos primeiro
            };
        })
        .filter(item => item.visibility.isVisible && item.distance <= 2000)
        .sort((a, b) => b.priority - a.priority)
        .slice(0, 4);

    const hasHiddenItems = hiddenItems.size > 0;
    const isMoving = gpsData.speed > 1;

    if (visibleItems.length === 0) {
        return (
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="bg-black/70 backdrop-blur-sm px-6 py-4 rounded-2xl text-white text-center max-w-sm">
                    <div className="text-cyan-400 text-2xl mb-2">
                        {isMoving ? "🚶‍♂️" : "🔍"}
                    </div>
                    <div>
                        {isMoving
                            ? "Em movimento? Pontos aparecerão à sua frente"
                            : "Vire o dispositivo para encontrar pontos"
                        }
                    </div>
                    <div className="text-sm text-white/50 mt-2">
                        Direção: {Math.round(orientation.heading!)}° •
                        Velocidade: {Math.round(gpsData.speed * 3.6)} km/h
                    </div>
                    {hasHiddenItems && (
                        <button onClick={restoreAllItems} className="mt-3 bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded-lg text-sm transition-colors">
                            Restaurar pontos fechados
                        </button>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="absolute inset-0">
            {/* Painel de status */}
            <div className="absolute top-6 left-1/2 transform -translate-x-1/2 z-[9998] flex gap-2">
                <div className="bg-black/60 backdrop-blur-md px-4 py-2 rounded-full border border-cyan-500/50">
                    <div className="text-cyan-300 text-xs font-bold flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${isMoving ? 'bg-green-500 animate-pulse' : 'bg-cyan-500'}`}></span>
                        {Math.round(orientation.heading!)}° • {Math.round(gpsData.speed * 3.6)} km/h
                    </div>
                </div>
                <div className="bg-black/60 backdrop-blur-md px-4 py-2 rounded-full border border-cyan-500/50">
                    <div className="text-cyan-300 text-xs font-bold">
                        {visibleItems.length} ponto{visibleItems.length !== 1 ? 's' : ''}
                    </div>
                </div>
            </div>

            {/* Botão restaurar */}
            {hasHiddenItems && (
                <button onClick={restoreAllItems} className="absolute top-20 right-4 z-[9999] bg-cyan-600/80 hover:bg-cyan-700/80 text-white text-xs font-bold px-3 py-1.5 rounded-full backdrop-blur-sm border border-cyan-400/50 shadow-lg transition-all duration-200 flex items-center gap-1">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z"/></svg>
                    {hiddenItems.size}
                </button>
            )}

            {/* Cards posicionados inteligentemente */}
            {visibleItems.map(({ item, distance, visibility, scale, opacity }, index) => (
                <div
                    key={item._id}
                    style={{
                        left: `${visibility.screenPosition}%`,
                        top: `${40 + (index * 5)}%`, // Posicionamento vertical escalonado
                        opacity,
                        transform: `translateX(-50%) scale(${scale})`,
                        zIndex: 9000 + (4 - index)
                    }}
                    className="absolute transition-all duration-500 ease-out pointer-events-auto"
                >
                    <div className="bg-gradient-to-br from-black/95 to-gray-900/95 backdrop-blur-xl rounded-2xl p-4 border-2 border-cyan-500/60 shadow-2xl shadow-cyan-500/40 min-w-[200px] max-w-[240px]">
                        <button onClick={() => handleCloseItem(item._id)}
                                className="absolute -top-2 -right-2 z-30 bg-red-600 hover:bg-red-700 text-white w-8 h-8 rounded-full flex items-center justify-center shadow-lg border-2 border-white transition-all duration-150 active:scale-90">
                            ✕
                        </button>

                        {/* Indicador de qualidade */}
                        <div className="absolute -top-1 left-1/2 transform -translate-x-1/2">
                            <div className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                visibility.score > 80 ? 'bg-green-500/80 text-white' :
                                    visibility.score > 50 ? 'bg-yellow-500/80 text-black' :
                                        'bg-gray-500/80 text-white'
                            }`}>
                                {visibility.score}%
                            </div>
                        </div>

                        <div className="mb-3 pt-1">
                            <div className="text-white font-bold text-lg truncate">{item.title}</div>
                            <div className="text-cyan-300 text-sm flex items-center gap-2 mt-1">
                                <span className="font-mono font-bold">{Math.round(distance)}m</span>
                                <span className="text-xs text-gray-400">•</span>
                                {item.tipo?.titulo && (
                                    <span className="text-xs text-gray-300 truncate">{item.tipo.titulo}</span>
                                )}
                            </div>
                        </div>

                        {item.galeria?.[0]?.url && (
                            <div className="mb-3 overflow-hidden rounded-lg border border-cyan-500/30">
                                <img src={item.galeria[0].url} alt={item.title} className="w-full h-32 object-cover" />
                            </div>
                        )}

                        {item.audioNarracao?.fileKey && (
                            <div className="mb-3">
                                <button onClick={(e) => handleAudioPlay(e, item._id, item.audioNarracao.fileKey)}
                                        className={`w-full flex items-center justify-center gap-2 py-2 rounded-lg transition-all ${currentAudioId === item._id && isAudioPlaying ? 'bg-gradient-to-r from-cyan-600 to-blue-600' : 'bg-gradient-to-r from-cyan-700 to-blue-700 hover:from-cyan-600 hover:to-blue-600'}`}>
                                    {currentAudioId === item._id && isAudioPlaying ? (
                                        <>
                                            <div className="w-6 h-6 flex items-center justify-center">
                                                <div className="w-2 h-4 bg-white mx-0.5 animate-pulse"></div>
                                                <div className="w-2 h-6 bg-white mx-0.5 animate-pulse" style={{animationDelay: '0.1s'}}></div>
                                                <div className="w-2 h-3 bg-white mx-0.5 animate-pulse" style={{animationDelay: '0.2s'}}></div>
                                            </div>
                                            <span className="text-white text-sm font-bold">A tocar</span>
                                        </>
                                    ) : (
                                        <>
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="text-white"><path d="M8 5v14l11-7z"/></svg>
                                            <span className="text-white text-sm font-bold">Ouvir</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        )}

                        {distance < 50 && (
                            <div className="mt-2 bg-gradient-to-r from-green-500/40 to-green-700/40 px-3 py-1 rounded-full">
                                <div className="text-green-300 text-xs font-bold text-center flex items-center justify-center gap-1">
                                    <span>⭐</span> MUITO PRÓXIMO
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            ))}

            {/* Guia contextual */}
            <div className="absolute bottom-24 left-1/2 transform -translate-x-1/2 z-[9998]">
                <div className="bg-black/60 backdrop-blur-md px-4 py-2 rounded-lg border border-white/20">
                    <div className="text-white text-xs text-center">
                        <div className="flex items-center justify-center gap-2 mb-1">
                            {isMoving ? (
                                <>
                                    <span className="text-green-400">🚶‍♂️ Em movimento</span>
                                    <span className="text-gray-400">•</span>
                                    <span className="text-cyan-300">Pontos ajustam-se à sua direção</span>
                                </>
                            ) : (
                                <>
                                    <span className="text-gray-400">↻</span>
                                    <span className="text-cyan-300">Gire para explorar</span>
                                    <span className="text-gray-400">↻</span>
                                </>
                            )}
                        </div>
                        <div className="text-gray-400 text-[10px]">
                            Score mostra qualidade de visibilidade
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

/* =========================
   COMPONENTE AR PRINCIPAL (SIMPLIFICADO)
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
    const [arActive, setArActive] = useState(false);
    const [cameraError, setCameraError] = useState<string | null>(null);

    const gpsData = useAdvancedGPS();

    const startCamera = async () => {
        try {
            setCameraError(null);

            if (videoRef.current?.srcObject) {
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
                        console.error('Erro vídeo:', e);
                        setCameraError('Erro ao iniciar câmera');
                    });
                };
            }

            setArActive(true);
            if (navigator.vibrate) navigator.vibrate([50]);

        } catch (error: any) {
            let errorMsg = 'Não foi possível aceder à câmera';

            if (error.name === 'NotAllowedError') errorMsg = 'Permissão da câmera negada';
            else if (error.name === 'NotFoundError') errorMsg = 'Câmara traseira não encontrada';
            else if (error.name === 'NotReadableError') errorMsg = 'Câmara já em uso';
            else if (error.name === 'OverconstrainedError') errorMsg = 'Configuração não suportada';

            setCameraError(errorMsg);
            setArActive(false);
        }
    };

    const stopCamera = () => {
        if (videoRef.current?.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream;
            stream.getTracks().forEach(track => track.stop());
            videoRef.current.srcObject = null;
        }
        setArActive(false);
    };

    useEffect(() => {
        return () => {
            stopCamera();
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current.src = '';
            }
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

        audio.play().then(() => {
            setCurrentAudioId(itemId);
            setIsAudioPlaying(true);
        }).catch(error => {
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

    // Filtrar apenas itens com coordenadas
    const itemsWithCoords = items.filter(item => item.coordenadas);

    return (
        <div className="fixed inset-0 z-[5000] bg-black overflow-hidden">
            {/* Video da câmara */}
            <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="absolute inset-0 w-full h-full object-cover z-0"
                style={{transform: 'scaleX(-1)'}}
            />

            {/* Overlay de gradiente para melhor contraste */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent z-10"></div>

            {/* Overlay AR inteligente */}
            {gpsData.position && arActive && !cameraError && (
                <SmartAROverlay
                    items={itemsWithCoords}
                    userPos={gpsData.position}
                    onAudioPlay={handleAudioPlay}
                    onAudioPause={handleAudioPause}
                    currentAudioId={currentAudioId}
                    isAudioPlaying={isAudioPlaying}
                />
            )}

            {/* Áudio escondido */}
            <audio ref={audioRef} style={{ display: 'none' }} />

            {/* Barra de controle de áudio */}
            <AudioControlBar
                item={items.find(i => i._id === currentAudioId)}
                isPlaying={isAudioPlaying}
                onPause={() => {
                    audioRef.current?.pause();
                    setIsAudioPlaying(false);
                }}
            />

            {/* Tela inicial de ativação */}
            {!arActive && (
                <div className="absolute inset-0 z-[6000] flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-black to-slate-900 px-8">
                    <div className="text-center mb-10">
                        <div className="text-cyan-400 text-5xl mb-6">🌍</div>
                        <h2 className="text-white text-3xl font-bold mb-4">Guia Turístico AR Inteligente</h2>
                        <p className="text-white/70 text-sm max-w-md mb-2">
                            Sistema adaptativo que se ajusta ao seu movimento
                        </p>
                        <div className="text-white/50 text-xs">
                            Funciona parado, caminhando ou correndo
                        </div>
                    </div>

                    {/* Status da localização */}
                    <div className="mb-8 p-5 bg-black/40 rounded-2xl border border-cyan-800/50 w-full max-w-sm">
                        <div className="flex items-center justify-between mb-3">
                            <div className="text-white text-sm">📍 GPS Inteligente</div>
                            <div className={`w-3 h-3 rounded-full ${gpsData.position ? 'bg-green-500 animate-pulse' : 'bg-yellow-500 animate-pulse'}`}></div>
                        </div>
                        {gpsData.position ? (
                            <div className="text-cyan-400 font-mono text-sm">
                                {gpsData.position[0].toFixed(6)}, {gpsData.position[1].toFixed(6)}
                                <br />
                                <span className="text-green-400 text-xs">
                                    ✓ GPS ativo • {Math.round(gpsData.speed * 3.6)} km/h
                                </span>
                                <br />
                                <span className="text-xs text-gray-300">
                                    {itemsWithCoords.length} pontos com coordenadas
                                </span>
                            </div>
                        ) : (
                            <div className="text-yellow-400 text-sm">
                                A calibrar sensores de movimento...
                                <br />
                                <span className="text-xs">Precisão: 3 metros</span>
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
                        {cameraError ? '❌ ERRO CÂMARA' : '🚀 ATIVAR AR INTELIGENTE'}
                    </button>

                    {/* Mensagem de erro */}
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

                    {/* Características do sistema */}
                    <div className="mt-6 grid grid-cols-2 gap-3 max-w-sm">
                        <div className="bg-black/30 p-3 rounded-xl">
                            <div className="text-cyan-400 text-xs font-bold mb-1">🎯 Detecção Precisa</div>
                            <div className="text-white/60 text-[10px]">Ajusta-se ao seu movimento</div>
                        </div>
                        <div className="bg-black/30 p-3 rounded-xl">
                            <div className="text-cyan-400 text-xs font-bold mb-1">📊 Score Inteligente</div>
                            <div className="text-white/60 text-[10px]">0-100% qualidade de visão</div>
                        </div>
                        <div className="bg-black/30 p-3 rounded-xl">
                            <div className="text-cyan-400 text-xs font-bold mb-1">🚶‍♂️ Modo Movimento</div>
                            <div className="text-white/60 text-[10px]">Detecta caminhada/corrida</div>
                        </div>
                        <div className="bg-black/30 p-3 rounded-xl">
                            <div className="text-cyan-400 text-xs font-bold mb-1">🧭 Calibração Auto</div>
                            <div className="text-white/60 text-[10px]">3s para estabilizar</div>
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
                    AR INTELIGENTE ATIVO • {itemsWithCoords.length} LOCAIS
                </div>
            )}

            {/* Debug info (apenas desenvolvimento) */}
            {process.env.NODE_ENV === 'development' && (
                <div className="absolute bottom-4 left-4 z-[7000] bg-black/80 text-white text-xs p-3 rounded-lg font-mono">
                    <div>AR: {arActive ? 'ON' : 'OFF'}</div>
                    <div>GPS: {gpsData.position ? 'OK' : '...'}</div>
                    <div>Vel: {Math.round(gpsData.speed * 3.6)} km/h</div>
                    <div>Items: {itemsWithCoords.length}/{items.length}</div>
                    <div className="text-[10px] mt-1 text-cyan-300">
                        Sistema de detecção de movimento ativo
                    </div>
                </div>
            )}

            {/* Aviso de orientação (modo retrato) */}
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
                        Para melhor experiência com o sistema AR inteligente
                    </p>
                    <div className="text-white/50 text-sm">
                        O sistema continuará a funcionar em modo retrato
                    </div>
                </div>
            )}
        </div>
    );
}