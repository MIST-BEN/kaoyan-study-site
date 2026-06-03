const STORAGE_KEY = "kaoyan-targets-v1";
const ACTIVE_KEY = "kaoyan-active-target-v1";
const PUBLIC_CODES = new Set(["101", "199", "201", "204", "301", "302", "303", "396"]);

const el = {
  school: document.querySelector("#school"),
  major: document.querySelector("#major"),
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
  moduleGrid: document.querySelector("#moduleGrid"),
  report: document.querySelector("#report"),
  printReport: document.querySelector("#printReport"),
  printReportTop: document.querySelector("#printReportTop"),
};

const defaultTarget = {
  school: "",
  major: "",
  examYear: "2027",
  examDate: "2026-12-19",
  sourceUrl: "",
  sourceText: "",
  englishSubject: "",
  mathSubject: "",
  professionalSubjects: "",
};

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
  const searchLabel = [school || "目标院校", major].filter(Boolean).join(" ");
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
  if (school) params.set("dwmc", school);
  if (major) params.set("zymc", major);
  const query = params.toString();
  return query ? `https://yz.chsi.com.cn/zsml/queryAction.do?${query}` : "https://yz.chsi.com.cn/zsml/";
}

function getSchoolStudyChecklist(target) {
  const schoolName = target.school || "目标院校";
  const majorName = target.major || "目标专业待填写";
  const english = target.englishSubject || "英语一/英语二待确认";
  const math = target.mathSubject || "数学/综合待确认";
  const professional = compactText(target.professionalSubjects) || "专业课代码、名称、大纲、参考书待确认";
  const hasSchool = Boolean(target.school);

  const sections = [
    {
      title: hasSchool ? `${schoolName} · ${majorName}` : "先输入目标学校",
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
      title: "专业课要学",
      tag: "学校决定",
      items: [
        professional,
        "找到考试大纲后按章节拆任务：概念、题型、真题年份、参考书章节、错题复盘。",
        "没有大纲时，先整理学校公开真题、参考书目、学院通知和复试细则。",
      ],
    },
    {
      title: "资料要搜集",
      tag: "来源",
      items: [
        "招生简章、专业目录、考试大纲、参考书目、复试细则、拟录取名单。",
        "历年真题和样题：按年份、题型、考点、错因建立索引。",
        "把每条资料标注来源链接和发布日期，避免旧资料混进新计划。",
      ],
    },
  ];

  return sections;
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
      <div><strong>倒计时日期：</strong>${escapeHtml(target.examDate || "2026-12-19")}</div>
      <div><strong>官方来源：</strong><a href="${escapeHtml(sourceUrl)}" target="_blank" rel="noreferrer">${escapeHtml(sourceLabel)}</a></div>
      <div><strong>英语：</strong>${escapeHtml(target.englishSubject || "待确认")}</div>
      <div><strong>数学/综合：</strong>${escapeHtml(target.mathSubject || "待确认")}</div>
    </div>

    <h3>考试科目依据</h3>
    <p>本报告基于用户提供的学校官网、研招网或专业目录文本生成。自动识别只作为整理辅助，最终以招生单位官方公布的专业目录和考试大纲为准。</p>
    <p><strong>专业课/自命题：</strong>${escapeHtml(target.professionalSubjects || "待从官方目录补充")}</p>

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
  const label = [target.school, target.major].filter(Boolean).join(" · ");
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
          <strong>${escapeHtml(target.school || "未命名院校")} · ${escapeHtml(target.major || "未命名专业")}</strong>
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
  const label = `${target.school}${target.major}`.trim();
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
