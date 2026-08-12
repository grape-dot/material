# 素材库总览 README

> 本目录是一个**前端 UI 演示 + AI 绘图提示词**的素材库。
> 内容由多个独立小项目组成，每个项目通常包含「设计/提示词文档（.md/.txt）+ 可运行 Demo（.html）/ 参考图」。
> 已按**功能主题**分组到 4 个分类文件夹下，并由用户统一改成了英文 slug 命名。

---

## 〇、最近新增（相对上一版整理）

- `02-Motion_Effects_and_Animation` 下新增三个子项目：
  - `page-navigation-style/`：复刻 airbagstudio 首页「滚动驱动的原位切换」盒子，沉淀了 **cuboid-v1 / v2 / v3** 三个可运行版本（并自带 README）。
  - `ripple-style/`：基于 airbagstudio 研究的「涟漪 Hero」单页 Demo，含 PolySans 字体与研究源码快照。
  - `top-navigation-bar/`：**空占位目录**，等待填充顶部导航栏相关素材。
- 根目录旧版提到的 `顶部` 空壳目录已彻底移除（原先因进程占用句柄无法删除，现已解决）。

---

## 一、目录结构（整理后）

```
D:\material\
├── README.md
├── 01-Card_Component_Display\     ← 可复用的卡片/网格/展示 UI 组件
│   ├── 3d-display-booth\          （原「3d展示棚」，占位，待填充）
│   ├── card-swap-demo\            （React+GSAP 卡片交错轮播，已精简为单文件 HTML）
│   ├── customer-showcase-demo\    （原「案列介绍卡片」，Outseta 客户案例区）
│   ├── interactive-3D-mouse-demo\ （原「3d鼠标交互展示」，Half of Eight 鼠标跟随 3D 卡片）
│   └── svg-introduction-demo\     （原「产品介绍卡片展示」，Jasper 产品版块）
├── 02-Motion_Effects_and_Animation\  ← 独立动画 / 滚动展示 / 顶部 Hero
│   ├── film-style\                （原「胶卷」）
│   ├── intro-animation-style\     （原「顶部」，linkinwise 字样 Hero 研究 + Streamtime 整站参考）
│   │   ├── linkinwise-first\      （初版）
│   │   ├── linkwise-all\          （完整版 / Streamtime 整站导出）
│   │   └── linkwise-end\          （终版）
│   ├── moving-car-style\          （原「小车动画」）
│   ├── page-navigation-style\     （airbagstudio 滚动切换复刻，cuboid v1/v2/v3）
│   │   ├── cuboid-v1\             （原生 HTML + GSAP：长方体绕轴旋转）
│   │   ├── cuboid-v2\             （Next.js + TS + GSAP：翻页式，完整工程）
│   │   └── cuboid-v3\             （原生 HTML + GSAP：翻页式纯重写）
│   ├── ripple-style\              （airbagstudio 涟漪 Hero 研究 + 单页 Demo）
│   └── top-navigation-bar\        （空占位，待填充）
├── 03-AI_Prompts\                 ← 文生图风格提示词
│   ├── Kimi-Archive-style\        （原「poster-prompt」，Kimi Archive 档案美学）
│   └── antiquity-style\           （原「prompt」，复古中文海报 / 古典水墨）
└── 04-Color_Schemes\              ← 品牌配色资产
    └── clolor-base\               （原「clolor / 配色库」）
```

---

## 二、"相似但实现不同"的对比（重点归纳）

你提到"类似的可复用但实现效果不一致我也分开整理了"，核心有 6 组：

### 1. 卡片展示四兄弟（同一类需求，复刻对象/交互各不相同）—— 现同属 `01-Card_Component_Display`
| 文件夹 | 复刻对象 | 视觉/交互差异 | 文档 |
| --- | --- | --- | --- |
| `customer-showcase-demo` | Outseta 客户案例区 | 奶油黄渐变 + 手写体注释 + Tab 分类 + 悬停上浮 | `explain.md` |
| `svg-introduction-demo` | Jasper.ai 产品版块 | 绿/粉/蓝/紫 4 张 1:1 方形卡 + CSS 方格底纹 + 内联 SVG | `explain.md` |
| `interactive-3D-mouse-demo` | Half of Eight Journal | 暗色网格 + 卡片实时"注视"鼠标 + 三级交互 | `shows.md` |
| `card-swap-demo` | 通用卡片轮播组件 | React+GSAP 堆叠交错轮播（已精简为单文件 `card-swap.html`） | — |

