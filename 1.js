import { connect } from "cloudflare:sockets";
let 临时TOKEN, 永久TOKEN;
export default {
  async fetch(request, env, ctx) {
    const 网站图标 = env.ICO || 'https://cf-assets.www.cloudflare.com/dzlvafdwdttg/19kSkLSfWtDcspvQI5pit4/c5630cf25d589a0de91978ca29486259/performance-acceleration-bolt.svg';
    const url = new URL(request.url);
    const UA = request.headers.get('User-Agent') || 'null';
    const path = url.pathname;
    const hostname = url.hostname;
    const currentDate = new Date();
    const timestamp = Math.ceil(currentDate.getTime() / (1000 * 60 * 31)); // 每31分钟一个时间戳
    临时TOKEN = await 双重哈希(url.hostname + timestamp + UA);
    永久TOKEN = env.TOKEN || 临时TOKEN;

    // 不区分大小写检查路径
    if (path.toLowerCase() === '/check') {
      // ... (保持原样不变)
    } else if (path.toLowerCase() === '/resolve') {
      // ... (保持原样不变)
    } else if (path.toLowerCase() === '/ip-info') {
      // ... (保持原样不变)
    } else {
      const envKey = env.URL302 ? 'URL302' : (env.URL ? 'URL' : null);
      if (envKey) {
        const URLs = await 整理(env[envKey]);
        const URL = URLs[Math.floor(Math.random() * URLs.length)];
        return envKey === 'URL302' ? Response.redirect(URL, 302) : fetch(new Request(URL, request));
      } else if (env.TOKEN) {
        return new Response(await nginx(), {
          headers: {
            'Content-Type': 'text/html; charset=UTF-8',
          },
        });
      } else if (path.toLowerCase() === '/favicon.ico') {
        return Response.redirect(网站图标, 302);
      }
      // 直接返回HTML页面，路径解析交给前端处理
      return await HTML(hostname, 网站图标);
    }
  }
};

// ... (其他函数保持原样直到HTML函数)

async function HTML(hostname, 网站图标) {
  // 首页 HTML - 主要修改前端界面和脚本
  const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Check ProxyIP - 批量代理IP检测服务</title>
  <link rel="icon" href="${网站图标}" type="image/x-icon">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  <style>
    /* 新增批量处理相关样式 */
    .batch-container {
      margin-top: 30px;
      display: flex;
      flex-direction: column;
      gap: 20px;
    }
    
    .batch-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 15px;
    }
    
    .batch-controls {
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
    }
    
    .batch-textarea {
      width: 100%;
      min-height: 200px;
      padding: 15px;
      border: 2px solid #dee2e6;
      border-radius: 8px;
      font-family: 'Inter', sans-serif;
      font-size: 16px;
      resize: vertical;
      background: #f8f9fa;
    }
    
    .batch-results {
      margin-top: 20px;
      display: grid;
      gap: 12px;
    }
    
    .batch-item {
      padding: 15px;
      border-radius: 8px;
      background: white;
      border-left: 4px solid #3498db;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 10px;
    }
    
    .batch-item.success {
      border-left-color: #2ecc71;
    }
    
    .batch-item.error {
      border-left-color: #e74c3c;
    }
    
    .item-actions {
      display: flex;
      gap: 8px;
    }
    
    .batch-summary {
      margin-top: 20px;
      padding: 15px;
      border-radius: 8px;
      background: #f8f9fa;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 15px;
    }
    
    .batch-stats {
      display: flex;
      gap: 20px;
    }
    
    .stat-box {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 10px 20px;
      border-radius: 8px;
      background: white;
      min-width: 100px;
    }
    
    .stat-value {
      font-size: 24px;
      font-weight: 700;
    }
    
    .stat-label {
      font-size: 14px;
      color: #6c757d;
    }
    
    .btn-secondary {
      background: #6c757d;
      color: white;
    }
    
    .btn-success {
      background: #28a745;
      color: white;
    }
    
    /* 调整原样式以适应批量界面 */
    .card {
      max-height: 80vh;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }
    
    .result-section {
      flex: 1;
      overflow-y: auto;
    }
    
    /* ... (其他样式保持原样) */
  </style>
