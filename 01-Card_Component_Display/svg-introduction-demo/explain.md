# Design.md — 产品介绍版块设计提示词

> 参考站点：**<https://www.jasper.ai/**> → 首屏 "The Jasper Platform" 下方 "Agents / Content Pipelines / Jasper IQ" 三张卡片。
> 用途：作为提示词，让 AI / 前端 / 设计师按照本文档的规范，复刻或改版该版块。
> 本次改版目标：把 3 张卡片扩展为 4 张，对应 **Agent（智能体）/ Workflow（工作流）/ Robot（机器人）/ Web（网页）** 四个产品方向。

---

## 0. 复刻要点速览（先看这个）

| 维度                 | 原站做法                             | 我们要怎么做                                            |
| -------------------- | ------------------------------------ | ------------------------------------------------------- |
| 整体结构             | 1 行 3 列的等宽卡片                  | 1 行 **4 列**等宽卡片，移动端 2×2 → 1×1                 |
| 卡片比例             | 接近 1:1 方形                        | 维持 1:1 方形                                           |
| 背景色               | 绿 / 粉 / 蓝 三个低饱和浅色          | 绿 / 粉 / 蓝 / **紫** 四个低饱和浅色                    |
| 网格底纹             | CSS 线性渐变生成的方格本图案         | 同样用 CSS `background-image` 双层 linear-gradient      |
| 中央插图             | **内联 SVG** 几何线稿                | 同样全部用 **内联 SVG**，无需导出图片素材               |
| 标题字体             | 衬线体（DM Serif Display 风格）      | Google Fonts: **DM Serif Display** 或 **Fraunces**      |
| 描述字体             | 粗体无衬线                           | Inter / 思源黑体 Bold                                   |
| 交互动效             | 入场淡入上滑、悬停轻微上浮、插图漂浮 | 全部用 **CSS + Framer Motion（React）或 AOS（静态页）** |
| 是否需要准备位图素材 | **完全不需要**                       | **完全不需要**                                          |

> **结论：你不需要准备任何位图素材。所有插图都用内联 SVG 现写，字体走 Google Fonts 即可。**

---

## 1. 版块整体结构（HTML 骨架）

```html
<section class="product-cards">
  <div class="product-grid">
    <a class="card card--green" href="/agent">
      <h3 class="card__title">Agent</h3>
      <div class="card__art">
        <!-- 内联 SVG：智能体 -->
      </div>
      <p class="card__desc">智能体驱动的自动化执行单元。</p>
      <span class="card__arrow" aria-hidden="true">→</span>
    </a>

    <a class="card card--pink" href="/workflow">
      <h3 class="card__title">Workflow</h3>
      <div class="card__art"><!-- SVG：工作流节点 --></div>
      <p class="card__desc">可视化编排，端到端的任务流转。</p>
      <span class="card__arrow">→</span>
    </a>

    <a class="card card--blue" href="/robot">
      <h3 class="card__title">Robot</h3>
      <div class="card__art"><!-- SVG：机器人 / 机械臂 --></div>
      <p class="card__desc">RPA + AI 的执行机器人。</p>
      <span class="card__arrow">→</span>
    </a>

    <a class="card card--purple" href="/web">
      <h3 class="card__title">Web</h3>
      <div class="card__art"><!-- SVG：浏览器窗口 --></div>
      <p class="card__desc">网页与 SaaS 化交付界面。</p>
      <span class="card__arrow">→</span>
    </a>
  </div>
</section>
```

> 用 `<a>` 而不是 `<div>`：整张卡片可点击，符合 Jasper 站点的"卡片即入口"交互。

---

## 2. CSS 实现（重点）

### 2.1 容器与栅格

```css
.product-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);   /* 桌面端 4 列 */
  gap: 16px;                              /* Jasper 用约 12–20px */
  max-width: 1280px;                      /* 内容最大宽度 */
  margin: 0 auto;
  padding: 0 24px;
}

@media (max-width: 1024px) { .product-grid { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 640px)  { .product-grid { grid-template-columns: 1fr; } }
```

### 2.2 卡片本体（核心：网格底纹）

