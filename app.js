const STORAGE_KEY = "kaoyan-targets-v1";
const ACTIVE_KEY = "kaoyan-active-target-v1";
const PUBLIC_CODES = new Set(["101", "199", "201", "204", "301", "302", "303", "396"]);

const el = {
  school: document.querySelector("#school"),
  major: document.querySelector("#major"),
  majorCode: document.querySelector("#majorCode"),
  examYear: document.querySelector("#examYear"),
  examDate: document.querySelector("#examDate"),
  sourceUrl: document.querySelector("#sourceUrl"),
  sourceText: document.querySelector("#sourceText"),
  pdfFile: document.querySelector("#pdfFile"),
  pdfStatus: document.querySelector("#pdfStatus"),
  topYzLink: document.querySelector("#topYzLink"),
  analyzeBtn: document.querySelector("#analyzeBtn"),
  saveBtn: document.querySelector("#saveBtn"),
  clearBtn: document.querySelector("#clearBtn"),
  savedTargets: document.querySelector("#savedTargets"),
  confidenceBanner: document.querySelector("#confidenceBanner"),
  englishSubject: document.querySelector("#englishSubject"),
  mathSubject: document.querySelector("#mathSubject"),
  professionalSubjects: document.querySelector("#professionalSubjects"),
  sourceProofLink: document.querySelector("#sourceProofLink"),
  daysLeft: document.querySelector("#daysLeft"),
  weeksLeft: document.querySelector("#weeksLeft"),
  phaseName: document.querySelector("#phaseName"),
  schoolChecklist: document.querySelector("#schoolChecklist"),
  targetMaterials: document.querySelector("#targetMaterials"),
  moduleGrid: document.querySelector("#moduleGrid"),
  report: document.querySelector("#report"),
  printReport: document.querySelector("#printReport"),
  printReportTop: document.querySelector("#printReportTop"),
};

const defaultTarget = {
  school: "",
  major: "",
  majorCode: "",
  examYear: "2027",
  examDate: "2026-12-19",
  sourceUrl: "",
  sourceText: "",
  englishSubject: "",
  mathSubject: "",
  professionalSubjects: "",
};

