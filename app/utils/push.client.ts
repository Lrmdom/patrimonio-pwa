export async function setupPush() {
    // 1. Espera que o Service Worker que o VitePWA instalou esteja pronto
    const registration = await navigator.serviceWorker.ready;

    // 2. Pede permissão ao utilizador
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return;

    // 3. Subscreve (Tens de meter aqui a tua chave VAPID Public que geraste)
    const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: 'BORSVLqvmfvZWnZZ2TowvYv86Oq5S6BAbqsa_UH_1iddtufyqKPgQzecPyCcFapOfASOFmsgYbTF3iJl75LvafA'
    });

    // 4. Envia para uma 'action' do React Router ou para o teu Hono
    await fetch('https://services.execlog.com/push-notifications-subscribe', {
        method: 'POST',
        body: JSON.stringify(subscription),
        headers: { 'Content-Type': 'application/json' }
    });
}