Jasper 卡片那种"笔记本方格"效果**完全靠 CSS 渐变生成**，无需图片：

```css
.card {
  position: relative;
  aspect-ratio: 1 / 1;                   /* 关键：方形 */
  border-radius: 20px;
  padding: 32px;
  overflow: hidden;
  text-decoration: none;
  color: inherit;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  transition: transform .35s cubic-bezier(.2,.7,.2,1),
              box-shadow .35s cubic-bezier(.2,.7,.2,1);
  background-color: var(--bg);            /* 见 2.3 调色板 */
  background-image:
    linear-gradient(to right,  rgba(0,0,0,.10) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(0,0,0,.10) 1px, transparent 1px);
  background-size: 28px 28px;             /* 方格尺寸，约 24–32px 都可以 */
  background-position: -1px -1px;         /* 让边框对齐到像素 */
}

.card:hover {
  transform: translateY(-6px);
  box-shadow: 0 20px 40px -20px rgba(0,0,0,.18);
}
```

> **关键参数**：`background-size: 28px 28px` 决定网格密度；`rgba(0,0,0,.10)` 决定线深浅，可按需在 0.06–0.14 之间调。

### 2.3 4 个分类的配色（Hex 推荐）

| 卡片         | 背景           | 网格线                | 插图主色       | 标题色    | 描述色    |
| ------------ | -------------- | --------------------- | -------------- | --------- | --------- |
| **Agent**    | `#D6F2D4` 草绿 | `rgba(20,80,20,.18)`  | `#0E3A12` 深绿 | `#0A1F2C` | `#0A1F2C` |
| **Workflow** | `#FBDBD3` 樱粉 | `rgba(120,30,30,.18)` | `#9A1F1A` 朱红 | `#0A1F2C` | `#0A1F2C` |
| **Robot**    | `#D7E8FB` 天蓝 | `rgba(20,40,90,.18)`  | `#0E2A6B` 深蓝 | `#0A1F2C` | `#0A1F2C` |
| **Web**      | `#E5DCFB` 雾紫 | `rgba(50,20,110,.18)` | `#3A1E8C` 靛紫 | `#0A1F2C` | `#0A1F2C` |

定义变量后用 `--bg` 写到每张卡：

```css
.card--green  { --bg: #D6F2D4; --ink: #0E3A12; }
.card--pink   { --bg: #FBDBD3; --ink: #9A1F1A; }
.card--blue   { --bg: #D7E8FB; --ink: #0E2A6B; }
.card--purple { --bg: #E5DCFB; --ink: #3A1E8C; }
```

### 2.4 文字样式

```css
.card__title {
  font-family: "DM Serif Display", "Source Serif Pro", "Songti SC", serif;
  font-size: clamp(28px, 2.4vw, 40px);
  font-weight: 400;                       /* 衬线体常配 400 */
  line-height: 1.1;
  letter-spacing: -0.01em;
  color: #0A1F2C;
  margin: 0;
}

.card__desc {
  font-family: "Inter", "PingFang SC", "Microsoft YaHei", sans-serif;
  font-size: 14px;
  font-weight: 600;
  line-height: 1.4;
  max-width: 22ch;                        /* 防止描述过长破坏比例 */
  margin: 0;
}

.card__arrow {
  position: absolute;
  right: 28px;
  bottom: 28px;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: rgba(0,0,0,.06);
  display: grid;
  place-items: center;
  font-size: 16px;
  transition: transform .35s cubic-bezier(.2,.7,.2,1), background .25s;
}

.card:hover .card__arrow { transform: translateX(6px); background: rgba(0,0,0,.12); }
```

### 2.5 插图区

```css
.card__art {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  pointer-events: none;                   /* 避免抢点击 */
}

.card__art svg {
  width: 60%;
  height: auto;
  /* 入场 + 漂浮动效见第 3 节 */
}
```

---

## 3. 动效（关键：原站做得很克制，我们要复刻这种"高级感"）

### 3.1 入场：滚动到视口时淡入 + 上滑

**方案 A — 纯 CSS（Intersection Observer 触发 class）**：

