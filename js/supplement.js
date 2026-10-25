/* 课堂反馈补充。使用与正文相同的固定快照；历史评测不冒充当前排名。 */
(function () {
  const S = DATA.supplement, C = PAL, fmt = d3.format(','), pct = v => v.toFixed(1) + '%';
  const [ds, qw] = S.composition;
  const allRatio = qw.total / ds.total;
  const textRatio = qw.parts[0].downloads / ds.parts[0].downloads;
  const totalLabel = n => n >= 1e8 ? (n / 1e8).toFixed(2) + ' 亿次' : (n / 1e4).toFixed(0) + ' 万次';

  TEXT.fig14 = {
    title: `Qwen 的下载量中，${pct(qw.parts[1].pct)} 来自图像理解类模型`,
    sub: `按平台任务分类，分别统计两个官方账号的下载构成。图像理解类指接收图像和文字、输出文字的模型。两条色带均为各自总量的 100%。`,
    note: `数据：HuggingFace Hub API，${DATA.meta.snapshot_hf} 快照。按 pipeline_tag 分组；其他包括嵌入、排序、语音等任务及未标注仓库。分类依据平台标签，模型可兼具多种能力；文本生成组仍包含不同规模、版本与用途，并非等条件比较。全部下载之比 ${allRatio.toFixed(2)}，文本生成标签之比 ${textRatio.toFixed(2)}。`
  };
  let scopeNodes = [];
  FIGS.fig14 = {
    draw() {
      const host = d3.select('#fig14 .fig-body'); host.selectAll('*').remove();
      const summary = host.append('div').attr('class', 'scope-summary');
      summary.html(`<div><span>全部任务</span><b>${allRatio.toFixed(1)}<small>倍</small></b></div><div class="scope-transition"><span>只看文本生成标签</span><i aria-hidden="true">→</i></div><div><span>仅文本生成</span><b>${textRatio.toFixed(1)}<small>倍</small></b></div><p>Qwen / DeepSeek<br>差距缩小，仍然存在</p>`);
      const panels = host.append('div').attr('class', 'scope-panels');
      S.composition.forEach((row, i) => {
        const panel = panels.append('div').attr('class', `scope-panel ${i ? 'use' : 'talk'}`);
        panel.append('div').attr('class', 'scope-name').html(`<b>${row.name}</b><span>${totalLabel(row.total)}</span>`);
        const strip = panel.append('div').attr('class', 'scope-strip').attr('role', 'img')
          .attr('aria-label', row.name + '：' + row.parts.map(p => `${p.label} ${pct(p.pct)}`).join('；'));
        row.parts.forEach(part => strip.append('i').attr('class', `part-${part.id}`).style('width', part.pct + '%'));
        const list = panel.append('div').attr('class', 'scope-list');
        row.parts.forEach(part => list.append('div').attr('class', 'scope-row')
          .html(`<i class="part-${part.id}" aria-hidden="true"></i><span>${part.label}</span><b>${pct(part.pct)}</b><small>${fmt(part.downloads)} 次</small>`));
      });
      scopeNodes = [...host.node().querySelectorAll('.scope-summary, .scope-panel')];
    },
    steps(tl) {
      tl.from(scopeNodes, { y: 90, opacity: .15, stagger: .12, duration: 1, ease: 'none' }, 0)
        .from('#fig14 .scope-strip', { scaleX: .12, transformOrigin: 'left center', duration: 1.2, ease: 'none' }, 0);
    }
  };

  const B = S.benchmark;
  TEXT.fig15 = {
    title: 'DeepSeek 代码得分更高，Qwen 指令遵循得分更高',
    sub: '比较 2026 年的两款 Flash 型号，展示全部七项成绩，满分 100。型号规模与推理设置不同，分数用于观察各项表现，不代表等成本排名。',
    note: `数据：LiveBench，${B.retrieved} 采集快照；采用 ${B.edition} 题目版本，各类子任务取均值。DeepSeek 为 Max 推理设置，Qwen 开启思考模式。成绩针对所列版本，不代表整个系列，也不表示差异具有统计显著性。原表与配置说明见文末。`
  };
  let benchRows = [], benchLines = [], benchDots = [];
  FIGS.fig15 = {
    draw() {
      const host = d3.select('#fig15 .fig-body'); host.selectAll('*').remove();
      host.append('div').attr('class', 'bench-models').html(`<span class="c-talk"><i></i>${B.models.DeepSeek}</span><span class="c-use"><i></i>${B.models.Qwen}</span><small>2026 年型号 · ${B.retrieved} 评测快照</small>`);
      const narrow = host.node().clientWidth < 640;
      const W = narrow ? 540 : 1200, H = narrow ? 622 : 440;
      const x0 = narrow ? 130 : 235, x1 = narrow ? 350 : 945, rowH = narrow ? 78 : 54, top = narrow ? 90 : 58;
      const x = v => x0 + (x1 - x0) * v / 100;
      const svg = host.append('svg').attr('viewBox', `0 0 ${W} ${H}`).attr('role', 'img')
        .attr('aria-label', B.rows.map(r => `${r.label}：DeepSeek ${r.DeepSeek.toFixed(1)}，Qwen ${r.Qwen.toFixed(1)}`).join('；'));
      [0, 25, 50, 75, 100].forEach(v => {
        svg.append('line').attr('x1', x(v)).attr('x2', x(v)).attr('y1', narrow ? 68 : 36).attr('y2', top + 6 * rowH + 22).attr('stroke', C.grey).attr('stroke-dasharray', v % 50 ? '3 6' : null);
        svg.append('text').attr('x', x(v)).attr('y', narrow ? 55 : 23).attr('text-anchor', 'middle').attr('font-size', narrow ? 19 : 14).attr('fill', C.muted).text(v);
      });
      svg.append('text').attr('x', W - (narrow ? 109 : 108)).attr('y', narrow ? 18 : 23).attr('text-anchor', narrow ? 'end' : 'middle').attr('fill', C.talk).attr('font-size', narrow ? 18 : 14).text('DeepSeek');
      svg.append('text').attr('x', W - (narrow ? 24 : 20)).attr('y', narrow ? 18 : 23).attr('text-anchor', 'end').attr('fill', C.use).attr('font-size', narrow ? 18 : 14).text('Qwen');
      benchRows = []; benchLines = []; benchDots = [];
      B.rows.forEach((r, i) => {
        const y = top + i * rowH;
        const g = svg.append('g'); benchRows.push(g.node());
        g.append('text').attr('x', 0).attr('y', y + 7).attr('font-size', narrow ? 24 : 22).attr('font-weight', 800).text(r.label);
        const line = g.append('line').attr('x1', x(r.DeepSeek)).attr('x2', x(r.Qwen)).attr('y1', y).attr('y2', y).attr('stroke', C.ink).attr('stroke-width', 3);
        benchLines.push(line.node());
        [['DeepSeek', C.talk], ['Qwen', C.use]].forEach(([key, color], k) => {
          const dot = g.append('circle').attr('cx', x(r[key])).attr('cy', y).attr('r', narrow ? 8 : 7).attr('fill', color).attr('stroke', '#fff').attr('stroke-width', 2);
          benchDots.push(dot.node());
          g.append('text').attr('x', W - (k ? (narrow ? 24 : 20) : (narrow ? 109 : 108))).attr('y', y + 8)
            .attr('text-anchor', narrow || k ? 'end' : 'middle').attr('font-size', narrow ? 23 : 24).attr('font-weight', 900).attr('fill', color).text(r[key].toFixed(1));
        });
      });
    },
    steps(tl) {
      tl.from(benchRows, { y: 38, opacity: .1, stagger: .07, duration: .9, ease: 'none' }, 0)
        .from(benchDots, { attr: { r: 0 }, duration: 1.1, stagger: .025, ease: 'none' }, 0)
        .from(benchLines, { opacity: 0, duration: .7, ease: 'none' }, .3);
    }
  };
})();
