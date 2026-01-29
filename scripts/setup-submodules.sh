#!/bin/bash

# Setup script for Tokamak ZKP Channel Manager
# 1. Prompts for RPC URL and creates .env file
# 2. Initializes and updates git submodules
# 3. Runs tokamak-cli --install
#
# Environment Variables:
#   SKIP_SUBMODULE_SETUP=1  - Skip entire setup (use when submodule is already configured)
#   SKIP_TOKAMAK_CLI=1      - Skip only tokamak-cli installation
#   CI=true                 - Non-interactive mode (skips prompts)

set -e

# Define submodule configuration
SUBMODULE_PATH="Tokamak-Zk-EVM"
SUBMODULE_URL="https://github.com/tokamak-network/Tokamak-zk-EVM.git"
SUBMODULE_BRANCH="dev-manager"
ROOT_ENV=".env"

# ============================================
# Skip Check
# ============================================

check_skip() {
  # Check if user wants to skip entirely
  if [ "${SKIP_SUBMODULE_SETUP:-}" = "1" ] || [ "${SKIP_SUBMODULE_SETUP:-}" = "true" ]; then
    echo ""
    echo "============================================"
    echo "Skipping submodule setup (SKIP_SUBMODULE_SETUP=1)"
    echo "============================================"
    exit 0
  fi

  # Check if submodule is already properly set up
  if [ -d "$SUBMODULE_PATH" ] && [ -f "$SUBMODULE_PATH/tokamak-cli" ]; then
    # Check if tokamak-cli binary exists (indicating successful build)
    if [ -x "$SUBMODULE_PATH/tokamak-cli" ]; then
      echo ""
      echo "============================================"
      echo "Tokamak-Zk-EVM Setup Check"
      echo "============================================"
      echo ""
      echo "Detected existing Tokamak-Zk-EVM installation:"
      echo "  Path: $SUBMODULE_PATH"
      echo "  CLI:  $SUBMODULE_PATH/tokamak-cli (executable)"
      echo ""
      
      # In CI or non-interactive mode, auto-skip
      if [ "${CI:-}" = "true" ] || [ ! -t 0 ]; then
        echo "Non-interactive mode: Skipping setup."
        echo "Set SKIP_SUBMODULE_SETUP=0 to force re-setup."
        exit 0
      fi
      
      # Interactive mode: ask user
      echo "Options:"
      echo "  [S]kip  - Keep current installation (recommended if working)"
      echo "  [R]erun - Re-run full setup (will update submodule)"
      echo ""
      read -p "Choose [S/r]: " choice
      
      case "${choice:-S}" in
        [Ss]* | "")
          echo ""
          echo "Skipping setup. Using existing installation."
          echo ""
          echo "Tip: Set SKIP_SUBMODULE_SETUP=1 to always skip:"
          echo "  SKIP_SUBMODULE_SETUP=1 npm install"
          exit 0
          ;;
        [Rr]*)
          echo ""
          echo "Re-running setup..."
          ;;
        *)
          echo "Invalid choice. Skipping setup."
          exit 0
          ;;
      esac
    fi
  fi
}

# ============================================
# Step 1: RPC URL Setup & .env Creation
# ============================================

setup_env() {
  echo ""
  echo "============================================"
  echo "Tokamak ZKP Channel Manager Setup"
  echo "============================================"
  echo ""
  
  # Check if .env already exists
  if [ -f "$ROOT_ENV" ]; then
    echo "Existing .env file found."
    if [ -t 0 ]; then
      read -p "Overwrite? [y/N]: " overwrite
      if [[ ! "$overwrite" =~ ^[Yy] ]]; then
        echo "Keeping existing .env file."
        # Try to extract RPC_URL from existing .env
        if grep -q "RPC_URL=" "$ROOT_ENV"; then
          export SETUP_RPC_URL=$(grep "RPC_URL=" "$ROOT_ENV" | cut -d"'" -f2 | cut -d'"' -f2)
          echo "Using RPC_URL from existing .env"
        fi
        return 0
      fi
    else
      echo "Non-interactive mode: Keeping existing .env file."
      if grep -q "RPC_URL=" "$ROOT_ENV"; then
        export SETUP_RPC_URL=$(grep "RPC_URL=" "$ROOT_ENV" | cut -d"'" -f2 | cut -d'"' -f2)
      fi
      return 0
    fi
  fi
  
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
    echo "  2. Run: cd Tokamak-Zk-EVM && ./tokamak-cli --install YOUR_RPC_URL --bun"
    return 1
  fi

  if [ -z "$rpc_url" ]; then
    echo ""
    echo "Skipped. To complete setup manually:"
    echo "  1. Create .env file with RPC_URL and NEXT_PUBLIC_ALCHEMY_API_KEY"
    echo "  2. Run: cd Tokamak-Zk-EVM && ./tokamak-cli --install YOUR_RPC_URL --bun"
    return 1
  fi

  # Validate URL format
  if [[ ! "$rpc_url" =~ ^https:// ]]; then
    echo ""
    echo "Invalid URL format. Must start with https://"
    echo "Skipped. To complete setup manually:"
    echo "  1. Create .env file with RPC_URL and NEXT_PUBLIC_ALCHEMY_API_KEY"
    echo "  2. Run: cd Tokamak-Zk-EVM && ./tokamak-cli --install YOUR_RPC_URL --bun"
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
  # Check if user wants to skip tokamak-cli
  if [ "${SKIP_TOKAMAK_CLI:-}" = "1" ] || [ "${SKIP_TOKAMAK_CLI:-}" = "true" ]; then
    echo ""
    echo "Skipping tokamak-cli installation (SKIP_TOKAMAK_CLI=1)"
    return 0
  fi

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
    echo "  cd Tokamak-Zk-EVM && ./tokamak-cli --install YOUR_RPC_URL --bun"
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
  if bash ./tokamak-cli --install "$SETUP_RPC_URL" --bun; then
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
    echo "  cd Tokamak-Zk-EVM && ./tokamak-cli --install YOUR_RPC_URL --bun"
    return 1
  fi
}

# ============================================
# Main
# ============================================

# Check if setup should be skipped
check_skip

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
echo ""
echo "Tip: To skip this setup in future installs:"
echo "  SKIP_SUBMODULE_SETUP=1 npm install"
