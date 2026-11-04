/* 蜉蝣十洲志 · 站点交互 */
(() => {
  const B = window.BIBLE;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ─────────── 首屏星点 ─────────── */
  (() => {
    const g = $("#stars");
    if (!g) return;
    const rnd = mulberry(207);
    let s = "";
    for (let i = 0; i < 70; i++) {
      const x = rnd() * 1440, y = rnd() * 560, r = rnd() * 1.4 + .3, o = (rnd() * .5 + .12).toFixed(2);
      s += `<circle cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" r="${r.toFixed(1)}" fill="#CFE0DA" opacity="${o}"/>`;
    }
    g.innerHTML = s;
  })();

  function mulberry(a) {
    return () => {
      a |= 0; a = a + 0x6D2B79F5 | 0;
      let t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }

  /* ─────────── 序 ─────────── */
  $("#logline").textContent = B.meta.logline;

  /* ─────────── 三族 ─────────── */
  const RACE_ORDER = ["human", "demon", "spirit"];
  const tabs = $("#raceTabs");
  const body = $("#raceBody");
  tabs.innerHTML = RACE_ORDER.map((k, i) => {
    const r = B.races[k];
    return `<button role="tab" data-race="${k}" class="${i === 0 ? "is-on" : ""}" aria-selected="${i === 0}">
      ${r.name}<span class="rt-en">${r.en.toUpperCase()}</span></button>`;
  }).join("");

  function paintRace(k) {
    const r = B.races[k];
    body.innerHTML =
      `<div class="race-creed" style="border-left-color:${r.color}">划分方式 · ${r.creed}　｜　自称之字 ·「${r.prefix}」　｜　关键词 · ${r.scent}</div>` +
      r.items.map(([a, b]) => `<div class="rb-k">${esc(a)}</div><div class="rb-v">${esc(b)}</div>`).join("");
    $$("#raceTabs button").forEach((b) => {
      const on = b.dataset.race === k;
      b.classList.toggle("is-on", on);
      b.setAttribute("aria-selected", on);
    });
  }
  tabs.addEventListener("click", (e) => {
    const b = e.target.closest("button[data-race]");
    if (b) paintRace(b.dataset.race);
  });
  paintRace("human");

  /* ─────────── 海图 ─────────── */
  const OWNER = {
    "人族": "#C9A961", "妖族": "#7E9E8C", "灵族": "#8FA8C8",
    "共管": "#B08C6A", "混居缓冲": "#B08C6A",
  };

  function blobPath(cx, cy, r, seed, squash = .84, jit = .3, pts = 15) {
    const rnd = mulberry(seed);
    const p = [];
    for (let i = 0; i < pts; i++) {
      const a = i / pts * Math.PI * 2;
      const rr = r * (1 - jit / 2 + rnd() * jit);
      p.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr * squash]);
    }
    let d = `M${p[0][0].toFixed(1)},${p[0][1].toFixed(1)}`;
    for (let i = 0; i < p.length; i++) {
      const p0 = p[(i - 1 + p.length) % p.length], p1 = p[i], p2 = p[(i + 1) % p.length], p3 = p[(i + 2) % p.length];
      const c1x = p1[0] + (p2[0] - p0[0]) / 6, c1y = p1[1] + (p2[1] - p0[1]) / 6;
      const c2x = p2[0] - (p3[0] - p1[0]) / 6, c2y = p2[1] - (p3[1] - p1[1]) / 6;
      d += ` C${c1x.toFixed(1)},${c1y.toFixed(1)} ${c2x.toFixed(1)},${c2y.toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`;
    }
    return d + "Z";
  }

  const mapSvg = $("#seaMap");
  const gridG = $("#grid"), curG = $("#currentLayer"), routeG = $("#routeLayer"),
        dangerG = $("#dangerLayer"), islG = $("#islandLayer");

  // 网格与范围圈
  (() => {
    let s = "";
    for (let x = 0; x <= 1200; x += 100) s += `<line class="grid-line" x1="${x}" y1="0" x2="${x}" y2="880"/>`;
    for (let y = 0; y <= 880; y += 100) s += `<line class="grid-line" x1="0" y1="${y}" x2="1200" y2="${y}"/>`;
    for (let r = 200; r <= 440; r += 120) s += `<circle class="iso" cx="612" cy="440" r="${r}"/>`;
    gridG.innerHTML = s;
  })();

  // 洋流
  curG.innerHTML = B.currents.map((c, i) =>
    `<path class="current n${i + 1}" d="${c.d}"/>
     <text class="cur-label" x="${[430, 660, 700][i]}" y="${[186, 428, 700][i]}">${c.name}</text>`
  ).join("");

  // 危险海域
  dangerG.innerHTML = `
    <ellipse class="danger-hatch" cx="620" cy="586" rx="86" ry="34"/>
    <text class="danger-label" x="620" y="572">赤华风暴带 · 禁地</text>
    <ellipse class="danger-hatch" cx="300" cy="356" rx="62" ry="26" opacity=".7"/>
    <text class="danger-label" x="300" y="344" opacity=".8">西海无风带</text>`;

  // 岛屿
  islG.innerHTML = B.islands.map((isl, i) => {
    const c = OWNER[isl.owner] || "#C9A961";
    const land = blobPath(isl.x, isl.y, isl.r, 33 + i * 17);
    const inner = blobPath(isl.x, isl.y, isl.r * .68, 71 + i * 29, .84, .22);
    return `<g class="isl" data-i="${i}" tabindex="0" role="button" aria-label="${isl.name}">
      <path class="land" d="${land}" fill="${c}" fill-opacity=".15" stroke="${c}" stroke-opacity=".62" stroke-width="1.4"/>
      <path d="${inner}" fill="${c}" fill-opacity=".07" stroke="none"/>
      <text class="isl-label" x="${isl.x}" y="${isl.y + isl.r * .84 + 20}">${isl.name}</text>
      <text class="isl-tag" x="${isl.x}" y="${isl.y + isl.r * .84 + 36}">${isl.owner} · ${isl.short}</text>
    </g>`;
  }).join("");

  // 航线
  const byId = Object.fromEntries(B.islands.map((x) => [x.id, x]));
  routeG.innerHTML = B.routes.map(([a, b, dist, time]) => {
    const A = byId[a], C = byId[b];
    if (!A || !C) return "";
    const mx = (A.x + C.x) / 2, my = (A.y + C.y) / 2 - 26;
    return `<path class="route" d="M${A.x},${A.y} Q${mx},${my} ${C.x},${C.y}"/>
      <text class="route-label" x="${mx}" y="${my - 5}">${dist} · ${time}</text>`;
  }).join("");
  routeG.style.display = "none";
  dangerG.style.display = "none";

  // 图层开关
  $$(".map-tools .chip").forEach((chip) => {
    chip.addEventListener("click", () => {
      chip.classList.toggle("is-on");
      const on = chip.classList.contains("is-on");
      const L = { currents: curG, routes: routeG, danger: dangerG }[chip.dataset.layer];
      if (L) L.style.display = on ? "" : "none";
    });
  });
  // 洋流默认开、航线险区默认关 → 修正按钮态
  $$(".map-tools .chip").forEach((c) => {
    const on = c.dataset.layer === "currents";
    c.classList.toggle("is-on", on);
  });

  // 岛屿面板
  const panel = $("#mapPanel"), mpBody = $(".mp-body", panel);
  function openIsland(i) {
    const s = B.islands[i];
    $$(".isl", islG).forEach((g) => g.classList.toggle("is-active", +g.dataset.i === i));
    mpBody.innerHTML = `
      <div class="mp-k">${s.owner} · ${s.short}</div>
      <div class="mp-name">${s.name}</div>
      <div class="mp-sub">${s.pos}</div>
      <dl style="margin:0">
        <div class="mp-row"><dt>地貌</dt><dd>${s.land}</dd></div>
        <div class="mp-row"><dt>物产</dt><dd>${s.goods}</dd></div>
        <div class="mp-row"><dt>方志</dt><dd>${s.note}</dd></div>
      </dl>
      <p class="mp-line">“${s.line}”</p>`;
    panel.hidden = false;
  }
  islG.addEventListener("click", (e) => {
    const g = e.target.closest(".isl");
    if (g) openIsland(+g.dataset.i);
  });
  islG.addEventListener("keydown", (e) => {
    if (e.key !== "Enter" && e.key !== " ") return;
    const g = e.target.closest(".isl");
    if (g) { e.preventDefault(); openIsland(+g.dataset.i); }
  });
  $("#mapClose").addEventListener("click", () => {
    panel.hidden = true;
    $$(".isl", islG).forEach((g) => g.classList.remove("is-active"));
  });

  /* ─────────── 时间线 ─────────── */
  const KEY = ["处决", "下狱", "会审", "封阳盟约", "聆霜自沉"];
  $("#timeline").innerHTML = B.timeline.map((t) => {
    const key = KEY.some((k) => t.title.includes(k)) ? " key" : "";
    return `<div class="tl-item${key}">
      <div class="tl-ym">${t.ym}</div><span class="tl-dot"></span>
      <div class="tl-body"><h3>${t.title}</h3><p>${t.text}</p></div>
    </div>`;
  }).join("");

  $("#century").innerHTML = B.century.map((c) =>
    `<article><div class="cent-y">${c.y}</div><h4>${c.t}</h4><p>${c.d}</p></article>`
  ).join("");

  /* ─────────── 人物卡 ─────────── */
  $("#charCards").innerHTML = B.chars.map((c) => `
    <article class="card" data-id="${c.id}" tabindex="0" role="button" aria-label="${c.name} 档案，点击翻面">
      <div class="card-inner">
        <div class="face front">
          <div class="c-race">${c.race} · ${c.job}</div>
          <h3 class="c-name">${c.name}</h3>
          <div class="c-en">${c.en}</div>
          <ul class="c-meta">
            <li><span>年龄</span><b>${c.age}</b></li>
            <li><span>所求 Want</span><b>${c.want}</b></li>
            <li><span>所缺 Need</span><b>${c.need}</b></li>
          </ul>
          <p class="c-line">“${c.line}”</p>
          <span class="c-flip-hint">翻 面 →</span>
        </div>
        <div class="face back">
          <div class="b-head">${c.name} · EGRi / 弧线</div>
          <dl style="margin:0">
            <div class="b-row hi"><dt>THE LIE · 他相信的谎</dt><dd>${c.lie}</dd></div>
            <div class="b-row"><dt>WOUND · 伤</dt><dd>${c.wound}</dd></div>
            <div class="b-row"><dt>ARC · 弧线</dt><dd>${c.arc}</dd></div>
            <div class="b-row"><dt>SECRET · 秘密</dt><dd>${c.secret}</dd></div>
            <div class="b-row"><dt>与冤案的勾连</dt><dd>${c.link}</dd></div>
            <div class="b-row"><dt>终局</dt><dd>${c.end}</dd></div>
          </dl>
        </div>
      </div>
    </article>`).join("");

  $$(".card").forEach((card) => {
    const flip = () => card.classList.toggle("is-flip");
    card.addEventListener("click", flip);
    card.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); flip(); } });
  });

  /* ─────────── 证物 ─────────── */
  $("#evGrid").innerHTML = B.evidence.map((e) => `
    <article class="ev" tabindex="0">
      <span class="ev-n">${e.n}</span>
      <h3>${e.name}</h3>
      <div class="ev-kind">${e.kind}</div>
      <p>${e.desc}</p>
      <div class="ev-more">
        <div class="b-row"><dt>出处</dt><dd>${e.where}</dd></div>
        <p class="ev-key">${e.key}</p>
      </div>
      <span class="ev-tap">展开</span>
    </article>`).join("");

  $$(".ev").forEach((ev) => {
    const t = () => {
      ev.classList.toggle("is-open");
      $(".ev-tap", ev).textContent = ev.classList.contains("is-open") ? "收起" : "展开";
    };
    ev.addEventListener("click", t);
    ev.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); t(); } });
  });

  /* ─────────── 十二篇全本 ─────────── */
  const inline = (s) => esc(s)
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/【([^】]{1,12})】/g, '<span class="tag">$1</span>');

  function blockHTML(b) {
    if (b.t === "p") return `<p>${inline(b.s)}</p>`;
    if (b.t === "h4") return `<div class="h4">${inline(b.s)}</div>`;
    if (b.t === "ul") return `<ul>${b.items.map((i) => `<li>${inline(i)}</li>`).join("")}</ul>`;
    if (b.t === "ol") return `<ol>${b.items.map((i) => `<li>${inline(i)}</li>`).join("")}</ol>`;
    if (b.t === "pre") return `<div class="tbl-wrap"><pre class="diagram">${esc(b.s)}</pre></div>`;
    if (b.t === "img") return `<figure class="doc-img"><img src="${b.src}" alt="${esc(b.cap || "")}">${b.cap ? `<figcaption>${esc(b.cap)}</figcaption>` : ""}</figure>`;
    if (b.t === "table") {
      const head = b.head && b.head.some(Boolean) ? `<thead><tr>${b.head.map((h) => `<th>${inline(h)}</th>`).join("")}</tr></thead>` : "";
      const rows = b.rows.map((r) => `<tr>${r.map((c) => `<td>${inline(c)}</td>`).join("")}</tr>`).join("");
      return `<div class="tbl-wrap"><table>${head}<tbody>${rows}</tbody></table></div>`;
    }
    return "";
  }

  let secCount = 0;
  const archiveBody = $("#archiveBody");
  archiveBody.innerHTML = B.pian.map((p, pi) => {
    const isApp = !p.num;
    const num = isApp ? "附" : p.num;
    const secs = p.zh.map((z, zi) => {
      const inner = z.sec.map((s, si) => {
        secCount++;
        const id = `s-${pi}-${zi}-${si}`;
        const h = s.title ? `<h4 class="secb-h" id="${id}">${inline(s.title)}</h4>` : `<div id="${id}"></div>`;
        return `<section class="secb" data-id="${id}">${h}${s.blk.map(blockHTML).join("")}</section>`;
      }).join("");
      return `<div class="zhang">${z.title ? `<h3 class="zhang-h">${inline(z.title)}</h3>` : ""}${inner}</div>`;
    }).join("");

    const notice = p.supplement
      ? `<div class="note-sup">〔补录〕本篇在原始 docx 中缺失（目录存条目，正文自第五篇直接跳至第七篇）。以下为按既有设定补写的速览稿，可增删。</div>`
      : "";

    return `<article class="pian" id="pian-${pi}" data-pian="${pi}">
      <header class="pian-h">
        <span class="pian-num">${isApp ? "附录" : "第 " + num + " 篇"}</span>
        <h2 class="pian-title">${p.title}</h2>
        <span class="pian-tools"><button class="fold" data-fold="${pi}">收起本篇</button></span>
      </header>
      ${notice}${secs}
    </article>`;
  }).join("");

  $("#archiveCount").textContent = `${B.pian.length - 1} 篇 · ${B.pian.reduce((n, p) => n + p.zh.length, 0)} 章 · ${secCount} 节 · 约 ${Math.round(document.getElementById("archiveBody").textContent.length / 1000)} 千字`;

  archiveBody.addEventListener("click", (e) => {
    const btn = e.target.closest("button.fold");
    if (!btn) return;
    const art = btn.closest(".pian");
    const folded = art.classList.toggle("is-folded");
    $$(".zhang", art).forEach((z) => (z.style.display = folded ? "none" : ""));
    btn.textContent = folded ? "展开本篇" : "收起本篇";
  });

  let allFolded = false;
  $("#foldAll").addEventListener("click", (e) => {
    allFolded = !allFolded;
    $$(".pian").forEach((a) => {
      a.classList.toggle("is-folded", allFolded);
      $$(".zhang", a).forEach((z) => (z.style.display = allFolded ? "none" : ""));
      const b = $(".fold", a);
      if (b) b.textContent = allFolded ? "展开本篇" : "收起本篇";
    });
    e.currentTarget.textContent = allFolded ? "全部展开" : "全部收起";
  });

  /* ─────────── 检索 ─────────── */
  const searchInput = $("#searchInput"), searchResult = $("#searchResult");
  const index = [];
  B.pian.forEach((p, pi) => {
    p.zh.forEach((z, zi) => {
      z.sec.forEach((s, si) => {
        const id = `s-${pi}-${zi}-${si}`;
        const head = [p.title, z.title, s.title].filter(Boolean).join(" / ");
        const text = s.blk.map((b) => b.s || (b.items || []).join(" ") || (b.head || []).join(" ") + " " + (b.rows || []).map((r) => r.join(" ")).join(" ")).join(" ");
        index.push({ id, head, text, pi });
      });
    });
  });

  let timer;
  searchInput.addEventListener("input", () => {
    clearTimeout(timer);
    timer = setTimeout(runSearch, 120);
  });
  function runSearch() {
    const q = searchInput.value.trim();
    if (q.length < 1) { searchResult.hidden = true; return; }
    const hits = index.map((it) => {
      const i = it.text.indexOf(q), j = it.head.indexOf(q);
      return { it, score: (j >= 0 ? 100 : 0) + (i >= 0 ? 20 : 0) - (i > 0 ? 0 : 0) };
    }).filter((x) => x.score > 0).slice(0, 12);

    if (!hits.length) {
      searchResult.innerHTML = `<div class="empty">没有找到「${esc(q)}」</div>`;
    } else {
      searchResult.innerHTML = hits.map(({ it }) => {
        const k = it.text.indexOf(q);
        const snip = k < 0 ? it.text.slice(0, 46) : it.text.slice(Math.max(0, k - 16), k + 44);
        return `<a href="#${it.id}" data-jump="${it.id}"><b>${esc(it.head)}</b><small>${k < 0 ? "" : "…"}${esc(snip)}…</small></a>`;
      }).join("");
    }
    searchResult.hidden = false;
  }
  searchResult.addEventListener("click", (e) => {
    const a = e.target.closest("a[data-jump]");
    if (!a) return;
    e.preventDefault();
    searchResult.hidden = true;
    searchInput.value = "";
    jumpTo(a.dataset.jump);
  });
  document.addEventListener("click", (e) => {
    if (!e.target.closest(".search")) searchResult.hidden = true;
  });
  document.addEventListener("keydown", (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
      e.preventDefault(); searchInput.focus(); searchInput.select();
    }
    if (e.key === "Escape") { searchResult.hidden = true; searchInput.blur(); closeRail(); }
  });

  function jumpTo(id) {
    const el = document.getElementById(id);
    if (!el) return;
    // 若所属篇被折叠则展开
    const art = el.closest(".pian");
    if (art && art.classList.contains("is-folded")) {
      art.classList.remove("is-folded");
      $$(".zhang", art).forEach((z) => (z.style.display = ""));
      const b = $(".fold", art); if (b) b.textContent = "收起本篇";
    }
    const y = el.getBoundingClientRect().top + scrollY - 40;
    scrollTo({ top: y, behavior: reduce ? "auto" : "smooth" });
    el.classList.remove("flash");
    void el.offsetWidth;
    el.classList.add("flash");
    setTimeout(() => el.classList.remove("flash"), 2600);
    closeRail();
  }

  /* ─────────── 目录 / 进度 / 显示 ─────────── */
  const rail = $("#rail"), menuBtn = $("#menuBtn"), scrim = $("#scrim");
  function closeRail() {
    rail.classList.remove("is-open");
    menuBtn.setAttribute("aria-expanded", "false");
    scrim.hidden = true;
  }
  menuBtn.addEventListener("click", () => {
    const open = rail.classList.toggle("is-open");
    menuBtn.setAttribute("aria-expanded", open);
    scrim.hidden = !open;
  });
  scrim.addEventListener("click", closeRail);
  $$("#nav a").forEach((a) => a.addEventListener("click", closeRail));

  const progressBar = $("#progressBar"), toTop = $("#toTop");
  function onScroll() {
    const h = document.documentElement.scrollHeight - innerHeight;
    progressBar.style.width = Math.min(100, Math.max(0, scrollY / h * 100)) + "%";
    toTop.hidden = scrollY < 900;
  }
  addEventListener("scroll", onScroll, { passive: true });
  onScroll();
  toTop.addEventListener("click", () => scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" }));

  // 滚动联动
  const spyIds = $$("#nav a").map((a) => a.dataset.spy);
  const spySections = spyIds.map((id) => document.getElementById(id)).filter(Boolean);
  const navLinks = Object.fromEntries($$("#nav a").map((a) => [a.dataset.spy, a]));
  const spy = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (!en.isIntersecting) return;
      Object.values(navLinks).forEach((a) => a.classList.remove("is-active"));
      const a = navLinks[en.target.id];
      if (a) a.classList.add("is-active");
    });
  }, { rootMargin: "-25% 0px -62% 0px" });
  spySections.forEach((s) => spy.observe(s));

  // 出现动画
  if (!reduce) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); }
      });
    }, { threshold: 0.08, rootMargin: "0px 0px -8% 0px" });
    $$(".reveal").forEach((el) => io.observe(el));
  } else {
    $$(".reveal").forEach((el) => el.classList.add("in"));
  }

  // 带锚点进入时：跳过平滑滚动，直接定位
  const hashTarget = location.hash.length > 1 ? decodeURIComponent(location.hash.slice(1)) : null;
  const qTarget = new URLSearchParams(location.search).get("at");
  const targetId = hashTarget || qTarget;
  if (targetId) {
    const el = document.getElementById(targetId);
    if (el) requestAnimationFrame(() => {
      const y = el.getBoundingClientRect().top + scrollY - 24;
      scrollTo({ top: y, behavior: "auto" });
    });
  }
})();
