# 顶部导航栏复刻说明（Airbag Studio 风格）

> 本文档总结了 `index.html` 中导航栏的完整实现逻辑，可直接作为提示词（Prompt）喂给 AI 或交给开发者，在任何项目中复刻同款导航栏。

---

## 一、一句话提示词（快速复用版）

```
复刻 airbagstudio.it 的顶部导航栏：固定顶栏，左侧 Logo，右侧依次为
4 个导航链接（带"从右收起、从左展开"的下划线 hover 动画）、黑色胶囊
"联系我们"按钮（hover 放大 1.1 倍，点击打开 3D 翻转弹窗）、地球图标
语言切换胶囊（中/英切换全部文案）。向下滚动超过 70px 时，导航链接
向右淡出收起，变成一个白底三紫点的圆形按钮；悬停该按钮时，一个白色
大圆角胶囊背景从右向左展开，链接以反向交错动画恢复为黑字。移动端
变为右上角 menu/close 汉堡按钮，点击打开全屏菜单（顶部紫红色圆角
区块 + 底部语言切换）。
```

---

## 二、结构逻辑

```
header（fixed, top:0, padding:30px 100px, z-index:9000）
├── a.brand            Logo（70px 宽，颜色随区块深浅切换白/黑）
└── div.header-right   右侧组合（flex, align-items:center）
    ├── nav.main-nav   4 个链接：首页 / 产品与服务 / 客户案例 / 关于我们
    ├── span.dots-menu 三点按钮（滚动收起后出现，桌面端专属）
    ├── button.btn-contact  联系我们（打开弹窗）
    └── button.lang-switch  地球图标 + "EN/中文"
```

弹窗独立于 header：

```
div.modal-wrapper（fixed 全屏, display:none → flex, z-index:9999）
├── div.modal-bg       半透明灰遮罩 #616161b3，点击关闭
└── form.modal-card    灰米色 #eeece7 卡片，圆角 50px，宽 91.66%
    ├── button.modal-close   X 关闭按钮（两条 1px 斜线）
    ├── div.modal-grid       左栏(45%)：大标题 + 表单；右栏：联系信息 + 提交
    └── div.thank-you        提交成功态（"谢谢！" / "Ciao!"）
```

---

## 三、设计变量（Design Tokens）

| 变量 | 值 | 用途 |
|---|---|---|
| `--purple` | `#b91b4c` | 品牌主色：三点按钮的圆点、右栏地址标题、移动端菜单背景 |
| `--purple-dark` | `#841a3b` | 移动端菜单底部投影层 |
| `--orange` | `#ff6620` | 表单聚焦下划线、当前区块链接高亮 |
| `--grey-beige` | `#eeece7` | 弹窗卡片背景、浅色区块背景 |
| `--beige-dark` | `#c2bdaf` | 输入框默认下划线 |
| `--grey-dark` | `#616161` | 浮动标签文字 |
| `--iridiscent` | `#bdff00` | 提交按钮圆形图标背景 |
| `--nav` / `--fillLang` | 白 ↔ 黑 | 导航文字 / 语言切换描边，随区块深浅联动 |

字体：`Archivo`（英文）+ `Noto Sans SC`（中文），字重 400/500。原站使用商业字体 PolySans，Archivo 为最接近的免费替代。

---

## 四、交互逻辑详解（核心提示词）

### 1. 链接 hover 下划线

```
每个导航链接有一个 1px 高的 ::before 伪元素下划线，定位在 bottom:-4px。
默认 transform: scaleX(0)，变换原点在右侧 (100% 100%)；
hover 时 scaleX(1) 且原点切到左侧 (0 100%)，
过渡 0.6s cubic-bezier(.43,.195,.02,1)。
效果：鼠标移入时下划线从左向右展开，移出时向右收起。
```

### 2. 滚动收起为三点按钮（桌面端，≥1024px）

```
监听滚动，scrollY > 70px 时给 header 加 .collapsed：
- 4 个链接：opacity 0 + translateX(20px)，0.3s，pointer-events:none
- 三点按钮（38px 白圆 + 3 个 #b91b4c 紫点）：延迟 0.3s，
  从 translateX(10px) 滑入并淡入，0.6s
回到顶部（<70px）时反向播放，链接以 0.6s 延迟 0.1s 恢复。
```

### 3. 悬停展开（收起状态下）

