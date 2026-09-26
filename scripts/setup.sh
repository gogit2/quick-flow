#!/usr/bin/env bash
# One-time machine setup for the loops (idempotent).
set -euo pipefail
echo "java:  $(java -version 2>&1 | head -1)";  echo "node:  $(node --version)";  echo "ng:    $(ng version 2>/dev/null | grep -m1 'Angular CLI' || echo missing)"
echo "claude: $(claude --version)"
echo "→ Playwright Chromium for the pinned MCP (@playwright/mcp@0.0.40)"
npx -y -p @playwright/mcp@0.0.40 playwright install chromium
python3 -c "import openpyxl" 2>/dev/null && echo "openpyxl: ok" || echo "openpyxl missing → pip install --user openpyxl (needed only for 'loopctl.py excel')"
[[ -d .git ]] || echo "tip: git init && git add -A && git commit -m 'loops scaffold' (loops commit after every milestone)"
