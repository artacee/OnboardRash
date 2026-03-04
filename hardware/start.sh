#!/bin/bash
# ──────────────────────────────────────────────
#  OnboardRash — Pi Quick Start (evaluation day)
# ──────────────────────────────────────────────
#  1. Auto-connects to phone hotspot (or USB tether)
#  2. Shows interactive config prompt
#  3. Starts rash driving detection
#
#  Usage:
#    chmod +x start.sh   # (first time only)
#    ./start.sh           # normal start
#    ./start.sh --no-prompt   # skip prompt (headless / automated)
#

set -e
cd "$(dirname "$0")"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  OnboardRash — Starting Pi System"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo

# Pass all arguments through (e.g. --no-prompt, --server, etc.)
python3 main_pi.py --auto-network "$@"
