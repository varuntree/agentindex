#!/bin/bash
# AgentIndex Ralph Loop
# Usage: ./loop.sh [plan] [max_iterations]
# Examples:
#   ./loop.sh              # Build mode, unlimited iterations
#   ./loop.sh 20           # Build mode, max 20 iterations
#   ./loop.sh plan         # Plan mode, unlimited iterations
#   ./loop.sh plan 5       # Plan mode, max 5 iterations

set -euo pipefail

# Parse arguments
if [ "${1:-}" = "plan" ]; then
    MODE="plan"
    PROMPT_FILE="PROMPT_plan.md"
    MAX_ITERATIONS=${2:-0}
elif [[ "${1:-}" =~ ^[0-9]+$ ]]; then
    MODE="build"
    PROMPT_FILE="PROMPT_build.md"
    MAX_ITERATIONS=$1
else
    MODE="build"
    PROMPT_FILE="PROMPT_build.md"
    MAX_ITERATIONS=0
fi

ITERATION=0
CURRENT_BRANCH=$(git branch --show-current)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "AgentIndex Ralph Loop"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Mode:   $MODE"
echo "Prompt: $PROMPT_FILE"
echo "Branch: $CURRENT_BRANCH"
echo "Root:   $PROJECT_ROOT"
[ $MAX_ITERATIONS -gt 0 ] && echo "Max:    $MAX_ITERATIONS iterations"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Verify prompt file exists
PROMPT_PATH="$SCRIPT_DIR/$PROMPT_FILE"
if [ ! -f "$PROMPT_PATH" ]; then
    echo "Error: $PROMPT_PATH not found"
    exit 1
fi

# Change to project root so claude operates in the right directory
cd "$PROJECT_ROOT"

while true; do
    if [ $MAX_ITERATIONS -gt 0 ] && [ $ITERATION -ge $MAX_ITERATIONS ]; then
        echo "Reached max iterations: $MAX_ITERATIONS"
        break
    fi

    # Run Ralph iteration with selected prompt
    # -p: Headless mode (non-interactive, reads from stdin)
    # --dangerously-skip-permissions: Auto-approve all tool calls
    # --output-format=stream-json: Structured output for logging/monitoring
    # --model opus: Primary agent uses Opus for complex reasoning
    # --verbose: Detailed execution logging
    cat "$PROMPT_PATH" | claude -p \
        --dangerously-skip-permissions \
        --output-format=stream-json \
        --model opus \
        --verbose

    # Push changes after each iteration
    CURRENT_BRANCH=$(git branch --show-current)
    git push origin "$CURRENT_BRANCH" || {
        echo "Failed to push. Creating remote branch..."
        git push -u origin "$CURRENT_BRANCH"
    }

    ITERATION=$((ITERATION + 1))
    echo -e "\n\n======================== LOOP $ITERATION ========================\n"
done
