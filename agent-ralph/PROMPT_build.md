0a. Study `spec/*` with up to 25 parallel task Sonnet subagents to learn the application specifications.
0b. Study `ai_docs/*` with Sonnet subagents to learn ElevenLabs voice agent and Claude Agent SDK integration patterns.
0c. Study @IMPLEMENTATION_PLAN.md.
0d. Study @AGENTS.md for build commands, validation steps, and codebase patterns.
0e. For reference, the application source code is in `src/*` and data pipeline code is in `pipeline/*`.

1. Your task is to implement functionality per the specifications using parallel subagents. Follow @IMPLEMENTATION_PLAN.md and choose the most important item to address. Before making changes, search the codebase (don't assume not implemented) using Sonnet subagents. You may use up to 500 parallel Sonnet subagents for searches/reads and only 1 Sonnet subagent for build/tests. Use Opus subagents when complex reasoning is needed (debugging, architectural decisions).
2. After implementing functionality or resolving problems, run the validation commands from @AGENTS.md (typecheck, lint, build). If functionality is missing then it's your job to add it as per the application specifications. Ultrathink.
3. If the task produces visible UI output (pages, components, layout, styling), start the dev server (`pnpm dev`) and use Chrome MCP tools to verify the rendered output. Navigate to the relevant route, take a screenshot, and confirm the implementation matches spec expectations. Check responsive behavior where relevant. If visual issues are found, fix them before proceeding. If issues cannot be resolved in this iteration, document them in @IMPLEMENTATION_PLAN.md.
4. When you discover issues, immediately update @IMPLEMENTATION_PLAN.md with your findings using a subagent. When resolved, update and remove the item.
5. When all validations pass (build + typecheck + lint + Chrome verify if UI), update @IMPLEMENTATION_PLAN.md, then `git add -A` then `git commit` with a message describing the changes. After the commit, `git push`.

99999. Important: When authoring documentation, capture the why — tests and implementation importance.
999999. Important: Single sources of truth, no migrations/adapters. If tests unrelated to your work fail, resolve them as part of the increment.
9999999. As soon as there are no build or test errors create a git tag. If there are no git tags start at 0.0.0 and increment patch by 1 for example 0.0.1 if 0.0.0 does not exist.
99999999. You may add extra logging if required to debug issues.
999999999. Keep @IMPLEMENTATION_PLAN.md current with learnings using a subagent — future work depends on this to avoid duplicating efforts. Update especially after finishing your turn.
9999999999. When you learn something new about how to run the application, build the project, or work with any part of the tech stack, update @AGENTS.md using a subagent but keep it brief. For example if you run commands multiple times before learning the correct command, or discover a pattern that works well, or find a gotcha — that file should be updated. This is critical: future iterations depend on @AGENTS.md being accurate and useful.
99999999999. For any bugs you notice, resolve them or document them in @IMPLEMENTATION_PLAN.md using a subagent even if it is unrelated to the current piece of work.
999999999999. Implement functionality completely. Placeholders and stubs waste efforts and time redoing the same work.
9999999999999. When @IMPLEMENTATION_PLAN.md becomes large periodically clean out the items that are completed from the file using a subagent.
99999999999999. If you find inconsistencies in the spec/* then use an Opus 4.5 subagent with 'ultrathink' requested to update the specs.
999999999999999. IMPORTANT: Keep @AGENTS.md operational only — status updates and progress notes belong in `IMPLEMENTATION_PLAN.md`. A bloated AGENTS.md pollutes every future loop's context.
9999999999999999. Chrome verification for UI tasks: when the task involves pages, components, or styling, you MUST visually verify using Chrome MCP tools before committing. Start dev server, navigate to the route, screenshot, confirm layout/styling/content matches spec. Check mobile viewport (375px) and desktop (1280px). Document any visual deviations in @IMPLEMENTATION_PLAN.md.
99999999999999999. Auth: Claude Agent SDK uses Claude Code Max subscription — no API key needed. ElevenLabs credentials are in Chrome. Do not create or look for .env API keys for these services.
