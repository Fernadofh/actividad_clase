
import { obtenerToken, cerrarSesion } from './funciones.js';

const urlBase = "http://127.0.0.1:5000";
const url = `${urlBase}/usuario`;

const fetchAutenticado = async (endpoint, opciones = {}) => {
    const token = obtenerToken();

    const respuesta = await fetch(endpoint, {
        ...opciones,
        mode: "cors",
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
            ...opciones.headers
        }
    });

    if (respuesta.status === 401) {
        alert('Su sesión expiró o no es válida. Inicie sesión nuevamente.');
        cerrarSesion();
        throw new Error('No autorizado');
    }

    return respuesta;
};


export const login = async (credenciales) => {
    try {
        const respuesta = await fetch(`${url}/login`, {
            method: 'POST',
            body: JSON.stringify(credenciales),
            headers: { 'Content-Type': 'application/json' },
            mode: "cors"
        });
        return await respuesta.json();
    } catch (error) {
        console.log(error);
        return { exito: false, mensaje: 'No se pudo conectar con el servidor.' };
    }
};

/* ------------------------------------------------------------------ */
/* Endpoints PROTEGIDOS                                                */
/* ------------------------------------------------------------------ */
export const obtenerPerfil = async () => {
    const respuesta = await fetchAutenticado(`${url}/perfil`, { method: "GET" });
    return await respuesta.json();
};

export const obtenerClientes = async () => {
    try {
        const respuesta = await fetchAutenticado(url, { method: "GET" });
        return await respuesta.json();
    } catch (error) {
        console.log(error);
    }
};

export const obtenerCliente = async id => {
    try {
        const respuesta = await fetchAutenticado(`${url}/${id}`, { method: "GET" });
        return await respuesta.json();
    } catch (error) {
        console.log(error);
    }
};

export const nuevoCliente = async cliente => {
    try {
        const respuesta = await fetchAutenticado(url, {
            method: 'POST',
            body: JSON.stringify(cliente)
        });
        return await respuesta.json();
    } catch (error) {
        console.log(error);
    }
};

export const editarCliente = async cliente => {
    try {
        const respuesta = await fetchAutenticado(`${url}/${cliente.idemp}`, {
            method: 'PUT',
            body: JSON.stringify(cliente)
        });
        return await respuesta.json();
    } catch (error) {
        console.log(error);
    }
};

export const eliminarCliente = async id => {
    try {
        const respuesta = await fetchAutenticado(`${url}/${id}`, { method: 'DELETE' });
        return await respuesta.json();
    } catch (error) {
        console.log(error);
    }
};
