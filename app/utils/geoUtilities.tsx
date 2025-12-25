/* ============================
   UTILITÁRIOS GEO
============================ */
import {useEffect, useRef, useState} from "react";

export function getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
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

export function getBearing(lat1: number, lon1: number, lat2: number, lon2: number) {
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
   GPS OPTIMIZADO (atualiza a cada 10m)
========================= */
export function useSmartGPS(
    minDistance: number = 10,
    minTime: number = 10000,
    maxTime: number = 30000
) {
    const [position, setPosition] = useState<[number, number] | null>(null);
    const lastPositionRef = useRef<[number, number] | null>(null);
    const lastUpdateRef = useRef<number>(0);
    const lastDistanceRef = useRef<number>(0);
    const isMovingRef = useRef<boolean>(false);

    useEffect(() => {
        if (!navigator.geolocation) return;

        const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
            const x = (lon2 - lon1) * Math.cos((lat1 + lat2) / 2);
            const y = (lat2 - lat1);
            return Math.sqrt(x * x + y * y) * 111320;
        };

        const handlePosition = (pos: GeolocationPosition) => {
            const newPos: [number, number] = [
                pos.coords.latitude,
                pos.coords.longitude
            ];

            const now = Date.now();
            const timeSinceLastUpdate = now - lastUpdateRef.current;

            if (!lastPositionRef.current) {
                setPosition(newPos);
                lastPositionRef.current = newPos;
                lastUpdateRef.current = now;
                return;
            }

            const distance = calculateDistance(
                lastPositionRef.current[0],
                lastPositionRef.current[1],
                newPos[0],
                newPos[1]
            );

            const speed = distance / (timeSinceLastUpdate / 1000);
            isMovingRef.current = speed > 0.5;

            if (speed > 2) {
                if (distance >= minDistance) {
                    setPosition(newPos);
                    lastPositionRef.current = newPos;
                    lastUpdateRef.current = now;
                    lastDistanceRef.current = distance;
                }
                return;
            }

            if (timeSinceLastUpdate >= maxTime) {
                setPosition(newPos);
                lastPositionRef.current = newPos;
                lastUpdateRef.current = now;
                lastDistanceRef.current = distance;
                return;
            }

            if (distance >= minDistance || timeSinceLastUpdate >= minTime) {
                setPosition(newPos);
                lastPositionRef.current = newPos;
                lastUpdateRef.current = now;
                lastDistanceRef.current = distance;
            }
        };

        const handleError = (error: GeolocationPositionError) => {
            console.error('Erro GPS:', error);
        };

        const options: PositionOptions = {
            enableHighAccuracy: true,
            maximumAge: 5000,
            timeout: 10000
        };

        const watchId = navigator.geolocation.watchPosition(
            handlePosition,
            handleError,
            options
        );

        return () => navigator.geolocation.clearWatch(watchId);
    }, [minDistance, minTime, maxTime]);

    return position;
}