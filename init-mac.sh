#!/usr/bin/env bash
set -e

# ─────────────────────────────────────────────
#  StockIQ — macOS / Linux setup
#  Usage: bash init-mac.sh
# ─────────────────────────────────────────────

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BOLD='\033[1m'
NC='\033[0m'

info()    { echo -e "${GREEN}[init]${NC} $1"; }
warning() { echo -e "${YELLOW}[warn]${NC} $1"; }
error()   { echo -e "${RED}[error]${NC} $1"; exit 1; }
header()  { echo -e "\n${BOLD}$1${NC}"; }

header "── StockIQ Dev Setup (macOS / Linux) ──"

# ── prerequisite checks ──────────────────────

header "Checking prerequisites..."

command -v python3 &>/dev/null \
  || error "Python 3 not found. Install it via 'brew install python' or https://python.org and re-run."

command -v node &>/dev/null \
  || error "Node.js not found. Install it via 'brew install node' or https://nodejs.org and re-run."

command -v npm &>/dev/null \
  || error "npm not found. It ships with Node — check your Node installation."

info "Python : $(python3 --version)"
info "Node   : $(node --version)"
info "npm    : $(npm --version)"

# ── backend ──────────────────────────────────

header "Setting up backend..."

cd backend

if [ ! -d "venv" ]; then
  info "Creating virtual environment..."
  python3 -m venv venv
else
  info "Virtual environment already exists, skipping creation."
fi

source venv/bin/activate

info "Installing Python dependencies..."
pip3 install -r requirements.txt --quiet

if [ ! -f ".env" ]; then
  cp .env.example .env
  warning "backend/.env created — open it and fill in:"
  warning "  DB_PASSWORD        (ask Lance)"
  warning "  NEWSDATA_API_KEY   (newsdata.io dashboard)"
  warning "  GOOGLE_CLIENT_ID   (Google Cloud Console)"
else
  info "backend/.env already exists, skipping."
fi

deactivate
cd ..

# ── frontend ─────────────────────────────────

header "Setting up frontend..."

cd frontend

info "Installing Node dependencies..."
npm install

if [ ! -f ".env" ]; then
  cp .env.example .env
  warning "frontend/.env created — open it and fill in:"
  warning "  VITE_GOOGLE_CLIENT_ID   (same as GOOGLE_CLIENT_ID above)"
else
  info "frontend/.env already exists, skipping."
fi

cd ..

# ── done ─────────────────────────────────────

echo ""
echo -e "${GREEN}${BOLD}All done! Here's how to run the app:${NC}"
echo ""
echo -e "  ${BOLD}Terminal 1 — Backend:${NC}"
echo "    cd backend"
echo "    source venv/bin/activate"
echo "    python3 app.py"
echo ""
echo -e "  ${BOLD}Terminal 2 — Frontend:${NC}"
echo "    cd frontend"
echo "    npm run dev"
echo ""
echo -e "  Then open ${GREEN}http://localhost:5173${NC} in your browser."
echo ""
