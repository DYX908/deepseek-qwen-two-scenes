/* 图表（风格 C）。数字全部取自 data/data.js（raw/build_data.py 生成）。
   每张图提供 draw()：画出最终状态；steps(tl)：往时间轴里加「随滚动分步出现」的动画。 */
(function () {
  const D = window.DATA;
  const fmt = d3.format(",");
  const pct = v => v.toFixed(1) + "%";
  const C = { talk: "#E5402A", use: "#1F48C8", yel: "#F4C21B", ink: "#111", grey: "#DEDBD4", muted: "#6B6B6B", paper: "#F1EFEA" };
  window.PAL = C;
  window.TEXT = {};
  window.FIGS = {};
  TEXT.hf = { nvidia: `NVIDIA 用自己的账号发布了 Qwen 的量化版本 ${D.nvidia_qwen.model_id.split("/")[1]}，最近 30 天下载约 ${Math.round(D.nvidia_qwen.downloads_30d / 1e4)} 万次。这些下载按发布机构归属，计入美国。` };

  /* ---------------- 图 01（内部编号 fig12）：总体份额 ---------------- */
  (function () {
    const s = D.download_share.since_2024, all = D.download_share.all;
    const cn = s.CN, us = s.US_EU, total = cn.models + us.models;
    const ratio = (cn.download_pct / cn.model_pct).toFixed(1);
    TEXT.fig12 = {
      title: `2024 年以后的开源模型，中国机构发布的占 ${pct(cn.model_pct)}，下载量占 ${pct(cn.download_pct)}`,
      sub: `统计范围：中美欧 28 家主要开源模型发布机构在 2024 年以后发布的 ${fmt(total)} 个模型。上面一条按模型个数算，下面一条按最近 30 天的下载量算。`,
      note: `数据：HuggingFace Hub API，采集于 ${D.meta.snapshot_hf}。中国机构 16 家（通义千问 Qwen、DeepSeek、智谱、腾讯、字节跳动 Seed、月之暗面、MiniMax 等），美欧机构 12 家（Google、Meta、OpenAI、微软、英伟达、Mistral 等）；国别按发布机构计，英伟达发布的 Qwen 量化版计入美欧。含 2024 年以前旧模型的全量口径下，中国占模型数 ${pct(all.CN.model_pct)}、下载量 ${pct(all.CN.download_pct)}。`
    };
    const el = {};
    FIGS.fig12 = {
      draw() {
        const host = d3.select("#fig12 .fig-body"); host.selectAll("*").remove();
        const narrow = host.node().clientWidth < 640;
        const L = narrow ? { W: 640, H: 360, x0: 0, bh: 70, yT: 70, yB: 230, fN: 46, fL: 24 }
                         : { W: 1200, H: 330, x0: 180, bh: 84, yT: 44, yB: 214, fN: 60, fL: 22 };
        const { W, H, x0, bh, yT, yB } = L, x1 = W, bw = x1 - x0, x = v => x0 + bw * v / 100;
        const svg = host.append("svg").attr("viewBox", `0 0 ${W} ${H}`).attr("role", "img")
          .attr("aria-label", `模型个数：中国 ${pct(cn.model_pct)}；下载量：中国 ${pct(cn.download_pct)}`);
        const defs = svg.append("defs");

        // 连接带（明黄），用裁切矩形让它自上而下「流」下来
        defs.append("clipPath").attr("id", "f12-band").append("rect").attr("x", x0).attr("y", yT + bh).attr("width", bw).attr("height", yB - yT - bh);
        el.bandClip = svg.select("#f12-band rect").node();
        el.band = svg.append("path").attr("clip-path", "url(#f12-band)").attr("fill", C.yel)
          .attr("d", `M${x0},${yT + bh}L${x(cn.model_pct)},${yT + bh}L${x(cn.download_pct)},${yB}L${x0},${yB}Z`).node();
        const fp = defs.append("pattern").attr("id", "f12-flow").attr("patternUnits", "userSpaceOnUse").attr("width", 40).attr("height", 22).attr("patternTransform", "rotate(-14)");
        fp.append("rect").attr("width", 40).attr("height", 7).attr("fill", "#fff").attr("opacity", .38);
        el.flowPat = fp.node();
        svg.append("path").attr("clip-path", "url(#f12-band)").attr("fill", "url(#f12-flow)").attr("d", el.band.getAttribute("d"));

        el.rows = [];
        [{ y: yT, label: "模型个数", sub: `${fmt(total)} 个模型`, cn: cn.model_pct, us: us.model_pct },
         { y: yB, label: "下载量", sub: "最近 30 天", cn: cn.download_pct, us: us.download_pct }].forEach((r, i) => {
          const id = `f12-row${i}`;
          defs.append("clipPath").attr("id", id).append("rect").attr("x", x0).attr("y", r.y).attr("width", bw).attr("height", bh);
          svg.append("rect").attr("x", x0).attr("y", r.y).attr("width", bw).attr("height", bh)
            .attr("fill", "none").attr("stroke", C.ink).attr("stroke-opacity", .22).attr("stroke-dasharray", "4 5");  // 预画最终形状
          const g = svg.append("g");
          const bars = g.append("g").attr("clip-path", `url(#${id})`);
          bars.append("rect").attr("x", x0).attr("y", r.y).attr("width", x(r.cn) - x0).attr("height", bh).attr("fill", C.use);
          bars.append("rect").attr("x", x(r.cn)).attr("y", r.y).attr("width", x1 - x(r.cn)).attr("height", bh).attr("fill", C.grey);
          const tCn = g.append("text").attr("x", x0 + 20).attr("y", r.y + bh / 2 + L.fN * .35).attr("fill", "#fff").attr("font-size", L.fN).attr("font-weight", 900).attr("letter-spacing", "-.04em").text(pct(r.cn));
          const tUs = g.append("text").attr("x", x1 - 20).attr("y", r.y + bh / 2 + L.fN * .35).attr("text-anchor", "end").attr("fill", C.ink).attr("font-size", L.fN).attr("font-weight", 900).attr("letter-spacing", "-.04em").text(pct(r.us));
          let lab;
          if (narrow) {
            lab = g.append("text").attr("x", x0).attr("y", i ? r.y + bh + 34 : r.y - 38).attr("font-size", L.fL).attr("font-weight", 900).attr("fill", C.ink);
            lab.append("tspan").text(r.label); lab.append("tspan").attr("dx", 12).attr("font-weight", 500).attr("font-size", 18).attr("fill", C.muted).text(r.sub);
          } else {
            lab = g.append("g");
            lab.append("text").attr("x", 0).attr("y", r.y + 36).attr("font-size", L.fL).attr("font-weight", 900).attr("fill", C.ink).text(r.label);
            lab.append("text").attr("x", 0).attr("y", r.y + 62).attr("font-size", 14).attr("font-weight", 500).attr("fill", C.muted).text(r.sub);
          }
          el.rows.push({ clip: svg.select(`#${id} rect`).node(), bw, texts: [tCn.node(), tUs.node()], label: lab.node() });
        });
        el.tags = [
          svg.append("text").attr("x", x0).attr("y", yT - (narrow ? 10 : 14)).attr("font-size", narrow ? 18 : 13).attr("font-weight", 900).attr("letter-spacing", ".15em").attr("fill", C.use).text("中国机构").node(),
          svg.append("text").attr("x", x1).attr("y", yT - (narrow ? 10 : 14)).attr("text-anchor", "end").attr("font-size", narrow ? 18 : 13).attr("font-weight", 900).attr("letter-spacing", ".15em").attr("fill", C.muted).text("美欧机构").node(),
        ];
        const my = (yT + bh + yB) / 2;
        const rg = svg.append("g").attr("transform", `translate(${x0 + 20},${my})`).append("g");  // 外层定位、内层做动画
        rg.append("text").attr("y", 12).attr("font-size", narrow ? 34 : 34).attr("font-weight", 900).attr("fill", C.ink).text(`× ${ratio}`);
        rg.append("text").attr("x", narrow ? 100 : 104).attr("y", 9).attr("font-size", narrow ? 18 : 15).attr("font-weight", 700).attr("fill", C.ink)
          .text("中国机构的下载份额 ÷ 模型数份额");
        el.ratio = rg.node();
      },
      // 随滚动分步：上条从左长出 → 下条从左长出 → 黄带自上而下流下 → 倍数出现
      steps(tl) {
        const [r0, r1] = el.rows;
        tl.from(el.tags, { opacity: 0, duration: .3 })
          .from(r0.clip, { attr: { width: 0 }, duration: 1, ease: "none" }, "<")
          .from([r0.label, ...r0.texts], { opacity: 0, duration: .3 }, "-=.35")
          .from(r1.clip, { attr: { width: 0 }, duration: 1, ease: "none" }, "+=.15")
          .from([r1.label, ...r1.texts], { opacity: 0, duration: .3 }, "-=.35")
          .from(el.bandClip, { attr: { height: 0 }, duration: .9, ease: "none" }, "+=.1")
          .from(el.ratio, { opacity: 0, x: -20, duration: .4 })
          .to({}, { duration: .4 }); // 停留一会儿再放开
      },
      // 持续动效：黄带里的流纹一直往下流——份额从「个数」流向「下载」
      ambient() { return gsap.timeline({ repeat: -1, paused: true }).to(el.flowPat, { attr: { y: 22 }, duration: 1.3, ease: "none" }); }
    };
  })();
})();

