# Half of Eight · Journal 页面设计解析与复现

> 来源站点：<https://halfof8.com/journal>  
> 核心课题：**页面随鼠标旋转角度**的沉浸式 3D 展示效果  
> 配套文件：`shows-demo.html`（可直接在浏览器打开演示）

---

## 一、网站速览

| 项目  | 内容                                                                                                                      |
| --- | ----------------------------------------------------------------------------------------------------------------------- |
| 站点  | Half of Eight — Art Journal（日誌の半分）                                                                                      |
| 荣誉  | Awwwards Site of the Day · Lovie Awards 金奖（Weird & Experimental 类别）· CSS Design Award · Japan Typography Annual 2025 入选 |
| 概念  | "8 的一半"：8/2→4、8→0、8｜→3、∞/2→∞，用数学符号视觉化品牌                                                                                 |
| 内容  | 以"章节"形式记录日本文化、地方与邂逅的杂志式艺术日志                                                                                             |
| 技术栈 | Next.js + Three.js（WebGL 画布）+ tween 动画库（GSAP 风格）                                                                        |

**设计语言**：暗色基底、英日双语混排、½ 符号贯穿、大留白与细字重导航，整体克制而实验性。

---

## 二、核心效果剖析：页面随鼠标旋转角度

### 2.1 效果描述

进入 Journal 网格后，**每一张作品卡片都会实时"转向"鼠标指针**——指针移向哪里，卡片就向哪里倾斜，仿佛所有卡片都在"注视"光标；指针离开画布后，所有卡片平滑回正。配合拖拽/滚轮浏览无限网格，形成强烈的空间纵深感。

### 2.2 实现原理（源码级还原）

对站点 journal chunk 逆向分析后，核心机制如下：

**① 每张图片是 WebGL 中的一个平面（Plane）**，每帧执行一次 `lookAt(指针)`：

```js
// 原站核心逻辑（反混淆后）
update() {
  // 指针坐标换算到 3D 世界单位
  this.lookTarget.x = this.pointer.x - this.grid.position.x;
  this.lookTarget.y = this.pointer.y - this.grid.position.y;

  this.pictures.forEach(pic => {
    if (!this.shouldLookAtPointer) return;
    // 关键：平面朝向指针，得到 rotation.x / rotation.y
    const rot = this._computeRotation(pic.position);
    tween(pic.rotation, rot, this.animationParams.rotation); // 平滑过渡
  });
}

_computeRotation(pos) {
  this.lookBuffer.position.copy(pos);
  this.lookBuffer.lookAt(this.lookTarget);   // ← 卡片"注视"鼠标
  return this.lookBuffer.rotation;
}
```

**② 指针离开后回正（resetLookAt）**：

```js
resetLookAt() {
  this.shouldLookAtPointer = false;
  this.pictures.forEach(pic =>
    tween(pic.rotation, { x: 0, y: 0 }, this.animationParams.resetRotation));
}
```

**③ 距离透明度衰减**——离视口中心越远的卡片越透明，强化聚焦感：

```js
_computeOpacity(pic) {
  const s = 归一化X偏移, h = 归一化Y偏移;
  const r = 1 - 2 * Math.sqrt(s * s + h * h);
  return Math.max(Math.min(r, 1), 0.1);   // 限制在 [0.1, 1]
}
```

**④ 拖拽惯性**：桌面端拖拽倍率 `multiplier: 4`，移动端 `mobMultiplier: 2`。

### 2.3 关键参数速查

| 参数          | 原站取值                            | 作用                       |
| ----------- | ------------------------------- | ------------------------ |
| perspective | 1000px                          | CSS 3D 透视距离（详情页图片容器）     |
| 入场初始态       | translateZ(-500px) rotateY(45°) | 图片从纵深远处旋入                |
| 入场过渡        | 0.5s，延迟 0.3s                    | opacity + transform 同步缓动 |
| 透明度下限       | 0.1                             | 边缘卡片不完全消失                |
| 拖拽倍率        | 4（桌面）/ 2（移动）                    | 网格移动灵敏度                  |
| 旋转驱动        | `plane.lookAt(pointer)` + tween | 鼠标跟随倾斜的核心                |

---

## 三、配套设计细节

### 3.1 无限网格导航

- 3×4 作品网格，支持**滚动 / 拖拽 / 键盘方向键 / 移动端滑动**四种导航；
- 三种模式切换：**Grid（网格）→ Slider（横向滑块）→ Info（故事详情）**，点击卡片推进一层，ESC 返回；
- 模式切换时网格位置用 tween 吸附（snap），保证卡片精确居中。

