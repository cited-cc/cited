import { ImageResponse } from "next/og";

export const OG_SIZE = { width: 1200, height: 630 } as const;
export const OG_CONTENT_TYPE = "image/png";

type CreateOgImageOptions = {
  title: string;
  subtitle: string;
  footerLeft?: string;
  footerRight?: string;
  alt?: string;
};

/**
 * Shared vanilla-paper Open Graph / Twitter image renderer.
 */
export function createOgImage({
  title,
  subtitle,
  footerLeft = "cited.cc",
  footerRight = "citation monitoring",
}: CreateOgImageOptions) {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          backgroundColor: "#fbf7f0",
          backgroundImage:
            "radial-gradient(circle at 18% 18%, rgba(92,225,230,0.16), transparent 42%), radial-gradient(circle at 85% 75%, rgba(253,251,246,0.95), transparent 40%)",
          padding: "64px 72px",
          color: "#15131a",
          fontFamily: "ui-sans-serif, system-ui, sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              width: 48,
              height: 48,
              borderRadius: 12,
              backgroundColor: "#15131a",
              gap: 3,
              paddingTop: 2,
            }}
          >
            <div
              style={{
                width: 18,
                height: 3,
                borderRadius: 2,
                backgroundColor: "rgba(251,247,240,0.35)",
              }}
            />
            <div
              style={{
                width: 18,
                height: 4,
                borderRadius: 2,
                backgroundColor: "#5ce1e6",
              }}
            />
            <div
              style={{
                width: 13,
                height: 3,
                borderRadius: 2,
                backgroundColor: "rgba(251,247,240,0.55)",
              }}
            />
          </div>
          <div
            style={{
              fontSize: 36,
              letterSpacing: "-0.04em",
              fontWeight: 600,
              color: "#15131a",
            }}
          >
            cited
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div
            style={{
              fontSize: 72,
              lineHeight: 1.05,
              letterSpacing: "-0.045em",
              maxWidth: 900,
              fontWeight: 700,
              color: "#0c0b10",
            }}
          >
            {title}
          </div>
          <div
            style={{
              fontSize: 28,
              color: "#524e5c",
              maxWidth: 760,
            }}
          >
            {subtitle}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderTop: "1px solid #e7e0d4",
            paddingTop: 24,
            fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
            fontSize: 20,
            color: "#837f8d",
          }}
        >
          <span>{footerLeft}</span>
          <span style={{ color: "#5ce1e6" }}>{footerRight}</span>
        </div>
      </div>
    ),
    { ...OG_SIZE },
  );
}