```css
.card { opacity: 0; transform: translateY(24px); }
.card.is-visible { opacity: 1; transform: translateY(0); transition: all .7s cubic-bezier(.2,.7,.2,1); }
.card:nth-child(1).is-visible { transition-delay: 0ms;   }
.card:nth-child(2).is-visible { transition-delay: 80ms;  }
.card:nth-child(3).is-visible { transition-delay: 160ms; }
.card:nth-child(4).is-visible { transition-delay: 240ms; }
```

```js
const io = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add('is-visible');
      io.unobserve(e.target);
    }
  });
}, { threshold: 0.2 });
document.querySelectorAll('.card').forEach(c => io.observe(c));
```

**方案 B — React 项目用 Framer Motion**：

```jsx
<motion.a
  className="card card--green"
  initial={{ opacity: 0, y: 24 }}
  whileInView={{ opacity: 1, y: 0 }}
  viewport={{ once: true, amount: 0.2 }}
  transition={{ duration: 0.7, ease: [0.2, 0.7, 0.2, 1], delay: i * 0.08 }}
/>
```

### 3.2 插图漂浮（持续微动）

Jasper 卡片里的几何元素有非常轻微的"漂浮"或"呼吸"效果。给 SVG 内部元素加 CSS 动画：

```css
@keyframes float-y {
  0%,100% { transform: translateY(0); }
  50%     { transform: translateY(-6px); }
}
@keyframes float-rot {
  0%,100% { transform: rotate(-3deg); }
  50%     { transform: rotate(3deg); }
}

.float-y   { animation: float-y   4.5s ease-in-out infinite; transform-origin: center; }
.float-rot { animation: float-rot 6s   ease-in-out infinite; transform-origin: center; }
```

把 `.float-y` / `.float-rot` 加到 SVG 内部的 `<g>` 分组上（不同元素错峰 delay），就能复刻那种"小元素在轻轻动"的感觉。

### 3.3 网格底纹的"滚动"动效（可选加分项）

让方格背景非常缓慢地平移，强化"网格本"质感：

```css
.card--green,
.card--pink,
.card--blue,
.card--purple {
  background-attachment: scroll;
  animation: grid-drift 30s linear infinite;
}
@keyframes grid-drift {
  from { background-position: -1px -1px; }
  to   { background-position: 27px 27px; }   /* 一个周期的方格尺寸 */
}
@media (prefers-reduced-motion: reduce) { .card { animation: none; } }
```

> 注意：原站其实没做这个，是可选的"看起来更高级"的锦上添花。

### 3.4 悬停时的细节

| 元素         | 动效                                           |
| ------------ | ---------------------------------------------- |
| 卡片本体     | `translateY(-6px)` + 阴影                      |
| 标题         | 颜色不变（保持可读性）                         |
| 中央 SVG     | 整体 `scale(1.04)` 放大、轻微 `rotate(0.5deg)` |
| 右下箭头圆圈 | `translateX(6px)` + 背景加深                   |

```css
.card:hover .card__art svg { transform: scale(1.04) rotate(.5deg); transition: transform .6s cubic-bezier(.2,.7,.2,1); }
```

### 3.5 无障碍

```css
@media (prefers-reduced-motion: reduce) {
  .card, .card__art svg, .card__arrow { animation: none !important; transition: none !important; }
  .card:hover { transform: none; }
}
```

---

## 4. 4 个分类的内联 SVG 草图

每个插图都是 ~120×120 viewBox，2–3 种描边/填充色。下面是**可直接复制**的初版线稿（外框用卡片主色 `--ink`，高亮块用卡片背景同色但加深 30%）。

### 4.1 Agent（智能体）— 用绿卡片

> 设计思路：**直接借鉴 Jasper.ai 原站 Agents 卡的视觉**——三个错落文档（一个带笑脸 + 绿色方块角标），周围散落深绿色装饰（三角、星、加号、小星），整体是"文档集群 + 灵动点缀"的 AI 智能体意象。

