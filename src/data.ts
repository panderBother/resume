export type Entry = { period: string; org: string; role: string; desc: string; tags: string[] }
export type Section = {
  id: string; label: string; en: string; planet: string; color: string;
  radius: number; size: number; speed: number; start: number; entries: Entry[];
}

export const profile = {
  name: '星野',
  englishName: 'XINGYE',
  role: 'CREATIVE DEVELOPER',
  intro: '我在工程与视觉的交界处工作，把复杂技术做成自然、好看，也让人愿意多停留几秒的数字体验。',
  location: 'SHANGHAI · CN',
  status: 'AVAILABLE FOR 2027',
}

export const sections: Section[] = [
  { id:'internship', label:'实习经历', en:'INTERNSHIP', planet:'水星', color:'#a8a49d', radius:4.1, size:.26, speed:.23, start:.2, entries:[
    { period:'2024.07 — 2024.09', org:'Studio Nova', role:'创意开发实习生', desc:'负责 WebGL 落地页动效与可视化组件库，参与从设计、开发到上线的完整交付。', tags:['Three.js','GSAP','TypeScript'] },
    { period:'2023.06 — 2023.09', org:'某 AI 实验室', role:'前端实习生', desc:'重构内部数据标注平台的大列表组件，将关键页面渲染耗时降至原来的四分之一。', tags:['React','TanStack','A11y'] },
    { period:'2022.03 — 2022.06', org:'Tech Startup', role:'开发实习生', desc:'编写自动化脚本与数据迁移工具，把高频重复流程交给代码。', tags:['Node.js','Puppeteer'] },
  ]},
  { id:'work', label:'工作经历', en:'EXPERIENCE', planet:'金星', color:'#d9a962', radius:5.2, size:.39, speed:.17, start:1.3, entries:[
    { period:'2024.10 — 至今', org:'显示科技 · 创意工程团队', role:'前端工程师', desc:'负责客户项目中的创意页面与三维交互，从技术提案到上线持续交付。', tags:['Creative Dev','Three.js','Delivery'] },
    { period:'2026.03 — 至今', org:'内部 Studio', role:'技术负责人', desc:'带领三人小组完成技术选型与工程规范，推动 Design Token 体系落地。', tags:['Architecture','Team','Design System'] },
  ]},
  { id:'projects', label:'项目经历', en:'PROJECTS', planet:'地球', color:'#4d9fff', radius:6.5, size:.43, speed:.13, start:2.45, entries:[
    { period:'Nebula Engine', org:'独立项目', role:'3D 场景框架', desc:'将商业项目中的三维场景管理能力沉淀为 TypeScript 框架。', tags:['Three.js','TypeScript','4.2k ⭐'] },
    { period:'Orbit UI', org:'开源项目', role:'创意组件库', desc:'面向创意开发场景的 React 组件库，强调动效和可组合性。', tags:['React','Vite','1.9k ⭐'] },
    { period:'Stellar Chat', org:'实验项目', role:'端到端加密聊天', desc:'使用 WebCrypto 与 IndexedDB 构建纯前端离线可用的聊天实验。', tags:['WebCrypto','IndexedDB'] },
    { period:'Cosmos Dash', org:'内部工具', role:'数据可视化看板', desc:'支持拖拽布局、实时刷新与演示文档导出的运营看板。', tags:['WebGL','Realtime','Export'] },
  ]},
  { id:'education', label:'教育经历', en:'EDUCATION', planet:'火星', color:'#d56b47', radius:7.8, size:.32, speed:.1, start:3.3, entries:[
    { period:'2019 — 2023', org:'某 985 高校', role:'计算机科学 · 学士', desc:'GPA 3.7/4.0，校机器人队队长，方向为图形学与人机交互。', tags:['Graphics','Robotics','HCI'] },
    { period:'2023 — 2026', org:'在职硕士', role:'数字媒体 · 在读', desc:'研究方向为 Web 实时渲染与数字体验的可访问性。', tags:['WebGL','Accessibility'] },
  ]},
  { id:'opensource', label:'开源作品', en:'OPEN SOURCE', planet:'木星', color:'#d8b48c', radius:9.3, size:.76, speed:.075, start:4.1, entries:[
    { period:'nebula-engine', org:'GitHub · npm', role:'3D 场景框架', desc:'已发布 14 个 minor 版本，包含文档站与交互式 Playground。', tags:['TypeScript','4.2k ⭐'] },
    { period:'starfield.js', org:'GitHub', role:'极简粒子星空', desc:'单文件可运行的星空背景，压缩后 1.2KB。', tags:['JavaScript','568 ⭐'] },
    { period:'design-tokens-cn', org:'GitHub', role:'中文 Token 规范', desc:'面向中文团队的设计变量命名与协作规范。', tags:['Docs','Design System'] },
  ]},
  { id:'strengths', label:'特长能力', en:'STRENGTHS', planet:'土星', color:'#e8d39e', radius:11.2, size:.64, speed:.055, start:5.2, entries:[
    { period:'Creative Coding', org:'核心能力', role:'把设计意图写进代码', desc:'擅长实时图形、微交互和具有叙事感的网页体验。', tags:['WebGL','Motion','Shader'] },
    { period:'Engineering', org:'核心能力', role:'复杂前端工程化', desc:'重视性能、类型边界、可访问性与可持续维护。', tags:['Architecture','Performance'] },
    { period:'Communication', org:'协作能力', role:'在设计与工程之间翻译', desc:'能把技术限制讲清楚，也能把抽象视觉目标变成实现路径。', tags:['Design','Product'] },
  ]},
  { id:'interests', label:'兴趣爱好', en:'INTERESTS', planet:'天王星', color:'#83d8de', radius:13, size:.48, speed:.04, start:5.8, entries:[
    { period:'星轨摄影', org:'个人爱好', role:'深空长时间曝光', desc:'用镜头记录肉眼看不见的时间轨迹。', tags:['Photography','Night sky'] },
    { period:'徒步 · 露营', org:'周末计划', role:'去没有信号的地方', desc:'喜欢在低连接的环境里重新感受尺度与时间。', tags:['Outdoor','Hiking'] },
    { period:'Blender', org:'业余创作', role:'三维建模', desc:'用简单模型和材质为网页实验补充空间感。', tags:['3D','Blender'] },
  ]},
]

export const skills = [
  ['React', '#61dafb', 0], ['TypeScript','#4f8cff',1], ['Three.js','#d8e8ff',2],
  ['Node.js','#65bd60',3], ['WebGL','#ff6ec7',4], ['CSS','#6aa6ff',5],
  ['Vite','#b7a7ff',6], ['Figma','#ff78bd',7], ['Python','#ffd45e',8],
  ['Git','#f26b4f',9], ['AI Agent','#75f2b3',10], ['Design System','#ffbd6a',11],
] as const