### 3.2 双面卡片（Flip Side）

每张作品有正反两面：正面是视觉作品，点击后翻转，背面呈现 accompanying stories（文字故事）——"只讲一半的故事，另一半留给想象"。

### 3.3 CSS 3D 入场动画

详情页图片容器的真实 CSS（已还原可读性）：

```css
.container { perspective: 1000px; }
.image {
  opacity: 0;
  transform: translateZ(-500px) rotateY(45deg);
  transition: opacity .5s, transform .5s;
}
.visible .image {
  opacity: 1;
  transform: translateZ(0) rotateY(0);
  transition-delay: .3s;
}
```

### 3.4 排版与氛围

- 英日双语标题：`日誌の半分。HALF OF THE JOURNAL`；
- 菜单/浮层使用 `backdrop-filter: blur(10px)` + `rgba(53,53,53,.4)` 毛玻璃；
- 图片容器圆角 `8px`，黑底 `#000` 托底，暗色页面让作品成为唯一光源。

---

## 四、复现方案（纯 CSS 3D + 原生 JS）

原站依赖 Three.js，但**核心视觉效果可以用零依赖的 CSS 3D 等价复现**——把 `lookAt` 换算成 `rotateX / rotateY`：

```
rotateY = atan2(指针与卡片中心的水平距离, 焦距)
rotateX = -atan2(指针与卡片中心的垂直距离, 焦距)
```

再用 `requestAnimationFrame` 做 lerp 平滑（替代 tween），指针移出时目标角度归零（等价 `resetLookAt`）。

### 完整可运行代码（shows-demo.html 同款）

```html
<style>
  .stage {
    perspective: 1000px;            /* 透视前提 */
  }
  .card {
    transform-style: preserve-3d;
    will-change: transform;         /* rotateX/rotateY 由 JS 驱动 */
  }
  /* 入场：复刻 translateZ(-500px) rotateY(45°) → 0 */
  .card       { opacity: 0; transform: translateZ(-500px) rotateY(45deg);
                transition: opacity .5s, transform .5s; }
  body.ready .card { opacity: 1; transform: translateZ(0) rotateY(0); }
</style>

<script>
const MAX_TILT = 28;    // 最大倾角（度）
const FOCAL    = 900;   // 等效焦距：越大越柔和
const LERP     = 0.08;  // 平滑系数：越小越慵懒

addEventListener('pointermove', e => {
  pointer.x = e.clientX; pointer.y = e.clientY; pointer.active = true;
});
addEventListener('pointerleave', () => pointer.active = false);

function tick() {
  for (const c of cards) {
    const r  = c.el.getBoundingClientRect();
    const dx = pointer.x - (r.left + r.width / 2);
    const dy = pointer.y - (r.top  + r.height / 2);

    if (pointer.active) {
      // —— 等效 lookAt：卡片法线朝向指针 ——
      c.tx = clamp(-Math.atan2(dy, FOCAL) * 180 / Math.PI, MAX_TILT);
      c.ty = clamp( Math.atan2(dx, FOCAL) * 180 / Math.PI, MAX_TILT);
      // —— 距离透明度衰减 ——
      const fade = 1 - 0.9 * Math.hypot(dx / innerWidth * 2, dy / innerHeight * 2);
      c.el.style.opacity = Math.max(0.25, Math.min(1, fade));
    } else {
      c.tx = 0; c.ty = 0;               // resetLookAt()
      c.el.style.opacity = 1;
    }

    // lerp 平滑
    c.rx += (c.tx - c.rx) * LERP;
    c.ry += (c.ty - c.ry) * LERP;
    c.el.style.transform =
      `rotateX(${c.rx}deg) rotateY(${c.ry + (c.flip ? 180 : 0)}deg)`;
  }
  requestAnimationFrame(tick);
}
</script>
```

> 完整单文件版本见 **`shows-demo.html`**：12 张卡片、鼠标跟随倾斜、点击放大转横排、再点击弹出详情、待开发卡片显示「敬请期待」、入场纵深动画、双语导航与操作提示，开箱即用。三级交互与真实图片配置详见第七节。

---

## 五、用于展示（Presentation）的建议

