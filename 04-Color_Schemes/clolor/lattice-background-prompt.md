# Lattice 官网背景色变换 · 效果拆解与提示词

> 来源：对 https://lattice.com/ 生产环境 CSS/JS 的逆向提取（2026-08）。
> 结论先行：Lattice 首页**没有 JS 驱动的背景色动画**（全站仅 3 个滚动交互，均为位移/透明度）。它的"背景色变换"由 4 个纯 CSS 技巧组合而成。

---

## 一、效果拆解（真实提取值）

### 1. 页面级基底：白 → 沙色 → 白纵向渐变

整页 `main` 容器铺一层极浅的暖灰渐变，所有内容浮在其上：

```css
main {
  background-image: linear-gradient(
    to bottom,
    #ffffff,
    #faf9f7 33%,   /* sand-50 */
    #faf9f7 66%,
    #ffffff
  );
}
```

**要点**：沙色饱和度极低（#faf9f7 几乎看不出），作用是"让白色不那么刺"，而不是制造视觉重心。

### 2. 滚动变色：圆角"盒子"区块（.box）

滚动时感受到的背景切换，来自一个个大圆角盒子区块，而不是通栏换色：

| 区块 | 背景 | 角色 |
|---|---|---|
| `.box` | `#f7f6f2`（sand-100） | 常规内容 |
| `.box.is-integrations` | `#624ee5`（purple-600） | **全页唯一深色锚点** |
| `.box.is-outro` | `#f7f6f2` | 收尾回归浅色 |

```css
.box {
  border-radius: 3.2rem;        /* 大圆角是关键 */
  background-color: #f7f6f2;
  padding: 5rem 4rem;
}
.box.is-purple { background-color: #624ee5; color: #fff; }
```

**节奏公式**：浅 → 浅 → **深（一次强对比）** → 浅。一整页只安排一个深色区块。

### 3. 彩虹流动渐变（is-rainbow，原站用在主 CTA）

全站唯一的动态颜色效果，纯 CSS 实现：

```css
.rainbow {
  --stop-1: #d0ff64;  /* 荧光绿 */
  --stop-2: #52e5ff;  /* 青 */
  --stop-3: #fbe3ff;  /* 粉 */

  background-size: 300% 100%;
  background-image: linear-gradient(
    in oklch to right,                       /* oklch 插值，过渡不发灰 */
    var(--stop-1), var(--stop-2), var(--stop-3),
    var(--stop-2), var(--stop-1)             /* 首尾同色 → 无缝循环 */
  );
  animation: rainbow 8s linear infinite;
}
@keyframes rainbow {
  to { background-position: 150%; }          /* 只移一半，配合 300% 宽度 */
}
```

三个机关缺一不可：
1. **`in oklch`**：色相较值大的颜色在 RGB 插值下中间会发灰，oklch 保持鲜艳；
2. **5 段对称停靠点**（A→B→C→B→A）：首尾同色才能无缝循环；
3. **`background-size: 300%` + 位移到 `150%`**：循环周期内画面连续无跳帧。

### 4. 粉彩渐变 token 体系（设计系统层）

全站渐变是 7 色 × 2 档浓度的 token，不是随手拉的：

```css
:root {
  /* 结构：225deg 上层 40% 透明彩色斜向罩染 + 下层实色 pastel 托底 */
  --gradient-lime-100:   linear-gradient(225deg, rgb(255 221 153 / 40%), rgb(196 245 219)), rgb(196 245 219);
  --gradient-yellow-100: linear-gradient(225deg, rgb(250 184 255 / 40%), rgb(255 243 194)), rgb(255 243 194);
  --gradient-pink-100:   linear-gradient(225deg, rgb(255 189 193 / 40%), rgb(253 229 255)), rgb(253 229 255);
  --gradient-purple-100: linear-gradient(225deg, rgb(217 173 255 / 40%), rgb(225 225 250)), rgb(225 225 250);
  --gradient-blue-100:   linear-gradient(225deg, rgb(184 184 255 / 40%), rgb(191 241 245)), rgb(191 241 245);
  --gradient-teal-100:   linear-gradient(225deg, rgb(103 226 235 / 40%), rgb(177 240 231)), rgb(177 240 231);
  --gradient-green-100:  linear-gradient(225deg, rgb(81 224 205 / 40%),  rgb(205 250 206)), rgb(205 250 206);
}
/* 50 档 = 同结构，透明度降为 20%、底色 50% 透明 */
```