/* ======================= 第一幕 ======================= */
(function () {
  const D = window.DATA, C = window.PAL, fmt = d3.format(","), pct = v => v.toFixed(1) + "%";
  const svgIn = (id, W, H, label) => {
    const host = d3.select(`#${id} .fig-body`); host.selectAll("*").remove();
    return host.append("svg").attr("viewBox", `0 0 ${W} ${H}`).attr("role", "img").attr("aria-label", label);
  };

  /* ---------- 图 02：新闻篇数 → 方块单位图（10 : 1） ---------- */
  (function () {
    const m = D.gdelt, ds = m.sum.DeepSeek, qw = m.sum.Qwen, UNIT = 500;
    const nD = Math.floor(ds / UNIT), nQ = Math.floor(qw / UNIT), ratio = Math.round(ds / qw);
    TEXT.fig2 = {
      title: `六个季度里，海外网络新闻每写 ${ratio} 篇 DeepSeek，才写 1 篇 Qwen`,
      sub: `一个方块代表 ${UNIT} 篇海外网络新闻报道。DeepSeek 的报道堆成了一面墙，同为中国开源模型的 Qwen 只有一排。`,
      note: `数据：GDELT DOC 2.0 API（timelinevolraw），中国大陆以外来源的网络新闻；检索「DeepSeek」与「(Qwen OR "Tongyi Qianwen")」，均排除中国大陆来源。2025Q1—2026Q2 累计，采集于 ${D.meta.snapshot_gdelt}；精确报道量之比为 ${(ds / qw).toFixed(1)} 倍。不足 ${UNIT} 篇的部分不画方块。查询区间返回 ${m.days} / ${m.days_total} 个日度数据点，计数为返回记录之和。`

    };
    const el = {};
    FIGS.fig2 = {
      draw() {
        const W = 1200, H = 400, cell = 30, gap = 6, p = cell + gap, cols = 10, base = 360;
        const svg = svgIn("fig2", W, H, `DeepSeek ${fmt(ds)} 篇，Qwen ${fmt(qw)} 篇`);
        const grid = (n, x0, color) => d3.range(n).map(i => svg.append("rect")
          .attr("x", x0 + (i % cols) * p).attr("y", base - cell - Math.floor(i / cols) * p)
          .attr("width", cell).attr("height", cell).attr("fill", color).node());
        el.ds = grid(nD, 0, C.talk);
        el.qw = grid(nQ, 560, C.use);
        const head = (x, name, color, n, total) => {
          const g = svg.append("g");
          g.append("text").attr("x", x).attr("y", 34).attr("font-size", 22).attr("font-weight", 900).attr("fill", color).text(name);
          const t = g.append("text").attr("x", x).attr("y", 96).attr("font-size", 60).attr("font-weight", 900).attr("letter-spacing", "-.03em").attr("fill", C.ink);
          t.append("tspan").attr("class", "num").attr("data-end", total).text(fmt(total));
          t.append("tspan").attr("font-size", 24).attr("dx", 8).text("篇");
          return g.node();
        };
        el.hd = head(0, "DeepSeek", C.talk, nD, ds);
        el.hq = head(560, "Qwen", C.use, nQ, qw);
        const r = svg.append("g").attr("transform", "translate(900,0)").append("g");  // 外层定位、内层做动画
        r.append("text").attr("y", 200).attr("font-size", 128).attr("font-weight", 900).attr("letter-spacing", "-.05em").attr("fill", C.ink).text(`${ratio} : 1`);
        r.append("text").attr("y", 246).attr("font-size", 17).attr("font-weight", 700).attr("fill", C.ink).text("报道量之比（DeepSeek : Qwen）");
        r.append("rect").attr("y", 300).attr("width", cell).attr("height", cell).attr("fill", C.ink);
        r.append("text").attr("x", 44).attr("y", 322).attr("font-size", 15).attr("font-weight", 500).attr("fill", C.muted).text(`= ${UNIT} 篇报道`);
        el.ratio = r.node();
        const sc = svg.append("defs").append("clipPath").attr("id", "f2-ds");
        el.ds.forEach(n => sc.append("rect").attr("x", n.getAttribute("x")).attr("y", n.getAttribute("y")).attr("width", cell).attr("height", cell));
        el.glint = svg.append("g").attr("clip-path", "url(#f2-ds)").append("rect").attr("x", -160).attr("y", 0).attr("width", 70).attr("height", H)
          .attr("fill", "#fff").attr("opacity", .45).attr("transform", "skewX(-20)").node();
        svg.append("line").attr("x1", 0).attr("x2", 860).attr("y1", base + 8).attr("y2", base + 8).attr("stroke", C.ink).attr("stroke-width", 3);
      },
      steps(tl) {
        tl.from([el.hd, el.hq], { opacity: 0, duration: .3 }, 0)
          .from(el.qw, { opacity: 0, y: -40, stagger: .05, duration: .25, ease: "none" }, 0)
          .from(el.ds, { opacity: 0, y: -40, stagger: .016, duration: .25, ease: "none" }, .1)
          .from(el.ratio, { opacity: 0, x: 60, duration: .4, ease: "none" }, .8);
      },
      // 持续动效：聚光灯一遍遍扫过 DeepSeek 那面墙
      ambient() {
        return gsap.timeline({ repeat: -1, repeatDelay: .45, paused: true })
          .fromTo(el.glint, { attr: { x: -160 } }, { attr: { x: 760 }, duration: 1, ease: "power1.inOut", immediateRender: false });
      }
    };
  })();

  /* ---------- 图 03：两个版面（HN 帖子标题议题编码） ---------- */
  (function () {
    const T = D.hn_topics, ds = T.by_keyword.DeepSeek, qw = T.by_keyword.Qwen;
    const order = ["G", "M", "T", "H", "O"];
    const NAME = { G: "国家与安全", M: "成本、市场与公司", T: "技术与发布", H: "部署与动手", O: "其他" };
    const COL = { G: C.talk, M: C.yel, T: C.grey, H: C.use, O: "#ECE9E3" };  // 朱红 / 明黄 / 中性浅灰 / 钴蓝 / 更浅的灰，与其他图的中性色一致
    const mgD = ds.pct.M + ds.pct.G, mgQ = qw.pct.M + qw.pct.G;
    TEXT.fig3 = {
      title: `谈 DeepSeek 的帖子四成在谈市场和国家安全，谈 Qwen 的一半在讲怎么用`,
      sub: `把 Hacker News 上标题提到这两个模型的 ${fmt(ds.n + qw.n)} 条帖子逐条归类，各自拼成一个「版面」。红色是国家与安全，黄色是成本、市场与公司，蓝色是部署与动手，灰色是技术与发布。`,
      note: `数据：Hacker News（Algolia API），2025-01—2026-06 标题含关键词的帖子，DeepSeek ${fmt(ds.n)} 条、Qwen ${fmt(qw.n)} 条；采集于 2026-10-07。由大模型逐条读标题编码、人工分层抽样 100 条复核；一条标题按主要落点归一类。审查、隐私、禁令、出口管制、蒸馏指控、模型安全漏洞归「国家与安全」；股价、训练成本、定价、融资与公司新闻归「成本、市场与公司」；本地运行、量化、接入工具、教程、开发者自建项目归「部署与动手」。`
    };
    const el = {};
    FIGS.fig3 = {
      draw() {
        const W = 1200, H = 470, pw = 300, ph = 380, top = 70;
        const svg = svgIn("fig3", W, H, `DeepSeek 帖子中市场与国家安全占 ${pct(mgD)}，Qwen 占 ${pct(mgQ)}`);
        const defs = svg.append("defs");
        el.clips = [];
        [["DeepSeek", ds, 0, C.talk], ["Qwen", qw, 360, C.use]].forEach(([name, d, x0, color], k) => {
          svg.append("text").attr("x", x0).attr("y", 30).attr("font-size", 22).attr("font-weight", 900).attr("fill", color).text(name);
          svg.append("text").attr("x", x0).attr("y", 54).attr("font-size", 14).attr("font-weight", 500).attr("fill", C.muted).text(`${fmt(d.n)} 条帖子`);
          const cid = `f3c${k}`;
          defs.append("clipPath").attr("id", cid).append("rect").attr("x", x0).attr("y", top).attr("width", pw).attr("height", ph);
          el.clips.push(svg.select(`#${cid} rect`).node());
          const g = svg.append("g").attr("clip-path", `url(#${cid})`);
          let y = top;
          order.forEach(c => {
            const h = ph * d.pct[c] / 100;
            g.append("rect").attr("x", x0).attr("y", y).attr("width", pw).attr("height", h).attr("fill", COL[c]).attr("stroke", "#fff").attr("stroke-width", 3);
            if (h > 44) {
              const light = c === "G" || c === "H";
              g.append("text").attr("x", x0 + 14).attr("y", y + 28).attr("font-size", 16).attr("font-weight", 900).attr("fill", light ? "#fff" : C.ink).text(NAME[c]);
              g.append("text").attr("x", x0 + pw - 14).attr("y", y + 30).attr("text-anchor", "end").attr("font-size", 26).attr("font-weight", 900).attr("fill", light ? "#fff" : C.ink).text(pct(d.pct[c]));
            }
            y += h;
          });
        });
        // 右侧对照表
        const tx = 720, g = svg.append("g").attr("transform", `translate(${tx},${top})`);
        g.append("text").attr("x", 330).attr("y", 0).attr("text-anchor", "end").attr("font-size", 14).attr("font-weight", 900).attr("fill", C.talk).text("DeepSeek");
        g.append("text").attr("x", 460).attr("y", 0).attr("text-anchor", "end").attr("font-size", 14).attr("font-weight", 900).attr("fill", C.use).text("Qwen");
        el.rows = order.map((c, i) => {
          const r = g.append("g").attr("transform", `translate(0,${34 + i * 54})`).append("g");  // 外层定位、内层做动画
          r.append("rect").attr("y", -16).attr("width", 18).attr("height", 18).attr("fill", COL[c]);
          r.append("text").attr("x", 30).attr("y", 0).attr("font-size", 17).attr("font-weight", 700).attr("fill", C.ink).text(NAME[c]);
          r.append("text").attr("x", 330).attr("y", 0).attr("text-anchor", "end").attr("font-size", 22).attr("font-weight", 900).attr("fill", C.ink).text(pct(ds.pct[c]));
          r.append("text").attr("x", 460).attr("y", 0).attr("text-anchor", "end").attr("font-size", 22).attr("font-weight", 900).attr("fill", C.ink).text(pct(qw.pct[c]));
          r.append("line").attr("x1", 0).attr("x2", 460).attr("y1", 16).attr("y2", 16).attr("stroke", C.ink).attr("stroke-opacity", .15);
          return r.node();
        });
        const sum = g.append("g").attr("transform", `translate(0,${34 + 5 * 54 + 20})`);
        sum.append("line").attr("x1", 0).attr("x2", 460).attr("y1", -32).attr("y2", -32).attr("stroke", C.ink).attr("stroke-width", 3);
        sum.append("text").attr("x", 0).attr("y", 0).attr("font-size", 16).attr("font-weight", 900).attr("fill", C.ink).text("市场 + 国家与安全");
        sum.append("text").attr("x", 330).attr("y", 0).attr("text-anchor", "end").attr("font-size", 26).attr("font-weight", 900).attr("fill", C.talk).text(pct(mgD));
        sum.append("text").attr("x", 460).attr("y", 0).attr("text-anchor", "end").attr("font-size", 26).attr("font-weight", 900).attr("fill", C.use).text(pct(mgQ));
        el.sum = sum.node();
      },
      steps(tl) {
        tl.from(el.clips, { attr: { height: 0 }, duration: 1, ease: "none" })
          .from(el.rows, { opacity: 0, x: 20, stagger: .08, duration: .3, ease: "none" }, "-=.6")
          .from(el.sum, { opacity: 0, duration: .3 });
      }
    };
  })();

  /* ---------- 图 04：中缝镜像（报道量 vs 中国底座新衍生） ---------- */
  (function () {
    const Qs = D.meta.quarters, med = D.gdelt.quarterly, der = D.derivatives.quarterly;
    const r0 = der[0].CN, r1 = der[der.length - 1].CN, grow = (r1 / r0).toFixed(1);
    TEXT.fig1 = {
      title: `六个季度里，DeepSeek 报道量跌了近九成，基于中国模型的衍生模型涨到 ${grow} 倍`,
      sub: "中缝以上是媒体：每季度写到 DeepSeek 的海外网络新闻报道。中缝以下是开发者：每季度在中国模型基础上微调、量化后重新发布的新模型，即「衍生模型」。上下刻度不同，比较的是走势。",
      note: `报道量：GDELT，中国大陆以外来源，统计同图 02。衍生模型：HuggingFace Hub API，30 日下载量 ≥ 50 万的 260 个底座（中国 133 / 美欧 127）上新建的模型，按创建时间计季度；同期美欧底座的新衍生由 ${fmt(der[0].US_EU)} 增至 ${fmt(der[der.length - 1].US_EU)}（${(der[der.length - 1].US_EU / der[0].US_EU).toFixed(1)} 倍）。2024 年各季度因底座按 2026 年 9 月热度选取、早期覆盖不足，未纳入。`
    };
    const el = {};
    FIGS.fig1 = {
      draw() {
        const W = 1200, H = 470, x0 = 240, x1 = W, mid = 235, hmax = 180;
        const svg = svgIn("fig1", W, H, "DeepSeek 海外报道回落，中国底座新衍生模型总体增长");
        const x = d3.scaleBand().domain(Qs).range([x0, x1]).padding(.28);
        const yu = d3.scaleLinear().domain([0, d3.max(med, d => d.DeepSeek)]).range([0, hmax]);
        const yd = d3.scaleLinear().domain([0, d3.max(der, d => d.CN)]).range([0, hmax]);
        svg.append("defs").append("clipPath").attr("id", "f1c").append("rect").attr("x", x0 - 10).attr("y", 0).attr("width", x1 - x0 + 20).attr("height", H);
        el.clip = svg.select("#f1c rect").node();
        const g = svg.append("g").attr("clip-path", "url(#f1c)");
        med.forEach((d, i) => {
          const xx = x(d.quarter), bw = x.bandwidth();
          g.append("rect").attr("x", xx).attr("y", mid - 6 - yu(d.DeepSeek)).attr("width", bw).attr("height", yu(d.DeepSeek)).attr("fill", C.talk);
          g.append("rect").attr("x", xx).attr("y", mid + 6).attr("width", bw).attr("height", yd(der[i].CN)).attr("fill", C.use);
          g.append("text").attr("x", xx + bw / 2).attr("y", mid - 14 - yu(d.DeepSeek)).attr("text-anchor", "middle").attr("font-size", 17).attr("font-weight", 900).attr("fill", C.talk).text(fmt(d.DeepSeek));
          g.append("text").attr("x", xx + bw / 2).attr("y", mid + 30 + yd(der[i].CN)).attr("text-anchor", "middle").attr("font-size", 17).attr("font-weight", 900).attr("fill", C.use).text(fmt(der[i].CN));
        });
        // 中缝与季度
        svg.append("rect").attr("x", x0 - 10).attr("y", mid - 6).attr("width", x1 - x0 + 10).attr("height", 12).attr("fill", C.ink);
        svg.select("defs").append("clipPath").attr("id", "f1h").append("rect").attr("x", x0 - 10).attr("y", mid - 6).attr("width", x1 - x0 + 10).attr("height", 12);
        el.head = svg.append("g").attr("clip-path", "url(#f1h)").append("rect").attr("x", x0 - 70).attr("y", mid - 6).attr("width", 60).attr("height", 12).attr("fill", C.yel).node();
        el.headX = [x0 - 70, x1];
        Qs.forEach(q => svg.append("text").attr("x", x(q) + x.bandwidth() / 2).attr("y", mid + 4).attr("text-anchor", "middle").attr("font-size", 11).attr("font-weight", 900).attr("fill", "#fff").attr("letter-spacing", ".08em").text(q));
        // 左侧说明
        const L = svg.append("g");
        L.append("text").attr("x", 0).attr("y", 70).attr("font-size", 20).attr("font-weight", 900).attr("fill", C.talk).text("被讨论的");
        L.append("text").attr("x", 0).attr("y", 98).attr("font-size", 15).attr("font-weight", 500).attr("fill", C.ink).text("DeepSeek 海外报道");
        L.append("text").attr("x", 0).attr("y", 132).attr("font-size", 34).attr("font-weight", 900).attr("fill", C.ink).text(`↓ ${D.gdelt.deepseek_drop_pct}%`);
        L.append("text").attr("x", 0).attr("y", 350).attr("font-size", 20).attr("font-weight", 900).attr("fill", C.use).text("被使用的");
        L.append("text").attr("x", 0).attr("y", 378).attr("font-size", 15).attr("font-weight", 500).attr("fill", C.ink).text("基于中国模型的衍生模型");
        L.append("text").attr("x", 0).attr("y", 412).attr("font-size", 34).attr("font-weight", 900).attr("fill", C.ink).text(`↑ ${grow} 倍`);
        el.left = L.node();
      },
      steps(tl) {
        tl.from(el.clip, { attr: { width: 0 }, duration: 1, ease: "none" })
          .from(el.left, { opacity: 0, x: -20, duration: .4, ease: "none" }, "-=.5");
      },
      // 持续动效：中缝上的黄色播放头一遍遍走过六个季度
      ambient() {
        return gsap.timeline({ repeat: -1, paused: true })
          .fromTo(el.head, { attr: { x: el.headX[0] } }, { attr: { x: el.headX[1] }, duration: 4.5, ease: "none", immediateRender: false });
      }
    };
  })();
})();

