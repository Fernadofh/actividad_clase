
const CLAVE_TOKEN = 'token';
const CLAVE_USUARIO = 'usuario';

export function mostrarAlerta(mensaje, tipo = 'error') {
    const formulario = document.querySelector('#formulario');
    if (!formulario) return;

    const alertaPrevia = document.querySelector('.alerta');
    if (alertaPrevia) alertaPrevia.remove();

    const alerta = document.createElement('p');
    alerta.classList.add(
        'alerta', 'px-4', 'py-3', 'rounded', 'max-w-lg',
        'mx-auto', 'mt-6', 'text-center'
    );

    if (tipo === 'error') {
        alerta.classList.add('bg-red-100', 'border-red-400', 'text-red-700');
        alerta.innerHTML = `<strong class="font-bold">Error! </strong><span>${mensaje}</span>`;
    } else {
        alerta.classList.add('bg-green-100', 'border-green-400', 'text-green-700');
        alerta.innerHTML = `<span>${mensaje}</span>`;
    }

    formulario.appendChild(alerta);
    setTimeout(() => alerta.remove(), 3000);
}


export function guardarSesion(token, usuario) {
    localStorage.setItem(CLAVE_TOKEN, token);
    localStorage.setItem(CLAVE_USUARIO, JSON.stringify(usuario));
}

export function obtenerToken() {
    return localStorage.getItem(CLAVE_TOKEN);
}

export function obtenerUsuario() {
    const datos = localStorage.getItem(CLAVE_USUARIO);
    return datos ? JSON.parse(datos) : null;
}

export function cerrarSesion() {
    localStorage.removeItem(CLAVE_TOKEN);
    localStorage.removeItem(CLAVE_USUARIO);
    window.location.href = 'login.html';
}


export function leerPayload(token) {
    try {
        const payloadBase64 = token.split('.')[1];
        const json = atob(payloadBase64.replace(/-/g, '+').replace(/_/g, '/'));
        return JSON.parse(json);
    } catch (error) {
        return null;
    }
}


export function autenticado() {
    const token = obtenerToken();
    if (!token) return false;

    const payload = leerPayload(token);
    if (!payload || !payload.exp) return false;

    if (payload.exp * 1000 <= Date.now()) {
        localStorage.removeItem(CLAVE_TOKEN);
        localStorage.removeItem(CLAVE_USUARIO);
        return false;
    }
    return true;
}


export function protegerPagina() {
    if (!autenticado()) {
        window.location.href = 'login.html';
        return false;
    }
    return true;
}

export function pintarBarraSesion() {
    const contenedor = document.querySelector('#sesion');
    if (!contenedor) return;

    const usuario = obtenerUsuario();
    contenedor.innerHTML = `
        <p class="text-white text-sm mb-2">Sesión: <span class="font-bold">${usuario ? usuario.usuario : ''}</span></p>
        <button id="btn-logout" class="bg-teal-900 hover:bg-teal-800 text-white text-sm px-3 py-1 rounded w-full">
            Cerrar sesión
        </button>
    `;
    document.querySelector('#btn-logout').addEventListener('click', cerrarSesion);
}
