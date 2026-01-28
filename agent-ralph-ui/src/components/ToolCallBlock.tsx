import { useState } from "react";
import { ChevronRight, ChevronDown } from "lucide-react";
import type { ContentBlock } from "../lib/types";
import { truncate } from "../lib/format";

export function ToolCallBlock({ block }: { block: ContentBlock }) {
  const [open, setOpen] = useState(false);

  if (block.type !== "tool_use") return null;

  const toolName = block.name || "unknown";
  const input = block.input || {};

  // Extract a preview string from tool input
  let preview = "";
  if ("command" in input) preview = truncate(String(input.command), 60);
  else if ("pattern" in input) preview = truncate(String(input.pattern), 60);
  else if ("file_path" in input) preview = truncate(String(input.file_path), 60);
  else if ("query" in input) preview = truncate(String(input.query), 60);
  else if ("prompt" in input) preview = truncate(String(input.prompt), 60);
  else if ("description" in input) preview = truncate(String(input.description), 60);

  return (
    <div className="my-1 rounded border border-zinc-800 bg-zinc-900/50">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs hover:bg-zinc-800/50"
      >
        {open ? (
          <ChevronDown size={12} className="text-zinc-500" />
        ) : (
          <ChevronRight size={12} className="text-zinc-500" />
        )}
        <span className="font-mono font-medium text-amber-400">{toolName}</span>
        {preview && <span className="truncate text-zinc-500">{preview}</span>}
      </button>

      {open && (
        <pre className="max-h-64 overflow-auto border-t border-zinc-800 px-3 py-2 text-[11px] text-zinc-400">
          {JSON.stringify(input, null, 2)}
        </pre>
      )}
    </div>
  );
}
