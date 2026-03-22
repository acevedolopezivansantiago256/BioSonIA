#!/usr/bin/env bash
set -euo pipefail

git init
git checkout -b main || git branch -M main
git add .
git commit -m "Initial commit – BioSonIA monorepo"

git checkout -b develop
git merge --no-edit main || true

git checkout -b stage
git merge --no-edit develop || true

echo "Agrega remoto con: git remote add origin <REPO_URL_PLACEHOLDER>"
echo "Luego push: git push -u origin main && git push -u origin develop && git push -u origin stage"