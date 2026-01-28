import { useEffect, useRef } from "react";
import { useRalphStore } from "../store/ralphStore";
import type { WsEvent } from "../lib/types";

export function useRalphSocket() {
  const wsRef = useRef<WebSocket | null>(null);
  const handleEvent = useRalphStore((s) => s.handleEvent);

  useEffect(() => {
    let reconnectTimer: ReturnType<typeof setTimeout>;
    let alive = true;

    function connect() {
      if (!alive) return;

      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const ws = new WebSocket(`${protocol}//${window.location.host}/ws`);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log("[ws] connected");
      };

      ws.onmessage = (ev) => {
        try {
          const event: WsEvent = JSON.parse(ev.data);
          handleEvent(event);
        } catch {
          // ignore parse errors
        }
      };

      ws.onclose = () => {
        console.log("[ws] disconnected, reconnecting...");
        wsRef.current = null;
        if (alive) {
          reconnectTimer = setTimeout(connect, 2000);
        }
      };

      ws.onerror = () => {
        ws.close();
      };
    }

    connect();

    return () => {
      alive = false;
      clearTimeout(reconnectTimer);
      wsRef.current?.close();
    };
  }, [handleEvent]);
}
