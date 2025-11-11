#!/bin/bash

# Complete script to create GitHub repo and push code
# This will authenticate and create the repository

set -e

echo "🚀 Setting up Warranty Manager on GitHub..."
echo ""

# Check if gh is authenticated
if ! gh auth status >/dev/null 2>&1; then
    echo "⚠️  GitHub CLI authentication required"
    echo "Please run: gh auth login"
    echo "Then run this script again"
    exit 1
fi

REPO_NAME="warranty-manager"
DESCRIPTION="Warranty Manager - Mobile app for managing product warranties with React Native frontend and Node.js backend"

echo "📦 Creating repository: $REPO_NAME"
echo "📝 Description: $DESCRIPTION"
echo ""

# Create repository
gh repo create "$REPO_NAME" \
    --public \
    --description "$DESCRIPTION" \
    --source=. \
    --remote=origin \
    --push

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Successfully created and pushed to GitHub!"
    echo "🔗 Repository URL: $(gh repo view --web)"
else
    echo ""
    echo "❌ Failed to create repository"
    echo "Please check your GitHub authentication: gh auth status"
    exit 1
fi

