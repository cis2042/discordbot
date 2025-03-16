import React from 'react';
import { 
  Shield, 
  CheckCircle2, 
  Settings, 
  Terminal, 
  MessageSquare, 
  Users, 
  Lock,
  ChevronDown,
  Github,
  ExternalLink
} from 'lucide-react';

function App() {
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Hero Section */}
      <header className="bg-gradient-to-r from-purple-900 to-indigo-800">
        <div className="container mx-auto px-6 py-16 md:py-24">
          <div className="flex flex-col items-center text-center">
            <Shield size={80} className="text-white mb-6" />
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4">Discord 雙重驗證機器人</h1>
            <p className="text-lg md:text-xl max-w-2xl mb-8">
              通過結合 Google reCAPTCHA 和 SMS 驗證來進行用戶身份驗證，幫助服務器管理員確保加入的成員是真實用戶而非機器人。
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <a 
                href="#features" 
                className="bg-white text-indigo-900 px-6 py-3 rounded-lg font-medium hover:bg-opacity-90 transition-colors"
              >
                瞭解功能
              </a>
              <a 
                href="#installation" 
                className="bg-indigo-700 px-6 py-3 rounded-lg font-medium hover:bg-indigo-600 transition-colors"
              >
                安裝指南
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* Features Section */}
      <section id="features" className="py-16 md:py-24 bg-gray-800">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-bold mb-12 text-center">功能特點</h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature Card 1 */}
            <div className="bg-gray-700 rounded-xl p-6 hover:shadow-lg hover:bg-gray-650 transition-all">
              <div className="inline-block p-3 bg-indigo-700 rounded-lg mb-4">
                <Lock size={24} />
              </div>
              <h3 className="text-xl font-bold mb-2">雙重驗證系統</h3>
              <ul className="space-y-2 text-gray-300">
                <li className="flex items-start">
                  <CheckCircle2 size={18} className="text-green-400 mr-2 mt-0.5 flex-shrink-0" />
                  <span>Google reCAPTCHA (V2/V3) 驗證防止機器人攻擊</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle2 size={18} className="text-green-400 mr-2 mt-0.5 flex-shrink-0" />
                  <span>Twilio SMS 驗證確認真實人類身份</span>
                </li>
              </ul>
            </div>
            
            {/* Feature Card 2 */}
            <div className="bg-gray-700 rounded-xl p-6 hover:shadow-lg hover:bg-gray-650 transition-all">
              <div className="inline-block p-3 bg-indigo-700 rounded-lg mb-4">
                <Users size={24} />
              </div>
              <h3 className="text-xl font-bold mb-2">分級權限管理</h3>
              <ul className="space-y-2 text-gray-300">
                <li className="flex items-start">
                  <CheckCircle2 size={18} className="text-green-400 mr-2 mt-0.5 flex-shrink-0" />
                  <span>完成reCAPTCHA後可加入Discord群組</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle2 size={18} className="text-green-400 mr-2 mt-0.5 flex-shrink-0" />
                  <span>完成SMS驗證後獲得Human角色</span>
                </li>
              </ul>
            </div>
            
            {/* Feature Card 3 */}
            <div className="bg-gray-700 rounded-xl p-6 hover:shadow-lg hover:bg-gray-650 transition-all">
              <div className="inline-block p-3 bg-indigo-700 rounded-lg mb-4">
                <Settings size={24} />
              </div>
              <h3 className="text-xl font-bold mb-2">管理功能</h3>
              <ul className="space-y-2 text-gray-300">
                <li className="flex items-start">
                  <CheckCircle2 size={18} className="text-green-400 mr-2 mt-0.5 flex-shrink-0" />
                  <span>自動向新加入用戶發送驗證說明</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle2 size={18} className="text-green-400 mr-2 mt-0.5 flex-shrink-0" />
                  <span>可配置的驗證要求和角色分配</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle2 size={18} className="text-green-400 mr-2 mt-0.5 flex-shrink-0" />
                  <span>驗證狀態查詢</span>
                </li>
              </ul>
            </div>
            
            {/* Feature Card 4 */}
            <div className="bg-gray-700 rounded-xl p-6 hover:shadow-lg hover:bg-gray-650 transition-all">
              <div className="inline-block p-3 bg-indigo-700 rounded-lg mb-4">
                <MessageSquare size={24} />
              </div>
              <h3 className="text-xl font-bold mb-2">現代化界面</h3>
              <ul className="space-y-2 text-gray-300">
                <li className="flex items-start">
                  <CheckCircle2 size={18} className="text-green-400 mr-2 mt-0.5 flex-shrink-0" />
                  <span>直觀、美觀的驗證頁面</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle2 size={18} className="text-green-400 mr-2 mt-0.5 flex-shrink-0" />
                  <span>完整的步驟指引和狀態提示</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle2 size={18} className="text-green-400 mr-2 mt-0.5 flex-shrink-0" />
                  <span>移動裝置友好</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Installation Section */}
      <section id="installation" className="py-16 md:py-24 bg-gray-900">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-bold mb-12 text-center">安裝與配置</h2>
          
          <div className="max-w-3xl mx-auto">
            <div className="mb-10">
              <h3 className="text-2xl font-bold mb-4">前提條件</h3>
              <ul className="space-y-2 text-gray-300">
                <li className="flex items-start">
                  <CheckCircle2 size={18} className="text-green-400 mr-2 mt-0.5 flex-shrink-0" />
                  <span>Node.js 14+</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle2 size={18} className="text-green-400 mr-2 mt-0.5 flex-shrink-0" />
                  <span>npm 或 yarn</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle2 size={18} className="text-green-400 mr-2 mt-0.5 flex-shrink-0" />
                  <span>MongoDB (本地開發可選)</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle2 size={18} className="text-green-400 mr-2 mt-0.5 flex-shrink-0" />
                  <span>Discord 機器人帳號與權限</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle2 size={18} className="text-green-400 mr-2 mt-0.5 flex-shrink-0" />
                  <span>Google reCAPTCHA 帳號</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle2 size={18} className="text-green-400 mr-2 mt-0.5 flex-shrink-0" />
                  <span>Twilio 帳號 (用於SMS驗證)</span>
                </li>
              </ul>
            </div>
            
            <div className="mb-10">
              <h3 className="text-2xl font-bold mb-4">安裝步驟</h3>
              <div className="space-y-6">
                <div>
                  <p className="font-bold mb-2">1. 克隆此儲存庫</p>
                  <div className="bg-gray-800 p-4 rounded-md">
                    <code className="text-green-400 font-mono">
                      git clone https://github.com/yourusername/discord-verification-bot.git<br />
                      cd discord-verification-bot
                    </code>
                  </div>
                </div>
                
                <div>
                  <p className="font-bold mb-2">2. 安裝依賴</p>
                  <div className="bg-gray-800 p-4 rounded-md">
                    <code className="text-green-400 font-mono">
                      npm install
                    </code>
                  </div>
                </div>
                
                <div>
                  <p className="font-bold mb-2">3. 配置環境變數</p>
                  <ul className="ml-6 list-disc text-gray-300 space-y-1">
                    <li>複製 <code className="bg-gray-800 px-2 py-1 rounded">.env.example</code> 為 <code className="bg-gray-800 px-2 py-1 rounded">.env</code></li>
                    <li>填寫所有必要的配置項：
                      <ul className="ml-6 list-disc text-gray-400">
                        <li>Discord Bot Token與應用憑證</li>
                        <li>reCAPTCHA Site Key與Secret Key</li>
                        <li>Twilio憑證</li>
                        <li>基本URL設置</li>
                      </ul>
                    </li>
                  </ul>
                </div>
                
                <div>
                  <p className="font-bold mb-2">4. 部署Discord指令</p>
                  <div className="bg-gray-800 p-4 rounded-md">
                    <code className="text-green-400 font-mono">
                      node deploy-commands.js
                    </code>
                  </div>
                </div>
                
                <div>
                  <p className="font-bold mb-2">5. 啟動服務</p>
                  <div className="bg-gray-800 p-4 rounded-md">
                    <code className="text-green-400 font-mono">
                      npm start
                    </code>
                  </div>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="text-2xl font-bold mb-4">Discord機器人設置</h3>
              <p className="text-gray-300 mb-4">
                請參閱<code className="bg-gray-800 px-2 py-1 rounded">discord-setup-guide.md</code>文件中的詳細步驟，其中包括：
              </p>
              <ul className="space-y-2 text-gray-300 ml-6 list-disc">
                <li>創建應用與機器人</li>
                <li>配置必要權限</li>
                <li>邀請機器人到您的服務器</li>
                <li>設置驗證角色</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Usage Section */}
      <section id="usage" className="py-16 md:py-24 bg-gray-800">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-bold mb-12 text-center">使用說明</h2>
          
          <div className="max-w-3xl mx-auto">
            <div className="grid md:grid-cols-2 gap-10">
              <div className="bg-gray-700 rounded-xl p-6">
                <h3 className="text-2xl font-bold mb-4 flex items-center">
                  <Terminal size={24} className="mr-2" />
                  管理員命令
                </h3>
                <div className="space-y-4">
                  <div>
                    <code className="bg-gray-800 px-2 py-1 rounded text-green-400">/setup verified_role:[角色名] require_recaptcha:[true/false] require_sms:[true/false]</code>
                    <p className="mt-2 text-gray-300">配置驗證設置</p>
                    <ul className="ml-4 mt-2 space-y-1 text-gray-400">
                      <li><code className="bg-gray-800 px-1 rounded">verified_role</code> - 驗證成功後分配的角色</li>
                      <li><code className="bg-gray-800 px-1 rounded">human_role</code> - 完成SMS驗證後授予的Human角色</li>
                      <li><code className="bg-gray-800 px-1 rounded">require_recaptcha</code> - 是否需要reCAPTCHA驗證</li>
                      <li><code className="bg-gray-800 px-1 rounded">require_sms</code> - 是否需要SMS驗證</li>
                    </ul>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-700 rounded-xl p-6">
                <h3 className="text-2xl font-bold mb-4 flex items-center">
                  <Users size={24} className="mr-2" />
                  用戶命令
                </h3>
                <div className="space-y-4">
                  <div>
                    <code className="bg-gray-800 px-2 py-1 rounded text-green-400">/verify</code>
                    <p className="mt-2 text-gray-300">開始驗證過程</p>
                  </div>
                  <div>
                    <code className="bg-gray-800 px-2 py-1 rounded text-green-400">/verification-status</code>
                    <p className="mt-2 text-gray-300">查看當前的驗證狀態</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Deployment Section */}
      <section id="deployment" className="py-16 md:py-24 bg-gray-900">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-bold mb-12 text-center">部署指南</h2>
          
          <div className="max-w-3xl mx-auto">
            <div className="mb-10">
              <h3 className="text-2xl font-bold mb-4">本地開發</h3>
              <div className="bg-gray-800 p-4 rounded-md">
                <code className="text-green-400 font-mono">npm run dev</code>
              </div>
            </div>
            
            <h3 className="text-2xl font-bold mb-4">部署到生產環境</h3>
            
            <div className="mb-8">
              <h4 className="text-xl font-bold mb-3">方法1: 傳統VPS/伺服器</h4>
              <ol className="list-decimal ml-6 space-y-2 text-gray-300">
                <li>確保Node.js和PM2已安裝</li>
                <li>配置環境變數</li>
                <li>
                  使用PM2啟動並監控服務
                  <div className="bg-gray-800 p-3 rounded-md mt-2">
                    <code className="text-green-400 font-mono">pm2 start src/index.js --name discord-verification-bot</code>
                  </div>
                </li>
              </ol>
            </div>
            
            <div>
              <h4 className="text-xl font-bold mb-3">方法2: 使用Docker</h4>
              <div className="bg-gray-800 p-4 rounded-md">
                <code className="text-green-400 font-mono">
                  # 構建Docker映像<br />
                  docker build -t discord-verification-bot .<br /><br />
                  # 運行容器<br />
                  docker run -d --name discord-bot \<br />
                  &nbsp;&nbsp;--env-file .env \<br />
                  &nbsp;&nbsp;-p 3000:3000 \<br />
                  &nbsp;&nbsp;discord-verification-bot
                </code>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contribution and License Section */}
      <section id="contribute" className="py-16 md:py-24 bg-gray-800">
        <div className="container mx-auto px-6">
          <div className="max-w-3xl mx-auto">
            <div className="grid md:grid-cols-2 gap-10">
              <div>
                <h3 className="text-2xl font-bold mb-4 flex items-center">
                  <Github size={24} className="mr-2" />
                  貢獻指南
                </h3>
                <ol className="list-decimal ml-5 space-y-2 text-gray-300">
                  <li>Fork此儲存庫</li>
                  <li>創建您的功能分支 (<code className="bg-gray-900 px-1 rounded">git checkout -b feature/amazing-feature</code>)</li>
                  <li>提交您的更改 (<code className="bg-gray-900 px-1 rounded">git commit -m 'Add some amazing feature'</code>)</li>
                  <li>推送到分支 (<code className="bg-gray-900 px-1 rounded">git push origin feature/amazing-feature</code>)</li>
                  <li>開啟Pull Request</li>
                </ol>
              </div>
              
              <div>
                <h3 className="text-2xl font-bold mb-4">授權</h3>
                <p className="text-gray-300">
                  本項目採用MIT授權 - 查看<a href="#" className="text-indigo-400 hover:underline">LICENSE</a>文件了解詳情。
                </p>
                
                <h3 className="text-2xl font-bold mt-8 mb-4">聯絡方式</h3>
                <p className="text-gray-300">
                  如有任何問題或建議，請通過GitHub Issues聯絡我們。
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 border-t border-gray-800 py-8">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center mb-4 md:mb-0">
              <Shield size={24} className="text-indigo-500 mr-2" />
              <span className="text-lg font-bold">Discord 雙重驗證機器人</span>
            </div>
            
            <div className="flex space-x-4">
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <Github size={20} />
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <ExternalLink size={20} />
              </a>
            </div>
          </div>
          <div className="mt-4 text-center text-gray-500 text-sm">
            &copy; {new Date().getFullYear()} Discord 雙重驗證機器人. 保留所有權利.
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;