### 2. 胶卷（同一需求，多版本实现）—— 现位于 `02-Motion_Effects_and_Animation/film-style`
- `image/tilt.png`（倾斜）、`image/tile.png`（平铺）、`image/bending.png`（弯曲）、`image/model.png`（模板）：胶卷视觉的 4 个变体截图。
- `胶卷展示页.html`：当前 Demo 是**弯曲 3D 胶卷**（提示词 `prompt.md` 已要求改"平铺"版，但 Demo 仍为弯曲版 —— 实现落后于需求）。
- `image/material.jpg`：富士胶卷（FUJI RDR）风格参考。

### 3. 顶部 Hero 研究（同一"品牌字样"主题，多版本）—— 现位于 `02-Motion_Effects_and_Animation/intro-animation-style`
| 子文件夹 | 内容 | 关系 |
| --- | --- | --- |
| `linkinwise-first` | 自建版 linkinwise 字样 Hero（字母+积木方块动画） | 初版 |
| `linkwise-end` | linkinwise 字样 Hero 精修版（更贴近原站） | 同上站点的终版 |
| `linkwise-all` | Streamtime.net 整站源码导出（Webflow） | 另一个站点的完整参考 |

### 4. AI 海报提示词（同是"文生图风格提示词"，美学方向不同）
- `03-AI_Prompts/antiquity-style/`：**复古中文海报 / 古典水墨卷轴 × 现代杂志**（东方、留白、水墨）。
- `03-AI_Prompts/Kimi-Archive-style/`：**Kimi Archive 档案美学**（未来创意机构、静物俯拍、淡灰绿）。

### 5. 页面滚动切换三兄弟（同一"滚动驱动原位切换"需求，机制/技术栈不同）—— `02-Motion_Effects_and_Animation/page-navigation-style`
| 版本 | 文件夹 | 技术栈 | 切换机制 |
| --- | --- | --- | --- |
| v1 长方体旋转 | `cuboid-v1/` | 原生 HTML + GSAP（本地库） | 4 面板围成 `preserve-3d` 长方体，随滚动整体绕轴旋转，4 面依次转正 |
| v2 翻页式 | `cuboid-v2/` | Next.js (App Router) + TS + GSAP | 当前页绕上边缘掀起、下一页绕下边缘从底部翻转出现（`page-turn`） |
| v3 翻页式(HTML) | `cuboid-v3/` | 原生 HTML + GSAP（本地库） | 同 v2 翻页逻辑，纯 HTML 重写，便于直接打开 |

三个版本共用 4 个面板文案（向原站 airbagstudio 致敬）：
1. **We don't worry about change** — 玫红深底
2. **Our route into the future** — 米灰浅底
3. **Design meets technology** — 暗色
4. **Built to move forward** — 亮色

### 6. 涟漪 Hero（独立单页 Demo）—— `02-Motion_Effects_and_Animation/ripple-style`
- 基于 airbagstudio 研究产出的「涟漪/水波 Hero」单页 Demo（`index.html` 自包含，含 PolySans 字体与研究源码快照），与上面 cuboid 系列同源但呈现不同的首屏表达。

---

## 三、逐文件说明

### `01-Card_Component_Display/customer-showcase-demo/`
| 文件 | 说明 |
| --- | --- |
| `explain.md` | 提示词文档：复刻 Outseta 首页"See what our customers are building"客户案例区。含视觉结构、手写体注释、Tab 导航、卡片规格、入场/Tab 切换/悬停动效、素材清单、技术栈建议、可直接喂给 AI 的代码提示。 |
| `index.html` | 按提示词生成的可运行案例展示组件（Tab 分类 + 3 卡片 + 左右手写体注释 + 悬停上浮）。 |

### `01-Card_Component_Display/svg-introduction-demo/`
| 文件 | 说明 |
| --- | --- |
| `explain.md` | 提示词文档：复刻 Jasper.ai 产品版块（Agent / Workflow / Robot / Web 4 张方形卡）。含 CSS Grid 4 列响应式、CSS 渐变方格底纹、4 套内联 SVG 插图、DM Serif Display 衬线标题、IntersectionObserver 错峰入场、`prefers-reduced-motion`、验收 Checklist。 |
| `index.html` | 按提示词生成的可运行产品卡片版块。 |

### `01-Card_Component_Display/interactive-3D-mouse-demo/`
| 文件 | 说明 |
| --- | --- |
| `shows.md` | 设计解析文档：逆向分析 halfof8.com/journal 的"页面随鼠标旋转角度"3D 卡片网格，含实现原理、`lookAt` 等价复现、参数速查、三级交互（网格→横排→详情）、真实图片接入机制。 |
| `shows-demo.html` | 可运行单文件 Demo：12 张卡片鼠标跟随倾斜、点击转横排、再点弹详情、待开发卡显示"敬请期待"、入场纵深动画、双语导航。开箱即用。 |

