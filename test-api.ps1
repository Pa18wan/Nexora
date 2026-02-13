# Nexora API Testing Script - Comprehensive Test
# Tests all panels: Client, Advocate, Admin

Write-Host ""
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "     NEXORA PLATFORM - COMPREHENSIVE API TESTING        " -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host ""

$baseUrl = "http://localhost:5000/api"
$passed = 0
$failed = 0

function Test-Endpoint {
    param (
        [string]$Name,
        [string]$Method,
        [string]$Url,
        [string]$Token = "",
        [hashtable]$Body = $null
    )
    
    try {
        $headers = @{ "Content-Type" = "application/json" }
        if ($Token) { $headers["Authorization"] = "Bearer $Token" }
        
        $params = @{
            Uri         = $Url
            Method      = $Method
            Headers     = $headers
            ErrorAction = "Stop"
        }
        
        if ($Body) { $params["Body"] = ($Body | ConvertTo-Json -Depth 5) }
        
        $response = Invoke-RestMethod @params
        
        if ($response.success -eq $true) {
            Write-Host "  [PASS] $Name" -ForegroundColor Green
            $script:passed++
            return $response
        }
        else {
            Write-Host "  [FAIL] $Name - Response indicated failure" -ForegroundColor Red
            $script:failed++
            return $null
        }
    }
    catch {
        $errMsg = $_.Exception.Message
        if ($errMsg.Length -gt 60) { $errMsg = $errMsg.Substring(0, 60) + "..." }
        Write-Host "  [FAIL] $Name - $errMsg" -ForegroundColor Red
        $script:failed++
        return $null
    }
}

# Test 1: Health Check
Write-Host "--------------------------------------------------------" -ForegroundColor Gray
Write-Host "  SYSTEM HEALTH" -ForegroundColor Yellow
Write-Host "--------------------------------------------------------" -ForegroundColor Gray
Test-Endpoint -Name "API Health Check" -Method "GET" -Url "$baseUrl/health"

# Test 2: Authentication
Write-Host ""
Write-Host "--------------------------------------------------------" -ForegroundColor Gray
Write-Host "  AUTHENTICATION" -ForegroundColor Yellow
Write-Host "--------------------------------------------------------" -ForegroundColor Gray

$adminLogin = Test-Endpoint -Name "Admin Login" -Method "POST" -Url "$baseUrl/auth/login" -Body @{email = 'admin@nexora.com'; password = 'password123' }
$adminToken = if ($adminLogin -and $adminLogin.data) { $adminLogin.data.token } else { "" }

$clientLogin = Test-Endpoint -Name "Client Login" -Method "POST" -Url "$baseUrl/auth/login" -Body @{email = 'client1@example.com'; password = 'password123' }
$clientToken = if ($clientLogin -and $clientLogin.data) { $clientLogin.data.token } else { "" }

$advocateLogin = Test-Endpoint -Name "Advocate Login" -Method "POST" -Url "$baseUrl/auth/login" -Body @{email = 'advocate1@example.com'; password = 'password123' }
$advocateToken = if ($advocateLogin -and $advocateLogin.data) { $advocateLogin.data.token } else { "" }

Test-Endpoint -Name "Get Current User (Admin)" -Method "GET" -Url "$baseUrl/auth/me" -Token $adminToken
Test-Endpoint -Name "Get Current User (Client)" -Method "GET" -Url "$baseUrl/auth/me" -Token $clientToken
Test-Endpoint -Name "Get Current User (Advocate)" -Method "GET" -Url "$baseUrl/auth/me" -Token $advocateToken

# Test 3: Client Panel
Write-Host ""
Write-Host "--------------------------------------------------------" -ForegroundColor Gray
Write-Host "  CLIENT PANEL" -ForegroundColor Yellow
Write-Host "--------------------------------------------------------" -ForegroundColor Gray

Test-Endpoint -Name "Client Dashboard" -Method "GET" -Url "$baseUrl/client/dashboard" -Token $clientToken
$clientCases = Test-Endpoint -Name "Client Cases List" -Method "GET" -Url "$baseUrl/client/cases" -Token $clientToken

$newCase = Test-Endpoint -Name "Submit New Case" -Method "POST" -Url "$baseUrl/client/cases" -Token $clientToken -Body @{
    title       = "Test Property Dispute Case"
    description = "This is a comprehensive test case for property dispute involving boundary issues with my neighbor. The neighbor has built a structure that encroaches on my land. I have documents proving my ownership."
    category    = "Property"
}