const MAJOR_PROFILES = [
  {
    id: "computer",
    title: "计算机 / 软件 / 人工智能",
    codePatterns: [/^0812/, /^0835/, /^0854(04|05|10|11)?/, /^1405/],
    keywords: ["计算机", "软件", "人工智能", "网络空间", "大数据", "数据科学", "信息安全", "智能科学"],
    description: "优先确认是否考 408，或学校自命题的数据结构、计组、操作系统、计网组合。",
    studyTopics: ["数据结构与算法", "计算机组成原理", "操作系统", "计算机网络", "C/C++ 或算法编程能力"],
    materials: ["学校考试大纲和专业目录", "408 或自命题历年真题", "数据结构教材与习题", "计组/操作系统/计网章节笔记", "机试算法题库与错题本"],
    subjectHints: ["408 计算机学科专业基础", "数据结构", "计算机组成原理", "操作系统", "计算机网络"],
  },
  {
    id: "finance",
    title: "金融 / 应用经济",
    codePatterns: [/^0251/, /^0202/],
    keywords: ["金融", "应用经济", "金融学", "金融专硕", "保险", "税务", "国际商务"],
    description: "重点确认是否考 431 金融学综合，以及宏微观、货币银行、公司金融、投资学的范围。",
    studyTopics: ["货币金融学", "公司金融", "投资学", "宏观经济学", "微观经济学", "金融热点与论述"],
    materials: ["431 金融学综合大纲", "目标院校参考书目", "历年真题与题型统计", "金融计算题错题本", "热点专题素材库"],
    subjectHints: ["431 金融学综合", "宏观经济学", "微观经济学", "公司金融", "投资学"],
  },
  {
    id: "accounting",
    title: "会计 / 审计 / 工商管理",
    codePatterns: [/^1253/, /^1257/, /^1251/, /^1202/],
    keywords: ["会计", "审计", "工商管理", "企业管理", "财务管理", "MBA", "MPAcc"],
    description: "管理类联考方向要区分初试 199 管综；学硕方向要确认管理学、会计学或自命题科目。",
    studyTopics: ["管理类综合能力", "逻辑", "数学基础", "写作", "会计学基础", "财务管理"],
    materials: ["199 管综或学校自命题大纲", "逻辑题型错题本", "写作素材库", "会计/财管参考书", "复试专业课清单"],
    subjectHints: ["199 管理类综合能力", "会计学", "财务管理", "管理学"],
  },
  {
    id: "law",
    title: "法学 / 法律硕士",
    codePatterns: [/^0351/, /^0301/],
    keywords: ["法律", "法学", "民商法", "刑法", "国际法", "知识产权"],
    description: "法律硕士先区分法学/非法学，法学学硕按学校自命题方向确认具体科目。",
    studyTopics: ["法理学", "宪法学", "民法", "刑法", "中国法制史", "目标方向专题"],
    materials: ["考试分析或学校大纲", "目标院校真题", "法条与案例整理", "主观题答题模板", "复试方向论文/热点"],
    subjectHints: ["397/398 法硕联考专业基础", "497/498 法硕联考综合", "法学综合"],
  },
  {
    id: "education",
    title: "教育学 / 教育硕士",
    codePatterns: [/^0451/, /^0401/],
    keywords: ["教育", "学科教学", "教育管理", "课程与教学论", "教育学"],
    description: "重点确认 333 教育综合与第二门专业课，学硕则确认 311 或学校自命题。",
    studyTopics: ["教育学原理", "中国教育史", "外国教育史", "教育心理学", "教育研究方法", "学科教学专业课"],
    materials: ["333/311 或自命题大纲", "目标院校真题", "教育综合背诵框架", "案例与论述题素材", "专业课参考书章节表"],
    subjectHints: ["333 教育综合", "311 教育学专业基础", "教育心理学", "课程与教学论"],
  },
  {
    id: "psychology",
    title: "心理学 / 应用心理",
    codePatterns: [/^0454/, /^0402/],
    keywords: ["心理", "应用心理", "心理学"],
    description: "先确认 312 统考还是 347/学校自命题，再分普通心理、发展、统计测量、实验。",
    studyTopics: ["普通心理学", "发展心理学", "教育心理学", "实验心理学", "心理统计", "心理测量"],
    materials: ["312/347 或学校自命题大纲", "参考书章节表", "实验与统计题型清单", "真题年份索引", "名词解释与论述题卡片"],
    subjectHints: ["312 心理学专业基础", "347 心理学专业综合", "心理统计", "心理测量"],
  },
  {
    id: "journalism",
    title: "新闻传播 / 出版",
    codePatterns: [/^0552/, /^0503/, /^0553/],
    keywords: ["新闻", "传播", "出版", "广告", "新媒体"],
    description: "通常需要确认 334/440 或学校自命题，复习要结合理论、业务、热点和评论写作。",
    studyTopics: ["新闻传播理论", "新闻史", "传播学", "新闻业务", "评论写作", "媒介热点"],
    materials: ["334/440 或学校大纲", "目标院校真题", "新闻评论与消息写作素材", "热点专题库", "参考书笔记"],
    subjectHints: ["334 新闻与传播专业综合能力", "440 新闻与传播专业基础", "新闻传播史论"],
  },
  {
    id: "mechanical",
    title: "机械 / 控制 / 电气",
    codePatterns: [/^0855/, /^0802/, /^0808/, /^0811/],
    keywords: ["机械", "控制", "电气", "自动化", "车辆", "仪器"],
    description: "先确认自命题科目是机械原理、控制原理、电路、自动控制或材料力学。",
    studyTopics: ["高等数学与线代基础", "机械原理/控制原理/电路", "专业课公式推导", "历年计算题", "实验与综合题"],
    materials: ["学校专业课大纲", "参考书与课后题", "目标院校历年真题", "公式手册", "计算题错题本"],
    subjectHints: ["机械原理", "自动控制原理", "电路", "材料力学"],
  },
];

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function compactText(value) {
  return String(value || "")
    .replace(/\u3000/g, " ")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function normalizeLoose(value) {
  return compactText(value)
    .replace(/\s+/g, " ")
    .replace(/（/g, "(")
    .replace(/）/g, ")")
    .toLowerCase();
}

function unique(values) {
  return Array.from(new Set(values.map((item) => item.trim()).filter(Boolean)));
}

function extractMajorCode(value) {
  const match = String(value || "").match(/(?:^|[^\d])(\d{4,6})(?=$|[^\d])/);
  return match ? match[1] : "";
}

function getMajorCode(target) {
  return (
    target.majorCode ||
    extractMajorCode(target.major) ||
    extractMajorCode(target.sourceText) ||
    extractMajorCode(target.professionalSubjects)
  );
}

function getMajorProfile(target) {
  const code = getMajorCode(target);
  const haystack = `${target.major} ${target.sourceText} ${target.professionalSubjects}`.toLowerCase();
  const byKeyword = (profile) => profile.keywords.some((keyword) => haystack.includes(keyword.toLowerCase()));
  const byCode = (profile) => code && profile.codePatterns.some((pattern) => pattern.test(code));
  return (
    MAJOR_PROFILES.find((profile) => byKeyword(profile)) ||
    MAJOR_PROFILES.find((profile) => byCode(profile)) || {
      id: "general",
      title: code ? `专业代码 ${code}` : "目标专业",
      description: "暂未匹配到固定方向，请以学校官网专业目录、考试大纲和参考书目为准。",
      studyTopics: ["思想政治理论", "英语一/英语二", "数学/综合或不考数学", "学校自命题专业课", "复试专业课与研究方向"],
      materials: ["学校招生专业目录", "考试大纲", "参考书目", "历年真题", "复试细则与拟录取名单"],
      subjectHints: ["专业课代码和名称待确认"],
    }
  );
}

function buildMaterialSearchLinks(target) {
  const code = getMajorCode(target);
  const label = [target.school, code, target.major].filter(Boolean).join(" ");
  const base = label || "目标院校 目标专业";
  return [
    {
      label: "专业目录",
      href: `https://www.bing.com/search?q=${encodeURIComponent(`${base} 硕士研究生 招生专业目录 官网`)}`,
    },
    {
      label: "考试大纲",
      href: `https://www.bing.com/search?q=${encodeURIComponent(`${base} 考研 考试大纲 官网`)}`,
    },
    {
      label: "参考书目",
      href: `https://www.bing.com/search?q=${encodeURIComponent(`${base} 考研 参考书目 官网`)}`,
    },
    {
      label: "历年真题",
      href: `https://www.bing.com/search?q=${encodeURIComponent(`${base} 考研 历年真题`)}`,
    },
  ];
}

function getTargets() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

function setTargets(targets) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(targets));
  } catch {
    // If storage is blocked, keep the current session usable.
  }
}

