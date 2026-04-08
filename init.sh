#!/usr/bin/env bash
set -e

# ─────────────────────────────────────────────
#  StockIQ — one-shot dev environment setup
#  Run once after cloning: bash init.sh
# ─────────────────────────────────────────────

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

info()    { echo -e "${GREEN}[init]${NC} $1"; }
warning() { echo -e "${YELLOW}[warn]${NC} $1"; }
error()   { echo -e "${RED}[error]${NC} $1"; exit 1; }

# ── prerequisite checks ──────────────────────

command -v python3 &>/dev/null || command -v python &>/dev/null \
  || error "Python not found. Install Python 3.10+ and re-run."

command -v node &>/dev/null \
  || error "Node.js not found. Install Node 18+ and re-run."

command -v npm &>/dev/null \
  || error "npm not found. It should come with Node — check your install."

PYTHON=$(command -v python3 || command -v python)
info "Using Python: $($PYTHON --version)"
info "Using Node:   $(node --version)"

# ── backend setup ────────────────────────────

info "Setting up backend..."

cd backend

# create venv if it doesn't exist
if [ ! -d "venv" ]; then
  info "Creating Python virtual environment..."
  $PYTHON -m venv venv
fi

# activate venv (works on both Unix and Git Bash on Windows)
if [ -f "venv/Scripts/activate" ]; then
  source venv/Scripts/activate      # Windows Git Bash
elif [ -f "venv/bin/activate" ]; then
  source venv/bin/activate          # Mac / Linux
else
  error "Could not find venv activation script."
fi

info "Installing backend dependencies..."
pip install -r requirements.txt --quiet

# copy .env if missing
if [ ! -f ".env" ]; then
  cp .env.example .env
  warning "backend/.env created from .env.example — fill in DB_PASSWORD, NEWSDATA_API_KEY, and GOOGLE_CLIENT_ID before starting the server."
else
  info "backend/.env already exists, skipping."
fi

deactivate
cd ..

# ── frontend setup ───────────────────────────

info "Setting up frontend..."

cd frontend

info "Installing frontend dependencies..."
npm install --silent

# copy .env if missing
if [ ! -f ".env" ]; then
  cp .env.example .env
  warning "frontend/.env created from .env.example — fill in VITE_GOOGLE_CLIENT_ID before starting the dev server."
else
  info "frontend/.env already exists, skipping."
fi

cd ..

# ── done ─────────────────────────────────────

echo ""
echo -e "${GREEN}Setup complete.${NC} Next steps:"
echo ""
echo "  1. Fill in credentials in backend/.env"
echo "       DB_PASSWORD        — ask Lance"
echo "       NEWSDATA_API_KEY   — newsdata.io dashboard"
echo "       GOOGLE_CLIENT_ID   — Google Cloud Console"
echo ""
echo "  2. Fill in credentials in frontend/.env"
echo "       VITE_GOOGLE_CLIENT_ID — same as above"
echo ""
echo "  3. Start the backend:"
echo "       cd backend"
echo "       source venv/bin/activate   # Mac/Linux"
echo "       source venv/Scripts/activate # Windows Git Bash"
echo "       python app.py"
echo ""
echo "  4. Start the frontend (new terminal):"
echo "       cd frontend"
echo "       npm run dev"
echo ""