```svg
<svg viewBox="0 0 120 120" fill="none" stroke="var(--ink, #0E3A12)" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
  <!-- 文档 1：左上，纯文字行 -->
  <g class="float-y">
    <rect x="22" y="22" width="26" height="34" rx="2"/>
    <line x1="28" y1="30" x2="42" y2="30"/>
    <line x1="28" y1="36" x2="42" y2="36"/>
    <line x1="28" y1="42" x2="38" y2="42"/>
    <line x1="28" y1="48" x2="40" y2="48"/>
  </g>

  <!-- 文档 2：中右，带笑脸 + 右上角小绿色方块 -->
  <g class="float-y" style="animation-delay:.2s">
    <rect x="54" y="18" width="26" height="40" rx="2" fill="#9CD49A" fill-opacity=".55"/>
    <rect x="74" y="18" width="6" height="6" fill="var(--ink,#0E3A12)" stroke="none"/>
    <circle cx="62" cy="36" r="1.5" fill="var(--ink,#0E3A12)" stroke="none"/>
    <circle cx="72" cy="36" r="1.5" fill="var(--ink,#0E3A12)" stroke="none"/>
    <path d="M60 44 Q67 50 74 44"/>
  </g>

  <!-- 文档 3：右下小文档，纯文字行 -->
  <g class="float-y" style="animation-delay:.4s">
    <rect x="58" y="68" width="22" height="14" rx="2"/>
    <line x1="62" y1="73" x2="76" y2="73"/>
    <line x1="62" y1="77" x2="72" y2="77"/>
  </g>

  <!-- 装饰：实心三角（左上） -->
  <polygon class="float-y" style="animation-delay:.1s" points="14,28 24,30 16,38" fill="var(--ink,#0E3A12)" stroke="none"/>
  <!-- 装饰：实心三角/光标（中下，笑脸文档下方） -->
  <polygon class="float-y" style="animation-delay:.3s" points="46,72 56,72 51,82" fill="var(--ink,#0E3A12)" stroke="none"/>
  <!-- 装饰：八角星描边（左下） -->
  <path class="float-y" style="animation-delay:.5s"
        d="M 28 78 L 30 82 L 34 84 L 30 86 L 28 90 L 26 86 L 22 84 L 26 82 Z"
        fill="none" stroke="var(--ink,#0E3A12)" stroke-width="1.4"/>
  <!-- 装饰：加号（中下） -->
  <path class="float-y" style="animation-delay:.6s"
        d="M 42 86 v 6 M 39 89 h 6"
        stroke="var(--ink,#0E3A12)" stroke-width="1.8" fill="none"/>
  <!-- 装饰：小星（右中） -->
  <path class="float-y" style="animation-delay:.7s"
        d="M 88 48 L 89.2 50.4 L 91.8 50.7 L 90 52.5 L 90.4 55.1 L 88 53.9 L 85.6 55.1 L 86 52.5 L 84.2 50.7 L 86.8 50.4 Z"
        fill="var(--ink,#0E3A12)" stroke="none"/>
</svg>
```

### 4.2 Workflow（工作流）— 用粉卡片

> 设计思路：**直接借鉴 Jasper.ai 原站 Content Pipelines 卡**——两个圆角矩形节点（输入 → 处理）+ 中间箭头串联 + 末端红色实心三角（"运行/播放"按钮）。
>
> **关键修复：错位 + 不连贯问题**——
> 1. 旧版两个框分别落在上下不同高度、连接线还"右→下→左"扎进右框内部，看起来错位。新版让**所有节点共用同一条水平基线 `y=61`**，箭头在两个框之间干净连接，绝不扎进框内。
> 2. 整张流程图（两个框 + 两条箭头）放进**同一个 `<g class="float-y">` 整体浮动**；只有末端的红色三角单独 float 当装饰。节点与连线永远相对静止、不会脱节。