```
.collapsed 状态下悬停 .header-right：
- ::before 白色胶囊背景展开：width 4% → 101.5%，opacity 0 → 1，
  0.4s（圆角 4rem，阴影 0 0 2rem rgba(98,92,78,.08)，right:-1.5% 锚定）
- 链接恢复显示并变为黑字，反向交错（stagger -0.04s：
  第 4 个链接最先出现，依次延迟 0 / .04 / .08 / .12s）
- 三点按钮快速淡出（0.15s）
- 语言切换的描边和文字同步变黑（--fillLang:#000）
移开后全部收回，胶囊收缩 0.6s 延迟 0.1s。
```

⚠️ 实现要点：`color: var(--nav)` 声明在 header 上，悬停改色不能靠覆盖 `--nav` 变量，必须直接在 `.header-right:hover` 上设置 `color:#000`；而 `--fillLang` 是自定义属性可正常继承覆盖。

### 4. 联系弹窗 3D 翻转

```
用 WAAPI（element.animate）实现，不用 CSS transition
（父容器 display:none → flex 时过渡不会播放）。

打开：
- 遮罩 opacity 0→1，0.5s
- 卡片：perspective(3000px) scaleX(.85) rotateX(-90deg) translateY(40vh)
  → scaleX(1) rotateX(0) translateY(0)，0.7s，延迟 0.3s，
  缓动 power3.out = cubic-bezier(0.215,0.61,0.355,1)
- 内容：opacity 0 + translateY(20%) → 正常，同时长同延迟

关闭：
- 卡片向上翻转收走：rotateX(0) → rotateX(90deg) translateY(-40vh)，
  0.7s，缓动 power1.in = cubic-bezier(0.55,0.085,0.68,0.53)
- 内容上移 20px 淡出，遮罩淡出
- 卡片动画 onfinish 后才 display:none 并 cancel 所有动画
```

⚠️ 实现要点：`transform` 内已含 `perspective()`，父容器不要再设 `perspective` 属性，否则双重透视变形。

### 5. 弹窗表单浮动标签

```
输入框透明背景 + 底部 1px #c2bdaf 下划线；
标签 span 绝对定位在 top:15px（25px 灰字）；
聚焦或有值时：translateY(-30px) scale(.7) 浮到上方；
聚焦时 ::after 橙色（#ff6620）3px 下划线 scaleX 0→1 展开（0.3s）。
textarea 聚焦时 min-height 过渡到 15vh。
提交 → 表单隐藏，显示感谢态（"谢谢！" / "Ciao!"）。
```

### 6. 中英文切换

```
点击语言胶囊切换 zh / en：
- 用 data-i18n="key" 标记所有需要翻译的元素，
  JS 字典 I18N = { zh: {...}, en: {...} }，切换时遍历替换 textContent
- 按钮上显示的是"另一种"语言（中文界面显示 "EN"，英文界面显示 "中文"）
- 同步更新 <html lang> 属性
```

### 7. 滚动变色 + 区块高亮

```
- 在导航栏高度（约 60px）处探测当前覆盖的区块：
  data-theme="dark" → 导航白字；data-theme="light" → 黑字（加 .on-light）
- IntersectionObserver（rootMargin: -40% 0 -55%）追踪当前区块，
  对应导航链接加 .active（橙色）
```

### 8. 移动端（<1024px）

```
- 三点按钮隐藏；右上角显示 menu/close 文字汉堡按钮
  （label 上移切换文案，0.6s）
- 点击后 .header-right 变为全屏菜单：
  上半部紫红色 #b91b4c 圆角区块（底部两角 20px 圆角，
  ::before 深色 #841a3b 层制造底部厚度），链接 32px 白字纵向排列；
  下半部依次是联系我们按钮和语言切换
```

---

## 五、复刻检查清单

- [ ] 链接 hover 下划线方向：左展开 / 右收起
- [ ] 滚动 70px 后链接收起、三点出现；回顶恢复
- [ ] 悬停三点区域：白色胶囊展开 + 链接反向交错恢复（黑字）
- [ ] 联系我们 → 弹窗 3D 翻转升起；关闭向上翻转收走
- [ ] 遮罩点击 / Esc 键关闭弹窗
- [ ] 表单浮动标签 + 橙色聚焦下划线
- [ ] 提交后显示感谢态
- [ ] 语言切换全量替换文案（含弹窗、按钮）
- [ ] 深/浅区块滚动时导航黑白切换
- [ ] 移动端汉堡全屏紫色菜单

---

## 六、文件说明

| 文件 | 说明 |
|---|---|
| `index.html` | 单文件完整实现（HTML + CSS + JS），无构建依赖，浏览器直接打开或任意静态服务器托管即可 |

本地预览：

```bash
python -m http.server 8734
# 访问 http://localhost:8734/index.html
```
