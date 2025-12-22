import React from 'react';

export default function ARPanel({ item, onClose }: { item: any, onClose: () => void }) {
    const lat = item.coordenadas?.lat;
    const lng = item.coordenadas?.lng;
    const nome = item.designacao || "Património";

    return (
        <div className="fixed inset-0 z-[5000] bg-black">
            {/* Interface UI */}
            <div className="absolute top-10 left-0 right-0 z-[5002] flex justify-center">
                <button
                    onClick={onClose}
                    className="bg-white text-black px-6 py-2 rounded-full font-bold shadow-lg uppercase text-xs active:scale-95 transition-transform"
                >
                    ✕ Sair da Câmara
                </button>
            </div>

            <iframe
                allow="camera; geolocation"
                srcDoc={`
                    <html>
                    <head>
                        <script src="https://aframe.io/releases/1.3.0/aframe.min.js"></script>
                        <script src="https://raw.githack.com/AR-js-org/AR.js/master/aframe/build/aframe-ar-nft.js"></script>
                        <script src="https://unpkg.com/aframe-look-at-component@0.8.0/dist/aframe-look-at-component.min.js"></script>
                    </head>
                    <body style="margin: 0; overflow: hidden;">
                        <script>
                            // Lógica de Suavização (Estabilização)
                            AFRAME.registerComponent('lerp-stabilizer', {
                                init: function () {
                                    this.targetPos = new THREE.Vector3();
                                    this.currentPos = new THREE.Vector3();
                                    this.firstPos = true;
                                },
                                tick: function () {
                                    const gpsPos = this.el.object3D.position;
                                    if (this.firstPos && gpsPos.x !== 0) {
                                        this.currentPos.copy(gpsPos);
                                        this.firstPos = false;
                                    }
                                    // Suaviza o movimento em 5% por frame
                                    this.currentPos.lerp(gpsPos, 0.05);
                                    this.el.object3D.position.copy(this.currentPos);
                                }
                            });

                            // Lógica de Distância em tempo real
                            window.addEventListener('gps-camera-update-position', (e) => {
                                const el = document.querySelector('[gps-entity-place]');
                                const distance = el.getAttribute('distanceMsg');
                                const textEl = document.querySelector('#distancia-txt');
                                if (textEl && distance) {
                                    textEl.setAttribute('value', distance + 'm');
                                }
                            });
                        </script>

                        <a-scene
                            vr-mode-ui="enabled: false"
                            embedded
                            arjs="sourceType: webcam; debugUIEnabled: false;"
                        >
                            <a-camera gps-camera="minDistance: 1;" rotation-reader></a-camera>

                            <a-entity 
                                gps-entity-place="latitude: ${lat}; longitude: ${lng};" 
                                lerp-stabilizer
                            >
                                <a-entity look-at="[gps-camera]">
                                    <a-plane color="white" width="6" height="3" position="0 2.5 0" material="opacity: 0.95"></a-plane>
                                    
                                    <a-text 
                                        value="${nome}" 
                                        align="center" 
                                        color="black" 
                                        width="14" 
                                        position="0 3.2 0.1"
                                        font="https://cdn.aframe.io/fonts/Exo2Bold.fnt"
                                    ></a-text>

                                    <a-text 
                                        id="distancia-txt"
                                        value="A calcular..." 
                                        align="center" 
                                        color="#ff0000" 
                                        width="12" 
                                        position="0 2.0 0.1"
                                    ></a-text>

                                    <a-cylinder color="red" height="8" radius="0.05" position="0 -1.5 0"></a-cylinder>
                                    <a-sphere color="red" radius="0.3" position="0 -5.5 0"></a-sphere>
                                </a-entity>
                            </a-entity>
                        </a-scene>
                    </body>
                    </html>
                `}
                className="w-full h-full border-none"
            />

            {/* Legenda de ajuda no fundo */}
            <div className="absolute bottom-10 left-0 right-0 z-[5002] px-10 text-center pointer-events-none">
                <p className="text-white text-[10px] bg-black/40 py-2 rounded-lg backdrop-blur-sm">
                    Mantenha o telemóvel vertical e aguarde a estabilização do sinal GPS.
                </p>
            </div>
        </div>
    );
}