// app/components/LoginForm.tsx
import { useState } from 'react';
import { getSupabase, supabase } from '~/auth/utils/supabase';
import i18n from "i18next";

interface LoginFormProps {
    onClose: () => void;
    onSwitchToRegister: () => void;
}

interface UserProfileData {
    profile: any;
    profile_services: any[];
    profile_brands: any[];
    profile_service_brand: any[];
}

export function LoginForm({ onClose, onSwitchToRegister }: LoginFormProps) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [showForgotPassword, setShowForgotPassword] = useState(false);
    const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
    const [forgotPasswordLoading, setForgotPasswordLoading] = useState(false);
    const [forgotPasswordSuccess, setForgotPasswordSuccess] = useState(false);

    // -------- LOGIN NORMAL --------
    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        const { data: { user: authUser }, error: authError } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (authError) {
            setError(authError.message);
            setLoading(false);
            return;
        }

        setLoading(false);
    };

    // -------- LOGIN SOCIAL --------
    const handleSocialLogin = async (provider: 'google' | 'facebook' | 'azure' | 'linkedin') => {
        setError(null);
        setLoading(true);

        const { error: authError } = await supabase.auth.signInWithOAuth({
            provider,
            options: {
                redirectTo: `${window.location.origin}/${i18n.resolvedLanguage}`,
            },
        });

        if (authError) {
            setError(authError.message);
        }
        setLoading(false);
    };

    // -------- RESET PASSWORD --------
    const handleForgotPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setForgotPasswordLoading(true);
        setError(null);

        const { error: resetError } = await supabase.auth.resetPasswordForEmail(
            forgotPasswordEmail,
            {
                redirectTo: `${window.location.origin}/${i18n.resolvedLanguage}/welcome-and-reset-password`,
            }
        );

        if (resetError) {
            setError(resetError.message);
        } else {
            setForgotPasswordSuccess(true);
        }
        setForgotPasswordLoading(false);
    };

    // -------- UI RESET PASSWORD --------
    if (showForgotPassword) {
        return (
            <div className="p-6 bg-white shadow-xl rounded-xl max-w-sm w-full">
                <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">Redefinir Password</h2>

                {forgotPasswordSuccess ? (
                    <p className="text-center text-green-600">
                        Email enviado. Verifique a sua caixa de entrada.
                    </p>
                ) : (
                    <form onSubmit={handleForgotPassword} className="space-y-4">
                        <p className="text-sm text-gray-600">
                            Insira o seu email para receber o link de redefinição.
                        </p>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">Email</label>
                            <input
                                type="email"
                                value={forgotPasswordEmail}
                                onChange={(e) => setForgotPasswordEmail(e.target.value)}
                                required
                                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            />
                        </div>

                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-sm">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={forgotPasswordLoading}
                            className="w-full bg-blue-600 text-white py-2 rounded-lg"
                        >
                            {forgotPasswordLoading ? 'A enviar...' : 'Enviar link'}
                        </button>
                    </form>
                )}

                <div className="mt-4 text-center">
                    <button
                        onClick={() => setShowForgotPassword(false)}
                        className="text-sm text-blue-600 underline"
                    >
                        Voltar ao Login
                    </button>
                </div>
            </div>
        );
    }

    // -------- UI LOGIN --------
    return (
        <div className="p-6 bg-white shadow-xl rounded-xl max-w-sm w-full">
            <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">Entrar</h2>

            <form onSubmit={handleLogin} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Email</label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">Password</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                </div>

                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-sm">
                        {error}
                    </div>
                )}

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-blue-600 text-white py-2 rounded-lg"
                >
                    {loading ? 'A entrar...' : 'Entrar'}
                </button>

                <div className="flex justify-between text-sm">
                    <button
                        type="button"
                        onClick={onSwitchToRegister}
                        className="text-blue-600 underline"
                    >
                        Não tem conta? Registar
                    </button>

                    <button
                        type="button"
                        onClick={() => setShowForgotPassword(true)}
                        className="text-gray-600 underline"
                    >
                        Esqueceu a password?
                    </button>
                </div>
            </form>

            {/* ---- Social ---- */}
            <div className="mt-6">
                <div className="relative flex items-center justify-center">
                    <div className="w-full h-px bg-gray-300 absolute"></div>
                    <span className="relative bg-white px-3 text-sm text-gray-500">Ou entre com</span>
                </div>

                <div className="mt-4 flex justify-center space-x-4">
                    {/* Google */}
                    <button
                        onClick={() => handleSocialLogin('google')}
                        className="w-12 h-12 flex items-center justify-center border rounded-full"
                    >
                        G
                    </button>

                    {/* Microsoft */}
                    <button
                        onClick={() => handleSocialLogin('azure')}
                        className="w-12 h-12 flex items-center justify-center border rounded-full"
                    >
                        MS
                    </button>

                    {/* Facebook */}
                    <button
                        onClick={() => handleSocialLogin('facebook')}
                        className="w-12 h-12 flex items-center justify-center border rounded-full"
                    >
                        f
                    </button>

                    {/* Linkedin */}
                    <button
                        onClick={() => handleSocialLogin('linkedin')}
                        className="w-12 h-12 flex items-center justify-center border rounded-full"
                    >
                        in
                    </button>
                </div>
            </div>

            <div className="mt-4 text-center">
                <button
                    onClick={onClose}
                    className="text-sm text-gray-600"
                >
                    Fechar
                </button>
            </div>
        </div>
    );
}
