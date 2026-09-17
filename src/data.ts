export type Entry = {
  period: string
  org: string
  role: string
  desc: string
  tags: string[]
  highlights?: string[]
}

export type Section = {
  id: string
  label: string
  en: string
  planet: string
  color: string
  radius: number
  size: number
  speed: number
  start: number
  entries: Entry[]
}

export const profile = {
  name: '杜昱徵',
  englishName: 'DU YUZHENG',
  role: '前端 / 全栈开发',
  intent: '求职意向：前端 / 全栈开发',
  intro: '2027 届计算机科学与技术本科，曾在若扉（Schools.fyi）与北京硅基流动（BizyAir）担任前端开发实习生。熟练掌握 Vue3 与 React，具备复杂大模型流式交互、长任务 Web 端处理及海量数据页面渲染优化经验。',
  location: 'HENAN · CN',
  status: 'OPEN TO 2027 OPPORTUNITIES',
  phone: '15603776449',
  email: 'dyzbear88@gmail.com',
  github: 'https://github.com/panderBother',
  githubName: 'panderBother',
  blog: 'CSDN',
}

export const sections: Section[] = [
  {
    id: 'internship', label: '实习经历', en: 'INTERNSHIP', planet: '水星', color: '#b5ada1', radius: 4.2, size: .3, speed: .22, start: .2,
    entries: [
      {
        period: '2026.05 — 2026.08', org: '北京硅基流动科技有限公司 · BizyAir', role: '前端开发实习生',
        desc: '参与一站式 AI 创作平台 BizyAir 前端研发，负责主站 AI 推理任务管理、页面性能优化与交互体验提升，并承担 Console 的日常维护与新增功能开发。',
        tags: ['React', 'TypeScript', 'WebSocket', '虚拟滚动', 'OSS'],
        highlights: [
          '搭建 ComfyUI WebSocket 状态推送链路，加入心跳保活、指数退避重连，并为 Playground 设计批量轮询、失败清理及结果展示，覆盖长耗时推理任务的完整生命周期。',
          '封装虚拟滚动、无限加载与瀑布流通用 Hooks，通过可视区域精准渲染、滚动防抖与增量更新，将海量数据页面滚动 FPS 从约 20 提升至接近 60。',
          '对接 OSS 动态请求 WebP 缩略图，将单图从 2MB 级降至 10KB 级；结合图片预加载、懒加载与异步解码，缓解历史任务滚动时的白屏和卡顿。',
        ],
      },
      {
        period: '2025.09 — 2026.04', org: '若扉 · Schools.fyi 升学服务平台', role: '前端开发实习生',
        desc: '负责 AI 对话与智能搜索模块的前端实现，完成 LLM 流式输出、多会话 AI 并发及搜索体验优化，保障大模型交互场景下页面流畅稳定。',
        tags: ['React', 'LLM', 'SSE', 'Web Performance', 'AbortController'],
        highlights: [
          '将流式内容接收与视图更新解耦，结合 useDeferredValue、稳定前缀解析、React.memo 与 rIC/rAF 帧预算调度，实现流式期间零长任务并稳定 60 FPS。',
          '以会话 ID 隔离消息、流式响应和生成状态，通过独立 AbortController 与请求标识校验管理任务生命周期，避免响应串流和旧数据覆盖。',
          '通过 300ms 防抖和 AbortController 取消在途搜索，加入关键词高亮、来源卡片、骨架屏及无结果、低相关度和异常状态反馈。',
        ],
      },
    ],
  },
  {
    id: 'projects', label: '项目经历', en: 'PROJECTS', planet: '地球', color: '#4d9fff', radius: 6.3, size: .47, speed: .13, start: 2.3,
    entries: [
      {
        period: '2026.04 — 2026.05', org: '个人与团队知识管理平台', role: 'KnowMind · 全栈开发',
        desc: '自研 AI Native 知识平台，支持多格式文档解析、知识库全生命周期管理、Hybrid RAG 智能问答与 MCP 工具扩展，提供准确、可核对、可观测的知识服务。',
        tags: ['Python', 'FastAPI', 'React', 'MySQL', 'Redis', 'Chroma', 'MCP', 'SSE'],
        highlights: [
          '基于 FastAPI 构建事件驱动服务，动态生成多阶段执行计划，并通过 SSE 推送执行轨迹；多源检索并发执行，内置重试、降级与两级上下文管理。',
          '融合向量检索与 BM25 构建双路召回，经 RRF 融合与 CrossEncoder 重排，并在重排异常时自动降级，兼顾准确率和稳定性。',
          '设计异步入库流水线贯通解析、切分、向量化和双索引写入，采用 Celery 与后台线程双模式部署，支持进度可视化、失败重试、增量更新和多租户隔离。',
        ],
      },
      {
        period: '2025.06 — 2025.08', org: '在线教育直播教学平台', role: '智学在线 · 前端开发组长',
        desc: '面向在线教育场景开发集视频上传、直播、录播与实时互动于一体的平台，基于 WebRTC 与 WebSocket 实现低延迟音视频通信。',
        tags: ['Vue3', 'TypeScript', 'WebRTC', 'WebSocket', 'Canvas', 'Web Worker'],
        highlights: [
          '使用 TensorFlow.js 与 MediaPipe 做人体分割，将推理和遮罩合成下沉至 Web Worker，以 Transferable ImageBitmap 零拷贝传输，实现智能弹幕防遮挡并消除主线程帧率抖动。',
          '以 Canvas 离屏渲染替代 DOM，结合虚拟轨道调度和 ImageBitmap 纹理缓存，使高密度弹幕稳定 60 FPS，预热后主线程 Long Task 归零。',
          '采用分片并行上传、断点续传及 Web Worker 异步 MD5 校验，实现教学视频秒传、重复检测和弱网稳定上传。',
        ],
      },
    ],
  },
  {
    id: 'education', label: '教育经历', en: 'EDUCATION', planet: '火星', color: '#d56b47', radius: 8.35, size: .36, speed: .095, start: 3.45,
    entries: [
      {
        period: '2023.09 — 2027.06', org: '河南科技学院', role: '计算机科学与技术 · 本科',
        desc: '在校期间加入未来软件工作室并持续深耕三年，担任前端负责人，负责制定学习计划、把控项目进度与成员考核；参与校企合作，为学校开发高校 AI 赋能学生发展系统。',
        tags: ['前端负责人', '团队协作', '项目推进'],
        highlights: ['荣获蓝桥杯软件大赛国家二等奖。', '荣获“发现杯”程序设计大赛二等奖及多项校级奖项。'],
      },
    ],
  },
  {
    id: 'strengths', label: '能力与荣誉', en: 'STRENGTHS', planet: '土星', color: '#e8d39e', radius: 11.1, size: .67, speed: .055, start: 5.05,
    entries: [
      { period: '三年工作室经历', org: '未来软件工作室', role: '前端负责人', desc: '负责前端方向学习计划、成员考核与项目进度把控，具备团队协调、技术沟通和项目推进能力。', tags: ['Team Lead', 'Mentoring', 'Delivery'] },
      { period: '校企合作实践', org: '高校 AI 赋能学生发展系统', role: '核心开发成员', desc: '参与真实校企合作项目，具备从需求理解、协作开发到完整交付的项目经验和企业级流程意识。', tags: ['AI', '全栈开发', '协作交付'] },
      { period: '竞赛荣誉', org: '国家级与校级竞赛', role: '蓝桥杯国家二等奖', desc: '获得蓝桥杯软件大赛国家二等奖、“发现杯”程序设计大赛二等奖及多项校级奖项。', tags: ['蓝桥杯', '发现杯', 'Problem Solving'] },
    ],
  },
]

