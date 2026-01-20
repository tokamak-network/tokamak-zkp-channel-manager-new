#!/bin/bash

# Setup script for Tokamak ZKP Channel Manager
# 1. Prompts for RPC URL and creates .env file
# 2. Initializes and updates git submodules
# 3. Runs tokamak-cli --install

set -e

# Define submodule configuration
SUBMODULE_PATH="Tokamak-Zk-EVM"
SUBMODULE_URL="https://github.com/tokamak-network/Tokamak-zk-EVM.git"
SUBMODULE_BRANCH="dev-manager"
ROOT_ENV=".env"

# ============================================
# Step 1: RPC URL Setup & .env Creation
# ============================================

setup_env() {
  echo ""
  echo "============================================"
  echo "Tokamak ZKP Channel Manager Setup"
  echo "============================================"
  echo ""
  echo "RPC URL is required for the manager app and synthesizer."
  echo "Example: https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY"
  echo ""
  echo "Get your free API key at: https://dashboard.alchemy.com/"
  echo ""
  
  # Check if running in interactive mode
  if [ -t 0 ]; then
    read -p "Enter RPC URL (https://...) or press Enter to skip: " rpc_url
  else
    echo "Non-interactive mode detected. Skipping RPC URL prompt."
    echo ""
    echo "To complete setup manually:"
    echo "  1. Create .env file with RPC_URL and NEXT_PUBLIC_ALCHEMY_API_KEY"
    echo "  2. Run: cd Tokamak-Zk-EVM && ./tokamak-cli --install YOUR_RPC_URL"
    return 1
  fi

  if [ -z "$rpc_url" ]; then
    echo ""
    echo "Skipped. To complete setup manually:"
    echo "  1. Create .env file with RPC_URL and NEXT_PUBLIC_ALCHEMY_API_KEY"
    echo "  2. Run: cd Tokamak-Zk-EVM && ./tokamak-cli --install YOUR_RPC_URL"
    return 1
  fi

  # Validate URL format
  if [[ ! "$rpc_url" =~ ^https:// ]]; then
    echo ""
    echo "Invalid URL format. Must start with https://"
    echo "Skipped. To complete setup manually:"
    echo "  1. Create .env file with RPC_URL and NEXT_PUBLIC_ALCHEMY_API_KEY"
    echo "  2. Run: cd Tokamak-Zk-EVM && ./tokamak-cli --install YOUR_RPC_URL"
    return 1
  fi

  # Create .env file for the manager app
  echo ""
  echo "Creating .env file..."
  
  # Extract API key from Alchemy URL (format: https://eth-sepolia.g.alchemy.com/v2/API_KEY)
  local api_key=""
  if [[ "$rpc_url" =~ alchemy\.com/v2/([^/]+)$ ]]; then
    api_key="${BASH_REMATCH[1]}"
  fi
  
  # Write .env file
  {
    echo "RPC_URL='$rpc_url'"
    if [ -n "$api_key" ]; then
      echo "NEXT_PUBLIC_ALCHEMY_API_KEY='$api_key'"
    fi
  } > "$ROOT_ENV"
  echo "Created: $ROOT_ENV"
  
  # Store rpc_url for later use
  export SETUP_RPC_URL="$rpc_url"
  return 0
}

# ============================================
# Step 2: Git Submodules Setup
# ============================================

setup_submodules() {
  echo ""
  echo "============================================"
  echo "Setting up git submodules..."
  echo "============================================"

  # Check if we're in a git repository
  if [ ! -d .git ]; then
    echo "Not in a git repository. Skipping submodule setup."
    return 1
  fi

  # Check if submodule directory exists
  if [ ! -d "$SUBMODULE_PATH" ] || [ -z "$(ls -A $SUBMODULE_PATH 2>/dev/null)" ]; then
    echo "Submodule $SUBMODULE_PATH not found. Adding it..."
    
    # Check if .gitmodules exists and contains this submodule
    if [ -f .gitmodules ] && grep -q "\[submodule \"$SUBMODULE_PATH\"\]" .gitmodules; then
      echo "Submodule entry found in .gitmodules. Initializing..."
      git submodule update --init --remote --recursive "$SUBMODULE_PATH"
    else
      echo "Adding submodule $SUBMODULE_PATH from $SUBMODULE_URL (branch: $SUBMODULE_BRANCH)..."
      git submodule add -b "$SUBMODULE_BRANCH" "$SUBMODULE_URL" "$SUBMODULE_PATH"
    fi
  else
    echo "Submodule $SUBMODULE_PATH already exists. Updating to latest $SUBMODULE_BRANCH..."
    git submodule update --init --remote --recursive "$SUBMODULE_PATH"
  fi

  # Checkout the correct branch in submodule
  echo "Checking out $SUBMODULE_BRANCH branch..."
  cd "$SUBMODULE_PATH"
  git checkout "$SUBMODULE_BRANCH" 2>/dev/null || git checkout -b "$SUBMODULE_BRANCH" "origin/$SUBMODULE_BRANCH"
  cd ..

  echo "Git submodules setup complete!"
  return 0
}

# ============================================
# Step 3: Tokamak-cli Install
# ============================================

run_tokamak_cli() {
  local cli_path="$SUBMODULE_PATH/tokamak-cli"
  
  if [ ! -f "$cli_path" ]; then
    echo ""
    echo "Warning: tokamak-cli not found at $cli_path"
    echo "Skipping tokamak-cli installation."
    return 1
  fi

  if [ -z "$SETUP_RPC_URL" ]; then
    echo ""
    echo "RPC URL not set. Skipping tokamak-cli installation."
    echo "To complete setup manually:"
    echo "  cd Tokamak-Zk-EVM && ./tokamak-cli --install YOUR_RPC_URL"
    return 1
  fi

  echo ""
  echo "============================================"
  echo "Running tokamak-cli --install..."
  echo "============================================"
  echo "This may take a while..."
  echo ""
  
  # Set TOKAMAK_ZK_EVM_ROOT and run from inside the submodule directory
  export TOKAMAK_ZK_EVM_ROOT="$(pwd)/$SUBMODULE_PATH"
  
  pushd "$SUBMODULE_PATH" >/dev/null
  if bash ./tokamak-cli --install "$SETUP_RPC_URL"; then
    popd >/dev/null
    echo ""
    echo "============================================"
    echo "Setup Complete!"
    echo "============================================"
    return 0
  else
    popd >/dev/null
    echo ""
    echo "Warning: tokamak-cli --install failed."
    echo "You can retry manually:"
    echo "  cd Tokamak-Zk-EVM && ./tokamak-cli --install YOUR_RPC_URL"
    return 1
  fi
}

# ============================================
# Main
# ============================================

# Step 1: Setup .env file first
setup_env
env_success=$?

# Step 2: Setup git submodules
setup_submodules

# Step 3: Run tokamak-cli (only if .env was created successfully)
if [ $env_success -eq 0 ]; then
  run_tokamak_cli
fi

echo ""
echo "All done!"