```svg
<svg viewBox="0 0 120 120" fill="none" stroke="var(--ink, #9A1F1A)" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
  <!-- 整张流程图作为一个组整体浮动；所有节点共用同一条水平基线 y=61，箭头在框间干净连接，绝不扎进框内 -->
  <g class="float-y">
    <!-- 节点 1：输入（圆角矩形 + 文字行） -->
    <rect x="10" y="50" width="24" height="22" rx="3"/>
    <line x1="15" y1="57" x2="29" y2="57"/>
    <line x1="15" y1="63" x2="25" y2="63"/>

    <!-- 箭头 1：输入 → 处理 -->
    <line x1="36" y1="61" x2="46" y2="61"/>
    <polyline points="41,57 47,61 41,65"/>

    <!-- 节点 2：处理（圆角矩形 + 文字行） -->
    <rect x="46" y="50" width="24" height="22" rx="3"/>
    <line x1="51" y1="57" x2="65" y2="57"/>
    <line x1="51" y1="63" x2="61" y2="63"/>

    <!-- 箭头 2：处理 → 运行 -->
    <line x1="72" y1="61" x2="82" y2="61"/>
    <polyline points="77,57 83,61 77,65"/>
  </g>

  <!-- 红色实心三角：运行/播放按钮，独立装饰，单独 float -->
  <polygon class="float-y" style="animation-delay:.5s"
           points="92,52 92,70 108,61"
           fill="var(--ink,#9A1F1A)" stroke="none"/>
</svg>
```

### 4.3 Robot（机器人）— 用蓝卡片

```svg
<svg viewBox="0 0 120 120" fill="none" stroke="var(--ink, #0E2A6B)" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
  <!-- 头部 -->
  <g class="float-y">
    <rect x="40" y="30" width="40" height="34" rx="8"/>
    <rect x="50" y="40" width="20" height="12" rx="2" fill="#9FB9E8" fill-opacity=".55"/>
    <circle cx="56" cy="46" r="1.6" fill="var(--ink, #0E2A6B)" stroke="none"/>
    <circle cx="64" cy="46" r="1.6" fill="var(--ink, #0E2A6B)" stroke="none"/>
  </g>
  <!-- 天线 -->
  <line x1="60" y1="30" x2="60" y2="22"/>
  <circle cx="60" cy="20" r="2.5" fill="var(--ink, #0E2A6B)" stroke="none"/>
  <!-- 身体 -->
  <g class="float-y" style="animation-delay:.4s">
    <rect x="32" y="68" width="56" height="28" rx="6"/>
    <line x1="40" y1="78" x2="80" y2="78"/>
    <circle cx="48" cy="86" r="2" fill="var(--ink, #0E2A6B)" stroke="none"/>
    <circle cx="60" cy="86" r="2" fill="var(--ink, #0E2A6B)" stroke="none"/>
    <circle cx="72" cy="86" r="2" fill="var(--ink, #0E2A6B)" stroke="none"/>
  </g>
  <!-- 装饰小三角 -->
  <polygon points="20,80 28,82 24,90" fill="var(--ink, #0E2A6B)" stroke="none"/>
  <polygon points="92,40 100,42 96,50" fill="var(--ink, #0E2A6B)" stroke="none"/>
</svg>
```

### 4.4 Web（网页）— 用紫卡片

```svg
<svg viewBox="0 0 120 120" fill="none" stroke="var(--ink, #3A1E8C)" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
  <!-- 浏览器窗口 -->
  <g class="float-y">
    <rect x="18" y="28" width="84" height="60" rx="6"/>
    <line x1="18" y1="40" x2="102" y2="40"/>
    <!-- 标题栏三个圆点 -->
    <circle cx="26" cy="34" r="1.6" fill="var(--ink, #3A1E8C)" stroke="none"/>
    <circle cx="32" cy="34" r="1.6" fill="var(--ink, #3A1E8C)" stroke="none"/>
    <circle cx="38" cy="34" r="1.6" fill="var(--ink, #3A1E8C)" stroke="none"/>
    <!-- 页面里的色块 -->
    <rect x="26" y="50" width="22" height="14" rx="2" fill="#B7A4E8" fill-opacity=".6"/>
    <line x1="52" y1="52" x2="94" y2="52"/>
    <line x1="52" y1="58" x2="84" y2="58"/>
    <line x1="52" y1="64" x2="90" y2="64"/>
  </g>
  <!-- 装饰：小三角与小方块漂浮 -->
  <g class="float-y" style="animation-delay:.5s">
    <polygon points="92,14 100,16 96,24" fill="var(--ink, #3A1E8C)" stroke="none"/>
    <rect x="14" y="94" width="10" height="10" rx="2" fill="var(--ink, #3A1E8C)" stroke="none" transform="rotate(15 19 99)"/>
  </g>
  <!-- 光标点击点 -->
  <g class="float-y" style="animation-delay:.2s">
    <path d="M88 78 l4 10 l-3 -1 l-1 3 z" fill="var(--ink, #3A1E8C)" stroke="none"/>
  </g>
</svg>
```

