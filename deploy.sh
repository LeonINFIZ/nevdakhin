#!/bin/bash
# Deployment script for nevdakhin on server 185.225.35.73
set -e

echo "=== Deploying nevdakhin ==="
git pull origin main
npm install --omit=dev
npm run build
pm2 restart ecosystem.config.js || pm2 start ecosystem.config.js
pm2 save
echo "=== Deployment complete! ==="