### `01-Card_Component_Display/card-swap-demo/` （卡片轮播/交错组件）
| 文件 | 说明 |
| --- | --- |
| `card-swap.html` | 已精简的**单文件**卡片交错轮播 Demo（原先为 React+GSAP 工程，现合并为可直接双击打开的 HTML）。若需原始工程版（含 `src/CardSwap.tsx`、`node_modules`），可参考上一版归档或重新 `npm create`。 |

### `01-Card_Component_Display/3d-display-booth/` （原「3d展示棚」）
| 文件 | 说明 |
| --- | --- |
| _（当前为空/占位）_ | 3D 展示棚创意的占位目录，已归入卡片类，等待填充内容。 |

---

### `02-Motion_Effects_and_Animation/moving-car-style/` （原「小车动画」）
| 文件 | 说明 |
| --- | --- |
| `car-animation.html` | 小车行驶动画单文件 Demo（纯 HTML/CSS/JS，无依赖）。 |

### `02-Motion_Effects_and_Animation/film-style/` （原「胶卷」）
| 文件 | 说明 |
| --- | --- |
| `prompt.md` | 提示词文档：平铺胶卷"客户怎么说"模块优化需求。含整体风格、布局结构、从右向左循环滑动动效、评价卡/中间空白卡设计、Three.js 或 CSS 3D 实现建议、15~18 帧数据分配。 |
| `胶卷展示页.html` | 可运行 Demo：**弯曲 3D 胶卷 + 右向左循环滑动**，深空灰底 `#0b0e14` + 金色强调 `#c9b28b` + 白卡。注意：提示词已要求"平铺"，此 Demo 仍为弯曲版。 |
| `image/tilt.png` / `image/tile.png` / `image/bending.png` / `image/model.png` | 胶卷视觉的 4 个参考/变体截图（倾斜 / 平铺 / 弯曲 / 模板）。 |
| `image/material.jpg` | 富士胶卷（FUJI RDR）风格参考模板图。 |

### `02-Motion_Effects_and_Animation/intro-animation-style/` （原「顶部」· 顶部 Hero / 品牌字样动画研究）
| 文件 | 说明 |
| --- | --- |
| `linkinwise-first/index.html` | 自建版 linkinwise 品牌字样 Hero：字母 spelling + 积木方块逐字拼合动画（Montserrat 900 字体）。 |
| `linkinwise-first/shapes/`（shape1–shape10.gif） | 字样动画用的装饰图形素材（10 个 GIF）。 |
| `linkwise-end/index.html` | linkinwise 字样 Hero **精修版**：更贴近原站，含 `.set` 入场状态、vw 自适应、响应式断点。 |
| `linkwise-end/shapes/`（shape1–shape10.gif） | 精修版对应的装饰图形素材（10 个 GIF）。 |
| `linkwise-all/streamtime-src.html` | Streamtime.net **整站源码导出**（Webflow 生成），含完整顶部/首屏，作为另一站点的完整参考。 |
| `linkwise-all/streamtime.css` | 对应的整站样式表（约 222 KB）。 |

### `02-Motion_Effects_and_Animation/page-navigation-style/` （airbagstudio 滚动切换复刻 · 三版本）
| 文件 | 说明 |
| --- | --- |
| `README.md` | 子项目说明：复刻 airbagstudio.it/en 首页「We don't worry about change / Our route into the future」两个盒子的滚动驱动原位切换，扩展为 4 面板，沉淀 v1/v2/v3 三个版本，含机制、文件、运行方式。 |
| `cuboid-v1/index.html` | v1 自包含演示页（内联 CSS+JS），依赖 `cuboid-v1/gsap.min.js`、`cuboid-v1/ScrollTrigger.min.js`（本地 GSAP 3.12.5，无需联网）。直接打开或 `python3 -m http.server` 即可。 |
| `cuboid-v2/` | **v2 完整 Next.js 工程**：`app/page.tsx`（页面装配）、`app/globals.css`（设计令牌+3D 透视）、`components/CuboidCarousel.tsx`（核心翻页组件）。另含 `airbag_en.html`、导出 `chunks/` 等原站源码快照，以及 `node_modules/`、`.next/` 构建产物。需 `npm install && npm run dev`（默认 http://localhost:3000）。 |
| `cuboid-v3/index.html` | v3 自包含演示页（同 v2 翻页逻辑，纯 HTML 重写），依赖 `cuboid-v3/gsap.min.js`、`cuboid-v3/ScrollTrigger.min.js`（本地库）。直接打开或静态服务即可。 |

