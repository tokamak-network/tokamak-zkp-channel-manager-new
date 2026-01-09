#!/bin/bash

# Setup git submodules
# This script initializes and updates git submodules
# If submodule doesn't exist, it will be added automatically

set -e

echo "Setting up git submodules..."

# Check if we're in a git repository
if [ ! -d .git ]; then
  echo "Not in a git repository. Skipping submodule setup."
  exit 0
fi

# Define submodule configuration
SUBMODULE_PATH="Tokamak-Zk-EVM"
SUBMODULE_URL="https://github.com/tokamak-network/Tokamak-zk-EVM.git"
SUBMODULE_BRANCH="dev"

# Check if submodule directory exists
if [ ! -d "$SUBMODULE_PATH" ] || [ -z "$(ls -A $SUBMODULE_PATH 2>/dev/null)" ]; then
  echo "Submodule $SUBMODULE_PATH not found. Adding it..."
  
  # Check if .gitmodules exists and contains this submodule
  if [ -f .gitmodules ] && grep -q "\[submodule \"$SUBMODULE_PATH\"\]" .gitmodules; then
    echo "Submodule entry found in .gitmodules. Initializing..."
    git submodule update --init --recursive "$SUBMODULE_PATH"
  else
    echo "Adding submodule $SUBMODULE_PATH from $SUBMODULE_URL (branch: $SUBMODULE_BRANCH)..."
    git submodule add -b "$SUBMODULE_BRANCH" "$SUBMODULE_URL" "$SUBMODULE_PATH"
  fi
else
  echo "Submodule $SUBMODULE_PATH already exists. Updating..."
  git submodule update --init --recursive "$SUBMODULE_PATH"
fi

echo "Git submodules setup complete!"