function getCurrentTarget() {
  return {
    school: el.school.value.trim(),
    major: el.major.value.trim(),
    majorCode: el.majorCode.value.trim(),
    examYear: el.examYear.value.trim() || "2027",
    examDate: el.examDate.value || "2026-12-19",
    sourceUrl: el.sourceUrl.value.trim(),
    sourceText: compactText(el.sourceText.value),
    englishSubject: el.englishSubject.value,
    mathSubject: el.mathSubject.value,
    professionalSubjects: compactText(el.professionalSubjects.value),
  };
}

function applyTarget(target) {
  const data = { ...defaultTarget, ...target };
  el.school.value = data.school;
  el.major.value = data.major;
  el.majorCode.value = data.majorCode || extractMajorCode(data.major || data.sourceText || "");
  el.examYear.value = data.examYear;
  el.examDate.value = data.examDate;
  el.sourceUrl.value = data.sourceUrl;
  el.sourceText.value = data.sourceText;
  el.englishSubject.value = data.englishSubject;
  el.mathSubject.value = data.mathSubject;
  el.professionalSubjects.value = data.professionalSubjects;
  persistActive();
  refreshAll();
}

function persistActive() {
  try {
    localStorage.setItem(ACTIVE_KEY, JSON.stringify(getCurrentTarget()));
  } catch {
    // The live planner still works when browser storage is unavailable.
  }
}

function loadActive() {
  try {
    const saved = JSON.parse(localStorage.getItem(ACTIVE_KEY) || "null");
    applyTarget(saved || defaultTarget);
  } catch {
    applyTarget(defaultTarget);
  }
}

function detectSubjects(rawText) {
  const text = normalizeLoose(rawText);
  const original = compactText(rawText);
  const result = {
    english: "",
    math: "",
    professional: [],
    notes: [],
    needsReview: false,
  };

  const englishOne = /(^|[^0-9])201\s*英语\s*一|英语\s*一|英一/.test(text);
  const englishTwo = /(^|[^0-9])204\s*英语\s*二|英语\s*二|英二/.test(text);
  if (englishOne && englishTwo) {
    result.notes.push("同时发现英语一和英语二，请按目标专业目录手动确认。");
    result.needsReview = true;
  } else if (englishOne) {
    result.english = "201 英语一";
  } else if (englishTwo) {
    result.english = "204 英语二";
  } else {
    result.notes.push("未识别到英语一或英语二。");
    result.needsReview = true;
  }

  const mathMatches = [
    [/301\s*数学\s*一|数学\s*一|数一/, "301 数学一"],
    [/302\s*数学\s*二|数学\s*二|数二/, "302 数学二"],
    [/303\s*数学\s*三|数学\s*三|数三/, "303 数学三"],
    [/396\s*经济类综合能力|经济类综合能力/, "396 经济类综合能力"],
  ].filter(([pattern]) => pattern.test(text));

  const noMath = /不考数学|无数学|数学\s*[:：]?\s*无|无需数学/.test(text);
  if (mathMatches.length > 1) {
    result.notes.push("发现多个数学/综合科目，请按专业目录手动确认。");
    result.needsReview = true;
  } else if (mathMatches.length === 1) {
    result.math = mathMatches[0][1];
  } else if (noMath) {
    result.math = "不考数学";
  } else {
    result.notes.push("未识别到数学一、数学二、数学三或 396。若专业不考数学，请手动选择。");
    result.needsReview = true;
  }

  const subjectMatches = [];
  const codePattern = /(\d{3})\s*([^\d,，;；、\n\r]{2,36}?)(?=\s+\d{3}|[,，;；、\n\r]|$)/g;
  let match;
  while ((match = codePattern.exec(original)) !== null) {
    const code = match[1];
    const name = match[2].replace(/[()（）]/g, "").trim();
    if (!PUBLIC_CODES.has(code) && name && !/见|拟|统考|复试|同等学力/.test(name)) {
      subjectMatches.push(`${code} ${name}`);
    }
  }

  original.split(/\n+/).forEach((line) => {
    const trimmed = line.trim();
    const serviceCourse = trimmed.match(/(?:业务课|专业课|自命题科目)[一二]?\s*[:：]\s*(.+)$/);
    if (serviceCourse) subjectMatches.push(serviceCourse[1].trim());
  });

  result.professional = unique(subjectMatches).slice(0, 6);
  if (!result.professional.length) {
    result.notes.push("未稳定识别到专业课或自命题科目，请从官方目录中补充。");
    result.needsReview = true;
  }

  return result;
}

