# Outseta 案例展示组件提示词

> 用途：将该文档作为提示词，交给 AI 代码助手（如 Cursor、Claude Code、ChatGPT 等），用于生成一个与 Outseta 首页类似的「客户案例 / 作品展示」组件。

---

## 一、组件目标

复刻 Outseta 官网首页中的「See what our customers are building」案例展示区域。该区域用于展示客户使用产品搭建的真实案例，通过 Tab 分类切换 + 卡片展示的方式，增强产品说服力与视觉丰富度。

---

## 二、视觉结构（必须遵循）

### 2.1 整体布局

- 背景：使用柔和的奶油黄/浅橙色渐变（参考 `linear-gradient(135deg, #fff9e6 0%, #ffe8cc 100%)`），营造温暖、亲切的氛围。
- 容器宽度：最大宽度 1200px，水平居中，左右留白。
- 上下内边距：建议 `80px ~ 120px`。

### 2.2 手写体注释（两侧）

- 左侧注释文字：`"see what our customers are building"`，配合手绘箭头指向卡片区域。
- 右侧注释文字：`"$100K in the first 48 hours with outseta"`，同样配合手绘箭头指向卡片。
- 字体：使用手写风格字体（如 **Caveat**、**Indie Flower**、**Permanent Marker** 或中文字体 **站酷庆科黄油体**），颜色为紫红色/粉色（约 `#d946ef` 或 `#c026d3`）。
- 实现方式：优先使用 **SVG 手写路径动画** 或 **WebFont + CSS 旋转/位移**，让文字带有轻微不规则的 handwritten 感。

### 2.3 Tab 分类导航

- 位于手写体注释下方、卡片上方，居中对齐。
- Tab 项：`SITES | SAAS PRODUCTS | CLUBS | ASSOCIATIONS | COURSES | COMMUNITIES | MEMBERSHIP SITES`。
- 样式：胶囊状按钮，默认透明或浅色背景，当前激活项为深色/半透明黑色背景 + 白色文字。
- 间距：每个 Tab 之间 `8px ~ 12px`。
- 字体：大写，无衬线字体，字号 `12px ~ 14px`，字间距 `0.05em`。

### 2.4 案例卡片区域

- 一排展示 3 张卡片（桌面端），平板 2 张，手机 1 张。
- 每张卡片包含：
  1. **顶部截图**：圆角容器内的产品/网站截图，占卡片上半部分约 60% 高度。
  2. **底部信息栏**：白色背景，包含：
     - 项目 Logo / 名称（左侧）
     - 创建者头像（右侧，1~2 个圆形小头像，重叠排列）
     - 分类标签 + 中点 + `"BUILT ON"` + 平台 Logo（如 Webflow、Framer）
- 卡片样式：
  - 圆角 `16px ~ 20px`
  - 白色/浅米色背景
  - 轻微阴影：`0 4px 20px rgba(0,0,0,0.06)`
  - 内边距：截图与信息栏之间无间隙，信息栏 `16px ~ 20px`

### 2.5 示例数据（可替换）

| 项目名称            | 分类        | 构建平台 | 创建者                     |
| ------------------- | ----------- | -------- | -------------------------- |
| Snow Them           | Course      | Webflow  | @robhope, @mattevans       |
| Making UX Decisions | Course/book | Framer   | @designertom               |
| OSMO Dev Toolkit    | Course/book | Webflow  | @iljavaneck, @codebydennis |

---

## 三、动效与交互规范

### 3.1 入场动画

- 整个区域在滚动进入视口时触发入场：
  - 手写体注释：从两侧轻微滑入 + 淡入，持续 `600ms ~ 800ms`，带弹性缓动 `cubic-bezier(0.34, 1.56, 0.64, 1)`。
  - Tab 导航：从上方淡入，延迟 `100ms`。
  - 卡片：依次从下方上浮 + 淡入，每张延迟 `100ms ~ 150ms`，持续 `500ms`，缓动 `cubic-bezier(0.25, 0.46, 0.45, 0.94)`。

### 3.2 Tab 切换动画

- 点击 Tab 时：
  - 当前卡片整体淡出/向左滑出，`duration: 250ms`。
  - 新分类卡片从右方滑入 + 淡入，`duration: 350ms`，使用 `cubic-bezier(0.4, 0, 0.2, 1)`。
  - 激活 Tab 背景色过渡：`200ms ease`。
- 推荐实现：使用 React/Vue 的 `transition-group` 或 Webflow Tabs + 自定义 CSS 动画。

### 3.3 卡片悬停效果

- 鼠标悬停卡片时：
  - 卡片整体上移 `Y: -8px ~ -12px`
  - 阴影加深：`0 12px 32px rgba(0,0,0,0.12)`
  - 内部截图轻微放大 `scale(1.03)`，overflow hidden 裁剪
  - 过渡时间：`300ms ease-out`

### 3.4 头像悬停

- 创建者头像悬停时：
  - 放大 `scale(1.1)`
  - 显示工具提示（Tooltip）展示创建者名称/社交媒体账号

### 3.5 手写体注释动效（可选增强）