/* ======================= 第二幕 ======================= */
(function () {
  const D = window.DATA, C = window.PAL, fmt = d3.format(","), pct = v => v.toFixed(1) + "%";
  const svgIn = (id, W, H, label) => {
    const host = d3.select(`#${id} .fig-body`); host.selectAll("*").remove();
    return host.append("svg").attr("viewBox", `0 0 ${W} ${H}`).attr("role", "img").attr("aria-label", label);
  };
  const wan = v => v >= 1e8 ? (v / 1e8).toFixed(2) + " 亿" : fmt(Math.round(v / 1e4)) + " 万";

  /* ---------- 图 05：铅字方阵（下载量 14 : 1） ---------- */
  (function () {
    const r = D.ratios.find(x => x.metric.startsWith("HuggingFace")), qw = r.Qwen, ds = r.DeepSeek;
    const nQ = Math.floor(qw / 1e6), nD = Math.floor(ds / 1e6), ratio = (qw / ds).toFixed(1), share = D.qwen_in_cn;
    const dsShare = ds / share.cn_total * 100, other = 100 - share.pct - dsShare;
    TEXT.fig4 = {
      title: `开发者每下载 ${ratio} 次 Qwen，才下载 1 次 DeepSeek`,
      sub: "一个小方块代表 100 万次下载。和图 02 正好反过来：报道里一面墙的 DeepSeek，到了下载量这里只剩一排。",
      note: `数据：HuggingFace Hub API，Qwen 与 deepseek-ai 两个官方账号下全部模型最近 30 天下载量之和，截至 ${D.meta.snapshot_hf}；精确比值为 ${(qw / ds).toFixed(1)} 倍。不足 100 万次的部分不画方块。下方比例条为 16 家中国机构的全部下载量构成。`
    };
    const el = {};
    FIGS.fig4 = {
      draw() {
        const W = 1200, H = 420, cell = 13, gap = 4, p = cell + gap, cols = 38, x0 = 200;
        const svg = svgIn("fig4", W, H, `Qwen ${wan(qw)}次，DeepSeek ${wan(ds)}次`);
        const grid = (n, y0, color) => d3.range(n).map(i => svg.append("rect").attr("x", x0 + (i % cols) * p).attr("y", y0 + Math.floor(i / cols) * p)
          .attr("width", cell).attr("height", cell).attr("fill", color).node());
        el.qw = grid(nQ, 20, C.use);
        el.ds = grid(nD, 210, C.talk);
        const lab = (y, name, color, v) => { const g = svg.append("g");
          g.append("text").attr("x", 0).attr("y", y + 4).attr("font-size", 20).attr("font-weight", 900).attr("fill", color).text(name);
          const t = g.append("text").attr("x", 0).attr("y", y + 40).attr("font-size", 32).attr("font-weight", 900).attr("fill", C.ink).attr("letter-spacing", "-.02em");
          const [num, unit] = wan(v).split(" ");
          t.append("tspan").text(num); t.append("tspan").attr("font-size", 16).attr("dx", 4).attr("letter-spacing", 0).text(unit + "次");
          g.append("text").attr("x", 0).attr("y", y + 62).attr("font-size", 13).attr("font-weight", 500).attr("fill", C.muted).text("最近 30 天下载量"); return g.node(); };
        el.lq = lab(36, "Qwen", C.use, qw); el.ld = lab(214, "DeepSeek", C.talk, ds);
        const rg = svg.append("g").attr("transform", "translate(870,0)").append("g");
        rg.append("text").attr("y", 120).attr("font-size", 84).attr("font-weight", 900).attr("letter-spacing", "-.05em").attr("fill", C.ink).text(`${ratio} : 1`);
        rg.append("text").attr("y", 172).attr("font-size", 17).attr("font-weight", 700).attr("fill", C.ink).text("下载量之比（Qwen : DeepSeek）");
        rg.append("rect").attr("y", 200).attr("width", cell).attr("height", cell).attr("fill", C.ink);
        rg.append("text").attr("x", 22).attr("y", 212).attr("font-size", 14).attr("font-weight", 500).attr("fill", C.muted).text("= 100 万次下载");
        el.ratio = rg.node();
        // 中国机构下载构成
        const by = 300, bw = W - x0, sx = v => bw * v / 100, g = svg.append("g");
        g.append("text").attr("x", 0).attr("y", by + 26).attr("font-size", 15).attr("font-weight", 900).attr("fill", C.ink).text("中国机构的下载里");
        let small = 0;
        [[share.pct, C.use, `Qwen ${pct(share.pct)}`, "#fff"], [dsShare, C.talk, `DeepSeek ${pct(dsShare)}`, "#fff"], [other, C.grey, `其他 14 家 ${pct(other)}`, C.ink]].reduce((x, [v, c, t, tc]) => {
          g.append("rect").attr("x", x).attr("y", by).attr("width", sx(v)).attr("height", 40).attr("fill", c);
          if (sx(v) > 190) g.append("text").attr("x", x + 12).attr("y", by + 26).attr("font-size", 15).attr("font-weight", 900).attr("fill", tc).text(t);
          else { g.append("text").attr("x", x + sx(v)).attr("y", by + 64 + small * 22).attr("text-anchor", "end").attr("font-size", 13).attr("font-weight", 700).attr("fill", c === C.grey ? C.ink : c).text(t); small++; }
          return x + sx(v); }, x0);
        el.share = g.node();
      },
      steps(tl) {
        tl.from([el.lq, el.ld], { opacity: 0, duration: .25 }, 0)
          .from(el.qw, { opacity: 0, stagger: .003, duration: .05, ease: "none" }, 0)
          .from(el.ds, { opacity: 0, stagger: .003, duration: .05, ease: "none" }, 0)
          .from(el.ratio, { opacity: 0, x: 60, duration: .3, ease: "none" }, .55)
          .from(el.share, { opacity: 0, y: 30, duration: .3, ease: "none" }, .75);
      },
      // 持续动效：随机方块闪成黄色——此刻还在被下载
      ambient() {
        const tl = gsap.timeline({ repeat: -1, paused: true });
        for (let i = 0; i < 16; i++) tl.call(() => {
          const sq = el.qw[Math.floor(Math.random() * el.qw.length)];
          gsap.fromTo(sq, { attr: { fill: C.yel } }, { attr: { fill: C.use }, duration: 1.1, ease: "power2.out" });
        }, null, i * .07);
        return tl;
      }
    };
  })();

  /* ---------- 图 06：四项指标发散图（对数刻度） ---------- */
  (function () {
    const R = [...D.ratios].sort((a, b) => (a.metric === "国外网络新闻报道量" ? -1 : b.metric === "国外网络新闻报道量" ? 1 : 0));
    const NAME = { "中文报刊报道量": "中文报刊报道", "国外网络新闻报道量": "国外网络新闻", "Hacker News 帖子数": "开发者论坛帖子", "GitHub star": "GitHub 收藏数", "HuggingFace 30 日下载量": "HuggingFace 下载量" };
    TEXT.fig5 = {
      title: "连开发者社区的讨论都偏向 DeepSeek，可他们下载的是 Qwen",
      sub: "五项指标，每一项都比较 DeepSeek 和 Qwen 谁更多、多几倍。四项「讨论」都偏向 DeepSeek，只有「使用」反过来偏向 Qwen。横轴为对数刻度。",
      note: R.map(r => `${NAME[r.metric]}：DeepSeek ${fmt(r.DeepSeek)}，Qwen ${fmt(r.Qwen)}（${r.window}，${r.source}）`).join("；") + "。五项口径与时间窗口各不相同，倍数只比较方向和量级。"
    };
    const el = {};
    FIGS.fig5 = {
      draw() {
        const top = 60, rh = 64, gapUse = 30, nTalk = R.filter(r => r.side === "talk").length, W = 1200, H = top + R.length * rh + gapUse + 84, cx = 600, half = 470;
        const svg = svgIn("fig5", W, H, "四项讨论指标偏向 DeepSeek，下载量偏向 Qwen");
        const s = d3.scaleLog().domain([1, 20]).range([0, half]);
        // 刻度
        const ax = svg.append("g");
        [1, 2, 5, 10, 20].forEach(v => [-1, 1].forEach(sg => { if (v === 1 && sg < 0) return;
          const x = cx + sg * s(v);
          ax.append("line").attr("x1", x).attr("x2", x).attr("y1", top - 14).attr("y2", top + R.length * rh + gapUse).attr("stroke", C.ink).attr("stroke-opacity", v === 1 ? 1 : .12).attr("stroke-width", v === 1 ? 3 : 1);
          ax.append("text").attr("x", x).attr("y", top - 22).attr("text-anchor", "middle").attr("font-size", 13).attr("font-weight", 700).attr("fill", C.muted).text(v === 1 ? "持平" : v + "×"); }));
        ax.append("text").attr("x", cx - 16).attr("y", 18).attr("text-anchor", "end").attr("font-size", 15).attr("font-weight", 900).attr("fill", C.talk).text("← DeepSeek 更多");
        ax.append("text").attr("x", cx + 16).attr("y", 18).attr("font-size", 15).attr("font-weight", 900).attr("fill", C.use).text("Qwen 更多 →");
        el.bars = []; el.labs = [];
        R.forEach((r, i) => {
          const y = top + i * rh + (r.side === "use" ? gapUse : 0), lead = r.leader === "DeepSeek", w = s(r.ratio), col = lead ? C.talk : C.use;
          const b = svg.append("rect").attr("y", y + 8).attr("height", rh - 22).attr("fill", col)
            .attr("x", lead ? cx - w : cx).attr("width", w).node();
          el.bars.push({ node: b, w, lead });
          const g = svg.append("g");
          g.append("text").attr("x", lead ? cx - w - 12 : cx + w + 12).attr("y", y + rh / 2 + 8).attr("text-anchor", lead ? "end" : "start").attr("font-size", 30).attr("font-weight", 900).attr("fill", C.ink).text(r.ratio + "×");
          // 指标名写在另一侧，不与条重叠
          g.append("text").attr("x", lead ? cx + 16 : cx - 16).attr("y", y + rh / 2 + 2).attr("text-anchor", lead ? "start" : "end").attr("font-size", 18).attr("font-weight", 900).attr("fill", C.ink).text(NAME[r.metric]);
          g.append("text").attr("x", lead ? cx + 16 : cx - 16).attr("y", y + rh / 2 + 22).attr("text-anchor", lead ? "start" : "end").attr("font-size", 12).attr("font-weight", 700).attr("letter-spacing", ".15em").attr("fill", r.side === "use" ? C.use : C.talk).text(r.side === "use" ? "使用" : "讨论");
          el.labs.push(g.node());
        });
        svg.append("line").attr("x1", 0).attr("x2", W).attr("y1", top + nTalk * rh + gapUse / 2 + 2).attr("y2", top + nTalk * rh + gapUse / 2 + 2).attr("stroke", C.ink).attr("stroke-dasharray", "6 6").attr("stroke-opacity", .5);
        svg.append("line").attr("x1", cx).attr("x2", cx).attr("y1", top - 14).attr("y2", top + R.length * rh + gapUse).attr("stroke", C.ink).attr("stroke-width", 3);  // 中线最后画，压在色条上
      },
      steps(tl) {
        el.bars.forEach((b, i) => {
          tl.from(b.node, { attr: { width: 0, x: b.lead ? 600 : 600 }, duration: .6, ease: "none" }, i * .35)
            .from(el.labs[i], { opacity: 0, duration: .25 }, i * .35 + .35);
        });
      }
    };
  })();

  /* ---------- 图 07：百格方阵（中国底座的衍生占比） ---------- */
  (function () {
    const Q = D.derivatives.quarterly;
    const firstHalf = Q.find(q => q.cn_pct > 50);
    TEXT.fig6 = {
      title: `从 ${firstHalf.quarter.slice(0, 4)} 年${"一二三四"[+firstHalf.quarter.slice(5) - 1]}季度起，热门底座上的新衍生模型，过半出自中国底座`,
      sub: "每个方阵代表一个季度里新发布的衍生模型（微调、量化、合并后的新模型），一格是 1%。蓝格出自中国底座，灰格出自美欧底座。",
      note: `数据：HuggingFace Hub API，30 日下载量 ≥ 50 万的 260 个底座（中国 ${D.derivatives.bases.CN} / 美欧 ${D.derivatives.bases.US_EU}）上的 ${fmt(D.derivatives.total_relations)} 条衍生关系，按衍生模型创建时间计季度。「热门」指底座按 2026 年 9 月的下载量选取；国别按发布机构计，英伟达发布的 Qwen 量化版计入美欧，中国占比为保守估计。`
    };
    const el = {};
    FIGS.fig6 = {
      draw() {
        const W = 1200, H = 330, cell = 15, gap = 2, p = cell + gap, gw = 10 * p - gap, x0 = 18, gg = (W - x0 * 2 - 6 * gw) / 5, top = 30;
        const svg = svgIn("fig6", W, H, Q.map(q => `${q.quarter} ${q.cn_pct}%`).join("，"));
        el.cells = [];
        Q.forEach((q, k) => {
          const gx = x0 + k * (gw + gg), n = Math.round(q.cn_pct), cells = [];
          for (let i = 0; i < 100; i++) {   // 自底向上、自左向右填
            const row = 9 - Math.floor(i / 10), col = i % 10;
            const r = svg.append("rect").attr("x", gx + col * p).attr("y", top + row * p).attr("width", cell).attr("height", cell).attr("fill", i < n ? C.use : C.grey);
            if (i < n) cells.push(r.node());
          }
          el.cells.push(cells);
          svg.append("text").attr("x", gx).attr("y", top + 10 * p + 40).attr("font-size", 36).attr("font-weight", 900).attr("letter-spacing", "-.03em").attr("fill", q.cn_pct > 50 ? C.use : C.ink).text(pct(q.cn_pct));
          svg.append("text").attr("x", gx).attr("y", top + 10 * p + 64).attr("font-size", 14).attr("font-weight", 700).attr("fill", C.muted).text(q.quarter);
          if (q === firstHalf) {
            const tg = svg.append("g").attr("transform", `translate(${gx},${top - 26})`);
            tg.append("rect").attr("width", 86).attr("height", 22).attr("fill", C.yel);
            tg.append("text").attr("x", 8).attr("y", 16).attr("font-size", 13).attr("font-weight", 900).attr("fill", C.ink).text("首次过半");
          }
        });
        const ym = top + 5 * p - gap / 2;
        svg.append("line").attr("x1", 0).attr("x2", W).attr("y1", ym).attr("y2", ym).attr("stroke", C.ink).attr("stroke-width", 2).attr("stroke-dasharray", "6 5");
        svg.append("text").attr("x", W).attr("y", ym - 8).attr("text-anchor", "end").attr("font-size", 13).attr("font-weight", 900).attr("fill", C.ink).text("50%");
      },
      steps(tl) {
        el.cells.forEach((cells, k) => tl.from(cells, { opacity: 0, stagger: .004, duration: .04, ease: "none" }, k * .3));
      },
      // 持续动效：蓝格自下而上一波波亮起，一个季度接一个季度——还在往上长
      ambient() {
        const tl = gsap.timeline({ repeat: -1, repeatDelay: .3, paused: true });
        el.cells.forEach((cells, k) => tl.to(cells, { attr: { fill: "#8AA2EE" }, duration: .16, ease: "none", stagger: { each: .008, yoyo: true, repeat: 1 } }, k * .22));
        return tl;
      }
    };
  })();

  /* ---------- 图 08：底座流向（哪家的底座长出了最多新模型） ---------- */
  (function () {
    const B = D.derivatives.by_base_org, total = d3.sum(B, b => b.total);
    const NAME = { "Qwen": "Qwen（阿里）", "meta-llama": "Llama（Meta）", "google": "Google", "openai": "OpenAI", "mistralai": "Mistral", "microsoft": "微软", "deepseek-ai": "DeepSeek" };
    const top7 = B.slice(0, 7), rest = B.slice(7), nodes = top7.map(b => ({ name: NAME[b.org] || b.org, v: b.total, country: b.country, org: b.org }));
    nodes.push({ name: `其他 ${rest.length} 家`, v: d3.sum(rest, b => b.total), country: "mix", org: "rest" });
    const q = B.find(b => b.org === "Qwen").total, l = B.find(b => b.org === "meta-llama").total, d = B.find(b => b.org === "deepseek-ai").total;
    TEXT.fig7 = {
      title: `六个季度里，基于 Qwen 的新模型是 Llama 的 ${(q / l).toFixed(1)} 倍、DeepSeek 的 ${Math.round(q / d)} 倍`,
      sub: `左边是底座的发布机构，带子越宽，在它的模型上新做出来的衍生模型越多。所有带子汇成右边一条：2025Q1—2026Q2 新发布的 ${fmt(total)} 个衍生模型，Qwen 一家占了 ${pct(q / total * 100)}。`,
      note: `数据：同图 08，仅计 2025Q1—2026Q2 创建的衍生模型。「其他」包括 ${rest.slice(0, 6).map(b => b.org).join("、")} 等。`
    };
    const el = {};
    FIGS.fig7 = {
      draw() {
        const W = 1200, H = 480, x0 = 260, x1 = 940, nodeW = 14, gap = 12, avail = 350, k = avail / total, top = 20;
        const svg = svgIn("fig7", W, H, TEXT.fig7.title);
        const colOf = n => n.org === "Qwen" ? C.use : n.org === "deepseek-ai" ? C.talk : n.org === "rest" ? "#ECE9E3" : C.grey;
        let yl = top, yr = top + (nodes.length - 1) * gap / 2 - 20;
        svg.append("defs").append("clipPath").attr("id", "f7c").append("rect").attr("x", 0).attr("y", 0).attr("width", W).attr("height", H);
        el.clip = svg.select("#f7c rect").node();
        const g = svg.append("g").attr("clip-path", "url(#f7c)");
        const rTop = yr, fl = g.append("g"); el.flows = [];
        nodes.forEach(n => {
          const h = Math.max(2, n.v * k);
          const a0 = yl, a1 = yl + h, b0 = yr, b1 = yr + h, mx = (x0 + nodeW + x1) / 2;
          g.append("path").attr("fill", colOf(n)).attr("opacity", n.org === "Qwen" || n.org === "deepseek-ai" ? .9 : .75)
            .attr("d", `M${x0 + nodeW},${a0} C${mx},${a0} ${mx},${b0} ${x1},${b0} L${x1},${b1} C${mx},${b1} ${mx},${a1} ${x0 + nodeW},${a1} Z`);
          const hot = n.org === "Qwen" || n.org === "deepseek-ai";
          el.flows.push(fl.append("path").attr("fill", "none").attr("stroke", hot ? "#fff" : C.ink).attr("stroke-opacity", hot ? .6 : .2).attr("stroke-linecap", "round")
            .attr("stroke-width", Math.max(1.5, Math.min(h * .28, 9))).attr("stroke-dasharray", "4 18")
            .attr("d", `M${x0 + nodeW},${(a0 + a1) / 2} C${mx},${(a0 + a1) / 2} ${mx},${(b0 + b1) / 2} ${x1},${(b0 + b1) / 2}`).node());
          svg.append("rect").attr("x", x0).attr("y", a0).attr("width", nodeW).attr("height", h).attr("fill", n.org === "Qwen" ? C.use : n.org === "deepseek-ai" ? C.talk : C.ink);
          svg.append("text").attr("x", x0 - 14).attr("y", a0 + Math.min(h, 40) / 2 + 6).attr("text-anchor", "end").attr("font-size", n.org === "Qwen" ? 22 : 15).attr("font-weight", 900).attr("fill", n.org === "Qwen" ? C.use : n.org === "deepseek-ai" ? C.talk : C.ink)
            .text(`${n.name}  ${fmt(n.v)}`);
          yl += h + gap; yr += h;
        });
        fl.raise();
        const rb = svg.append("g");
        rb.append("rect").attr("x", x1).attr("y", rTop).attr("width", 26).attr("height", yr - rTop).attr("fill", C.ink);
        rb.append("text").attr("x", x1 + 44).attr("y", rTop + 30).attr("font-size", 16).attr("font-weight", 900).attr("fill", C.ink).text("全部新衍生模型");
        rb.append("text").attr("x", x1 + 44).attr("y", rTop + 76).attr("font-size", 44).attr("font-weight", 900).attr("letter-spacing", "-.03em").attr("fill", C.ink).text(fmt(total));
        rb.append("text").attr("x", x1 + 44).attr("y", rTop + 130).attr("font-size", 16).attr("font-weight", 900).attr("fill", C.use).text("其中基于 Qwen 的");
        rb.append("text").attr("x", x1 + 44).attr("y", rTop + 174).attr("font-size", 44).attr("font-weight", 900).attr("letter-spacing", "-.03em").attr("fill", C.use).text(pct(q / total * 100));
        el.right = rb.node();
      },
      steps(tl) {
        tl.from(el.clip, { attr: { width: 270 }, duration: 1, ease: "none" })
          .from(el.right, { opacity: 0, x: 40, duration: .35, ease: "none" }, "-=.4");
      },
      // 持续动效：带子里的虚线一直往右流
      ambient() { return gsap.timeline({ repeat: -1, paused: true }).to(el.flows, { strokeDashoffset: -220, duration: 3.2, ease: "none" }); }
    };
  })();

  /* ---------- 图 09：书脊货架（单模型下载榜前十） ---------- */
  (function () {
    const T = D.top10_archive, nQ = T.filter(t => t.model_id.toLowerCase().includes("qwen")).length;
    const nv = T.find(t => t.org === "nvidia" && t.model_id.toLowerCase().includes("qwen"));
    TEXT.fig8 = {
      title: `下载榜前十，${nQ} 个模型基于 Qwen`,
      sub: "书脊越宽，下载越多。蓝色是 Qwen 官方发布的模型，黄色是 NVIDIA 发布的 Qwen 量化版本。",
      note: `数据：HuggingFace Hub API，28 家机构全部模型按最近 30 天下载量排序。统计时间：${D.meta.snapshot_rank}（本图为该日完整榜单）；其他下载指标更新至 ${D.meta.snapshot_hf}。第 9 名由 NVIDIA 发布，以 Qwen 为底座。下载量包含重复下载，不等同于用户数。`
    };
    const el = {};
    FIGS.fig8 = {
      draw() {
        const W = 1200, H = 500, base = 440, bh = 340, gap = 8, x0 = 0, shelfW = W;
        const sum = d3.sum(T, t => t.downloads_30d), k = (shelfW - x0 - gap * 9) / sum;
        const svg = svgIn("fig8", W, H, TEXT.fig8.title);
        let x = x0; el.books = []; el.featuredBook = null;
        T.forEach((t, i) => {
          const w = t.downloads_30d * k, isQ = t.model_id.toLowerCase().includes("qwen"), isNv = t === nv;
          const col = isNv ? C.yel : isQ ? C.use : C.grey, tc = isNv || !isQ ? C.ink : "#fff";
          const g0 = svg.append("g").attr("transform", `translate(${x},0)`).append("g"), g = isNv ? g0.append("g") : g0;  // 外层定位、中层入场、内层持续动效
          if (isNv) el.nvBook = g.node();
          if (isQ && !el.featuredBook) el.featuredBook = g.node();
          g.append("rect").attr("x", 0).attr("y", base - bh).attr("width", w).attr("height", bh).attr("fill", col);
          g.append("text").attr("x", 10).attr("y", base - bh + 32).attr("font-size", w > 60 ? 26 : 20).attr("font-weight", 900).attr("fill", tc).text(t.rank);
          const name = t.model_id.split("/")[1];
          g.append("text").attr("transform", `translate(${w / 2 + 6},${base - 14}) rotate(-90)`).attr("font-family", "Plex Mono, monospace").attr("font-size", 14).attr("font-weight", 600).attr("fill", tc).text(name.length > 32 ? name.slice(0, 31) + "…" : name);
          g.append("text").attr("transform", `translate(${w / 2 - 12},${base - 14}) rotate(-90)`).attr("font-size", 12).attr("font-weight", 700).attr("fill", tc).attr("opacity", .8).text(`${(t.downloads_30d / 1e4).toFixed(0)} 万次`);
          el.books.push(g0.node());
          if (isNv) {
            const a0 = svg.append("g").attr("transform", `translate(${x + w / 2},${base - bh - 18})`).append("g"), a = a0.append("g");
            el.nvTag = a.node();
            a.append("line").attr("x1", 0).attr("x2", 0).attr("y1", 0).attr("y2", -34).attr("stroke", C.ink).attr("stroke-width", 2);
            a.append("rect").attr("x", -250).attr("y", -82).attr("width", 280).attr("height", 48).attr("fill", C.ink);
            a.append("text").attr("x", -236).attr("y", -52).attr("font-size", 16).attr("font-weight", 900).attr("fill", "#fff").text("发布方：NVIDIA ｜ 底座：Qwen");
            el.nv = a0.node();
          }
          if (i === 0) {
            const a = svg.append("g").attr("transform", `translate(${x + 12},${base - bh - 18})`).append("g");
            a.append("text").attr("y", 0).attr("font-size", 13).attr("font-weight", 700).attr("fill", C.muted).text(`仓库建于 ${t.created_at.slice(0, 4)} 年`);
            el.old = a.node();
          }
          x += w + gap;
        });
        svg.append("rect").attr("x", 0).attr("y", base).attr("width", shelfW).attr("height", 10).attr("fill", C.ink);

      },
      steps(tl) {
        tl.from(el.books, { y: 60, opacity: 0, stagger: .08, duration: .35, ease: "none" })
          .from([el.old, el.nv].filter(Boolean), { opacity: 0, y: -10, duration: .3, ease: "none" }, "-=.2");
      },
      // 持续动效：榜单中的 Qwen 书脊反复被抽出来一下
      ambient() {
        return gsap.timeline({ repeat: -1, repeatDelay: .9, paused: true })
          .to([el.nvBook || el.featuredBook, el.nvTag].filter(Boolean), { y: -18, duration: .4, ease: "power2.out" })
          .to([el.nvBook || el.featuredBook, el.nvTag].filter(Boolean), { y: 0, duration: .7, ease: "bounce.out" }, "+=.5");
      }
    };
  })();
})();

