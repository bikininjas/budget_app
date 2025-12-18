#!/bin/bash

# 🛠️ Setup pre-commit hooks for backend and frontend
# This script installs pre-commit and sets up the hooks

echo "🛠️ Setting up pre-commit hooks..."
echo "================================"

# Check if pre-commit is installed
if ! command -v pre-commit &> /dev/null; then
    echo "⚠️  pre-commit not found. Installing..."
    pip install pre-commit
else
    echo "✅ pre-commit is already installed"
fi

# Install the pre-commit hooks
cd /home/seb/GITRepos/budget_app/backend
pre-commit install

# Install the pre-commit hooks for the repository
pre-commit install --install-hooks

# Run pre-commit on all files to ensure they pass
pre-commit run --all-files

if [ $? -eq 0 ]; then
    echo ""
    echo "🎉 Pre-commit hooks setup successfully!"
    echo ""
    echo "✅ Backend hooks installed:"
    echo "   - ruff (check --fix)"
    echo "   - ruff-format"
    echo ""
    echo "✅ Frontend hooks installed:"
    echo "   - bun lint"
    echo "   - bun run type-check"
    echo ""
    echo "📝 These hooks will run automatically on:"
    echo "   - git commit"
    echo "   - git push"
    echo ""
    echo "💡 To manually run hooks:"
    echo "   pre-commit run --all-files"
else
    echo ""
    echo "⚠️  Some files failed the pre-commit checks"
    echo "   The issues have been automatically fixed where possible"
    echo "   Please review the changes and commit again"
fi