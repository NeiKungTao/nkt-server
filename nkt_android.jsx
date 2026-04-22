import { useState, useEffect, useCallback } from "react";

// ─── URL del servidor FastAPI (se configura en Ajustes) ───────────────────────
function getServerUrl() {
  return localStorage.getItem("nkt_server_url") || "";
}

async function apiCall(method, path, body = null) {
  const base = getServerUrl().replace(/\/$/, "");
  if (!base) throw new Error("Servidor no configurado");
  const opts = {
    method,
    headers: { "Content-Type": "application/json" },
  };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`${base}${path}`, opts);
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Error ${res.status}: ${txt}`);
  }
  return res.json();
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatFecha(str) {
  if (!str) return "";
  const s = String(str).split(" ")[0];
  const [y, m, d] = s.split("-");
  if (!y || !m || !d) return s;
  return `${d}/${m}/${y}`;
}

function formatDocumento(doc) {
  if (!doc) return "";
  const digits = String(doc).replace(/\D/g, "");
  if (!digits) return "";
  return parseInt(digits).toLocaleString("es-AR");
}

// ─── Estilos base ─────────────────────────────────────────────────────────────
const css = `
  @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=Crimson+Pro:ital,wght@0,300;0,400;0,600;1,400&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --ink: #1a0f00;
    --paper: #f7f0e6;
    --parchment: #ede3d0;
    --red: #8b1a1a;
    --red-light: #c0392b;
    --gold: #b5922a;
    --gold-light: #d4aa4a;
    --sage: #4a6741;
    --sage-light: #6a8f60;
    --muted: #7a6a55;
    --border: #c8b898;
    --shadow: rgba(26,15,0,0.15);
    --radius: 12px;
    --radius-sm: 8px;
  }

  body {
    font-family: 'Crimson Pro', Georgia, serif;
    background: var(--paper);
    color: var(--ink);
    min-height: 100vh;
    overflow-x: hidden;
    -webkit-tap-highlight-color: transparent;
    user-select: none;
  }

  /* ── Cabecera ── */
  .app-header {
    background: linear-gradient(135deg, #1a0f00 0%, #2d1a00 50%, #1a0f00 100%);
    color: var(--gold-light);
    padding: 16px 20px 12px;
    position: sticky;
    top: 0;
    z-index: 100;
    box-shadow: 0 3px 20px rgba(0,0,0,0.5);
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .app-header .logo {
    font-family: 'Cinzel', serif;
    font-size: 20px;
    font-weight: 700;
    letter-spacing: 1px;
    line-height: 1.1;
    flex: 1;
  }
  .app-header .subtitle {
    font-size: 11px;
    color: var(--gold);
    font-style: italic;
    letter-spacing: 2px;
    text-transform: uppercase;
    margin-top: 2px;
  }
  .header-badge {
    background: var(--red);
    color: white;
    border-radius: 20px;
    padding: 4px 10px;
    font-size: 12px;
    font-family: 'Cinzel', serif;
  }

  /* ── Bottom Nav ── */
  .bottom-nav {
    position: fixed;
    bottom: 0;
    left: 0; right: 0;
    background: #1a0f00;
    display: flex;
    z-index: 100;
    box-shadow: 0 -3px 20px rgba(0,0,0,0.4);
    padding-bottom: env(safe-area-inset-bottom, 0px);
  }
  .nav-item {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 3px;
    padding: 10px 4px 8px;
    cursor: pointer;
    transition: background 0.2s;
    border: none;
    background: transparent;
    color: var(--muted);
    -webkit-tap-highlight-color: transparent;
  }
  .nav-item.active { color: var(--gold-light); }
  .nav-item:active { background: rgba(181,146,42,0.15); }
  .nav-icon { font-size: 22px; line-height: 1; }
  .nav-label { font-size: 10px; font-family: 'Crimson Pro', serif; letter-spacing: 0.5px; }

  /* ── Main content ── */
  .main { 
    padding: 12px 12px 80px; 
    max-width: 600px;
    margin: 0 auto;
  }

  /* ── Tarjetas ── */
  .card {
    background: white;
    border-radius: var(--radius);
    box-shadow: 0 2px 12px var(--shadow);
    overflow: hidden;
    margin-bottom: 12px;
    border: 1px solid var(--border);
  }
  .card-header {
    background: var(--parchment);
    padding: 12px 16px;
    border-bottom: 1px solid var(--border);
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .card-title {
    font-family: 'Cinzel', serif;
    font-size: 14px;
    font-weight: 600;
    color: var(--red);
    flex: 1;
  }
  .card-body { padding: 16px; }

  /* ── Alumno item ── */
  .alumno-item {
    display: flex;
    align-items: center;
    padding: 12px 16px;
    border-bottom: 1px solid #f0e8d8;
    cursor: pointer;
    transition: background 0.15s;
    gap: 12px;
  }
  .alumno-item:last-child { border-bottom: none; }
  .alumno-item:active { background: #fdf5e8; }
  .alumno-avatar {
    width: 44px; height: 44px;
    border-radius: 50%;
    background: linear-gradient(135deg, var(--red) 0%, var(--gold) 100%);
    display: flex; align-items: center; justify-content: center;
    color: white;
    font-family: 'Cinzel', serif;
    font-size: 16px;
    font-weight: 700;
    flex-shrink: 0;
    box-shadow: 0 2px 8px rgba(139,26,26,0.3);
  }
  .alumno-info { flex: 1; min-width: 0; }
  .alumno-nombre {
    font-weight: 600;
    font-size: 15px;
    color: var(--ink);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .alumno-sub {
    font-size: 12px;
    color: var(--muted);
    margin-top: 2px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .alumno-meta { text-align: right; flex-shrink: 0; }
  .badge {
    display: inline-block;
    padding: 3px 8px;
    border-radius: 20px;
    font-size: 11px;
    font-weight: 600;
    font-family: 'Cinzel', serif;
  }
  .badge-activo { background: #e8f5e9; color: #2e7d32; }
  .badge-inactivo { background: #ffebee; color: #c62828; }
  .badge-red { background: #ffebee; color: var(--red); }
  .badge-gold { background: #fff8e1; color: #f57f17; }
  .badge-sage { background: #e8f5e9; color: var(--sage); }

  /* ── Búsqueda ── */
  .search-bar {
    display: flex;
    gap: 8px;
    margin-bottom: 12px;
    align-items: center;
  }
  .search-input-wrap {
    flex: 1;
    position: relative;
  }
  .search-icon {
    position: absolute;
    left: 12px; top: 50%;
    transform: translateY(-50%);
    font-size: 16px;
    color: var(--muted);
    pointer-events: none;
  }
  .search-input {
    width: 100%;
    padding: 10px 12px 10px 36px;
    border: 2px solid var(--border);
    border-radius: 24px;
    font-size: 15px;
    font-family: 'Crimson Pro', serif;
    background: white;
    color: var(--ink);
    outline: none;
    transition: border-color 0.2s;
  }
  .search-input:focus { border-color: var(--gold); }

  /* ── Filtros ── */
  .filters {
    display: flex;
    gap: 6px;
    overflow-x: auto;
    padding-bottom: 4px;
    margin-bottom: 12px;
    scrollbar-width: none;
  }
  .filters::-webkit-scrollbar { display: none; }
  .filter-chip {
    flex-shrink: 0;
    padding: 7px 14px;
    border-radius: 20px;
    border: 1.5px solid var(--border);
    background: white;
    font-size: 13px;
    font-family: 'Cinzel', serif;
    color: var(--muted);
    cursor: pointer;
    transition: all 0.2s;
    white-space: nowrap;
    -webkit-tap-highlight-color: transparent;
  }
  .filter-chip:active { transform: scale(0.95); }
  .filter-chip.active {
    background: var(--red);
    border-color: var(--red);
    color: white;
    box-shadow: 0 2px 8px rgba(139,26,26,0.3);
  }
  .filter-chip.activos-chip {
    background: #e8f5e9;
    border-color: var(--sage);
    color: var(--sage);
  }
  .filter-chip.activos-chip.active {
    background: var(--sage);
    color: white;
  }

  /* ── Botones ── */
  .btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    padding: 12px 20px;
    border-radius: var(--radius-sm);
    border: none;
    font-size: 14px;
    font-family: 'Cinzel', serif;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    -webkit-tap-highlight-color: transparent;
    white-space: nowrap;
    letter-spacing: 0.3px;
  }
  .btn:active { transform: scale(0.96); }
  .btn-primary {
    background: linear-gradient(135deg, var(--red) 0%, #a52020 100%);
    color: white;
    box-shadow: 0 3px 12px rgba(139,26,26,0.35);
  }
  .btn-secondary {
    background: linear-gradient(135deg, var(--gold) 0%, #9a7a20 100%);
    color: white;
    box-shadow: 0 3px 12px rgba(181,146,42,0.3);
  }
  .btn-outline {
    background: white;
    color: var(--red);
    border: 2px solid var(--red);
  }
  .btn-ghost {
    background: var(--parchment);
    color: var(--ink);
    border: 1px solid var(--border);
  }
  .btn-danger {
    background: #c0392b;
    color: white;
  }
  .btn-whatsapp {
    background: #25D366;
    color: white;
    box-shadow: 0 3px 12px rgba(37,211,102,0.3);
  }
  .btn-sage {
    background: var(--sage);
    color: white;
  }
  .btn-sm { padding: 8px 14px; font-size: 12px; }
  .btn-full { width: 100%; }
  .btn-icon { width: 44px; height: 44px; padding: 0; border-radius: 50%; font-size: 18px; }

  /* ── FAB ── */
  .fab {
    position: fixed;
    bottom: 80px;
    right: 20px;
    width: 56px; height: 56px;
    border-radius: 50%;
    background: linear-gradient(135deg, var(--red) 0%, #a52020 100%);
    color: white;
    border: none;
    font-size: 26px;
    display: flex; align-items: center; justify-content: center;
    box-shadow: 0 4px 20px rgba(139,26,26,0.5);
    cursor: pointer;
    z-index: 90;
    transition: transform 0.2s;
    -webkit-tap-highlight-color: transparent;
  }
  .fab:active { transform: scale(0.92); }

  /* ── Modal / Sheet ── */
  .modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.6);
    z-index: 200;
    display: flex;
    align-items: flex-end;
    justify-content: center;
    animation: fadeIn 0.2s;
  }
  .modal-sheet {
    background: var(--paper);
    width: 100%;
    max-width: 600px;
    max-height: 92vh;
    border-radius: 20px 20px 0 0;
    overflow-y: auto;
    overscroll-behavior: contain;
    animation: slideUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
    padding-bottom: env(safe-area-inset-bottom, 16px);
  }
  .modal-handle {
    width: 40px; height: 4px;
    background: var(--border);
    border-radius: 2px;
    margin: 12px auto 0;
  }
  .modal-header {
    padding: 16px 20px 12px;
    border-bottom: 1px solid var(--border);
    display: flex;
    align-items: center;
    gap: 12px;
    position: sticky;
    top: 0;
    background: var(--paper);
    z-index: 5;
  }
  .modal-title {
    font-family: 'Cinzel', serif;
    font-size: 16px;
    font-weight: 700;
    color: var(--red);
    flex: 1;
  }
  .modal-body { padding: 16px 20px; }
  .modal-footer {
    padding: 12px 20px;
    border-top: 1px solid var(--border);
    display: flex;
    gap: 10px;
    background: var(--paper);
    position: sticky;
    bottom: 0;
  }

  /* ── Formulario ── */
  .form-group {
    margin-bottom: 14px;
  }
  .form-label {
    display: block;
    font-size: 12px;
    font-family: 'Cinzel', serif;
    color: var(--muted);
    margin-bottom: 5px;
    letter-spacing: 0.5px;
    text-transform: uppercase;
  }
  .form-input, .form-select, .form-textarea {
    width: 100%;
    padding: 11px 14px;
    border: 2px solid var(--border);
    border-radius: var(--radius-sm);
    font-size: 15px;
    font-family: 'Crimson Pro', serif;
    background: white;
    color: var(--ink);
    outline: none;
    transition: border-color 0.2s;
    -webkit-appearance: none;
  }
  .form-input:focus, .form-select:focus, .form-textarea:focus {
    border-color: var(--gold);
  }
  .form-textarea { min-height: 80px; resize: none; }
  .form-row { display: flex; gap: 10px; }
  .form-row .form-group { flex: 1; }

  /* ── Disciplinas checkboxes ── */
  .disciplinas-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
  }
  .disc-check {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 12px;
    border: 2px solid var(--border);
    border-radius: var(--radius-sm);
    cursor: pointer;
    transition: all 0.2s;
    background: white;
    -webkit-tap-highlight-color: transparent;
  }
  .disc-check.checked {
    border-color: var(--red);
    background: #fff5f5;
  }
  .disc-check-box {
    width: 20px; height: 20px;
    border: 2px solid var(--border);
    border-radius: 4px;
    display: flex; align-items: center; justify-content: center;
    transition: all 0.2s;
    flex-shrink: 0;
  }
  .disc-check.checked .disc-check-box {
    background: var(--red);
    border-color: var(--red);
    color: white;
    font-size: 12px;
  }
  .disc-check-label { font-size: 13px; font-weight: 600; }

  /* ── Pago item ── */
  .pago-item {
    padding: 12px 16px;
    border-bottom: 1px solid #f0e8d8;
    display: flex;
    gap: 12px;
    cursor: pointer;
    transition: background 0.15s;
  }
  .pago-item:last-child { border-bottom: none; }
  .pago-item:active { background: #fdf5e8; }
  .pago-monto {
    font-family: 'Cinzel', serif;
    font-size: 18px;
    font-weight: 700;
    color: var(--sage);
    white-space: nowrap;
  }
  .pago-info { flex: 1; }
  .pago-fecha { font-size: 13px; color: var(--muted); }
  .pago-obs { font-size: 13px; color: var(--ink); margin-top: 2px; }
  .pago-deuda { font-size: 12px; color: var(--red); font-weight: 600; }

  /* ── Stats cards ── */
  .stats-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
    margin-bottom: 12px;
  }
  .stat-card {
    background: white;
    border-radius: var(--radius);
    padding: 14px;
    border: 1px solid var(--border);
    box-shadow: 0 2px 8px var(--shadow);
  }
  .stat-value {
    font-family: 'Cinzel', serif;
    font-size: 26px;
    font-weight: 700;
    color: var(--red);
    line-height: 1;
  }
  .stat-label {
    font-size: 12px;
    color: var(--muted);
    margin-top: 4px;
    font-style: italic;
  }

  /* ── Chart bars ── */
  .chart-container { padding: 8px 0; }
  .chart-bar-row {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 8px;
  }
  .chart-bar-label { font-size: 11px; color: var(--muted); width: 56px; text-align: right; flex-shrink: 0; }
  .chart-bar-track {
    flex: 1;
    height: 24px;
    background: #f5ede0;
    border-radius: 4px;
    overflow: hidden;
    position: relative;
  }
  .chart-bar-fill {
    height: 100%;
    border-radius: 4px;
    background: linear-gradient(90deg, var(--red) 0%, var(--gold) 100%);
    display: flex;
    align-items: center;
    justify-content: flex-end;
    padding-right: 6px;
    font-size: 11px;
    color: white;
    font-weight: 600;
    transition: width 0.8s cubic-bezier(0.34, 1.56, 0.64, 1);
    min-width: 4px;
  }

  /* ── Morosos ── */
  .moroso-item {
    padding: 12px 16px;
    border-bottom: 1px solid #f0e8d8;
    display: flex;
    gap: 12px;
    align-items: center;
  }
  .moroso-item:last-child { border-bottom: none; }
  .moroso-dias {
    background: #ffebee;
    border-radius: 8px;
    padding: 6px 10px;
    text-align: center;
    flex-shrink: 0;
  }
  .moroso-dias-num { font-family: 'Cinzel', serif; font-size: 20px; font-weight: 700; color: var(--red); }
  .moroso-dias-lbl { font-size: 10px; color: var(--muted); }
  .moroso-info { flex: 1; }
  .moroso-nombre { font-weight: 600; font-size: 15px; }
  .moroso-sub { font-size: 12px; color: var(--muted); margin-top: 2px; }

  /* ── Settings ── */
  .settings-row {
    padding: 14px 0;
    border-bottom: 1px solid var(--border);
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .settings-row:last-child { border-bottom: none; }
  .settings-icon { font-size: 20px; width: 36px; text-align: center; flex-shrink: 0; }
  .settings-info { flex: 1; }
  .settings-label { font-weight: 600; font-size: 14px; }
  .settings-desc { font-size: 12px; color: var(--muted); margin-top: 2px; }

  /* ── Animaciones ── */
  @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
  @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
  @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
  .spinning { animation: spin 0.8s linear infinite; display: inline-block; }

  /* ── Loading ── */
  .loading-center {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 40px;
    gap: 12px;
    color: var(--muted);
  }
  .empty-state {
    text-align: center;
    padding: 40px 20px;
    color: var(--muted);
    font-style: italic;
  }
  .empty-icon { font-size: 40px; margin-bottom: 12px; }

  /* ── Toast ── */
  .toast {
    position: fixed;
    bottom: 90px;
    left: 50%;
    transform: translateX(-50%);
    background: #1a0f00;
    color: var(--gold-light);
    padding: 10px 20px;
    border-radius: 24px;
    font-size: 14px;
    font-family: 'Crimson Pro', serif;
    z-index: 999;
    white-space: nowrap;
    box-shadow: 0 4px 20px rgba(0,0,0,0.3);
    animation: fadeIn 0.2s;
  }

  /* ── Decoración ── */
  .divider {
    display: flex;
    align-items: center;
    gap: 10px;
    margin: 12px 0;
    color: var(--border);
    font-size: 14px;
  }
  .divider::before, .divider::after {
    content: '';
    flex: 1;
    height: 1px;
    background: var(--border);
  }

  .section-title {
    font-family: 'Cinzel', serif;
    font-size: 12px;
    font-weight: 600;
    color: var(--muted);
    text-transform: uppercase;
    letter-spacing: 1.5px;
    margin: 16px 0 8px;
  }
  
  .pull-to-refresh {
    text-align: center;
    padding: 8px;
    font-size: 12px;
    color: var(--muted);
    font-style: italic;
  }
  
  .action-row {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    margin-bottom: 12px;
  }
  
  .long-press-hint {
    font-size: 11px;
    color: var(--muted);
    text-align: center;
    padding: 4px;
    font-style: italic;
  }

  .config-warning {
    background: #fff8e1;
    border: 2px solid var(--gold);
    border-radius: var(--radius);
    padding: 16px;
    margin-bottom: 16px;
  }
  .config-warning-title {
    font-family: 'Cinzel', serif;
    font-size: 14px;
    color: #f57f17;
    margin-bottom: 6px;
  }
  .config-warning-text { font-size: 13px; color: var(--ink); }
`;

// ─── Componente principal ─────────────────────────────────────────────────────
export default function NKTApp() {
  const [tab, setTab] = useState("alumnos");
  const [serverUrl, setServerUrl] = useState(localStorage.getItem("nkt_server_url") || "");
  const [alumnos, setAlumnos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [filterDisc, setFilterDisc] = useState(null);
  const [filterKwoon, setFilterKwoon] = useState(null);
  const [soloActivos, setSoloActivos] = useState(true);
  const [modal, setModal] = useState(null); // { type, data }
  const [toast, setToast] = useState(null);
  const [morosos, setMorosos] = useState([]);
  const [statsData, setStatsData] = useState(null);

  const showToast = (msg, duration = 2500) => {
    setToast(msg);
    setTimeout(() => setToast(null), duration);
  };

  const hasServer = !!serverUrl;

  // ── Cargar alumnos ──
  const loadAlumnos = useCallback(async () => {
    setLoading(true);
    try {
      if (!hasServer) { setAlumnos(DEMO_ALUMNOS); return; }
      const params = new URLSearchParams();
      if (soloActivos) params.set("activos", "1");
      if (filterDisc)  params.set("disciplina", filterDisc);
      if (filterKwoon) params.set("kwoon", filterKwoon);
      if (searchText)  params.set("search", searchText);
      const data = await apiCall("GET", `/alumnos?${params}`);
      setAlumnos(data);
    } catch (e) {
      showToast("❌ " + e.message);
      setAlumnos(DEMO_ALUMNOS);
    } finally {
      setLoading(false);
    }
  }, [soloActivos, filterDisc, filterKwoon, searchText, hasServer]);

  // ── Cargar pagos de un alumno ──
  const loadPagos = async (aluId) => {
    try {
      if (!hasServer) return DEMO_PAGOS.filter(p => p.alu_ID === aluId);
      return await apiCall("GET", `/pagos/${aluId}`);
    } catch {
      return DEMO_PAGOS.filter(p => p.alu_ID === aluId);
    }
  };

  // ── Morosos ──
  const loadMorosos = useCallback(async () => {
    setLoading(true);
    try {
      if (!hasServer) { setMorosos(DEMO_MOROSOS); return; }
      const data = await apiCall("GET", "/morosos");
      setMorosos(data);
    } catch (e) {
      showToast("❌ " + e.message);
      setMorosos(DEMO_MOROSOS);
    } finally {
      setLoading(false);
    }
  }, [hasServer]);

  // ── Stats ──
  const loadStats = useCallback(async () => {
    setLoading(true);
    try {
      if (!hasServer) { setStatsData(DEMO_STATS); return; }
      const data = await apiCall("GET", "/stats");
      setStatsData(data);
    } catch (e) {
      showToast("❌ " + e.message);
      setStatsData(DEMO_STATS);
    } finally {
      setLoading(false);
    }
  }, [hasServer]);

  useEffect(() => {
    if (tab === "alumnos") loadAlumnos();
    if (tab === "morosos") loadMorosos();
    if (tab === "stats") loadStats();
  }, [tab, loadAlumnos, loadMorosos, loadStats]);

  useEffect(() => {
    if (tab === "alumnos") loadAlumnos();
  }, [soloActivos, filterDisc, filterKwoon]);

  // ── Filtrar lista ──
  const alumnosFiltrados = alumnos.filter(a => {
    if (!searchText) return true;
    const s = searchText.toLowerCase();
    return (
      (a.apellido_alu || "").toLowerCase().includes(s) ||
      (a.nombre_alu || "").toLowerCase().includes(s) ||
      (a.disciplinas_alu || "").toLowerCase().includes(s) ||
      (a.kwoon_alu || "").toLowerCase().includes(s) ||
      String(a.alu_ID || "").includes(s)
    );
  });

  // ── Guardar alumno ──
  const guardarAlumno = async (data, isNew) => {
    try {
      setLoading(true);
      if (isNew) {
        // Obtener próximo ID
        const counter = await callMongo("findOneAndUpdate", "counters", {
          filter: { _id: "alumnos" },
          update: { $inc: { seq: 1 } },
          upsert: true,
          returnNewDocument: true,
        });
        const newId = counter.document?.seq || Date.now();
        await callMongo("insertOne", "alumnos", {
          document: { alu_ID: newId, ...data }
        });
        showToast("✅ Alumno agregado");
      } else {
        await callMongo("updateOne", "alumnos", {
          filter: { alu_ID: data.alu_ID },
          update: { $set: data }
        });
        showToast("✅ Alumno actualizado");
      }
      closeModal();
      await loadAlumnos();
    } catch (e) {
      showToast("❌ Error: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  // ── Eliminar alumno ──
  const eliminarAlumno = async (aluId, nombre) => {
    if (!confirm(`¿Eliminar a ${nombre}?`)) return;
    try {
      await callMongo("deleteOne", "alumnos", { filter: { alu_ID: aluId } });
      await callMongo("deleteMany", "pagos", { filter: { alu_ID: aluId } });
      showToast("🗑️ Alumno eliminado");
      await loadAlumnos();
    } catch (e) {
      showToast("❌ " + e.message);
    }
  };

  // ── Guardar pago ──
  const guardarPago = async (pagoData, isNew) => {
    try {
      if (isNew) {
        const counter = await callMongo("findOneAndUpdate", "counters", {
          filter: { _id: "pagos" },
          update: { $inc: { seq: 1 } },
          upsert: true,
          returnNewDocument: true,
        });
        const newId = counter.document?.seq || Date.now();
        await callMongo("insertOne", "pagos", {
          document: { pago_ID: newId, ...pagoData }
        });
        showToast("✅ Pago registrado");
      } else {
        await callMongo("updateOne", "pagos", {
          filter: { pago_ID: pagoData.pago_ID },
          update: { $set: pagoData }
        });
        showToast("✅ Pago actualizado");
      }
      // Refrescar pagos del alumno en el modal
      if (modal?.type === "pagos") {
        const ps = await loadPagos(modal.data.alu_ID);
        setModal(m => ({ ...m, pagos: ps }));
      }
    } catch (e) {
      showToast("❌ " + e.message);
    }
  };

  const openModal = (type, data = {}) => setModal({ type, data });
  const closeModal = () => setModal(null);

  // ── WhatsApp ──
  const sendWhatsApp = (phone, message) => {
    const encoded = encodeURIComponent(message);
    const url = `https://wa.me/${phone}?text=${encoded}`;
    window.open(url, "_blank");
  };

  const sendRecibo = (alumno, pago) => {
    const msg = `📜 *Escuela Tradicional* *"Nei Kung Tao"*
*Recibo del Pago: ${pago.pago_ID}*
*Apellido:* ${alumno.apellido_alu}
*Nombre:* ${alumno.nombre_alu}
*Disciplina/s:* ${alumno.disciplinas_alu || ""}
*Monto:* $${pago.monto_pago}.-
*Fecha:* ${formatFecha(pago.fecha_pago_alu)}
*Obs:* ${pago.observaciones || ""}
${pago.deuda_alu ? `*Deuda:* $${pago.deuda_alu}.-` : ""}
*¡Gracias por tu contribución!*`;
    sendWhatsApp(alumno.contacto_alu, msg);
  };

  // ──────────────────────────────────────────────────────────────────────────────
  // RENDERS
  // ──────────────────────────────────────────────────────────────────────────────

  const renderAlumnoItem = (a) => {
    const initials = `${(a.apellido_alu||"?")[0]}${(a.nombre_alu||"?")[0]}`.toUpperCase();
    const isActivo = String(a.estado_alu) === "1" || a.estado_alu === true;
    return (
      <div
        key={a.alu_ID}
        className="alumno-item"
        onClick={() => {
          loadPagos(a.alu_ID).then(ps => openModal("pagos", { ...a, pagos: ps }));
        }}
      >
        <div className="alumno-avatar">{initials}</div>
        <div className="alumno-info">
          <div className="alumno-nombre">{a.apellido_alu}, {a.nombre_alu}</div>
          <div className="alumno-sub">{a.disciplinas_alu || "Sin disciplina"} · {a.kwoon_alu || ""}</div>
        </div>
        <div className="alumno-meta">
          <span className={`badge ${isActivo ? "badge-activo" : "badge-inactivo"}`}>
            {isActivo ? "Activo" : "Inact."}
          </span>
          {a.mensualidad_alu && (
            <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 3 }}>
              ${parseInt(a.mensualidad_alu).toLocaleString("es-AR")}
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderAlumnos = () => (
    <>
      <div className="search-bar">
        <div className="search-input-wrap">
          <span className="search-icon">🔍</span>
          <input
            className="search-input"
            placeholder="Buscar alumno..."
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
          />
        </div>
        {searchText && (
          <button className="btn btn-ghost btn-sm" onClick={() => setSearchText("")}>✕</button>
        )}
      </div>

      <div className="filters">
        <button
          className={`filter-chip activos-chip ${soloActivos ? "active" : ""}`}
          onClick={() => setSoloActivos(s => !s)}
        >
          {soloActivos ? "✓ " : ""}Activos
        </button>
        <button className={`filter-chip ${!filterDisc && !filterKwoon ? "active" : ""}`}
          onClick={() => { setFilterDisc(null); setFilterKwoon(null); }}>
          Todos
        </button>
        <button className={`filter-chip ${filterDisc === "Bei Shaolín Chuen" && filterKwoon === "Mayores" ? "active" : ""}`}
          onClick={() => { setFilterDisc("Bei Shaolín Chuen"); setFilterKwoon("Mayores"); }}>
          Shaolín May.
        </button>
        <button className={`filter-chip ${filterDisc === "Bei Shaolín Chuen" && filterKwoon === "Menores" ? "active" : ""}`}
          onClick={() => { setFilterDisc("Bei Shaolín Chuen"); setFilterKwoon("Menores"); }}>
          Shaolín Men.
        </button>
        <button className={`filter-chip ${filterDisc === "Tai Chi Chuan" ? "active" : ""}`}
          onClick={() => { setFilterDisc("Tai Chi Chuan"); setFilterKwoon(null); }}>
          Tai Chi
        </button>
        <button className={`filter-chip ${filterDisc === "Wing Chun" ? "active" : ""}`}
          onClick={() => { setFilterDisc("Wing Chun"); setFilterKwoon(null); }}>
          Wing Chun
        </button>
        <button className={`filter-chip ${filterDisc === "Instructorado" ? "active" : ""}`}
          onClick={() => { setFilterDisc("Instructorado"); setFilterKwoon(null); }}>
          Instructorado
        </button>
      </div>

      {loading ? (
        <div className="loading-center">
          <span className="spinning" style={{ fontSize: 28 }}>⚙️</span>
          <span>Cargando alumnos...</span>
        </div>
      ) : alumnosFiltrados.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🥋</div>
          <div>No se encontraron alumnos</div>
        </div>
      ) : (
        <div className="card">
          <div className="card-header">
            <span className="card-title">Alumnos</span>
            <span className="badge badge-red">{alumnosFiltrados.length}</span>
          </div>
          <p className="long-press-hint">Toca un alumno para ver sus pagos</p>
          {alumnosFiltrados.map(renderAlumnoItem)}
        </div>
      )}

      <button className="fab" onClick={() => openModal("alumno_form", { isNew: true })}>+</button>
    </>
  );

  const renderMorosos = () => (
    <>
      <div className="action-row">
        <button className="btn btn-primary" onClick={loadMorosos}>
          🔄 Actualizar
        </button>
      </div>
      {loading ? (
        <div className="loading-center">
          <span className="spinning" style={{ fontSize: 28 }}>⚙️</span>
          <span>Buscando morosos...</span>
        </div>
      ) : morosos.length === 0 ? (
        <div className="card">
          <div className="card-body empty-state">
            <div className="empty-icon">✅</div>
            <div>Sin alumnos morosos</div>
          </div>
        </div>
      ) : (
        <div className="card">
          <div className="card-header">
            <span className="card-title">⚠️ Alumnos Morosos</span>
            <span className="badge badge-red">{morosos.length}</span>
          </div>
          {morosos.map((m, i) => (
            <div key={i} className="moroso-item">
              <div className="moroso-dias">
                <div className="moroso-dias-num">{m.dias_atraso}</div>
                <div className="moroso-dias-lbl">días</div>
              </div>
              <div className="moroso-info">
                <div className="moroso-nombre">{m.apellido_alu}, {m.nombre_alu}</div>
                <div className="moroso-sub">{m.disciplinas_alu} · Últ. pago: {m.ultimo_pago}</div>
              </div>
              {m.contacto_alu && (
                <button
                  className="btn btn-whatsapp btn-sm btn-icon"
                  onClick={() => sendWhatsApp(m.contacto_alu, `Hola ${m.nombre_alu}, te recordamos que tenés un pago pendiente en Nei Kung Tao de ${m.dias_atraso} días de atraso. ¡Gracias!`)}
                >
                  📱
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </>
  );

  const renderStats = () => (
    <>
      <div className="action-row">
        <button className="btn btn-primary" onClick={loadStats}>🔄 Actualizar</button>
      </div>
      {loading ? (
        <div className="loading-center">
          <span className="spinning" style={{ fontSize: 28 }}>⚙️</span>
        </div>
      ) : statsData ? (
        <>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-value" style={{ color: "var(--sage)" }}>{statsData.activos}</div>
              <div className="stat-label">Alumnos Activos</div>
            </div>
            <div className="stat-card">
              <div className="stat-value" style={{ color: "var(--muted)" }}>{statsData.inactivos}</div>
              <div className="stat-label">Inactivos</div>
            </div>
          </div>
          <div className="card">
            <div className="card-header">
              <span className="card-title">📊 Ingresos por Mes</span>
            </div>
            <div className="card-body">
              <div className="chart-container">
                {(() => {
                  const maxVal = Math.max(...statsData.meses.map(([, v]) => v), 1);
                  return statsData.meses.map(([mes, total]) => (
                    <div key={mes} className="chart-bar-row">
                      <div className="chart-bar-label">{mes}</div>
                      <div className="chart-bar-track">
                        <div
                          className="chart-bar-fill"
                          style={{ width: `${Math.max(4, (total / maxVal) * 100)}%` }}
                        >
                          {total > maxVal * 0.3 ? `$${(total / 1000).toFixed(0)}k` : ""}
                        </div>
                      </div>
                      <div style={{ width: 44, fontSize: 11, color: "var(--muted)", flexShrink: 0 }}>
                        ${(total / 1000).toFixed(0)}k
                      </div>
                    </div>
                  ));
                })()}
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="empty-state">Sin datos disponibles</div>
      )}
    </>
  );

  const renderAjustes = () => (
    <>
      {!serverUrl && (
        <div className="config-warning">
          <div className="config-warning-title">⚠️ Configuración requerida</div>
          <div className="config-warning-text">
            Ingresá la URL de tu servidor Railway para conectar con la base de datos. Los datos demo se muestran actualmente.
          </div>
        </div>
      )}
      <div className="card">
        <div className="card-header"><span className="card-title">🔌 Conexión al Servidor</span></div>
        <div className="card-body">
          <div className="form-group">
            <label className="form-label">URL del Servidor (Railway)</label>
            <input
              className="form-input"
              placeholder="https://nkt-server-production.up.railway.app"
              value={serverUrl}
              onChange={e => { setServerUrl(e.target.value); localStorage.setItem("nkt_server_url", e.target.value); }}
            />
          </div>
          <button
            className="btn btn-primary btn-full"
            onClick={async () => {
              showToast("🔄 Probando conexión...");
              try {
                const r = await apiCall("GET", "/");
                showToast("✅ Conectado: " + r.app);
                await loadAlumnos();
              } catch(e) {
                showToast("❌ No se pudo conectar");
              }
            }}
          >
            Guardar y Probar Conexión
          </button>
        </div>
      </div>
      <div className="card">
        <div className="card-header"><span className="card-title">ℹ️ Acerca de</span></div>
        <div className="card-body">
          <div className="settings-row">
            <div className="settings-icon">🥋</div>
            <div className="settings-info">
              <div className="settings-label">Nei Kung Tao</div>
              <div className="settings-desc">Sistema de Gestión de Alumnos v1.0</div>
            </div>
          </div>
          <div className="settings-row">
            <div className="settings-icon">🗃️</div>
            <div className="settings-info">
              <div className="settings-label">Base de datos</div>
              <div className="settings-desc">{DB_NAME} · MongoDB Atlas</div>
            </div>
          </div>
          <div className="settings-row">
            <div className="settings-icon">📱</div>
            <div className="settings-info">
              <div className="settings-label">Modo</div>
              <div className="settings-desc">Aplicación Web Progresiva (PWA) · Android optimizado</div>
            </div>
          </div>
        </div>
      </div>
    </>
  );

  // ── Modal Pagos ──
  const ModalPagos = ({ alumno }) => {
    const [ps, setPs] = useState(alumno.pagos || []);
    const [showAddPago, setShowAddPago] = useState(false);
    const [editPago, setEditPago] = useState(null);
    const [loadingPagos, setLoadingPagos] = useState(false);

    const refreshPagos = async () => {
      setLoadingPagos(true);
      const data = await loadPagos(alumno.alu_ID);
      setPs(data);
      setLoadingPagos(false);
    };

    const borrarPago = async (pagoId) => {
      if (!confirm("¿Borrar este pago?")) return;
      try {
        await callMongo("deleteOne", "pagos", { filter: { pago_ID: pagoId } });
        showToast("🗑️ Pago borrado");
        await refreshPagos();
      } catch (e) { showToast("❌ " + e.message); }
    };

    if (showAddPago || editPago) {
      return (
        <ModalPagoForm
          alumno={alumno}
          pago={editPago}
          onSave={async (data) => {
            await guardarPago(data, !editPago);
            setShowAddPago(false);
            setEditPago(null);
            await refreshPagos();
          }}
          onCancel={() => { setShowAddPago(false); setEditPago(null); }}
        />
      );
    }

    return (
      <>
        <div className="modal-handle" />
        <div className="modal-header">
          <div>
            <div className="modal-title">{alumno.apellido_alu}, {alumno.nombre_alu}</div>
            <div style={{ fontSize: 12, color: "var(--muted)" }}>{alumno.disciplinas_alu} · {alumno.kwoon_alu}</div>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={closeModal}>✕</button>
        </div>
        <div className="modal-body">
          <div className="action-row">
            <button
              className="btn btn-primary btn-sm"
              onClick={() => openModal("alumno_form", { ...alumno, isNew: false })}
            >✏️ Editar</button>
            <button
              className="btn btn-danger btn-sm"
              onClick={() => eliminarAlumno(alumno.alu_ID, alumno.nombre_alu)}
            >🗑️ Eliminar</button>
            {alumno.contacto_alu && (
              <button
                className="btn btn-whatsapp btn-sm"
                onClick={() => sendWhatsApp(alumno.contacto_alu,
                  `Hola ${alumno.nombre_alu}, te escribimos desde Nei Kung Tao.`)}
              >📱 WA</button>
            )}
          </div>

          <p className="section-title">Historial de pagos</p>
          {loadingPagos ? (
            <div className="loading-center"><span className="spinning">⚙️</span></div>
          ) : ps.length === 0 ? (
            <div className="empty-state"><div className="empty-icon">💰</div><div>Sin pagos registrados</div></div>
          ) : (
            <div className="card">
              {ps.map(p => (
                <div key={p.pago_ID} className="pago-item" onClick={() => setEditPago(p)}>
                  <div>
                    <div className="pago-monto">${parseInt(p.monto_pago || 0).toLocaleString("es-AR")}</div>
                    {p.deuda_alu && parseInt(p.deuda_alu) > 0 && (
                      <div className="pago-deuda">Deuda: ${p.deuda_alu}</div>
                    )}
                  </div>
                  <div className="pago-info">
                    <div className="pago-fecha">📅 {formatFecha(p.fecha_pago_alu)}</div>
                    {p.observaciones && <div className="pago-obs">{p.observaciones}</div>}
                  </div>
                  <button
                    className="btn btn-whatsapp btn-icon btn-sm"
                    onClick={e => { e.stopPropagation(); sendRecibo(alumno, p); }}
                    style={{ width: 36, height: 36, fontSize: 14 }}
                  >📱</button>
                  <button
                    className="btn btn-danger btn-icon btn-sm"
                    onClick={e => { e.stopPropagation(); borrarPago(p.pago_ID); }}
                    style={{ width: 36, height: 36, fontSize: 14 }}
                  >🗑️</button>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="modal-footer">
          <button className="btn btn-primary btn-full" onClick={() => setShowAddPago(true)}>
            + Registrar Pago
          </button>
        </div>
      </>
    );
  };

  // ── Modal Form Pago ──
  const ModalPagoForm = ({ alumno, pago, onSave, onCancel }) => {
    const [monto, setMonto] = useState(String(pago?.monto_pago || alumno.mensualidad_alu || ""));
    const [fecha, setFecha] = useState(pago ? String(pago.fecha_pago_alu || "").split(" ")[0] : new Date().toISOString().split("T")[0]);
    const [obs, setObs] = useState(pago?.observaciones || "");
    const [deuda, setDeuda] = useState(String(pago?.deuda_alu || "0"));
    const [saving, setSaving] = useState(false);

    const save = async () => {
      if (!monto) { showToast("⚠️ El monto es obligatorio"); return; }
      setSaving(true);
      await onSave({
        ...(pago ? { pago_ID: pago.pago_ID } : {}),
        alu_ID: alumno.alu_ID,
        monto_pago: monto,
        fecha_pago_alu: fecha + " 00:00:00",
        observaciones: obs,
        deuda_alu: deuda,
      });
      setSaving(false);
    };

    return (
      <>
        <div className="modal-handle" />
        <div className="modal-header">
          <div className="modal-title">{pago ? "Editar Pago" : "Nuevo Pago"}</div>
          <button className="btn btn-ghost btn-sm" onClick={onCancel}>✕</button>
        </div>
        <div className="modal-body">
          <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 12 }}>
            {alumno.apellido_alu}, {alumno.nombre_alu}
          </p>
          <div className="form-group">
            <label className="form-label">Monto ($)</label>
            <input className="form-input" type="number" inputMode="numeric" value={monto} onChange={e => setMonto(e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Fecha</label>
            <input className="form-input" type="date" value={fecha} onChange={e => setFecha(e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Observaciones</label>
            <textarea className="form-textarea" value={obs} onChange={e => setObs(e.target.value)} placeholder="Observaciones del pago..." />
          </div>
          <div className="form-group">
            <label className="form-label">Deuda ($)</label>
            <input className="form-input" type="number" inputMode="numeric" value={deuda} onChange={e => setDeuda(e.target.value)} />
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost" style={{ flex: 1 }} onClick={onCancel}>Cancelar</button>
          <button className="btn btn-primary" style={{ flex: 2 }} onClick={save} disabled={saving}>
            {saving ? <span className="spinning">⚙️</span> : "💾 Guardar"}
          </button>
        </div>
      </>
    );
  };

  // ── Modal Alumno Form ──
  const ModalAlumnoForm = ({ alumnoData }) => {
    const isNew = alumnoData.isNew;
    const [apellido, setApellido] = useState(alumnoData.apellido_alu || "");
    const [nombre, setNombre] = useState(alumnoData.nombre_alu || "");
    const [ingreso, setIngreso] = useState(
      String(alumnoData.ingreso_alu || "").split(" ")[0] || new Date().toISOString().split("T")[0]
    );
    const [fecNac, setFecNac] = useState(
      String(alumnoData.fec_nac_alu || "1900-01-01").split(" ")[0]
    );
    const [doc, setDoc] = useState(alumnoData.doc_alu ? formatDocumento(alumnoData.doc_alu) : "");
    const [contacto, setContacto] = useState(alumnoData.contacto_alu || "");
    const [domicilio, setDomicilio] = useState(alumnoData.domicilio_alu || "");
    const [mensualidad, setMensualidad] = useState(String(alumnoData.mensualidad_alu || "25000"));
    const [deuda, setDeuda] = useState(String(alumnoData.deuda_alu || "0"));
    const [estado, setEstado] = useState(
      String(alumnoData.estado_alu) === "1" || alumnoData.estado_alu === true ? "1" : "0"
    );
    const [kwoon, setKwoon] = useState(alumnoData.kwoon_alu || "Central Mayores");
    const [discs, setDiscs] = useState({
      shaolin: (alumnoData.disciplinas_alu || "").includes("Bei Shaolín"),
      wingchun: (alumnoData.disciplinas_alu || "").includes("Wing Chun"),
      taichi: (alumnoData.disciplinas_alu || "").includes("Tai Chi"),
      instructorado: (alumnoData.disciplinas_alu || "").includes("Instructorado"),
    });
    const [saving, setSaving] = useState(false);

    const calcEdad = () => {
      if (!fecNac || fecNac === "1900-01-01") return "";
      const hoy = new Date();
      const nac = new Date(fecNac);
      let edad = hoy.getFullYear() - nac.getFullYear();
      if (hoy < new Date(hoy.getFullYear(), nac.getMonth(), nac.getDate())) edad--;
      return edad + " años";
    };

    const toggleDisc = (key) => setDiscs(d => ({ ...d, [key]: !d[key] }));

    const save = async () => {
      if (!apellido || !nombre) { showToast("⚠️ Nombre y apellido obligatorios"); return; }
      setSaving(true);
      const disciplinasStr = [
        discs.shaolin && "Bei Shaolín Chuen",
        discs.wingchun && "Wing Chun",
        discs.taichi && "Tai Chi Chuan",
        discs.instructorado && "Instructorado",
      ].filter(Boolean).join("/");
      const docClean = doc.replace(/\./g, "").trim();
      const data = {
        ...(isNew ? {} : { alu_ID: alumnoData.alu_ID }),
        apellido_alu: apellido, nombre_alu: nombre,
        ingreso_alu: ingreso, fec_nac_alu: fecNac,
        doc_alu: docClean, contacto_alu: contacto,
        domicilio_alu: domicilio, disciplinas_alu: disciplinasStr,
        kwoon_alu: kwoon, mensualidad_alu: mensualidad,
        deuda_alu: deuda, estado_alu: parseInt(estado),
      };
      await guardarAlumno(data, isNew);
      setSaving(false);
    };

    const KWOONS = ["Central Mayores", "Central Menores", "OnLine", "Central Mayores (SH)", "Centro Comercial (Menores)", "SAN ESTEBAN (Menores)", "Otra"];
    const DISC_ITEMS = [
      { key: "shaolin", label: "Bei Shaolín" },
      { key: "wingchun", label: "Wing Chun" },
      { key: "taichi", label: "Tai Chi Chuan" },
      { key: "instructorado", label: "Instructorado" },
    ];

    return (
      <>
        <div className="modal-handle" />
        <div className="modal-header">
          <div className="modal-title">{isNew ? "Nuevo Alumno" : "Editar Alumno"}</div>
          <button className="btn btn-ghost btn-sm" onClick={closeModal}>✕</button>
        </div>
        <div className="modal-body">
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Apellido *</label>
              <input className="form-input" value={apellido} onChange={e => setApellido(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Nombre *</label>
              <input className="form-input" value={nombre} onChange={e => setNombre(e.target.value)} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Fecha Ingreso</label>
              <input className="form-input" type="date" value={ingreso} onChange={e => setIngreso(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Fecha Nac.</label>
              <input className="form-input" type="date" value={fecNac} onChange={e => setFecNac(e.target.value)} />
            </div>
          </div>
          {calcEdad() && <div style={{ fontSize: 13, color: "var(--muted)", marginBottom: 10, marginTop: -8 }}>Edad: {calcEdad()}</div>}
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Documento</label>
              <input className="form-input" inputMode="numeric" value={doc} onChange={e => setDoc(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Contacto (tel.)</label>
              <input className="form-input" type="tel" inputMode="tel" value={contacto} onChange={e => setContacto(e.target.value)} />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Domicilio</label>
            <input className="form-input" value={domicilio} onChange={e => setDomicilio(e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Disciplinas</label>
            <div className="disciplinas-grid">
              {DISC_ITEMS.map(({ key, label }) => (
                <div
                  key={key}
                  className={`disc-check ${discs[key] ? "checked" : ""}`}
                  onClick={() => toggleDisc(key)}
                >
                  <div className="disc-check-box">{discs[key] ? "✓" : ""}</div>
                  <span className="disc-check-label">{label}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Kwoon</label>
            <select className="form-select" value={kwoon} onChange={e => setKwoon(e.target.value)}>
              {KWOONS.map(k => <option key={k} value={k}>{k}</option>)}
            </select>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Mensualidad ($)</label>
              <input className="form-input" type="number" inputMode="numeric" value={mensualidad} onChange={e => setMensualidad(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Deuda ($)</label>
              <input className="form-input" type="number" inputMode="numeric" value={deuda} onChange={e => setDeuda(e.target.value)} />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Estado</label>
            <select className="form-select" value={estado} onChange={e => setEstado(e.target.value)}>
              <option value="1">Activo</option>
              <option value="0">Inactivo</option>
            </select>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost" style={{ flex: 1 }} onClick={closeModal}>Cancelar</button>
          <button className="btn btn-primary" style={{ flex: 2 }} onClick={save} disabled={saving}>
            {saving ? <span className="spinning">⚙️</span> : "💾 Guardar"}
          </button>
        </div>
      </>
    );
  };

  const NAV_ITEMS = [
    { id: "alumnos", icon: "🥋", label: "Alumnos" },
    { id: "morosos", icon: "⚠️", label: "Morosos" },
    { id: "stats", icon: "📊", label: "Estadísticas" },
    { id: "ajustes", icon: "⚙️", label: "Ajustes" },
  ];

  return (
    <>
      <style>{css}</style>
      <div className="app-header">
        <div style={{ flex: 1 }}>
          <div className="logo">Nei Kung Tao</div>
          <div className="subtitle">Sistema de Gestión</div>
        </div>
        <div className="header-badge">NKT</div>
      </div>

      <div className="main">
        {tab === "alumnos" && renderAlumnos()}
        {tab === "morosos" && renderMorosos()}
        {tab === "stats" && renderStats()}
        {tab === "ajustes" && renderAjustes()}
      </div>

      <nav className="bottom-nav">
        {NAV_ITEMS.map(({ id, icon, label }) => (
          <button
            key={id}
            className={`nav-item ${tab === id ? "active" : ""}`}
            onClick={() => setTab(id)}
          >
            <span className="nav-icon">{icon}</span>
            <span className="nav-label">{label}</span>
          </button>
        ))}
      </nav>

      {modal && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) closeModal(); }}>
          <div className="modal-sheet" onClick={e => e.stopPropagation()}>
            {modal.type === "pagos" && <ModalPagos alumno={modal.data} />}
            {modal.type === "alumno_form" && <ModalAlumnoForm alumnoData={modal.data} />}
          </div>
        </div>
      )}

      {toast && <div className="toast">{toast}</div>}
    </>
  );
}

// ─── Datos demo (cuando no hay API configurada) ───────────────────────────────
const DEMO_ALUMNOS = [
  { alu_ID: 1, apellido_alu: "García", nombre_alu: "Martín", estado_alu: 1, ingreso_alu: "2022-03-15", disciplinas_alu: "Bei Shaolín Chuen", kwoon_alu: "Central Mayores", mensualidad_alu: 25000 },
  { alu_ID: 2, apellido_alu: "López", nombre_alu: "Ana", estado_alu: 1, ingreso_alu: "2021-08-01", disciplinas_alu: "Tai Chi Chuan", kwoon_alu: "Central Mayores", mensualidad_alu: 22000 },
  { alu_ID: 3, apellido_alu: "Martínez", nombre_alu: "Lucas", estado_alu: 1, ingreso_alu: "2023-01-10", disciplinas_alu: "Wing Chun", kwoon_alu: "OnLine", mensualidad_alu: 20000 },
  { alu_ID: 4, apellido_alu: "Rodríguez", nombre_alu: "Sofía", estado_alu: 0, ingreso_alu: "2020-05-20", disciplinas_alu: "Bei Shaolín Chuen/Instructorado", kwoon_alu: "Central Mayores (SH)", mensualidad_alu: 30000 },
  { alu_ID: 5, apellido_alu: "Sánchez", nombre_alu: "Diego", estado_alu: 1, ingreso_alu: "2022-11-03", disciplinas_alu: "Bei Shaolín Chuen", kwoon_alu: "Central Menores", mensualidad_alu: 18000 },
  { alu_ID: 6, apellido_alu: "Torres", nombre_alu: "Valentina", estado_alu: 1, ingreso_alu: "2023-04-17", disciplinas_alu: "Tai Chi Chuan", kwoon_alu: "Central Mayores", mensualidad_alu: 22000, contacto_alu: "5491123456789" },
];

const DEMO_PAGOS = [
  { pago_ID: 101, alu_ID: 1, monto_pago: 25000, fecha_pago_alu: "2024-03-01 00:00:00", observaciones: "Marzo", deuda_alu: 0 },
  { pago_ID: 102, alu_ID: 1, monto_pago: 25000, fecha_pago_alu: "2024-02-01 00:00:00", observaciones: "Febrero", deuda_alu: 0 },
  { pago_ID: 103, alu_ID: 2, monto_pago: 22000, fecha_pago_alu: "2024-03-05 00:00:00", observaciones: "", deuda_alu: 0 },
];

const DEMO_MOROSOS = [
  { alu_ID: 3, apellido_alu: "Martínez", nombre_alu: "Lucas", disciplinas_alu: "Wing Chun", ultimo_pago: "15/01/2024", dias_atraso: 45, contacto_alu: "5491187654321" },
  { alu_ID: 5, apellido_alu: "Sánchez", nombre_alu: "Diego", disciplinas_alu: "Bei Shaolín Chuen", ultimo_pago: "20/12/2023", dias_atraso: 72, contacto_alu: "" },
];

const DEMO_STATS = {
  activos: 5, inactivos: 1,
  meses: [["10/2023", 95000], ["11/2023", 102000], ["12/2023", 88000], ["01/2024", 110000], ["02/2024", 98000], ["03/2024", 115000]],
};