/* ======================= 第三幕 ======================= */
(function () {
  const D = window.DATA, C = window.PAL, fmt = d3.format(","), pct = v => v.toFixed(1) + "%";
  const svgIn = (id, W, H, label) => {
    const host = d3.select(`#${id} .fig-body`); host.selectAll("*").remove();
    return host.append("svg").attr("viewBox", `0 0 ${W} ${H}`).attr("role", "img").attr("aria-label", label);
  };
  const B = D.bans.items;
  const typeOf = b => b.level.includes("立法") ? "law" : b.scope.public_app === "covered" ? "public" : "gov";

  /* ---------- 图 10：禁令时间轴 × 报道量 ---------- */
  (function () {
    const q1 = D.bans.quarterly[0].count, total = D.bans.total;
    TEXT.fig9 = {
      title: `${total} 项限制措施里，${q1} 项出现在 DeepSeek 报道最多的 2025 年一季度`,
      sub: "浅红色的柱子是每个季度写到 DeepSeek 的海外网络新闻报道量，每个点是一项政府限制措施，按公布日期落在时间轴上。报道最热的那个季度，也是限制最密集的季度。",
      note: `数据：限制措施由作者逐条核查（2026-10-07），${D.bans.items.filter(b => b.grade !== "media").length} 项有官方原文或官方新闻稿，${D.bans.items.filter(b => b.grade === "media").length} 项只有媒体报道、原件未公开（空心点）。纳入标准：政府机构针对 DeepSeek 或整批列名中国 AI 厂商的正式措施；排除非专项建议、未通过的法案和未落地的报道。报道量同图 02。`
    };
    const el = {};
    FIGS.fig9 = {
      draw() {
        const W = 1200, H = 470, x0 = 30, x1 = 1170, base = 380, t0 = new Date("2025-01-01"), t1 = new Date("2026-07-01");
        const svg = svgIn("fig9", W, H, TEXT.fig9.title);
        const x = d3.scaleTime().domain([t0, t1]).range([x0, x1]);
        const yb = d3.scaleLinear().domain([0, d3.max(D.gdelt.quarterly, q => q.DeepSeek)]).range([0, 300]);
        svg.append("defs").append("clipPath").attr("id", "f9c").append("rect").attr("x", 0).attr("y", 0).attr("width", W).attr("height", H);
        el.clip = svg.select("#f9c rect").node();
        const g = svg.append("g").attr("clip-path", "url(#f9c)");
        D.gdelt.quarterly.forEach(q => {
          const y = +q.quarter.slice(0, 4), m = (+q.quarter.slice(5) - 1) * 3, a = x(new Date(y, m, 1)), b = x(new Date(y, m + 3, 1));
          g.append("rect").attr("x", a + 2).attr("y", base - yb(q.DeepSeek)).attr("width", b - a - 4).attr("height", yb(q.DeepSeek)).attr("fill", C.talk).attr("opacity", .13);
          if (q === D.gdelt.quarterly[0] || q === D.gdelt.quarterly[D.gdelt.quarterly.length - 1])
            g.append("text").attr("x", a + 10).attr("y", base - yb(q.DeepSeek) - 10).attr("font-size", 14).attr("font-weight", 900).attr("fill", C.talk).text(`报道 ${fmt(q.DeepSeek)} 篇`);
          g.append("text").attr("x", (a + b) / 2).attr("y", base + 30).attr("text-anchor", "middle").attr("font-size", 13).attr("font-weight", 900).attr("fill", C.ink).text(q.quarter);
        });
        // 点：同月向上堆叠
        const byMonth = d3.group(B, b => b.date.slice(0, 7)), r = 11; el.dots = [];
        byMonth.forEach((items, mon) => {
          const cx = x(new Date(mon + "-15"));
          items.forEach((b, k) => {
            const cy = base - 16 - k * 25, t = typeOf(b), col = t === "public" ? C.talk : t === "law" ? C.yel : C.ink, media = b.grade === "media";
            const shape = t === "law" ? g.append("rect").attr("x", cx - r).attr("y", cy - r).attr("width", r * 2).attr("height", r * 2)
                                      : g.append("circle").attr("cx", cx).attr("cy", cy).attr("r", r);
            shape.attr("fill", media ? "#fff" : col).attr("stroke", col).attr("stroke-width", 3);
            el.dots.push({ node: shape.node(), date: b.date });
          });
          if (mon >= "2025-04") {
            g.append("text").attr("x", cx).attr("y", base - 16 - items.length * 25 - 6).attr("text-anchor", "middle").attr("font-size", 13).attr("font-weight", 900).attr("fill", C.ink)
              .text(items.map(b => b.place.replace("美国德州", "德州").replace("美国", "美国国会")).join("、"));
          }
        });
        svg.append("rect").attr("x", x0).attr("y", base).attr("width", x1 - x0).attr("height", 6).attr("fill", C.ink);
        // 「15 项」标注
        const qa = x(new Date(2025, 0, 1)), qb = x(new Date(2025, 3, 1));
        const ann = svg.append("g").attr("transform", `translate(${qb + 14},120)`).append("g");
        ann.append("text").attr("font-size", 56).attr("font-weight", 900).attr("letter-spacing", "-.03em").attr("fill", C.ink).text(`${q1} 项`);
        ann.append("text").attr("y", 30).attr("font-size", 15).attr("font-weight", 700).attr("fill", C.ink).text(`集中在 2025 年一季度（共 ${total} 项）`);
        el.ann = ann.node();
        // 图例
        const lg = svg.append("g").attr("transform", `translate(${x1 - 420},24)`);
        [["public", C.talk, "面向公众的 App"], ["gov", C.ink, "政府设备与系统"], ["law", C.yel, "立法"]].forEach(([t, c, s], i) => {
          const gx = i * 140;
          (t === "law" ? lg.append("rect").attr("x", gx).attr("y", -9).attr("width", 18).attr("height", 18) : lg.append("circle").attr("cx", gx + 9).attr("cy", 0).attr("r", 9)).attr("fill", c).attr("stroke", c).attr("stroke-width", 3);
          lg.append("text").attr("x", gx + 26).attr("y", 5).attr("font-size", 13).attr("font-weight", 700).attr("fill", C.ink).text(s);
        });
        lg.append("circle").attr("cx", 9).attr("cy", 30).attr("r", 9).attr("fill", "#fff").attr("stroke", C.ink).attr("stroke-width", 3);
        lg.append("text").attr("x", 26).attr("y", 35).attr("font-size", 13).attr("font-weight", 700).attr("fill", C.muted).text("空心 = 只有媒体报道、原件未公开");
      },
      steps(tl) {
        tl.from(el.clip, { attr: { width: 0 }, duration: 1, ease: "none" })
          .from(el.ann, { opacity: 0, x: -20, duration: .3, ease: "none" }, .25);
      },
      // 持续动效：20 项措施按公布先后一个个闪一下
      ambient() {
        const nodes = el.dots.slice().sort((a, b) => (a.date < b.date ? -1 : 1)).map(d => d.node);
        return gsap.timeline({ repeat: -1, repeatDelay: .5, paused: true })
          .to(nodes, { scale: 1.4, transformOrigin: "50% 50%", duration: .12, ease: "power1.out", stagger: { each: .08, yoyo: true, repeat: 1 } });
      }
    };
  })();

  /* ---------- 图 11：覆盖矩阵（紧凑版，一屏看全） ---------- */
  (function () {
    const cols = Object.keys(D.bans.columns), CN = { public_app: "公众使用\n官方 App", gov_use: "政府人员与设备\n使用 App / 网站 / API", gov_local_model: "政府系统里\n本地运行的模型", public_local_model: "公众在自己电脑上\n运行下载的模型" };
    TEXT.fig10 = {
      title: `${B.length} 项限制措施，没有一项管到公众在自己电脑上运行下载的模型`,
      sub: "每一行是一项限制措施，每一列是一类可能被管到的使用方式。红色是明确覆盖，斜线是条文措辞宽泛、可能覆盖，黄色是条文明确把它排除在外。最右一列从头到尾是空的。",
      note: "澳大利亚内政部 PSPF Direction 001-2025 脚注写明，限制「不包括」代码可审查、部署在政府系统本地的开源大模型；捷克政府第 537 号决议的实施方法论同样排除了本地部署、无法与 DeepSeek 服务器通信的开源模型。台湾地区公务机关的禁令明列「地端下载」，美国《2026 财年国防授权法》第 1532 条禁止国防部系统使用「DeepSeek 开发的任何 AI」——两者覆盖到模型本身，但只限政府内部。逐条来源见页面底部的数据说明。"
    };
    const el = {};
    FIGS.fig10 = {
      draw() {
        const W = 1200, rh = 17, top = 66, lw = 470, cw = (W - lw) / 4, H = top + B.length * rh + 80;
        const svg = svgIn("fig10", W, H, TEXT.fig10.title);
        const pat = svg.append("defs").append("pattern").attr("id", "hatch").attr("patternUnits", "userSpaceOnUse").attr("width", 6).attr("height", 6).attr("patternTransform", "rotate(45)");
        pat.append("rect").attr("width", 6).attr("height", 6).attr("fill", "#fff");
        pat.append("line").attr("x1", 0).attr("y1", 0).attr("x2", 0).attr("y2", 6).attr("stroke", C.talk).attr("stroke-width", 2.6);
        el.colBg = svg.append("rect").attr("x", lw + 3 * cw).attr("y", 0).attr("width", cw).attr("height", top + B.length * rh + 4).attr("fill", C.use).attr("opacity", .1).node();
        el.scan = svg.append("rect").attr("x", lw + 3 * cw + 14).attr("y", top).attr("width", cw - 28).attr("height", rh - 5).attr("fill", C.use).attr("opacity", 0).node();
        el.scanY = [top + 2, top + (B.length - 1) * rh + 2];
        el.heads = cols.map((c, i) => { const g = svg.append("g");
          CN[c].split("\n").forEach((line, k) => g.append("text").attr("x", lw + i * cw + cw / 2).attr("y", 24 + k * 18).attr("text-anchor", "middle").attr("font-size", 13).attr("font-weight", 900).attr("fill", i === 3 ? C.use : C.ink).text(line));
          return g.node(); });
        svg.append("line").attr("x1", 0).attr("x2", W).attr("y1", top - 10).attr("y2", top - 10).attr("stroke", C.ink).attr("stroke-width", 3);
        el.cells = cols.map(() => []);
        B.forEach((b, r) => {
          const y = top + r * rh;
          svg.append("text").attr("x", 0).attr("y", y + 10).attr("font-family", "Plex Mono, monospace").attr("font-size", 11).attr("fill", C.muted).text(b.date);
          svg.append("text").attr("x", 84).attr("y", y + 11).attr("font-size", 13).attr("font-weight", 900).attr("fill", C.ink).text(b.place);
          svg.append("text").attr("x", 196).attr("y", y + 11).attr("font-size", 12).attr("font-weight", 500).attr("fill", b.grade === "media" ? C.muted : C.ink)
            .text((b.issuer.length > 15 ? b.issuer.slice(0, 14) + "…" : b.issuer) + (b.grade === "media" ? "（媒体报道）" : ""));
          cols.forEach((c, i) => {
            const v = b.scope[c], cx = lw + i * cw + 14, w = cw - 28;
            svg.append("rect").attr("x", cx).attr("y", y + 2).attr("width", w).attr("height", rh - 5).attr("fill", "none").attr("stroke", C.ink).attr("stroke-opacity", .12);
            if (v !== "none") {
              const g = svg.append("g");
              g.append("rect").attr("x", cx).attr("y", y + 2).attr("width", w).attr("height", rh - 5)
                .attr("fill", v === "covered" ? C.talk : v === "broad" ? "url(#hatch)" : C.yel).attr("stroke", v === "broad" ? C.talk : "none").attr("stroke-width", 1.4);
              if (v === "exempt") g.append("text").attr("x", cx + w / 2).attr("y", y + 11).attr("text-anchor", "middle").attr("font-size", 10.5).attr("font-weight", 900).attr("fill", C.ink).text("条文明确排除");
              el.cells[i].push(g.node());
            }
          });
        });
        // 汇总
        const sy = top + B.length * rh + 14, sum = svg.append("g");
        sum.append("line").attr("x1", 0).attr("x2", W).attr("y1", sy - 6).attr("y2", sy - 6).attr("stroke", C.ink).attr("stroke-width", 3);
        sum.append("text").attr("x", 0).attr("y", sy + 40).attr("font-size", 16).attr("font-weight", 900).attr("fill", C.ink).text("覆盖到的措施数");
        el.sums = cols.map((c, i) => {
          const m = D.bans.matrix_count[c], n = (m.covered || 0) + (m.broad || 0);
          return sum.append("g").attr("transform", `translate(${lw + i * cw + cw / 2},${sy + 48})`).append("text").attr("text-anchor", "middle")
            .attr("font-size", i === 3 ? 56 : 32).attr("font-weight", 900).attr("letter-spacing", "-.03em").attr("fill", i === 3 ? C.use : C.ink).text(`${n} / ${B.length}`).node();
        });
        // 图例
        const lg = svg.append("g").attr("transform", "translate(0,24)");
        [[C.talk, "明确覆盖"], ["url(#hatch)", "措辞宽泛，可能覆盖"], [C.yel, "条文明确排除"]].forEach(([f, s], i) => {
          const gx = [0, 96, 250][i];
          lg.append("rect").attr("x", gx).attr("y", -10).attr("width", 18).attr("height", 13).attr("fill", f).attr("stroke", f.startsWith("url") ? C.talk : "none");
          lg.append("text").attr("x", gx + 24).attr("y", 1).attr("font-size", 12).attr("font-weight", 700).attr("fill", C.ink).text(s);
        });
      },
      // 一列一列从左往右「刷」出来，最后点亮空白的那一列，0 / 20 弹出
      steps(tl) {
        el.cells.forEach((cells, i) => {
          if (cells.length) tl.from(cells, { scaleX: 0, transformOrigin: "left center", stagger: .03, duration: .25, ease: "none" }, i * .35);
          tl.from(el.sums[i], { opacity: 0, y: 20, duration: .25, ease: "none" }, i * .35 + .25);
        });
        tl.from(el.colBg, { opacity: 0, duration: .3 }, 1.05)
          .from(el.sums[3], { scale: .3, transformOrigin: "center bottom", duration: .3, ease: "none" }, 1.1);
      },
      // 持续动效：一道扫描光沿空白列反复往下扫，一格也没扫到
      ambient() {
        return gsap.timeline({ repeat: -1, repeatDelay: .2, paused: true })
          .set(el.scan, { attr: { y: el.scanY[0] } })
          .to(el.scan, { opacity: .6, duration: .15 })
          .to(el.scan, { attr: { y: el.scanY[1] }, duration: 1.7, ease: "none" })
          .to(el.scan, { opacity: 0, duration: .3 });
      }
    };
  })();

  /* ---------- 图 12：两个面板的指数折线（2025Q1 = 100） ---------- */
  (function () {
    const Q = D.meta.quarters, M = D.gdelt.quarterly, O = D.derivatives.by_base_org;
    const panels = [["DeepSeek", "deepseek-ai", C.talk], ["Qwen", "Qwen", C.use]].map(([k, org, col]) => {
      const der = O.find(b => b.org === org).quarterly, rep = M.map(m => m[k]);
      return { k, col, rep, der, ri: rep.map(v => v / rep[0] * 100), di: der.map(v => v / der[0] * 100) };
    });
    const [dk, qw] = panels, chg = (a) => a[a.length - 1] / a[0];
    TEXT.fig11 = {
      title: `DeepSeek 的报道和衍生一起往下走，Qwen 的海外报道减少 ${Math.round((1 - chg(qw.rep)) * 100)}%、衍生涨到 ${chg(qw.der).toFixed(0)} 倍`,
      sub: "左右两个面板，各画两条线：红线是每季度的海外网络新闻报道量，蓝线是每季度基于这个模型的新衍生模型数。都以 2025 年一季度为 100，看它们后来涨还是跌。",
      note: `报道量同图 02；衍生数同图 08（以 deepseek-ai、Qwen 官方模型为底座的新衍生模型）。DeepSeek：报道 ${fmt(dk.rep[0])} → ${fmt(dk.rep[5])} 篇，衍生 ${fmt(dk.der[0])} → ${fmt(dk.der[5])} 个；Qwen：报道 ${fmt(qw.rep[0])} → ${fmt(qw.rep[5])} 篇，衍生 ${fmt(qw.der[0])} → ${fmt(qw.der[5])} 个。`
    };
    const el = { clips: [], ends: [], ripples: [] };
    FIGS.fig11 = {
      draw() {
        const W = 1200, H = 470, pw = 470, top = 70, bot = 400, xs = [70, 670];
        const svg = svgIn("fig11", W, H, TEXT.fig11.title);
        const y = d3.scaleLinear().domain([0, 380]).range([bot, top]);
        const defs = svg.append("defs");
        panels.forEach((p, k) => {
          const x0 = xs[k], x = d3.scalePoint().domain(Q).range([x0, x0 + pw - 90]);
          svg.append("text").attr("x", x0).attr("y", 30).attr("font-size", 30).attr("font-weight", 900).attr("fill", p.col).text(p.k);
          [0, 100, 200, 300].forEach(v => {
            svg.append("line").attr("x1", x0).attr("x2", x0 + pw - 90).attr("y1", y(v)).attr("y2", y(v)).attr("stroke", C.ink).attr("stroke-opacity", v === 100 ? .5 : .08).attr("stroke-dasharray", v === 100 ? "5 5" : null);
            svg.append("text").attr("x", x0 - 10).attr("y", y(v) + 4).attr("text-anchor", "end").attr("font-size", 12).attr("font-weight", 700).attr("fill", C.muted).text(v);
          });
          Q.forEach(q => svg.append("text").attr("x", x(q)).attr("y", bot + 26).attr("text-anchor", "middle").attr("font-size", 12).attr("font-weight", 700).attr("fill", C.muted).text(q));
          const cid = `f12c${k}`;
          defs.append("clipPath").attr("id", cid).append("rect").attr("x", x0 - 12).attr("y", 0).attr("width", pw).attr("height", H);
          el.clips.push(svg.select(`#${cid} rect`).node());
          const g = svg.append("g").attr("clip-path", `url(#${cid})`);
          [[p.ri, C.talk], [p.di, C.use]].forEach(([arr, col]) => {
            g.append("path").attr("d", d3.line().x((d, i) => x(Q[i])).y(d => y(d))(arr)).attr("fill", "none").attr("stroke", col).attr("stroke-width", 6).attr("stroke-linejoin", "round");
            arr.forEach((d, i) => g.append("circle").attr("cx", x(Q[i])).attr("cy", y(d)).attr("r", i === arr.length - 1 ? 8 : 5).attr("fill", col));
          });
          // 末端标注
          const ex = x(Q[Q.length - 1]) + 16, e = svg.append("g");
          const lab = (arr, raw, col, name, dy) => {
            const f = chg(raw), s = f >= 1 ? `×${f.toFixed(1)}` : `↓ ${Math.round((1 - f) * 100)}%`;
            el.ripples.push(e.append("circle").attr("cx", ex - 16).attr("cy", y(arr[arr.length - 1])).attr("r", 8).attr("fill", "none").attr("stroke", col).attr("stroke-width", 3).attr("opacity", 0).node());
            e.append("text").attr("x", ex).attr("y", y(arr[arr.length - 1]) + 6 + dy).attr("font-size", 22).attr("font-weight", 900).attr("fill", col).text(s);
            e.append("text").attr("x", ex).attr("y", y(arr[arr.length - 1]) + 24 + dy).attr("font-size", 12).attr("font-weight", 700).attr("fill", col).text(name);
          };
          const rEnd = p.ri[5], dEnd = p.di[5], close = Math.abs(y(rEnd) - y(dEnd)) < 46;
          lab(p.ri, p.rep, C.talk, "报道量", close ? (rEnd < dEnd ? 22 : -22) : 0);
          lab(p.di, p.der, C.use, "新衍生模型", close ? (dEnd <= rEnd ? 22 : -22) : 0);
          el.ends.push(e.node());
        });
        // 图例
        const lg = svg.append("g").attr("transform", `translate(${W - 360},24)`);
        [[C.talk, "海外网络新闻"], [C.use, "新衍生模型数"]].forEach(([c, s], i) => {
          lg.append("line").attr("x1", i * 180).attr("x2", i * 180 + 30).attr("y1", 0).attr("y2", 0).attr("stroke", c).attr("stroke-width", 6);
          lg.append("text").attr("x", i * 180 + 40).attr("y", 5).attr("font-size", 13).attr("font-weight", 700).attr("fill", C.ink).text(s);
        });
        svg.append("text").attr("x", W - 360).attr("y", 52).attr("font-size", 12).attr("font-weight", 700).attr("fill", C.muted).text("2025 年一季度 = 100（虚线）");
      },
      steps(tl) {
        tl.from(el.clips, { attr: { width: 0 }, duration: 1, ease: "none" })
          .from(el.ends, { opacity: 0, x: -30, duration: .3, ease: "none" }, "-=.3");
      },
      // 持续动效：线的终点一圈圈扩散——趋势还在继续
      ambient() {
        return gsap.timeline({ repeat: -1, paused: true })
          .fromTo(el.ripples, { attr: { r: 8 }, opacity: .8 }, { attr: { r: 30 }, opacity: 0, duration: 1.2, ease: "power1.out", stagger: .2, immediateRender: false });
      }
    };
  })();
})();

