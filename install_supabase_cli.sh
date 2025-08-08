#!/bin/bash

set -e

# Get latest release info from GitHub API
RELEASE_JSON=$(curl -s https://api.github.com/repos/supabase/cli/releases/latest)

# Extract asset download URL for Linux x86_64
SUPABASE_URL=$(echo "$RELEASE_JSON" | grep "browser_download_url" | grep "linux_amd64.tar.gz" | cut -d '"' -f 4)

if [ -z "$SUPABASE_URL" ]; then
  echo "Could not find a Linux x86_64 tarball for the latest Supabase CLI release."
  exit 1
fi

echo "Downloading Supabase CLI from $SUPABASE_URL"
wget -O supabase.tar.gz "$SUPABASE_URL"

tar -xzf supabase.tar.gz

mkdir -p ~/.local/bin
mv supabase ~/.local/bin/
chmod +x ~/.local/bin/supabase

export PATH="$HOME/.local/bin:$PATH"

if ! grep -q 'export PATH="$HOME/.local/bin:$PATH"' ~/.bashrc; then
  echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.bashrc
fi

echo "Supabase CLI installed to ~/.local/bin/supabase"
echo "Run 'supabase --version' to verify installation."

rm -f supabase.tar.gz
