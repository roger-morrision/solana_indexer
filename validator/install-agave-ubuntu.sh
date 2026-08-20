#!/usr/bin/env bash
set -euo pipefail
if [[ "$(id -u)" -eq 0 ]]; then echo "Run as the dedicated non-root sol user" >&2; exit 1; fi
: "${AGAVE_VERSION:?Set AGAVE_VERSION to a reviewed release tag, for example vX.Y.Z}"
command -v cargo >/dev/null || { echo "Rust/Cargo is required; install it from the official Rust project" >&2; exit 1; }
git clone --depth 1 --branch "$AGAVE_VERSION" https://github.com/anza-xyz/agave.git "$HOME/agave-$AGAVE_VERSION"
cd "$HOME/agave-$AGAVE_VERSION"
git rev-parse HEAD | tee "$HOME/agave-source-commit.txt"
./cargo build --release --bin agave-validator --bin solana --bin solana-keygen
mkdir -p "$HOME/bin"
install -m 0755 target/release/agave-validator target/release/solana target/release/solana-keygen "$HOME/bin/"
"$HOME/bin/agave-validator" --version