### `02-Motion_Effects_and_Animation/ripple-style/` （airbagstudio 涟漪 Hero 研究 + Demo）
| 文件 | 说明 |
| --- | --- |
| `index.html` | 「linkinwise studio — Ripple Hero」单页 Demo：自包含（内联 CSS/JS + 内联 PolySans 字体），滚动驱动涟漪/水波序列，开箱即用。 |
| `assets/fonts/polysans-median.woff2` / `polysans-neutral.woff2` | 复刻用的 PolySans 字体（Median / Neutral 两款字重）。 |
| `docs/research/airbagstudio/` | 原站研究快照：`airbag-source.html`（原站源码）、`entry.css`、`js/`（B0aqDn1D.js 等 12 个切片）、`payload.json`。用于逆向分析涟漪 Hero 的实现。 |

### `02-Motion_Effects_and_Animation/top-navigation-bar/` （空占位）
| 文件 | 说明 |
| --- | --- |
| _（当前为空）_ | 顶部导航栏相关素材的占位目录，等待填充（如导航栏组件、菜单交互 Demo 等）。 |

---

### `03-AI_Prompts/antiquity-style/` （原「prompt」· 复古中文海报 / 古典水墨）
| 文件 | 说明 |
| --- | --- |
| `ds-version-prompt.md` | **DeepSeek 版**风格提示词：复古中文海报 · 文艺编辑风格（从参考图提取实测调色板 + 东方极简留白）。 |
| `gpt-version-prompt.md` | **GPT 版**风格提示词：中国古典水墨卷轴 × 现代杂志编辑设计（更偏水墨/博物馆图录气质，含色彩系统、材质、构图规范）。 |
| `prompt.txt` | 一句话风格摘要："中国古典水墨卷轴 × 现代杂志编辑风，浅色羊皮纸底 + 朱红/金/玉绿/云蓝"。 |
| `image/ds.png` / `image/gpt0.png` / `image/gpt1.png` / `image/model.png` | 风格参考图（用于提取调色板与气质，含 DS/GPT 实测生成样张）。 |

### `03-AI_Prompts/Kimi-Archive-style/` （原「poster-prompt」· Kimi Archive 档案美学）
| 文件 | 说明 |
| --- | --- |
| `Kimi-Archive-style-prompt.md` | 可复用的**文生图风格提示词模板**：一段式核心提示词 + 分项规格（风格定位、构图、物件、摄影质感、颜色、文字、最终效果），任意主题/标题/画幅均可套用。 |
| `ui.txt` | 该风格提示词的**原始需求草稿**（主题：AI 教育开发 / Vibe coding；标题：灵引启慧），是上面 .md 的来源。 |
| `image/1.png` ~ `image/5.jpg` | 用该风格生成的 **海报示例图**（验证提示词效果，含 4 张 PNG + 1 张 JPG）。 |

---

### `04-Color_Schemes/clolor-base/` （原「clolor / 配色库」）
| 文件 | 说明 |
| --- | --- |
| `background-clolor.md` | 品牌背景配色表：含 CSS 变量名（如 `--base-color-brand-offwhite`）+ 色值，共 10 个色（米白、暖灰、品牌黄、粉、荧光绿、蓝、深黑）。⚠️ 其中 `#fleeeh` 疑似笔误（字母 l 混入），无法正确渲染，应为 `#f1eee0` 之类。 |
| `clolor-see.txs` | 同一套配色的**纯色值列表**（txt 格式，便于批量复制）。 |
| `image/advice.png` | 配色可视化色板图，直观查看各色。 |
| _用途_ | 跨项目共享的**背景配色资产**，可被上述各 UI 项目引用。 |
| _备注_ | 文件名仍含旧拼写 `clolor`（非 `color`），如需统一可重命名为 `color-base` / `background-color.md` / `color-see.txt`。 |

---

## 四、命名规范现状

本次整理的实际状态：
- **分组**：按功能拆成 `01-Card_Component_Display` / `02-Motion_Effects_and_Animation` / `03-AI_Prompts` / `04-Color_Schemes` 四类，相似项目归入同一父目录。
- **英文 slug 化**：用户已将全部文件夹改为英文 slug（含修正错别字 `案列→案例`、`clolor→clolor-base` 归类）。
- **仍可优化（非必须）**：
  - 个别文件名仍残留旧拼写 `clolor`（见 `04-Color_Schemes/clolor-base/` 内文件）；
  - `card-swap-demo` 已由工程版精简为单文件 `card-swap.html`；
  - `page-navigation-style/cuboid-v2/` 内含 `node_modules/`、`.next/` 等构建产物，体积较大，必要时可加 `.gitignore` 排除；
  - `top-navigation-bar/` 目前为空占位目录，待填充或删除。

> 根目录旧版提到的 `顶部` 空壳目录（曾因进程占用句柄无法删除）现已彻底移除；其真实内容早已完整移入 `02-Motion_Effects_and_Animation/intro-animation-style`。