function analyzeSource() {
  const text = [el.sourceText.value, el.sourceUrl.value].join("\n");
  const detected = detectSubjects(text);
  if (detected.english) el.englishSubject.value = detected.english;
  if (detected.math) el.mathSubject.value = detected.math;
  if (detected.professional.length) {
    el.professionalSubjects.value = detected.professional.join("；");
  }
  renderConfidence(detected);
  persistActive();
  refreshAll();
}

function renderConfidence(detected) {
  const missingManual =
    !el.englishSubject.value || !el.mathSubject.value || !compactText(el.professionalSubjects.value);
  const needsReview = detected.needsReview || missingManual;
  el.confidenceBanner.className = `confidence ${needsReview ? "needs-review" : "ok"}`;
  el.confidenceBanner.textContent = needsReview
    ? `需要确认：${detected.notes.join(" ")}`
    : "已识别到英语、数学/综合和专业课。请仍以官方目录为准。";
}

function updateCountdown() {
  const dateValue = el.examDate.value || "2026-12-19";
  const target = new Date(`${dateValue}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const days = Math.ceil((target - today) / 86400000);
  const safeDays = Number.isFinite(days) ? days : 0;
  el.daysLeft.textContent = safeDays.toString();
  el.weeksLeft.textContent = Math.max(0, Math.ceil(safeDays / 7)).toString();
  el.phaseName.textContent = getPhaseName(safeDays);
}

function getPhaseName(days) {
  if (days < 0) return "已过期";
  if (days <= 45) return "冲刺";
  if (days <= 100) return "真题";
  if (days <= 210) return "强化";
  return "基础";
}

function getEnglishPlan(subject) {
  if (subject === "204 英语二") {
    return {
      title: "英语二",
      tags: ["词汇", "阅读", "翻译", "小作文", "大作文"],
      tasks: [
        "每天 45 分钟核心词汇复现，优先掌握熟词僻义和商科/管理类常见语境。",
        "隔天完成 1 篇阅读或完形，复盘选项逻辑和定位句。",
        "每周整理 2 个小作文模板、1 篇图表/图画作文框架。",
      ],
    };
  }
  if (subject === "201 英语一") {
    return {
      title: "英语一",
      tags: ["词汇", "阅读", "翻译", "新题型", "写作"],
      tasks: [
        "每天 60 分钟词汇和长难句，记录影响阅读判断的生词和句式。",
        "每两天精读 1 篇阅读，拆解题干、定位句、错误选项原因。",
        "每周训练 1 次翻译和 1 次大小作文，保留修改稿。",
      ],
    };
  }
  return {
    title: "英语科目待确认",
    tags: ["手动确认"],
    tasks: ["从官方目录确认是 201 英语一还是 204 英语二，再生成对应计划。"],
  };
}

function getMathPlan(subject) {
  const common = {
    "301 数学一": {
      title: "数学一",
      tags: ["高等数学", "线性代数", "概率论"],
      tasks: [
        "高数优先覆盖极限、导数、积分、级数、多元微积分和微分方程。",
        "线代每周至少 2 次专题训练，重点跟踪矩阵、向量组、特征值。",
        "概率论从随机变量、分布、数字特征到大数定律逐章推进。",
      ],
    },
    "302 数学二": {
      title: "数学二",
      tags: ["高等数学", "线性代数"],
      tasks: [
        "高数重心放在极限、导数、一元积分、多元微分和微分方程。",
        "线代保持题型熟练度，矩阵运算、秩、特征值和二次型要反复复盘。",
        "不安排概率论模块，把时间让给高数计算和证明题。", 
      ],
    },
    "303 数学三": {
      title: "数学三",
      tags: ["高等数学", "线性代数", "概率统计"],
      tasks: [
        "高数结合经管常见题型复习函数、极限、微积分和多元函数。",
        "线代聚焦矩阵、向量组、线性方程组、特征值和二次型。",
        "概率统计安排分布、估计、假设检验和综合应用题。", 
      ],
    },
    "396 经济类综合能力": {
      title: "396 经济类综合能力",
      tags: ["数学基础", "逻辑", "写作"],
      tasks: [
        "数学基础按 396 范围练习，不套用数三完整范围。",
        "逻辑每天做短组训练，记录形式逻辑和论证逻辑错因。",
        "写作每周完成 1 篇论证有效性分析或论说文。", 
      ],
    },
  };
  if (subject === "不考数学") {
    return null;
  }
  return (
    common[subject] || {
      title: "数学/综合待确认",
      tags: ["手动确认"],
      tasks: ["从官方目录确认是否考 301、302、303、396，或选择不考数学。"],
    }
  );
}

function getProfessionalPlan(text) {
  const subjects = compactText(text)
    ? compactText(text)
        .split(/[；;\n]+/)
        .map((item) => item.trim())
        .filter(Boolean)
    : [];
  return {
    title: subjects.length ? "专业课与自命题" : "专业课待确认",
    tags: subjects.length ? subjects : ["官方大纲", "真题", "参考书"],
    tasks: subjects.length
      ? [
          "把学校官网考试大纲、参考书、样题和历年真题集中到同一个资料夹。",
          "按章节建立真题索引：年份、题型、考点、错误原因、二刷日期。",
          "每周完成 1 次专业课复盘，更新未掌握知识点和资料缺口。",
        ]
      : ["从学校官网目录或考试大纲确认专业课代码与名称，不用二手信息替代官方来源。"],
  };
}

function getPoliticsPlan() {
  return {
    title: "思想政治理论",
    tags: ["选择题", "框架", "时政"],
    tasks: [
      "基础阶段先建立马原、史纲、毛中特、思修法基框架。",
      "强化阶段每天刷选择题并记录混淆点。",
      "冲刺阶段集中背诵分析题材料和时政热点。", 
    ],
  };
}

function buildSchoolLinks(target) {
  const school = target.school.trim();
  const major = target.major.trim();
  const code = getMajorCode(target);
  const searchLabel = [school || "目标院校", code, major].filter(Boolean).join(" ");
  const query = encodeURIComponent(`${searchLabel} 2027 硕士研究生 招生专业目录 考试科目 官网`);
  const outlineQuery = encodeURIComponent(`${searchLabel} 考研 考试大纲 参考书目 官网`);
  return [
    {
      label: school || major ? "研招网：按当前学校/专业" : "研招网硕士目录",
      href: buildYzLink(target),
      title: school || major ? `打开研招网并带上：${searchLabel}` : "打开研招网硕士专业目录",
    },
    {
      label: "学校专业目录检索",
      href: `https://www.bing.com/search?q=${query}`,
      title: `检索：${searchLabel} 招生专业目录 考试科目`,
    },
    {
      label: "考试大纲/参考书检索",
      href: `https://www.bing.com/search?q=${outlineQuery}`,
      title: `检索：${searchLabel} 考试大纲 参考书目`,
    },
  ];
}

