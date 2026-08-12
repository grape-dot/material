# Page Navigation Style — 四面板滚动切换演示

本项目是对 [airbagstudio.it/en](https://airbagstudio.it/en) 首页 **「We don't worry about change」/「Our route into the future」** 两个盒子（HomeMission 区块）的复刻与再创作。

原站的逻辑是：这两个盒子**不是跳转到别的页面**，而是**滚动驱动的原位切换**——在 `ScrollTrigger` 钉住（pin）的区块里，随滚动进度把 A 盒「翻」成 B 盒（clip-path 裁切 + 3D 旋转 + 主题切换）。

我们把它扩展成 **4 个面板**，并做了两个版本的切换机制探索，最终沉淀为下面三个可运行作品。

## 三个版本一览

| 版本                 | 文件夹       | 技术栈                                   | 切换机制                                                 | 运行方式            |
| -------------------- | ------------ | ---------------------------------------- | -------------------------------------------------------- | ------------------- |
| **v1 长方体旋转**    | `cuboid-v1/` | 原生 HTML + GSAP（本地库）               | 整体长方体绕水平轴旋转，4 个面像立方体侧面依次转正       | 直接打开 / 静态服务 |
| **v2 翻页式**        | `cuboid-v2/` | Next.js (App Router) + TypeScript + GSAP | 当前页绕**上边缘**掀起，下一页绕**下边缘**从底部翻转出现 | `npm run dev`       |
| **v3 翻页式 (HTML)** | `cuboid-v3/` | 原生 HTML + GSAP（本地库）               | 同 v2 的翻页逻辑，纯 HTML 重写                           | 直接打开 / 静态服务 |

四个面板的文案（两个版本共用，向原站致敬）：

1. **We don't worry about change** — 玫红深底
2. **Our route into the future** — 米灰浅底
3. **Design meets technology** — 暗色
4. **Built to move forward** — 亮色

## v1 — 长方体绕轴旋转（cuboid-v1/）

**机制**：4 个面板在 `preserve-3d` 容器内按 `rotateX(i*90°) translateZ(radius)` 围成一个长方体（cuboid），容器随滚动进度 `scrub` 从 `rotateX 0° → -270°` 平滑旋转，从而让 4 个面依次正对镜头。旋转中还包含每面内容的淡入/缩放润色、视口主题色随进度切换、右侧进度点指示，以及移动端降级为竖向堆叠。

**文件**：

- `cuboid-v1/index.html` — 自包含演示页（内联 CSS + JS）
- `cuboid-v1/gsap.min.js`、`cuboid-v1/ScrollTrigger.min.js` — 本地 GSAP 3.12.5，**无需联网**

**运行**：

```bash
# 方式一：直接用浏览器打开
open cuboid-v1/index.html

# 方式二：起一个静态服务（推荐，避免个别浏览器对 file:// 的限制）
cd cuboid-v1 && python3 -m http.server 3201
# 浏览器访问 http://127.0.0.1:3201/
```

## v2 — 翻页式（cuboid-v2/，Next.js 工程）

**机制**：放弃「整体旋转」，改为**翻页（page-turn）**。当前页绕上边缘 `rotateX 0° → -90°` 向上掀走，同时下一页绕下边缘 `rotateX +90° → 0°` 从底部翻转出现；下一页 `z-index` 更高，翻上来时盖在上面，翻页感更真实。滚动进度驱动每帧重算 4 个面的 `rotateX / transform-origin / z-index`，面板内容按「正对程度」做透明度 + 位移润色。

**文件**：

- `cuboid-v2/components/CuboidCarousel.tsx` — 核心切换组件（GSAP ScrollTrigger + 每帧 `render(p)`）
- `cuboid-v2/app/page.tsx` — 页面装配（含前后占位段，让 pin/scrub 手感真实）
- `cuboid-v2/app/globals.css` — 设计令牌（配色/圆角/字体）+ 3D 透视样式

**运行**：

```bash
cd cuboid-v2
npm install        # 安装 next / react / gsap（已带 package-lock）
npm run dev        # 默认 http://localhost:3000
```

> 滚动到中部区块即可看到翻页效果。注意：本文件夹内的 `.next/` 为构建缓存，可删除；`airbag_en.html`、`chunks/`、`nuxt_main.js` 是当初分析原站时下载的素材，仅供溯源。

## v3 — 翻页式（cuboid-v3/，纯 HTML 版）

**机制**：把 `cuboid-v2` 的翻页框架**完整移植**成自包含 HTML。逻辑与 v2 一致（上掀 + 底部翻入、scrub 驱动、内容润色、主题切换、进度点）。相对 v2 额外修了一个移动端隐患：v2 的堆叠态复用了带 `rotateX(90°)` 的面板基类，触屏端 JS 不运行时会把卡片转成不可见；v3 在移动端媒体查询里给堆叠态显式 `transform:none`。

**文件**：

- `cuboid-v3/index.html` — 自包含演示页（与 v1 同结构）
- `cuboid-v3/gsap.min.js`、`cuboid-v3/ScrollTrigger.min.js` — 从 v1 复制的本地 GSAP

**运行**：

```bash
cd cuboid-v3 && python3 -m http.server 3203
# 浏览器访问 http://127.0.0.1:3203/
```

## 本地预览端口速查

| 版本 | 静态服务命令                                  | 地址                     |
| ---- | --------------------------------------------- | ------------------------ |
| v1   | `cd cuboid-v1 && python3 -m http.server 3201` | <http://127.0.0.1:3201/> |
| v2   | `cd cuboid-v2 && npm run dev`                 | <http://localhost:3000/> |
| v3   | `cd cuboid-v3 && python3 -m http.server 3203` | <http://127.0.0.1:3203/> |

> 所有 HTML 版本均使用**本地 GSAP**，无需联网即可运行。

## 可调参数（HTML 版通用）

- **翻转动画幅度**：把翻页角度从 `90°` 改小到 `70~80°` 会更含蓄。
- **翻页速度**：滚动行程 `end: "+=N00%"`（N 越大越慢，v1 为 `+600%`，v3 同理）。
- **面板数量 / 文案**：直接改 `index.html` 里的 `.cuboid-face` 节点与 `data-*` 主题属性即可。

## 目录结构

```text
page-navigation-style/
├── README.md                 # 本文档
├── cuboid-v1/                # 版本一：长方体绕轴旋转（纯 HTML）
│   ├── index.html
│   ├── gsap.min.js
│   └── ScrollTrigger.min.js
├── cuboid-v2/                # 版本二：翻页式（Next.js 工程）
│   ├── app/
│   │   ├── page.tsx
│   │   └── globals.css
│   ├── components/
│   │   └── CuboidCarousel.tsx
│   ├── package.json
│   ├── next.config.mjs
│   └── tsconfig.json
└── cuboid-v3/                # 版本三：翻页式（纯 HTML，移植自 v2）
    ├── index.html
    ├── gsap.min.js
    └── ScrollTrigger.min.js
```
