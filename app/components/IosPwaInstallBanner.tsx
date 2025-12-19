import { useEffect, useState } from "react";

export default function IosPwaInstallBanner() {
    const [show, setShow] = useState(false);

    useEffect(() => {
        // Garante client-only
        if (typeof window === "undefined") return;

        const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
        const isSafari = /^((?!chrome|android).)*safari/i.test(
            navigator.userAgent
        );

        const isPWA =
            window.matchMedia("(display-mode: standalone)").matches ||
            // @ts-ignore
            window.navigator.standalone === true;

        if (isIOS && isSafari && !isPWA) {
            setShow(true);
        }
    }, []);

    if (!show) return null;

    return (
        <div className="fixed bottom-5 left-5 right-5 z-[9999] rounded-2xl bg-neutral-900 p-4 text-white shadow-2xl">
            <div className="pr-8">
                <strong className="block text-base">
                    📲 Instala esta app no teu iPhone
                </strong>
                <p className="mt-1 text-sm text-neutral-300">
                    Para receber notificações:
                    <br />
                    <span className="font-semibold">Partilhar</span> →{" "}
                    <span className="font-semibold">
            Adicionar ao ecrã principal
          </span>
                </p>
            </div>

            <button
                onClick={() => setShow(false)}
                aria-label="Fechar"
                className="absolute right-3 top-3 text-lg text-neutral-400 hover:text-white"
            >
                ✕
            </button>
        </div>
    );
}
