import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Cited",
    short_name: "Cited",
    description:
      "Cited monitors the AI questions you choose and records when your website becomes part of the answer.",
    start_url: "/",
    display: "standalone",
    background_color: "#fbf7f0",
    theme_color: "#fbf7f0",
    icons: [
      {
        src: "/cited-mark.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
    ],
  };
}
