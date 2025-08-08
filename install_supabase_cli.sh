#!/bin/bash

set -e

# Get latest Supabase CLI release tag from GitHub API
SUPABASE_LATEST_TAG=$(curl -s https://api.github.com/repos/supabase/cli/releases/latest | grep '"tag_name":' | sed -E 's/.*"([^"]+)".*/\1/')

echo "Latest Supabase CLI release: $SUPABASE_LATEST_TAG"

# Compose download URL for Linux x86_64
SUPABASE_URL="https://github.com/supabase/cli/releases/download/$SUPABASE_LATEST_TAG/supabase_${SUPABASE_LATEST_TAG#v}_linux_amd64.tar.gz"

echo "Downloading Supabase CLI from $SUPABASE_URL"

wget -O supabase.tar.gz "$SUPABASE_URL"

tar -xzf supabase.tar.gz

mkdir -p ~/.local/bin
mv supabase ~/.local/bin/
chmod +x ~/.local/bin/supabase

# Add ~/.local/bin to PATH for current session
export PATH="$HOME/.local/bin:$PATH"

# Add ~/.local/bin to PATH for future sessions (if not already present)
if ! grep -q 'export PATH="$HOME/.local/bin:$PATH"' ~/.bashrc; then
  echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.bashrc
fi

echo "Supabase CLI installed to ~/.local/bin/supabase"
echo "Run 'supabase --version' to verify installation."

# Clean up
rm -f supabase.tar.gz