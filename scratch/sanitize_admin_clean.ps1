# PowerShell clean translation and sanitization script for page.tsx
$filePath = "C:\Users\skhan\Desktop\Glowgoodly\frontend\src\app\valobasa\page.tsx"
$content = [System.IO.File]::ReadAllText($filePath, [System.Text.Encoding]::UTF8)

# 1. Update isAdmin initialization
$oldIsAdmin = '  const [isAdmin, setIsAdmin] = useState(false);'
$newIsAdmin = @'
  const [isAdmin, setIsAdmin] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    if (sessionStorage.getItem("glowgoodly_admin_logged_out") === "true") return false;
    if (sessionStorage.getItem("glowgoodly_admin_session") === "active") return true;
    const savedToken = localStorage.getItem("glowgoodly_token") || localStorage.getItem("gg_token");
    const savedUserStr = localStorage.getItem("glowgoodly_user") || localStorage.getItem("gg_user");
    if (savedToken && savedUserStr) {
      try {
        const u = JSON.parse(savedUserStr);
        const r = (u?.role || "").toLowerCase();
        if (["superadmin", "manager", "salesman", "admin"].includes(r)) return true;
      } catch (e) {}
    }
    return false;
  });
'@
$content = $content.Replace($oldIsAdmin, $newIsAdmin)

# 2. Update handleLogin window.location.reload() to smooth state update
$content = $content.Replace("setIsAdmin(true);`r`n        window.location.reload();", "setIsAdmin(true);`r`n        setActiveTab(`"dashboard`");`r`n        fetchAdminOrders();`r`n        fetchAdminProducts();")
$content = $content.Replace("setIsAdmin(true);`n        window.location.reload();", "setIsAdmin(true);`n        setActiveTab(`"dashboard`");`n        fetchAdminOrders();`n        fetchAdminProducts();")

