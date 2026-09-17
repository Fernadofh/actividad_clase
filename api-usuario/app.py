

import os
import hashlib
from datetime import datetime, timedelta, timezone
from functools import wraps

import jwt  # Librería PyJWT
from flask import Flask, jsonify, request
from flask_cors import CORS

from conexion import ConexionDB

app = Flask(__name__)

CORS(app, resources={
    r"/*": {
        "origins": ["http://localhost:5500", "http://127.0.0.1:5500"],
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"]
    }
})


app.config['MYSQL_HOST'] = 'localhost'
app.config['MYSQL_USER'] = 'root'
app.config['MYSQL_PASSWORD'] = 'Admin1234'
app.config['MYSQL_DB'] = 'VENTAS'

db = ConexionDB(
    app.config['MYSQL_HOST'],
    app.config['MYSQL_USER'],
    app.config['MYSQL_PASSWORD'],
    app.config['MYSQL_DB']
)


app.config['SECRET_KEY'] = os.environ.get(
    'JWT_SECRET_KEY',
    'clave-secreta-solo-para-clase-cambiar-en-produccion'
)
JWT_ALGORITMO = 'HS256'         
JWT_EXPIRACION_MINUTOS = 30     


def hash_clave(clave_texto_plano):

    return hashlib.sha1(clave_texto_plano.encode('utf-8')).hexdigest()


def generar_token(idemp, usuario):
  
    ahora = datetime.now(timezone.utc)
    payload = {
        'sub': str(idemp),                
        'usuario': usuario,                
        'iat': ahora,
        'exp': ahora + timedelta(minutes=JWT_EXPIRACION_MINUTOS)
    }
    return jwt.encode(payload, app.config['SECRET_KEY'], algorithm=JWT_ALGORITMO)


def obtener_token_del_header():
   
    cabecera = request.headers.get('Authorization', '')
    partes = cabecera.split()
    if len(partes) == 2 and partes[0].lower() == 'bearer':
        return partes[1]
    return None


def token_requerido(f):
    
    @wraps(f)
    def decorador(*args, **kwargs):
        token = obtener_token_del_header()

        if not token:
            return jsonify({
                'mensaje': 'Token no proporcionado. Inicie sesión.',
                'exito': False
            }), 401

        try:
            payload = jwt.decode(
                token,
                app.config['SECRET_KEY'],
                algorithms=[JWT_ALGORITMO]
            )
        except jwt.ExpiredSignatureError:
            return jsonify({
                'mensaje': 'La sesión expiró. Inicie sesión nuevamente.',
                'exito': False
            }), 401
        except jwt.InvalidTokenError:
            return jsonify({
                'mensaje': 'Token inválido.',
                'exito': False
            }), 401

        usuario_actual = {
            'idemp': int(payload['sub']),
            'usuario': payload.get('usuario')
        }
        return f(usuario_actual, *args, **kwargs)

    return decorador



@app.route('/')
def index():
    return jsonify({'mensaje': 'API de Usuarios con JWT', 'exito': True})


@app.route('/usuario/login', methods=['POST'])
def autenticar_usuario():
    """
    LOGIN: valida credenciales y devuelve el JWT.
    Body esperado:  { "usuario": "...", "password": "..." }
    """
    datos_peticion = request.get_json(silent=True) or {}
    nombre_usuario = datos_peticion.get('usuario')
    password = datos_peticion.get('password')

    if not nombre_usuario or not password:
        return jsonify({'mensaje': 'Usuario y contraseña son obligatorios.',
                        'exito': False}), 400

    try:
        cursor = db.obtener_cursor()
        
        cursor.execute(
            "SELECT idemp, usuario, clave, estado FROM usuario WHERE usuario = %s",
            (nombre_usuario,)
        )
        datos = cursor.fetchone()
        cursor.close()
        print(password)
        print(datos[2])
       
        if datos is None or hash_clave(password) != datos[2]:
            return jsonify({'mensaje': 'Usuario o contraseña incorrectos.',
                            'exito': False}), 401

        if str(datos[3]) == '0':
            return jsonify({'mensaje': 'El usuario está inactivo.',
                            'exito': False}), 403

        token = generar_token(datos[0], datos[1])

        return jsonify({
            'mensaje': 'Login exitoso',
            'exito': True,
            'token': token,
            'expira_en': JWT_EXPIRACION_MINUTOS * 60,   
            'usuario': {'idemp': datos[0], 'usuario': datos[1]}
        }), 200

    except Exception as ex:
        return jsonify({'mensaje': f'Error en el servidor: {ex}',
                        'exito': False}), 500


# ===========================================================================
# RUTAS PROTEGIDAS  (requieren  Authorization: Bearer <token>)
# ===========================================================================

@app.route('/usuario/perfil', methods=['GET'])
@token_requerido
def perfil(usuario_actual):
    """Devuelve los datos del usuario dueño del token. Útil para validar sesión."""
    return jsonify({'usuario': usuario_actual, 'exito': True})


