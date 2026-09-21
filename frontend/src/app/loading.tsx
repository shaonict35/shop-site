import React from "react";
import GlowLoader from "../components/GlowLoader";

export default function Loading() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "75vh",
        width: "100%",
      }}
    >
      <GlowLoader
        fullScreen
        text="Loading GlowGoodly..."
        subtext="Authentic Cosmetics & Skincare"
      />
    </div>
  );
}