export const skills = [
  ['HTML5 / CSS3', '#ff8b68', 0], ['JavaScript / TypeScript', '#f5df4d', 1],
  ['Vue3', '#42d392', 2], ['React', '#61dafb', 3], ['Vite / Webpack', '#b7a7ff', 4],
  ['Git', '#f26b4f', 5], ['Sass / Tailwind CSS', '#38bdf8', 6], ['Element Plus / Ant Design / MUI', '#7aa2ff', 7],
  ['Java / Spring Boot', '#ef6c55', 8], ['MySQL / Redis', '#68c4ff', 9],
  ['Python / FastAPI', '#ffd45e', 10], ['WebSocket / SSE', '#75f2b3', 11],
  ['WebRTC', '#ff78bd', 12], ['Canvas / Web Worker', '#d8e8ff', 13],
  ['RAG / MCP', '#bb8cff', 14], ['前端性能优化', '#ffbd6a', 15],
] as const

const foundation = '熟练掌握 HTML5、CSS3、JavaScript 与 TypeScript，熟悉 ES6+，理解浏览器渲染流程、事件循环与模块化开发规范。'
const framework = '熟练使用 Vue3 + Composition API，理解响应式原理、组件通信、生命周期及 Vue Router、Pinia；熟悉 React Hooks、组件封装与状态管理。'
const engineering = '熟悉 Git 多人协作及 npm、pnpm，掌握 Webpack、Vite，能够完成构建优化、代码拆分、按需加载与静态资源优化。'
const fullstack = '熟悉 Java 与 Spring Boot，能够独立开发 RESTful API；熟悉 MySQL、Redis，并具备 Python、FastAPI 全栈项目实践。'
const styling = '掌握 Sass、Tailwind CSS，熟悉 Element Plus、Ant Design、MUI 等 UI 组件库。'

export const skillDetails: Record<string, string> = {
  'HTML5 / CSS3': foundation, 'JavaScript / TypeScript': foundation,
  Vue3: framework, React: framework,
  'Vite / Webpack': engineering, Git: engineering,
  'Sass / Tailwind CSS': styling, 'Element Plus / Ant Design / MUI': styling,
  'Java / Spring Boot': fullstack, 'MySQL / Redis': fullstack, 'Python / FastAPI': fullstack,
  'WebSocket / SSE': '具备复杂大模型流式交互与长任务状态追踪经验，实践过心跳保活、断线重连、SSE 事件流与多会话状态隔离。',
  WebRTC: '具备低延迟音视频通信与实时互动开发经验，并完成过在线教育直播场景的工程实践。',
  'Canvas / Web Worker': '能够使用 Canvas、Web Worker 与 ImageBitmap 优化高频渲染和计算密集任务，降低主线程 Long Task。',
  'RAG / MCP': '具备 Hybrid RAG、向量与 BM25 混合召回、CrossEncoder 重排及 MCP 工具扩展实践。',
  前端性能优化: '实践过虚拟滚动、无限加载、瀑布流、图片预加载、异步解码与流式渲染调度，能针对 FPS、长任务和资源体积进行量化优化。',
}
