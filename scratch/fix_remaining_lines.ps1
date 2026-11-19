$filePath = 'C:\Users\skhan\Desktop\Glowgoodly\frontend\src\app\valobasa\page.tsx'
$lines = [System.IO.File]::ReadAllLines($filePath, [System.Text.Encoding]::UTF8)

for ($i = 0; $i -lt $lines.Length; $i++) {
    $line = $lines[$i]
    if ($line -match '[\u0980-\u09FF]|à¦|à§|Ã |Ã§|৳') {
        if ($line -match 'title: "à¦') {
            $lines[$i] = '    title: "Special Offer: Original Beauty Combo Package!",'
        }
        elseif ($line -match 'subtitle: "à¦') {
            $lines[$i] = '    subtitle: "Limited time discount! 100% authentic products with fast Cash on Delivery nationwide.",'
        }
        elseif ($line -match 'productTitle: "à¦') {
            $lines[$i] = '    productTitle: "Premium Beauty & Skincare Glow Set",'
        }
        elseif ($line -match 'description: "à¦') {
            $lines[$i] = '    description: "Our special combo package includes premium ingredients necessary for radiant and healthy skin. Regular use gives clear, glowing, and revitalized skin.",'
        }
        elseif ($line -match 'bulletPoints: "à§') {
            $lines[$i] = '    bulletPoints: "100% Authentic Products|Promotes Radiant & Healthy Skin|No Side Effects|Cash on Delivery Nationwide",'
        }
        elseif ($line -match 'ðŸš€ à¦²à§ à¦¯à¦¾à¦¨à§ à¦¡à¦¿à¦‚') {
            $lines[$i] = $line -replace 'ðŸš€.*\(Landing Page Builder\)', '🚀 Promotional Landing Page Builder'
        }
        elseif ($line -match 'à¦ªà§ à¦°à§‹à¦¡à¦¾à¦•à§ à¦Ÿ à¦‡à¦®à§‡à¦œ à¦“') {
            $lines[$i] = '                    Upload product media to create and customize dedicated promotional landing pages for advertising campaigns.'
        }
        elseif ($line -match 'prompt\("à¦¨à¦¤à§ à¦¨ à¦²à§ à¦¯à¦¾à¦¨à§ à¦¡à¦¿à¦‚') {
            $lines[$i] = '                      const pageTitle = prompt("Enter new landing page name (e.g. Valentine Combo Deal):");'
        }
        elseif ($line -match 'prompt\("URL Slug à¦¨à¦¿à¦°à§ à¦§à¦¾à¦°à¦£') {
            $lines[$i] = '                      const slug = prompt("Enter URL slug (e.g. valentine-combo):", defaultSlug);'
        }
        elseif ($line -match 'alert\(`''\$\{pageTitle\}'' à¦¨à¦¾à¦®à§‡') {
            $lines[$i] = '                      alert(`Landing page ''${pageTitle}'' created! Update images, video, and details below and click Save.`);'
        }
        elseif ($line -match 'âž• à¦¨à¦¤à§ à¦¨ à¦²à§ à¦¯à¦¾à¦¨à§ à¦¡à¦¿à¦‚') {
            $lines[$i] = '                    ➕ Create New Landing Page'
        }
        elseif ($line -match 'alert\("à¦²à§ à¦¯à¦¾à¦¨à§ à¦¡à¦¿à¦‚ à¦ªà§‡à¦œ à¦¸à§‡à¦Ÿà¦¿à¦‚à¦¸') {
            $lines[$i] = '                      alert("Landing page settings saved and updated successfully!");'
        }
        elseif ($line -match 'alert\("à¦†à¦ªà¦¡à§‡à¦Ÿ à¦•à¦°à¦¤à§‡ à¦¸à¦®à¦¸à§ à¦¯à¦¾') {
            $lines[$i] = '                      alert("Failed to update landing page!");'
        }
        elseif ($line -match 'à¦•à§ à¦¯à¦¾à¦®à§ à¦ªà§‡à¦‡à¦¨ à¦®à§‡à¦‡à¦¨ à¦¶à¦¿à¦°à§‹à¦¨à¦¾à¦®') {
            $lines[$i] = $line -replace 'à¦•à§ à¦¯à¦¾à¦®à§ à¦ªà§‡à¦‡à¦¨ à¦®à§‡à¦‡à¦¨ à¦¶à¦¿à¦°à§‹à¦¨à¦¾à¦® \(Headline\) \*', 'Campaign Main Headline *'
        }
        elseif ($line -match 'à¦•à§ à¦¯à¦¾à¦®à§ à¦ªà§‡à¦‡à¦¨ à¦¸à¦¾à¦¬-à¦¶à¦¿à¦°à§‹à¦¨à¦¾à¦®') {
            $lines[$i] = $line -replace 'à¦•à§ à¦¯à¦¾à¦®à§ à¦ªà§‡à¦‡à¦¨ à¦¸à¦¾à¦¬-à¦¶à¦¿à¦°à§‹à¦¨à¦¾à¦® \(Subtitle\)', 'Campaign Subtitle'
        }
        elseif ($line -match 'alert\("à¦­à¦¿à¦¡à¦¿à¦“ à¦«à¦¾à¦‡à¦² à¦¸à¦°à§ à¦¬à§‹à¦šà§ à¦š') {
            $lines[$i] = '                              alert("Video file size cannot exceed 50MB.");'
        }
        elseif ($line -match 'alert\("à¦­à¦¿à¦¡à¦¿à¦“ à¦†à¦ªà¦²à§‹à¦¡ à¦¸à¦®à§ à¦ªà¦¨à§ à¦¨') {
            $lines[$i] = '                                alert("Video uploaded successfully!");'
        }
        elseif ($line -match 'ðŸ“· à¦ªà§ à¦°à§‹à¦¡à¦¾à¦•à§ à¦Ÿ à¦«à¦Ÿà§‹/à¦›à¦¬à¦¿') {
            $lines[$i] = $line -replace 'ðŸ“· à¦ªà§ à¦°à§‹à¦¡à¦¾à¦•à§ à¦Ÿ à¦«à¦Ÿà§‹/à¦›à¦¬à¦¿ à¦†à¦ªà¦²à§‹à¦¡', '📷 Upload Product Photos'
        }
        elseif ($line -match 'à¦…à¦ªà¦¶à¦¨ à§§: à¦›à¦¬à¦¿ à¦«à¦¾à¦‡à¦²') {
            $lines[$i] = $line -replace 'à¦…à¦ªà¦¶à¦¨ à§§: à¦›à¦¬à¦¿ à¦«à¦¾à¦‡à¦² à¦¡à¦¿à¦­à¦¾à¦‡à¦¸ à¦¥à§‡à¦•à§‡ à¦†à¦ªà¦²à§‹à¦¡ à¦•à¦°à§ à¦¨', 'Option 1: Upload image file from device'
        }
        elseif ($line -match 'alert\("à¦›à¦¬à¦¿ à¦¸à¦°à§ à¦¬à§‹à¦šà§ à¦š 5MB') {
            $lines[$i] = '                              alert("Image size cannot exceed 5MB.");'
        }
        elseif ($line -match 'alert\("à¦›à¦¬à¦¿ à¦†à¦ªà¦²à§‹à¦¡ à¦¸à¦®à§ à¦ªà¦¨à§ à¦¨') {
            $lines[$i] = '                                alert("Image uploaded successfully!");'
        }
        elseif ($line -match 'à¦…à¦ªà¦¶à¦¨ à§¨: à¦…à¦¥à¦¬à¦¾ à¦‡à¦®à§‡à¦œà§‡à¦°') {
            $lines[$i] = $line -replace 'à¦…à¦ªà¦¶à¦¨ à§¨: à¦…à¦¥à¦¬à¦¾ à¦‡à¦®à§‡à¦œà§‡à¦° URL à¦¸à¦°à¦¾à¦¸à¦°à¦¿ à¦²à¦¿à¦–à§ à¦¨', 'Option 2: Or enter image URL directly'
        }
        elseif ($line -match 'à¦ªà§ à¦°à§‹à¦¡à¦¾à¦•à§ à¦Ÿ à¦¨à¦¾à¦® \(Product Title\) \*') {
            $lines[$i] = $line -replace 'à¦ªà§ à¦°à§‹à¦¡à¦¾à¦•à§ à¦Ÿ à¦¨à¦¾à¦® \(Product Title\) \*', 'Product Title *'
        }
        elseif ($line -match 'à¦…à¦«à¦¾à¦° à¦ªà§ à¦°à¦¾à¦‡à¦¸') {
            $lines[$i] = $line -replace 'à¦…à¦«à¦¾à¦° à¦ªà§ à¦°à¦¾à¦‡à¦¸ \(Tk \) \*', 'Offer Price (BDT) *'
        }
        elseif ($line -match 'à¦°à§‡à¦—à§ à¦²à¦¾à¦°/à¦†à¦—à§‡à¦° à¦ªà§ à¦°à¦¾à¦‡à¦¸') {
            $lines[$i] = $line -replace 'à¦°à§‡à¦—à§ à¦²à¦¾à¦°/à¦†à¦—à§‡à¦° à¦ªà§ à¦°à¦¾à¦‡à¦¸ \(Tk \)', 'Regular / Previous Price (BDT)'
        }
        elseif ($line -match 'à¦¢à¦¾à¦•à¦¾à¦° à¦­à§‡à¦¤à¦°à§‡ à¦¡à§‡à¦²à¦¿à¦­à¦¾à¦°à¦¿') {
            $lines[$i] = $line -replace 'à¦¢à¦¾à¦•à¦¾à¦° à¦­à§‡à¦¤à¦°à§‡ à¦¡à§‡à¦²à¦¿à¦­à¦¾à¦°à¦¿ à¦šà¦¾à¦°à§ à¦œ \(Tk \)', 'Inside Dhaka Delivery Charge (BDT)'
        }
        elseif ($line -match 'à¦¢à¦¾à¦•à¦¾à¦° à¦¬à¦¾à¦‡à¦°à§‡ à¦¡à§‡à¦²à¦¿à¦­à¦¾à¦°à¦¿') {
            $lines[$i] = $line -replace 'à¦¢à¦¾à¦•à¦¾à¦° à¦¬à¦¾à¦‡à¦°à§‡ à¦¡à§‡à¦²à¦¿à¦­à¦¾à¦°à¦¿ à¦šà¦¾à¦°à§ à¦œ \(Tk \)', 'Outside Dhaka Delivery Charge (BDT)'
        }
        elseif ($line -match 'à¦¹à¦¾à¦‡à¦²à¦¾à¦‡à¦Ÿà¦¸/à¦ªà¦¯à¦¼à§‡à¦¨à§ à¦Ÿà¦¸à¦®à§‚à¦¹') {
            $lines[$i] = $line -replace 'à¦¹à¦¾à¦‡à¦²à¦¾à¦‡à¦Ÿà¦¸/à¦ªà¦¯à¦¼à§‡à¦¨à§ à¦Ÿà¦¸à¦®à§‚à¦¹ \(à¦ªà¦¾à¦‡à¦ª.*à¦•à¦°à§ à¦¨\)', "Highlights / Key Features (Separate with pipe '|')"
        }
        elseif ($line -match 'à¦ªà§ à¦°à§‹à¦¡à¦¾à¦•à§ à¦Ÿ à¦¡à§‡à¦¸à¦•à§ à¦°à¦¿à¦ªà¦¶à¦¨') {
            $lines[$i] = $line -replace 'à¦ªà§ à¦°à§‹à¦¡à¦¾à¦•à§ à¦Ÿ à¦¡à§‡à¦¸à¦•à§ à¦°à¦¿à¦ªà¦¶à¦¨ \(à¦¬à¦¾à¦‚à¦²à¦¾ à¦¬à¦¿à¦¬à¦°à¦£\)', 'Product Description'
        }
        elseif ($line -match 'à¦²à§ à¦¯à¦¾à¦¨à§ à¦¡à¦¿à¦‚ à¦ªà§‡à¦œ à¦¸à§‡à¦­ à¦•à¦°à§ à¦¨') {
            $lines[$i] = $line -replace 'à¦²à§ à¦¯à¦¾à¦¨à§ à¦¡à¦¿à¦‚ à¦ªà§‡à¦œ à¦¸à§‡à¦­ à¦•à¦°à§ à¦¨', 'Save Landing Page'
        }
        elseif ($line -match 'alert\("à¦—à§‹à¦ªà¦¨ à¦²à§ à¦¯à¦¾à¦¨à§ à¦¡à¦¿à¦‚') {
            $lines[$i] = '                      alert("Landing page link copied to clipboard! (Ready for ad campaigns)");'
        }
        elseif ($line -match 'ðŸ”— à¦—à§‹à¦ªà¦¨ à¦ªà§‡à¦œ à¦²à¦¿à¦‚à¦•') {
            $lines[$i] = $line -replace 'ðŸ”— à¦—à§‹à¦ªà¦¨ à¦ªà§‡à¦œ à¦²à¦¿à¦‚à¦• à¦•à¦ªà¦¿ à¦•à¦°à§ à¦¨', '🔗 Copy Landing Page Link'
        }
        elseif ($line -match 'Minimum Order Amount.*Discount Amount') {
            $lines[$i] = '                  {/* Min Order Amount & Discount Amount */}'
        }
        elseif ($line -match 'Min Order Amount \(Tk \)') {
            $lines[$i] = '                      💰 Min Order Amount (BDT)'
        }
        elseif ($line -match 'à¦¨à§ à¦¯à§‚à¦¨à¦¤à¦® à¦…à¦°à§ à¦¡à¦¾à¦° à¦®à§‚à¦²à§ à¦¯') {
            $lines[$i] = $line -replace '1000 \(à¦¨à§ à¦¯à§‚à¦¨à¦¤à¦® à¦…à¦°à§ à¦¡à¦¾à¦° à¦®à§‚à¦²à§ à¦¯\)', '1000 (Minimum order value)'
        }
        elseif ($line -match 'à¦•à¦¤ à¦Ÿà¦¾à¦•à¦¾à¦° à¦ªà¦£à§ à¦¯ à¦…à¦°à§ à¦¡à¦¾à¦° à¦•à¦°à¦²à§‡') {
            $lines[$i] = '                      Minimum cart value to activate this promo (e.g. 1000)'
        }
        elseif ($line -match 'Discount Amount') {
            $lines[$i] = '                      🏷️ Discount Amount'
        }
        elseif ($line -match '100 à¦¬à¦¾ 10') {
            $lines[$i] = $line -replace '100 à¦¬à¦¾ 10', '100 or 10'
        }
        elseif ($line -match 'Tk  à¦Ÿà¦¾à¦•à¦¾') {
            $lines[$i] = $line -replace 'Tk  à¦Ÿà¦¾à¦•à¦¾ \(Fixed\)', 'Fixed Tk Amount'
        }
        elseif ($line -match '% à¦¶à¦¤à¦•à¦°à¦¾') {
            $lines[$i] = $line -replace '% à¦¶à¦¤à¦•à¦°à¦¾ \(Percent\)', 'Percentage (%)'
        }
        elseif ($line -match 'à¦…à¦°à§ à¦¡à¦¾à¦°à§‡ à¦•à¦¤ à¦Ÿà¦¾à¦•à¦¾ à¦¬à¦¾') {
            $lines[$i] = '                      Discount amount deducted from order (e.g. 100 or 10%)'
        }
        elseif ($line -match 'à¦¬à¦¾ à¦¤à¦¾à¦° à¦¬à§‡à¦¶à¦¿ à¦•à§‡à¦¨à¦¾à¦•à¦¾à¦Ÿà¦¾à§Ÿ') {
            $lines[$i] = '                        ? `e.g. Orders over Tk ${offerForm.minOrderAmount} get Tk ${offerForm.discountAmount} discount!`'
        }
        elseif ($line -match 'Amount Rule: à¦•à¦¤ à¦Ÿà¦¾à¦•à¦¾à¦°') {
            $lines[$i] = '                        {/* Amount Rule: Min Order & Discount */}'
        }
        elseif ($line -match 'à¦¨à§ à¦¯à§‚à¦¨à¦¤à¦® à¦…à¦°à§ à¦¡à¦¾à¦°') {
            $lines[$i] = '                            <span>💰 Min Order: Tk {off.minOrderAmount || "0"}</span>'
        }
        elseif ($line -match 'ðŸ ·ï¸  à¦›à¦¾à§œ:') {
            $lines[$i] = $line -replace 'ðŸ ·ï¸  à¦›à¦¾à§œ:', '🏷️ Discount:'
        }
        elseif ($line -match 'New Manual Order / POS \(à¦…à¦°à§ à¦¡à¦¾à¦°') {
            $lines[$i] = $line -replace 'ðŸ›’ New Manual Order / POS \(à¦…à¦°à§ à¦¡à¦¾à¦° à¦“ à¦°à¦¸à¦¿à¦¦\)', '🛒 New Manual Order / POS (Orders & Receipts)'
        }
        elseif ($line -match 'New Manual Order & POS Voucher \(à¦¨à¦¤à§ à¦¨') {
            $lines[$i] = $line -replace 'New Manual Order & POS Voucher \(à¦¨à¦¤à§ à¦¨ à¦®à§ à¦¯à¦¾à¦¨à§ à§Ÿà¦¾à¦² à¦…à¦°à§ à¦¡à¦¾à¦° à¦“ à¦°à¦¸à¦¿à¦¦\)', 'New Manual Order & POS Voucher'
        }
        elseif ($line -match 'Customer Name \* \(à¦—à§ à¦°à¦¾à¦¹à¦•à§‡à¦° à¦¨à¦¾à¦®\)') {
            $lines[$i] = $line -replace 'Customer Name \* \(à¦—à§ à¦°à¦¾à¦¹à¦•à§‡à¦° à¦¨à¦¾à¦®\)', 'Customer Name *'
        }
        elseif ($line -match 'Delivery Zone \(à¦ à¦°à¦¿à§Ÿà¦¾\)') {
            $lines[$i] = $line -replace 'Delivery Zone \(à¦ à¦°à¦¿à§Ÿà¦¾\)', 'Delivery Zone'
        }
        elseif ($line -match 'Payment Method \(à¦ªà§‡à¦®à§‡à¦¨à§ à¦Ÿ à¦ªà¦¦à§ à¦§à¦¤à¦¿\)') {
            $lines[$i] = $line -replace 'Payment Method \(à¦ªà§‡à¦®à§‡à¦¨à§ à¦Ÿ à¦ªà¦¦à§ à¦§à¦¤à¦¿\)', 'Payment Method'
        }
        elseif ($line -match 'Cash on Delivery \(à¦•à§ à¦¯à¦¾à¦¶ à¦…à¦¨') {
            $lines[$i] = $line -replace 'Cash on Delivery \(à¦•à§ à¦¯à¦¾à¦¶ à¦…à¦¨ à¦¡à§‡à¦²à¦¿à¦­à¦¾à¦°à¦¿\)', 'Cash on Delivery (COD)'
        }
        elseif ($line -match 'POS / Card Machine \(à¦•à¦¾à¦‰à¦¨à§ à¦Ÿà¦¾à¦°') {
            $lines[$i] = $line -replace 'POS / Card Machine \(à¦•à¦¾à¦‰à¦¨à§ à¦Ÿà¦¾à¦° à¦•à¦¾à¦°à§ à¦¡\)', 'POS / Card Machine'
        }
        elseif ($line -match 'Bank Transfer \(à¦¬à§ à¦¯à¦¾à¦‚à¦•') {
            $lines[$i] = $line -replace 'Bank Transfer \(à¦¬à§ à¦¯à¦¾à¦‚à¦• à¦Ÿà§ à¦°à¦¾à¦¨à§ à¦¸à¦«à¦¾à¦°\)', 'Bank Transfer'
        }
        elseif ($line -match 'Cash Counter \(à¦•à¦¾à¦‰à¦¨à§ à¦Ÿà¦¾à¦°') {
            $lines[$i] = $line -replace 'Cash Counter \(à¦•à¦¾à¦‰à¦¨à§ à¦Ÿà¦¾à¦° à¦•à§ à¦¯à¦¾à¦¶\)', 'Cash Counter'
        }
        elseif ($line -match 'Add Product from Inventory \(à¦ªà¦£à§ à¦¯') {
            $lines[$i] = $line -replace 'ðŸ› ï¸  Add Product from Inventory \(à¦ªà¦£à§ à¦¯ à¦¨à¦¿à¦°à§ à¦¬à¦¾à¦šà¦¨ à¦•à¦°à§ à¦¨\)', '🛍️ Add Product from Inventory'
        }
        elseif ($line -match 'Items Subtotal \(à¦ªà¦£à§ à¦¯ à¦®à§‚à¦²à§ à¦¯\):') {
            $lines[$i] = $line -replace 'Items Subtotal \(à¦ªà¦£à§ à¦¯ à¦®à§‚à¦²à§ à¦¯\):', 'Items Subtotal:'
        }
        elseif ($line -match 'Delivery Fee \(à¦¡à§‡à¦²à¦¿à¦­à¦¾à¦°à¦¿ à¦šà¦¾à¦°à§ à¦œ\):') {
            $lines[$i] = $line -replace 'Delivery Fee \(à¦¡à§‡à¦²à¦¿à¦­à¦¾à¦°à¦¿ à¦šà¦¾à¦°à§ à¦œ\):', 'Delivery Fee:'
        }
        elseif ($line -match 'GRAND TOTAL \(à¦®à§‹à¦Ÿ à¦ªà§ à¦°à¦¦à§‡à¦¯à¦¼\):') {
            $lines[$i] = $line -replace 'GRAND TOTAL \(à¦®à§‹à¦Ÿ à¦ªà§ à¦°à¦¦à§‡à¦¯à¦¼\):', 'GRAND TOTAL:'
        }
        elseif ($line -match 'Confirm Order & Print Receipt \(à¦…à¦°à§ à¦¡à¦¾à¦°') {
            $lines[$i] = $line -replace 'Confirm Order & Print Receipt \(à¦…à¦°à§ à¦¡à¦¾à¦° à¦•à¦¨à¦«à¦¾à¦°à§ à¦® à¦“ à¦°à¦¸à¦¿à¦¦ à¦ªà§ à¦°à¦¿à¦¨à§ à¦Ÿ\)', 'Confirm Order & Print Receipt'
        }
        elseif ($line -match '\+ New Manual Order / POS \(à¦¨à¦¤à§ à¦¨') {
            $lines[$i] = $line -replace 'ðŸ›’ \+ New Manual Order / POS \(à¦¨à¦¤à§ à¦¨ à¦…à¦°à§ à¦¡à¦¾à¦°\)', '🛒 + New Manual Order / POS'
        }
        elseif ($line -match 'ORDERED ITEMS \(à¦•à§€ à¦…à¦°à§ à¦¡à¦¾à¦°') {
            $lines[$i] = $line -replace 'ORDERED ITEMS \(à¦•à§€ à¦…à¦°à§ à¦¡à¦¾à¦° à¦•à¦°à§‡à¦›à§‡\):', 'ORDERED ITEMS:'
        }
        elseif ($line -match 'Pathao Courier API Dispatch \(à§§-à¦•à§ à¦²à¦¿à¦•à§‡') {
            $lines[$i] = $line -replace 'Pathao Courier API Dispatch \(à§§-à¦•à§ à¦²à¦¿à¦•à§‡ à¦ªà¦¾à¦ à¦¾à¦“ à¦•à§ à¦°à¦¿à§Ÿà¦¾à¦°à§‡ à¦ªà¦¾à¦ à¦¾à¦¨\)', 'Pathao Courier API Dispatch'
        }
        elseif ($line -match 'Choose Format \(à¦°à¦¸à¦¿à¦¦à§‡à¦° à¦§à¦°à¦¨') {
            $lines[$i] = $line -replace 'ðŸ§¾ Choose Format \(à¦°à¦¸à¦¿à¦¦à§‡à¦° à¦§à¦°à¦¨ à¦¨à¦¿à¦°à§ à¦¬à¦¾à¦šà¦¨ à¦•à¦°à§ à¦¨\):', '🧾 Choose Receipt Format:'
        }
        elseif ($line -match 'POS 80mm Thermal \(à¦•à§ à¦¯à¦¾à¦¶') {
            $lines[$i] = $line -replace 'ðŸ§¾ POS 80mm Thermal \(à¦•à§ à¦¯à¦¾à¦¶ à¦®à§‡à¦®à§‹\)', '🧾 POS 80mm Thermal (Receipt)'
        }
        elseif ($line -match 'Header & Footer Menu Management \(ওয়েবসাইট') {
            $lines[$i] = '            📑 Header & Footer Menu Management'
        }
    }
}

[System.IO.File]::WriteAllLines($filePath, $lines, [System.Text.Encoding]::UTF8)
Write-Host "Processed remaining lines."