- 手写文字使用 SVG `stroke-dasharray` + `stroke-dashoffset` 实现书写动画，持续 `1.2s ~ 1.5s`。
- 箭头使用 CSS `transform: rotate()` 或 SVG path 绘制，配合文字一起出现。

---

## 四、素材清单（必须提前准备）

> 结论：**需要准备素材**。该组件无法完全通过代码生成，必须提前准备以下图片资源。

### 4.1 必须素材

| 素材类型   | 数量            | 规格建议                          | 说明                                |
| ---------- | --------------- | --------------------------------- | ----------------------------------- |
| 案例截图   | 每个案例 1 张   | 16:10 或 4:3，建议 800×600px 以上 | 客户网站/产品的界面截图，是视觉核心 |
| 项目 Logo  | 每个案例 1 个   | SVG 或透明 PNG，高度 24~32px      | 用于底部信息栏左侧                  |
| 平台 Logo  | 每个平台 1 个   | SVG，高度 16~20px                 | Webflow、Framer、WordPress 等       |
| 创建者头像 | 每个案例 1~2 个 | 正方形，64×64px 以上，圆形裁切    | 真实人物头像，增强可信度            |

### 4.2 可选素材

- **手写体注释图片**：如果不想用字体，可准备两张 SVG/PNG 手写文字图（左侧 + 右侧）。
- **手绘箭头 SVG**：可自己绘制或从 icons8、Flaticon 下载。
- **背景装饰**：微妙的噪点纹理或渐变光斑，增强质感。

### 4.3 字体素材

- 主字体：Inter、SF Pro、系统无衬线字体。
- 手写体：Google Fonts 的 **Caveat**（推荐）或 **Permanent Marker**。

---

## 五、技术实现建议

### 5.1 推荐技术栈

- **React + Tailwind CSS + Framer Motion**：最适合实现 Tab 切换与卡片动效。
- **Vue 3 + Tailwind CSS + GSAP/`<TransitionGroup>`**：同样适合。
- **Webflow**：如果目标网站本身就在 Webflow 中构建，可以直接使用 Webflow Tabs 组件 + 自定义 CSS。
- **纯 HTML/CSS/JS**：使用原生 Tab 切换 + CSS transition 也能实现基础版本。

### 5.2 核心实现要点

1. **Tab 状态管理**：使用一个 `activeCategory` 状态控制当前显示的案例列表。
2. **卡片列表过滤**：根据 `activeCategory` 从数据数组中过滤案例。
3. **图片比例容器**：截图使用 `aspect-ratio: 16/10` 或固定高度容器，配合 `object-fit: cover`。
4. **响应式布局**：
   - 桌面：`grid-cols-3`
   - 平板：`grid-cols-2`
   - 手机：`grid-cols-1`，可横向滑动或垂直堆叠
5. **可访问性**：Tab 需要支持键盘导航（← → 切换），卡片链接需要正确的 `aria-label`。
6. **性能**：图片使用 `loading="lazy"`，截图可考虑 WebP/AVIF 格式。

### 5.3 代码生成提示（可直接复制给 AI）

```text
请使用 React + Tailwind CSS + Framer Motion 创建一个响应式案例展示组件。

设计要求：
1. 背景为奶油黄到浅橙的渐变。
2. 顶部左右两侧各有一个手写风格注释：左侧 "see what our customers are building"，右侧 "$100K in the first 48 hours with outseta"，均为紫红色，带手绘箭头指向中间。
3. 中间是一排 Tab 分类导航：SITES, SAAS PRODUCTS, CLUBS, ASSOCIATIONS, COURSES, COMMUNITIES, MEMBERSHIP SITES。当前激活项为深色背景白字。
4. 下方展示 3 张案例卡片，桌面端一排 3 张，响应式适配。
5. 每张卡片包含：顶部产品截图、底部项目 Logo/名称、创建者头像（1-2 个）、分类标签 + "BUILT ON" + 平台 Logo。
6. 动效：区域入场时手写注释从两侧滑入，Tab 和卡片依次淡入；Tab 切换时卡片有滑入滑出过渡；卡片悬停时整体上移、阴影加深、截图轻微放大。
7. 数据使用示例数组，包含 id、title、category、platform、image、logo、creators 字段。

请提供完整的可运行组件代码，并说明需要提前准备哪些素材。
```

---

## 六、注意事项

1. **截图质量是关键**：该组件的视觉冲击力主要来自案例截图，务必使用高清、有代表性的界面截图。
2. **头像需授权**：如果使用真实人物头像，请确保已获得使用授权。
3. **平台 Logo 需合规**：Webflow、Framer 等平台 Logo 请从其品牌资源页下载官方版本。
4. **手写体不要过度**：手写注释作为点缀即可，不要过多，否则显得杂乱。
5. **Tab 分类需与真实数据匹配**：如果案例数量不足，可以减少 Tab 数量或重复使用部分案例。

---

## 七、参考来源

- Outseta 官网：<https://www.outseta.com/>
- 参考区域：首页「See what our customers are building」客户案例展示区