# 3. Replace all remaining Mojibake and Bengali strings
$replacements = @{
    # Seasonal Offer state defaults
    'title: "à¦¬à¦¿à¦¶à§‡à¦· à¦…à¦«à¦¾à¦°à§‡ à¦…à¦°à¦¿à¦œà¦¿à¦¨à¦¾à¦² à¦¬à¦¿à¦‰à¦Ÿà¦¿ à¦•à¦®à§ à¦¬à§‹ à¦ªà§ à¦¯à¦¾à¦•à§‡à¦œ!",' = 'title: "Special Offer: Original Beauty Combo Package!",'
    'subtitle: "à¦¸à§€à¦®à¦¿à¦¤ à¦¸à¦®à§Ÿà§‡à¦° à¦œà¦¨à§ à¦¯ à¦›à¦¾à§œ! à§§à§¦à§¦% à¦…à¦°à¦¿à¦œà¦¿à¦¨à¦¾à¦² à¦ªà§ à¦°à§‹à¦¡à¦¾à¦•à§ à¦Ÿ à¦¦à§ à¦°à§ à¦¤ à¦•à§ à¦¯à¦¾à¦¶ à¦…à¦¨ à¦¡à§‡à¦²à¦¿à¦­à¦¾à¦°à¦¿à¦¤à§‡ à¦ªà¦¾à¦¨à¥¤",' = 'subtitle: "Limited time discount! 100% authentic products with fast Cash on Delivery nationwide.",'
    'productTitle: "à¦ªà§ à¦°à¦¿à¦®à¦¿à¦¯à¦¼à¦¾à¦® à¦¬à¦¿à¦‰à¦Ÿà¦¿ à¦“ à¦¸à§ à¦•à¦¿à¦¨à¦•à§‡à¦¯à¦¼à¦¾à¦° à¦—à§ à¦²à§‹ à¦¸à§‡à¦Ÿ",' = 'productTitle: "Premium Beauty & Skincare Glow Set",'
    'description: "à¦†à¦®à¦¾à¦¦à§‡à¦° à¦ à¦‡ à¦¬à¦¿à¦¶à§‡à¦· à¦ªà§ à¦¯à¦¾à¦•à§‡à¦œà§‡ à¦°à§Ÿà§‡à¦›à§‡ à¦¤à§ à¦¬à¦•à§‡à¦° à¦¯à¦¤à§ à¦¨ à¦“ à¦‰à¦œà§ à¦œà§ à¦¬à¦²à¦¤à¦¾à¦° à¦œà¦¨à§ à¦¯ à¦ªà§ à¦°à§Ÿà§‹à¦œà¦¨à§€à§Ÿ à¦ªà§ à¦°à¦¿à¦®à¦¿à¦¯à¦¼à¦¾à¦® à¦‰à¦ªà¦¾à¦¦à¦¾à¦¨à¥¤ à¦¨à¦¿à§Ÿà¦®à¦¿à¦¤ à¦¬à§ à¦¯à¦¬à¦¹à¦¾à¦°à§‡ à¦ªà¦¾à¦¬à§‡à¦¨ à¦¦à¦¾à¦—à¦¹à§€à¦¨, à¦‰à¦œà§ à¦œà§ à¦¬à¦² à¦“ à¦¸à¦¤à§‡à¦œ à¦¤à§ à¦¬à¦•à¥¤",' = 'description: "Our special combo package includes premium ingredients necessary for radiant and healthy skin. Regular use gives clear, glowing, and revitalized skin.",'
    'bulletPoints: "à§§à§¦à§¦% à¦…à¦°à¦¿à¦œà¦¿à¦¨à¦¾à¦² à¦ªà§ à¦°à§‹à¦¡à¦¾à¦•à§ à¦Ÿ|à¦¤à§ à¦¬à¦• à¦¹à¦¬à§‡ à¦¸à¦¤à§‡à¦œ à¦“ à¦‰à¦œà§ à¦œà§ à¦¬à¦²|à¦•à§‹à¦¨à§‹ à¦¸à¦¾à¦‡à¦¡ à¦‡à¦«à§‡à¦•à§ à¦Ÿ à¦¨à§‡à¦‡|à¦¸à¦¾à¦°à¦¾à¦¦à§‡à¦¶à§‡ à¦•à§ à¦¯à¦¾à¦¶ à¦…à¦¨ à¦¡à§‡à¦²à¦¿à¦­à¦¾à¦°à¦¿",' = 'bulletPoints: "100% Authentic Products|Promotes Radiant & Healthy Skin|No Side Effects|Cash on Delivery Nationwide",'

    # Landing page builder
    'ðŸš€ à¦²à§ à¦¯à¦¾à¦¨à§ à¦¡à¦¿à¦‚ à¦ªà§‡à¦œ à¦•à§ à¦°à¦¿à§Ÿà§‡à¦Ÿà¦° à¦“ à¦¬à¦¿à¦²à§ à¦¡à¦¾à¦° (Landing Page Builder)' = 'Promotional Landing Page Builder'
    'à¦ªà§ à¦°à§‹à¦¡à¦¾à¦•à§ à¦Ÿ à¦‡à¦®à§‡à¦œ à¦“ à¦­à¦¿à¦¡à¦¿à¦“ à¦†à¦ªà¦²à§‹à¦¡ à¦•à¦°à§‡ à¦†à¦ªà¦¨à¦¾à¦° à¦‡à¦šà§ à¦›à¦¾à¦®à¦¤à§‹ à¦¨à¦¤à§ à¦¨ à¦—à§‹à¦ªà¦¨ (Unlinked) à¦…à¦«à¦¾à¦° à¦²à§ à¦¯à¦¾à¦¨à§ à¦¡à¦¿à¦‚ à¦ªà§‡à¦œ à¦¤à§ˆà¦°à¦¿ à¦•à¦°à§ à¦¨ à¦“ à¦ à¦¡à¦¿à¦Ÿ à¦•à¦°à§ à¦¨à¥¤' = 'Upload product media to create and customize dedicated promotional landing pages for advertising campaigns.'
    'const pageTitle = prompt("à¦¨à¦¤à§ à¦¨ à¦²à§ à¦¯à¦¾à¦¨à§ à¦¡à¦¿à¦‚ à¦ªà§‡à¦œà§‡à¦° à¦¨à¦¾à¦® à¦¦à¦¿à¦¨ (à¦¯à§‡à¦®à¦¨: Valentine Combo Deal):");' = 'const pageTitle = prompt("Enter new landing page name (e.g. Valentine Combo Deal):");'
    'const slug = prompt("URL Slug à¦¨à¦¿à¦°à§ à¦§à¦¾à¦°à¦£ à¦•à¦°à§ à¦¨ (à¦¯à§‡à¦®à¦¨: valentine-combo):", defaultSlug);' = 'const slug = prompt("Enter URL slug (e.g. valentine-combo):", defaultSlug);'
    'subtitle: "à¦¸à§€à¦®à¦¿à¦¤ à¦¸à¦®à§Ÿà§‡à¦° à¦œà¦¨à§ à¦¯ à¦¬à¦¿à¦¶à§‡à¦· à¦›à¦¾à§œ! à¦¦à§ à¦°à§ à¦¤ à¦•à§ à¦¯à¦¾à¦¶ à¦…à¦¨ à¦¡à§‡à¦²à¦¿à¦­à¦¾à¦°à¦¿à¦¤à§‡ à¦…à¦°à§ à¦¡à¦¾à¦° à¦•à¦°à§ à¦¨à¥¤",' = 'subtitle: "Limited time discount! Order now with fast Cash on Delivery.",'
    'description: "à¦†à¦®à¦¾à¦¦à§‡à¦° à¦ à¦‡ à¦¸à§ à¦ªà§‡à¦¶à¦¾à¦² à¦…à¦«à¦¾à¦° à¦•à¦®à§ à¦¬à§‹ à¦ªà§ à¦¯à¦¾à¦•à§‡à¦œà§‡ à¦°à§Ÿà§‡à¦›à§‡ à¦¤à§ à¦¬à¦•à§‡à¦° à¦¯à¦¤à§ à¦¨ à¦“ à¦‰à¦œà§ à¦œà§ à¦¬à¦²à¦¤à¦¾à¦° à¦œà¦¨à§ à¦¯ à¦ªà§ à¦°à§Ÿà§‹à¦œà¦¨à§€à§Ÿ à¦ªà§ à¦°à¦¿à¦®à¦¿à¦¯à¦¼à¦¾à¦® à¦‰à¦ªà¦¾à¦¦à¦¾à¦¨à¥¤",' = 'description: "Our special promo package includes essential premium ingredients for skincare.",'
    'alert(`''${pageTitle}'' à¦¨à¦¾à¦®à§‡ à¦¨à¦¤à§ à¦¨ à¦²à§ à¦¯à¦¾à¦¨à§ à¦¡à¦¿à¦‚ à¦ªà§‡à¦œ à¦¤à§ˆà¦°à¦¿ à¦¹à§Ÿà§‡à¦›à§‡! à¦¨à¦¿à¦šà§‡à¦° à¦«à¦°à§ à¦®à§‡ à¦›à¦¬à¦¿, à¦­à¦¿à¦¡à¦¿à¦“ à¦“ à¦¤à¦¥à§ à¦¯ à¦¦à¦¿à§Ÿà§‡ à¦¸à§‡à¦­ à¦•à¦°à§ à¦¨à¥¤`);' = 'alert(`Landing page ''${pageTitle}'' created! Update images, video, and details below and click Save.`);'
    'âž• à¦¨à¦¤à§ à¦¨ à¦²à§ à¦¯à¦¾à¦¨à§ à¦¡à¦¿à¦‚ à¦ªà§‡à¦œ à¦¤à§ˆà¦°à¦¿ à¦•à¦°à§ à¦¨' = '+ Create New Landing Page'
    'à¦²à¦¾à¦‡à¦­ à¦ªà§‡à¦œ à¦²à¦¿à¦‚à¦•' = 'Live Page Link'
    'alert("à¦²à§ à¦¯à¦¾à¦¨à§ à¦¡à¦¿à¦‚ à¦ªà§‡à¦œ à¦¸à§‡à¦Ÿà¦¿à¦‚à¦¸ à¦¸à¦«à¦²à¦­à¦¾à¦¬à§‡ à¦¸à§‡à¦­ à¦“ à¦†à¦ªà¦¡à§‡à¦Ÿ à¦¹à§Ÿà§‡à¦›à§‡!");' = 'alert("Landing page settings saved and updated successfully!");'
    'alert("à¦†à¦ªà¦¡à§‡à¦Ÿ à¦•à¦°à¦¤à§‡ à¦¸à¦®à¦¸à§ à¦¯à¦¾ à¦¹à§Ÿà§‡à¦›à§‡!");' = 'alert("Failed to update landing page!");'
    'à¦•à§ à¦¯à¦¾à¦®à§ à¦ªà§‡à¦‡à¦¨ à¦®à§‡à¦‡à¦¨ à¦¶à¦¿à¦°à§‹à¦¨à¦¾à¦® (Headline) *' = 'Campaign Main Headline *'
    'à¦•à§ à¦¯à¦¾à¦®à§ à¦ªà§‡à¦‡à¦¨ à¦¸à¦¾à¦¬-à¦¶à¦¿à¦°à§‹à¦¨à¦¾à¦® (Subtitle)' = 'Campaign Subtitle'
    'ðŸŽ¥ à¦­à¦¿à¦¡à¦¿à¦“ à¦«à¦¾à¦‡à¦² à¦¬à¦¾ à¦²à¦¿à¦‚à¦• à¦†à¦ªà¦²à§‹à¦¡' = 'Upload Video File or Paste URL'
    'à¦…à¦ªà¦¶à¦¨ à§§: à¦­à¦¿à¦¡à¦¿à¦“ à¦«à¦¾à¦‡à¦² à¦¡à¦¿à¦­à¦¾à¦‡à¦¸ à¦¥à§‡à¦•à§‡ à¦¬à§‡à¦›à§‡ à¦¨à¦¿à¦¨' = 'Option 1: Choose video file from device'
    'alert("à¦­à¦¿à¦¡à¦¿à¦“ à¦«à¦¾à¦‡à¦² à¦¸à¦°à§ à¦¬à§‹à¦šà§ à¦š 50MB à¦¹à¦¤à§‡ à¦ªà¦¾à¦°à¦¬à§‡à¥¤");' = 'alert("Video file size cannot exceed 50MB.");'
    'alert("à¦­à¦¿à¦¡à¦¿à¦“ à¦†à¦ªà¦²à§‹à¦¡ à¦¸à¦®à§ à¦ªà¦¨à§ à¦¨ à¦¹à§Ÿà§‡à¦›à§‡!");' = 'alert("Video uploaded successfully!");'
    'à¦…à¦ªà¦¶à¦¨ à§¨: à¦…à¦¥à¦¬à¦¾ à¦…à¦¨à¦²à¦¾à¦‡à¦¨ à¦­à¦¿à¦¡à¦¿à¦“/YouTube URL à¦¦à¦¿à¦¨' = 'Option 2: Or enter online video / YouTube URL'
    'placeholder="https://example.com/video.mp4 à¦¬à¦¾ YouTube Embed Link"' = 'placeholder="https://example.com/video.mp4 or YouTube Embed Link"'
    'ðŸ“· à¦ªà§ à¦°à§‹à¦¡à¦¾à¦•à§ à¦Ÿ à¦«à¦Ÿà§‹/à¦›à¦¬à¦¿ à¦†à¦ªà¦²à§‹à¦¡' = 'Upload Product Photos'
    'à¦…à¦ªà¦¶à¦¨ à§§: à¦›à¦¬à¦¿ à¦«à¦¾à¦‡à¦² à¦¡à¦¿à¦­à¦¾à¦‡à¦¸ à¦¥à§‡à¦•à§‡ à¦†à¦ªà¦²à§‹à¦¡ à¦•à¦°à§ à¦¨' = 'Option 1: Upload image file from device'
    'alert("à¦›à¦¬à¦¿ à¦¸à¦°à§ à¦¬à§‹à¦šà§ à¦š 5MB à¦¹à¦¤à§‡ à¦ªà¦¾à¦°à¦¬à§‡à¥¤");' = 'alert("Image size cannot exceed 5MB.");'
    'alert("à¦›à¦¬à¦¿ à¦†à¦ªà¦²à§‹à¦¡ à¦¸à¦®à§ à¦ªà¦¨à§ à¦¨ à¦¹à§Ÿà§‡à¦›à§‡!");' = 'alert("Image uploaded successfully!");'
    'à¦…à¦ªà¦¶à¦¨ à§¨: à¦…à¦¥à¦¬à¦¾ à¦‡à¦®à§‡à¦œà§‡à¦° URL à¦¸à¦°à¦¾à¦¸à¦°à¦¿ à¦²à¦¿à¦–à§ à¦¨' = 'Option 2: Or enter image URL directly'
    'à¦ªà§ à¦°à§‹à¦¡à¦¾à¦•à§ à¦Ÿ à¦¨à¦¾à¦® (Product Title) *' = 'Product Title *'
    'à¦…à¦«à¦¾à¦° à¦ªà§ à¦°à¦¾à¦‡à¦¸ (à§³) *' = 'Offer Price (BDT) *'
    'à¦°à§‡à¦—à§ à¦²à¦¾à¦°/à¦†à¦—à§‡à¦° à¦ªà§ à¦°à¦¾à¦‡à¦¸ (à§³)' = 'Regular / Previous Price (BDT)'
    'à¦¢à¦¾à¦•à¦¾à¦° à¦­à§‡à¦¤à¦°à§‡ à¦¡à§‡à¦²à¦¿à¦­à¦¾à¦°à¦¿ à¦šà¦¾à¦°à§ à¦œ (à§³)' = 'Inside Dhaka Delivery Charge (BDT)'
    'à¦¢à¦¾à¦•à¦¾à¦° à¦¬à¦¾à¦‡à¦°à§‡ à¦¡à§‡à¦²à¦¿à¦­à¦¾à¦°à¦¿ à¦šà¦¾à¦°à§ à¦œ (à§³)' = 'Outside Dhaka Delivery Charge (BDT)'
    'à¦¹à¦¾à¦‡à¦²à¦¾à¦‡à¦Ÿà¦¸/à¦ªà¦¯à¦¼à§‡à¦¨à§ à¦Ÿà¦¸à¦®à§‚à¦¹ (à¦ªà¦¾à¦‡à¦ª ''|'' à¦¦à¦¿à§Ÿà§‡ à¦†à¦²à¦¾à¦¦à¦¾ à¦•à¦°à§ à¦¨)' = 'Highlights / Key Features (Separate with pipe ''|'')'
    'à¦ªà§ à¦°à§‹à¦¡à¦¾à¦•à§ à¦Ÿ à¦¡à§‡à¦¸à¦•à§ à¦°à¦¿à¦ªà¦¶à¦¨ (à¦¬à¦¾à¦‚à¦²à¦¾ à¦¬à¦¿à¦¬à¦°à¦£)' = 'Product Description'
    'à¦²à§ à¦¯à¦¾à¦¨à§ à¦¡à¦¿à¦‚ à¦ªà§‡à¦œ à¦¸à§‡à¦­ à¦•à¦°à§ à¦¨' = 'Save Landing Page'
    'alert("à¦—à§‹à¦ªà¦¨ à¦²à§ à¦¯à¦¾à¦¨à§ à¦¡à¦¿à¦‚ à¦ªà§‡à¦œ à¦²à¦¿à¦‚à¦• à¦•à¦ªà¦¿ à¦¹à§Ÿà§‡à¦›à§‡! (à¦…à§ à¦¯à¦¾à¦¡ à¦•à§ à¦¯à¦¾à¦®à§ à¦ªà§‡à¦‡à¦¨à§‡ à¦¬à§ à¦¯à¦¬à¦¹à¦¾à¦° à¦•à¦°à¦¤à§‡ à¦ªà¦¾à¦°à¦¬à§‡à¦¨)");' = 'alert("Landing page link copied to clipboard! (Ready for ad campaigns)");'
    'ðŸ”— à¦—à§‹à¦ªà¦¨ à¦ªà§‡à¦œ à¦²à¦¿à¦‚à¦• à¦•à¦ªà¦¿ à¦•à¦°à§ à¦¨' = 'Copy Landing Page Link'

    # Offer Cards
    'placeholder="e.g. ðŸšš Free Shipping Offer à¦¬à¦¾ à¦¬à¦¿à¦¶à§‡à¦· à¦›à¦¾à§œ"' = 'placeholder="e.g. Free Shipping Offer or Special Discount"'
    'placeholder="e.g. FREESHIP699 à¦¬à¦¾ SAVE100"' = 'placeholder="e.g. FREESHIP699 or SAVE100"'
    'ðŸ’° à¦•à¦¤ à¦Ÿà¦¾à¦•à¦¾à¦° à¦…à¦°à§ à¦¡à¦¾à¦° à¦•à¦°à¦²à§‡ / Min Order Amount (à§³)' = 'Min Order Amount (BDT)'
    'placeholder="e.g. 1000 (à¦¨à§ à¦¯à§‚à¦¨à¦¤à¦® à¦…à¦°à§ à¦¡à¦¾à¦° à¦®à§‚à¦²à§ à¦¯)"' = 'placeholder="e.g. 1000 (Minimum order value)"'
    'ðŸŽ‰ à¦›à¦¾à§œà§‡à¦° à¦ªà¦°à¦¿à¦®à¦¾à¦£ / Discount Amount (à§³ / %)' = 'Discount Amount (BDT / %)'
    'placeholder="e.g. 100 à¦¬à¦¾ 15"' = 'placeholder="e.g. 100 or 15"'
    'ðŸŽ« à¦›à¦¾à§œà§‡à¦° à¦§à¦°à¦¨ (Discount Type)' = 'Discount Type'
    'à¦¨à¦¿à¦°à§ à¦¦à¦¿à¦·à§ à¦Ÿ à¦Ÿà¦¾à¦•à¦¾ à¦›à¦¾à§œ (Fixed Amount Tk)' = 'Fixed Amount (Tk)'
    'à¦¶à¦¤à¦•à¦°à¦¾ à¦›à¦¾à§œ (Percentage %)' = 'Percentage (%)'
    'à¦…à¦«à¦¾à¦° à¦•à¦¾à¦°à§ à¦¡ à¦Ÿà§ à¦¯à¦¾à¦—à¦²à¦¾à¦‡à¦¨/à¦¸à¦¾à¦¬à¦Ÿà¦¾à¦‡à¦Ÿà§‡à¦²' = 'Offer Card Tagline / Subtitle'
    ': "e.g. Get Free Standard Delivery nationwide on orders over à§³699 Taka!"' = ': "e.g. Get Free Standard Delivery nationwide on orders over Tk 699!"'
    '<span>ðŸ’° à¦¨à§ à¦¯à§‚à¦¨à¦¤à¦® à¦…à¦°à§ à¦¡à¦¾à¦°: à§³{off.minOrderAmount || "à§¦"}</span>' = '<span>Min Order: Tk {off.minOrderAmount || "0"}</span>'
    '<span>ðŸ ·ï¸  à¦›à¦¾à§œ: {off.discountType === "percentage" ? `${off.discountAmount}%` : `à§³${off.discountAmount}`}</span>' = '<span>Discount: {off.discountType === "percentage" ? `${off.discountAmount}%` : `Tk ${off.discountAmount}`}</span>'

    # POS / Manual Orders
    'ðŸ›’ New Manual Order / POS (à¦…à¦°à§ à¦¡à¦¾à¦° à¦“ à¦°à¦¸à¦¿à¦¦)' = 'New Manual Order / POS (Orders & Receipts)'
    'New Manual Order & POS Voucher (à¦¨à¦¤à§ à¦¨ à¦®à§ à¦¯à¦¾à¦¨à§ à§Ÿà¦¾à¦² à¦…à¦°à§ à¦¡à¦¾à¦° à¦“ à¦°à¦¸à¦¿à¦¦)' = 'New Manual Order & POS Voucher'
    'Customer Name * (à¦—à§ à¦°à¦¾à¦¹à¦•à§‡à¦° à¦¨à¦¾à¦®)' = 'Customer Name *'
    'Phone Number * (à¦«à§‹à¦¨)' = 'Phone Number *'
    'Full Delivery Address * (à¦¡à§‡à¦²à¦¿à¦­à¦¾à¦°à¦¿ à¦ à¦¿à¦•à¦¾à¦¨à¦¾)' = 'Full Delivery Address *'
    'Delivery Zone (à¦ à¦°à¦¿à§Ÿà¦¾)' = 'Delivery Zone'
    '<option value="Inside Dhaka City">Inside Dhaka (à§³70)</option>' = '<option value="Inside Dhaka City">Inside Dhaka (Tk 70)</option>'
    '<option value="Sub Dhaka Area">Sub Dhaka (à§³100)</option>' = '<option value="Sub Dhaka Area">Sub Dhaka (Tk 100)</option>'
    '<option value="Outside Dhaka City">Outside Dhaka (à§³130)</option>' = '<option value="Outside Dhaka City">Outside Dhaka (Tk 130)</option>'
    'Delivery Charge (à§³)' = 'Delivery Charge (BDT)'
    'Payment Method (à¦ªà§‡à¦®à§‡à¦¨à§ à¦Ÿ à¦ªà¦¦à§ à¦§à¦¤à¦¿)' = 'Payment Method'
    '<option value="Cash on Delivery">Cash on Delivery (à¦•à§ à¦¯à¦¾à¦¶ à¦…à¦¨ à¦¡à§‡à¦²à¦¿à¦­à¦¾à¦°à¦¿)</option>' = '<option value="Cash on Delivery">Cash on Delivery (COD)</option>'
    '<option value="bKash">bKash (à¦¬à¦¿à¦•à¦¾à¦¶)</option>' = '<option value="bKash">bKash</option>'
    '<option value="Nagad">Nagad (à¦¨à¦—à¦¦)</option>' = '<option value="Nagad">Nagad</option>'
    '<option value="POS / Card Machine">POS / Card Machine (à¦•à¦¾à¦‰à¦¨à§ à¦Ÿà¦¾à¦° à¦•à¦¾à¦°à§ à¦¡)</option>' = '<option value="POS / Card Machine">POS / Card Machine</option>'
    '<option value="Bank Transfer">Bank Transfer (à¦¬à§ à¦¯à¦¾à¦‚à¦• à¦Ÿà§ à¦°à¦¾à¦¨à§ à¦¸à¦«à¦¾à¦°)</option>' = '<option value="Bank Transfer">Bank Transfer</option>'
    '<option value="Cash Counter">Cash Counter (à¦•à¦¾à¦‰à¦¨à§ à¦Ÿà¦¾à¦° à¦•à§ à¦¯à¦¾à¦¶)</option>' = '<option value="Cash Counter">Cash Counter</option>'
    'ðŸ› ï¸  Add Product from Inventory (à¦ªà¦£à§ à¦¯ à¦¨à¦¿à¦°à§ à¦¬à¦¾à¦šà¦¨ à¦•à¦°à§ à¦¨)' = 'Add Product from Inventory'
    '<span>Items Subtotal (à¦ªà¦£à§ à¦¯ à¦®à§‚à¦²à§ à¦¯):</span>' = '<span>Items Subtotal:</span>'
    '<span>Delivery Fee (à¦¡à§‡à¦²à¦¿à¦­à¦¾à¦°à¦¿ à¦šà¦¾à¦°à§ à¦œ):</span>' = '<span>Delivery Fee:</span>'
    '<span>Special Discount (à¦›à¦¾à§œ):</span>' = '<span>Special Discount:</span>'
    '<div style={{ fontSize: "13px", fontWeight: "800", color: "#0f172a" }}>GRAND TOTAL (à¦®à§‹à¦Ÿ à¦ªà§ à¦°à¦¦à§‡à¦¯à¦¼):</div>' = '<div style={{ fontSize: "13px", fontWeight: "800", color: "#0f172a" }}>GRAND TOTAL:</div>'
    '{isSubmittingManualOrder ? "â ³ Processing Order & Stock..." : "âœ“ Confirm Order & Print Receipt (à¦…à¦°à§ à¦¡à¦¾à¦° à¦•à¦¨à¦«à¦¾à¦°à§ à¦® à¦“ à¦°à¦¸à¦¿à¦¦ à¦ªà§ à¦°à¦¿à¦¨à§ à¦Ÿ)"}' = '{isSubmittingManualOrder ? "Processing Order & Stock..." : "Confirm Order & Print Receipt"}'
    'ðŸ›’ + New Manual Order / POS (à¦¨à¦¤à§ à¦¨ à¦…à¦°à§ à¦¡à¦¾à¦°)' = '+ New Manual Order / POS'
    '<h4 style={{ fontSize: "14px", fontWeight: "800", color: "#0f172a", marginBottom: "8px" }}>ðŸ›’ ORDERED ITEMS (à¦•à§€ à¦…à¦°à§ à¦¡à¦¾à¦° à¦•à¦°à§‡à¦›à§‡):</h4>' = '<h4 style={{ fontSize: "14px", fontWeight: "800", color: "#0f172a", marginBottom: "8px" }}>ORDERED ITEMS:</h4>'
    '<div style={{ fontSize: "12px", color: "#64748b", fontWeight: "700" }}>TOTAL BILL (à¦®à§‹à¦Ÿ à¦¬à¦¿à¦²)</div>' = '<div style={{ fontSize: "12px", color: "#64748b", fontWeight: "700" }}>TOTAL BILL</div>'
    'ðŸš´ Pathao Courier API Dispatch (à§§-à¦•à§ à¦²à¦¿à¦•à§‡ à¦ªà¦¾à¦ à¦¾à¦“ à¦•à§ à¦°à¦¿à§Ÿà¦¾à¦°à§‡ à¦ªà¦¾à¦ à¦¾à¦¨)' = 'Pathao Courier API Dispatch'
    'ðŸ§¾ Choose Format (à¦°à¦¸à¦¿à¦¦à§‡à¦° à¦§à¦°à¦¨ à¦¨à¦¿à¦°à§ à¦¬à¦¾à¦šà¦¨ à¦•à¦°à§ à¦¨):' = 'Choose Receipt Format:'
    'ðŸ§¾ POS 80mm Thermal (à¦•à§ à¦¯à¦¾à¦¶ à¦®à§‡à¦®à§‹)' = 'POS 80mm Thermal (Receipt)'
    'ðŸ“„ A4 Invoice (à¦šà¦¾à¦²à¦¾à¦¨)' = 'A4 Invoice'
    'ðŸ“‘ Header & Footer Menu Management (à¦“à§Ÿà§‡à¦¬à¦¸à¦¾à¦‡à¦Ÿ à¦®à§‡à¦¨à§ à¦¯à§  à¦®à§ à¦¯à¦¾à¦¨à§‡à¦œà¦¾à¦°)' = 'Header & Footer Menu Management'
    '📑 Header & Footer Menu Management (ওয়েবসাইট মেন্যু ম্যানেজার)' = 'Header & Footer Menu Management'

    # Product Form
    'Sell Price (à§³) *' = 'Sell Price (BDT) *'
    'Buy Price / Cost (à§³)' = 'Buy Price / Cost (BDT)'
    'Discount Price (à§³)' = 'Discount Price (BDT)'
    'Selling Price (৳)' = 'Selling Price (BDT)'
    'Total Loss (৳) *' = 'Total Loss (BDT) *'
    'FINANCIAL LOSS (৳)' = 'FINANCIAL LOSS (BDT)'
    'TOTAL FINANCIAL LOSS (৳)' = 'TOTAL FINANCIAL LOSS (BDT)'
    'calculate financial loss (৳).' = 'calculate financial loss (BDT).'
    'BUY COST (à§³)' = 'BUY COST (BDT)'
    'SELL PRICE (à§³)' = 'SELL PRICE (BDT)'
    'PROMO PRICE (à§³)' = 'PROMO PRICE (BDT)'
}

foreach ($key in $replacements.Keys) {
    if ($content.Contains($key)) {
        $content = $content.Replace($key, $replacements[$key])
    }
}

# Replace remaining currency symbols à§³ and ৳ with Tk 
$content = $content.Replace('à§³', 'Tk ')
$content = $content.Replace('৳', 'Tk ')

# Write back with UTF8
[System.IO.File]::WriteAllText($filePath, $content, [System.Text.Encoding]::UTF8)
Write-Host "Sanitization script completed successfully!"

