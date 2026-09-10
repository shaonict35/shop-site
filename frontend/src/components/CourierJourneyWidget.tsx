"use client";

import React, { useState, useEffect } from "react";
import { Sparkles, CheckCircle2 } from "lucide-react";

export default function CourierJourneyWidget() {
  const [currentStep, setCurrentStep] = useState(0);

  // Smooth auto-advancement of the delivery journey:
  // Step 0 -> Step 1 -> Step 2 -> Step 3 (car stops at Courier Hub) -> Step 4 (doorstep handover completes) -> restarts at Step 0 (GlowGoodly Hub)
  useEffect(() => {
    // Generous time on stage 5 (handover) so user clearly witnesses the delivery complete before restarting at stage 1
    const delay = currentStep === 4 ? 4200 : 3000;
    const timer = setTimeout(() => {
      setCurrentStep((prev) => (prev + 1) % 5);
    }, delay);
    return () => clearTimeout(timer);
  }, [currentStep]);

  const steps = [
    { id: 0, icon: "🏬", label: "GlowGoodly Hub", sub: "Order Packed & Sealed", tag: "Fulfillment" },
    { id: 1, icon: "📦", label: "Dispatched", sub: "Handed to Courier", tag: "Sorted" },
    { id: 2, icon: "🚚", label: "In Transit", sub: "Express Highway Transit", tag: "Express" },
    { id: 3, icon: "🏢", label: "Courier Hub", sub: "Local Sorting Center", tag: "Arrived" },
    { id: 4, icon: "🏡", label: "Assign for Delivery", sub: "Direct Handover to Customer", tag: "Doorstep" }
  ];

  // Car drives up to stage 4 (Courier Hub) and stays standing/parked there, then stage 5 completes
  const getCarPosition = (step: number) => {
    switch (step) {
      case 0:
        return "max(60px, 10%)";
      case 1:
        return "27%";
      case 2:
        return "44%";
      case 3:
      case 4:
        // Car reaches stage 4 and stands still/parked here!
        return "61%";
      default:
        return "10%";
    }
  };

  return (
    <div
      style={{
        width: "100%",
        marginBottom: "28px",
        borderRadius: "20px",
        background: "linear-gradient(135deg, #090e1a 0%, #171638 50%, #290d24 100%)",
        color: "#ffffff",
        padding: "22px 24px",
        boxShadow: "0 15px 35px rgba(229, 40, 96, 0.18), 0 4px 15px rgba(0, 0, 0, 0.3)",
        border: "1.5px solid rgba(244, 114, 182, 0.25)",
        position: "relative",
        overflow: "hidden",
        fontFamily: "'Montserrat', 'Inter', system-ui, sans-serif"
      }}
    >
      <style jsx>{`
        @keyframes roadDashes {
          0% { background-position: 0 0; }
          100% { background-position: -40px 0; }
        }
        @keyframes carSuspension {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-2.5px); }
        }
        @keyframes headlightFlicker {
          0%, 100% { opacity: 0.85; }
          50% { opacity: 0.6; }
        }
        @keyframes wheelSpin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes speedLine {
          0% { opacity: 0.3; transform: scaleX(0.7); }
          50% { opacity: 1; transform: scaleX(1.2); }
          100% { opacity: 0.3; transform: scaleX(0.7); }
        }
        @keyframes pulseDot {
          0%, 100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7); }
          70% { box-shadow: 0 0 0 8px rgba(16, 185, 129, 0); }
        }
        @keyframes floatHeart {
          0% { transform: translateY(0px) scale(0.85); opacity: 0; }
          30% { transform: translateY(-7px) scale(1.2); opacity: 1; }
          75% { transform: translateY(-15px) scale(1); opacity: 0.9; }
          100% { transform: translateY(-22px) scale(0.75); opacity: 0; }
        }
        @keyframes sparkleTwinkle {
          0%, 100% { transform: scale(0.6) rotate(0deg); opacity: 0.3; }
          50% { transform: scale(1.2) rotate(45deg); opacity: 1; }
        }
        @keyframes handoverGentle {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-2px); }
        }
        @keyframes doorstepGlow {
          0%, 100% { filter: drop-shadow(0 0 6px rgba(244, 114, 182, 0.35)); }
          50% { filter: drop-shadow(0 0 14px rgba(229, 40, 96, 0.7)); }
        }
        .road-stripes {
          background-image: repeating-linear-gradient(
            to right,
            #ffffff 0px,
            #ffffff 18px,
            transparent 18px,
            transparent 36px
          );
          background-size: 36px 3px;
          animation: roadDashes 0.65s linear infinite;
        }
        .wheel-rotate {
          transform-origin: center;
          animation: wheelSpin 0.7s linear infinite;
        }
        @media (max-width: 768px) {
          .milestone-grid {
            grid-template-columns: repeat(3, 1fr) !important;
          }
        }
        @media (max-width: 520px) {
          .milestone-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
          .handover-scene-wrapper {
            transform: scale(0.84);
            transform-origin: right center;
          }
          .car-on-step4 {
            opacity: 0.25 !important;
          }
        }
      `}</style>

      {/* Ambient background glow orbs */}
      <div
        style={{
          position: "absolute",
          top: "-50px",
          left: "20%",
          width: "220px",
          height: "220px",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(229, 40, 96, 0.22) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: "-40px",
          right: "15%",
          width: "180px",
          height: "180px",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(99, 102, 241, 0.2) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      {/* Top Header Row */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "10px", position: "relative", zIndex: 3 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "10px",
              background: "linear-gradient(135deg, #e52860 0%, #db2777 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 4px 12px rgba(229, 40, 96, 0.4)",
              fontSize: "18px"
            }}
          >
            🚚
          </div>
          <div>
            <div style={{ fontSize: "15px", fontWeight: "900", letterSpacing: "0.5px", color: "#ffffff", display: "flex", alignItems: "center", gap: "6px" }}>
              <span>GlowGoodly Express Delivery</span>
              <Sparkles size={14} color="#f472b6" />
            </div>
            <div style={{ fontSize: "11px", color: "#f472b6", fontWeight: "600" }}>
              Mirpur-2 Hub &rarr; Courier Hub &rarr; Assign for Delivery
            </div>
          </div>
        </div>

        {/* Live Active Status Indicator */}
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            backgroundColor: "rgba(16, 185, 129, 0.12)",
            border: "1px solid rgba(52, 211, 153, 0.4)",
            padding: "5px 14px",
            borderRadius: "999px",
            fontSize: "11.5px",
            fontWeight: "800",
            color: "#34d399",
            backdropFilter: "blur(6px)",
          }}
        >
          <span
            style={{
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              backgroundColor: "#10b981",
              animation: "pulseDot 1.8s infinite",
              display: "inline-block",
            }}
          />
          <span>Stage {currentStep + 1} of 5: {steps[currentStep].label}</span>
        </div>
      </div>

      {/* 🛣️ THE HIGHWAY & DOORSTEP DELIVERY TRACK */}
      <div
        style={{
          position: "relative",
          height: "94px",
          backgroundColor: "#060911",
          borderRadius: "16px",
          border: "1px solid #1e293b",
          display: "flex",
          alignItems: "center",
          overflow: "hidden",
          margin: "12px 0 20px 0",
          boxShadow: "inset 0 4px 16px rgba(0,0,0,0.8), 0 2px 8px rgba(0,0,0,0.2)"
        }}
      >
        {/* Top & Bottom Neon Curbs */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "3px",
            background: "linear-gradient(90deg, #e52860 0%, #db2777 50%, #38bdf8 100%)",
            boxShadow: "0 0 8px #e52860"
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: "3px",
            background: "linear-gradient(90deg, #e52860 0%, #a855f7 50%, #10b981 100%)",
            boxShadow: "0 0 8px #10b981"
          }}
        />

        {/* Animated Dashed Lane Marker */}
        <div
          className="road-stripes"
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            height: "3px",
            top: "calc(50% + 2px)",
            opacity: 0.85,
          }}
        />

        {/* Checkpoint Ground Markers */}
        {[
          { step: 0, pos: "10%", label: "1" },
          { step: 1, pos: "27%", label: "2" },
          { step: 2, pos: "44%", label: "3" },
          { step: 3, pos: "61%", label: "4" },
        ].map((cp) => (
          <div
            key={cp.step}
            style={{
              position: "absolute",
              left: cp.pos,
              top: "calc(50% - 9px)",
              transform: "translateX(-50%)",
              width: "22px",
              height: "22px",
              borderRadius: "50%",
              backgroundColor: currentStep === cp.step ? "rgba(229, 40, 96, 0.45)" : currentStep > cp.step ? "rgba(16, 185, 129, 0.25)" : "rgba(255, 255, 255, 0.08)",
              border: currentStep === cp.step ? "1.5px solid #f472b6" : currentStep > cp.step ? "1px solid #34d399" : "1px dashed rgba(255, 255, 255, 0.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "10px",
              fontWeight: "900",
              color: currentStep === cp.step ? "#ffffff" : currentStep > cp.step ? "#34d399" : "#64748b",
              zIndex: 3,
              pointerEvents: "none",
              boxShadow: currentStep === cp.step ? "0 0 10px rgba(244, 114, 182, 0.6)" : "none"
            }}
          >
            {currentStep > cp.step ? "✓" : cp.label}
          </div>
        ))}

        {/* Subtle Speed Streaks behind vehicle */}
        <div
          style={{
            position: "absolute",
            left: `calc(${getCarPosition(currentStep)} - 80px)`,
            top: "38px",
            display: "flex",
            gap: "5px",
            opacity: currentStep >= 3 ? 0 : 0.85,
            transition: "all 0.85s cubic-bezier(0.34, 1.4, 0.64, 1)",
            pointerEvents: "none",
          }}
        >
          <span style={{ width: "22px", height: "2px", backgroundColor: "#f472b6", borderRadius: "2px", animation: "speedLine 0.8s infinite" }} />
          <span style={{ width: "14px", height: "2px", backgroundColor: "#ec4899", borderRadius: "2px", animation: "speedLine 0.8s 0.2s infinite" }} />
          <span style={{ width: "8px", height: "2px", backgroundColor: "#fda4af", borderRadius: "2px", animation: "speedLine 0.8s 0.4s infinite" }} />
        </div>

        {/* 🚗 MODERN SLEEK DELIVERY CAR WITH 'GlowGoodly' ON THE VEHICLE */}
        <div
          className={currentStep >= 3 ? "car-on-step4" : ""}
          style={{
            position: "absolute",
            left: getCarPosition(currentStep),
            top: "calc(50% - 22px)",
            transform: "translateX(-50%)",
            transition: "all 0.85s cubic-bezier(0.34, 1.4, 0.64, 1)",
            zIndex: 10,
            animation: currentStep >= 3 ? "none" : "carSuspension 0.8s ease-in-out infinite",
            filter: "drop-shadow(0 6px 16px rgba(229, 40, 96, 0.55))",
            pointerEvents: "none",
            opacity: 1,
          }}
        >
          <svg width="128" height="44" viewBox="0 0 140 48" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="bodyGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ff2a7a" />
                <stop offset="45%" stopColor="#e52860" />
                <stop offset="100%" stopColor="#9d174d" />
              </linearGradient>

              <linearGradient id="cabinGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#f43f5e" />
                <stop offset="100%" stopColor="#be123c" />
              </linearGradient>

              <linearGradient id="glassGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#e0f2fe" stopOpacity="0.95" />
                <stop offset="100%" stopColor="#7dd3fc" stopOpacity="0.75" />
              </linearGradient>

              <linearGradient id="beamGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#fef08a" stopOpacity="0.8" />
                <stop offset="60%" stopColor="#fde047" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#fef9c3" stopOpacity="0" />
              </linearGradient>
            </defs>

            {/* Glowing Golden Headlight Cone casting ahead */}
            <polygon
              points="122,25 140,16 140,38 122,31"
              fill="url(#beamGradient)"
              style={{ animation: "headlightFlicker 1.4s ease-in-out infinite" }}
            />

            {/* Roof Aerodynamic Parcel Rack / Wing */}
            <rect x="18" y="4" width="46" height="3.5" rx="1.5" fill="#ffffff" opacity="0.85" />
            <line x1="26" y1="7.5" x2="26" y2="9.5" stroke="#ffffff" strokeWidth="1.5" />
            <line x1="56" y1="7.5" x2="56" y2="9.5" stroke="#ffffff" strokeWidth="1.5" />

            {/* Van Cargo Body */}
            <rect x="8" y="8" width="78" height="28" rx="6" fill="url(#bodyGradient)" stroke="#ffffff" strokeWidth="1.6" />

            {/* Body Highlight Streak */}
            <line x1="12" y1="12" x2="82" y2="12" stroke="rgba(255, 255, 255, 0.45)" strokeWidth="1.2" strokeLinecap="round" />

            {/* Van Cabin Front */}
            <path d="M86 14 H108 L122 25 V36 H86 V14 Z" fill="url(#cabinGradient)" stroke="#ffffff" strokeWidth="1.6" />

            {/* Windshield Glass */}
            <path d="M90 16 H106 L117 25 H90 V16 Z" fill="url(#glassGradient)" stroke="rgba(255, 255, 255, 0.6)" strokeWidth="1" />

            {/* Side Cabin Door Seam */}
            <line x1="86" y1="14" x2="86" y2="36" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" />

            {/* Front & Rear Chrome Bumpers */}
            <rect x="120" y="32" width="6" height="4" rx="2" fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="0.8" />
            <rect x="4" y="32" width="5" height="4" rx="2" fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="0.8" />

            {/* Headlight Gem */}
            <circle cx="121" cy="28" r="3" fill="#fef08a" stroke="#ffffff" strokeWidth="1" />

            {/* Red LED Taillight */}
            <rect x="5" y="13" width="3" height="8" rx="1.5" fill="#ef4444" stroke="#ffffff" strokeWidth="0.8" />

            {/* 🌟 BRAND NAME 'GlowGoodly' PROUDLY DISPLAYED ON THE CAR */}
            <g transform="translate(47, 26)">
              <text x="-34" y="-1" fill="#fef08a" fontSize="8" fontWeight="900">✦</text>
              <text
                x="2"
                y="0"
                fill="#ffffff"
                fontSize="11"
                fontWeight="900"
                fontFamily="'Montserrat', 'Inter', sans-serif"
                textAnchor="middle"
                letterSpacing="0.6"
              >
                GlowGoodly
              </text>
            </g>

            {/* ⚙️ Front Wheel & Spokes */}
            <g transform="translate(105, 37)">
              <circle cx="0" cy="0" r="8.5" fill="#0f172a" stroke="#ffffff" strokeWidth="1.8" />
              <circle cx="0" cy="0" r="4.5" fill="#e2e8f0" />
              <circle cx="0" cy="0" r="2" fill="#e52860" />
              <g className={currentStep >= 3 ? "" : "wheel-rotate"}>
                <line x1="-3.5" y1="0" x2="3.5" y2="0" stroke="#64748b" strokeWidth="1" />
                <line x1="0" y1="-3.5" x2="0" y2="3.5" stroke="#64748b" strokeWidth="1" />
              </g>
            </g>

            {/* ⚙️ Rear Wheel & Spokes */}
            <g transform="translate(30, 37)">
              <circle cx="0" cy="0" r="8.5" fill="#0f172a" stroke="#ffffff" strokeWidth="1.8" />
              <circle cx="0" cy="0" r="4.5" fill="#e2e8f0" />
              <circle cx="0" cy="0" r="2" fill="#e52860" />
              <g className={currentStep >= 3 ? "" : "wheel-rotate"}>
                <line x1="-3.5" y1="0" x2="3.5" y2="0" stroke="#64748b" strokeWidth="1" />
                <line x1="0" y1="-3.5" x2="0" y2="3.5" stroke="#64748b" strokeWidth="1" />
              </g>
            </g>
          </svg>
        </div>

        {/* 🏡 STEP 5: DOORSTEP HANDOVER SCENE WITH 'GlowGoodly' ON DELIVERY BOX & BAG */}
        <div
          className="handover-scene-wrapper"
          style={{
            position: "absolute",
            right: "10px",
            top: "calc(50% - 38px)",
            zIndex: 12,
            transition: "all 0.5s ease-in-out",
            opacity: currentStep === 4 ? 1 : 0.45,
            filter: currentStep === 4 ? "drop-shadow(0 0 12px rgba(244, 114, 182, 0.4))" : "grayscale(0.4)",
            pointerEvents: "none",
          }}
        >
          <svg width="176" height="76" viewBox="0 0 176 76" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="deliveryBagGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ff2a7a" />
                <stop offset="60%" stopColor="#e52860" />
                <stop offset="100%" stopColor="#9d174d" />
              </linearGradient>
              <linearGradient id="doorGlowGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#831843" stopOpacity="0.85" />
                <stop offset="100%" stopColor="#1e1b4b" stopOpacity="0.95" />
              </linearGradient>
              <linearGradient id="customerDressGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#c084fc" />
                <stop offset="100%" stopColor="#9333ea" />
              </linearGradient>
              <linearGradient id="parcelBoxGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#fbbf24" />
                <stop offset="100%" stopColor="#d97706" />
              </linearGradient>
            </defs>

            {/* 🏠 House Entrance / Doorway */}
            <g transform="translate(138, 6)">
              {/* Warm Doorway */}
              <rect x="0" y="2" width="34" height="66" rx="4" fill="url(#doorGlowGrad)" stroke="#f472b6" strokeWidth="1.2" />
              {/* Door Glass Panels */}
              <rect x="4" y="8" width="26" height="24" rx="2" fill="rgba(255,255,255,0.06)" stroke="rgba(244,114,182,0.3)" strokeWidth="0.8" />
              <rect x="4" y="36" width="26" height="26" rx="2" fill="rgba(255,255,255,0.06)" stroke="rgba(244,114,182,0.3)" strokeWidth="0.8" />
              {/* Golden Doorknob */}
              <circle cx="5" cy="34" r="1.8" fill="#fde047" />
              {/* Warm Porch Light */}
              <circle cx="17" cy="0" r="3" fill="#fde047" filter="drop-shadow(0 0 6px #fde047)" />
              {/* Welcome Mat */}
              <rect x="-8" y="64" width="46" height="4" rx="2" fill="#e52860" opacity="0.9" />
              <text x="15" y="67.2" fill="#ffffff" fontSize="3.2" fontWeight="900" textAnchor="middle">WELCOME</text>
            </g>

            {/* 💖 FLOATING HEART & SPARKLES ABOVE PARCEL HANDOVER */}
            {currentStep === 4 && (
              <g>
                <g style={{ animation: "floatHeart 2s ease-out infinite" }}>
                  <path
                    d="M80 22 C80 19.5 77.5 17.5 75.5 19.5 C73.5 21.5 75.5 24.5 80 28 C84.5 22.5 86.5 19.5 84.5 17.5 C82.5 17.5 80 19.5 80 22 Z"
                    fill="#f43f5e"
                  />
                </g>
                <g style={{ animation: "sparkleTwinkle 1.8s ease-in-out infinite" }}>
                  <path d="M92 19 L93.2 16 L94.4 19 L97 20 L94.4 21 L93.2 24 L92 21 L89 20 Z" fill="#fde047" />
                </g>
                <g style={{ animation: "sparkleTwinkle 1.8s 0.9s ease-in-out infinite" }}>
                  <path d="M68 23 L69 20.5 L70 23 L72.5 24 L70 25 L69 27.5 L68 25 L65.5 24 Z" fill="#38bdf8" />
                </g>
              </g>
            )}

            {/* 📦 THE DELIVERY BOX WITH 'GlowGoodly' CLEARLY WRITTEN ON IT */}
            <g transform="translate(66, 35)" style={{ animation: currentStep === 4 ? "handoverGentle 2s ease-in-out infinite" : "none" }}>
              {/* Delivery Parcel Box */}
              <rect x="0" y="2" width="30" height="20" rx="3" fill="url(#parcelBoxGrad)" stroke="#92400e" strokeWidth="1.2" />
              {/* Box Top Lid Flap */}
              <rect x="-1" y="0" width="32" height="4.5" rx="1.5" fill="#f59e0b" stroke="#78350f" strokeWidth="0.8" />
              {/* Ribbon Accent */}
              <rect x="2" y="0" width="3" height="22" fill="#e52860" />
              <rect x="0" y="8" width="30" height="2.5" fill="#f472b6" opacity="0.8" />
              {/* Pink Bow on top */}
              <path d="M1 -2 C3 -4.5 4.5 -2 4.5 0 C4.5 -2 6 -4.5 8 -2 C6 0 4 0 1 -2 Z" fill="#f472b6" />

              {/* 🌟 'GlowGoodly' WRITTEN DIRECTLY ON THE DELIVERY BOX */}
              <g transform="translate(6, 9)">
                {/* Brand label plate on parcel */}
                <rect x="0" y="0" width="22" height="11" rx="2" fill="#831843" stroke="#f472b6" strokeWidth="0.6" />
                {/* Mini Star */}
                <text x="11" y="4.2" fill="#fde047" fontSize="3.8" fontWeight="900" textAnchor="middle">✦</text>
                {/* GlowGoodly text */}
                <text
                  x="11"
                  y="8.8"
                  fill="#ffffff"
                  fontSize="4.2"
                  fontWeight="900"
                  fontFamily="'Montserrat', 'Inter', system-ui, sans-serif"
                  textAnchor="middle"
                  letterSpacing="0.2"
                >
                  GlowGoodly
                </text>
              </g>
            </g>

            {/* 🧍‍♀️ THE CUSTOMER (RIGHT SIDE, RECEIVING PARCEL WITH OPEN HANDS) */}
            <g transform="translate(110, 16)">
              {/* Head & Hair */}
              <circle cx="8" cy="8" r="7.5" fill="#fed7aa" />
              <path d="M2 7 C2 1 14 1 14 7 C14 11 12 14 10 14 L4 14 Z" fill="#3b0764" />
              <circle cx="14" cy="5" r="3.5" fill="#3b0764" />
              {/* Happy Smiling Eye & Blush */}
              <path d="M5 8 Q6 10 7 8" stroke="#3b0764" strokeWidth="1.2" fill="none" strokeLinecap="round" />
              <circle cx="5" cy="10" r="1.2" fill="#fda4af" />

              {/* Dress / Body */}
              <path d="M4 16 L12 16 L15 41 L1 41 Z" fill="url(#customerDressGrad)" stroke="#ffffff" strokeWidth="0.8" />

              {/* Legs & Shoes */}
              <line x1="5" y1="41" x2="5" y2="54" stroke="#fed7aa" strokeWidth="2.5" />
              <ellipse cx="4" cy="54" rx="3.5" ry="2" fill="#e52860" />
              <line x1="11" y1="41" x2="11" y2="54" stroke="#fed7aa" strokeWidth="2.5" />
              <ellipse cx="10" cy="54" rx="3.5" ry="2" fill="#e52860" />

              {/* Arms Extended to RECEIVE THE PARCEL INTO HER HANDS */}
              <path
                d="M4 22 L-6 27 L-14 27"
                stroke="#fed7aa"
                strokeWidth="3.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {/* Customer's Hands holding underside & right side of delivery box */}
              <circle cx="-14" cy="27" r="2.5" fill="#fed7aa" stroke="#f472b6" strokeWidth="0.8" />
              {/* Sleeve */}
              <path d="M4 22 L-2 24" stroke="#a855f7" strokeWidth="4" strokeLinecap="round" />
            </g>

            {/* 🧍‍♂️ THE DELIVERYMAN (LEFT SIDE, HANDING PARCEL TO CUSTOMER) */}
            <g transform="translate(16, 16)">
              {/* 🎒 DELIVERYMAN'S COURIER BAG WITH 'GlowGoodly' PROMINENTLY WRITTEN */}
              <g transform="translate(0, 11)">
                {/* Bag Body */}
                <rect
                  x="0"
                  y="0"
                  width="32"
                  height="27"
                  rx="6"
                  fill="url(#deliveryBagGrad)"
                  stroke="#ffffff"
                  strokeWidth="1.4"
                  filter="drop-shadow(0 3px 8px rgba(229, 40, 96, 0.6))"
                />
                {/* Reflective Safety Stripe */}
                <rect x="0" y="20" width="32" height="3" fill="#fde047" opacity="0.95" />
                {/* Bag Handle */}
                <rect x="9" y="-3" width="14" height="3" rx="1.5" fill="#be123c" stroke="#ffffff" strokeWidth="0.8" />
                {/* Front Storage Flap */}
                <rect x="2" y="4" width="28" height="14" rx="3" fill="#831843" stroke="rgba(255,255,255,0.5)" strokeWidth="0.8" />
                
                {/* Mini Gold Star */}
                <text x="16" y="8.5" fill="#fde047" fontSize="4.5" fontWeight="900" textAnchor="middle">✦</text>
                
                {/* 🌟 'GlowGoodly' WRITTEN DIRECTLY ON DELIVERYMAN'S BAG */}
                <text
                  x="16"
                  y="14.8"
                  fill="#ffffff"
                  fontSize="5.2"
                  fontWeight="900"
                  fontFamily="'Montserrat', 'Inter', system-ui, sans-serif"
                  textAnchor="middle"
                  letterSpacing="0.2"
                >
                  GlowGoodly
                </text>
              </g>

              {/* Deliveryman Body / Uniform Jacket */}
              <rect x="22" y="16" width="16" height="23" rx="4" fill="#0f172a" stroke="#e52860" strokeWidth="1.2" />
              {/* Pink Uniform Trim Line */}
              <line x1="30" y1="16" x2="30" y2="39" stroke="#e52860" strokeWidth="1.5" />

              {/* Legs & Sport Sneakers */}
              <line x1="26" y1="39" x2="26" y2="54" stroke="#1e293b" strokeWidth="3.5" strokeLinecap="round" />
              <rect x="23" y="52" width="7" height="3" rx="1.5" fill="#ffffff" stroke="#cbd5e1" strokeWidth="0.8" />
              <line x1="34" y1="39" x2="34" y2="54" stroke="#1e293b" strokeWidth="3.5" strokeLinecap="round" />
              <rect x="31" y="52" width="7" height="3" rx="1.5" fill="#ffffff" stroke="#cbd5e1" strokeWidth="0.8" />

              {/* Head & Smiling Face */}
              <circle cx="30" cy="8" r="7.5" fill="#fed7aa" />
              {/* Delivery Cap */}
              <path d="M24 6 C24 1 36 1 36 6 Z" fill="#e52860" />
              {/* Cap Visor */}
              <path d="M31 5 L39 5 L37 7 L31 7 Z" fill="#ffffff" />
              {/* Eye Smiling */}
              <path d="M31 8 Q32 10 33 8" stroke="#0f172a" strokeWidth="1.2" fill="none" strokeLinecap="round" />

              {/* Arm Extending Forward GIVING PARCEL TO CUSTOMER */}
              <path
                d="M30 22 L40 27 L50 27"
                stroke="#fed7aa"
                strokeWidth="3.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {/* Deliveryman's Hand holding left side of delivery box */}
              <circle cx="50" cy="27" r="2.5" fill="#fed7aa" stroke="#e52860" strokeWidth="0.8" />
              {/* Uniform Sleeve */}
              <path d="M30 22 L36 24" stroke="#0f172a" strokeWidth="4" strokeLinecap="round" />
            </g>

            {/* Status Pill Badge at top center during Step 5 */}
            {currentStep === 4 && (
              <g transform="translate(52, 2)">
                <rect x="0" y="0" width="76" height="13" rx="6.5" fill="rgba(16, 185, 129, 0.95)" stroke="#ffffff" strokeWidth="0.8" />
                <text x="38" y="9.2" fill="#ffffff" fontSize="6.8" fontWeight="900" textAnchor="middle" letterSpacing="0.3">
                  ✓ Doorstep Handover!
                </text>
              </g>
            )}
          </svg>
        </div>
      </div>

      {/* 5 Premium Milestone Cards in Strict 5-Column Grid */}
      <div className="milestone-grid" style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "8px" }}>
        {steps.map((s) => {
          const isCurrent = currentStep === s.id;
          const isCompleted = currentStep > s.id;
          return (
            <div
              key={s.id}
              onClick={() => setCurrentStep(s.id)}
              style={{
                backgroundColor: isCurrent
                  ? "rgba(229, 40, 96, 0.25)"
                  : isCompleted
                  ? "rgba(16, 185, 129, 0.1)"
                  : "rgba(255, 255, 255, 0.03)",
                border: isCurrent
                  ? "1.5px solid #f472b6"
                  : isCompleted
                  ? "1px solid rgba(52, 211, 153, 0.45)"
                  : "1px solid rgba(255, 255, 255, 0.08)",
                borderRadius: "12px",
                padding: "10px 10px",
                cursor: "pointer",
                transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
                textAlign: "left",
                position: "relative",
                backdropFilter: "blur(6px)",
                boxShadow: isCurrent ? "0 4px 16px rgba(229, 40, 96, 0.25)" : "none",
              }}
            >
              {/* Top indicator row */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                <span style={{ fontSize: "17px" }}>{s.icon}</span>
                <span
                  style={{
                    fontSize: "9px",
                    fontWeight: "800",
                    color: isCurrent ? "#f472b6" : isCompleted ? "#34d399" : "#64748b",
                    backgroundColor: isCurrent ? "rgba(244, 114, 182, 0.2)" : isCompleted ? "rgba(52, 211, 153, 0.15)" : "transparent",
                    padding: "2px 5px",
                    borderRadius: "4px",
                    textTransform: "uppercase",
                    letterSpacing: "0.3px",
                  }}
                >
                  {isCurrent ? "Active" : isCompleted ? "Done" : s.tag}
                </span>
              </div>

              {/* Title */}
              <div style={{ fontSize: "11.5px", fontWeight: "800", color: isCurrent ? "#ffffff" : isCompleted ? "#f1f5f9" : "#94a3b8", lineHeight: 1.25 }}>
                {s.label}
              </div>

              {/* Subtext */}
              <div style={{ fontSize: "9.5px", color: isCurrent ? "#fbcfe8" : "#64748b", marginTop: "2px", lineHeight: 1.25 }}>
                {s.sub}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
