// Web server for verification portal
const express = require('express');
const path = require('path');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const logger = require('../utils/logger');
const { verifyRoute } = require('./routes/verify');
const { recaptchaRoute } = require('./routes/recaptcha');
const { smsRoute } = require('./routes/sms');
const { statusRoute } = require('./routes/status');

function start(client) {
  const app = express();
  const PORT = process.env.PORT || 3000;
  
  // Middleware
  app.use(cors());
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: true }));

  // Set view engine
  app.set('view engine', 'ejs');
  app.set('views', path.join(__dirname, 'views'));

  // Static files
  app.use(express.static(path.join(__dirname, 'public')));

  // Check if views directory exists
  const viewsDir = path.join(__dirname, 'views');
  if (!fs.existsSync(viewsDir)) {
    fs.mkdirSync(viewsDir, { recursive: true });
    logger.info(`Created missing views directory: ${viewsDir}`);
  }
  
  // Check for and create index.ejs if needed
  const indexPath = path.join(viewsDir, 'index.ejs');
  if (!fs.existsSync(indexPath)) {
    const mockMode = process.env.USE_MOCK_MODE === 'true';
    const indexContent = `<!DOCTYPE html>
<html lang="zh-TW">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Discord 驗證機器人</title>
  <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
</head>
<body class="bg-gray-100 min-h-screen">
  <div class="container mx-auto p-4 max-w-4xl">
    <div class="bg-white rounded-lg shadow-md p-6">
      <div class="text-center mb-6">
        <svg class="w-16 h-16 mx-auto text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
        </svg>
        <h1 class="text-2xl font-bold text-gray-800 mt-4">Discord 驗證機器人</h1>
        <p class="text-gray-600 mt-2">雙重驗證系統管理面板</p>
        
        <% if (mockMode) { %>
          <div class="mt-4 bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4" role="alert">
            <p class="font-bold">目前處於模擬模式</p>
            <p>系統正在使用模擬數據進行測試，不會連接到實際的外部API。</p>
          </div>
        <% } %>
      </div>
      
      <div class="grid md:grid-cols-2 gap-6">
        <div class="bg-blue-50 p-6 rounded-lg">
          <h2 class="text-xl font-semibold mb-4 text-blue-800">系統狀態</h2>
          <ul class="space-y-2">
            <li class="flex items-start">
              <span class="h-6 flex items-center sm:h-7">
                <svg class="flex-shrink-0 h-5 w-5 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                </svg>
              </span>
              <p class="ml-2 text-gray-700">
                驗證網頁服務: <span class="font-medium text-green-600">運行中</span>
              </p>
            </li>
            <li class="flex items-start">
              <span class="h-6 flex items-center sm:h-7">
                <% if (mockMode) { %>
                  <svg class="flex-shrink-0 h-5 w-5 text-yellow-500" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
                  </svg>
                <% } else { %>
                  <svg class="flex-shrink-0 h-5 w-5 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                  </svg>
                <% } %>
              </span>
              <p class="ml-2 text-gray-700">
                Discord 機器人: 
                <% if (mockMode) { %>
                  <span class="font-medium text-yellow-600">模擬模式</span>
                <% } else { %>
                  <span class="font-medium text-green-600">已連接</span>
                <% } %>
              </p>
            </li>
            <li class="flex items-start">
              <span class="h-6 flex items-center sm:h-7">
                <% if (mockMode) { %>
                  <svg class="flex-shrink-0 h-5 w-5 text-yellow-500" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
                  </svg>
                <% } else { %>
                  <svg class="flex-shrink-0 h-5 w-5 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                  </svg>
                <% } %>
              </span>
              <p class="ml-2 text-gray-700">
                資料庫連接: 
                <% if (mockMode) { %>
                  <span class="font-medium text-yellow-600">模擬模式</span>
                <% } else { %>
                  <span class="font-medium text-green-600">已連接</span>
                <% } %>
              </p>
            </li>
          </ul>
        </div>
        
        <div class="bg-indigo-50 p-6 rounded-lg">
          <h2 class="text-xl font-semibold mb-4 text-indigo-800">快速連結</h2>
          <div class="space-y-3">
            <a href="#" class="block px-4 py-2 bg-white rounded shadow hover:shadow-md transition-shadow duration-200">
              <span class="font-medium text-indigo-700">📊 管理員儀表板</span>
              <p class="text-sm text-gray-600">監控與管理驗證流程</p>
            </a>
            <a href="/verify/test/mocktoken" class="block px-4 py-2 bg-white rounded shadow hover:shadow-md transition-shadow duration-200">
              <span class="font-medium text-indigo-700">🧪 測試驗證流程</span>
              <p class="text-sm text-gray-600">使用測試數據模擬驗證</p>
            </a>
            <a href="https://discord.com/developers/applications" target="_blank" class="block px-4 py-2 bg-white rounded shadow hover:shadow-md transition-shadow duration-200">
              <span class="font-medium text-indigo-700">⚙️ Discord 開發者平台</span>
              <p class="text-sm text-gray-600">管理您的 Discord 應用程序</p>
            </a>
          </div>
        </div>
      </div>
      
      <div class="mt-8 pt-6 border-t border-gray-200">
        <h2 class="text-xl font-semibold mb-4">使用指南</h2>
        <div class="space-y-4">
          <div>
            <h3 class="font-medium text-gray-800">Discord 伺服器設置</h3>
            <p class="text-gray-600">使用指令設置您的 Discord 伺服器驗證系統。</p>
            <div class="mt-2 bg-gray-100 p-3 rounded-md">
              <code class="text-sm text-indigo-600 whitespace-pre-wrap">
/setup verified_role:已驗證 require_recaptcha:true require_sms:true
              </code>
            </div>
          </div>
          
          <div>
            <h3 class="font-medium text-gray-800">用戶驗證流程</h3>
            <p class="text-gray-600">通知用戶使用以下指令開始驗證。</p>
            <div class="mt-2 bg-gray-100 p-3 rounded-md">
              <code class="text-sm text-indigo-600 whitespace-pre-wrap">
/verify
              </code>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <div class="mt-6 text-center text-gray-500 text-sm">
      &copy; <%= new Date().getFullYear() %> Discord 驗證機器人. 保留所有權利.
    </div>
  </div>
</body>
</html>`;
    fs.writeFileSync(indexPath, indexContent);
    logger.info(`Created missing template: ${indexPath}`);
  }
  
  // Check if required view templates exist
  const requiredTemplates = ['error.ejs', 'verify.ejs'];
  requiredTemplates.forEach(template => {
    const templatePath = path.join(viewsDir, template);
    if (!fs.existsSync(templatePath)) {
      // Create default template
      let defaultContent = '';
      
      if (template === 'error.ejs') {
        defaultContent = `<!DOCTYPE html>
<html lang="zh-TW">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>錯誤 - Discord 驗證</title>
  <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
</head>
<body class="bg-gray-100 min-h-screen flex items-center justify-center">
  <div class="container mx-auto p-4 max-w-md">
    <div class="bg-white rounded-lg shadow-md p-6">
      <div class="text-center mb-6">
        <svg class="w-16 h-16 mx-auto text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
        </svg>
        <h1 class="text-2xl font-bold text-gray-800 mt-4"><%= message %></h1>
        <p class="text-gray-600 mt-2"><%= details || '處理您的請求時出錯。請稍後再試。' %></p>
      </div>
      
      <div class="text-center">
        <a href="/" class="inline-block bg-indigo-500 text-white py-2 px-4 rounded hover:bg-indigo-600 transition duration-200">
          返回首頁
        </a>
        <a href="https://discord.com" class="inline-block bg-gray-500 text-white py-2 px-4 rounded hover:bg-gray-600 transition duration-200 ml-2">
          返回 Discord
        </a>
      </div>
    </div>
  </div>
</body>
</html>`;
      } else if (template === 'verify.ejs') {
        defaultContent = fs.readFileSync(path.join(__dirname, 'views', 'verify.ejs'), 'utf8');
        if (!defaultContent) {
          defaultContent = `<!DOCTYPE html>
<html lang="zh-TW">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Discord 驗證 - <%= guildName %></title>
  <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
  <script src="https://www.google.com/recaptcha/api.js" async defer></script>
  <style>
    .step-container {
      transition: all 0.3s ease;
    }
    .fade-in {
      animation: fadeIn 0.5s;
    }
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
  </style>
</head>
<body class="bg-gray-100 min-h-screen">
  <div class="container mx-auto p-4 max-w-md">
    <div class="bg-white rounded-lg shadow-md p-6">
      <div class="text-center mb-6">
        <h1 class="text-2xl font-bold text-gray-800 mb-2">Discord 驗證</h1>
        <p class="text-gray-600">為 <span class="font-semibold"><%= guildName %></span> 完成驗證</p>
      </div>
      
      <div class="mb-8">
        <div class="flex items-center mb-4">
          <div class="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">
            1
          </div>
          <div class="ml-3 text-lg font-semibold">驗證步驟</div>
        </div>
        
        <div class="pl-11">
          <ul class="list-disc space-y-2 text-gray-700">
            <% if (requireRecaptcha) { %>
              <li>完成 reCAPTCHA 驗證</li>
            <% } %>
            <% if (requireSMS) { %>
              <li>完成手機簡訊驗證</li>
            <% } %>
            <li>獲取服務器訪問權限</li>
          </ul>
        </div>
      </div>
      
      <div class="space-y-6">
        <!-- reCAPTCHA Step -->
        <% if (requireRecaptcha) { %>
        <div id="recaptcha-step" class="step-container <%= verificationStatus.reCaptcha ? 'hidden' : '' %>">
          <h2 class="text-lg font-semibold mb-3">步驟 1: reCAPTCHA 驗證</h2>
          <p class="text-gray-600 mb-4">請完成下面的reCAPTCHA驗證，證明您不是機器人。</p>
          
          <div class="flex justify-center mb-4">
            <div id="recaptcha-container" class="g-recaptcha" data-sitekey="<%= recaptchaSiteKey %>"></div>
          </div>
          
          <div class="text-center">
            <button id="verify-recaptcha-btn" class="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 transition duration-200">
              驗證 reCAPTCHA
            </button>
          </div>
        </div>
        <% } %>
        
        <!-- SMS Verification Step -->
        <% if (requireSMS) { %>
        <div id="sms-step" class="step-container <%= (!requireRecaptcha || verificationStatus.reCaptcha) && !verificationStatus.sms ? '' : 'hidden' %>">
          <h2 class="text-lg font-semibold mb-3">
            <% if (requireRecaptcha) { %>步驟 2<% } else { %>步驟 1<% } %>: SMS 驗證
          </h2>
          <p class="text-gray-600 mb-4">請輸入您的手機號碼以接收驗證碼。</p>
          
          <div id="phone-input-container" class="<%= verificationStatus.sms ? 'hidden' : '' %>">
            <div class="mb-4">
              <label for="country-code" class="block text-sm font-medium text-gray-700 mb-1">國家代碼</label>
              <select id="country-code" class="w-full p-2 border border-gray-300 rounded">
                <option value="886">台灣 (+886)</option>
                <option value="1">美國/加拿大 (+1)</option>
                <option value="86">中國 (+86)</option>
                <option value="852">香港 (+852)</option>
                <option value="65">新加坡 (+65)</option>
                <option value="81">日本 (+81)</option>
                <option value="82">韓國 (+82)</option>
              </select>
            </div>
            
            <div class="mb-4">
              <label for="phone-number" class="block text-sm font-medium text-gray-700 mb-1">手機號碼</label>
              <input type="tel" id="phone-number" class="w-full p-2 border border-gray-300 rounded" placeholder="請輸入手機號碼">
            </div>
            
            <div class="text-center">
              <button id="send-sms-btn" class="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 transition duration-200">
                發送驗證碼
              </button>
            </div>
          </div>
          
          <div id="code-input-container" class="hidden">
            <div class="mb-4">
              <label for="verification-code" class="block text-sm font-medium text-gray-700 mb-1">驗證碼</label>
              <input type="text" id="verification-code" class="w-full p-2 border border-gray-300 rounded" placeholder="請輸入6位數驗證碼" maxlength="6">
              <p class="text-xs text-gray-500 mt-1">驗證碼已發送到您的手機，有效期5分鐘</p>
            </div>
            
            <div class="text-center">
              <button id="verify-code-btn" class="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 transition duration-200">
                驗證
              </button>
              <button id="resend-code-btn" class="w-full mt-2 bg-gray-200 text-gray-700 py-2 px-4 rounded hover:bg-gray-300 transition duration-200">
                重新發送驗證碼
              </button>
            </div>
          </div>
        </div>
        <% } %>
        
        <!-- Completion Step -->
        <div id="completion-step" class="step-container hidden text-center">
          <div class="mb-6">
            <svg class="w-16 h-16 mx-auto text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <h2 class="text-xl font-bold text-gray-800 mt-4">驗證成功！</h2>
            <p class="text-gray-600 mt-2">您已完成所有驗證步驟。</p>
          </div>
          
          <p class="text-gray-700 mb-4">您現在可以返回Discord，已授予您訪問<span class="font-semibold"><%= guildName %></span>的權限。</p>
          
          <a href="https://discord.com/channels/<%= guildId %>" target="_blank" class="inline-block bg-indigo-500 text-white py-2 px-4 rounded hover:bg-indigo-600 transition duration-200">
            返回Discord
          </a>
        </div>
        
        <!-- Error messages -->
        <div id="error-container" class="hidden bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
          <span id="error-message">出錯了</span>
        </div>
        
        <!-- Success messages -->
        <div id="success-container" class="hidden bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4">
          <span id="success-message">成功</span>
        </div>
      </div>
    </div>
  </div>
  
  <script>
    // Store verification data
    const userData = {
      userId: "<%= userId %>",
      token: "<%= token %>",
      guildId: "<%= guildId %>",
      verificationStatus: JSON.parse('<%= JSON.stringify(verificationStatus) %>')
    };
    
    // Check if we're in mock mode
    const mockMode = <%= process.env.USE_MOCK_MODE === 'true' ? 'true' : 'false' %>;
    
    // DOM elements
    const recaptchaStep = document.getElementById('recaptcha-step');
    const smsStep = document.getElementById('sms-step');
    const completionStep = document.getElementById('completion-step');
    const phoneInputContainer = document.getElementById('phone-input-container');
    const codeInputContainer = document.getElementById('code-input-container');
    const errorContainer = document.getElementById('error-container');
    const errorMessage = document.getElementById('error-message');
    const successContainer = document.getElementById('success-container');
    const successMessage = document.getElementById('success-message');
    
    // Buttons
    const verifyRecaptchaBtn = document.getElementById('verify-recaptcha-btn');
    const sendSmsBtn = document.getElementById('send-sms-btn');
    const verifyCodeBtn = document.getElementById('verify-code-btn');
    const resendCodeBtn = document.getElementById('resend-code-btn');
    
    // Input fields
    const countryCodeSelect = document.getElementById('country-code');
    const phoneNumberInput = document.getElementById('phone-number');
    const verificationCodeInput = document.getElementById('verification-code');
    
    // Show error message
    function showError(message) {
      errorMessage.textContent = message;
      errorContainer.classList.remove('hidden');
      successContainer.classList.add('hidden');
      
      // Auto-hide after 5 seconds
      setTimeout(() => {
        errorContainer.classList.add('hidden');
      }, 5000);
    }
    
    // Show success message
    function showSuccess(message) {
      successMessage.textContent = message;
      successContainer.classList.remove('hidden');
      errorContainer.classList.add('hidden');
      
      // Auto-hide after 5 seconds
      setTimeout(() => {
        successContainer.classList.add('hidden');
      }, 5000);
    }
    
    // Update UI based on verification status
    function updateUI() {
      // If both verifications are complete, show completion step
      if ((userData.verificationStatus.reCaptcha || !<%= requireRecaptcha %>) && 
          (userData.verificationStatus.sms || !<%= requireSMS %>)) {
        
        // Complete verification
        completeVerification();
      }
      // If reCAPTCHA is complete but SMS is required, show SMS step
      else if (userData.verificationStatus.reCaptcha && <%= requireSMS %> && !userData.verificationStatus.sms) {
        if (recaptchaStep) recaptchaStep.classList.add('hidden');
        smsStep.classList.remove('hidden');
        smsStep.classList.add('fade-in');
      }
    }
    
    // Complete verification and assign roles
    async function completeVerification() {
      try {
        const response = await fetch('/verify/complete', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            userId: userData.userId,
            token: userData.token,
            guildId: userData.guildId
          })
        });
        
        const data = await response.json();
        
        if (data.success) {
          // Hide all other steps
          if (recaptchaStep) recaptchaStep.classList.add('hidden');
          if (smsStep) smsStep.classList.add('hidden');
          
          // Show completion step
          completionStep.classList.remove('hidden');
          completionStep.classList.add('fade-in');
        } else {
          showError(data.message || '完成驗證時出錯');
        }
      } catch (error) {
        console.error('Error completing verification:', error);
        showError('完成驗證時出錯。請稍後再試。');
      }
    }
    
    // reCAPTCHA verification
    if (verifyRecaptchaBtn) {
      verifyRecaptchaBtn.addEventListener('click', async () => {
        const recaptchaResponse = grecaptcha.getResponse();
        
        if (!recaptchaResponse && !mockMode) {
          showError('請完成reCAPTCHA驗證');
          return;
        }
        
        try {
          verifyRecaptchaBtn.disabled = true;
          verifyRecaptchaBtn.textContent = '驗證中...';
          
          const response = await fetch('/api/recaptcha/verify', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              recaptchaToken: recaptchaResponse || 'mock-token',
              userId: userData.userId,
              verificationToken: userData.token
            })
          });
          
          const data = await response.json();
          
          if (data.success) {
            userData.verificationStatus = data.verificationStatus;
            showSuccess('reCAPTCHA驗證成功！');
            
            // Update UI based on new status
            updateUI();
          } else {
            showError(data.message || 'reCAPTCHA驗證失敗');
            if (!mockMode) {
              grecaptcha.reset();
            }
          }
        } catch (error) {
          console.error('Error verifying reCAPTCHA:', error);
          showError('驗證reCAPTCHA時出錯。請稍後再試。');
          if (!mockMode) {
            grecaptcha.reset();
          }
        } finally {
          verifyRecaptchaBtn.disabled = false;
          verifyRecaptchaBtn.textContent = '驗證 reCAPTCHA';
        }
      });
    }
    
    // Send SMS verification code
    if (sendSmsBtn) {
      sendSmsBtn.addEventListener('click', async () => {
        let countryCode = countryCodeSelect.value;
        let phoneNumber = phoneNumberInput.value.trim();
        
        if (!phoneNumber && !mockMode) {
          showError('請輸入您的手機號碼');
          return;
        }
        
        // In mock mode, use a fake phone number if none is provided
        if (mockMode && !phoneNumber) {
          countryCode = '1';
          phoneNumber = '5551234567';
        }
        
        try {
          sendSmsBtn.disabled = true;
          sendSmsBtn.textContent = '發送中...';
          
          const response = await fetch('/api/sms/send', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              countryCode,
              phoneNumber,
              userId: userData.userId,
              token: userData.token
            })
          });
          
          const data = await response.json();
          
          if (data.success) {
            showSuccess('驗證碼已發送到您的手機');
            
            // Show code input container
            phoneInputContainer.classList.add('hidden');
            codeInputContainer.classList.remove('hidden');
            codeInputContainer.classList.add('fade-in');
            
            // If in mock mode, auto-fill the code
            if (data.mockCode) {
              verificationCodeInput.value = data.mockCode;
            }
          } else {
            showError(data.message || '發送驗證碼失敗');
          }
        } catch (error) {
          console.error('Error sending SMS code:', error);
          showError('發送驗證碼時出錯。請稍後再試。');
        } finally {
          sendSmsBtn.disabled = false;
          sendSmsBtn.textContent = '發送驗證碼';
        }
      });
    }
    
    // Verify SMS code
    if (verifyCodeBtn) {
      verifyCodeBtn.addEventListener('click', async () => {
        let code = verificationCodeInput.value.trim();
        
        if (!code && !mockMode) {
          showError('請輸入6位數驗證碼');
          return;
        }
        
        // In mock mode, use a fake code if none is provided
        if (mockMode && !code) {
          code = '123456';
        }
        
        try {
          verifyCodeBtn.disabled = true;
          verifyCodeBtn.textContent = '驗證中...';
          
          const response = await fetch('/api/sms/verify', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              code,
              userId: userData.userId,
              token: userData.token
            })
          });
          
          const data = await response.json();
          
          if (data.success) {
            userData.verificationStatus = data.verificationStatus;
            showSuccess('SMS驗證成功！');
            
            // Update UI based on new status
            updateUI();
          } else {
            showError(data.message || '驗證碼錯誤');
          }
        } catch (error) {
          console.error('Error verifying SMS code:', error);
          showError('驗證SMS代碼時出錯。請稍後再試。');
        } finally {
          verifyCodeBtn.disabled = false;
          verifyCodeBtn.textContent = '驗證';
        }
      });
    }
    
    // Resend verification code
    if (resendCodeBtn) {
      resendCodeBtn.addEventListener('click', () => {
        // Show phone input container again
        phoneInputContainer.classList.remove('hidden');
        codeInputContainer.classList.add('hidden');
      });
    }
    
    // Check status on page load
    updateUI();
  </script>
</body>
</html>`;
        }
      }
      
      if (defaultContent) {
        fs.writeFileSync(templatePath, defaultContent);
        logger.info(`Created missing template: ${templatePath}`);
      } else {
        logger.warn(`Could not create template: ${templatePath}`);
      }
    }
  });

  // Create public directory if it doesn't exist
  const publicDir = path.join(__dirname, 'public');
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
    logger.info(`Created missing public directory: ${publicDir}`);
  }

  // Check if we're in mock mode
  const mockMode = process.env.USE_MOCK_MODE === 'true';
  
  // Basic home page route
  app.get('/', (req, res) => {
    res.render('index', { 
      title: 'Discord 驗證機器人',
      mockMode
    });
  });

  // Route setup - passing the Discord client to routes
  app.use('/verify', verifyRoute(client));
  app.use('/api/recaptcha', recaptchaRoute(client));
  app.use('/api/sms', smsRoute(client));
  app.use('/api/status', statusRoute(client));
  
  // 404 handler
  app.use((req, res, next) => {
    res.status(404).render('error', {
      message: '404 - 頁面未找到',
      details: '您嘗試訪問的頁面不存在。請檢查 URL 或返回主頁。'
    });
  });
  
  // Error handler
  app.use((err, req, res, next) => {
    logger.error('Server error:', { error: err.toString(), stack: err.stack });
    res.status(500).render('error', { 
      message: '發生錯誤',
      details: process.env.NODE_ENV === 'development' ? err.message : '處理您的請求時發生錯誤。請稍後再試。'
    });
  });
  
  // Start the server
  let server;
  try {
    server = app.listen(PORT, () => {
      logger.info(`Verification web service running on port ${PORT}`);
      logger.info(`Verification URL: ${process.env.BASE_URL}/verify/:userId/:token`);
    });
  } catch (error) {
    logger.error(`Failed to start web server on port ${PORT}:`, { error: error.toString() });
    logger.info('Attempting to start on alternative port...');
    
    // Try an alternative port if the primary one fails
    const alternativePort = parseInt(PORT) + 1;
    server = app.listen(alternativePort, () => {
      logger.info(`Verification web service running on alternative port ${alternativePort}`);
      logger.info(`Note: Your BASE_URL port may need to be updated to match this port.`);
    });
  }
  
  return server;
}

module.exports = { start };