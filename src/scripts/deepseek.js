// ============ DeepSeek API Integration ============
// Provides: Translation, AI Chat Assistant, Smart Summary Analysis

const DEEPSEEK_CONFIG = {
  apiUrl: 'https://api.deepseek.com/chat/completions',
  model: 'deepseek-chat',
  maxTokens: 2048,
  temperature: 0.7
};

// API Key management (stored in localStorage)
function getApiKey() {
  return localStorage.getItem('deepseek_api_key') || '';
}

function setApiKey(key) {
  localStorage.setItem('deepseek_api_key', key.trim());
}

function hasApiKey() {
  return !!getApiKey();
}

// Core API call
async function callDeepSeek(messages, options = {}) {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error('请先设置 DeepSeek API Key');
  }

  const response = await fetch(DEEPSEEK_CONFIG.apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: options.model || DEEPSEEK_CONFIG.model,
      messages: messages,
      max_tokens: options.maxTokens || DEEPSEEK_CONFIG.maxTokens,
      temperature: options.temperature ?? DEEPSEEK_CONFIG.temperature,
      stream: false
    })
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    if (response.status === 401) throw new Error('API Key 无效，请检查后重新设置');
    if (response.status === 429) throw new Error('请求过于频繁，请稍后再试');
    throw new Error(err.error?.message || `API 请求失败 (${response.status})`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

// ============ Feature 1: Translation ============
async function translateText(text, targetLang = 'zh') {
  const langNames = {
    zh: '中文', en: 'English', es: 'Español',
    ja: '日本語', ko: '한국어', fr: 'Français', de: 'Deutsch'
  };
  const target = langNames[targetLang] || targetLang;

  const messages = [
    {
      role: 'system',
      content: `You are a professional legal translator specializing in labor law. Translate accurately while maintaining legal terminology. Output ONLY the translated text, no explanations.`
    },
    {
      role: 'user',
      content: `Translate the following text to ${target}:\n\n${text}`
    }
  ];

  return await callDeepSeek(messages, { temperature: 0.3 });
}

// ============ Feature 2: AI Chat Assistant ============
let chatHistory = [];

function resetChat() {
  chatHistory = [];
}

async function chatWithAI(userMessage, context = null) {
  const systemPrompt = `You are a global labor law expert AI assistant. You have deep knowledge of employment regulations across 30+ countries including working time, minimum wage, employee rights, social insurance, data privacy, and workplace safety.

When answering:
- Be specific and cite relevant laws when possible
- Provide practical HR compliance advice
- Compare regulations across countries when relevant
- Answer in the same language the user uses (Chinese/English/Spanish)
- Be concise but thorough`;

  const messages = [{ role: 'system', content: systemPrompt }];

  // Add context if viewing a specific law
  if (context) {
    messages.push({
      role: 'system',
      content: `Current context - the user is viewing: ${JSON.stringify(context)}`
    });
  }

  // Add chat history (last 10 messages for context window)
  const recentHistory = chatHistory.slice(-10);
  messages.push(...recentHistory);

  // Add new user message
  messages.push({ role: 'user', content: userMessage });

  const reply = await callDeepSeek(messages, { maxTokens: 1500 });

  // Save to history
  chatHistory.push({ role: 'user', content: userMessage });
  chatHistory.push({ role: 'assistant', content: reply });

  return reply;
}

// ============ Feature 3: Smart Summary & Analysis ============
async function analyzeLaw(lawItem) {
  const messages = [
    {
      role: 'system',
      content: `You are a senior HR compliance analyst. Provide a structured analysis of labor regulations. Answer in Chinese. Be practical and actionable.`
    },
    {
      role: 'user',
      content: `请对以下劳动法规进行深度分析：

法规：${lawItem.law}
国家：${lawItem.country}
类别：${lawItem.category}
生效日期：${lawItem.effectiveDate}
状态：${lawItem.status}
摘要：${lawItem.summary}
关键变更：${lawItem.changes.join('；')}
HR影响：${lawItem.hrImpact.join('；')}

请从以下维度分析：
1. 🎯 核心要点（3-5条）
2. ⚠️ 合规风险评估（高/中/低 + 原因）
3. 📋 HR行动清单（具体步骤）
4. 🌍 与其他国家对比（同类法规差异）
5. 📅 建议时间表（何时完成哪些准备）`
    }
  ];

  return await callDeepSeek(messages, { maxTokens: 2048, temperature: 0.5 });
}

async function generateComparisonAnalysis(country1Data, country2Data) {
  const messages = [
    {
      role: 'system',
      content: `You are a comparative labor law expert. Provide clear, structured comparisons. Answer in Chinese.`
    },
    {
      role: 'user',
      content: `请对比分析以下两个国家的劳动法规：

【${country1Data[0]?.country}】
${country1Data.map(d => `- ${d.law} (${d.category}): ${d.summaryZh}`).join('\n')}

【${country2Data[0]?.country}】
${country2Data.map(d => `- ${d.law} (${d.category}): ${d.summaryZh}`).join('\n')}

请从以下角度对比：
1. 工时制度差异
2. 薪酬保障水平
3. 员工权益保护
4. 合规难度评估
5. 对跨国企业的建议`
    }
  ];

  return await callDeepSeek(messages, { maxTokens: 2048, temperature: 0.5 });
}

async function generateRegionalInsight(region) {
  const regionData = laborLawData.filter(d => d.region === region);
  if (!regionData.length) return '该地区暂无数据';

  const messages = [
    {
      role: 'system',
      content: `You are a regional HR strategy advisor. Provide strategic insights. Answer in Chinese.`
    },
    {
      role: 'user',
      content: `请分析${region}地区的劳动法规趋势：

该地区法规数据：
${regionData.map(d => `- ${d.country}: ${d.law} (${d.category}, ${d.status}, 生效:${d.effectiveDate})`).join('\n')}

请提供：
1. 📈 地区整体趋势
2. 🔥 热点合规领域
3. ⏰ 近期需关注事项
4. 💡 跨国企业策略建议`
    }
  ];

  return await callDeepSeek(messages, { maxTokens: 1500, temperature: 0.6 });
}
