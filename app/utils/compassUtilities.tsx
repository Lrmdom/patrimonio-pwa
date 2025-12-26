/* =========================
   BÚSSOLA E INCLINAÇÃO OTIMIZADA
========================= */
import {useEffect, useRef, useState} from "react";

// utils/compassUtilities.tsx

export function useStableHeading(
    smoothingFactor: number = 0.5, // Reduzido (era 0.45) para filtrar mais o tremor
    minUpdateInterval: number = 100
) {
    const [orientation, setOrientation] = useState({ heading: null, pitch: null });
    const lastUpdateRef = useRef(0);
    const filteredHeadingRef = useRef<number | null>(null);

    useEffect(() => {
        const handler = (e: DeviceOrientationEvent) => {
            const now = Date.now();
            if (now - lastUpdateRef.current < minUpdateInterval) return;

            let screenAngle = window.screen?.orientation?.angle || 0;

            let heading = 0;
            const ev = e as any;

            // 1. PRIORIDADE: iOS ou browsers que suportam o Norte Magnético direto
            if (ev.webkitCompassHeading !== undefined && ev.webkitCompassHeading !== null) {
                heading = ev.webkitCompassHeading;
            }
            // 2. ANDROID: Usar alpha absoluto se disponível
            else if (e.alpha !== null) {
                // No Android, o alpha aumenta no sentido anti-horário.
                // Para bússola, precisamos que aumente no sentido horário.
                heading = (360 - e.alpha);
            } else {
                return;
            }

            // 3. COMPENSAR O HEADING COM A ROTAÇÃO DO ECRÃ
            // Se o ecrã rodar 90deg, o heading tem de rodar proporcionalmente
            let rawHeading = (heading + screenAngle + 360) % 360;

            // 4. DETERMINAR O PITCH (Eixo de inclinação vertical)
            // Em modo paisagem (90 ou 270), usamos o gamma. Em retrato (0), o beta.
            let pitchValue = Math.abs(screenAngle) === 90 ? e.gamma : e.beta;

            if (rawHeading === null || pitchValue === null) return;

            // FILTRO DE SUAVIZAÇÃO (A sua lógica original)
            if (filteredHeadingRef.current === null) {
                filteredHeadingRef.current = rawHeading;
            } else {
                let diff = rawHeading - filteredHeadingRef.current;
                if (diff > 180) diff -= 360;
                if (diff < -180) diff += 360;
                filteredHeadingRef.current = (filteredHeadingRef.current + diff * smoothingFactor) % 360;
            }

            setOrientation({
                heading: (filteredHeadingRef.current + 360) % 360,
                pitch: Math.abs(screenAngle) === 90 ? e.gamma : e.beta
            });
            lastUpdateRef.current = now;
        };

        // Tentar escutar o evento ABSOLUTO (essencial para Android)
        window.addEventListener('deviceorientationabsolute', handler, true);
        // Fallback para o normal
        window.addEventListener('deviceorientation', handler, true);

        return () => {
            window.removeEventListener('deviceorientationabsolute', handler);
            window.removeEventListener('deviceorientation', handler);
        };
    }, [smoothingFactor, minUpdateInterval]);
    return orientation;
}