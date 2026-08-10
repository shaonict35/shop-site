import nodemailer from "nodemailer";

// SMTP Configuration (Uses cPanel SMTP by default or fallback)
const getTransporter = () => {
  const host = process.env.SMTP_HOST || "mail.glowgoodly.com";
  const port = parseInt(process.env.SMTP_PORT || "465");
  const user = process.env.SMTP_USER || "support@glowgoodly.com";
  const pass = process.env.SMTP_PASS || "";

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465, // true for 465, false for 587
    auth: pass ? { user, pass } : undefined,
    tls: {
      rejectUnauthorized: false
    }
  });
};

/**
 * 1. Send Login Credentials to Newly Created User/Staff
 */
export async function sendWelcomeUserEmail(toEmail: string, name: string, tempPass: string, role: string) {
  try {
    const transporter = getTransporter();
    const fromAddress = `"GlowGoodly Support" <${process.env.SMTP_USER || "support@glowgoodly.com"}>`;

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
      replyTo: "support@glowgoodly.com",
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
 * 2. Send Beautiful Order Receipt Invoice to Customer
 */
export async function sendOrderReceiptEmail(order: any) {
  if (!order.customerEmail) return;

  try {
    const transporter = getTransporter();
    const fromAddress = `"GlowGoodly Orders" <${process.env.SMTP_USER || "support@glowgoodly.com"}>`;

    const itemsHtml = (order.orderItems || []).map((item: any) => `
      <tr style="border-bottom: 1px solid #e2e8f0;">
        <td style="padding: 12px 8px; font-size: 13px; color: #1e293b;">
          <strong>${item.productName}</strong><br/>
          <span style="font-size: 11px; color: #64748b;">${item.variantName || ""}</span>
        </td>
        <td style="padding: 12px 8px; font-size: 13px; text-align: center; color: #334155;">${item.quantity}</td>
        <td style="padding: 12px 8px; font-size: 13px; text-align: right; color: #334155;">৳${item.price}</td>
        <td style="padding: 12px 8px; font-size: 13px; text-align: right; font-weight: bold; color: #e63b7a;">৳${item.total}</td>
      </tr>
    `).join("");

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 650px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 14px; overflow: hidden; background-color: #ffffff; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #e63b7a 0%, #be185d 100%); padding: 28px; text-align: center; color: #ffffff;">
          <h1 style="margin: 0; font-size: 26px; font-weight: 900; letter-spacing: 1px;">GLOWGOODLY</h1>
          <p style="margin-top: 6px; font-size: 15px; font-weight: 600; opacity: 0.95;">Thank you for your order! 🛍️</p>
        </div>

        <!-- Body -->
        <div style="padding: 28px; color: #334155;">
          <div style="display: flex; justify-content: space-between; border-bottom: 2px solid #f1f5f9; padding-bottom: 16px; margin-bottom: 20px;">
            <div>
              <p style="margin: 0; font-size: 12px; color: #64748b; font-weight: bold; text-transform: uppercase;">Order Number</p>
              <p style="margin: 4px 0 0 0; font-size: 18px; font-weight: 900; color: #e63b7a;">#${order.orderNumber}</p>
            </div>
            <div style="text-align: right;">
              <p style="margin: 0; font-size: 12px; color: #64748b; font-weight: bold; text-transform: uppercase;">Order Date</p>
              <p style="margin: 4px 0 0 0; font-size: 13px; font-weight: 700; color: #1e293b;">${new Date(order.createdAt || Date.now()).toLocaleDateString("en-US", { day: 'numeric', month: 'short', year: 'numeric' })}</p>
            </div>
          </div>

          <h3 style="font-size: 15px; color: #0f172a; margin-bottom: 10px;">Hi ${order.customerName},</h3>
          <p style="font-size: 13.5px; line-height: 1.6; color: #475569; margin-bottom: 20px;">
            We've received your order and are currently preparing it for delivery. Here is your official order receipt summary:
          </p>

          <!-- Items Table -->
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
            <thead>
              <tr style="background-color: #f8fafc; border-bottom: 2px solid #cbd5e1; text-align: left;">
                <th style="padding: 10px 8px; font-size: 12px; color: #475569; font-weight: bold;">ITEM</th>
                <th style="padding: 10px 8px; font-size: 12px; color: #475569; font-weight: bold; text-align: center;">QTY</th>
                <th style="padding: 10px 8px; font-size: 12px; color: #475569; font-weight: bold; text-align: right;">PRICE</th>
                <th style="padding: 10px 8px; font-size: 12px; color: #475569; font-weight: bold; text-align: right;">TOTAL</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>

          <!-- Pricing Summary -->
          <div style="background-color: #f8fafc; padding: 18px; border-radius: 10px; border: 1px solid #e2e8f0; margin-bottom: 24px;">
            <div style="display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 8px; color: #475569;">
              <span>Subtotal:</span>
              <span>৳${order.subTotal}</span>
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 8px; color: #475569;">
              <span>Delivery Charge (${order.zone}):</span>
              <span>৳${order.deliveryCharge}</span>
            </div>
            ${order.discount > 0 ? `
              <div style="display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 8px; color: #166534;">
                <span>Discount:</span>
                <span>-৳${order.discount}</span>
              </div>
            ` : ""}
            <div style="border-top: 1.5px solid #cbd5e1; padding-top: 10px; display: flex; justify-content: space-between; font-size: 16px; font-weight: 900; color: #0f172a;">
              <span>Total Payable:</span>
              <span style="color: #e63b7a;">৳${order.total}</span>
            </div>
            <div style="margin-top: 10px; font-size: 12px; font-weight: bold; color: #1e293b;">
              Payment Method: <span style="color: #be185d;">${order.paymentMethod}</span> (${order.paymentStatus})
            </div>
          </div>

          <!-- Shipping Details -->
          <div style="background-color: #ffffff; border: 1px dashed #cbd5e1; padding: 16px; border-radius: 10px; margin-bottom: 24px;">
            <h4 style="margin: 0 0 8px 0; font-size: 13px; color: #0f172a; text-transform: uppercase; font-weight: bold;">📦 Delivery Address</h4>
            <p style="margin: 0; font-size: 13px; color: #334155; line-height: 1.5;">
              <strong>${order.customerName}</strong><br/>
              Phone: ${order.customerPhone}<br/>
              Address: ${order.address}
            </p>
          </div>

          <p style="font-size: 12.5px; color: #64748b; text-align: center; margin-top: 10px;">
            If you have any questions regarding your order, please reply directly to this email or call our support line at <strong>+8801609013011</strong>.
          </p>
        </div>

        <!-- Footer -->
        <div style="background-color: #f1f5f9; padding: 16px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0;">
          &copy; 2026 GlowGoodly Authentic Cosmetics & Beauty. All rights reserved.<br/>
          Official Email: support@glowgoodly.com | Website: <a href="https://glowgoodly.com" style="color: #e63b7a; text-decoration: none; font-weight: bold;">glowgoodly.com</a>
        </div>
      </div>
    `;

    await transporter.sendMail({
      from: fromAddress,
      to: order.customerEmail,
      subject: `🎉 Order Confirmation #${order.orderNumber} - GlowGoodly`,
      html: htmlContent,
      replyTo: "support@glowgoodly.com",
      headers: {
        "X-Mailer": "GlowGoodly Invoice Dispatcher",
        "X-Auto-Response-Suppress": "All",
        "List-Unsubscribe": "<mailto:support@glowgoodly.com?subject=unsubscribe>"
      }
    });

    console.log(`Order receipt email sent successfully to ${order.customerEmail}`);
  } catch (err) {
    console.error("Failed to send order receipt email:", err);
  }
}
