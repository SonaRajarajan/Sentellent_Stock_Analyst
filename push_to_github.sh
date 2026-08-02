#!/bin/bash

echo "=========================================================="
echo "🐙 Pushing Sentellent Stock Analyst to your GitHub Account"
echo "=========================================================="

REPO_NAME=${1:-"Sentellent_Stock_Analyst"}

if [ -z "$GITHUB_URL" ]; then
  GITHUB_URL="https://github.com/sonavrajarajan/$REPO_NAME.git"
fi

echo "Setting remote origin to $GITHUB_URL..."
git remote remove origin 2>/dev/null
git remote add origin "$GITHUB_URL"

echo "Pushing code to main branch..."
git push -u origin main

if [ $? -eq 0 ]; then
  echo "✅ Successfully pushed your project to GitHub at $GITHUB_URL!"
else
  echo "⚠️ If repository does not exist on GitHub yet, please create a new empty repository named '$REPO_NAME' at https://github.com/new and re-run this script!"
fi
