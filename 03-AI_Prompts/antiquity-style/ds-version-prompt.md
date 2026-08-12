# Master Style — 复古中文海报 · 文艺编辑风格提示词

> 用途：作为**风格提示词（style prompt）** 附加在任何主体描述之后，统一画面的质感、配色与气质。
> 规范依据：从参考图提取的实测调色板 + 复古中文海报/编辑排版 + 文艺书卷感 + 东方极简留白定位。
> 注意：本文只描述"风格"，不描述图片中的具体文字/文案内容；生成时主体与文案由用户另写。

---

## 1. 风格定位 Style DNA

一段话概括核心气质：

```
A retro Chinese editorial poster aesthetic, book-craft quality, muted
earthy color palette, generous negative space, quiet Zen balance,
aged paper texture, literary and restrained, warm nostalgic tone
```

三种不可缺的锚点（缺一画面会跑偏）：

1. **复古中文编辑排版感** — 借鉴旧书封/老刊物的版式逻辑：标题层级分明、留白宽阔、横竖排字混排
2. **书卷纸张质感** — 泛黄纸、轻微颗粒、套色印刷的错位感、墨色非纯黑
3. **东方极简留白** — 构图上大量空、单一视觉重心、克制的色彩数量

---

## 2. 主风格提示词（Base Style Prompt）

一段可直接附加在主体词后的风格块，**英文版（通用稳定）**与**中文版（中文工具用）**任选其一：

**英文版：**

```
style: retro Chinese editorial poster, vintage book-cover design,
literary and understated, ink-and-paper print quality, muted earthy
palette of cream, warm sand, olive green, deep teal and warm brown,
low saturation, aged paper texture with subtle grain and light
foxing, generous negative space, minimalist composition with one
clear focal point, quiet Zen balance, restrained typography layout,
slight off-registration of print colors, soft diffused lighting,
no glossy modern effects
```

**中文版：**

```
风格：复古中文编辑海报，旧书封设计感，文艺克制，墨水与纸张的
印刷质感，低饱和大地色系（奶油米白、暖沙、橄榄绿、深墨青、
暖棕），泛黄旧纸纹理带细微颗粒与轻微霉斑，大量留白，极简构图
单一视觉重心，东方禅意的静谧平衡，克制的排版布局，套色印刷的
轻微错位，柔和的漫射光，无现代光泽特效
```

中文注释（辅助理解，不放入提示词）：
- `retro Chinese editorial poster` — 复古中文编辑海报风格
- `vintage book-cover design` — 旧书封设计感
- `ink-and-paper print quality` — 墨水与纸张的印刷质感
- `aged paper texture / subtle grain / foxing` — 旧纸纹理、细颗粒、轻微霉斑
- `slight off-registration` — 套色错位，复古印刷特有的对版不准

---

## 3. 调色板 Palette（实测提取）

| 名称 | HEX | 角色 |
|---|---|---|
| 奶油米白 | `#E0E0C0` | 底色/大面积留白 |
| 暖沙 | `#E0C0A0` | 次层背景、暖光 |
| 卡其灰 | `#C0C0A0` | 过渡色 |
| 淡粉肤 | `#E0C0C0` | 肤感/点缀 |
| 鲑鱼粉 | `#FFE0C0` | 高光点缀 |
| 深橄榄绿 | `#406060` | 主文字/墨色 |
| 鼠尾草绿 | `#608060` | 辅助元素 |
| 橄榄棕 | `#808060` | 画面次重色 |
| 暖棕 | `#A08060` | 线框/装饰 |
| 浅褐 | `#C0A080` | 细线/纹样 |

使用规则：**每张画面最多同时出现 4–5 个色**，米白必占 40%+ 面积，其余只作点缀，杜绝高饱和荧光色。

---

## 4. 负面提示词 Negative Prompt

**英文版：**

```
glossy, neon, high saturation, vibrant rainbow colors, photorealistic
3D render, lens flare, HDR, oversharpened, plastic texture, modern
sans-serif corporate design, clutter, busy background, watermark,
text errors, misspelled characters
```

**中文版：**

```
高光塑料感，霓虹灯，高饱和，鲜艳彩虹色，写实3D渲染，镜头光晕，
HDR，过度锐化，塑料质感，现代企业感无衬线排版，杂乱，拥挤背景，
水印，文字错误，错别字
```

