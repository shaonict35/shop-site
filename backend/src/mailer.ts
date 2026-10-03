import nodemailer from "nodemailer";
import db from "./firebase";

// Helper to get active SMTP configuration (checks database settings first, then falls back to process.env)
export const getActiveSmtpConfig = async () => {
  let host = process.env.SMTP_HOST || "mail.glowgoodly.com";
  let port = parseInt(process.env.SMTP_PORT || "465", 10);
  let user = process.env.SMTP_USER || "support@glowgoodly.com";
  let pass = process.env.SMTP_PASS || "";
  let fromAddress = process.env.SMTP_FROM_EMAIL || `"GlowGoodly Official" <${user}>`;

  try {
    if (db) {
      const snap = await db.collection("settings").get();
      snap.forEach((doc: any) => {
        const data = doc.data();
        if (data?.key === "SMTP_HOST" && data.value) host = data.value.trim();
        if (data?.key === "SMTP_PORT" && data.value) port = parseInt(data.value.trim(), 10) || 465;
        if (data?.key === "SMTP_USER" && data.value) user = data.value.trim();
        if (data?.key === "SMTP_PASS" && data.value) pass = data.value.trim();
        if (data?.key === "SMTP_FROM_EMAIL" && data.value) fromAddress = data.value.trim();
      });
    }
  } catch (err) {
    console.warn("Could not read SMTP from settings table, using .env fallback:", err);
  }

  return { host, port, user, pass, fromAddress };
};

// SMTP Transporter Creator
export const getTransporter = (overrideConfig?: { host?: string; port?: number; user?: string; pass?: string }) => {
  const host = overrideConfig?.host || process.env.SMTP_HOST || "mail.glowgoodly.com";
  const port = overrideConfig?.port || parseInt(process.env.SMTP_PORT || "465", 10);
  const user = overrideConfig?.user || process.env.SMTP_USER || "support@glowgoodly.com";
  const pass = overrideConfig?.pass !== undefined ? overrideConfig.pass : (process.env.SMTP_PASS || "");

  const isSecure = port === 465;

  return nodemailer.createTransport({
    host,
    port,
    secure: isSecure, // true for 465 (SSL), false for 587 or 25 (TLS/STARTTLS)
    auth: pass ? { user, pass } : undefined,
    tls: {
      rejectUnauthorized: false, // Critical for shared hosting & cPanel self-signed SSL certificates
    },
    connectionTimeout: 10000, // 10s connection timeout to avoid hanging requests
    greetingTimeout: 10000,
    socketTimeout: 15000,
  });
};

/**
 * Test SMTP Connection & Send Test Email
 */