function buildYzLink(target) {
  const params = new URLSearchParams();
  const school = target.school.trim();
  const major = target.major.trim();
  const code = getMajorCode(target);
  if (school) params.set("dwmc", school);
  if (major || code) params.set("zymc", [code, major].filter(Boolean).join(" "));
  const query = params.toString();
  return query ? `https://yz.chsi.com.cn/zsml/queryAction.do?${query}` : "https://yz.chsi.com.cn/zsml/";
}

function getSchoolStudyChecklist(target) {
  const schoolName = target.school || "目标院校";
  const majorName = target.major || "目标专业待填写";
  const code = getMajorCode(target);
  const profile = getMajorProfile(target);
  const english = target.englishSubject || "英语一/英语二待确认";
  const math = target.mathSubject || "数学/综合待确认";
  const professional = compactText(target.professionalSubjects) || "专业课代码、名称、大纲、参考书待确认";
  const hasSchool = Boolean(target.school);

  const sections = [
    {
      title: hasSchool ? `${schoolName} · ${code ? `${code} ` : ""}${majorName}` : "先输入目标学校",
      tag: hasSchool ? "学校清单" : "待输入",
      items: hasSchool
        ? [
            `到 ${schoolName} 研究生院/研招办官网确认招生专业目录。`,
            "核对专业代码、研究方向、学习方式、统考/自命题考试科目。",
            "把官方来源链接、PDF、截图保存到资料库，后续只按官方版本更新。",
          ]
        : ["在左侧输入学校名称后，这里会先列出官方目录、公共课、专业课和资料搜集任务。"],
    },
    {
      title: "公共课先学",
      tag: "必备",
      items: [
        "思想政治理论：马原、史纲、毛中特、思修法基、时政与选择题错题。",
        `${english}：先从词汇、阅读、长难句、翻译/写作开始；确认英语一或英语二后按模块细化。`,
        `${math}：确认是否考数学一、数学二、数学三、396，或不考数学；未确认前先不盲目买全套资料。`,
      ],
    },
    {
      title: `${profile.title} 要学`,
      tag: code ? `代码 ${code}` : "按专业匹配",
      items: [
        ...profile.studyTopics,
        `学校公布科目：${professional}`,
        "找到考试大纲后按章节拆任务：概念、题型、真题年份、参考书章节、错题复盘。",
      ],
    },
    {
      title: "资料要搜集",
      tag: "来源",
      items: [
        ...profile.materials,
        "招生简章、专业目录、考试大纲、参考书目、复试细则、拟录取名单。",
        "把每条资料标注来源链接和发布日期，避免旧资料混进新计划。",
      ],
    },
  ];

  return sections;
}

