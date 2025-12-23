import React, { useRef, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';

// Componente para cada marcador individual no espaço AR
function HeritageAnchor({
                            item,
                            userPos,
                            heading
                        }: {
    item: any;
    userPos: [number, number];
    heading: number;
}) {
    const meshRef = useRef<THREE.Mesh>(null!);
    const [distance, setDistance] = useState(0);

    // Suavização do heading para evitar que os objetos tremam (Filtro passa-baixo)
    const smoothHeading = useRef(heading);

    useFrame(() => {
        if (!meshRef.current || !userPos || !item?.coordenadas) return;

        // Suaviza a rotação da bússola
        smoothHeading.current = THREE.MathUtils.lerp(
            smoothHeading.current,
            heading,
            0.05
        );

        const headingRad = THREE.MathUtils.degToRad(smoothHeading.current);

        // Coordenadas do alvo
        const targetLat = item.coordenadas.lat;
        const targetLng = item.coordenadas.lng;

        // 1. Cálculo de distâncias geográficas (Diferença em metros)
        const latDiff = targetLat - userPos[0];
        const lngDiff = targetLng - userPos[1];

        // Conversão aproximada de graus para metros
        const z = -latDiff * 111320;
        const x = lngDiff * (111320 * Math.cos((userPos[0] * Math.PI) / 180));

        // 2. Rotação do mundo com base na bússola (Heading)
        // Isso faz com que o "Norte" do Three.js coincida com o Norte Real
        const rotatedX = x * Math.cos(headingRad) - z * Math.sin(headingRad);
        const rotatedZ = x * Math.sin(headingRad) + z * Math.cos(headingRad);

        const d = Math.sqrt(rotatedX ** 2 + rotatedZ ** 2);
        setDistance(d);

        // 3. Posicionamento suave no espaço 3D
        // Y fixado em -1.5 para parecer estar à altura do chão/peito
        meshRef.current.position.lerp(
            new THREE.Vector3(rotatedX, -1.5, rotatedZ),
            0.1
        );

        // 4. Escala dinâmica (Aumenta ligeiramente quando longe para manter visível)
        const dynamicScale = THREE.MathUtils.clamp(40 / (d + 10), 1, 6);
        meshRef.current.scale.setScalar(dynamicScale);
    });

    return (
        <mesh ref={meshRef}>
            <boxGeometry args={[1.5, 1.5, 1.5]} />
            <meshStandardMaterial
                color="cyan"
                emissive="cyan"
                emissiveIntensity={2}
                transparent
                opacity={0.7}
            />

            <Html
                center
                sprite
                transform
                distanceFactor={10}
                occlude={false}
                zIndexRange={[100, 0]}
                style={{ pointerEvents: 'none' }}
            >
                <div className="flex flex-col items-center">
                    <div className="bg-white/95 backdrop-blur-md p-4 rounded-2xl shadow-2xl border-b-8 border-cyan-500 min-w-[180px]">
                        <h4 className="text-black font-black text-[11px] uppercase text-center leading-tight">
                            {item.title}
                        </h4>
                        <div className="text-center mt-2 pt-2 border-t border-gray-100">
                            <span className="text-xl font-black text-cyan-600">
                                {Math.round(distance)}m
                            </span>
                        </div>
                    </div>
                    {/* Haste visual para ligar o objeto ao "chão" */}
                    <div className="w-1 h-32 bg-gradient-to-t from-cyan-500 to-transparent opacity-40" />
                </div>
            </Html>
        </mesh>
    );
}

// Painel AR Principal
export default function ARPanel({
                                    items, // Agora recebe a lista de itens do MapComponent
                                    onClose
                                }: {
    items: any[];
    onClose: () => void;
}) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [ready, setReady] = useState(false);
    const [userPos, setUserPos] = useState<[number, number] | null>(null);
    const [heading, setHeading] = useState<number>(0);

    // Filtra apenas itens que possuem coordenadas válidas para evitar erros no Canvas
    const validItems = items?.filter(i => i.coordenadas?.lat && i.coordenadas?.lng) || [];

    useEffect(() => {
        // Ativar a câmera do dispositivo
        navigator.mediaDevices
            .getUserMedia({ video: { facingMode: 'environment' } })
            .then(stream => {
                if (videoRef.current) videoRef.current.srcObject = stream;
            });

        // Monitorar posição GPS
        const watchId = navigator.geolocation.watchPosition(
            p => setUserPos([p.coords.latitude, p.coords.longitude]),
            null,
            { enableHighAccuracy: true }
        );

        return () => navigator.geolocation.clearWatch(watchId);
    }, []);

    const handleStart = async () => {
        // Solicitar permissão para sensores no iOS
        if (typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
            const res = await (DeviceOrientationEvent as any).requestPermission();
            if (res !== 'granted') return;
        }

        window.addEventListener('deviceorientation', (e: any) => {
            const h = e.webkitCompassHeading ?? (e.alpha ? 360 - e.alpha : 0);
            setHeading(h);
        }, true);

        setReady(true);
    };

    return (
        <div className="fixed inset-0 z-[5000] bg-black overflow-hidden">
            {/* Camada 0: Feed da Câmera */}
            <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="absolute inset-0 w-full h-full object-cover z-0 opacity-60"
            />

            {/* Camada 1: Canvas 3D (Three.js) */}
            <div className="absolute inset-0 z-10">
                <Canvas camera={{ position: [0, 0, 0], fov: 70 }}>
                    <ambientLight intensity={1.5} />
                    <pointLight position={[10, 10, 10]} intensity={2} />

                    {ready && userPos && validItems.map((item) => (
                        <HeritageAnchor
                            key={item._id || item.id}
                            item={item}
                            userPos={userPos}
                            heading={heading}
                        />
                    ))}
                </Canvas>
            </div>

            {/* Camada 2: Interface de Utilizador (UI) */}
            <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none">
                {!ready && (
                    <button
                        onClick={handleStart}
                        className="pointer-events-auto bg-cyan-500 text-black px-12 py-5 rounded-full font-black shadow-[0_0_30px_rgba(6,182,212,0.5)] uppercase tracking-tighter"
                    >
                        Sincronizar Bússola
                    </button>
                )}
            </div>

            {ready && (
                <button
                    onClick={onClose}
                    className="absolute top-10 left-6 z-40 bg-black/40 backdrop-blur-md text-white w-12 h-12 rounded-full font-bold border border-white/20"
                >
                    ✕
                </button>
            )}
        </div>
    );
}