export async function testSmtpConnection(testRecipient: string, customConfig?: { host?: string; port?: number; user?: string; pass?: string; fromAddress?: string }) {
  const active = customConfig || await getActiveSmtpConfig();
  const transporter = getTransporter(active);

  // 1. Verify credentials and handshake
  await transporter.verify();

  // 2. Send test verification email
  const from = active.fromAddress || `"GlowGoodly System Test" <${active.user || "support@glowgoodly.com"}>`;
  const info = await transporter.sendMail({
    from,
    to: testRecipient,
    subject: "✅ GlowGoodly Hosting SMTP Connection Successful!",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
        <div style="background: linear-gradient(135deg, #059669, #10b981); padding: 24px; text-align: center; color: #ffffff;">
          <h2 style="margin: 0; font-size: 22px;">⚡ SMTP Connection Verified</h2>
          <p style="margin: 6px 0 0 0; font-size: 14px; opacity: 0.95;">GlowGoodly Hosting Email Gateway is working perfectly!</p>
        </div>
        <div style="padding: 24px; color: #334155; line-height: 1.6;">
          <p>Hello Admin,</p>
          <p>This is a test email confirming that your <strong>Hosting SMTP configuration</strong> is successfully linked and operational.</p>
          <div style="background-color: #f8fafc; border: 1px solid #cbd5e1; padding: 14px; border-radius: 8px; font-size: 13px;">
            <p style="margin: 4px 0;"><strong>SMTP Host:</strong> ${active.host}</p>
            <p style="margin: 4px 0;"><strong>SMTP Port:</strong> ${active.port} (${active.port === 465 ? "SSL" : "TLS"})</p>
            <p style="margin: 4px 0;"><strong>User / Sender:</strong> ${active.user}</p>
            <p style="margin: 4px 0;"><strong>Handshake Time:</strong> ${new Date().toLocaleString()}</p>
          </div>
          <p style="margin-top: 16px; font-size: 13px; color: #059669; font-weight: bold;">
            Customer purchase invoice receipts will now be delivered automatically from this hosting mailbox.
          </p>
        </div>
      </div>
    `
  });

  return info;
}

/**
 * 1. Send Login Credentials to Newly Created User/Staff
 */
export async function sendWelcomeUserEmail(toEmail: string, name: string, tempPass: string, role: string) {
  try {
    const config = await getActiveSmtpConfig();
    const transporter = getTransporter(config);
    const fromAddress = config.fromAddress || `"GlowGoodly Support" <${config.user || "support@glowgoodly.com"}>`;

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; background-color: #ffffff;">
        <div style="background: linear-gradient(135deg, #e63b7a, #ff758c); padding: 24px; text-align: center; color: #ffffff;">
          <h1 style="margin: 0; font-size: 24px; font-weight: 800;">GlowGoodly Portal Access</h1>
          <p style="margin-top: 6px; font-size: 14px; opacity: 0.9;">Welcome to the GlowGoodly Team</p>
        </div>
        <div style="padding: 24px; color: #334155;">
          <h2 style="font-size: 18px; color: #0f172a; margin-top: 0;">Hello ${name},</h2>
          <p style="font-size: 14px; line-height: 1.6;">An account has been created for you on <strong>GlowGoodly</strong> as a <strong>${role}</strong>. Below are your login credentials:</p>
          
          <div style="background-color: #f8fafc; border: 1px solid #cbd5e1; padding: 16px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 4px 0; font-size: 14px;"><strong>Email ID:</strong> ${toEmail}</p>
            <p style="margin: 4px 0; font-size: 14px;"><strong>Password:</strong> <span style="color: #e63b7a; font-weight: bold;">${tempPass}</span></p>
            <p style="margin: 4px 0; font-size: 14px;"><strong>Role:</strong> ${role}</p>
          </div>

          <p style="font-size: 13px; color: #64748b;">Please change your password after logging in for security.</p>
          
          <div style="text-align: center; margin-top: 24px;">
            <a href="https://glowgoodly.com/admin" style="background-color: #e63b7a; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 14px; display: inline-block;">Login to Admin Panel</a>
          </div>
        </div>
        <div style="background-color: #f1f5f9; padding: 16px; text-align: center; font-size: 12px; color: #64748b;">
          &copy; 2026 GlowGoodly Bangladesh. All rights reserved. | Contact: support@glowgoodly.com
        </div>
      </div>
    `;

    await transporter.sendMail({
      from: fromAddress,
      to: toEmail,
      subject: "🔑 Your GlowGoodly Account Login Credentials",
      html: htmlContent,
      replyTo: config.user || "support@glowgoodly.com",
      headers: {
        "X-Mailer": "Nodemailer GlowGoodly Engine",
        "X-Priority": "1 (Highest)"
      }
    });

    console.log(`Welcome email successfully sent to ${toEmail}`);
  } catch (err) {
    console.error("Failed to send welcome user email:", err);
  }
}

/**
 * 2. Send Beautiful & Spam-Compliant Order Receipt Invoice to Customer & Store
 */
export async function sendOrderReceiptEmail(order: any) {
  try {
    const config = await getActiveSmtpConfig();
    const transporter = getTransporter(config);
    const senderEmail = config.user || "support@glowgoodly.com";
    const fromAddress = config.fromAddress || `"GlowGoodly Official" <${senderEmail}>`;
    const storeSupportEmail = "support@glowgoodly.com";

    // Determine destination recipients
    const customerEmail = (order.customerEmail || "").trim();
    const hasValidCustomerEmail = Boolean(customerEmail && customerEmail.includes("@"));

    // Prepare Items HTML and Text
    const items = order.orderItems || [];
    const itemsHtml = items.map((item: any) => `
      <tr style="border-bottom: 1px solid #e2e8f0;">
        <td style="padding: 12px 8px; font-size: 13px; color: #1e293b;">
          <strong>${item.productName || item.name || "Product"}</strong><br/>
          <span style="font-size: 11px; color: #64748b;">${item.variantName || item.size || ""}</span>
        </td>
        <td style="padding: 12px 8px; font-size: 13px; text-align: center; color: #334155;">${item.quantity}</td>
        <td style="padding: 12px 8px; font-size: 13px; text-align: right; color: #334155;">৳${item.price}</td>
        <td style="padding: 12px 8px; font-size: 13px; text-align: right; font-weight: bold; color: #e63b7a;">৳${item.total || (item.price * item.quantity)}</td>
      </tr>
    `).join("");

    const itemsText = items.map((item: any, idx: number) => 
      `${idx + 1}. ${item.productName || item.name} (${item.variantName || item.size || "Default"}) - Qty: ${item.quantity} x ৳${item.price} = ৳${item.total || (item.price * item.quantity)}`
    ).join("\n");

    // Plain text alternative (Eliminates MIME_HTML_ONLY spam penalty)
    const plainTextReceipt = `
======================================================
           GLOWGOODLY - OFFICIAL ORDER RECEIPT
======================================================
Order Number: #${order.orderNumber}
Order Date: ${new Date(order.createdAt || Date.now()).toLocaleDateString("en-US", { day: 'numeric', month: 'short', year: 'numeric' })}
Payment Method: ${order.paymentMethod || "Cash on Delivery (COD)"} (${order.paymentStatus || "Pending"})
Order Status: ${order.orderStatus || "Pending"}

CUSTOMER DETAILS:
Name: ${order.customerName || "Customer"}
Phone: ${order.customerPhone || "N/A"}
Delivery Address: ${order.address || "N/A"}
Zone: ${order.zone || "Standard"}

ORDER ITEMS:
${itemsText}

PRICING BREAKDOWN:
Subtotal: ৳${order.subTotal || 0}
Delivery Charge: ৳${order.deliveryCharge || 0}
${order.discount > 0 ? `Discount: -৳${order.discount}\n` : ""}------------------------------------------------------
TOTAL PAYABLE: ৳${order.total || order.totalAmount || 0}
------------------------------------------------------

Thank you for shopping with GlowGoodly!
All our cosmetics and skincare products are 100% authentic.

If you have questions, please contact our help desk:
Email: support@glowgoodly.com
Phone: +8801609013011 / +8801971708689
Web: https://glowgoodly.com
Warehouse: 1162, East Monipur, Mirpur-2, Dhaka-1216, Bangladesh
======================================================
    `.trim();

    // High Quality Responsive HTML Receipt
    const htmlContent = `
      <!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
      <html xmlns="http://www.w3.org/1999/xhtml">
      <head>
        <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
        <title>Order Receipt #${order.orderNumber} - GlowGoodly</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
        <div style="max-width: 620px; margin: 20px auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.06);">
          <!-- Header Banner -->
          <div style="background: linear-gradient(135deg, #e63b7a 0%, #be185d 100%); padding: 26px 20px; text-align: center; color: #ffffff;">
            <h1 style="margin: 0; font-size: 24px; font-weight: 900; letter-spacing: 1.5px; text-transform: uppercase;">GLOWGOODLY</h1>
            <p style="margin: 6px 0 0 0; font-size: 14px; font-weight: 600; opacity: 0.95;">Official Purchase Invoice & Order Confirmation</p>
          </div>

          <!-- Body Content -->
          <div style="padding: 24px; color: #334155;">
            <div style="display: flex; justify-content: space-between; border-bottom: 2px solid #f1f5f9; padding-bottom: 14px; margin-bottom: 18px;">
              <div>
                <p style="margin: 0; font-size: 11px; color: #64748b; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px;">Order Number</p>
                <p style="margin: 3px 0 0 0; font-size: 18px; font-weight: 900; color: #e63b7a;">#${order.orderNumber}</p>
              </div>
              <div style="text-align: right;">
                <p style="margin: 0; font-size: 11px; color: #64748b; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px;">Order Date</p>
                <p style="margin: 3px 0 0 0; font-size: 13px; font-weight: 700; color: #1e293b;">${new Date(order.createdAt || Date.now()).toLocaleDateString("en-US", { day: 'numeric', month: 'short', year: 'numeric' })}</p>
              </div>
            </div>

            <p style="font-size: 14px; color: #1e293b; margin: 0 0 8px 0;">Hello <strong>${order.customerName || "Valued Customer"}</strong>,</p>
            <p style="font-size: 13px; line-height: 1.6; color: #475569; margin: 0 0 18px 0;">
              Thank you for placing your order with GlowGoodly! Your order has been registered in our fulfillment system. Below is your complete purchase invoice:
            </p>

            <!-- Items Table -->
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
              <thead>
                <tr style="background-color: #f8fafc; border-bottom: 2px solid #cbd5e1; text-align: left;">
                  <th style="padding: 10px 8px; font-size: 11.5px; color: #475569; font-weight: 800; text-transform: uppercase;">Item</th>
                  <th style="padding: 10px 8px; font-size: 11.5px; color: #475569; font-weight: 800; text-align: center; text-transform: uppercase;">Qty</th>
                  <th style="padding: 10px 8px; font-size: 11.5px; color: #475569; font-weight: 800; text-align: right; text-transform: uppercase;">Price</th>
                  <th style="padding: 10px 8px; font-size: 11.5px; color: #475569; font-weight: 800; text-align: right; text-transform: uppercase;">Total</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
              </tbody>
            </table>

            <!-- Pricing Summary Box -->
            <div style="background-color: #f8fafc; padding: 16px 18px; border-radius: 8px; border: 1px solid #e2e8f0; margin-bottom: 20px;">
              <table style="width: 100%; font-size: 13px; color: #475569;">
                <tr>
                  <td style="padding: 4px 0;">Subtotal:</td>
                  <td style="padding: 4px 0; text-align: right; font-weight: 600;">৳${order.subTotal || 0}</td>
                </tr>
                <tr>
                  <td style="padding: 4px 0;">Delivery Charge (${order.zone || "Standard"}):</td>
                  <td style="padding: 4px 0; text-align: right; font-weight: 600;">৳${order.deliveryCharge || 0}</td>
                </tr>
                ${order.discount > 0 ? `
                  <tr>
                    <td style="padding: 4px 0; color: #166534;">Discount:</td>
                    <td style="padding: 4px 0; text-align: right; color: #166534; font-weight: 700;">-৳${order.discount}</td>
                  </tr>
                ` : ""}
                <tr style="border-top: 1.5px solid #cbd5e1;">
                  <td style="padding: 10px 0 4px 0; font-size: 15px; font-weight: 900; color: #0f172a;">Total Payable:</td>
                  <td style="padding: 10px 0 4px 0; text-align: right; font-size: 16px; font-weight: 900; color: #e63b7a;">৳${order.total || order.totalAmount || 0}</td>
                </tr>
                <tr>
                  <td colspan="2" style="padding-top: 6px; font-size: 12px; color: #64748b;">
                    Payment Method: <strong style="color: #0f172a;">${order.paymentMethod || "Cash on Delivery"}</strong> (${order.paymentStatus || "Pending"})
                  </td>
                </tr>
              </table>
            </div>

            <!-- Shipping Details Box -->
            <div style="background-color: #ffffff; border: 1px dashed #cbd5e1; padding: 14px 16px; border-radius: 8px; margin-bottom: 20px;">
              <h4 style="margin: 0 0 6px 0; font-size: 12px; color: #0f172a; text-transform: uppercase; font-weight: 800;">📦 Shipping & Delivery Address</h4>
              <p style="margin: 0; font-size: 12.5px; color: #334155; line-height: 1.5;">
                Recipient: <strong>${order.customerName || "Customer"}</strong><br/>
                Phone: <strong>${order.customerPhone || "N/A"}</strong><br/>
                Address: ${order.address || "N/A"}
              </p>
            </div>

            <p style="font-size: 12px; color: #64748b; line-height: 1.5; margin: 0; text-align: center;">
              Have questions or need to modify your delivery? Reply directly to this email or call our hotline at <strong>+8801609013011</strong>.
            </p>
          </div>

          <!-- Anti-Spam Compliant Footer -->
          <div style="background-color: #f1f5f9; padding: 16px; text-align: center; font-size: 11.5px; color: #64748b; border-top: 1px solid #e2e8f0; line-height: 1.5;">
            <strong>GlowGoodly Bangladesh</strong> • 100% Authentic Cosmetics & Skincare<br/>
            Fulfillment Center: 1162, East Monipur, Mirpur-2, Dhaka-1216<br/>
            Support: <a href="mailto:support@glowgoodly.com" style="color: #e63b7a; text-decoration: none;">support@glowgoodly.com</a> | Web: <a href="https://glowgoodly.com" style="color: #e63b7a; text-decoration: none;">glowgoodly.com</a>
          </div>
        </div>
      </body>
      </html>
    `;

    const messageId = `<order-${order.orderNumber || Date.now()}-${Date.now()}@glowgoodly.com>`;
    const targetRecipient = hasValidCustomerEmail ? customerEmail : storeSupportEmail;
    const bccList = hasValidCustomerEmail ? [storeSupportEmail] : undefined;

    const mailOptions: any = {
      from: fromAddress,
      to: targetRecipient,
      bcc: bccList,
      subject: `Order Receipt #${order.orderNumber} - GlowGoodly`,
      text: plainTextReceipt,
      html: htmlContent,
      replyTo: "support@glowgoodly.com",
      sender: senderEmail,
      messageId: messageId,
      date: new Date(),
      envelope: {
        from: senderEmail,
        to: hasValidCustomerEmail ? [customerEmail, storeSupportEmail] : [storeSupportEmail]
      },
      headers: {
        "X-Mailer": "GlowGoodly Hosting Mailer 2.0",
        "X-Priority": "3 (Normal)",
        "Importance": "Normal",
        "Auto-Submitted": "auto-generated",
        "Precedence": "bulk",
        "X-Auto-Response-Suppress": "All",
        "Feedback-ID": "order-receipt:glowgoodly:transactional",
        "List-Unsubscribe": "<mailto:support@glowgoodly.com?subject=Unsubscribe>",
        "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
        "Return-Path": senderEmail
      }
    };

    console.log(`[Order Mailer] Sending receipt for #${order.orderNumber} via ${senderEmail} to ${targetRecipient}...`);
    const info = await transporter.sendMail(mailOptions);
    console.log(`[Order Mailer] Receipt successfully sent! Message ID: ${info.messageId || messageId}`);
    return info;
  } catch (err) {
    console.error(`[Order Mailer Error] Failed to send order receipt for #${order.orderNumber}:`, err);
  }
}