function renderTargetMaterials() {
  const target = getCurrentTarget();
  const code = getMajorCode(target);
  const profile = getMajorProfile(target);
  const links = buildMaterialSearchLinks(target);
  const heading = [target.school || "目标院校", code, target.major || profile.title].filter(Boolean).join(" · ");
  el.targetMaterials.innerHTML = `
    <article class="materials-summary">
      <div>
        <p class="eyebrow">对应资料</p>
        <h3>${escapeHtml(heading)}</h3>
        <p>${escapeHtml(profile.description)}</p>
      </div>
      <span class="tag">${escapeHtml(profile.title)}</span>
    </article>
    <div class="materials-grid">
      <article class="material-card">
        <h3>你现在要学</h3>
        <ul>${profile.studyTopics.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
      </article>
      <article class="material-card">
        <h3>对应学习资料</h3>
        <ul>${profile.materials.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
      </article>
      <article class="material-card">
        <h3>可能考试科目</h3>
        <ul>${profile.subjectHints.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
      </article>
      <article class="material-card">
        <h3>按当前目标去找</h3>
        <div class="material-links">
          ${links.map((link) => `<a href="${escapeHtml(link.href)}" target="_blank" rel="noreferrer">${escapeHtml(link.label)}</a>`).join("")}
        </div>
      </article>
    </div>
  `;
}

