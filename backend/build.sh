#!/usr/bin/env bash
# Render build script — installs Node.js + Python dependencies
set -e

echo "=== AMARAN Backend Build ==="

echo "Installing Node.js dependencies..."
npm install --production

echo "Installing Python dependencies..."
pip install --upgrade pip
pip install -r requirements.txt

# Create required directories
mkdir -p uploads output

echo "Verifying Python packages..."
python3 -c "import librosa, scipy, soundfile, matplotlib, numpy; print('All Python packages OK')"

echo "=== Build complete! ==="