---

## 二、提示词（可直接喂给 AI 生成同类效果）

### 中文版

> 为页面设计一套类似 Lattice 官网的背景色系统，要求：
>
> 1. **基底**：整页容器使用极浅暖灰的纵向渐变（白色 → #faf9f7 沙色 → 白色），饱和度极低、近乎不可察觉，只用于柔化纯白；
> 2. **滚动变色**：内容组织为大圆角（约 3rem）的内缩卡片区块而非通栏色带，各区块使用不同的粉彩色背景（如 #f7f6f2、#eff5ce、#cdface），滚动时自然形成背景色切换；整页只安排**一个**深色高对比区块（如 #624ee5 深紫）作为视觉锚点，节奏为"浅→浅→深→浅"；
> 3. **动态渐变**：需要一个无限循环的彩虹流动渐变——用 `linear-gradient(in oklch, ...)` 在 oklch 色彩空间插值，5 个对称色标首尾同色（荧光绿 #d0ff64 → 青 #52e5ff → 粉 #fbe3ff → 青 → 绿），`background-size: 300% 100%`，用 keyframes 把 `background-position` 线性移到 150%，周期约 8 秒，实现无缝循环；
> 4. **渐变 token 化**：所有渐变定义为 CSS 自定义属性，统一采用"225deg、上层 40% 透明彩色罩染 + 下层实色 pastel 托底"的双层结构，按色相 × 浓度（50/100）两维成体系；
> 5. 整体气质：浅色、高明度、低饱和的 pastel 粉彩系，干净、友好、企业级 SaaS 感。

### 英文版

> Design a Lattice.com-style background color system for the page:
>
> 1. **Base layer**: a barely-perceptible vertical gradient on the page container (white → #faf9f7 warm sand → white) — extremely low saturation, only to soften pure white;
> 2. **Scroll-driven color shifts**: organize content as inset card sections with large border-radius (~3rem) instead of full-bleed bands; give each section a different pastel background (#f7f6f2, #eff5ce, #cdface…); include exactly **one** dark high-contrast section (e.g. #624ee5 purple) as a visual anchor, in a "light → light → dark → light" rhythm;
> 3. **Animated rainbow gradient**: an infinite flowing gradient using `linear-gradient(in oklch, ...)` with 5 symmetric stops where first and last colors match (#d0ff64 lime → #52e5ff cyan → #fbe3ff pink → cyan → lime), `background-size: 300% 100%`, and a keyframe animating `background-position` linearly to 150% over ~8s for a seamless loop;
> 4. **Tokenized gradients**: define all gradients as CSS custom properties with a consistent two-layer structure — a 225deg semi-transparent (40%) color wash over a solid pastel base — organized across hue × intensity (50/100);
> 5. Overall feel: light, high-key, low-saturation pastels; clean, friendly, enterprise SaaS aesthetic.

---

## 三、速查表

| 技巧 | 一句话原理 |
|---|---|
| 页面基底 | `white → sand-50(#faf9f7) → white` 纵向渐变，低饱和柔化 |
| 滚动变色 | 大圆角盒子区块（3.2rem radius）+ 粉彩底色 + 全页仅一个深色锚点 #624ee5 |
| 彩虹流动 | oklch 插值 + 首尾同色 5 段停靠 + 300% 背景宽 + position 移 150% + 8s 线性循环 |
| 渐变 token | 225deg 双层：40% 透明彩色罩染 / 实色 pastel 托底，7 色 × 2 档 |

**配套演示**：`lattice-background-demo.html`（同目录，浏览器直接打开即可看到全部 4 种效果）。
