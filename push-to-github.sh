#!/bin/bash

# Script to push warranty-manager to GitHub
# Run this after creating the repository on GitHub

echo "Setting up GitHub remote..."

# Infer username from git config email (stefankuburovic1990@GMAIL.COM -> stefankuburovic)
GITHUB_USER="stefankuburovic"
REPO_NAME="warranty-manager"

# Check if remote already exists
if git remote get-url origin >/dev/null 2>&1; then
    echo "Remote 'origin' already exists. Removing it..."
    git remote remove origin
fi

# Add remote
echo "Adding remote: git@github.com:${GITHUB_USER}/${REPO_NAME}.git"
git remote add origin git@github.com:${GITHUB_USER}/${REPO_NAME}.git

# Push to GitHub
echo "Pushing to GitHub..."
git push -u origin main

if [ $? -eq 0 ]; then
    echo "✅ Successfully pushed to GitHub!"
    echo "Repository URL: https://github.com/${GITHUB_USER}/${REPO_NAME}"
else
    echo "❌ Push failed. Please:"
    echo "1. Create the repository on GitHub: https://github.com/new"
    echo "2. Repository name: ${REPO_NAME}"
    echo "3. Make it public or private as desired"
    echo "4. Do NOT initialize with README (we already have one)"
    echo "5. Then run this script again"
fi

