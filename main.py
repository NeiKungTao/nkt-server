from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pymongo import MongoClient, ASCENDING, DESCENDING
from bson import ObjectId
from bson.binary import Binary
from typing import Any, Dict, Optional
import datetime
import os

# ─── Configuración ────────────────────────────────────────────────────────────
MONGO_URI = os.environ.get("MONGO_URI", "mongodb+srv://sgvcorreo1_db_user:o7RpuB5yKunt4vyW@clusternkt.lsg0nfe.mongodb.net/?retryWrites=true&w=majority&appName=ClusterNKT")
DB_NAME   = os.environ.get("DB_NAME", "neikungtao_migrated")

app = FastAPI(title="Nei Kung Tao API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_db():
    client = MongoClient(MONGO_URI)
    return client[DB_NAME]

def clean_doc(doc):
    """Convierte ObjectId y Binary a tipos serializables."""
    if doc is None:
        return None
    result = {}
    for k, v in doc.items():
        if k == "_id":
            continue
        elif isinstance(v, ObjectId):
            result[k] = str(v)
        elif isinstance(v, Binary):
            result[k] = None  # No enviamos fotos por ahora
        elif isinstance(v, bytes):
            result[k] = None
        else:
            result[k] = v
    return result

def get_next_id(collection_name: str) -> int:
    db = get_db()
    # Verificar si el counter existe y tiene un valor coherente
    counter = db["counters"].find_one({"_id": collection_name})
    if not counter:
        # Inicializar con el máximo ID existente en la colección
        id_field = "alu_ID" if collection_name == "alumnos" else "pago_ID"
        pipeline = [{"$group": {"_id": None, "max_id": {"$max": f"${id_field}"}}}]
        result = list(db[collection_name].aggregate(pipeline))
        max_id = int(result[0]["max_id"]) if result and result[0]["max_id"] else 0
        db["counters"].insert_one({"_id": collection_name, "seq": max_id})
    result = db["counters"].find_one_and_update(
        {"_id": collection_name},
        {"$inc": {"seq": 1}},
        return_document=True
    )
    return result["seq"]


# ─── Alumnos ──────────────────────────────────────────────────────────────────

@app.get("/alumnos")
def get_alumnos(
    activos: Optional[int] = None,
    disciplina: Optional[str] = None,
    kwoon: Optional[str] = None,
    search: Optional[str] = None,
):
    query = {}
    if activos is not None:
        query["estado_alu"] = activos
    if disciplina:
        query["disciplinas_alu"] = {"$regex": disciplina, "$options": "i"}

    kwoon_map = {
        "Mayores": ["Central Mayores", "Central Mayores (SH)", "OnLine"],
        "Menores": ["Central Menores", "Centro Comercial (Menores)", "SAN ESTEBAN (Menores)"],
        "Ambos":   ["Central Mayores", "Central Mayores (SH)", "OnLine",
                    "Central Menores", "Centro Comercial (Menores)", "SAN ESTEBAN (Menores)"],
    }
    if kwoon and kwoon in kwoon_map:
        query["kwoon_alu"] = {"$in": kwoon_map[kwoon]}

    db   = get_db()
    docs = list(db["alumnos"].find(query).sort("apellido_alu", ASCENDING))

    if search:
        s = search.lower()
        docs = [d for d in docs if
                s in str(d.get("apellido_alu", "")).lower() or
                s in str(d.get("nombre_alu", "")).lower() or
                s in str(d.get("disciplinas_alu", "")).lower() or
                s in str(d.get("alu_ID", ""))]

    return [clean_doc(d) for d in docs]


@app.get("/alumnos/{alu_id}")
def get_alumno(alu_id: int):
    db  = get_db()
    doc = db["alumnos"].find_one({"alu_ID": alu_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Alumno no encontrado")
    return clean_doc(doc)


@app.post("/alumnos")
def create_alumno(data: Dict[str, Any]):
    nuevo_id = get_next_id("alumnos")
    data["alu_ID"] = nuevo_id
    data.pop("_id", None)
    db = get_db()
    db["alumnos"].insert_one(data)
    return {"alu_ID": nuevo_id, "ok": True}


@app.put("/alumnos/{alu_id}")
def update_alumno(alu_id: int, data: Dict[str, Any]):
    data.pop("_id", None)
    data.pop("alu_ID", None)
    db = get_db()
    db["alumnos"].update_one({"alu_ID": alu_id}, {"$set": data})
    return {"ok": True}


@app.delete("/alumnos/{alu_id}")
def delete_alumno(alu_id: int):
    db = get_db()
    db["alumnos"].delete_one({"alu_ID": alu_id})
    db["pagos"].delete_many({"alu_ID": alu_id})
    db["perfil"].delete_one({"alu_ID": alu_id})
    return {"ok": True}


# ─── Pagos ────────────────────────────────────────────────────────────────────

@app.get("/pagos/{alu_id}")
def get_pagos(alu_id: int):
    db   = get_db()
    docs = list(
        db["pagos"]
        .find({"alu_ID": alu_id})
        .sort([("fecha_pago_alu", DESCENDING), ("pago_ID", DESCENDING)])
    )
    return [clean_doc(d) for d in docs]


@app.post("/pagos")
def create_pago(data: Dict[str, Any]):
    nuevo_id = get_next_id("pagos")
    data["pago_ID"] = nuevo_id
    data.pop("_id", None)
    db = get_db()
    db["pagos"].insert_one(data)
    return {"pago_ID": nuevo_id, "ok": True}


@app.put("/pagos/{pago_id}")
def update_pago(pago_id: int, data: Dict[str, Any]):
    data.pop("_id", None)
    data.pop("pago_ID", None)
    db = get_db()
    db["pagos"].update_one({"pago_ID": pago_id}, {"$set": data})
    return {"ok": True}


@app.delete("/pagos/{pago_id}")
def delete_pago(pago_id: int):
    db = get_db()
    db["pagos"].delete_one({"pago_ID": pago_id})
    return {"ok": True}


# ─── Morosos ──────────────────────────────────────────────────────────────────

@app.get("/morosos")
def get_morosos():
    db = get_db()
    exceptuados = [44, 133, 37]
    alumnos_activos = list(db["alumnos"].find(
        {"estado_alu": 1, "alu_ID": {"$nin": exceptuados}},
        {"alu_ID": 1, "apellido_alu": 1, "nombre_alu": 1,
         "disciplinas_alu": 1, "contacto_alu": 1}
    ))

    morosos = []
    hoy = datetime.datetime.now()

    for alu in alumnos_activos:
        ultimo = db["pagos"].find_one(
            {"alu_ID": alu["alu_ID"]},
            {"fecha_pago_alu": 1},
            sort=[("fecha_pago_alu", DESCENDING)]
        )
        if not ultimo:
            continue
        fecha_str = ultimo.get("fecha_pago_alu")
        if not fecha_str:
            continue
        try:
            for fmt in ("%Y-%m-%d %H:%M:%S", "%Y-%m-%d"):
                try:
                    fecha = datetime.datetime.strptime(str(fecha_str).split(".")[0], fmt)
                    break
                except ValueError:
                    continue
            else:
                continue
            dias = (hoy - fecha).days
            if dias > 31:
                morosos.append({
                    "alu_ID":        alu["alu_ID"],
                    "apellido_alu":  alu.get("apellido_alu", ""),
                    "nombre_alu":    alu.get("nombre_alu", ""),
                    "disciplinas_alu": alu.get("disciplinas_alu", ""),
                    "contacto_alu":  alu.get("contacto_alu", ""),
                    "ultimo_pago":   fecha.strftime("%d/%m/%Y"),
                    "dias_atraso":   dias - 31,
                })
        except Exception:
            continue

    morosos.sort(key=lambda x: x["apellido"])
    return morosos


# ─── Stats ────────────────────────────────────────────────────────────────────

KWOONS_MENORES = ["Central Menores", "Centro Comercial (Menores)", "SAN ESTEBAN (Menores)"]

@app.get("/stats")
def get_stats():
    db        = get_db()
    activos   = db["alumnos"].count_documents({"estado_alu": 1})
    inactivos = db["alumnos"].count_documents({"estado_alu": 0})

    # Obtener kwoon de cada alumno para saber si es menor
    alumnos_map = {
        a["alu_ID"]: a.get("kwoon_alu", "")
        for a in db["alumnos"].find({}, {"alu_ID": 1, "kwoon_alu": 1})
    }

    pagos = list(db["pagos"].find({}, {"fecha_pago_alu": 1, "monto_pago": 1, "alu_ID": 1}))
    mensual = {}
    for p in pagos:
        fecha_str = str(p.get("fecha_pago_alu") or "").split(" ")[0]
        if not fecha_str:
            continue
        try:
            parts = fecha_str.split("-")
            key   = f"{parts[1]}/{parts[0]}"
            monto = float(p.get("monto_pago") or 0)
            # Si el alumno es de kwoon menores, contar solo el 20%
            kwoon = alumnos_map.get(p.get("alu_ID"), "")
            if kwoon in KWOONS_MENORES:
                monto = monto * 0.20
            mensual[key] = mensual.get(key, 0) + monto
        except Exception:
            continue

    meses_ordenados = sorted(
        mensual.items(),
        key=lambda x: (x[0].split("/")[1], x[0].split("/")[0])
    )

    return {
        "activos":   activos,
        "inactivos": inactivos,
        "meses":     meses_ordenados[-13:],
    }


# ─── Health check ─────────────────────────────────────────────────────────────

@app.get("/")
def health():
    return {"status": "ok", "app": "Nei Kung Tao API"}
