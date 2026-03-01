// app/components/AuthWidget.tsx
import {  useState } from 'react'
import { useAuth } from '~/auth/context/AuthContext'
import { LoginForm } from '~/auth/components/LoginForm'
import { RegisterForm } from '~/auth/components/RegisterForm'
import { UserMenu } from '~/auth/components/UserMenu'



/* ---------------------------------------------------- */
/* TOKEN CACHE                                           */
/* ---------------------------------------------------- */

let tokenCache: {
    token: string | null
    refreshToken: string | null
    expiry: number
    userId: string
} | null = null

/* ---------------------------------------------------- */

interface AuthWidgetProps {
    location: GeolocationPosition | null
    language: string
    countryCode: string | null
    address: string | null
}

export function AuthWidget({ location, language, countryCode, address }: AuthWidgetProps) {
    const { user } = useAuth()
    const [showLogin, setShowLogin] = useState(false)
    const [loadingCustomer, setLoadingCustomer] = useState(false)
    const [showRegister, setShowRegister] = useState(false)

    // --- CORREÇÃO DO CSS (Comportamento de Modal) ---
    if (!user) {
        if (showLogin || showRegister) {
            return (
                <div className='fixed inset-0 z-[60] flex justify-center items-center bg-black/50 overflow-y-auto p-4'>
                    {showRegister ? (
                        <RegisterForm
                            onClose={() => setShowRegister(false)}
                            onSwitchToLogin={() => {
                                setShowRegister(false)
                                setShowLogin(true)
                            }}
                        />
                    ) : (
                        <LoginForm
                            onClose={() => setShowLogin(false)}
                            onSwitchToRegister={() => {
                                setShowLogin(false)
                                setShowRegister(true)
                            }}
                        />
                    )}
                </div>
            )
        }

        // Botões para abrir o modal de login/registo
        return (
            <div className="flex space-x-2">
                <button
                    onClick={() => setShowLogin(true)}
                    className="text-sm px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                    Entrar
                </button>
                <button
                    onClick={() => setShowRegister(true)}
                    className="text-sm px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"
                >
                    Registar
                </button>
            </div>
        )
    }
    // --- FIM DA CORREÇÃO CSS ---


    if (loadingCustomer) {
        return <div className="text-center">A carregar dados de cliente...</div>
    }



    return (
        <>


            <UserMenu
                user={user}

            />
        </>
    )
}
