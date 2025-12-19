// components/UserSync.tsx
import { useEffect } from 'react';
import { getSupabase } from '~/auth/utils/supabase';
import { useI18n } from '~/context/I18nContext';

interface UserSyncProps {
    onLocationUpdate?: (location: GeolocationPosition | null) => void;
    onLanguageUpdate?: (language: string) => void;
    onCountryCodeUpdate?: (countryCode: string | null) => void;
    onAddressUpdate?: (address: string | null) => void;
}

export function UserSync({
                             onLocationUpdate,
                             onLanguageUpdate,
                             onCountryCodeUpdate,
                             onAddressUpdate
                         }: UserSyncProps) {

    const { language: contextLanguage } = useI18n();



    return null; // Componente não renderiza nada visual
}

// Função para enviar para o serviço externo

// Funções auxiliares
const getBrowserInfo = () => {
    const ua = navigator.userAgent;
    let name = "Unknown";
    let version = "Unknown";

    if (ua.includes("Chrome") && !ua.includes("Edg")) {
        name = "Chrome";
        version = ua.match(/Chrome\/([0-9.]+)/)?.[1] || "Unknown";
    } else if (ua.includes("Firefox")) {
        name = "Firefox";
        version = ua.match(/Firefox\/([0-9.]+)/)?.[1] || "Unknown";
    } else if (ua.includes("Safari") && !ua.includes("Chrome")) {
        name = "Safari";
        version = ua.match(/Version\/([0-9.]+)/)?.[1] || "Unknown";
    } else if (ua.includes("Edg")) {
        name = "Edge";
        version = ua.match(/Edg\/([0-9.]+)/)?.[1] || "Unknown";
    }

    return { name, version };
};

const getDeviceInfo = () => {
    const ua = navigator.userAgent;
    if (/Mobile|Android|iPhone|iPad|iPod/.test(ua)) {
        return { type: "mobile" };
    } else if (/Tablet|iPad/.test(ua)) {
        return { type: "tablet" };
    } else {
        return { type: "desktop" };
    }
};

const getCountryName = (countryCode: string | null) => {
    if (!countryCode) return null;

    const countryNames = {
        "PT": "Portugal",
        "BR": "Brazil",
        "US": "United States",
        "ES": "Spain",
        "FR": "France",
        "DE": "Germany",
        "IT": "Italy",
        "UK": "United Kingdom"
    };
    return countryNames[countryCode as keyof typeof countryNames] || countryCode;
};