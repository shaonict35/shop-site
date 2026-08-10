"use client";

import React from "react";
import Header from "../../components/Header";
import PageBanner from "../../components/PageBanner";
import Footer from "../../components/Footer";
import MobileNavbar from "../../components/MobileNavbar";

export default function JoinTeamPage() {
  const jobs = [
    {
      id: 1,
      role: "Beauty Advisor / Consultant",
      type: "Full Time (Dhaka Outlet)",
      department: "Retail Sales",
      requirements: "Experienced in retail cosmetic sales, dermatology knowledge is a plus, excellent communication skills."
    },
    {
      id: 2,
      role: "Content Creator / Copywriter",
      type: "Full Time / Remote",
      department: "Marketing",
      requirements: "Proficient in writing engaging skincare and cosmetic reviews, social media post copy, and blog writing."
    },
    {
      id: 3,
      role: "Logistics Specialist",
      type: "Full Time (Warehouse)",
      department: "Operations",
      requirements: "Familiarity with local courier dispatch systems (Steadfast, Pathao), stock management, order wrapping."
    }
  ];

  return (
    <>
      <Header />
      <PageBanner title="JOIN OUR TEAM" />
      <main className="container" style={{ padding: "40px 20px 60px 20px" }}>
        <div style={{ maxWidth: "800px", margin: "0 auto" }}>
          
          <div style={{ textAlign: "center", marginBottom: "40px" }}>
            <h2 style={{ fontSize: "22px", fontWeight: "900", color: "#0e1e38", marginBottom: "12px" }}>
              Build the Future of Beauty eCommerce
            </h2>
            <p style={{ fontSize: "14px", color: "#718096", lineHeight: "1.6", maxWidth: "600px", margin: "0 auto" }}>
              Join GlowGoodly and help millions of customers in Bangladesh find authentic cosmetic and beauty solutions. We offer competitive pay, modern workspaces, and career growth.
            </p>
          </div>

          <h3 style={{ fontSize: "13px", fontWeight: "900", color: "#e52860", textTransform: "uppercase", letterSpacing: "1px", borderBottom: "2px solid #edf2f7", paddingBottom: "10px", marginBottom: "20px" }}>
            OPEN POSITION OPPORTUNITIES
          </h3>

          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            {jobs.map((job) => (
              <div 
                key={job.id} 
                style={{ 
                  backgroundColor: "#ffffff", 
                  border: "1.5px solid #edf2f7", 
                  borderRadius: "10px", 
                  padding: "24px", 
                  boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  flexWrap: "wrap",
                  gap: "20px"
                }}
              >
                <div style={{ flex: 1, minWidth: "260px" }}>
                  <span style={{ fontSize: "10px", backgroundColor: "#fff0f4", color: "#e52860", fontWeight: "800", textTransform: "uppercase", padding: "4px 8px", borderRadius: "4px", display: "inline-block", marginBottom: "8px" }}>
                    {job.department}
                  </span>
                  <h4 style={{ fontSize: "17px", fontWeight: "800", color: "#0e1e38", marginBottom: "6px" }}>{job.role}</h4>
                  <div style={{ fontSize: "12.5px", fontWeight: "700", color: "#4a5568", marginBottom: "12px" }}>{job.type}</div>
                  <p style={{ fontSize: "13px", color: "#718096", lineHeight: "1.6" }}>
                    <strong>Requirements:</strong> {job.requirements}
                  </p>
                </div>
                <button 
                  onClick={() => alert(`Applying for ${job.role}. Please email your CV to career@glowgoodly.com`)}
                  style={{ 
                    backgroundColor: "#e52860", 
                    color: "#ffffff", 
                    border: "none", 
                    padding: "10px 18px", 
                    fontSize: "12.5px", 
                    fontWeight: "800", 
                    borderRadius: "6px", 
                    cursor: "pointer",
                    boxShadow: "0 4px 10px rgba(229,40,96,0.15)",
                    whiteSpace: "nowrap"
                  }}
                >
                  APPLY NOW
                </button>
              </div>
            ))}
          </div>

        </div>
      </main>
      <Footer />
      <MobileNavbar />
    </>
  );
}