function renderSchoolChecklist() {
  const target = getCurrentTarget();
  const sections = getSchoolStudyChecklist(target);
  const links = buildSchoolLinks(target);
  el.schoolChecklist.innerHTML = `
    <div class="lookup-links">
      ${links
        .map(
          (link) =>
            `<a href="${escapeHtml(link.href)}" target="_blank" rel="noreferrer" title="${escapeHtml(link.title)}">${escapeHtml(link.label)}</a>`
        )
        .join("")}
    </div>
    <div class="checklist-grid">
      ${sections
        .map(
          (section) => `
            <article class="checklist-card">
              <div class="card-heading">
                <h3>${escapeHtml(section.title)}</h3>
                <span class="tag">${escapeHtml(section.tag)}</span>
              </div>
              <ul>${section.items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
            </article>
          `
        )
        .join("")}
    </div>
  `;
}

function renderModules() {
  const english = getEnglishPlan(el.englishSubject.value);
  const math = getMathPlan(el.mathSubject.value);
  const professional = getProfessionalPlan(el.professionalSubjects.value);
  const modules = [english, math, professional, getPoliticsPlan()].filter(Boolean);

  el.moduleGrid.innerHTML = modules
    .map(
      (module) => `
        <article class="module-card">
          <h3>${escapeHtml(module.title)}</h3>
          <div class="tag-row">${module.tags.map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join("")}</div>
          <ul>${module.tasks.map((task) => `<li>${escapeHtml(task)}</li>`).join("")}</ul>
        </article>
      `
    )
    .join("");
}

function renderReport() {
  const target = getCurrentTarget();
  const code = getMajorCode(target);
  const profile = getMajorProfile(target);
  const materialLinks = buildMaterialSearchLinks(target);
  const english = getEnglishPlan(target.englishSubject);
  const math = getMathPlan(target.mathSubject);
  const professional = getProfessionalPlan(target.professionalSubjects);
  const schoolChecklist = getSchoolStudyChecklist(target);
  const modules = [english, math, professional, getPoliticsPlan()].filter(Boolean);
  const sourceUrl = validUrl(target.sourceUrl) || "https://yz.chsi.com.cn/zsml/";
  const sourceLabel = target.sourceUrl || "研招网硕士目录入口";

  el.report.innerHTML = `
    <h2>${escapeHtml(target.examYear)} 考研目标学习报告</h2>
    <div class="report-meta">
      <div><strong>院校：</strong>${escapeHtml(target.school || "待填写")}</div>
      <div><strong>专业：</strong>${escapeHtml(target.major || "待填写")}</div>
      <div><strong>专业代码：</strong>${escapeHtml(code || "待填写")}</div>
      <div><strong>倒计时日期：</strong>${escapeHtml(target.examDate || "2026-12-19")}</div>
      <div><strong>官方来源：</strong><a href="${escapeHtml(sourceUrl)}" target="_blank" rel="noreferrer">${escapeHtml(sourceLabel)}</a></div>
      <div><strong>英语：</strong>${escapeHtml(target.englishSubject || "待确认")}</div>
      <div><strong>数学/综合：</strong>${escapeHtml(target.mathSubject || "待确认")}</div>
    </div>

    <h3>考试科目依据</h3>
    <p>本报告基于用户提供的学校官网、研招网或专业目录文本生成。自动识别只作为整理辅助，最终以招生单位官方公布的专业目录和考试大纲为准。</p>
    <p><strong>专业课/自命题：</strong>${escapeHtml(target.professionalSubjects || "待从官方目录补充")}</p>

    <h3>按专业代码匹配的学习资料</h3>
    <p><strong>${escapeHtml(profile.title)}：</strong>${escapeHtml(profile.description)}</p>
    <section>
      <h4>你现在要学</h4>
      <ul>${profile.studyTopics.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
    </section>
    <section>
      <h4>对应学习资料</h4>
      <ul>${profile.materials.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
    </section>
    <section>
      <h4>资料检索入口</h4>
      <ul>${materialLinks.map((link) => `<li><a href="${escapeHtml(link.href)}" target="_blank" rel="noreferrer">${escapeHtml(link.label)}</a></li>`).join("")}</ul>
    </section>

    <h3>输入学校后需要学习的内容</h3>
    ${schoolChecklist
      .map(
        (section) => `
          <section>
            <h4>${escapeHtml(section.title)}</h4>
            <ul>${section.items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
          </section>
        `
      )
      .join("")}

    <h3>阶段学习路线</h3>
    <ol>
      <li>基础阶段：确认考试科目、建立资料库、完成教材或基础课程第一轮。</li>
      <li>强化阶段：按科目专题刷题，建立错题和知识缺口清单。</li>
      <li>真题阶段：按年份整套训练，复盘命题规律和时间分配。</li>
      <li>冲刺阶段：压缩笔记、背诵高频内容、完成模拟和查漏补缺。</li>
    </ol>

    <h3>科目任务</h3>
    ${modules
      .map(
        (module) => `
          <section>
            <h4>${escapeHtml(module.title)}</h4>
            <ul>${module.tasks.map((task) => `<li>${escapeHtml(task)}</li>`).join("")}</ul>
          </section>
        `
      )
      .join("")}

    <h3>资料搜集清单</h3>
    <table class="resource-table">
      <thead>
        <tr><th>资料</th><th>用途</th><th>状态</th></tr>
      </thead>
      <tbody>
        <tr><td>学校官网专业目录</td><td>确认考试科目、专业代码、研究方向</td><td>必须保留链接或截图</td></tr>
        <tr><td>考试大纲/参考书目</td><td>确认专业课范围和题型</td><td>按章节拆成任务</td></tr>
        <tr><td>历年真题</td><td>判断重点、难度和重复考点</td><td>建立年份索引</td></tr>
        <tr><td>错题与复盘表</td><td>追踪薄弱点</td><td>每周更新</td></tr>
      </tbody>
    </table>
  `;
}

function validUrl(value) {
  try {
    const url = new URL(value);
    return url.href;
  } catch {
    return "";
  }
}

function updateSourceProof() {
  const url = validUrl(el.sourceUrl.value);
  if (url) {
    el.sourceProofLink.href = url;
    el.sourceProofLink.textContent = "打开当前官方来源";
  } else {
    el.sourceProofLink.href = "https://yz.chsi.com.cn/zsml/";
    el.sourceProofLink.textContent = "研招网硕士目录";
  }
}

function updateTopYzLink() {
  const target = getCurrentTarget();
  const href = buildYzLink(target);
  const label = [target.school, getMajorCode(target), target.major].filter(Boolean).join(" · ");
  el.topYzLink.href = href;
  el.topYzLink.textContent = label ? "研招网当前目标" : "研招网目录";
  el.topYzLink.title = label ? `打开研招网：${label}` : "打开研招网硕士专业目录";
}

function renderSavedTargets() {
  const targets = getTargets();
  if (!targets.length) {
    el.savedTargets.innerHTML = `<p class="muted">还没有保存目标。保存后可在不同院校专业之间切换。</p>`;
    return;
  }

  el.savedTargets.innerHTML = targets
    .map(
      (target, index) => `
        <article class="saved-card">
          <strong>${escapeHtml(target.school || "未命名院校")} · ${escapeHtml(getMajorCode(target) || target.majorCode || "")} ${escapeHtml(target.major || "未命名专业")}</strong>
          <p>${escapeHtml(target.englishSubject || "英语待确认")} / ${escapeHtml(target.mathSubject || "数学待确认")}</p>
          <div class="saved-actions">
            <button type="button" data-load="${index}">载入</button>
            <button type="button" data-delete="${index}">删除</button>
          </div>
        </article>
      `
    )
    .join("");
}

function saveTarget() {
  const target = getCurrentTarget();
  target.id = `${Date.now()}`;
  const label = `${target.school}${target.major}${target.majorCode}`.trim();
  if (!label) {
    el.confidenceBanner.className = "confidence needs-review";
    el.confidenceBanner.textContent = "保存前请至少填写院校或专业。";
    return;
  }
  const targets = getTargets();
  targets.unshift(target);
  setTargets(targets.slice(0, 12));
  renderSavedTargets();
}

function clearForm() {
  applyTarget(defaultTarget);
  el.confidenceBanner.className = "confidence needs-review";
  el.confidenceBanner.textContent = "已清空。请填写目标并粘贴官方来源文本。";
}

async function extractPdfText(file) {
  if (!file) return;
  if (!window.pdfjsLib) {
    el.pdfStatus.textContent = "PDF 解析库尚未加载完成，请稍后重试，或直接粘贴文本。";
    return;
  }

  el.pdfStatus.textContent = `正在读取 ${file.name}...`;
  try {
    window.pdfjsLib.GlobalWorkerOptions.workerSrc =
      "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
    const data = await file.arrayBuffer();
    const pdf = await window.pdfjsLib.getDocument({ data }).promise;
    const pages = [];
    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
      const page = await pdf.getPage(pageNumber);
      const content = await page.getTextContent();
      pages.push(content.items.map((item) => item.str).join(" "));
    }
    const extracted = compactText(pages.join("\n"));
    el.sourceText.value = compactText([el.sourceText.value, extracted].filter(Boolean).join("\n\n"));
    el.pdfStatus.textContent = `已提取 ${pdf.numPages} 页文字，请点击识别考试科目。`;
    persistActive();
  } catch (error) {
    el.pdfStatus.textContent = "PDF 提取失败。可把官网目录文字复制到文本框后继续识别。";
  }
}

function refreshAll() {
  updateCountdown();
  updateSourceProof();
  updateTopYzLink();
  renderSchoolChecklist();
  renderTargetMaterials();
  renderModules();
  renderReport();
  renderSavedTargets();
}

function bindEvents() {
  el.analyzeBtn.addEventListener("click", analyzeSource);
  el.saveBtn.addEventListener("click", saveTarget);
  el.clearBtn.addEventListener("click", clearForm);
  el.pdfFile.addEventListener("change", (event) => extractPdfText(event.target.files[0]));
  el.printReport.addEventListener("click", () => window.print());
  el.printReportTop.addEventListener("click", () => window.print());

  [
    el.school,
    el.major,
    el.majorCode,
    el.examYear,
    el.examDate,
    el.sourceUrl,
    el.sourceText,
    el.englishSubject,
    el.mathSubject,
    el.professionalSubjects,
  ].forEach((field) => {
    field.addEventListener("input", () => {
      persistActive();
      refreshAll();
    });
    field.addEventListener("change", () => {
      persistActive();
      refreshAll();
    });
  });

  el.savedTargets.addEventListener("click", (event) => {
    const loadIndex = event.target.getAttribute("data-load");
    const deleteIndex = event.target.getAttribute("data-delete");
    const targets = getTargets();
    if (loadIndex !== null) {
      applyTarget(targets[Number(loadIndex)]);
    }
    if (deleteIndex !== null) {
      targets.splice(Number(deleteIndex), 1);
      setTargets(targets);
      renderSavedTargets();
    }
  });
}

bindEvents();
loadActive();
