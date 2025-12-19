import {useState} from "react";

export function InviteUserForm() {
    const [email, setEmail] = useState("");
    const [status, setStatus] = useState<null | string>(null);

    async function inviteUser(e: React.FormEvent) {
        e.preventDefault();
        setStatus("loading");

        const formData = new FormData();
        formData.set("email", email);

        const res = await fetch("/invite-user", {
            method: "POST",
            body: formData
        });

        const result = await res.json();

        if (!res.ok) {
            setStatus("error:" + result.error);
        } else {
            setStatus("success");
            setEmail(""); // limpa o input
        }
    }

    return (
        <form onSubmit={inviteUser} className="px-4 py-3 border-t border-gray-100">
            <label className="text-sm text-gray-700 mb-1 block">
                Convidar utilizador
            </label>

            <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@exemplo.com"
                className="w-full px-3 py-2 border rounded-lg text-sm mb-2 focus:ring focus:ring-blue-200"
            />

            <button
                type="submit"
                className="w-full bg-blue-600 text-white text-sm py-2 rounded-lg hover:bg-blue-700 transition"
            >
                Enviar Convite
            </button>

            {status === "loading" && (
                <p className="text-xs mt-2 text-gray-500">A enviar...</p>
            )}
            {status?.startsWith("error") && (
                <p className="text-xs mt-2 text-red-600">
                    Erro: {status.replace("error:", "")}
                </p>
            )}
            {status === "success" && (
                <p className="text-xs mt-2 text-green-600">Convite enviado!</p>
            )}
        </form>
    );
}