中文说明：无高光塑料感、无霓虹高饱和、无3D渲染、无现代感杂乱排版、避免错字。

---

## 5. 推荐参数 Recommended Parameters

| 参数 | 值 | 说明 |
|---|---|---|
| Sampler | Euler / DPM++ 2M | 稳、噪点感自然 |
| Steps | 28–35 | 兼顾细节与纸质感 |
| CFG | 5–7 | 过高易丢失留白气质 |
| Resolution | 2:3 或 3:4 竖幅 | 海报/书封更适合竖版 |
| Model 风格 | 偏"插画/排版"类模型或 LoRA | 摄影向模型会破坏纸质感 |

---

## 6. 风格变体 Style Variants

每个变体 = 主风格 + 一段变体修饰。用 `V1` 打头标记，便于切换。

### V1 · 旧书封 泛黄墨香（默认，最接近参考图）

**英文版：**

```
+ faded vintage book jacket, warm aged paper heavily yellowed at
  edges, sepia undertone, ink slightly bleeding into paper,
  library-book patina, nostalgic literary mood
```

**中文版：**

```
+ 褪色的旧书封，泛黄严重的旧纸边角，怀旧棕褐色调，墨色微微
  渗入纸张，藏书旧渍感，怀旧的文艺氛围
```

### V2 · 极简留白 东方禅意（加大留白，减法构图）

**英文版：**

```
+ extreme negative space, 70% empty cream background, single
  centered motif, thin hairline borders, vertical Chinese text
  column, calligraphic restraint, meditative stillness, wabi-sabi
```

**中文版：**

```
+ 极致留白，70% 空白米白背景，单一居中主体，细若发丝的描边，
  竖排中文文字栏，书法般的克制，冥想般的宁静，侘寂
```

### V3 · 墨绿复古（橄榄绿主导，更"文人"）

**英文版：**

```
+ deep olive and sage green dominant palette, ink-black accents,
  jade green-tinted paper, traditional scholar aesthetic, quiet
  and dignified, aged silk texture
```

**中文版：**

```
+ 深橄榄绿与鼠尾草绿主导，墨黑点缀，泛玉青的纸色，文人学者风
  格，安静庄重，陈旧的丝绸质感
```

### V4 · 暖棕社论（暖棕主导，更"老刊物"）

**英文版：**

```
+ warm tan and brown dominant palette, oxblood accent, newsprint
  feel, editorial magazine layout, art-deco inspired thin rules,
  warm lamp-lit ambience, vintage print shop texture
```

**中文版：**

```
+ 暖沙与棕色调主导，牛血红点缀，新闻纸质感，社论杂志版式，
  装饰艺术风格的细线分隔，暖灯笼罩的氛围，老印刷厂质感
```

---

## 7. 组合公式 Combination Formula

```
[主体描述, English] + [Master Style §2 主风格] + [V1–V4 变体之一] + [负面提示词 §4]
```

示例（主体为"一棵孤松"，英文版）：

```
A lone pine tree on a hill under pale fog, retro Chinese editorial
poster, vintage book-cover design, literary and understated,
ink-and-paper print quality, muted earthy palette of cream, warm
sand, olive green, deep teal and warm brown, low saturation, aged
paper texture with subtle grain, generous negative space, minimalist
composition with one clear focal point, quiet Zen balance,
restrained typography layout, slight off-registration of print
colors, extreme negative space, 70% empty cream background, single
centered motif, meditative stillness, wabi-sabi, --no glossy, neon,
high saturation, photorealistic 3D render, clutter, text errors
```

示例（中文版）：

```
淡雾山丘上一棵孤松，复古中文编辑海报，旧书封设计感，文艺克制，
墨水与纸张的印刷质感，低饱和大地色系（奶油米白、暖沙、橄榄绿、
深墨青、暖棕），泛黄旧纸纹理带细微颗粒，大量留白，极简构图单一
视觉重心，东方禅意的静谧平衡，克制排版，套色印刷的轻微错位，
极致留白，70% 空白米白背景，单一居中主体，冥想般的宁静，侘寂，
排除：高光塑料感，霓虹，高饱和，写实3D渲染，杂乱，文字错误
```