if ($newCase -and $newCase.data -and $newCase.data.case) { 
    $caseId = $newCase.data.case._id
    Test-Endpoint -Name "Get Advocate Recommendations" -Method "GET" -Url "$baseUrl/client/cases/$caseId/recommendations" -Token $clientToken
}

# Test 4: Advocate Panel
Write-Host ""
Write-Host "--------------------------------------------------------" -ForegroundColor Gray
Write-Host "  ADVOCATE PANEL" -ForegroundColor Yellow
Write-Host "--------------------------------------------------------" -ForegroundColor Gray

Test-Endpoint -Name "Advocate Dashboard" -Method "GET" -Url "$baseUrl/advocate/dashboard" -Token $advocateToken
Test-Endpoint -Name "Advocate Cases" -Method "GET" -Url "$baseUrl/advocate/cases" -Token $advocateToken
Test-Endpoint -Name "Case Requests" -Method "GET" -Url "$baseUrl/advocate/case-requests" -Token $advocateToken
Test-Endpoint -Name "Advocate Analytics" -Method "GET" -Url "$baseUrl/advocate/analytics" -Token $advocateToken
Test-Endpoint -Name "Update Availability" -Method "PUT" -Url "$baseUrl/advocate/availability" -Token $advocateToken -Body @{isAcceptingCases = $true }

# Test 5: Admin Panel
Write-Host ""
Write-Host "--------------------------------------------------------" -ForegroundColor Gray
Write-Host "  ADMIN PANEL" -ForegroundColor Yellow
Write-Host "--------------------------------------------------------" -ForegroundColor Gray

Test-Endpoint -Name "Admin Dashboard" -Method "GET" -Url "$baseUrl/admin/dashboard" -Token $adminToken
Test-Endpoint -Name "Get All Users" -Method "GET" -Url "$baseUrl/admin/users" -Token $adminToken
Test-Endpoint -Name "Pending Advocate Verifications" -Method "GET" -Url "$baseUrl/admin/advocates/pending" -Token $adminToken
Test-Endpoint -Name "System Settings" -Method "GET" -Url "$baseUrl/admin/settings" -Token $adminToken

# Test 6: AI Features
Write-Host ""
Write-Host "--------------------------------------------------------" -ForegroundColor Gray
Write-Host "  AI FEATURES" -ForegroundColor Yellow
Write-Host "--------------------------------------------------------" -ForegroundColor Gray

Test-Endpoint -Name "AI Chat" -Method "POST" -Url "$baseUrl/ai/chat" -Token $clientToken -Body @{
    message = "What are my options for filing a property dispute case?"
}
Test-Endpoint -Name "AI Logs (Admin)" -Method "GET" -Url "$baseUrl/ai/logs" -Token $adminToken

# Test 7: Public Endpoints
Write-Host ""
Write-Host "--------------------------------------------------------" -ForegroundColor Gray
Write-Host "  PUBLIC ENDPOINTS" -ForegroundColor Yellow
Write-Host "--------------------------------------------------------" -ForegroundColor Gray

Test-Endpoint -Name "Get Specializations" -Method "GET" -Url "$baseUrl/advocates/specializations"
Test-Endpoint -Name "Search Advocates" -Method "GET" -Url "$baseUrl/advocates"

# Test 8: Notifications
Write-Host ""
Write-Host "--------------------------------------------------------" -ForegroundColor Gray
Write-Host "  NOTIFICATIONS" -ForegroundColor Yellow
Write-Host "--------------------------------------------------------" -ForegroundColor Gray

Test-Endpoint -Name "Get Notifications (Client)" -Method "GET" -Url "$baseUrl/notifications" -Token $clientToken

# Test 9: Documents
Write-Host ""
Write-Host "--------------------------------------------------------" -ForegroundColor Gray
Write-Host "  DOCUMENTS" -ForegroundColor Yellow
Write-Host "--------------------------------------------------------" -ForegroundColor Gray

Test-Endpoint -Name "Get Documents (Client)" -Method "GET" -Url "$baseUrl/documents" -Token $clientToken

# Results Summary
Write-Host ""
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "                    TEST RESULTS                        " -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Passed: $passed tests" -ForegroundColor Green
Write-Host "  Failed: $failed tests" -ForegroundColor Red
$total = $passed + $failed
if ($total -gt 0) {
    $percentage = [math]::Round(($passed / $total) * 100)
    Write-Host "  Success Rate: $percentage%" -ForegroundColor Yellow
}
Write-Host ""

if ($failed -eq 0) {
    Write-Host "  ALL TESTS PASSED! The Nexora platform is working correctly." -ForegroundColor Green
}
else {
    Write-Host "  Some tests failed. Please review the errors above." -ForegroundColor Yellow
}
Write-Host ""
