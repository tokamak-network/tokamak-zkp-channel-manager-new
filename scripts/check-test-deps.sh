#!/bin/bash

# ============================================
# E2E Test Dependencies Checker
# ============================================
# Checks for required dependencies and offers to install them:
# - Playwright browsers
# - Foundry/Anvil (for blockchain fork testing)

# Don't exit on error - we want to check all dependencies
# set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Track what needs to be installed
MISSING_DEPS=()

echo ""
echo -e "${BLUE}============================================${NC}"
echo -e "${BLUE}E2E Test Dependencies Check${NC}"
echo -e "${BLUE}============================================${NC}"
echo ""

# ============================================
# Check Playwright
# ============================================

check_playwright() {
  echo -e "${YELLOW}Checking Playwright...${NC}"
  
  # Check if @playwright/test is installed
  if ! npm ls @playwright/test >/dev/null 2>&1; then
    echo -e "  ${RED}✗${NC} @playwright/test not found in node_modules"
    echo -e "    Run: ${GREEN}npm install${NC}"
    MISSING_DEPS+=("playwright-package")
    return 1
  fi
  echo -e "  ${GREEN}✓${NC} @playwright/test installed"
  
  # Check if Playwright browsers are installed
  local browsers_path="$HOME/Library/Caches/ms-playwright"
  if [ "$(uname)" = "Linux" ]; then
    browsers_path="$HOME/.cache/ms-playwright"
  fi
  
  if [ ! -d "$browsers_path" ] || [ -z "$(ls -A "$browsers_path" 2>/dev/null)" ]; then
    echo -e "  ${RED}✗${NC} Playwright browsers not installed"
    MISSING_DEPS+=("playwright-browsers")
    return 1
  fi
  
  # Check specifically for chromium
  if ! ls "$browsers_path"/chromium-* >/dev/null 2>&1; then
    echo -e "  ${RED}✗${NC} Chromium browser not installed"
    MISSING_DEPS+=("playwright-browsers")
    return 1
  fi
  
  echo -e "  ${GREEN}✓${NC} Playwright browsers installed"
  return 0
}

# ============================================
# Check Foundry/Anvil
# ============================================

check_anvil() {
  echo -e "${YELLOW}Checking Foundry/Anvil...${NC}"
  
  if command -v anvil >/dev/null 2>&1; then
    local anvil_version=$(anvil --version 2>&1 | head -1)
    echo -e "  ${GREEN}✓${NC} Anvil installed ($anvil_version)"
    return 0
  else
    echo -e "  ${RED}✗${NC} Anvil not found"
    echo -e "    Required for: blockchain fork testing (channel lifecycle tests)"
    MISSING_DEPS+=("anvil")
    return 1
  fi
}

# ============================================
# Check .env file
# ============================================

check_env() {
  echo -e "${YELLOW}Checking environment...${NC}"
  
  if [ -f ".env" ]; then
    if grep -q "RPC_URL=" .env; then
      echo -e "  ${GREEN}✓${NC} .env file with RPC_URL found"
      return 0
    else
      echo -e "  ${YELLOW}!${NC} .env file exists but RPC_URL not set"
      MISSING_DEPS+=("env-rpc")
      return 1
    fi
  else
    echo -e "  ${YELLOW}!${NC} .env file not found"
    MISSING_DEPS+=("env-file")
    return 1
  fi
}

# ============================================
# Install missing dependencies
# ============================================

install_deps() {
  if [ ${#MISSING_DEPS[@]} -eq 0 ]; then
    echo ""
    echo -e "${GREEN}All dependencies are installed!${NC}"
    echo ""
    return 0
  fi
  
  echo ""
  echo -e "${YELLOW}============================================${NC}"
  echo -e "${YELLOW}Missing Dependencies${NC}"
  echo -e "${YELLOW}============================================${NC}"
  echo ""
  
  # List what's missing
  for dep in "${MISSING_DEPS[@]}"; do
    case $dep in
      "playwright-package")
        echo -e "  • Playwright package (npm install required)"
        ;;
      "playwright-browsers")
        echo -e "  • Playwright browsers (chromium)"
        ;;
      "anvil")
        echo -e "  • Foundry/Anvil (blockchain testing)"
        ;;
      "env-file"|"env-rpc")
        echo -e "  • .env configuration (RPC_URL)"
        ;;
    esac
  done
  
  echo ""
  
  # Non-interactive mode
  if [ ! -t 0 ] || [ "${CI:-}" = "true" ]; then
    echo -e "${YELLOW}Non-interactive mode. Install manually:${NC}"
    print_install_commands
    return 1
  fi
  
  # Interactive mode - ask user
  echo "Would you like to install missing dependencies?"
  echo ""
  echo "  [A]ll     - Install all missing dependencies"
  echo "  [S]elect  - Choose which to install"
  echo "  [N]one    - Skip installation"
  echo ""
  read -p "Choose [A/s/n]: " choice
  
  case "${choice:-A}" in
    [Aa]* | "")
      install_all
      ;;
    [Ss]*)
      install_selective
      ;;
    *)
      echo ""
      echo "Skipped. To install manually:"
      print_install_commands
      return 1
      ;;
  esac
}