1. **演示路径**：先静止展示暗色网格 → 缓慢移动鼠标展示"卡片注视"效果 → 快速甩动鼠标展示 lerp 惯性 → 点击某张卡片，它放大并转为横排浏览（← → 切换）→ 再点击激活卡片弹出详情故事 → ESC 逐级返回网格。
2. **调参指南**：
   - 想要更夸张的 3D 感 → 调大 `MAX_TILT`（28→40）或减小 `FOCAL`；
   - 想要更"高级慵懒"的跟随 → 调小 `LERP`（0.08→0.04）；
   - 想要更强聚焦 → 调大透明度衰减系数（0.9→1.4）。
3. **替换真实内容**：将 Demo 中 `.face.front::after` 的渐变换成 `<img>` 作品图，`.face.back` 写入作品故事，即是完整的作品集展示页。
4. **性能要点**：`will-change: transform`、只对 transform/opacity 做动画、lerp 在 rAF 中执行——这套组合在低端机上也能保持 60fps。

---

## 六、设计要点总结

| 维度 | 可借鉴手法                                             |
| -- | ------------------------------------------------- |
| 交互 | 整页卡片 `lookAt` 鼠标 + lerp 平滑 + 离开回正，零学习成本的直觉交互      |
| 空间 | perspective 1000px + translateZ 纵深入场，平面网格秒变 3D 空间 |
| 叙事 | 双面卡片：正面作品、背面故事，"讲一半"的留白叙事                         |
| 氛围 | 暗色基底 + 双语排版 + 距离衰减透明度，视线自然聚焦中心                    |
| 工程 | transform/opacity 专属动画 + rAF 插值，性能与手感兼得           |

---

## 七、三级交互与真实图片接入（项目定制）

`shows-demo.html` 已按原站的模式流转实现三级交互，并针对项目需求做了图片配置机制。

### 7.1 交互流程

```
Grid 网格模式                    Slider 横排模式                 Info 详情模式
┌──────────────────┐   点击卡片   ┌──────────────────────┐  再点激活卡  ┌────────────────┐
│ 4×3 网格          │ ──────────▶ │ 卡片横向排列           │ ──────────▶ │ 居中详情浮层     │
│ 鼠标跟随倾斜       │             │ 该卡放大 ×1.22 居中    │             │ 标题 + 故事文案  │
│ 距离透明度衰减     │  ESC 返回   │ ← → / 分页 / 底部按钮  │  ESC 返回   │ 背景压暗 25%    │
└──────────────────┘ ◀────────── └──────────────────────┘ ◀────────── └────────────────┘
```

- **横排模式**：激活卡片放大居中，两侧卡片缩小（×0.92）并半透明；支持 ← → 键、底部 Previous/Next、左下角分页方块切换；点击非激活卡直接切换。
- **详情模式**：居中带滚动条的毛玻璃面板展示作品故事；ⓘ 按钮变为 ✕，点击空白处或 ESC 关闭；下载按钮仅对有真实图片的作品可用。
- **待开发卡片**：点击后详情面板显示 **「敬 请 期 待」**（この章はまだ書かれていない。）。

### 7.2 真实图片配置（由中间向外扩散）

在 `shows-demo.html` 顶部的 `WORKS` 数组中按顺序添加作品即可：

```js
const WORKS = [
  { img: 'images/work-01.jpg', title: '作品一', story: ['第一段……', '第二段……'] },
  { img: 'images/work-02.jpg', title: '作品二', story: ['……'] },
];
```

- **添加顺序 = 由中间向外扩散**：第 1 项放入网格正中心，之后依次向外（中心最醒目，方便展示）。4×3 网格的卡槽填充顺序为 `[5, 6, 1, 2, 9, 10, 4, 7, 0, 3, 8, 11]`（按到网格中心距离升序，代码自动计算，改网格行列数也适用）。
- **图片不足 12 张时**，剩余卡槽自动成为「待开发」占位卡片：虚线描边 + `½ ?` 水印，网格中正常参与倾斜与横排，点详情显示「敬请期待」。
- `img` 留空时先用渐变占位图展示效果，填入路径后自动替换为真实图片并启用下载按钮。

### 7.3 待开发卡片的视觉处理

| 状态 | 视觉 | 点击详情 |
| --- | --- | --- |
| 真实作品 | 真实图片/渐变 + 标题 | 标题 + 故事文案，可下载 |
| 待开发 | 暗色渐变 + 虚线描边 + `½ ?` 水印 | 「敬 请 期 待」 |

---

*分析基于 2026-07-30 对 halfof8.com/journal 页面结构、样式表与 journal chunk 源码的逆向研究；复现代码为独立编写的等价实现。2026-07-31 更新：补充三级交互与真实图片接入机制。*
