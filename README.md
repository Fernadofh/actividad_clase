# API REST de Usuarios - Autenticación con JWT (JSON Web Token)
**Asignatura:** Programación Web - CEUTEC

## Flujo de Autenticación

1. **Petición de Login:** El cliente envía usuario y contraseña mediante un método `POST` a `/usuario/login`.
2. **Validación:** El servidor valida las credenciales contra la base de datos.
3. **Firma de Token:** Si son correctas, el servidor **firma** un token JWT utilizando su `SECRET_KEY`.
4. **Envío de Token:** El cliente guarda el token y lo incluye en el encabezado (*header*) de cada petición protegida:
   ```http
   Authorization: Bearer <token>