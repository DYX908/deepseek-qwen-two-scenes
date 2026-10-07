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
  const ctr = document.getElementById("ctr"), mUse = document.getElementById("m-use"), mTalk = document.getElementById("m-talk");
  const perDay = D.ratios.find(r => r.metric.startsWith("HuggingFace")).Qwen / 30, lastQ = D.media.quarterly[D.media.quarterly.length - 1];
  const talkPerDay = lastQ.DeepSeek / 91, perSec = perDay / 86400, talkPerSec = talkPerDay / 86400, t0 = performance.now();
  document.querySelectorAll("[data-rate]").forEach(el => (el.textContent = el.dataset.rate === "use"
    ? `按最近 30 天的日均下载量（约 ${fmt(Math.round(perDay / 1e4))} 万次）推算`
    : `按 ${lastQ.quarter.slice(0, 4)} 年二季度的日均报道量（约 ${Math.round(talkPerDay)} 篇）推算`));
  (function tick() {
    const s = (performance.now() - t0) / 1000;
    if (ctr) ctr.textContent = fmt(Math.floor(s * perSec));
    if (mUse) mUse.textContent = fmt(Math.floor(s * perSec));
    if (mTalk) mTalk.textContent = (s * talkPerSec).toFixed(3);
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

  // 文字卡片旁的剪报：两边得分最高的真实帖子
  function fillExamples() {
    const host = document.querySelector("[data-examples]"); if (!host) return;
    const esc = s => s.replace(/[&<>]/g, "");
    const block = (kw, cls, label) => `<div class="clip-h ${cls === "use" ? "c-use" : "c-talk"}">${label}</div>` +
      D.hn_examples[kw].slice(0, 2).map(x => `<div class="clip ${cls}">${esc(x.title)}<small>Hacker News · ${x.month} · ${fmt(x.points)} 分</small></div>`).join("");
    host.innerHTML = block("DeepSeek", "talk", "谈 DeepSeek 的帖子") + block("Qwen", "use", "谈 Qwen 的帖子");
  }

  // 数据与方法：从数据生成，逐条列出限制措施的来源链接
  function fillMethod() {
    const host = document.querySelector("[data-method]"); if (!host) return;
    const G = D.bans.grades, dv = D.derivatives;
    const bans = D.bans.items.map(b => `<li>${b.date} ${b.place} · ${b.issuer}：${b.document}（${G[b.grade]}）<br><a href="${b.url}" target="_blank" rel="noopener">${b.url}</a></li>`).join("");
    host.innerHTML = `
      <section><h3>五类数据来源</h3><ol>
        <li>HuggingFace Hub API：28 家主要开源模型发布机构的全部公开模型 6,952 个；${dv.bases.CN + dv.bases.US_EU} 个热门底座上的 ${fmt(dv.total_relations)} 条衍生关系。采集于 ${D.meta.snapshot_hf}。</li>
        <li>GitHub REST API：deepseek-ai 与 QwenLM 两个组织全部自有仓库的收藏数。采集于 ${D.meta.snapshot_github}。</li>
        <li>Hacker News（Algolia API）：关键词精确匹配的月度帖子数（采集于 ${D.meta.snapshot_hn}）；标题含 DeepSeek / Qwen 的帖子 ${fmt(D.hn_topics.by_keyword.DeepSeek.n + D.hn_topics.by_keyword.Qwen.n)} 条（采集于 2026-10-07）。</li>
        <li>慧科新闻搜索研究库（完整检索库）：中国大陆报刊，标题与正文检索，按季度统计报道篇数。采集于 ${D.meta.snapshot_wisers}。</li>
        <li>各国政府公告：${D.bans.total} 项限制措施，逐条核查官方原文，来源见下。核查于 2026-10-07。</li></ol></section>
      <section><h3>口径与局限</h3><ul>
        <li>HuggingFace 只提供最近 30 天下载量，没有历史数据，所以下载量只做横截面比较，时间趋势用衍生模型的创建时间。</li>
        <li>衍生关系依赖作者自填的底座字段，没填的统计不到，中美底座同受影响。</li>
        <li>底座按 2026 年 9 月的下载量（≥ 50 万）选取，越早的季度覆盖越不足，因此时间序列只用 2025Q1—2026Q2 六个完整季度。</li>
        <li>国别按发布机构计：英伟达发布的 Qwen 量化版计入美欧，中国占比是保守估计。</li>
        <li>报道量检索式可能漏掉「千问」「深度求索」等写法；若 Qwen 漏检更多，DeepSeek 与 Qwen 的报道倍数偏高。</li>
        <li>论坛帖子按关键词计数，提到某个模型不等于以它为主题。</li>
        <li>四项指标的口径与时间窗口各不相同，倍数只比较方向和量级。</li></ul></section>
      <section><h3>两次差点让结论反过来的纠错</h3><ul>
        <li>慧科有近期库和完整库两个入口：2025Q1 检索 DeepSeek，近期库只返回 1 条，完整库返回 17,856 条。本作品全部使用完整库。</li>
        <li>衍生模型最初按「每家机构取下载量前 4 的模型」做底座，因各家模型总数悬殊（Qwen 465 个、Meta 70 个），算出中国占比 27.3%；改为统一下载量门槛后为 51.3%。本作品使用统一门槛。</li></ul></section>
      <section><h3>议题编码</h3><p>对 Hacker News 上标题含 DeepSeek 或 Qwen 的全部帖子，由大模型逐条读标题，归入「技术与发布、部署与动手、成本市场与公司、国家与安全、其他」五类；作者对分层随机抽取的 100 条做了人工复核。一条标题按主要落点只归一类。</p></section>
      <section><h3>限制措施逐条来源</h3><ol>${bans}</ol></section>
      <section><h3>开源工具与字体</h3><p>D3（ISC）、GSAP（标准免费授权）、Lenis（MIT）、Phosphor Icons（MIT）；思源黑体、IBM Plex Mono（SIL OFL）。</p></section>`;
  }

  function build() {
    fillTickers();
    fillExamples();
    fillMethod();
    Object.values(FIGS).forEach(f => f.draw());
    bind();
    // 章节页的大虚线圈（装饰）
    document.querySelectorAll(".chapter .slab").forEach(s => {
      const ring = document.createElement("div"); ring.className = "ch-ring"; ring.setAttribute("aria-hidden", "true"); s.prepend(ring);
    });
    document.querySelectorAll(".pull .pc").forEach(pc => {
      const c = document.createElement("i"); c.className = "pc-cursor"; c.setAttribute("aria-hidden", "true"); pc.prepend(c);
    });
    if (REDUCED) return;

    // 平滑滚动
    if (!/nosmooth/.test(Q) && window.Lenis) {
      const lenis = new Lenis({ lerp: 0.16, smoothWheel: true });
      lenis.on("scroll", ScrollTrigger.update);
      gsap.ticker.add(t => lenis.raf(t * 1000));
      gsap.ticker.lagSmoothing(0);
    }
    const SMOOTH = !/nosmooth/.test(Q) && !!window.Lenis;
    const passing = (trigger, start = "top 85%", end = "top 40%") => ({ trigger, start, end, scrub: SMOOTH ? true : .3, invalidateOnRefresh: true });

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

    /* ---------- 结语：两块色块从两侧推入，正文上升，黄色标记划过 ---------- */
    // 收束一屏：红蓝两块从两侧推入 → 文字升起 → 黑条从下推上 → 结论句 → 黄色标记；顶边贴到屏幕顶时全部完成
    gsap.timeline({ scrollTrigger: passing("#finale", "top bottom", "top 2%") })
      .fromTo("#finale .eb.talk", { clipPath: "inset(0 100% 0 0)" }, { clipPath: "inset(0 0% 0 0)", ease: "none", duration: 1 }, 0)
      .fromTo("#finale .eb.use", { clipPath: "inset(0 0 0 100%)" }, { clipPath: "inset(0 0 0 0%)", ease: "none", duration: 1 }, 0)
      .from("#finale .eb > :not(.shape)", { y: 70, opacity: 0, stagger: .06, duration: .4, ease: "none" }, .35)
      .fromTo("#finale .end-bar", { clipPath: "inset(100% 0 0 0)" }, { clipPath: "inset(0% 0 0 0)", ease: "none", duration: .5 }, .5)
      .from("#finale .punch2", { y: 50, opacity: 0, duration: .4, ease: "none" }, .7)
      .fromTo("#finale .hl", { "--hl": 0, color: "#F1EFEA" }, { "--hl": 1, color: "#111", duration: .4, ease: "none" }, 1.05);

    /* ---------- 问题陈述：黄色标记划过；数据来源标签依次弹出 ---------- */
    gsap.fromTo("#sources .hl", { "--hl": 0 }, { "--hl": 1, ease: "none", scrollTrigger: passing("#sources .statement", "top 92%", "center 64%") });
    gsap.from("#sources .chip, #sources .src-lab", { y: 80, opacity: 0, stagger: .12, ease: "none", scrollTrigger: passing("#sources .src-row", "top bottom", "center 64%") });

    /* ---------- 三个问题：色卡依次升起 ---------- */
    gsap.from(".q", { yPercent: 90, opacity: 0, stagger: .15, ease: "none", scrollTrigger: passing("#qs", "top bottom", "center 66%") });

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
    // 结尾：太阳呼吸、圆环转（与封面呼应）
    alive("#finale", [
      loopTo("#finale .shape.sun", { scale: 1.08 }, 3.2, { yoyo: true, ease: "sine.inOut" }),
      loopTo("#finale .shape.ring", { rotation: -360 }, 48)]);
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
