# NKT Server — Instrucciones de despliegue en Railway

## Archivos necesarios
- `main.py` — servidor FastAPI
- `requirements.txt` — dependencias Python
- `Procfile` — comando de inicio para Railway

---

## Paso 1 — Crear repositorio en GitHub

1. Entrá a https://github.com y creá una cuenta si no tenés
2. Clic en **"New repository"**
3. Nombre: `nkt-server`
4. Dejalo en **Public**
5. Clic en **"Create repository"**

Luego en tu terminal:
```bash
cd carpeta-donde-están-los-archivos
git init
git add .
git commit -m "primer commit"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/nkt-server.git
git push -u origin main
```

---

## Paso 2 — Desplegar en Railway

1. Entrá a https://railway.app
2. Clic en **"Login"** → **"Login with GitHub"**
3. Clic en **"New Project"**
4. Elegí **"Deploy from GitHub repo"**
5. Seleccioná tu repositorio `nkt-server`
6. Railway detecta automáticamente el Procfile y despliega

---

## Paso 3 — Configurar variable de entorno

En Railway, una vez creado el proyecto:
1. Clic en tu servicio
2. Pestaña **"Variables"**
3. Clic en **"New Variable"**
4. Agregá:
   - **Name:** `MONGO_URI`
   - **Value:** tu cadena de conexión de MongoDB Atlas

---

## Paso 4 — Obtener la URL pública

1. En Railway, pestaña **"Settings"**
2. Sección **"Networking"** → **"Generate Domain"**
3. Te da una URL como: `nkt-server-production.up.railway.app`

Esa URL es la que ponés en la app del celular en **Ajustes → URL del servidor**.
