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
        backgroundColor: "#ffffff",
      }}
    >
      <GlowLoader fullScreen text="GlowGoodly" subtext="Loading authentic beauty & skincare..." />
    </div>
  );
}
