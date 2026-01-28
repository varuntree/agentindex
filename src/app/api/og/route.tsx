import { ImageResponse } from "@vercel/og";
import { type NextRequest } from "next/server";

export const runtime = "edge";

const BRAND_GREEN = "#26C169";
const WIDTH = 1200;
const HEIGHT = 630;

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const type = searchParams.get("type") || "home";
  const name = searchParams.get("name") || "AgentIndex";
  const subtitle = searchParams.get("subtitle") || "";
  const stats = searchParams.get("stats") || "";

  switch (type) {
    case "agent":
      return agentOgImage({ name, subtitle, stats });
    case "suburb":
      return suburbOgImage({ name, subtitle, stats });
    case "agency":
      return agencyOgImage({ name, subtitle, stats });
    default:
      return homeOgImage();
  }
}

function homeOgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #000 0%, #1a1a1a 100%)",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            marginBottom: 32,
          }}
        >
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 16,
              background: BRAND_GREEN,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginRight: 20,
            }}
          >
            <span style={{ fontSize: 36, color: "#000", fontWeight: 900 }}>A</span>
          </div>
          <span style={{ fontSize: 48, color: "#fff", fontWeight: 800 }}>
            AgentIndex
          </span>
        </div>
        <p
          style={{
            fontSize: 32,
            color: "#888",
            textAlign: "center",
            maxWidth: 800,
          }}
        >
          Find the Best Real Estate Agents in Australia
        </p>
      </div>
    ),
    { width: WIDTH, height: HEIGHT }
  );
}

function agentOgImage({
  name,
  subtitle,
  stats,
}: {
  name: string;
  subtitle: string;
  stats: string;
}) {
  const statParts = stats.split("|").filter(Boolean);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: "linear-gradient(135deg, #000 0%, #1a1a1a 100%)",
          fontFamily: "system-ui, sans-serif",
          padding: 60,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", marginBottom: 20 }}>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 12,
              background: BRAND_GREEN,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginRight: 16,
            }}
          >
            <span style={{ fontSize: 28, color: "#000", fontWeight: 900 }}>A</span>
          </div>
          <span style={{ fontSize: 24, color: "#666" }}>AgentIndex</span>
        </div>

        <h1
          style={{
            fontSize: 64,
            color: "#fff",
            fontWeight: 800,
            marginBottom: 16,
            lineHeight: 1.1,
          }}
        >
          {name}
        </h1>

        {subtitle && (
          <p style={{ fontSize: 28, color: "#888", marginBottom: 32 }}>
            {subtitle}
          </p>
        )}

        {statParts.length > 0 && (
          <div style={{ display: "flex", gap: 40, marginTop: "auto" }}>
            {statParts.map((stat, i) => {
              const [value, label] = stat.split(":");
              return (
                <div key={i} style={{ display: "flex", flexDirection: "column" }}>
                  <span style={{ fontSize: 48, color: BRAND_GREEN, fontWeight: 700 }}>
                    {value}
                  </span>
                  <span style={{ fontSize: 20, color: "#666", textTransform: "capitalize" }}>
                    {label}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    ),
    { width: WIDTH, height: HEIGHT }
  );
}

function suburbOgImage({
  name,
  subtitle,
  stats,
}: {
  name: string;
  subtitle: string;
  stats: string;
}) {
  const statParts = stats.split("|").filter(Boolean);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: "linear-gradient(135deg, #000 0%, #1a1a1a 100%)",
          fontFamily: "system-ui, sans-serif",
          padding: 60,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", marginBottom: 20 }}>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 12,
              background: BRAND_GREEN,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginRight: 16,
            }}
          >
            <span style={{ fontSize: 28, color: "#000", fontWeight: 900 }}>A</span>
          </div>
          <span style={{ fontSize: 24, color: "#666" }}>AgentIndex</span>
        </div>

        <p style={{ fontSize: 24, color: BRAND_GREEN, marginBottom: 8 }}>
          Real Estate Agents in
        </p>

        <h1
          style={{
            fontSize: 72,
            color: "#fff",
            fontWeight: 800,
            marginBottom: 16,
            lineHeight: 1.1,
          }}
        >
          {name}
        </h1>

        {subtitle && (
          <p style={{ fontSize: 32, color: "#888" }}>{subtitle}</p>
        )}

        {statParts.length > 0 && (
          <div style={{ display: "flex", gap: 40, marginTop: "auto" }}>
            {statParts.map((stat, i) => {
              const [value, label] = stat.split(":");
              return (
                <div key={i} style={{ display: "flex", flexDirection: "column" }}>
                  <span style={{ fontSize: 48, color: BRAND_GREEN, fontWeight: 700 }}>
                    {value}
                  </span>
                  <span style={{ fontSize: 20, color: "#666", textTransform: "capitalize" }}>
                    {label}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    ),
    { width: WIDTH, height: HEIGHT }
  );
}

function agencyOgImage({
  name,
  subtitle,
  stats,
}: {
  name: string;
  subtitle: string;
  stats: string;
}) {
  const statParts = stats.split("|").filter(Boolean);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: "linear-gradient(135deg, #000 0%, #1a1a1a 100%)",
          fontFamily: "system-ui, sans-serif",
          padding: 60,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", marginBottom: 20 }}>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 12,
              background: BRAND_GREEN,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginRight: 16,
            }}
          >
            <span style={{ fontSize: 28, color: "#000", fontWeight: 900 }}>A</span>
          </div>
          <span style={{ fontSize: 24, color: "#666" }}>AgentIndex</span>
        </div>

        <h1
          style={{
            fontSize: 56,
            color: "#fff",
            fontWeight: 800,
            marginBottom: 16,
            lineHeight: 1.1,
          }}
        >
          {name}
        </h1>

        {subtitle && (
          <p style={{ fontSize: 28, color: "#888", marginBottom: 32 }}>
            {subtitle}
          </p>
        )}

        {statParts.length > 0 && (
          <div style={{ display: "flex", gap: 40, marginTop: "auto" }}>
            {statParts.map((stat, i) => {
              const [value, label] = stat.split(":");
              return (
                <div key={i} style={{ display: "flex", flexDirection: "column" }}>
                  <span style={{ fontSize: 48, color: BRAND_GREEN, fontWeight: 700 }}>
                    {value}
                  </span>
                  <span style={{ fontSize: 20, color: "#666", textTransform: "capitalize" }}>
                    {label}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    ),
    { width: WIDTH, height: HEIGHT }
  );
}