</head>
<body>
  <!-- ... (保持原样直到container) -->

  <div class="container">
    <header class="header">
      <h1 class="main-title">批量 ProxyIP 检测</h1>
      <p class="subtitle">高效检测大量代理IP和域名，支持一键复制有效IP</p>
    </header>

    <div class="card">
      <div class="batch-container">
        <div class="batch-header">
          <h2 style="margin: 0;">批量检测列表</h2>
          <div class="batch-controls">
            <button class="btn btn-secondary" onclick="clearBatch()">清空列表</button>
            <button class="btn btn-primary" onclick="startBatchCheck()">开始检测</button>
          </div>
        </div>
        
        <textarea id="batchInput" class="batch-textarea" placeholder="每行输入一个IP或域名，例如：&#10;1.2.3.4:443&#10;example.com&#10;[2001:db8::1]:443&#10;支持1000+条批量检测"></textarea>
        
        <div class="batch-summary">
          <div class="batch-stats">
            <div class="stat-box">
              <div class="stat-value" id="totalCount">0</div>
              <div class="stat-label">总数量</div>
            </div>
            <div class="stat-box">
              <div class="stat-value" id="successCount">0</div>
              <div class="stat-label">有效IP</div>
            </div>
            <div class="stat-box">
              <div class="stat-value" id="progress">0%</div>
              <div class="stat-label">完成进度</div>
            </div>
          </div>
          <button id="copyValidBtn" class="btn btn-success" onclick="copyValidIPs()" disabled>
            <span>一键复制有效IP</span>
          </button>
        </div>
        
        <div id="batchResults" class="batch-results"></div>
      </div>
    </div>
    
    <footer class="footer">
      <p style="margin-top: 8px; opacity: 0.8;">© 2025 Check ProxyIP - 基于 Cloudflare Workers 构建的高性能批量代理IP验证服务 | 由 <strong>cmliu</strong> 开发</p>
    </footer>
  </div>

  <div id="toast" class="toast"></div>

  <script>
    // 批量处理全局变量
    let batchQueue = [];
    let batchResults = [];
    let batchInProgress = false;
    let batchSize = 10; // 每批处理数量
    let batchConcurrency = 5; // 并发请求数量
    let batchTimeout = 300; // 批处理间隔(ms)
    let validIPs = [];
    let pageLoadTimestamp;
    
    // 计算时间戳的函数
    function calculateTimestamp() {
      const currentDate = new Date();
      return Math.ceil(currentDate.getTime() / (1000 * 60 * 13)); // 每13分钟一个时间戳
    }
    
    // 初始化
    document.addEventListener('DOMContentLoaded', function() {
      pageLoadTimestamp = calculateTimestamp();
      console.log('页面加载完成，时间戳:', pageLoadTimestamp);
      
      // 尝试从localStorage加载历史数据
      try {
        const savedBatch = localStorage.getItem('batchHistory');
        if (savedBatch) {
          document.getElementById('batchInput').value = savedBatch;
          updateStats();
        }
      } catch (e) {
        console.log('无法读取历史数据', e);
      }
    });
    
    // 更新统计信息
    function updateStats() {
      const input = document.getElementById('batchInput').value.trim();
      const entries = input ? input.split('\n').filter(e => e.trim()) : [];
      document.getElementById('totalCount').textContent = entries.length;
      
      const successCount = batchResults.filter(r => r.status === 'success').length;
      document.getElementById('successCount').textContent = successCount;
      
      const total = batchQueue.length + batchResults.length;
      const processed = batchResults.length;
      const progress = total > 0 ? Math.round((processed / total) * 100) : 0;
      document.getElementById('progress').textContent = progress + '%';
      
      // 更新复制按钮状态
      document.getElementById('copyValidBtn').disabled = successCount === 0;
    }
    
    // 清空批量输入
    function clearBatch() {
      if (batchInProgress) {
        showToast('请先停止当前检测');
        return;
      }
      
      document.getElementById('batchInput').value = '';
      document.getElementById('batchResults').innerHTML = '';
      batchResults = [];
      validIPs = [];
      updateStats();
      localStorage.removeItem('batchHistory');
    }
    
    // 开始批量检测
    async function startBatchCheck() {
      if (batchInProgress) {
        showToast('批量检测正在进行中');
        return;
      }
      
      const input = document.getElementById('batchInput').value.trim();
      if (!input) {
        showToast('请输入要检测的IP或域名列表');
        return;
      }
      
      // 检查时间戳是否过期
      const currentTimestamp = calculateTimestamp();
      if (currentTimestamp !== pageLoadTimestamp) {
        showToast('TOKEN已过期，正在刷新页面...');
        setTimeout(() => {
          location.reload();
        }, 1000);
        return;
      }
      
      // 保存到localStorage
      try {
        localStorage.setItem('batchHistory', input);
      } catch (e) {
        console.log('保存历史失败', e);
      }
      
      // 准备批量队列
      const entries = input.split('\n')
        .map(e => e.trim())
        .filter(e => e);
      
      if (entries.length === 0) {
        showToast('没有有效的输入内容');
        return;
      }
      
      batchQueue = [...entries];
      batchResults = [];
      validIPs = [];
      document.getElementById('batchResults').innerHTML = '';
      batchInProgress = true;
      updateStats();
      
      // 更新按钮状态
      document.querySelector('.btn-primary .btn-text').textContent = '检测中...';
      document.getElementById('copyValidBtn').disabled = true;
      
      // 开始批量处理
      processBatch();
    }
    
    // 批量处理主函数
    async function processBatch() {
      if (!batchInProgress || batchQueue.length === 0) {
        finishBatch();
        return;
      }
      
      // 获取当前批次
      const currentBatch = batchQueue.splice(0, batchSize);
      
      // 并发处理当前批次
      const batchPromises = [];
      for (let i = 0; i < Math.min(batchConcurrency, currentBatch.length); i++) {
        batchPromises.push(processBatchItem(currentBatch));
      }
      
      // 等待当前批次完成
      await Promise.all(batchPromises);
      updateStats();
      
      // 继续处理下一批
      setTimeout(processBatch, batchTimeout);
    }
    
    // 处理单个批量项
    async function processBatchItem(batch) {
      while (batch.length > 0) {
        const item = batch.shift();
        const index = batchResults.length;
        
        // 创建结果项UI
        const itemElement = document.createElement('div');
        itemElement.className = 'batch-item';
        itemElement.id = 'batch-item-' + index;
        itemElement.innerHTML = \`
          <div>
            <strong>\${item}</strong>
            <div>检测中...</div>
          </div>
          <div class="item-actions">
            <span class="status-icon">🔄</span>
          </div>
        \`;
        document.getElementById('batchResults').appendChild(itemElement);
        
        try {
          let result;
          if (isIPAddress(item)) {
            result = await checkSingleItem(item);
          } else {
            result = await checkDomainItem(item);
          }
          
          // 更新UI
          const statusIcon = result.status === 'success' ? '✅' : '❌';
          const statusClass = result.status === 'success' ? 'success' : 'error';
          
          document.getElementById('batch-item-' + index).innerHTML = \`
            <div>
              <strong>\${item}</strong>
              <div>\${result.message}</div>
            </div>
            <div class="item-actions">
              <span class="status-icon">\${statusIcon}</span>
            </div>
          \`;
          document.getElementById('batch-item-' + index).className = 'batch-item ' + statusClass;
          
          // 保存结果
          batchResults.push({
            input: item,
            status: result.status,
            data: result.data,
            message: result.message
          });
          
          // 保存有效IP
          if (result.status === 'success' && result.ip) {
            validIPs.push(result.ip);
          }
        } catch (error) {
          // 错误处理
          document.getElementById('batch-item-' + index).innerHTML = \`
            <div>
              <strong>\${item}</strong>
              <div>❌ 检测失败: \${error.message || error}</div>
            </div>
            <div class="item-actions">
              <span class="status-icon">❌</span>
            </div>
          \`;
          document.getElementById('batch-item-' + index).className = 'batch-item error';
          
          batchResults.push({
            input: item,
            status: 'error',
            message: '检测失败: ' + (error.message || error)
          });
        }
        
        updateStats();
      }
    }
    
    // 完成批量处理
    function finishBatch() {
      batchInProgress = false;
      document.querySelector('.btn-primary .btn-text').textContent = '开始检测';
      showToast(\`批量检测完成! 有效IP: \${validIPs.length}个\`);
    }
    
    // 检查是否为IP地址
    function isIPAddress(input) {
      const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
      const ipv6Regex = /^\\[?([0-9a-fA-F]{0,4}:){1,7}[0-9a-fA-F]{0,4}\\]?$/;
      const ipv6WithPortRegex = /^\\[[0-9a-fA-F:]+\\]:\\d+$/;
      const ipv4WithPortRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?):\\d+$/;
      
      return ipv4Regex.test(input) || 
             ipv6Regex.test(input) || 
             ipv6WithPortRegex.test(input) || 
             ipv4WithPortRegex.test(input);
    }
    
    // 检查单个IP项
    async function checkSingleItem(proxyip) {
      const response = await fetch(\`./check?proxyip=\${encodeURIComponent(proxyip)}\`);
      const data = await response.json();
      
      if (data.success) {
        return {
          status: 'success',
          ip: data.proxyIP + ':' + data.portRemote,
          message: \`✅ 有效IP | 端口: \${data.portRemote} | 响应: \${data.responseSize}字节\`,
          data: data
        };
      } else {
        return {
          status: 'error',
          message: \`❌ 无效IP | 错误: \${data.error || '连接失败'}\`,
          data: data
        };
      }
    }
    
    // 检查域名项
    async function checkDomainItem(domain) {
      let portRemote = 443;
      let cleanDomain = domain;
      
      // 解析端口
      if (domain.includes('.tp')) {
        portRemote = domain.split('.tp')[1].split('.')[0] || 443;
      } else if (domain.includes('[') && domain.includes(']:')) {
        portRemote = parseInt(domain.split(']:')[1]) || 443;
        cleanDomain = domain.split(']:')[0] + ']';
      } else if (domain.includes(':')) {
        portRemote = parseInt(domain.split(':')[1]) || 443;
        cleanDomain = domain.split(':')[0];
      }
      
      // 解析域名
      const resolveResponse = await fetch(\`./resolve?domain=\${encodeURIComponent(cleanDomain)}&token=${临时TOKEN}\`);
      const resolveData = await resolveResponse.json();
      
      if (!resolveData.success) {
        throw new Error(resolveData.error || '域名解析失败');
      }
      
      const ips = resolveData.ips;
      if (!ips || ips.length === 0) {
        throw new Error('未找到域名对应的IP地址');
      }
      
      // 检查所有IP
      let validIPs = [];
      for (const ip of ips) {
        try {
          const ipResult = await checkIPStatus(ip + ':' + portRemote);
          if (ipResult.success) {
            validIPs.push(ip + ':' + portRemote);
          }
        } catch (e) {
          // 忽略单个IP检测错误
        }
      }
      
      if (validIPs.length > 0) {
        return {
          status: 'success',
          ip: validIPs.join(','),
          message: \`✅ 域名有效 | 发现 \${validIPs.length}个有效IP | 端口: \${portRemote}\`,
          data: { ips: validIPs }
        };
      } else {
        return {
          status: 'error',
          message: \`❌ 域名无效 | 解析到 \${ips.length}个IP但均无效 | 端口: \${portRemote}\`,
          data: { ips }
        };
      }
    }
    
    // 检查IP状态
    async function checkIPStatus(ip) {
      try {
        const response = await fetch(\`./check?proxyip=\${encodeURIComponent(ip)}\`);
        const data = await response.json();
        return data;
      } catch (error) {
        return { success: false, error: error.message };
      }
    }
    
    // 一键复制有效IP
    function copyValidIPs() {
      if (validIPs.length === 0) {
        showToast('没有有效的IP可复制');
        return;
      }
      
      const text = validIPs.join('\\n');
      navigator.clipboard.writeText(text).then(() => {
        showToast(\`已复制\${validIPs.length}个有效IP到剪贴板\`);
      }).catch(err => {
        console.error('复制失败:', err);
        showToast('复制失败，请手动复制');
      });
    }
    
    // ... (其他函数如showToast等保持原样)
  </script>
</body>
</html>
`;

  return new Response(html, {
    headers: { "content-type": "text/html;charset=UTF-8" }
  });
}
