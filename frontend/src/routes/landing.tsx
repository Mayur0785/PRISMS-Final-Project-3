import { createFileRoute } from "@tanstack/react-router";
import { LandingPage } from "@/components/LandingPage";

export const Route = createFileRoute("/landing")({
  head: () => ({
    meta: [
      { title: "PRISMS — Digital Agricultural Trading Command Center" },
      {
        name: "description",
        content:
          "Sell Smarter. Earn More. Trade with Confidence. PRISMS is an AI-powered agricultural market and trade execution platform for Indian farmers.",
      },
      { property: "og:title", content: "PRISMS — Digital Agricultural Trading Command Center" },
      {
        property: "og:description",
        content: "Verified APMC price discovery, direct buyer matching, and escrow payment settlement for Indian farmers.",
      },
    ],
  }),
  component: LandingRouteComponent,
});

function LandingRouteComponent() {
  return (
    <LandingPage
      onEnterDashboard={() => {
        window.location.href = "/";
      }}
    />
  );
}