> 上面 4 段 SVG 都是 1:1 viewBox，描边色用 `var(--ink)` 与卡片主色联动，背景填色统一用主色低透明度，制造"线稿 + 色块"层次感。

---

## 5. 你需要准备的素材清单

| 项            | 需要准备吗 | 来源 / 备注                                                                                            |
| ------------- | ---------- | ------------------------------------------------------------------------------------------------------ |
| 插图（4 张）  | **不需要** | 用本文档第 4 节的 SVG 直接落地                                                                         |
| 字体          | **不需要** | Google Fonts: DM Serif Display + Inter；中文用系统默认"思源宋体 / 思源黑体"或 PingFang/Microsoft YaHei |
| 图标（箭头）  | **不需要** | 用一个 Unicode 箭头 `→` 或内联 SVG                                                                     |
| 背景图 / 纹理 | **不需要** | 全部用 CSS 渐变                                                                                        |
| 真实图片      | **不需要** | 这是抽象版块                                                                                           |
| 品牌色        | **需要**   | 如果你已有 VI 色，把第 2.3 节的 4 个 Hex 换成你的色即可                                                |

**唯一需要你确认的**：4 个分类是否就是 Agent / Workflow / Robot / Web？是否要把"Robot"改成"机器人"中文？描述文案是否要替换为你自己的产品描述？

---

## 6. 一句话给 AI 的精简提示词

> 帮我用 HTML + CSS + 少量 JS 实现一个"4 张方形卡片"的产品介绍版块，模仿 Jasper.ai 风格。
> 要求：1) CSS Grid 4 列响应式；2) 每张卡片 1:1 方形，浅色背景 + CSS 渐变生成的方格底纹；3) 标题用 DM Serif Display 衬线体，描述用 Inter 粗体；4) 中央插图全部内联 SVG，几何线稿风格；5) 滚动到视口用 Intersection Observer 触发淡入上滑（错峰 80ms），hover 时卡片上浮、插图轻微放大、右下箭头右移；6) 配色用绿/粉/蓝/紫四套低饱和色，每张卡片插图主色与卡片主色一致；7) 整张卡片是一个 `<a>` 链接；8) 支持 `prefers-reduced-motion`。
> 4 个分类分别是：Agent（智能体）、Workflow（工作流）、Robot（机器人）、Web（网页）。

---

## 7. 文件结构建议

```text
src/
  components/
    ProductCards/
      index.html          # 或 index.tsx
      styles.css
      icons/
        Agent.svg
        Workflow.svg
        Robot.svg
        Web.svg           # 建议也单独存一份，方便复用
  pages/
    index.html            # 引入 ProductCards
```

---

## 8. 验收 Checklist

- [ ] 桌面端 4 列，平板 2 列，手机 1 列
- [ ] 卡片 1:1 方形，圆角 ~20px
- [ ] 方格底纹是 CSS 生成（非图片）
- [ ] 标题是衬线体，描述是无衬线粗体
- [ ] 4 张插图都是内联 SVG
- [ ] 入场：错峰淡入上滑
- [ ] hover：卡片上浮 + 插图微放大 + 箭头右移
- [ ] 整卡可点击
- [ ] 开启 `prefers-reduced-motion` 时关闭所有动效
- [ ] Lighthouse 性能 ≥ 90（无图片资源，基本能满分）

---

_文档版本：v1.0 · 参考站：<https://www.jasper.ai/> · 截取时间：2026-07-30_
