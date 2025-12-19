import { useState } from 'react';
import { supabase } from '~/auth/utils/supabase';
import i18n from "i18next";

interface RegisterFormProps {
    onClose: () => void;
    onSwitchToLogin: () => void;
}

export function RegisterForm({ onClose, onSwitchToLogin }: RegisterFormProps) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (password.length < 6) {
            setError('A password deve ter no mínimo 6 caracteres.');
            return;
        }

        if (password !== confirmPassword) {
            setError('As passwords não coincidem.');
            return;
        }

        setLoading(true);

        const { data: { user: authUser }, error: authError } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    language: i18n.resolvedLanguage
                },
                emailRedirectTo: `${window.location.origin}/${i18n.resolvedLanguage}`,
            },
        });

        if (authError) {
            setError(authError.message);
            setLoading(false);
            return;
        }

        setSuccess(true);
        setLoading(false);
    };

    if (success) {
        return (
            <div className="p-6 bg-white shadow-xl rounded-xl max-w-sm w-full">
                <h2 className="text-2xl font-bold text-center text-green-600 mb-4">
                    Registo Quase Concluído!
                </h2>
                <p className="text-gray-700 text-center">
                    Verifique a sua caixa de entrada (<strong className='font-semibold'>{email}</strong>) para o email de confirmação.
                </p>
                <div className="mt-6 text-center">
                    <button
                        type="button"
                        onClick={onClose}
                        className="text-sm text-blue-600 hover:text-blue-700 underline"
                    >
                        Fechar
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 bg-white shadow-xl rounded-xl max-w-sm w-full">
            <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">
                Registar
            </h2>

            <form onSubmit={handleRegister} className="space-y-4">
                <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                        Email
                    </label>
                    <input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md 
                                   focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="seu.email@exemplo.com"
                    />
                </div>

                <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                        Password
                    </label>
                    <input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        minLength={6}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md 
                                   focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Mínimo 6 caracteres"
                    />
                </div>

                <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                        Repetir Password
                    </label>
                    <input
                        id="confirmPassword"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        minLength={6}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md 
                                   focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Repita a password"
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
                    className="w-full bg-green-600 text-white py-2 px-4 rounded-lg 
                               hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                    {loading ? 'A criar conta...' : 'Registar'}
                </button>

                <div className="text-center">
                    <button
                        type="button"
                        onClick={onSwitchToLogin}
                        className="text-blue-600 hover:text-blue-700 text-sm underline"
                    >
                        Já tem conta? Entrar
                    </button>
                </div>
            </form>
        </div>
    );
}