/* ---------- 中外报道：同一时间轴上的收窄带，宽度按各库首季归一 ---------- */
(function () {
  const D = window.DATA, C = window.PAL, fmt = d3.format(",");
  const el = { clips: [], counters: [] };
  TEXT.fig13 = {
    title: "海外网络新闻和中文报刊中，DeepSeek 的季度报道量都减少了八成以上",
    sub: "2025 年一季度—2026 年二季度。红色带的厚度对应每季度的报道篇数，两边均以各自首季为基准；灰色轮廓表示首季水平。",
    note: `中文报刊：慧科完整检索库，中国大陆报刊，检索「DeepSeek」与「通义千问 OR Qwen」。海外网络新闻：GDELT DOC 2.0，排除中国大陆来源，检索「DeepSeek」与「(Qwen OR \"Tongyi Qianwen\")」。两库分别统计，不相加；GDELT 查询区间返回 ${D.gdelt.days} / ${D.gdelt.days_total} 个日度数据点，季度值按返回记录汇总。报道倍数为 18 个月累计值，降幅为首末季度之比。`
  };
  FIGS.fig13 = {
    draw() {
      const host = d3.select("#fig13 .fig-body"); host.selectAll("*").remove();
      const narrow = host.node().clientWidth < 700, W = narrow ? 600 : 1200, H = narrow ? 840 : 420;
      const svg = host.append("svg").attr("viewBox", `0 0 ${W} ${H}`).attr("role", "img").attr("aria-label", TEXT.fig13.title);
      const defs = svg.append("defs"); el.clips = []; el.counters = [];
      const panels = [
        { label: "中文报刊", source: "慧科 · 中国大陆报刊", rows: D.media.quarterly, sums: D.media.sum, drop: D.media.deepseek_drop_pct },
        { label: "海外网络新闻", source: "GDELT · 中国大陆以外来源", rows: D.gdelt.quarterly, sums: D.gdelt.sum, drop: D.gdelt.deepseek_drop_pct }
      ];
      // 慧科总数用季度序列计算，避免依赖字段名。
      panels[0].sums = Object.fromEntries(["DeepSeek", "Qwen"].map(k => [k, d3.sum(panels[0].rows, r => r[k])]));
      panels.reverse();
      panels.forEach((p, i) => {
        const group = svg.append("g").attr("transform", `translate(${narrow ? 20 : i * 640},${narrow ? i * 420 : 0})`);
        const text = (x, y, size, value, color = C.ink, weight = 700) => group.append("text").attr("x", x).attr("y", y).attr("font-size", size).attr("font-weight", weight).attr("fill", color).text(value);
        text(0, 28, 25, p.label, C.ink, 900);
        text(0, 55, 14, p.source, C.muted, 500);
        const count = text(0, 137, 72, `−${p.drop.toFixed(1)}%`, C.talk, 900).node();
        el.counters.push({ node: count, drop: p.drop });
        text(0, 166, 16, "DeepSeek 季度报道量降幅");
        text(355, 117, 34, `${(p.sums.DeepSeek / p.sums.Qwen).toFixed(1)} : 1`, C.ink, 900);
        text(355, 144, 14, "DeepSeek / Qwen");
        text(355, 165, 13, "18 个月累计报道量", C.muted, 500);
        const xs = d3.scalePoint().domain(d3.range(6)).range([24, 520]), cy = 263, thick = 68;
        const area = d3.area().x((d, j) => xs(j)).y0(d => cy - thick * d.DeepSeek / p.rows[0].DeepSeek).y1(d => cy + thick * d.DeepSeek / p.rows[0].DeepSeek).curve(d3.curveMonotoneX);
        group.append("rect").attr("x", 24).attr("y", cy - thick).attr("width", 496).attr("height", thick * 2).attr("fill", C.paper).attr("stroke", C.grey).attr("stroke-dasharray", "4 5");
        const cid = `media-ribbon-${i}`;
        const clip = defs.append("clipPath").attr("id", cid).append("rect").attr("x", 0).attr("y", 185).attr("width", 560).attr("height", 160).node();
        el.clips.push(clip);
        group.append("path").datum(p.rows).attr("d", area).attr("fill", C.talk).attr("clip-path", `url(#${cid})`);
        p.rows.forEach((r, j) => {
          text(xs(j), 364, 18, fmt(r.DeepSeek), C.talk, 900).attr("text-anchor", "middle");
          text(xs(j), 390, 13, r.quarter, C.muted, 500).attr("text-anchor", "middle");
        });
      });
      if (!narrow) svg.append("line").attr("x1", 598).attr("x2", 598).attr("y1", 0).attr("y2", 400).attr("stroke", C.grey).attr("stroke-width", 2);
    },
    steps(tl) {
      el.clips.forEach((clip, i) => tl.from(clip, { attr: { width: 0 }, duration: 1.25, ease: "none" }, i * .12));
      el.counters.forEach(c => {
        const value = { n: 0 };
        tl.to(value, { n: c.drop, duration: 1.35, ease: "none", onUpdate: () => (c.node.textContent = `−${value.n.toFixed(1)}%`) }, 0);
      });
    }
  };
})();
