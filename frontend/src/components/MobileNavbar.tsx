"use client";

import React from "react";
import Link from "next/link";
import { useApp } from "../context/AppContext";

export default function MobileNavbar() {
  const { cart, setCartOpen } = useApp();

  const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  const handleOpenChat = () => {
    // Scroll or trigger chat widget focus
    const chatBtn = document.querySelector('.chat-widget-toggle-btn') as HTMLElement;
    if (chatBtn) {
      chatBtn.click();
    } else {
      window.location.href = '/contact';
    }
  };

  return (
    <nav className="mobile-bottom-nav">
      <div className="mobile-nav-items">
        {/* 1. HOME */}
        <Link href="/" className="mobile-nav-item">
          <svg fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" width="22" height="22">
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125h4.371m4.371 0h4.371c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21v-5.25c0-.621.504-1.125 1.125-1.125h5.25c.621 0 1.125.504 1.125 1.125V21"></path>
          </svg>
          <span style={{ fontSize: "10px", fontWeight: "800", textTransform: "uppercase", letterSpacing: "0.4px" }}>HOME</span>
        </Link>

        {/* 2. BRANDS */}
        <Link href="/brands" className="mobile-nav-item">
          <svg fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" width="22" height="22">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z"></path>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z"></path>
          </svg>
          <span style={{ fontSize: "10px", fontWeight: "800", textTransform: "uppercase", letterSpacing: "0.4px" }}>BRANDS</span>
        </Link>

        {/* 3. CATEGORIES */}
        <Link href="/shop" className="mobile-nav-item">
          <svg fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" width="22" height="22">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z"></path>
          </svg>
          <span style={{ fontSize: "10px", fontWeight: "800", textTransform: "uppercase", letterSpacing: "0.4px" }}>CATEGORIES</span>
        </Link>

        {/* 4. CART */}
        <div className="mobile-nav-item" onClick={() => setCartOpen(true)} style={{ position: "relative" }}>
          <svg fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" width="22" height="22">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007z"></path>
          </svg>
          <span style={{ fontSize: "10px", fontWeight: "800", textTransform: "uppercase", letterSpacing: "0.4px" }}>CART</span>
          <span className="badge" style={{ backgroundColor: "#e52860", color: "#ffffff", fontSize: "10px", fontWeight: "900", width: "16px", height: "16px", borderRadius: "50%", position: "absolute", top: "-4px", right: "8px", display: "flex", alignItems: "center", justifyContent: "center" }}>
            {cartCount}
          </span>
        </div>

        {/* 5. CHAT */}
        <div className="mobile-nav-item" onClick={handleOpenChat}>
          <svg fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" width="22" height="22">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.008v.008H8.625V12zm4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.008v.008H12.75V12zm4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.008v.008H16.875V12zM21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a.75.75 0 01-.816-.957 6.37 6.37 0 001.378-2.613A8.103 8.103 0 013 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z"></path>
          </svg>
          <span style={{ fontSize: "10px", fontWeight: "800", textTransform: "uppercase", letterSpacing: "0.4px" }}>CHAT</span>
        </div>
      </div>
    </nav>
  );
}
