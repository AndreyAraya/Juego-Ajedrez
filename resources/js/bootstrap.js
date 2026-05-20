// Importamos Axios para poder hacer peticiones HTTP (AJAX) de forma sencilla
import axios from "axios";

// Lo asignamos al objeto global 'window' para poder usarlo en cualquier parte de nuestra app
window.axios = axios;

// Le indicamos a Laravel que todas nuestras peticiones son asíncronas (AJAX)
// Esto ayuda al backend a responder con JSON en lugar de intentar redirigir vistas
window.axios.defaults.headers.common["X-Requested-With"] = "XMLHttpRequest";

// Importamos las librerías necesarias para la magia del tiempo real
import Echo from "laravel-echo";
import Pusher from "pusher-js";

// Hacemos que la librería de Pusher esté disponible globalmente
window.Pusher = Pusher;

// Inicializamos Laravel Echo y lo configuramos para usar los servidores de Pusher
window.Echo = new Echo({
    broadcaster: "pusher",

    // Leemos las credenciales que Vite inyecta automáticamente desde nuestro archivo .env
    key: import.meta.env.VITE_PUSHER_APP_KEY,
    cluster: import.meta.env.VITE_PUSHER_APP_CLUSTER,

    // Forzamos que la conexión viaje encriptada (WSS/HTTPS) por seguridad
    forceTLS: true,

    // Ruta en el backend donde Laravel verifica si el usuario tiene permiso
    // para escuchar los canales privados (como las partidas de ajedrez)
    authEndpoint: "/broadcasting/auth",
});
