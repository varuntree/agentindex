import type { SdkMessagePayload } from "../lib/types";
import { ToolCallBlock } from "./ToolCallBlock";

export function MessageBlock({ message }: { message: SdkMessagePayload }) {
  const { messageType, content } = message;

  if (messageType === "result") {
    return (
      <div className="my-2 rounded border border-emerald-900/50 bg-emerald-950/30 px-3 py-2 text-xs text-emerald-300">
        Iteration complete
        {message.numTurns != null && ` \u2022 ${message.numTurns} turns`}
        {message.costUsd != null && ` \u2022 $${message.costUsd.toFixed(4)}`}
        {message.durationMs != null && ` \u2022 ${(message.durationMs / 1000).toFixed(1)}s`}
      </div>
    );
  }

  if (messageType === "system") {
    return (
      <div className="my-1 text-[11px] text-zinc-600 italic">System message</div>
    );
  }

  if (!content || content.length === 0) return null;

  return (
    <div className="my-1">
      {content.map((block, i) => {
        if (block.type === "text" && block.text) {
          return (
            <div key={i} className="whitespace-pre-wrap text-xs text-zinc-300 leading-relaxed">
              {block.text}
            </div>
          );
        }
        if (block.type === "tool_use") {
          return <ToolCallBlock key={block.id || i} block={block} />;
        }
        return null;
      })}
    </div>
  );
}
