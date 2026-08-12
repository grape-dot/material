# Airbag Studio (/en) — 两个盒子的跳转逻辑分析

目标：首页 `gH76W` 区块 = HomeMission 组件，内部包含两个"盒子"：
- 盒子 A：`missionChange` / `_6OZRd`（light）→ 标题 "We don't worry about change"，正文 "We are the ideal partner…"，Rive 图标 artboard="partners"，背景 bgChange。
- 盒子 B：`missionFuture` / `uUFWn`（dark）→ 标题 "Our route into the future"，正文 "We shape new products…"，Rive 图标 artboard="future"，背景 bgFuture。

## 结论：这不是"点链接跳页面"，而是"滚动驱动的原位切换"

桌面端（min-width:1024px 且非触屏）：
- 两个盒子被 GSAP 设为 `position:absolute; left:0; top:0` 互相**叠放**。
- 整个区块用一个 ScrollTrigger 钉住（pin）：
  `trigger = section, start:"top top", end:"+=600%", pin:true, scrub:true`
- 滚动 scrub 驱动一条总时间轴 `g = tlHero + tlMission`：
  - `tlHero`（es=）：首页 3D 立方体（THREE.js canvas）缩放/旋转/相机推近，立方体淡出。
  - `tlMission`（ts=，总长 1.5，中点 l=0.5）：执行两个盒子的切换。

## tlMission 关键步骤（A 盒 → B 盒）
阶段 1（0 → 0.5）A 盒进入：
- bgChange: scaleX1.05→1, scaleY1.8→1
- titleChange: scale→1，颜色 → rgb(132,26,59) #841A3B
- descChange / iconChange: opacity 0→1（0.4s 处淡入）

阶段 2（l=0.5 → 1.0）A→B 翻页切换：
- clipChange clip-path: `polygon(0 0,100% 0,100% 100%,0 100%)` → `polygon(0 0,100% 0,100% 0%,0 0%)` —— A 盒内容被**向上裁剪**收起，露出底下 B 盒。
- 两个图标 y:-50 上移。
- bgChange: yPercent -100 + rotateX 11deg（3D 向上掀起），--borderRadiusBottom 0→5rem。
- bgFuture: 从 yPercent 100 + rotateX -10deg 入场，opacity 0→1，--borderRadiusTop 0→5rem→0，y 收 -17rem，scaleY 1→1.6。
- titleChange/descChange: y -50、opacity 0 淡出。
- titleFuture: 从 y100/opacity0 升起，scale 3→1。
- descFuture: opacity 0→1。

## ScrollTrigger onUpdate 状态切换
- progress(C)≥0.2 → data-theme=dark，--fillLang 黑；<0.2 → light，--fillLang 白。
- progress(C)≥0.65 → missionFuture zIndex 0→2（置顶）。

## 事件回调
- tlHero onComplete：bgChange opacity1，立方体容器隐藏，iconFuture 显示，cubeState="cubeOff"。
- tlMission onReverseComplete：回到 A 态，--cubeBg=#b91b4c，立方体恢复，cubeState="home"。

## 关键颜色
- --cubeBg: #b91b4c（玫红）
- 标题强调色: #841A3B（暗红）
- A 盒=深色背景白字（light 主题框），B 盒=浅色背景黑字（dark 主题框）。

## 移动端/触屏
- `if(isTouch)return;` → 全部动效禁用，两个盒子在文档流里**竖向堆叠**（即 SSR HTML 里的样子）。

## 技术栈（原站）
Nuxt 3 (Vue) + GSAP (ScrollTrigger, matchMedia) + THREE.js（立方体）+ Rive（两个图标 airbag_icon.riv, artboard partners / future）+ Prismic 数据源。
