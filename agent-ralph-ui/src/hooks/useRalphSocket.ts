import { useEffect, useRef } from "react";
import { useRalphStore } from "../store/ralphStore";
import type { WsEvent } from "../lib/types";

const BASE_DELAY = 2000;
const MAX_DELAY = 30000;

export function useRalphSocket() {
  const wsRef = useRef<WebSocket | null>(null);
  const handleEvent = useRalphStore((s) => s.handleEvent);
  const setConnected = useRalphStore((s) => s.setConnected);

  useEffect(() => {
    let reconnectTimer: ReturnType<typeof setTimeout>;
    let alive = true;
    let attempt = 0;

    function connect() {
      if (!alive) return;

      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const ws = new WebSocket(`${protocol}//${window.location.host}/ws`);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log("[ws] connected");
        attempt = 0;
        setConnected(true);
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
        console.log("[ws] disconnected");
        wsRef.current = null;
        setConnected(false);
        if (alive) {
          const delay = Math.min(BASE_DELAY * Math.pow(2, attempt), MAX_DELAY);
          attempt++;
          console.log(`[ws] reconnecting in ${delay}ms (attempt ${attempt})`);
          reconnectTimer = setTimeout(connect, delay);
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
  }, [handleEvent, setConnected]);
}
