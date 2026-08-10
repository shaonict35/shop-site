"use client";

import Link from "next/link";
import Header from "../components/Header";
import Footer from "../components/Footer";

export default function NotFound() {
  return (
    <>
      <Header />
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "65vh", padding: "60px 20px", textAlign: "center", backgroundColor: "#f8f9fa" }}>
        <div style={{ fontSize: "140px", fontWeight: "950", color: "#e52860", margin: "0", lineHeight: "1", letterSpacing: "-4px" }}>404</div>
        <h2 style={{ fontSize: "22px", fontWeight: "900", color: "#0e1e38", marginTop: "10px", textTransform: "uppercase", letterSpacing: "1px" }}>
          Oops! Page Not Found
        </h2>
        <p style={{ color: "#718096", maxWidth: "480px", margin: "15px 0 35px 0", fontSize: "15px", fontWeight: "600", lineHeight: "1.6" }}>
          The beauty page you are looking for does not exist or has not been created yet in the store database.
        </p>
        <Link 
          href="/" 
          style={{ 
            backgroundColor: "#e52860", 
            color: "#ffffff", 
            padding: "14px 35px", 
            borderRadius: "30px", 
            fontWeight: "800", 
            fontSize: "13px", 
            textTransform: "uppercase", 
            letterSpacing: "1px",
            boxShadow: "0 5px 15px rgba(229,40,96,0.3)",
            transition: "all 0.2s ease" 
          }} 
          className="promo-card-hover"
        >
          Return to Homepage
        </Link>
      </div>
      <Footer />
    </>
  );
}
