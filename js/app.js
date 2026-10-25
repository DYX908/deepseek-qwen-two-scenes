/* 页面总控。原则：页面永远在走——不固定画面；每段动画在内容经过屏幕的过程中顺势完成，
   往下滑展开、往回滑收回。滚动用 Lenis 做平滑惯性。
   网址参数：?static 直接显示最终状态（截图自查）；?motion=full 无视系统「减少动态效果」；?nosmooth 关闭平滑滚动 */
(function () {
  const D = window.DATA, fmt = d3.format(",");
  const Q = location.search;
  const REDUCED = (!/motion=full/.test(Q) && matchMedia("(prefers-reduced-motion: reduce)").matches) || /static/.test(Q);
  gsap.registerPlugin(ScrollTrigger);

  // 文字绑定
  const bind = () => document.querySelectorAll("[data-bind]").forEach(el => {
    const v = el.dataset.bind.split(".").reduce((o, k) => (o ? o[k] : undefined), window.TEXT);
    // 图表标题：普通空格换成不断行空格，让标题只在标点处换行（不会断成「15 / 篇」）
    if (v !== undefined) el.innerHTML = el.classList.contains("fig-title") ? v.replace(/ /g, "\u00A0") : v;
  });

  // 图标（Phosphor，MIT）：按 data-icon 载入 SVG
  document.querySelectorAll("[data-icon]").forEach(el =>
    fetch(`icons/${el.dataset.icon}.svg`).then(r => r.text()).then(s => (el.innerHTML = s)).catch(() => {}));

  // 实时计数器（封面一个、结尾两个，都从打开页面开始计）：
  // Qwen 下载 = 最近 30 天下载量 ÷ 30 天；DeepSeek 报道 = 2026Q2 报道量 ÷ 91 天
  const ctr = document.getElementById("ctr"), mUse = document.getElementById("m-use"), mTalk = document.getElementById("m-talk"), mTime = document.getElementById("m-time");
  let lastSec = -1;
  const perDay = D.ratios.find(r => r.metric.startsWith("HuggingFace")).Qwen / 30, lastQ = D.gdelt.quarterly[D.gdelt.quarterly.length - 1];
  const talkPerDay = lastQ.DeepSeek / 91, perSec = perDay / 86400, talkPerSec = talkPerDay / 86400, t0 = performance.now();
  document.querySelectorAll("[data-rate]").forEach(el => (el.textContent = el.dataset.rate === "use"
    ? `按最近 30 天的日均下载量（约 ${fmt(Math.round(perDay / 1e4))} 万次）推算`
    : `按 ${lastQ.quarter.slice(0, 4)} 年二季度的日均报道量（约 ${Math.round(talkPerDay)} 篇）推算`));
  (function tick() {
    const s = (performance.now() - t0) / 1000;
    if (ctr) ctr.textContent = fmt(Math.floor(s * perSec));
    if (mUse) mUse.textContent = fmt(Math.floor(s * perSec));
    if (mTalk) mTalk.textContent = (s * talkPerSec).toFixed(3);
    if (mTime && Math.floor(s) !== lastSec) {
      lastSec = Math.floor(s);
      mTime.innerHTML = `${Math.floor(lastSec / 60)}<small>分</small>${String(lastSec % 60).padStart(2, "0")}<small>秒</small>`;
    }
    requestAnimationFrame(tick);
  })();

  // 跑马灯内容：真实数据
  function fillTickers() {
    const esc = s => s.replace(/[&<>]/g, "");
    document.querySelectorAll(".ticker").forEach(tk => {
      const items = tk.dataset.src === "talk"
        ? D.cover_texture.talk.slice(0, 24).map(s => `<span class="it">${esc(s)}</span>`)
        : D.cover_texture.use.slice(0, 24).map(m => `<span class="it">${m.id}<em>↓</em>${fmt(m.dl)}</span>`);
      tk.querySelector(".track").innerHTML = items.join("") + items.join("");
    });
  }

  // 文字卡片旁的剪报：两边点赞最多的真实帖子
  function fillExamples() {
    const host = document.querySelector("[data-examples]"); if (!host) return;
    const esc = s => s.replace(/[&<>]/g, "");
    const block = (kw, cls, label) => `<div class="clip-h ${cls === "use" ? "c-use" : "c-talk"}">${label}</div>` +
      D.hn_examples[kw].slice(0, 2).map(x => `<div class="clip ${cls}">${esc(x.title)}<small>Hacker News · ${x.month} · 获赞 ${fmt(x.points)}</small></div>`).join("");
    host.innerHTML = block("DeepSeek", "talk", "谈 DeepSeek 的帖子") + block("Qwen", "use", "谈 Qwen 的帖子");
  }

  // 数据与方法：从数据生成，逐条列出限制措施的来源链接
  function fillMethod() {
    const host = document.querySelector("[data-method]"); if (!host) return;
    const G = D.bans.grades, dv = D.derivatives;
    const bans = D.bans.items.map(b => `<li>${b.date} ${b.place} · ${b.issuer}：${b.document}（${G[b.grade]}）<br><a href="${b.url}" target="_blank" rel="noopener">${b.url}</a></li>`).join("");
    host.innerHTML = `
      <section><h3>七类数据来源</h3><ol>
        <li>HuggingFace Hub API：28 家主要开源模型发布机构的全部公开模型 ${fmt(D.meta.hf_model_count)} 个，下载快照采集于 ${D.meta.snapshot_hf}；「下载榜」图单独采用 ${D.meta.snapshot_rank} 的完整快照。衍生关系采用 ${D.meta.snapshot_derivatives} 的固定样本：${dv.bases.CN + dv.bases.US_EU} 个热门底座、${fmt(dv.total_relations)} 条关系。</li>
        <li>GitHub REST API：deepseek-ai 与 QwenLM 两个组织全部自有仓库的收藏数。采集于 ${D.meta.snapshot_github}。</li>
        <li>Hacker News（Algolia API）：关键词精确匹配的月度帖子数（采集于 ${D.meta.snapshot_hn}）；标题含 DeepSeek / Qwen 的帖子 ${fmt(D.hn_topics.by_keyword.DeepSeek.n + D.hn_topics.by_keyword.Qwen.n)} 条（采集于 2026-10-07）。</li>
        <li>慧科新闻搜索研究库（完整检索库）：中国大陆报刊，标题与正文检索，按季度统计报道篇数。采集于 ${D.meta.snapshot_wisers}。</li>
        <li>GDELT 全球新闻库（DOC 2.0 API）：65 种语言的网络新闻，外语文章经机器翻译后检索；检索式「DeepSeek」与「(Qwen OR "Tongyi Qianwen")」，去掉中国大陆来源（-sourcecountry:CH）；2025Q1—2026Q2 按季度统计文章数。采集于 ${D.meta.snapshot_gdelt}。</li>
        <li>LiveBench：${D.supplement.benchmark.edition} 题目版本，${D.supplement.benchmark.retrieved} 采集快照；对比 ${D.supplement.benchmark.models.DeepSeek} 与 ${D.supplement.benchmark.models.Qwen}，七类子任务分别取均值。选取两家较新一代的 Flash 系列公开权重型号，不按得分选取；平台成绩来自其配置的 API，不能等同于本地部署成绩。<a href="${D.supplement.benchmark.archive}" download>采集时评分原表（CSV）</a>、<a href="data/livebench-categories-2026-06-25.json" download>任务分类</a>、<a href="https://livebench.ai/" target="_blank" rel="noopener">LiveBench 网站</a>。</li>
        <li>各国政府公告：${D.bans.total} 项限制措施，依据官方公告与公开报道核查，来源见下。核查于 2026-10-07。</li></ol></section>
      <section><h3>统计说明</h3><ul>
        <li>时间序列统一为 2025 年一季度至 2026 年二季度；下载量为采集日之前 30 天的快照。</li>
        <li>模型所属地区按发布机构归属划分；衍生关系依据 HuggingFace 的底座字段，底座统一采用 30 日下载量 ≥ 50 万的筛选标准。</li>
        <li>慧科统计中国大陆报刊；GDELT 统计中国大陆以外来源的网络新闻，两库分别计算，不合并篇数。GDELT 的 ${D.gdelt.days_total} 天查询区间中，接口返回 ${D.gdelt.days} 个日度数据点，季度值为返回记录之和。</li>
        <li>报道与帖子按所列关键词检索；新闻篇数、帖子数、收藏数、下载量和衍生关系分别反映报道、讨论与模型获取情况，不等同于独立用户数或实际部署数量。</li>
        <li>HF 下载量按平台特定文件请求计数，可能包含重复或自动请求，不等同于完整权重下载、独立用户或实际部署；公开数据不含下载者地区，不能据此计算海外采用人数。任务构成按 pipeline_tag 划分，缺标签的保留在未标注组。</li>
        <li>五项对比指标分别按各自的统计范围与时间窗口计算，倍数用于比较各指标内的 DeepSeek 与 Qwen。</li></ul></section>
      <section><h3>能力评测与背景资料</h3><p>能力图固定使用 2026-10-10 留存的七维评分，不是实时排行榜。2026-06-25 是题目版本日期，不是两款模型的发布日期或测试日期。该快照的模型配置中，DeepSeek 使用 Max 推理设置、输出上限 384,000 tokens；Qwen 开启思考、输出上限 131,072 tokens。配置并非实际消耗；参数规模、预算与服务端实现不同，不能作等成本因果比较，未核实每次实际运行消耗。</p><ul>
        <li>型号与公开权重：<a href="https://huggingface.co/deepseek-ai/DeepSeek-V4.1-Flash" target="_blank" rel="noopener">DeepSeek V4.1 Flash</a>、<a href="https://huggingface.co/Qwen/Qwen3.8-Flash-Next" target="_blank" rel="noopener">Qwen3.8 Flash Next</a>。</li>
        <li>新闻背景：<a href="https://deepseek.com/en/news/deepseek-r1/" target="_blank" rel="noopener">R1 发布公告</a>、<a href="https://apnews.com/article/f4908eaca221d601e31e7e3368778030" target="_blank" rel="noopener">AP 当时报道</a>。</li>
        <li>历史产品与技术关系：<a href="https://qwenlm.github.io/blog/qwen3/" target="_blank" rel="noopener">Qwen3 发布说明</a>、<a href="https://github.com/deepseek-ai/DeepSeek-R1" target="_blank" rel="noopener">DeepSeek-R1 型号说明</a>、<a href="https://huggingface.co/deepseek-ai/DeepSeek-R1-0528-Qwen3-8B" target="_blank" rel="noopener">Qwen 底座与 DeepSeek 蒸馏模型卡</a>、<a href="https://blogs.nvidia.com/blog/deepseek-r1-nim-microservice/" target="_blank" rel="noopener">NVIDIA NIM 公告</a>。</li>
      </ul></section>
      <section><h3>议题编码</h3><p>对 Hacker News 上标题含 DeepSeek 或 Qwen 的全部帖子，按标题主要内容归入「技术与发布、部署与动手、成本市场与公司、国家与安全、其他」五类。一条标题按主要落点只归一类。作者已对分层抽样的 100 条标题逐条复核。该材料反映 HN 社区，不代替新闻媒体内容分析。</p></section>
      <section><h3>限制措施逐条来源</h3><ol>${bans}</ol></section>
      <section><h3>开源工具与字体</h3><p>D3（ISC）、GSAP（标准免费授权）、Lenis（MIT）、Phosphor Icons（MIT）；思源黑体、IBM Plex Mono（SIL OFL）。</p></section>`;
  }

  function build() {
    const hf = D.ratios.find(r => r.metric.startsWith("HuggingFace"));
    document.querySelectorAll("[data-hf-total]").forEach(el => {
      el.textContent = (hf.Qwen / 1e8).toFixed(2);
      if (el.hasAttribute("data-end")) el.dataset.end = el.textContent;
    });
    document.querySelectorAll("[data-hf-ratio]").forEach(el => {
      el.textContent = hf.ratio.toFixed(1);
      if (el.hasAttribute("data-pull")) el.dataset.pull = hf.ratio;
    });
    document.querySelectorAll("[data-hf-date]").forEach(el => el.textContent = D.meta.snapshot_hf);
    fillTickers();
    fillExamples();
    fillMethod();
    Object.values(FIGS).forEach(f => f.draw());
    bind();
    // 按页面实际顺序编号，新增图表后不留下旧编号。
    document.querySelectorAll(".figcard .fig-no > span").forEach((el, i) => { el.textContent = String(i + 1).padStart(2, "0"); });
    // 章节页的大虚线圈（装饰）
    document.querySelectorAll(".chapter .slab").forEach(s => {
      const ring = document.createElement("div"); ring.className = "ch-ring"; ring.setAttribute("aria-hidden", "true"); s.prepend(ring);
    });
    document.querySelectorAll(".pull .pc").forEach(pc => {
      const c = document.createElement("i"); c.className = "pc-cursor"; c.setAttribute("aria-hidden", "true"); pc.prepend(c);
    });
    // 收尾句逐字拆开，供逐字动画用
    document.querySelectorAll(".end-bar .ebb, .end-bar .acc").forEach(el => (el.innerHTML = [...el.textContent].map(ch => ch === "它"
      ? '<span class="c is-it"><span class="it-letter">它</span></span>' : `<span class="c">${ch}</span>`).join("")));
    if (REDUCED) return;

    // 平滑滚动
    if (!/nosmooth/.test(Q) && window.Lenis) {
      const lenis = new Lenis({ lerp: 0.08, smoothWheel: true });
      lenis.on("scroll", ScrollTrigger.update);
      gsap.ticker.add(t => lenis.raf(t * 1000));
      gsap.ticker.lagSmoothing(0);
    }
    const passing = (trigger, start = "top 85%", end = "top 40%") => ({ trigger, start, end, scrub: .5, invalidateOnRefresh: true });

    /* ---------- 封面：打开时播一次；滚出时视差 ---------- */
    const intro = gsap.timeline({ onComplete: () => alive(".cover", ambient.cover) });
    intro.from(".cover h1 span", { yPercent: 60, opacity: 0, stagger: .12, duration: .8, ease: "power4.out" })
      .from(".c-meta, .cover .subt", { opacity: 0, duration: .6 }, "-=.4")
      .fromTo(".blk.talk", { clipPath: "inset(0 100% 0 0)" }, { clipPath: "inset(0 0% 0 0)", duration: .9, ease: "power4.inOut" }, "-=.3")
      .fromTo(".blk.use", { clipPath: "inset(0 0 0 100%)" }, { clipPath: "inset(0 0 0 0%)", duration: .9, ease: "power4.inOut" }, "<.15")
      .from(".cover .shape, .c-square", { scale: 0, duration: .9, stagger: .1, ease: "back.out(1.6)" }, "-=.4");
    document.querySelectorAll("[data-count]").forEach(el => {
      const o = { v: 0 }; intro.to(o, { v: +el.dataset.count, duration: 2.4, ease: "power2.out", onUpdate: () => (el.textContent = fmt(Math.round(o.v))) }, 1);
    });
    gsap.timeline({ scrollTrigger: { trigger: ".cover", start: "top top", end: "bottom top", scrub: true } })
      .to(".cover .shape.sun", { yPercent: -45, ease: "none" }, 0)
      .to(".cover .shape.ring", { yPercent: 40, ease: "none" }, 0)
      .to(".cover h1", { yPercent: -20, ease: "none" }, 0);

    /* ---------- 跑马灯：一直在走；滚得越快走得越快，往回滚就倒着走 ---------- */
    document.querySelectorAll(".ticker").forEach(tk => {
      const dir = +tk.dataset.dir, track = tk.querySelector(".track");
      const loop = gsap.fromTo(track, { xPercent: dir < 0 ? 0 : -50 }, { xPercent: dir < 0 ? -50 : 0, ease: "none", repeat: -1, paused: true,
        duration: track.scrollWidth / 2 / 70 });
      loop.totalTime(loop.duration() * 200);
      ScrollTrigger.create({ trigger: tk.parentElement, start: "top bottom", end: "bottom top",
        onToggle: s => (s.isActive ? loop.play() : loop.pause()),
        onUpdate: s => {
          const v = Math.min(Math.abs(s.getVelocity()) / 220, 9);
          gsap.to(loop, { timeScale: s.direction * (1 + v), duration: .2, overwrite: true,
            onComplete: () => gsap.to(loop, { timeScale: 1, duration: 1, ease: "power2.out" }) });
        } });
    });

    /* ---------- 引入：背景大字反向平移；三句话经过时依次点亮 ---------- */
    gsap.timeline({ scrollTrigger: { trigger: "#lead", start: "top bottom", end: "top 10%", scrub: true } })
      .fromTo(".wm-talk", { xPercent: -45, opacity: 0 }, { xPercent: 0, opacity: 1, ease: "power2.out" }, 0)
      .fromTo(".wm-use", { xPercent: 45, opacity: 0 }, { xPercent: 0, opacity: 1, ease: "power2.out" }, 0);
    gsap.timeline({ scrollTrigger: { trigger: "#lead", start: "top 10%", end: "bottom top", scrub: true } })
      .to(".wm-talk", { xPercent: -2, ease: "none" }, 0)
      .to(".wm-use", { xPercent: 2, ease: "none" }, 0);
    gsap.utils.toArray("#lead .ln").forEach(l =>
      gsap.fromTo(l, { opacity: .1, y: 90 }, { opacity: 1, y: 0, ease: "none", scrollTrigger: passing(l, "top bottom", "center 50%") }));
    gsap.fromTo("#lead .hl", { "--hl": 0 }, { "--hl": 1, ease: "none", scrollTrigger: passing("#lead .punch", "top 92%", "center 66%") });

    /* ---------- 背景：数据卡片从左滑入、数字随滚动计数；正文卡片上升 ---------- */
    const st = gsap.timeline({ scrollTrigger: passing("#story", "top bottom", "center 60%") });
    st.from(".stat", { xPercent: -80, opacity: 0, stagger: .25, ease: "none" }, 0)
      .from(".story-card", { y: 180, opacity: 0, ease: "none" }, .2);
    document.querySelectorAll("[data-scrub-count]").forEach((el, i) => {
      const end = +el.dataset.scrubCount, o = { v: 0 };
      st.to(o, { v: end, ease: "none", duration: 1, onUpdate: () => (el.textContent = fmt(Math.round(o.v))) }, i * .25);
    });

    /* ---------- 图表：卡片升入屏幕的过程中分步长出（不固定画面） ---------- */
    Object.keys(FIGS).forEach(id => {
      const tl = gsap.timeline({ scrollTrigger: passing(`#${id} .fig-body`, "top bottom", "center 62%") });
      FIGS[id].steps(tl);
      // 图表画完之后的持续动效：停在这张图上它也一直在动；离开就停下、归位
      if (FIGS[id].ambient) {
        const amb = FIGS[id].ambient();
        ScrollTrigger.create({ trigger: `#${id} .fig-body`, start: "top bottom", end: "bottom top",
          onToggle: s => (s.isActive ? amb.play() : (amb.pause(), amb.seek(amb.duration(), true))) });
      }
    });

    /* ---------- 幕内文字卡片上升；剪报从右侧滑入；抽出数字随滚动计数 ---------- */
    gsap.utils.toArray(".txt .note").forEach(n => gsap.from(n, { x: -180, opacity: 0, ease: "none", scrollTrigger: passing(n, "top bottom", "center 60%") }));
    gsap.utils.toArray("[data-examples]").forEach(h => gsap.from(h.children, { x: 200, opacity: 0, stagger: .1, ease: "none", scrollTrigger: passing(h, "top bottom", "center 60%") }));
    document.querySelectorAll("[data-pull]").forEach(el => {
      const end = +el.dataset.pull, from = +(el.dataset.from || 0), dec = el.dataset.dec !== undefined ? +el.dataset.dec : 1, o = { v: from };
      const pn = el.closest(".pn");
      gsap.timeline({ scrollTrigger: passing(pn, "top bottom", "center 38%") })
        .to(o, { v: end, ease: "none", onUpdate: () => (el.textContent = o.v.toFixed(dec)) })
        .from(pn, { scale: .55, transformOrigin: "left bottom", ease: "none" }, 0)
        .from(el.closest(".pull").querySelector(".pc"), { y: 40, opacity: 0, ease: "none" }, .4);
    });

    /* ---------- 收束：两句话先完整进入视野，计数器随后补充 ---------- */
    gsap.timeline({ scrollTrigger: passing("#finale", "top bottom", "top 16%") })
      .from("#finale .fin-context", { y: 50, opacity: 0, duration: .4, ease: "none" }, 0)
      .from("#finale .ebb .c:not(.is-it)", { x: -90, yPercent: 70, opacity: 0, stagger: .025, duration: .6, ease: "none" }, .05)
      .from("#finale .acc .c:not(.is-it)", { x: 90, yPercent: 90, opacity: 0, stagger: .025, duration: .6, ease: "none" }, .15)
      .from("#finale .ebb .is-it", { scale: .35, rotation: -18, opacity: 0, duration: .7, ease: "none" }, .1)
      .from("#finale .acc .is-it", { scale: .35, rotation: 18, opacity: 0, duration: .7, ease: "none" }, .15)
      .from("#finale .fin-bottom", { y: 50, opacity: 0, duration: .55, ease: "none" }, .35);

    /* 技术交汇：两个输入汇合，保持原有滚动惯性。 */
    gsap.timeline({ scrollTrigger: passing("#lineage .lineage-flow", "top bottom", "center 60%") })
      .from("#lineage .lineage-parent.use", { x: -100, opacity: .1, duration: 1, ease: "none" }, 0)
      .from("#lineage .lineage-parent.talk", { x: 100, opacity: .1, duration: 1, ease: "none" }, 0)
      .from("#lineage .lineage-join", { scale: .3, opacity: 0, duration: .7, ease: "none" }, .1)
      .from("#lineage .lineage-result", { y: 65, opacity: .1, duration: .9, ease: "none" }, .15);

    /* ---------- 问题陈述：黄色标记划过；数据来源标签依次弹出 ---------- */
    gsap.fromTo("#sources .hl", { "--hl": 0 }, { "--hl": 1, ease: "none", scrollTrigger: passing("#sources .statement", "top 92%", "center 64%") });
    gsap.from("#sources .chip, #sources .src-lab", { y: 80, opacity: 0, stagger: .12, ease: "none", scrollTrigger: passing("#sources .src-row", "top bottom", "center 64%") });

    /* ---------- 三个问题：色卡依次升起 ---------- */
    gsap.from(".q", { yPercent: 90, opacity: 0, stagger: .08, ease: "none", scrollTrigger: passing("#qs", "top bottom", "center 74%") });

    /* 结语独立排版：标题、两个现场、结论依次进入视野。 */
    gsap.timeline({ scrollTrigger: passing("#ending", "top bottom", "top 16%") })
      .from("#ending .ending-head", { x: -200, opacity: 0, duration: .85, ease: "none" }, 0)
      .from("#ending .ending-art", { y: 100, scale: .55, opacity: 0, duration: .75, ease: "none" }, .05)
      .from("#ending .ending-scene", { x: 180, opacity: 0, stagger: .1, duration: .75, ease: "none" }, .05)
      .from("#ending .ending-verdict", { y: 110, opacity: 0, duration: .75, ease: "none" }, .1);

    /* ---------- 章节页：满幅色块从下往上推满，背景大数字同步计数 ---------- */
    document.querySelectorAll(".chapter").forEach(ch => {
      const big = ch.querySelector(".bignum .bn"), o = { v: 0 };  // 只计数数字本身，单位小字留在后面不动
      const end = +(big.dataset.end || big.textContent.replace(/,/g, "")), dec = +(big.dataset.dec || 0);
      gsap.timeline({ scrollTrigger: passing(ch, "top bottom", "top 3%") })
        .fromTo(ch.querySelector(".slab"), { clipPath: "inset(100% 0 0 0)" }, { clipPath: "inset(0% 0 0 0)", ease: "none", duration: 1 })
        .from(ch.querySelectorAll(".act, h2, .one, .bigcap"), { y: 120, opacity: 0, stagger: .1, duration: .4, ease: "none" }, .5)
        .to(o, { v: end, ease: "none", duration: 1.35, onUpdate: () => (big.textContent = dec ? o.v.toFixed(dec) : fmt(Math.round(o.v))) }, 0);
    });

    /* ---------- 持续动效：停下来画面也在动；区块离开屏幕就暂停 ---------- */
    const ambient = window.__amb = { cover: [] };
    const alive = (trigger, anims) => ScrollTrigger.create({ trigger, start: "top bottom", end: "bottom top",
      onToggle: s => anims.forEach(a => (s.isActive ? a.play() : a.pause())) });
    const loopTo = (t, v, d, o = {}) => gsap.to(t, Object.assign({}, v, { duration: d, repeat: -1, ease: "none", paused: true }, o));
    // 封面：太阳缓慢呼吸，虚线圈慢转，黑方块偶尔翻一下
    ambient.cover.push(
      loopTo(".shape.sun", { scale: 1.08 }, 3.2, { yoyo: true, ease: "sine.inOut" }),
      loopTo(".shape.ring", { rotation: 360 }, 48),
      gsap.timeline({ repeat: -1, repeatDelay: 3.5, paused: true }).to(".c-square", { rotation: "+=90", duration: .7, ease: "back.inOut(2)" }));
    // 引入：两个背景大字上下漂浮，方向相反
    alive("#lead", [
      loopTo(".wm-talk", { y: -18 }, 3.6, { yoyo: true, ease: "sine.inOut" }),
      loopTo(".wm-use", { y: 18 }, 4.4, { yoyo: true, ease: "sine.inOut" })]);
    // 章节页：大虚线圈慢转
    document.querySelectorAll(".chapter").forEach((ch, i) => alive(ch, [loopTo(ch.querySelector(".ch-ring"), { rotation: i % 2 ? -360 : 360 }, 70)]));
    // 红圆缓慢聚焦，蓝色模块轮流呼吸；保持文字静止便于阅读。
    alive("#ending", [loopTo("#ending .ending-orbit", { rotation: 16 }, 6, { yoyo: true, ease: "sine.inOut" }),
      loopTo("#ending .ending-tile", { rotation: 0 }, 4, { yoyo: true, ease: "sine.inOut" })]);
    alive("#finale", [loopTo("#finale .ebb .it-letter", { y: -5, rotation: -2 }, 2.6, { yoyo: true, ease: "sine.inOut" }),
      loopTo("#finale .acc .it-letter", { y: 5, rotation: 2 }, 3.2, { yoyo: true, ease: "sine.inOut" })]);
    // 大数字页：数字下方黑线上的黄色游标来回走
    document.querySelectorAll(".pull").forEach(p => {
      const pc = p.querySelector(".pc"), c = pc.querySelector(".pc-cursor");
      alive(p, [gsap.to(c, { x: () => pc.clientWidth - c.offsetWidth, duration: 2.6, ease: "sine.inOut", yoyo: true, repeat: -1, paused: true })]);
    });
    // 五类数据：标签里的图标轮流跳一下
    alive("#sources", [gsap.timeline({ repeat: -1, repeatDelay: 1.6, paused: true })
      .to("#sources .chip [data-icon]", { y: -8, duration: .2, ease: "power2.out", stagger: { each: .16, yoyo: true, repeat: 1 } })]);
    // 顶部进度条：跟着滚动长，颜色随所在的幕切换
    gsap.to(".progress i", { scaleX: 1, ease: "none", scrollTrigger: { start: 0, end: "max", scrub: true } });
    const bar = document.querySelector(".progress i"), barCol = ["var(--talk)", "var(--use)", "var(--ink)"];
    ["#ch1", "#ch2", "#ch3"].forEach((sel, i) => ScrollTrigger.create({ trigger: sel, start: "top 50%",
      onEnter: () => (bar.style.background = barCol[i]), onLeaveBack: () => (bar.style.background = barCol[Math.max(i - 1, 0)]) }));

    ScrollTrigger.refresh();
  }

  document.fonts.ready.then(build);
})();