install_all() {
  echo ""
  
  for dep in "${MISSING_DEPS[@]}"; do
    case $dep in
      "playwright-package")
        echo -e "${BLUE}Installing Playwright package...${NC}"
        npm install @playwright/test --save-dev
        ;;
      "playwright-browsers")
        echo -e "${BLUE}Installing Playwright browsers...${NC}"
        npx playwright install chromium
        ;;
      "anvil")
        echo -e "${BLUE}Installing Foundry/Anvil...${NC}"
        install_foundry
        ;;
      "env-file"|"env-rpc")
        echo -e "${BLUE}Setting up .env file...${NC}"
        setup_env_file
        ;;
    esac
  done
  
  echo ""
  echo -e "${GREEN}Installation complete!${NC}"
}

install_selective() {
  echo ""
  
  for dep in "${MISSING_DEPS[@]}"; do
    case $dep in
      "playwright-package")
        read -p "Install Playwright package? [Y/n]: " choice
        if [[ "${choice:-Y}" =~ ^[Yy] ]]; then
          npm install @playwright/test --save-dev
        fi
        ;;
      "playwright-browsers")
        read -p "Install Playwright browsers (chromium)? [Y/n]: " choice
        if [[ "${choice:-Y}" =~ ^[Yy] ]]; then
          npx playwright install chromium
        fi
        ;;
      "anvil")
        read -p "Install Foundry/Anvil? [Y/n]: " choice
        if [[ "${choice:-Y}" =~ ^[Yy] ]]; then
          install_foundry
        fi
        ;;
      "env-file"|"env-rpc")
        read -p "Setup .env file? [Y/n]: " choice
        if [[ "${choice:-Y}" =~ ^[Yy] ]]; then
          setup_env_file
        fi
        ;;
    esac
  done
  
  echo ""
  echo -e "${GREEN}Done!${NC}"
}

install_foundry() {
  if command -v foundryup >/dev/null 2>&1; then
    echo "Foundryup found, running update..."
    foundryup
  else
    echo "Installing Foundry..."
    curl -L https://foundry.paradigm.xyz | bash
    
    # Source the updated PATH
    export PATH="$HOME/.foundry/bin:$PATH"
    
    # Run foundryup to install binaries
    if command -v foundryup >/dev/null 2>&1; then
      foundryup
    else
      echo ""
      echo -e "${YELLOW}Foundry installed. Please run these commands:${NC}"
      echo "  source ~/.bashrc  # or ~/.zshrc"
      echo "  foundryup"
    fi
  fi
}

setup_env_file() {
  if [ -f ".env" ]; then
    echo "Existing .env file found. Adding RPC_URL..."
  fi
  
  echo ""
  echo "RPC URL is required for blockchain testing."
  echo "Example: https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY"
  echo ""
  read -p "Enter RPC URL (or press Enter to skip): " rpc_url
  
  if [ -n "$rpc_url" ]; then
    if [ -f ".env" ]; then
      # Update existing file
      if grep -q "RPC_URL=" .env; then
        sed -i.bak "s|RPC_URL=.*|RPC_URL='$rpc_url'|" .env && rm -f .env.bak
      else
        echo "RPC_URL='$rpc_url'" >> .env
      fi
    else
      echo "RPC_URL='$rpc_url'" > .env
    fi
    
    # Extract API key for Alchemy
    if [[ "$rpc_url" =~ alchemy\.com/v2/([^/]+)$ ]]; then
      local api_key="${BASH_REMATCH[1]}"
      if ! grep -q "NEXT_PUBLIC_ALCHEMY_API_KEY=" .env 2>/dev/null; then
        echo "NEXT_PUBLIC_ALCHEMY_API_KEY='$api_key'" >> .env
      fi
    fi
    
    echo -e "${GREEN}✓${NC} .env file updated"
  else
    echo "Skipped .env setup"
  fi
}

print_install_commands() {
  echo ""
  for dep in "${MISSING_DEPS[@]}"; do
    case $dep in
      "playwright-package")
        echo "  npm install @playwright/test --save-dev"
        ;;
      "playwright-browsers")
        echo "  npx playwright install chromium"
        ;;
      "anvil")
        echo "  curl -L https://foundry.paradigm.xyz | bash && foundryup"
        ;;
      "env-file"|"env-rpc")
        echo "  echo \"RPC_URL='YOUR_RPC_URL'\" > .env"
        ;;
    esac
  done
  echo ""
}

# ============================================
# Main
# ============================================

check_playwright
check_anvil
check_env

install_deps
exit_code=$?

echo ""
if [ $exit_code -eq 0 ]; then
  echo -e "${GREEN}Ready to run E2E tests!${NC}"
  echo ""
  echo "Commands:"
  echo "  npm run test:e2e        # Run all E2E tests"
  echo "  npm run test:e2e:ui     # Run with UI (debugging)"
  echo ""
fi

exit $exit_code
