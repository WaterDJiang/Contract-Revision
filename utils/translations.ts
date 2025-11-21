
export type Language = 'en' | 'zh';

export const translations = {
  en: {
    landing: {
      badge: "AI-Powered Legal Workspace",
      title: "Next Gen Contract Drafting",
      subtitle: "Experience the future of legal documentation. Combine the precision of Markdown, the power of Generative AI, and the formatting of a professional word processor.",
      btnNew: "Create New Contract",
      btnImport: "Import Contract",
      btnCompare: "Compare Contracts",
      footer: "© 2024 Wattter Lex. Powered by Google Gemini.",
      features: {
        copilot: { title: "AI Co-Pilot", desc: "Draft clauses, summarize terms, and modify tone with AI." },
        risk: { title: "Risk Analysis", desc: "Identify potential risks and missing clauses instantly." },
        markdown: { title: "Markdown & Rich Text", desc: "Draft in code-like structure, format in paper-like view." },
        export: { title: "Universal Export", desc: "Import PDF/Docx and export standard .doc files seamlessly." }
      }
    },
    editor: {
      tabDraft: "Draft (AI)",
      tabFormat: "Format (Rich Text)",
      btnImport: "Import",
      btnExport: "Export",
      btnExportClean: "Clean Copy (.doc)",
      btnExportRedline: "Track Changes (.doc)",
      placeholder: "# Start drafting...",
      reviewTitle: "Review Changes",
      compareTitle: "Contract Comparison",
      btnReject: "Reject",
      btnAccept: "Accept",
      fontSerif: "Serif",
      fontSans: "Sans-Serif",
      fontMono: "Mono",
      sizeNormal: "Normal",
      sizeLarge: "Large",
      sizeSmall: "Small",
      addToChat: "Add to Chat",
      mdLabel: "Markdown"
    },
    chat: {
      title: "Legal Aide AI",
      emptyState: "Ask me to add clauses, review terms, or summarize sections.",
      emptyStateSub: "Try: \"Add a force majeure clause\"",
      inputPlaceholder: "Describe changes (e.g., 'Change governing law')...",
      inputPlaceholderContext: "Ask about selection or request changes...",
      disclaimer: "AI can make mistakes. Please review generated contracts.",
      generating: "Generating",
      user: "You",
      ai: "AI",
      contextLabel: "Selected Context"
    },
    app: {
      welcomeNew: "I've opened a blank workspace. Please describe the contract you need (e.g., 'Draft a Non-Disclosure Agreement for a software developer'), and I will generate it for you.",
      welcomeImport: "I've imported your contract. I can now help you review, analyze risks, or format it.",
      welcomeCompare: "Comparison mode active. I've highlighted differences between the Original and Revised versions. You can ask me to analyze these changes or merge them.",
      processingError: "I encountered an error. Please try again.",
      diffDrafted: "I've drafted revisions. Check the Draft tab to review changes.",
      diffNoChange: "I reviewed the contract but didn't find necessary changes based on your request.",
      changesApplied: "Changes applied.",
      changesDiscarded: "Changes discarded."
    },
    settings: {
      title: "Model Configuration",
      providerLabel: "AI Provider",
      apiKeyLabel: "API Key",
      apiKeyNote: "Stored locally in your browser. Never uploaded to our servers.",
      baseUrlLabel: "Base URL (Optional)",
      modelLabel: "Model Name",
      show: "Show",
      hide: "Hide",
      cancel: "Cancel",
      save: "Save Configuration",
      providers: {
        google: "Google Gemini",
        openai: "OpenAI",
        glm: "GLM-4 (Backend)",
        custom: "Custom"
      },
      systemManaged: "Managed by System Environment",
      glmNote: "GLM models are available by default at no cost. To use other providers, enter your own API key. Keys are stored locally in your browser and never uploaded to our servers."
    },
    suggest: {
      title: "Submit a Suggestion",
      contentLabel: "Suggestion",
      contentPlaceholder: "Describe your idea or improvement...",
      nameLabel: "Your Name (Optional)",
      emailLabel: "Email (Optional)",
      phoneLabel: "Phone (Optional)",
      submit: "Submit",
      submitting: "Submitting...",
      cancel: "Cancel",
      requiredError: "Suggestion content is required.",
      envMissing: "Webhook environment variables are missing.",
      success: "Suggestion sent successfully. Thank you!",
      failed: "Failed to submit"
    },
    compare: {
      title: "Compare Contracts",
      original: "Original Contract",
      revised: "Revised Contract",
      upload: "Upload File",
      compareBtn: "Start Comparison",
      cancel: "Cancel"
    }
    ,
    history: {
      title: "Local History",
      clear: "Clear",
      empty: "No history yet",
      loading: "Loading...",
      count: "Items"
    }
  },
  zh: {
    landing: {
      badge: "AI 驱动的法律工作台",
      title: "新一代合同起草工具",
      subtitle: "体验未来的法律文档处理。结合 Markdown 的精确性、生成式 AI 的强大功能以及专业文字处理器的排版。",
      btnNew: "新建合同",
      btnImport: "导入合同",
      btnCompare: "合同比对",
      footer: "© 2024 Wattter Lex. 由 Google Gemini 提供支持。",
      features: {
        copilot: { title: "AI 助手", desc: "使用 AI 起草条款、总结术语并修改语气。" },
        risk: { title: "风险分析", desc: "即时识别潜在风险和缺失条款。" },
        markdown: { title: "Markdown & 富文本", desc: "以代码结构起草，以纸张视图排版。" },
        export: { title: "通用导出", desc: "无缝导入 PDF/Docx 并导出标准 .doc 文件。" }
      }
    },
    editor: {
      tabDraft: "草稿 (AI)",
      tabFormat: "格式 (富文本)",
      btnImport: "导入",
      btnExport: "导出",
      btnExportClean: "最终版 (.doc)",
      btnExportRedline: "修订模式 (.doc)",
      placeholder: "# 开始起草...",
      reviewTitle: "审查变更",
      compareTitle: "合同比对",
      btnReject: "拒绝",
      btnAccept: "接受",
      fontSerif: "衬线体",
      fontSans: "无衬线",
      fontMono: "等宽",
      sizeNormal: "正常",
      sizeLarge: "大",
      sizeSmall: "小",
      addToChat: "添加到对话",
      mdLabel: "Markdown"
    },
    chat: {
      title: "法律助手 AI",
      emptyState: "让我帮你添加条款、审查术语或总结章节。",
      emptyStateSub: "试一试：“添加不可抗力条款”",
      inputPlaceholder: "描述修改（例如：'修改管辖法律'）...",
      inputPlaceholderContext: "针对选中内容提问或要求修改...",
      disclaimer: "AI 可能会犯错。请人工审查生成的合同。",
      generating: "生成中",
      user: "你",
      ai: "AI",
      contextLabel: "选中上下文"
    },
    app: {
      welcomeNew: "我已打开一个空白工作区。请描述您需要的合同（例如，“为软件开发人员起草一份保密协议”），我将为您生成。",
      welcomeImport: "我已导入您的合同。我现在可以帮助您审查、分析风险或进行格式化。",
      welcomeCompare: "比对模式已激活。我已高亮显示原文与修订版之间的差异。您可以让我分析这些差异或合并它们。",
      processingError: "我遇到一个错误，请重试。",
      diffDrafted: "我已起草修订。请查看“草稿”选项卡以审查变更。",
      diffNoChange: "我审查了合同，但根据您的请求未发现需要变更的内容。",
      changesApplied: "变更已应用。",
      changesDiscarded: "变更已丢弃。"
    },
    settings: {
      title: "模型配置",
      providerLabel: "AI 提供商",
      apiKeyLabel: "API 密钥",
      apiKeyNote: "仅存储在您的浏览器本地，不会上传到我们的服务器。",
      baseUrlLabel: "Base URL (可选)",
      modelLabel: "模型名称",
      show: "显示",
      hide: "隐藏",
      cancel: "取消",
      save: "保存配置",
      providers: {
        google: "Google Gemini",
        openai: "OpenAI",
        glm: "GLM-4 (后台配置)",
        custom: "自定义"
      },
      systemManaged: "由系统环境统一管理",
      glmNote: "系统默认免费提供 GLM 模型。如需使用其他模型，请自行填入对应提供商的 API 密钥。所有密钥仅保存在本地浏览器，不会上传到服务器，可以放心使用。"
    },
    suggest: {
      title: "提交建议",
      contentLabel: "建议内容",
      contentPlaceholder: "请输入您的意见或改进建议...",
      nameLabel: "姓名（选填）",
      emailLabel: "邮箱（选填）",
      phoneLabel: "手机号（选填）",
      submit: "提交",
      submitting: "提交中...",
      cancel: "取消",
      requiredError: "建议内容为必填项。",
      envMissing: "Webhook 环境变量缺失。",
      success: "建议提交成功，感谢反馈！",
      failed: "提交失败"
    },
    compare: {
      title: "合同比对",
      original: "原始合同",
      revised: "修订合同",
      upload: "上传文件",
      compareBtn: "开始比对",
      cancel: "取消"
    }
    ,
    history: {
      title: "本地历史",
      clear: "清空",
      empty: "暂无历史记录",
      loading: "加载中...",
      count: "条目"
    }
  }
};
