Write-Host "`n======================================================="
Write-Host "   GLOWGOODLY - PHASE 1.7 AUTOMATED TEST SUITE"
Write-Host "=======================================================`n"

$passed = 0
$failed = 0

function Assert-Test($name, $condition, $failureMsg) {
    if ($condition) {
        Write-Host "✅ [PASS] $name"
        $script:passed++
    } else {
        Write-Host "❌ [FAIL] $name : $failureMsg"
        $script:failed++
    }
}

# ─── TEST 1: Startup Product Cleanup Removal ───
$serverContent = Get-Content "backend\src\server.ts" -Raw
$hasStartupCleanup = $serverContent.Contains("cleanAllDummyData()")
Assert-Test "Test 1A: server.ts does NOT call cleanAllDummyData() on startup" (-not $hasStartupCleanup) "cleanAllDummyData() is still called in server.ts!"

$cleanFileContent = Get-Content "backend\src\clean-dummy-products.ts" -Raw
$hasSafetyGuard = $cleanFileContent.Contains("ENABLE_DANGEROUS_CLEANUP_PURGE")
Assert-Test "Test 1B: clean-dummy-products.ts has safety guard" $hasSafetyGuard "Safety guard missing in clean-dummy-products.ts"

$adminContent = Get-Content "backend\src\routes\admin.ts" -Raw
$adminCleanDisabled = $adminContent.Contains("Automatic dummy data cleanup is permanently disabled")
Assert-Test "Test 1C: /api/admin/clean-dummy-data is disabled" $adminCleanDisabled "Admin clean route is not disabled"

# ─── TEST 2: Double Stock Deduction Fix ───
$ordersContent = Get-Content "backend\src\routes\orders.ts" -Raw
$hasSkipStockFlag = $ordersContent.Contains("skipPrismaStockUpdate: true")
Assert-Test "Test 2A: orders.ts passes skipPrismaStockUpdate: true" $hasSkipStockFlag "orders.ts must pass skipPrismaStockUpdate: true"

$inventoryContent = Get-Content "backend\src\routes\inventory.ts" -Raw
$hasOptionParam = $inventoryContent.Contains("options?: { skipPrismaStockUpdate?: boolean }")
Assert-Test "Test 2B: recordInventorySale supports skipPrismaStockUpdate" $hasOptionParam "inventory.ts does not support skipPrismaStockUpdate"

# ─── TEST 3: Chat Ownership Validation ───
$chatContent = Get-Content "backend\src\routes\chat.ts" -Raw
$hasVerifyChatAuth = $chatContent.Contains("verifyChatAuthorization")
Assert-Test "Test 3A: chat.ts defines verifyChatAuthorization helper" $hasVerifyChatAuth "verifyChatAuthorization is missing in chat.ts"

$hasHistoryAuthCheck = $chatContent.Contains("const auth = verifyChatAuthorization(req, chatId);")
Assert-Test "Test 3B: GET /chat/history/:chatId enforces ownership authorization" $hasHistoryAuthCheck "History route does not check ownership"

$hasSocketAuthCheck = $serverContent.Contains("decoded.chatId === targetChatId")
Assert-Test "Test 3C: server.ts join_chat verifies room authorization" $hasSocketAuthCheck "Socket join_chat does not verify ownership"

# ─── TEST 4: Persistent JWT Revocation ───
$authContent = Get-Content "backend\src\middleware\auth.ts" -Raw
$hasRevocationFile = $authContent.Contains("revoked_tokens.json")
$hasSha256Hash = $authContent.Contains("sha256")
Assert-Test "Test 4A: auth.ts uses persistent JSON file for revoked tokens" $hasRevocationFile "Persistent revocation file missing"
Assert-Test "Test 4B: auth.ts stores SHA-256 token hashes instead of plaintext" $hasSha256Hash "Token hashing missing"

# ─── TEST 5: Order Cancellation Atomicity ───
$hasAtomicTx = $ordersContent.Contains("await prisma.`$transaction(async (tx) =>")
$hasStockRestoredGuard = $ordersContent.Contains("[STOCK_RESTORED]")
Assert-Test "Test 5A: orders.ts cancellation wraps stock restoration in transaction" $hasAtomicTx "Cancellation transaction missing"
Assert-Test "Test 5B: orders.ts has idempotent [STOCK_RESTORED] concurrency guard" $hasStockRestoredGuard "Idempotency guard missing"

# ─── TEST 6: Postinstall Safety ───
$packageJson = Get-Content "backend\package.json" -Raw | ConvertFrom-Json
$postinstallCmd = $packageJson.scripts.postinstall
Assert-Test "Test 6: package.json postinstall does NOT run prisma db push" ($postinstallCmd -notlike "*prisma db push*") "postinstall still contains prisma db push!"

# ─── TEST 7: Auto-Reply Templates in Admin Live Chat ───
$valobasaContent = Get-Content "frontend\src\app\valobasa\page.tsx" -Raw
$hasAutoReplies = $valobasaContent.Contains("Auto Replies:")
Assert-Test "Test 7: Admin Panel Live Chat contains Quick Auto Reply templates" $hasAutoReplies "Live chat auto reply templates missing in valobasa/page.tsx"

# ─── TEST 8: Manual Order & POS Voucher Partial Payment ───
$hasPaidField = $valobasaContent.Contains("manualOrderPaidAmount")
$hasDueCalculation = $valobasaContent.Contains("dueVal = Math.max(0, grandTotal - paidVal)")
$hasVoucherDue = $valobasaContent.Contains("selectedVoucherOrder.paidAmount")
Assert-Test "Test 8A: Manual Order form contains Paid Amount field" $hasPaidField "manualOrderPaidAmount state missing"
Assert-Test "Test 8B: Manual Order form calculates and displays Due Amount" $hasDueCalculation "Due calculation missing"
Assert-Test "Test 8C: POS Voucher / Cash Memo displays Paid and Due amounts" $hasVoucherDue "Voucher receipt does not display Paid and Due"

Write-Host "`n======================================================="
Write-Host "TEST SUMMARY: $passed PASSED, $failed FAILED"
Write-Host "=======================================================`n"

if ($failed -gt 0) {
    exit 1
}
