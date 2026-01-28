import { useRalphStore } from "../store/ralphStore";
import { useAutoScroll } from "../hooks/useAutoScroll";
import { MessageBlock } from "./MessageBlock";

export function MainPanel() {
  const { messages, partialText, running, iteration } = useRalphStore();
  const scrollRef = useAutoScroll([messages.length, partialText]);

  return (
    <div ref={scrollRef} className="flex-1 overflow-y-auto p-4">
      {iteration === 0 && !running && (
        <div className="flex h-full items-center justify-center">
          <div className="text-center">
            <p className="text-lg text-zinc-600">Ralph Dashboard</p>
            <p className="mt-1 text-xs text-zinc-700">
              Select mode and click Start to begin
            </p>
          </div>
        </div>
      )}

      {messages.map((msg, i) => (
        <MessageBlock key={i} message={msg} />
      ))}

      {partialText && (
        <div className="whitespace-pre-wrap text-xs text-zinc-400">
          {partialText}
          <span className="animate-pulse text-emerald-400">|</span>
        </div>
      )}
    </div>
  );
}
