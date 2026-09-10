"use client";

import React, { useState } from "react";
import Header from "../../components/Header";
import PageBanner from "../../components/PageBanner";
import Footer from "../../components/Footer";
import MobileNavbar from "../../components/MobileNavbar";

export default function JoinTeamPage() {
  const [activeDept, setActiveDept] = useState("ALL");
  const [applyingJob, setApplyingJob] = useState<any | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [applicant, setApplicant] = useState({ name: "", email: "", phone: "", cvLink: "", note: "" });

  const perks = [
    { icon: "💰", title: "Competitive Salary", desc: "Above industry-standard pay, festive bonuses & performance incentives." },
    { icon: "💄", title: "Beauty Hampers", desc: "Generous monthly allowance of authentic skincare and cosmetic products." },
    { icon: "📈", title: "Rapid Growth", desc: "Fast-track promotions, mentorship, and cross-functional leadership roles." },
    { icon: "☕", title: "Vibrant Work Culture", desc: "Warm, supportive atmosphere, flexible environment, and modern facilities." },
  ];

  const jobs = [
    {
      id: 1,
      role: "Senior Beauty Advisor & Consultant",
      type: "Full Time",
      location: "Dhaka Flagship Outlet",
      department: "RETAIL SALES",
      experience: "1-2 Years in Cosmetic Sales",
      salary: "BDT 25,000 - 35,000 + Sales Bonus",
      requirements: "Deep understanding of Korean skincare routines, skin types, and active ingredients. Outstanding customer communication and friendly demeanor.",
      responsibilities: "Consult walk-in customers, recommend suitable skincare regimens, manage floor displays, and hit monthly store sales targets."
    },
    {
      id: 2,
      role: "Creative Content Creator & Copywriter",
      type: "Full Time / Hybrid",
      location: "Dhanmondi HQ / Remote",
      department: "MARKETING",
      experience: "1+ Years in Digital Agency or eCommerce",
      salary: "BDT 30,000 - 45,000",
      requirements: "Proven portfolio of engaging beauty Reels, TikToks, and high-converting ad copy. Fluent in Bangla & English copywriting.",
      responsibilities: "Plan editorial content calendars, shoot product demo videos, write catchy captions, and collaborate with top beauty influencers."
    },
    {
      id: 3,
      role: "eCommerce Operations & Logistics Specialist",
      type: "Full Time",
      location: "Central Warehouse, Dhaka",
      department: "OPERATIONS",
      experience: "1+ Years in eCommerce Fulfillment",
      salary: "BDT 22,000 - 30,000",
      requirements: "Hands-on experience with parcel dispatch (Steadfast, Pathao Courier), barcode scanning, and inventory verification.",
      responsibilities: "Ensure zero damage packaging, manage stock inwards/outwards, maintain dispatch timelines, and handle return reconciliations."
    },
    {
      id: 4,
      role: "Full-Stack Web Developer (Next.js & Node.js)",
      type: "Full Time / Remote",
      location: "Remote / Hybrid",
      department: "TECH",
      experience: "2+ Years in React / Next.js / Node.js",
      salary: "BDT 50,000 - 80,000",
      requirements: "Strong proficiency in TypeScript, Next.js App Router, Prisma ORM, MySQL, and REST/GraphQL APIs.",
      responsibilities: "Build high-performance web features, optimize page speed & SEO, integrate payment gateways, and maintain backend stability."
    }
  ];

  const departments = ["ALL", "RETAIL SALES", "MARKETING", "OPERATIONS", "TECH"];

  const filteredJobs = activeDept === "ALL" 
    ? jobs 
    : jobs.filter(j => j.department === activeDept);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setApplyingJob(null);
      setApplicant({ name: "", email: "", phone: "", cvLink: "", note: "" });
    }, 2800);
  };

  return (
    <>
      <Header />
      <PageBanner title="JOIN OUR TEAM" />
      <main className="container" style={{ padding: "40px 20px 70px 20px" }}>
        <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
          
          {/* Animated Hero Header */}
          <div
            style={{
              textAlign: "center",
              marginBottom: "45px",
              padding: "40px 24px",
              borderRadius: "20px",
              background: "linear-gradient(135deg, #0e1e38 0%, #1e293b 100%)",
              color: "#ffffff",
              boxShadow: "0 10px 30px rgba(14,30,56,0.15)",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                position: "absolute",
                top: "-40px",
                right: "-40px",
                width: "180px",
                height: "180px",
                borderRadius: "50%",
                background: "radial-gradient(circle, rgba(229,40,96,0.25) 0%, rgba(229,40,96,0) 70%)",
                animation: "pulseGlow 3s infinite ease-in-out",
                pointerEvents: "none",
              }}
            />

            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "6px 16px",
                backgroundColor: "rgba(229,40,96,0.15)",
                border: "1px solid rgba(229,40,96,0.4)",
                borderRadius: "30px",
                color: "#fda4af",
                fontSize: "11px",
                fontWeight: "800",
                letterSpacing: "1.5px",
                textTransform: "uppercase",
                marginBottom: "16px",
                animation: "badgePulse 2.5s infinite ease-in-out",
              }}
            >
              <span>🚀</span>
              <span>CAREERS AT GLOWGOODLY</span>
            </div>

            <h1
              style={{
                fontSize: "30px",
                fontWeight: "900",
                lineHeight: "1.3",
                marginBottom: "14px",
                fontFamily: "'Montserrat', sans-serif",
              }}
            >
              Build the Future of Clean Beauty eCommerce 💄
            </h1>
            
            <p
              style={{
                fontSize: "14.5px",
                color: "#cbd5e1",
                lineHeight: "1.7",
                maxWidth: "680px",
                margin: "0 auto",
                fontWeight: "400",
              }}
            >
              Join a team of passionate beauty enthusiasts, engineers, and creators. We are redefining how millions in Bangladesh discover and purchase 100% authentic international skincare.
            </p>
          </div>

          {/* Perks & Benefits Section (Interactive Floating Cards) */}
          <div style={{ marginBottom: "50px" }}>
            <div style={{ textAlign: "center", marginBottom: "26px" }}>
              <span style={{ fontSize: "11px", fontWeight: "800", color: "#e52860", textTransform: "uppercase", letterSpacing: "1.5px" }}>
                WHY YOU WILL LOVE WORKING HERE
              </span>
              <h2 style={{ fontSize: "22px", fontWeight: "900", color: "#0e1e38", marginTop: "4px" }}>
                Perks & Culture at GlowGoodly
              </h2>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "18px" }}>
              {perks.map((p, idx) => (
                <div
                  key={idx}
                  className="glow-card-interactive"
                  style={{
                    backgroundColor: "#ffffff",
                    borderRadius: "14px",
                    padding: "24px 20px",
                    border: "1px solid #f1f5f9",
                    boxShadow: "0 4px 15px rgba(0,0,0,0.02)",
                    textAlign: "center",
                  }}
                >
                  <div style={{ fontSize: "32px", marginBottom: "12px", animation: "floatSoft 3s ease-in-out infinite", animationDelay: `${idx * 0.3}s` }}>
                    {p.icon}
                  </div>
                  <h3 style={{ fontSize: "16px", fontWeight: "800", color: "#0e1e38", marginBottom: "8px" }}>
                    {p.title}
                  </h3>
                  <p style={{ fontSize: "13px", color: "#64748b", lineHeight: "1.6", margin: 0 }}>
                    {p.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Open Positions Section with Animated Filter Pills */}
          <div style={{ marginBottom: "40px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px", marginBottom: "24px" }}>
              <div>
                <span style={{ fontSize: "11px", fontWeight: "800", color: "#e52860", textTransform: "uppercase", letterSpacing: "1px" }}>
                  CURRENT VACANCIES ({filteredJobs.length})
                </span>
                <h2 style={{ fontSize: "22px", fontWeight: "900", color: "#0e1e38", margin: "2px 0 0 0" }}>
                  Open Career Opportunities
                </h2>
              </div>

              {/* Department Filter Tabs */}
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                {departments.map((dept) => (
                  <button
                    key={dept}
                    onClick={() => setActiveDept(dept)}
                    className="glow-interactive-button"
                    style={{
                      padding: "8px 16px",
                      borderRadius: "20px",
                      border: activeDept === dept ? "none" : "1.5px solid #e2e8f0",
                      backgroundColor: activeDept === dept ? "#e52860" : "#ffffff",
                      color: activeDept === dept ? "#ffffff" : "#475569",
                      fontSize: "11.5px",
                      fontWeight: "800",
                      cursor: "pointer",
                      boxShadow: activeDept === dept ? "0 4px 12px rgba(229,40,96,0.3)" : "none",
                    }}
                  >
                    {dept}
                  </button>
                ))}
              </div>
            </div>

            {/* Job Listings Cards */}
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              {filteredJobs.map((job) => (
                <div 
                  key={job.id} 
                  className="glow-card-interactive"
                  style={{ 
                    backgroundColor: "#ffffff", 
                    border: "1.5px solid #f1f5f9", 
                    borderRadius: "16px", 
                    padding: "26px", 
                    boxShadow: "0 4px 16px rgba(0,0,0,0.03)",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    flexWrap: "wrap",
                    gap: "24px"
                  }}
                >
                  <div style={{ flex: 1, minWidth: "280px" }}>
                    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "10px" }}>
                      <span style={{ fontSize: "11px", backgroundColor: "#fff0f4", color: "#e52860", fontWeight: "900", textTransform: "uppercase", padding: "4px 10px", borderRadius: "20px" }}>
                        {job.department}
                      </span>
                      <span style={{ fontSize: "11px", backgroundColor: "#f1f5f9", color: "#475569", fontWeight: "700", padding: "4px 10px", borderRadius: "20px" }}>
                        📍 {job.location}
                      </span>
                      <span style={{ fontSize: "11px", backgroundColor: "#ecfdf5", color: "#059669", fontWeight: "800", padding: "4px 10px", borderRadius: "20px" }}>
                        💼 {job.type}
                      </span>
                    </div>

                    <h3 style={{ fontSize: "18px", fontWeight: "900", color: "#0e1e38", marginBottom: "8px" }}>
                      {job.role}
                    </h3>
                    
                    <div style={{ fontSize: "13px", fontWeight: "700", color: "#e52860", marginBottom: "12px" }}>
                      💵 {job.salary}
                    </div>

                    <p style={{ fontSize: "13.5px", color: "#64748b", lineHeight: "1.6", marginBottom: "10px" }}>
                      <strong style={{ color: "#0e1e38" }}>যোগ্যতা:</strong> {job.requirements}
                    </p>

                    <p style={{ fontSize: "13.5px", color: "#64748b", lineHeight: "1.6", margin: 0 }}>
                      <strong style={{ color: "#0e1e38" }}>দায়িত্ব:</strong> {job.responsibilities}
                    </p>
                  </div>

                  <button 
                    onClick={() => setApplyingJob(job)}
                    className="glow-interactive-button"
                    style={{ 
                      backgroundColor: "#e52860", 
                      color: "#ffffff", 
                      border: "none", 
                      padding: "12px 26px", 
                      fontSize: "13px", 
                      fontWeight: "800", 
                      borderRadius: "25px", 
                      cursor: "pointer",
                      boxShadow: "0 4px 14px rgba(229,40,96,0.35)",
                      whiteSpace: "nowrap",
                      alignSelf: "center",
                    }}
                  >
                    APPLY NOW →
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Open Application Banner */}
          <div
            style={{
              backgroundColor: "#fff0f5",
              border: "1.5px dashed #f43f5e",
              borderRadius: "16px",
              padding: "28px",
              textAlign: "center",
              marginTop: "40px",
            }}
          >
            <div style={{ fontSize: "28px", marginBottom: "6px" }}>💌</div>
            <h3 style={{ fontSize: "18px", fontWeight: "900", color: "#0e1e38", marginBottom: "6px" }}>
              Don't See Your Exact Role?
            </h3>
            <p style={{ fontSize: "13.5px", color: "#64748b", maxWidth: "550px", margin: "0 auto 16px auto", lineHeight: "1.6" }}>
              We are constantly seeking brilliant talents in makeup artistry, influencer relations, and data analytics. Send your resume directly to our talent acquisition team!
            </p>
            <a
              href="mailto:career@glowgoodly.com?subject=Spontaneous%20Application%20-%20GlowGoodly"
              className="glow-interactive-button"
              style={{
                display: "inline-block",
                backgroundColor: "#0e1e38",
                color: "#ffffff",
                padding: "10px 22px",
                borderRadius: "25px",
                fontWeight: "800",
                fontSize: "12.5px",
                textDecoration: "none",
              }}
            >
              Email Your CV to: career@glowgoodly.com ↗
            </a>
          </div>

        </div>

        {/* Interactive Application Modal */}
        {applyingJob && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(15, 23, 42, 0.7)",
              backdropFilter: "blur(6px)",
              zIndex: 9999,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "20px",
            }}
            onClick={() => setApplyingJob(null)}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                backgroundColor: "#ffffff",
                borderRadius: "20px",
                maxWidth: "520px",
                width: "100%",
                padding: "30px",
                boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)",
                position: "relative",
                animation: "fadeInScale 0.25s ease",
              }}
            >
              <button
                onClick={() => setApplyingJob(null)}
                style={{
                  position: "absolute",
                  top: "18px",
                  right: "18px",
                  background: "none",
                  border: "none",
                  fontSize: "20px",
                  color: "#94a3b8",
                  cursor: "pointer",
                }}
              >
                ✕
              </button>

              <div style={{ fontSize: "11px", fontWeight: "800", color: "#e52860", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "4px" }}>
                APPLICATION FORM
              </div>

              <h3 style={{ fontSize: "20px", fontWeight: "900", color: "#0e1e38", marginBottom: "4px" }}>
                Apply for {applyingJob.role}
              </h3>
              <p style={{ fontSize: "12.5px", color: "#64748b", marginBottom: "20px" }}>
                {applyingJob.location} • {applyingJob.type}
              </p>

              {submitted ? (
                <div style={{ backgroundColor: "#ecfdf5", border: "1.5px solid #10b981", borderRadius: "12px", padding: "24px", textAlign: "center" }}>
                  <div style={{ fontSize: "36px", marginBottom: "10px" }}>🎉</div>
                  <h4 style={{ fontSize: "17px", fontWeight: "900", color: "#065f46", marginBottom: "6px" }}>
                    Application Submitted Successfully!
                  </h4>
                  <p style={{ fontSize: "13px", color: "#047857", lineHeight: "1.6", margin: 0 }}>
                    Thank you for applying. Our talent acquisition team will review your details and reach out via phone or email shortly.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleFormSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                  <div>
                    <label style={{ fontSize: "12px", fontWeight: "700", color: "#334155", display: "block", marginBottom: "4px" }}>
                      Full Name (আপনার পূর্ণ নাম) *
                    </label>
                    <input
                      type="text"
                      required
                      value={applicant.name}
                      onChange={(e) => setApplicant({ ...applicant, name: e.target.value })}
                      placeholder="e.g. Shaon Khan"
                      style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px", outline: "none", boxSizing: "border-box" }}
                    />
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                    <div>
                      <label style={{ fontSize: "12px", fontWeight: "700", color: "#334155", display: "block", marginBottom: "4px" }}>
                        Phone Number *
                      </label>
                      <input
                        type="tel"
                        required
                        value={applicant.phone}
                        onChange={(e) => setApplicant({ ...applicant, phone: e.target.value })}
                        placeholder="017XXXXXXXX"
                        style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px", outline: "none", boxSizing: "border-box" }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: "12px", fontWeight: "700", color: "#334155", display: "block", marginBottom: "4px" }}>
                        Email Address *
                      </label>
                      <input
                        type="email"
                        required
                        value={applicant.email}
                        onChange={(e) => setApplicant({ ...applicant, email: e.target.value })}
                        placeholder="you@email.com"
                        style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px", outline: "none", boxSizing: "border-box" }}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: "12px", fontWeight: "700", color: "#334155", display: "block", marginBottom: "4px" }}>
                      CV / Google Drive Link *
                    </label>
                    <input
                      type="url"
                      required
                      value={applicant.cvLink}
                      onChange={(e) => setApplicant({ ...applicant, cvLink: e.target.value })}
                      placeholder="https://drive.google.com/... or LinkedIn"
                      style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px", outline: "none", boxSizing: "border-box" }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: "12px", fontWeight: "700", color: "#334155", display: "block", marginBottom: "4px" }}>
                      Brief Introduction / Note
                    </label>
                    <textarea
                      rows={3}
                      value={applicant.note}
                      onChange={(e) => setApplicant({ ...applicant, note: e.target.value })}
                      placeholder="Tell us why you would be a great fit for GlowGoodly..."
                      style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px", outline: "none", boxSizing: "border-box", resize: "none" }}
                    />
                  </div>

                  <button
                    type="submit"
                    className="glow-interactive-button"
                    style={{
                      backgroundColor: "#e52860",
                      color: "#ffffff",
                      padding: "12px",
                      borderRadius: "10px",
                      border: "none",
                      fontSize: "13.5px",
                      fontWeight: "800",
                      cursor: "pointer",
                      marginTop: "6px",
                      boxShadow: "0 4px 14px rgba(229,40,96,0.35)",
                    }}
                  >
                    SUBMIT APPLICATION 🚀
                  </button>
                </form>
              )}
            </div>
          </div>
        )}

      </main>
      <Footer />
      <MobileNavbar />
    </>
  );
}
