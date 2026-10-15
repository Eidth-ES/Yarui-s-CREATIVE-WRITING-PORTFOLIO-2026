/* =====================================================================
   王雅睿 · 创意写作作品合集 — 交互逻辑
   ===================================================================== */
(function () {
  'use strict';

  /* ---------------- 工具 ---------------- */
  const $  = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.prototype.slice.call((r || document).querySelectorAll(s));

  function el(tag, cls, html) {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  }
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  /* =====================================================================
     1. 顶栏 / 滚动进度 / 分区高亮
     ===================================================================== */
  function initTopbar() {
    const bar  = $('#topbar');
    const prog = $('#scrollProgress');

    function onScroll() {
      const y = window.scrollY || document.documentElement.scrollTop;
      bar.classList.toggle('scrolled', y > 24);

      const h = document.documentElement.scrollHeight - window.innerHeight;
      prog.style.width = (h > 0 ? Math.min(y / h, 1) * 100 : 0) + '%';

      $('#toTop').classList.toggle('show', y > 700);
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    // 移动端菜单
    const btn = $('#menuBtn'), nav = $('#topnav');
    btn.addEventListener('click', () => {
      const open = nav.classList.toggle('open');
      btn.classList.toggle('open', open);
    });
    $$('#topnav a').forEach(a => a.addEventListener('click', () => {
      nav.classList.remove('open'); btn.classList.remove('open');
    }));

    // 回到顶部
    $('#toTop').addEventListener('click', () =>
      window.scrollTo({ top: 0, behavior: 'smooth' }));

    // 分区 tab 跳转
    $$('.tab').forEach(t => t.addEventListener('click', () => {
      const target = document.getElementById(t.dataset.jump);
      if (target) window.scrollTo({
        top: target.offsetTop - 110, behavior: 'smooth'
      });
    }));
  }

  function initNavSpy() {
    const ids = ['sec-wuxia', 'sec-fanfic', 'sec-podcast', 'sec-research'];
    const navLinks = {};
    ids.forEach(id => {
      const a = $('.topnav a[data-nav="' + id + '"]');
      if (a) navLinks[id] = a;
    });
    const tabs = $$('.tab');

    function spy() {
      const mark = window.scrollY + window.innerHeight * 0.32;
      let cur = ids[0];
      ids.forEach(id => {
        const n = document.getElementById(id);
        if (n && n.offsetTop <= mark) cur = id;
      });
      Object.keys(navLinks).forEach(id =>
        navLinks[id].classList.toggle('active', id === cur));

      const tabIdx = ['sec-wuxia', 'sec-fanfic', 'sec-podcast', 'sec-research'].indexOf(cur);
      tabs.forEach((t, i) => t.classList.toggle('active', i === tabIdx));
    }
    window.addEventListener('scroll', spy, { passive: true });
    spy();
  }

  /* =====================================================================
     2. 入场动效
     ===================================================================== */
  function initReveal() {
    const items = $$('.reveal');
    if (!('IntersectionObserver' in window)) {
      items.forEach(n => n.classList.add('in'));
      return;
    }
    const io = new IntersectionObserver((ents) => {
      ents.forEach(e => {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.06 });
    items.forEach(n => io.observe(n));
  }

  /* =====================================================================
     3. 数字滚动
     ===================================================================== */
  function initCounters() {
    const nodes = $$('[data-count]');
    if (!nodes.length) return;
    const io = new IntersectionObserver((ents) => {
      ents.forEach(e => {
        if (!e.isIntersecting) return;
        const n = e.target;
        const target = parseInt(n.dataset.count, 10);
        const suffix = n.dataset.suffix || '';
        const dur = 1400, t0 = performance.now();
        (function step(t) {
          const p = Math.min((t - t0) / dur, 1);
          const eased = 1 - Math.pow(1 - p, 3);
          const v = Math.round(target * eased);
          n.textContent = (target >= 10000
            ? v.toLocaleString('en-US')
            : String(v)) + suffix;
          if (p < 1) requestAnimationFrame(step);
        })(t0);
        io.unobserve(n);
      });
    }, { threshold: 0.5 });
    nodes.forEach(n => io.observe(n));
  }

  /* =====================================================================
     4. 平滑滚动到元素
     ===================================================================== */
  function scrollToEl(node, offset) {
    if (!node) return;
    const top = node.getBoundingClientRect().top + window.scrollY - (offset || 120);
    window.scrollTo({ top: top, behavior: 'smooth' });
  }

  /* =====================================================================
     5. 渲染：原创武侠小说
     ===================================================================== */
  function renderWuxia() {
    const data = window.WUXIA;
    if (!data) return;
    $('#wuxiaIntro').textContent = data.intro;
    const list = $('#wuxiaList');

    data.pieces.forEach(piece => {
      const card = el('div', 'piece');
      card.id = 'piece-' + piece.id;

      /* --- 头部 --- */
      const head = el('div', 'piece-head');
      head.innerHTML =
        '<div class="piece-badge">' + esc(piece.index) + '</div>' +
        '<div class="piece-head-main">' +
          '<div class="piece-title">' + esc(piece.title) +
            (piece.tag ? '<span class="piece-tag">' + esc(piece.tag) + '</span>' : '') +
          '</div>' +
          '<p class="piece-oneline">' + esc(piece.oneLine) + '</p>' +
          '<div class="piece-meta">' +
            piece.meta.map(m => '<span>' + esc(m) + '</span>').join('') +
          '</div>' +
        '</div>' +
        '<div class="piece-toggle"><svg viewBox="0 0 24 24"><path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></div>';
      card.appendChild(head);

      /* --- 主体 --- */
      const body = el('div', 'piece-body');
      const inner = el('div', 'piece-body-inner');

      // 简述
      if (piece.brief && piece.brief.length) {
        const brief = el('div', 'brief');
        piece.brief.forEach(t => brief.appendChild(el('p', null, esc(t))));
        inner.appendChild(brief);
      }

      // 外部链接
      if (piece.link) {
        const a = el('a', 'piece-link');
        a.href = piece.link; a.target = '_blank'; a.rel = 'noopener';
        a.innerHTML = '<svg viewBox="0 0 24 24" width="14" height="14"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/></svg>' +
          esc(piece.linkText || piece.link);
        inner.appendChild(a);
      }

      // 结构化要点
      if (piece.structure && piece.structure.length) {
        const dl = el('dl', 'struct-grid');
        piece.structure.forEach(s => {
          const row = el('div', 'struct-row');
          row.appendChild(el('dt', null, esc(s.t)));
          row.appendChild(el('dd', null, esc(s.d)));
          dl.appendChild(row);
        });
        inner.appendChild(dl);
      }

      // 章节索引 chips + 正文
      if (piece.chapters && piece.chapters.length) {
        const chips = el('div', 'chapter-chips');
        chips.appendChild(el('div', 'chapter-chips-label', '章节索引 · 点击跳转'));
        piece.chapters.forEach((c, i) => {
          const chip = el('button', 'chip');
          chip.innerHTML = '<i>' + String(i + 1).padStart(2, '0') + '</i><span>' + esc(c.name) + '</span>';
          chip.dataset.target = c.id;
          chips.appendChild(chip);
        });
        inner.appendChild(chips);

        const wrap = el('div', 'chapters');
        piece.chapters.forEach((c, i) => {
          const art = el('article', 'chapter');
          art.id = c.id;
          let h = '<h4><span class="ch-no">' + esc(c.no) + '</span>' + esc(c.name) + '</h4>';
          if (c.poem && c.poem.length) {
            h += '<div class="chapter-body poem">' +
                 c.poem.map(l => '<p>' + esc(l) + '</p>').join('') + '</div>';
          }
          if (c.paras && c.paras.length) {
            h += '<div class="chapter-body">' +
                 c.paras.map(l => '<p>' + esc(l) + '</p>').join('') + '</div>';
          }
          art.innerHTML = h;
          wrap.appendChild(art);
        });
        inner.appendChild(wrap);

        // chip 点击跳转（展开状态下滚动 + 高亮）
        chips.addEventListener('click', (ev) => {
          const btn = ev.target.closest('.chip');
          if (!btn) return;
          $$('.chip', chips).forEach(x => x.classList.remove('active'));
          btn.classList.add('active');
          const t = document.getElementById(btn.dataset.target);
          if (!t) return;
          const open = card.classList.contains('open');
          if (!open) togglePiece(card, true);
          setTimeout(() => {
            const rm = $('#readerMain');
            const inReader = rm && rm.contains(t);
            if (inReader) {
              rm.scrollTo({ top: t.offsetTop - 16, behavior: 'smooth' });
            } else {
              scrollToEl(t, 140);
            }
            t.classList.add('flash');
            setTimeout(() => t.classList.remove('flash'), 1800);
          }, open ? 30 : 420);
        });
      }

      body.appendChild(inner);
      card.appendChild(body);
      list.appendChild(card);

      function onToggle() { togglePiece(card); }
      head.addEventListener('click', onToggle);
    });
  }

  function togglePiece(card, forceOpen) {
    const body = $('.piece-body', card);
    const isOpen = card.classList.contains('open');
    const shouldOpen = forceOpen === true ? true : !isOpen;

    if (shouldOpen === isOpen && forceOpen !== true) return;
    card.classList.toggle('open', shouldOpen);

    if (shouldOpen) {
      body.style.maxHeight = body.scrollHeight + 60 + 'px';
      // 展开动画结束后解除限高，内部滚动/折叠都正常
      setTimeout(() => {
        if (card.classList.contains('open')) body.style.maxHeight = 'none';
      }, 620);
    } else {
      body.style.maxHeight = body.scrollHeight + 'px';
      requestAnimationFrame(() => { body.style.maxHeight = '0px'; });
      setTimeout(() => { if (!card.classList.contains('open')) body.style.maxHeight = ''; }, 600);
    }
    // 单个卡片动画
    body.style.transition = 'max-height .55s cubic-bezier(.22,1,.36,1)';
  }

  /* =====================================================================
     6. 渲染：游戏同人文（阅读器 + 目录跳转）
     ===================================================================== */
  const FF = {
    volIndex: 0,
    charIndex: 0,
    itemIndex: 0,
    flat: []          // 当前卷的扁平篇目列表
  };

  function buildFlat(vol) {
    const arr = [];
    vol.chars.forEach(ch => {
      ch.items.forEach(it => {
        arr.push({
          volId: vol.id,
          volTitle: vol.title,
          charId: ch.id,
          charName: ch.name,
          charEn: ch.en || '',
          charGame: ch.game || vol.game || '',
          charRole: ch.role || '',
          item: it
        });
      });
    });
    return arr;
  }

  function renderFanfic() {
    const vols = window.FANFIC;
    if (!vols) return;

    /* 卷切换按钮 */
    const sw = $('#volumeSwitch');
    vols.forEach((v, i) => {
      const b = el('button', 'vol-btn');
      b.innerHTML = '<b>' + esc(v.index) + '</b> &nbsp;' + esc(v.title);
      b.addEventListener('click', () => {
        FF.volIndex = i; FF.charIndex = 0; FF.itemIndex = 0;
        renderFanficView();
        scrollToEl($('#fanficReader'), 130);
      });
      sw.appendChild(b);
    });

    // 侧栏「返回」→ 回到卷目录视图（保留左栏目录高亮状态）
    $('#sideBack').addEventListener('click', () => {
      $('#sideTitle').textContent = window.FANFIC[FF.volIndex].title + ' · 目录总览';
      renderReaderIntro();
      scrollToEl($('#fanficReader'), 130);
    });

    renderFanficView();
  }

  function renderFanficView() {
    const vols = window.FANFIC;
    const vol  = vols[FF.volIndex];
    FF.flat = buildFlat(vol);

    $$('#volumeSwitch .vol-btn').forEach((b, i) =>
      b.classList.toggle('active', i === FF.volIndex));

    // 默认选中该卷第一篇
    if (FF.charIndex < 0 || FF.charIndex >= vol.chars.length) {
      FF.charIndex = 0; FF.itemIndex = 0;
    }
    const ch = vol.chars[FF.charIndex];
    if (FF.itemIndex < 0 || FF.itemIndex >= ch.items.length) FF.itemIndex = 0;

    renderSideNav();
    renderArticle();
  }

  /* --- 左侧目录 --- */
  function renderSideNav() {
    const vols = window.FANFIC;
    const vol  = vols[FF.volIndex];
    const nav  = $('#sideNav');

    $('#sideTitle').textContent = vol.index + ' ' + vol.title;
    $('#sideSub').textContent = vol.game;
    $('#sideFoot').textContent = FF.flat.length + ' 篇 · ' + vol.chars.length + ' 位角色';

    nav.innerHTML = '';

    // 卷说明置顶
    if (vol.desc) {
      const d = el('div', 'side-sub',
        '<span style="display:block;padding:2px 8px 12px;border-bottom:1px solid var(--line-1);margin-bottom:12px;">' +
        esc(vol.desc) + '</span>');
      nav.appendChild(d);
    }

    vol.chars.forEach((c, ci) => {
      // 角色分组标题
      const g = el('div', 'side-group-label');
      g.textContent = c.name + (c.en ? ' · ' + c.en : '');
      nav.appendChild(g);

      c.items.forEach((it, ii) => {
        const b = el('button', 'side-link');
        const active = (ci === FF.charIndex && ii === FF.itemIndex);
        if (active) b.classList.add('active');
        b.innerHTML =
          '<span class="sl-dot"></span>' +
          '<span class="sl-text">' + esc(it.title) + '</span>';
        b.addEventListener('click', () => {
          FF.charIndex = ci; FF.itemIndex = ii;
          renderSideNav();
          renderArticle();
          const rm = $('#readerMain');
          if (rm) rm.scrollTo({ top: 0, behavior: 'smooth' });
        });
        nav.appendChild(b);
      });
    });
  }

  /* --- 右侧正文 --- */
  function renderArticle() {
    const vols = window.FANFIC;
    const vol  = vols[FF.volIndex];
    const ch   = vol.chars[FF.charIndex];
    const item = ch.items[FF.itemIndex];
    const main = $('#readerMain');

    // 找到当前篇在扁平列表中的位置（用于上一篇/下一篇）
    let pos = -1;
    FF.flat.forEach((f, i) => {
      if (f.charId === ch.id && f.item.id === item.id) pos = i;
    });

    let html = '';

    html += '<header class="art-head">';
    html += '<div class="art-crumb">' +
              '<span>' + esc(vol.title) + '</span>' +
              '<span class="sep">/</span>' +
              '<span>' + esc(ch.name) + '</span>' +
              '<span class="sep">/</span>' +
              '<span class="cur">' + esc(item.title) + '</span>' +
            '</div>';
    html += '<h1 class="art-title">' + esc(item.title) + '</h1>';
    if (item.subtitle) {
      html += '<p class="art-sub">' + esc(item.subtitle) + '</p>';
    }
    html += '</header>';

    html += '<div class="art-body">';
    const paras = item.paras || [];
    const isQuote = function (s) {
      if (s.indexOf('——') === 0) return true;
      if (s.indexOf('「') === 0 && s.length < 44) return true;
      if (/^[A-Z][a-z]{2}\.$/.test(s.trim())) return true;
      if (/^〔.{1,10}〕$/.test(s.trim())) return true;
      return false;
    };
    paras.forEach((p) => {
      if (isQuote(p)) {
        html += '<div class="art-quote"><p>' + esc(p) + '</p></div>';
      } else {
        html += '<p>' + esc(p) + '</p>';
      }
    });
    html += '</div>';

    html += '<footer class="art-end">' +
              '<span class="art-end-mark">— 全文完 · 王雅睿 —</span>' +
              '<div class="art-pager">' +
                '<button id="pgPrev"' + (pos <= 0 ? ' disabled' : '') + '>← 上一篇</button>' +
                '<button id="pgNext"' + (pos >= FF.flat.length - 1 ? ' disabled' : '') + '>下一篇 →</button>' +
              '</div>' +
            '</footer>';

    main.innerHTML = '<article class="reader-article">' + html + '</article>';

    if (pos > 0) $('#pgPrev').addEventListener('click', () => goFlat(pos - 1));
    if (pos < FF.flat.length - 1) $('#pgNext').addEventListener('click', () => goFlat(pos + 1));
  }

  function goFlat(i) {
    const f = FF.flat[i];
    if (!f) return;
    const vols = window.FANFIC;
    const vol = vols[FF.volIndex];
    vol.chars.forEach((c, ci) => {
      if (c.id === f.charId) {
        FF.charIndex = ci;
        c.items.forEach((it, ii) => { if (it.id === f.item.id) FF.itemIndex = ii; });
      }
    });
    renderSideNav();
    renderArticle();
    const rm = $('#readerMain');
    if (rm) rm.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function renderReaderIntro() {
    const vols = window.FANFIC;
    const vol  = vols[FF.volIndex];
    $('#sideTitle').textContent = vol.title + ' · 目录';
    $('#sideSub').textContent = vol.game;
    $('#sideFoot').textContent = FF.flat.length + ' 篇';
    $('#readerMain').innerHTML =
      '<div class="reader-empty">' +
        '<div class="re-icon"><svg viewBox="0 0 24 24" width="26" height="26"><path d="M4 19.5A2.5 2.5 0 016.5 17H20M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg></div>' +
        '<h4>' + esc(vol.title) + '</h4>' +
        '<p>' + esc(vol.desc) + '</p>' +
        '<p style="color:var(--tx-cyan);font-size:12.5px;">← 从左侧目录选择一篇开始阅读</p>' +
      '</div>';
    // 清除左栏高亮
    $$('#sideNav .side-link').forEach(x => x.classList.remove('active'));
  }

  /* =====================================================================
     7. 渲染：播客
     ===================================================================== */
  function renderPodcast() {
    const d = window.PODCAST;
    if (!d) return;
    $('#podcastOneLine').textContent = d.oneLine;

    const card = $('#podcastCard');
    card.innerHTML =
      '<div class="pod-cover"><span>EDITH</span><b>牡蛎</b><span>世界</span></div>' +
      '<div class="pod-info">' +
        '<h3>' + esc(d.title) + '</h3>' +
        '<div class="pod-meta">' +
          '<span class="tag">' + esc(d.platform) + '</span>' +
          '<span class="tag">主播 ' + esc(d.host) + '</span>' +
          '<span class="tag">' + esc(d.episode.no) + '</span>' +
        '</div>' +
        '<p>' + esc(d.brief[0]) + '</p>' +
      '</div>';

    const ep = d.episode;
    $('#podSideSub').textContent = ep.no + ' ' + ep.title;

    /* 侧栏：段落 + 子节 */
    const nav = $('#podNav');
    nav.innerHTML = '';
    ep.segments.forEach((s, si) => {
      const b = el('button', 'side-link');
      b.innerHTML = '<span class="sl-dot"></span><span class="sl-text">' + esc(s.label) + '</span>';
      b.addEventListener('click', () => {
        $$('#podNav .side-link').forEach(x => x.classList.remove('active'));
        b.classList.add('active');
        const t = document.getElementById(s.id);
        const rm = $('#podArticle').parentElement;
        if (s.subs && s.subs.length) {
          const first = document.getElementById(s.subs[0].id);
          if (first && rm) rm.scrollTo({ top: first.offsetTop - 20, behavior: 'smooth' });
        } else if (t && rm) {
          rm.scrollTo({ top: t.offsetTop - 20, behavior: 'smooth' });
        }
      });
      nav.appendChild(b);

      if (s.subs && s.subs.length) {
        s.subs.forEach(sub => {
          const sb = el('button', 'side-link');
          sb.style.paddingLeft = '30px';
          sb.innerHTML = '<span class="sl-dot" style="opacity:.5"></span><span class="sl-text" style="font-size:12.5px">' + esc(sub.title) + '</span>';
          sb.addEventListener('click', () => {
            $$('#podNav .side-link').forEach(x => x.classList.remove('active'));
            sb.classList.add('active');
            const t = document.getElementById(sub.id);
            const rm = $('#podArticle').parentElement;
            if (t && rm) rm.scrollTo({ top: t.offsetTop - 20, behavior: 'smooth' });
          });
          nav.appendChild(sb);
        });
      }
    });

    /* 正文 */
    let html = '<header class="art-head">' +
      '<div class="art-crumb"><span>' + esc(d.platform) + '</span><span class="sep">/</span><span>' + esc(d.show) + '</span><span class="sep">/</span><span class="cur">' + esc(ep.no) + '</span></div>' +
      '<h1 class="art-title">' + esc(ep.title) + '</h1>' +
      '<p class="art-sub">' + esc(d.oneLine) + '</p>' +
      '</header><div class="art-body">';

    ep.segments.forEach(s => {
      html += '<h3 class="art-sub-head" id="' + s.id + '">' + esc(s.label) + '</h3>';
      if (s.paras && s.paras.length) {
        s.paras.forEach(p => { html += '<p>' + esc(p) + '</p>'; });
      }
      if (s.subs && s.subs.length) {
        s.subs.forEach(sub => {
          html += '<h3 class="art-sub-head" id="' + sub.id + '" style="margin-top:26px;">' + esc(sub.title) + '</h3>';
          sub.paras.forEach(p => { html += '<p>' + esc(p) + '</p>'; });
        });
      }
    });
    html += '</div><footer class="art-end"><span class="art-end-mark">— 本期完 · 全文完 —</span></footer>';

    $('#podArticle').innerHTML = html;
  }

  /* =====================================================================
     8. 渲染：论文
     ===================================================================== */
  function renderResearch() {
    const d = window.RESEARCH;
    if (!d) return;
    $('#researchOneLine').textContent = d.oneLine;

    const list = $('#paperList');
    d.papers.forEach(p => {
      const card = el('div', 'paper');
      card.id = 'paper-' + p.id;

      let head = '<div class="paper-top">' +
        '<div class="paper-badge">' + esc(p.index) + '</div>' +
        '<div class="paper-head-main">' +
          '<span class="paper-type">' + esc(p.type) + '</span>' +
          '<h3 class="paper-title">' + esc(p.title) + '</h3>' +
          '<p class="paper-en">' + esc(p.en) + '</p>' +
        '</div></div>';

      if (p.journal) {
        head += '<div class="paper-journal">' +
          '<b>' + esc(p.journal) + '</b>' +
          '<span class="dot-sep"></span><span>' + esc(p.volume) + '</span>' +
          '<span class="dot-sep"></span><span>' + esc(p.publishedAt) + '</span>' +
          '<span class="dot-sep"></span><span style="font-family:var(--f-mono);font-size:11.5px">DOI: 10.12677/arl.2026.152032</span>' +
        '</div>';
      }

      if (p.abstract) {
        head += '<p class="paper-abstract">' + (p.type === '研究项目论文' ? '<b>内容提要：</b>' : '') + esc(p.abstract) + '</p>';
      } else if (p.oneLine) {
        head += '<p class="paper-abstract">' + esc(p.oneLine) + '</p>';
      }

      const kws = (p.keywords || []).concat(p.keywordsEn || []);
      if (kws.length) {
        head += '<div class="kw-row">' +
          kws.map(k => '<span class="kw">' + esc(k) + '</span>').join('') + '</div>';
      }

      head += '<button class="paper-toggle">' +
        '<span>展开全文</span>' +
        '<svg viewBox="0 0 24 24"><path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>' +
      '</button>';

      const body = el('div', 'paper-body');
      let bi = '<div class="paper-body-inner">';
      (p.sections || []).forEach(s => {
        bi += '<div class="paper-sec" id="' + s.id + '">' +
          '<h4>' + (s.no ? '<span class="pno">' + esc(s.no) + '</span>' : '') + esc(s.title) + '</h4>' +
          '<div class="paper-sec-body">' +
          (s.paras || []).map(t => '<p>' + esc(t) + '</p>').join('') +
          '</div></div>';
      });
      if (p.doi) {
        bi += '<a class="piece-link" href="' + esc(p.doi) + '" target="_blank" rel="noopener" style="margin-top:8px;margin-bottom:0">' +
          '<svg viewBox="0 0 24 24" width="14" height="14"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/></svg>' +
          '阅读原文 · DOI Link</a>';
      }
      bi += '</div>';
      body.innerHTML = bi;

      card.innerHTML = head;
      card.appendChild(body);
      list.appendChild(card);

      const btn = $('.paper-toggle', card);
      btn.addEventListener('click', () => {
        const open = card.classList.toggle('open');
        $('span', btn).textContent = open ? '收起全文' : '展开全文';
        if (open) {
          body.style.maxHeight = body.scrollHeight + 60 + 'px';
          setTimeout(() => { if (card.classList.contains('open')) body.style.maxHeight = 'none'; }, 660);
        } else {
          body.style.maxHeight = body.scrollHeight + 'px';
          requestAnimationFrame(() => { body.style.maxHeight = '0px'; });
        }
        body.style.transition = 'max-height .6s cubic-bezier(.22,1,.36,1)';
      });
    });
  }

  /* =====================================================================
     9. 启动
     ===================================================================== */
  function boot() {
    initTopbar();
    renderWuxia();
    renderFanfic();
    renderPodcast();
    renderResearch();
    initNavSpy();
    initReveal();
    initCounters();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
