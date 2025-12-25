/* =========================
   BÚSSOLA OTIMIZADA (com filtro Kalman simples)
========================= */
import {useEffect, useRef, useState} from "react";

export function useStableHeading(
    smoothingFactor: number = 0.15,
    minUpdateInterval: number = 100
) {
    const [heading, setHeading] = useState<number | null>(null);
    const filteredHeadingRef = useRef<number | null>(null);
    const lastUpdateRef = useRef<number>(0);
    const isCalibratingRef = useRef<boolean>(true);
    const calibrationSamplesRef = useRef<number[]>([]);

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
            } else {
                startListening();
            }
        };

        const startListening = () => {
            let lastRawHeading: number | null = null;

            const handler = (e: DeviceOrientationEvent) => {
                if (e.alpha === null || e.alpha === undefined) return;

                const now = Date.now();
                const rawHeading = e.alpha;

                if (now - lastUpdateRef.current < minUpdateInterval) return;

                if (isCalibratingRef.current) {
                    calibrationSamplesRef.current.push(rawHeading);

                    if (calibrationSamplesRef.current.length > 20) {
                        isCalibratingRef.current = false;
                        console.log('Bússola calibrada');
                    }
                    return;
                }

                if (filteredHeadingRef.current === null) {
                    filteredHeadingRef.current = rawHeading;
                } else {
                    const current = filteredHeadingRef.current;
                    // --- LÓGICA DE DIFERENÇA (DIFF) AQUI ---
                    let diff = rawHeading - current; // Cálculo local da diferença

                    if (diff > 180) diff -= 360;
                    if (diff < -180) diff += 360;

                    filteredHeadingRef.current = (current + diff * smoothingFactor) % 360;
                    if (filteredHeadingRef.current < 0) filteredHeadingRef.current += 360;
                }

                if (lastRawHeading !== null) {
                    let smallDiff = Math.abs(rawHeading - lastRawHeading);
                    if (smallDiff > 180) smallDiff = 360 - smallDiff;

                    // A variável `diff` usada aqui é a calculada nas linhas acima
                    if (smallDiff < 0.5 && Math.abs(diff || 0) < 0.5) {
                        return;
                    }
                }

                lastRawHeading = rawHeading;
                setHeading(filteredHeadingRef.current);
                lastUpdateRef.current = now;
            };

            window.addEventListener('deviceorientation', handler, true);

            return () => {
                window.removeEventListener('deviceorientation', handler);
            };
        };

        requestPermission();

        const calibrationTimeout = setTimeout(() => {
            isCalibratingRef.current = false;
        }, 5000);

        return () => {
            clearTimeout(calibrationTimeout);
        };
    }, [smoothingFactor, minUpdateInterval]);

    return heading;
}