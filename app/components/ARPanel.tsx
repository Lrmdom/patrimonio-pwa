import React, { useRef, useState, useEffect, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';

function HeritageAnchor({ item, userPos }: { item: any; userPos: [number, number] }) {
    const meshRef = useRef<THREE.Mesh>(null!);

    const distance = useMemo(() => {
        if (!userPos || !item?.coordenadas) return 0;
        return Math.sqrt(
            Math.pow((item.coordenadas.lat - userPos[0]) * 111320, 2) +
            Math.pow((item.coordenadas.lng - userPos[1]) * 111320 * Math.cos(userPos[0] * Math.PI / 180), 2)
        );
    }, [userPos, item.coordenadas]);

    const worldPosition = useMemo(() => {
        if (!userPos || !item?.coordenadas) return new THREE.Vector3(0, 0, 0);
        const latDiff = item.coordenadas.lat - userPos[0];
        const lngDiff = item.coordenadas.lng - userPos[1];
        const z = -latDiff * 111320;
        const x = lngDiff * (111320 * Math.cos((userPos[0] * Math.PI) / 180));

        // Altitude: Itens distantes sobem ligeiramente (Perspetiva)
        const y = 5 + (distance * 0.015);
        return new THREE.Vector3(x, y, z);
    }, [userPos, item.coordenadas, distance]);

    return (
        <mesh ref={meshRef} position={worldPosition}>
            <sphereGeometry args={[1.2, 16, 16]} />
            <meshStandardMaterial color="#00ffff" emissive="#00ffff" emissiveIntensity={10} toneMapped={false} />
            <Html center distanceFactor={12}>
                <div className="flex flex-col items-center pointer-events-none select-none">
                    <div className="bg-black/80 backdrop-blur-xl p-4 rounded-2xl border-b-4 border-cyan-400 shadow-[0_0_20px_rgba(0,255,255,0.3)] min-w-[160px]">
                        <h4 className="text-white font-black text-[11px] uppercase text-center leading-none mb-2">{item.title}</h4>
                        <div className="text-cyan-400 font-black text-lg text-center font-mono">
                            {distance > 1000 ? `${(distance/1000).toFixed(1)}km` : `${Math.round(distance)}m`}
                        </div>
                    </div>
                    <div className="w-[1.5px] bg-gradient-to-t from-cyan-400 to-transparent opacity-60" style={{ height: `${60 + (distance * 0.03)}px` }} />
                </div>
            </Html>
        </mesh>
    );
}

function ARScene({ items, userPos, orientationRef }: { items: any[], userPos: [number, number], orientationRef: React.MutableRefObject<any> }) {
    const { camera } = useThree();
    const targetQuaternion = useRef(new THREE.Quaternion());

    useFrame(() => {
        const { alpha, beta, gamma } = orientationRef.current;

        const a = THREE.MathUtils.degToRad(alpha);
        const b = THREE.MathUtils.degToRad(beta);
        const g = THREE.MathUtils.degToRad(gamma);

        // ROTAÇÃO ROBUSTA:
        // Usamos uma matriz de rotação para evitar que o mundo "caia" no chão.
        // O offset de 90 graus é aplicado para alinhar a câmara traseira com o horizonte.
        const euler = new THREE.Euler(b + Math.PI / 2, a, -g, 'YXZ');
        targetQuaternion.current.setFromEuler(euler);

        // Suavização ultra-estável (lerp de 0.05 é muito suave)
        camera.quaternion.slerp(targetQuaternion.current, 0.05);
    });

    return (
        <group>
            {items.map((item: any) => (
                <HeritageAnchor key={item._id} item={item} userPos={userPos} />
            ))}
        </group>
    );
}

export default function ARPanel({ items, onClose }: { items: any[]; onClose: () => void }) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [ready, setReady] = useState(false);
    const [userPos, setUserPos] = useState<[number, number] | null>(null);
    const orientationRef = useRef({ alpha: 0, beta: 0, gamma: 0 });

    useEffect(() => {
        // Ativa a câmara com resolução máxima disponível
        navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } } })
            .then(s => { if (videoRef.current) videoRef.current.srcObject = s; });

        const watchId = navigator.geolocation.watchPosition(
            p => setUserPos([p.coords.latitude, p.coords.longitude]),
            null, { enableHighAccuracy: true, maximumAge: 0 }
        );
        return () => navigator.geolocation.clearWatch(watchId);
    }, []);

    const handleStart = async () => {
        if (typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
            try {
                const res = await (DeviceOrientationEvent as any).requestPermission();
                if (res !== 'granted') return;
            } catch (e) { console.error(e); }
        }

        const handleOrientation = (e: any) => {
            // Lógica para detetar se é iOS ou Android
            const compass = e.webkitCompassHeading || (e.alpha ? 360 - e.alpha : 0);

            orientationRef.current = {
                alpha: compass,
                beta: e.beta || 0,
                gamma: e.gamma || 0
            };
        };

        window.addEventListener('deviceorientation', handleOrientation, true);
        setReady(true);
    };

    return (
        <div className="fixed inset-0 z-[5000] bg-black overflow-hidden touch-none">
            <video ref={videoRef} autoPlay playsInline muted className="absolute inset-0 w-full h-full object-cover opacity-70" />

            <div className="absolute inset-0 z-10">
                <Canvas camera={{ position: [0, 0, 0], fov: 70, near: 0.1, far: 5000 }}>
                    <ambientLight intensity={1.5} />
                    <pointLight position={[10, 10, 10]} intensity={2} />
                    {ready && userPos && (
                        <ARScene items={items} userPos={userPos} orientationRef={orientationRef} />
                    )}
                </Canvas>
            </div>

            {!ready && (
                <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-slate-950/90 backdrop-blur-md p-10">
                    <div className="relative w-32 h-32 mb-10">
                        <div className="absolute inset-0 border-4 border-cyan-500/20 rounded-full"></div>
                        <div className="absolute inset-0 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
                        <div className="absolute inset-0 flex items-center justify-center text-cyan-500">
                            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s-8-4.5-8-11.8A8 8 0 0 1 12 2a8 8 0 0 1 8 8.2c0 7.3-8 11.8-8 11.8z"/><circle cx="12" cy="10" r="3"/></svg>
                        </div>
                    </div>
                    <h2 className="text-white text-3xl font-black mb-4 uppercase text-center tracking-tighter">Radar Ativo</h2>
                    <p className="text-slate-400 text-center text-sm mb-12 leading-relaxed">Aponte o telemóvel para o horizonte e clique para calibrar a visão 3D.</p>
                    <button
                        onClick={handleStart}
                        className="bg-cyan-500 text-black px-14 py-5 rounded-2xl font-black text-xl shadow-[0_0_40px_rgba(6,182,212,0.4)] active:scale-95 transition-all uppercase"
                    >
                        Calibrar Horizonte
                    </button>
                </div>
            )}

            {ready && (
                <button
                    onClick={onClose}
                    className="absolute top-10 right-6 z-40 bg-black/60 backdrop-blur-md border border-white/20 w-14 h-14 rounded-2xl text-white flex items-center justify-center"
                >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
            )}
        </div>
    );
}