@app.route('/usuario', methods=['GET'])
@token_requerido
def listar_usuarios(usuario_actual):
    try:
        cursor = db.obtener_cursor()
        
        cursor.execute("SELECT idemp, usuario, estado FROM usuario")
        datos = cursor.fetchall()
        cursor.close()

        usuarios = [{'idemp': fila[0], 'usuario': fila[1], 'estado': fila[2]}
                    for fila in datos]

        return jsonify({
            'usuarios': usuarios,
            'mensaje': 'Lista de usuarios obtenida exitosamente',
            'exito': True
        })
    except Exception as ex:
        return jsonify({'mensaje': f'Error: {ex}', 'exito': False}), 500


def leer_usuario_bd_by_id(id):
    cursor = db.obtener_cursor()
    cursor.execute(
        "SELECT idemp, usuario, estado FROM usuario WHERE idemp = %s", (id,)
    )
    datos = cursor.fetchone()
    cursor.close()
    if datos is None:
        return None
    return {'idemp': datos[0], 'usuario': datos[1], 'estado': datos[2]}


@app.route('/usuario/<int:id>', methods=['GET'])
@token_requerido
def listar_usuario_por_id(usuario_actual, id):
    try:
        usuario = leer_usuario_bd_by_id(id)
        if usuario:
            return jsonify(usuario)
        return jsonify({'mensaje': 'Usuario no encontrado', 'exito': False}), 404
    except Exception as ex:
        return jsonify({'mensaje': f'Error: {ex}', 'exito': False}), 500


@app.route('/usuario', methods=['POST'])
@token_requerido
def registrar_usuario(usuario_actual):
    datos_peticion = request.get_json(silent=True) or {}
    idemp = datos_peticion.get('idemp')
    nombre_usuario = datos_peticion.get('usuario')
    clave = datos_peticion.get('clave')
    estado = datos_peticion.get('estado')

    if not idemp or not nombre_usuario or not clave or estado is None:
        return jsonify({'mensaje': 'Parámetros inválidos...', 'exito': False}), 400

    try:
        if leer_usuario_bd_by_id(idemp) is not None:
            return jsonify({'mensaje': 'Código ya existe, no se puede duplicar.',
                            'exito': False}), 409

        cursor = db.obtener_cursor()
        cursor.execute(
            "INSERT INTO usuario (idemp, usuario, clave, estado) VALUES (%s, %s, %s, %s)",
            (idemp, nombre_usuario, hash_clave(clave), estado)
        )
        db.conexion.commit()
        cursor.close()
        return jsonify({'mensaje': 'Usuario registrado.', 'exito': True}), 201
    except Exception as ex:
        return jsonify({'mensaje': f'Error al registrar usuario: {ex}',
                        'exito': False}), 500


@app.route('/usuario/<int:id>', methods=['PUT'])
@token_requerido
def actualizar_usuario(usuario_actual, id):
    datos_peticion = request.get_json(silent=True) or {}
    nombre_usuario = datos_peticion.get('usuario')
    clave = datos_peticion.get('clave')          # opcional
    estado = datos_peticion.get('estado')

    if not nombre_usuario or estado is None:
        return jsonify({'mensaje': 'Parámetros inválidos...', 'exito': False}), 400

    try:
        if leer_usuario_bd_by_id(id) is None:
            return jsonify({'mensaje': 'Usuario no encontrado.', 'exito': False}), 404

        cursor = db.obtener_cursor()
        if clave:
            
            cursor.execute(
                "UPDATE usuario SET usuario = %s, clave = %s, estado = %s WHERE idemp = %s",
                (nombre_usuario, hash_clave(clave), estado, id)
            )
        else:
            cursor.execute(
                "UPDATE usuario SET usuario = %s, estado = %s WHERE idemp = %s",
                (nombre_usuario, estado, id)
            )
        db.conexion.commit()
        cursor.close()
        return jsonify({'mensaje': 'Usuario actualizado.', 'exito': True})
    except Exception as ex:
        return jsonify({'mensaje': f'Error: {ex}', 'exito': False}), 500


@app.route('/usuario/<int:id>', methods=['DELETE'])
@token_requerido
def eliminar_usuario(usuario_actual, id):
    try:
        if leer_usuario_bd_by_id(id) is None:
            return jsonify({'mensaje': 'Usuario no encontrado.', 'exito': False}), 404

       
        if usuario_actual['idemp'] == id:
            return jsonify({'mensaje': 'No puede eliminar su propio usuario.',
                            'exito': False}), 403

        cursor = db.obtener_cursor()
        cursor.execute("DELETE FROM usuario WHERE idemp = %s", (id,))
        db.conexion.commit()
        cursor.close()
        return jsonify({'mensaje': 'Usuario eliminado.', 'exito': True})
    except Exception as ex:
        return jsonify({'mensaje': f'Error: {ex}', 'exito': False}), 500


if __name__ == '__main__':
    app.run(debug=True, port=5000)
