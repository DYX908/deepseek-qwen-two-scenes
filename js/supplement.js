/* 课堂反馈补充。使用与正文相同的固定快照；历史评测不冒充当前排名。 */
(function () {
  const S = DATA.supplement, C = PAL, fmt = d3.format(','), pct = v => v.toFixed(1) + '%';
  const [ds, qw] = S.composition;
  const allRatio = qw.total / ds.total;
  const textRatio = qw.parts[0].downloads / ds.parts[0].downloads;
  const totalLabel = n => n >= 1e8 ? (n / 1e8).toFixed(2) + ' 亿次' : (n / 1e4).toFixed(0) + ' 万次';

  TEXT.fig14 = {
    title: `Qwen 的下载量中，${pct(qw.parts[1].pct)} 来自图像理解类模型`,
    sub: `每个方阵代表各自的全部下载量，一格为 1%。黄色为图像理解类模型：接收图像和文字，输出文字。`,
    note: `数据：HuggingFace Hub API，${DATA.meta.snapshot_hf} 快照。按 pipeline_tag 分组；其他包括嵌入、排序、语音等任务及未标注仓库。分类依据平台标签，模型可兼具多种能力；文本生成组仍包含不同规模、版本与用途，并非等条件比较。全部下载之比 ${allRatio.toFixed(2)}，文本生成标签之比 ${textRatio.toFixed(2)}。`
  };
  let scopeCells = [], scopePanels = [], scopeNumbers = [], scopeGlints = [];
  FIGS.fig14 = {
    scrollStart: 'top 95%', scrollEnd: 'center 60%',
    draw() {
      const host = d3.select('#fig14 .fig-body'); host.selectAll('*').remove();
      host.append('p').attr('class','scope-summary-label').text('Qwen / DeepSeek 下载量之比');
      const summary = host.append('div').attr('class', 'scope-summary');
      summary.html(`<div><span>全部模型</span><b><em data-scope-count="${allRatio.toFixed(1)}">${allRatio.toFixed(1)}</em><small>倍</small></b></div><div class="scope-transition"><span>仅比较文本生成类</span><i aria-hidden="true">→</i></div><div><span>文本生成类模型</span><b><em data-scope-count="${textRatio.toFixed(1)}">${textRatio.toFixed(1)}</em><small>倍</small></b></div>`);
      const panels = host.append('div').attr('class', 'scope-panels');
      scopeCells=[];scopePanels=[];scopeNumbers=[];scopeGlints=[];
      S.composition.forEach((row,i) => {
        const panel = panels.append('div').attr('class',`scope-panel ${i?'use':'talk'}`);scopePanels.push(panel.node());
        panel.append('div').attr('class','scope-name').html(`<b>${row.name}</b><span>${totalLabel(row.total)}</span>`);
        const body = panel.append('div').attr('class','scope-panel-body');
        const svg=body.append('svg').attr('class','scope-waffle').attr('viewBox','0 0 220 220').attr('role','img').attr('aria-label',row.name+'下载构成：'+row.parts.map(p=>p.label+p.pct.toFixed(1)+'%').join('；'));
        const colors=[i?C.use:C.talk,C.yel,C.grey];
        const edges=[0];row.parts.forEach(p=>edges.push(edges.at(-1)+p.downloads/row.total*100));edges[3]=100;
        // 每格一百分点，边界格按原始占比切分，避免整数取整改变构成。
        for(let cell=0;cell<100;cell++){
          const g=svg.append('g').attr('transform',`translate(${cell%10*22},${Math.floor(cell/10)*22})`).append('g');scopeCells.push(g.node());
          for(let part=0;part<3;part++){
            const lo=Math.max(cell,edges[part]),hi=Math.min(cell+1,edges[part+1]);
            if(hi>lo)g.append('rect').attr('x',(lo-cell)*18).attr('y',0).attr('width',(hi-lo)*18).attr('height',18).attr('fill',colors[part]);
          }
          if(cell%13===4){const glint=g.append('rect').attr('width',18).attr('height',18).attr('fill','white').attr('opacity',0);scopeGlints.push(glint.node());}
        }
        const list=body.append('div').attr('class','scope-list');
        row.parts.forEach((part,j)=>{
          const item=list.append('div').attr('class','scope-row');
          item.html(`<i class="part-${part.id}" aria-hidden="true"></i><span>${['文本生成','图像理解','其他 / 未标注'][j]}</span><b>${pct(part.pct)}</b><small>${fmt(part.downloads)} 次</small>`);
          scopeNumbers.push({node:item.select('b').node(),value:part.pct});
        });
      });
      host.selectAll('[data-scope-count]').each(function(){scopeNumbers.push({node:this,value:+this.dataset.scopeCount,ratio:true});});
    },
    steps(tl) {
      tl.from('#fig14 .scope-summary', {y:60,opacity:.2,duration:1,ease:'none'},0)
        .from(scopePanels,{y:70,opacity:.2,stagger:.12,duration:1,ease:'none'},0)
        .from(scopeCells,{scale:0,transformOrigin:'50% 50%',stagger:{each:.003,from:'start'},duration:.8,ease:'none'},0);
      scopeNumbers.forEach(n=>{const o={v:0};tl.to(o,{v:n.value,duration:1.4,ease:'none',onUpdate:()=>n.node.textContent=o.v.toFixed(1)+(n.ratio?'':'%')},0);});
    },
    ambient(){return gsap.to(scopeGlints,{opacity:.5,duration:.35,yoyo:true,repeat:-1,repeatDelay:1,stagger:.12,ease:'sine.inOut',paused:true});}
  };

  const B = S.benchmark;
  TEXT.fig15 = {
    title: 'DeepSeek 代码得分更高，Qwen 指令遵循得分更高',
    sub: '七项能力分别比较，满分 100；每格为 5 分。红色为 DeepSeek，蓝色为 Qwen，末格按实际得分填充。',
    note: `数据：LiveBench，${B.retrieved} 采集快照；采用 ${B.edition} 题目版本，各类子任务取均值。DeepSeek 为 Max 推理设置，Qwen 开启思考模式。成绩针对所列版本，不代表整个系列，也不表示差异具有统计显著性。原表与配置说明见文末。`
  };
  let benchCards=[], benchBlocks=[], benchScores=[], benchCaps=[];
  FIGS.fig15 = {
    scrollStart: 'top 95%', scrollEnd: 'center 60%',
    draw(){
      const host=d3.select('#fig15 .fig-body');host.selectAll('*').remove();
      host.append('div').attr('class','bench-models').html(`<span class="c-talk"><i></i>${B.models.DeepSeek}</span><span class="c-use"><i></i>${B.models.Qwen}</span>`);
      const grid=host.append('div').attr('class','bench-grid');
      benchCards=[];benchBlocks=[];benchScores=[];benchCaps=[];
      B.rows.forEach(r=>{
        const card=grid.append('div').attr('class','bench-card');benchCards.push(card.node());
        card.append('h3').text(r.label);
        const svg=card.append('svg').attr('viewBox','0 0 150 350').attr('role','img').attr('aria-label',`${r.label}：DeepSeek ${r.DeepSeek.toFixed(1)}，Qwen ${r.Qwen.toFixed(1)}，满分100`);
        svg.append('text').attr('x',75).attr('y',20).attr('text-anchor','middle').attr('font-size',11).attr('fill',C.muted).text('100');
        svg.append('line').attr('x1',8).attr('x2',142).attr('y1',30).attr('y2',30).attr('stroke',C.grey).attr('stroke-dasharray','3 4');
        [['DeepSeek',C.talk,16],['Qwen',C.use,86]].forEach(([key,color,x])=>{
          const score=svg.append('text').attr('x',x+24).attr('y',325).attr('font-size',24).attr('font-weight',900).attr('text-anchor','middle').attr('fill',color).text(r[key].toFixed(1));benchScores.push({node:score.node(),value:r[key]});
          const fill=svg.append('g');
          for(let j=0;j<20;j++){
            const f=Math.min(1,Math.max(0,r[key]/5-j));
            svg.append('rect').attr('x',x).attr('y',278-j*13).attr('width',48).attr('height',10).attr('fill',C.paper);
            if(f>0){const cell=svg.append('rect').attr('class','score-block').attr('x',x).attr('y',278-j*13+(1-f)*10).attr('width',48).attr('height',f*10).attr('fill',color);benchBlocks.push({node:cell.node(),level:j});}
          }
          const topIndex=Math.floor((r[key]-.000001)/5),fraction=(r[key]/5-topIndex);
          const cap=svg.append('rect').attr('x',x).attr('y',278-topIndex*13+(1-fraction)*10).attr('width',48).attr('height',Math.max(1,fraction*10)).attr('fill','white').attr('opacity',0);benchCaps.push(cap.node());
        });
        svg.append('line').attr('x1',8).attr('x2',142).attr('y1',291).attr('y2',291).attr('stroke',C.ink).attr('stroke-width',3);
      });
    },
    steps(tl){
      tl.from(benchCards,{y:60,opacity:.2,stagger:.04,duration:.9,ease:'none'},0);
      benchBlocks.forEach(b=>tl.from(b.node,{scaleY:0,transformOrigin:'center bottom',opacity:0,duration:.6,ease:'none'},b.level*.035));
      benchScores.forEach(s=>{const o={v:0};tl.to(o,{v:s.value,duration:1.4,ease:'none',onUpdate:()=>s.node.textContent=o.v.toFixed(1)},0);});
    },
    ambient(){return gsap.to(benchCaps,{opacity:.45,duration:.65,yoyo:true,repeat:-1,repeatDelay:.8,stagger:.11,ease:'sine.inOut',paused:true});}
  };
})();
