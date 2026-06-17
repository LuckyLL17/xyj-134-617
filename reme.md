# 核爆模拟器 · 功能扩展与工程建议

> 项目路径：`/Users/tog/Desktop/code/solo/xyj-134/`
>
> 核心文件：[index.html](file:///Users/tog/Desktop/code/solo/xyj-134/index.html) · [app.js](file:///Users/tog/Desktop/code/solo/xyj-134/app.js) · [styles.css](file:///Users/tog/Desktop/code/solo/xyj-134/styles.css)

***

## 一、可扩展功能模块（从 0-1 开发）

以下模块均为全新功能，互相之间**无依赖**，可单独开发；也不与「可迭代功能模块」重复或相似。所有模块仅使用本地计算，不接入任何真实外部 API。

***

### 1. 多点同步爆炸模拟

**模块描述**：用户可在地图上连续点击放置 N 个爆炸点（每个点可独立设置当量/类型/高度），点击「同步引爆」按钮后所有爆炸点同时触发动画，可视化 6 个圈层的叠加区域，并计算联合破坏范围内的总伤亡估算与覆盖面积。

**交互设计**：

- 按住 Shift 键 + 点击地图：追加爆炸点（普通点击仅保留单个点）
- 每个爆炸点旁显示序号气泡 `#1 #2 #3`，点击气泡可弹出迷你参数面板修改该点的当量/高度
- 顶部新增「爆炸点列表」可删除/跳转到指定点
- 新增「联合覆盖计算」数据卡片：展示多点叠加后的等效面积与去重后伤亡

**核心实现要点**：

- 在 `state` 中新增 `explosionCenters: Array<{x, y, yieldKilotons, burstHeight, id}>` 替代原单个 `explosionCenter`
- 新增函数 `calculateUnionZones(centers)`：用并集算法计算多点叠加后的各圈层等效区域
- `animateExplosion` 中改为遍历 centers 数组，为每个点生成独立粒子系统与冲击波环
- 伤亡估算时城市只统计一次（按最近爆炸点取最高伤害等级）

***

### 2. 地形遮蔽与高度衰减系统

**模块描述**：在地图上引入虚拟高程数据（自动生成山脉、丘陵、盆地），当冲击波或辐射传播路径遇到高出的地形时产生衰减效应，使破坏圈层不再是完美圆形，而是呈现被山体遮挡的不规则轮廓。

**交互设计**：

- 侧边栏新增「地形设置」面板：地形复杂度滑块、随机重置地形按钮、地形高度图例
- 地图上以伪彩色等高线显示高程（蓝=低地，绿=平原，黄/棕=山地，白=高峰）
- 爆炸后在冲击波动画阶段可直观看到环形遇到山峰时的「缺口」和绕射效果

**核心实现要点**：

- 新增函数 `generateHeightMap(width, height, complexity)`：用多层 Perlin 噪声生成二维高程数组
- 在 `drawTerrain` 后追加 `drawContourLines(heightMap)` 绘制等高线
- 重写破坏圈绘制：对每个圈层沿角度采样 360 条射线，每条射线上的半径乘以地形遮蔽系数 `terrainFactor(angle) = exp(-sum(heightObstacle / 1000))`
- 动画中的冲击波环同步应用相同遮蔽系数，不再是完美圆形

***

### 3. 爆炸后时间轴推演（沉降物扩散）

**模块描述**：爆炸结束后进入「时间轴模式」，用户可拖动时间滑块或自动播放，观察 T+1 小时、T+1 天、T+1 周、T+1 月四个阶段的放射性沉降物随风扩散的过程，以及各阶段总伤亡数字的动态增长（烧伤→急性放射病→长期影响）。

**交互设计**：

- 爆炸动画结束后自动出现底部时间轴控件（播放/暂停/4 个阶段跳转按钮/速度倍率）
- 每个时间阶段用不同颜色的半透明云团图层表示沉降物浓度（红>橙>黄>绿）
- 伤亡面板变为动态刷新：每进入新阶段数字滚动递增，并新增「晚期死亡」「长期病症」数据卡片
- 侧边栏新增「气象设置」：风向（8 个方向）、风速滑块（影响沉降物扩散方向和速度）

**核心实现要点**：

- 新增函数 `simulateFallout(center, windDir, windSpeed, timeHours)`：用粒子追踪法计算沉降物浓度云图
- 新增状态 `timelinePhase: 0|1|2|3` 与 `falloutParticles: Array`
- 伤亡估算拆分阶段：`updateCasualtiesByPhase(cities, zones, phase)` 分别计算即时死亡 / 1 日内 / 1 周内 / 长期
- Canvas 新增第三个图层 `falloutCanvas`（z-index: 2.5），介于冲击波与蘑菇云之间

***

### 4. 撤离路径规划模拟器

**模块描述**：在「引爆前」阶段开启撤离模拟，用户指定避难所位置后，系统基于城市到避难所的距离、道路承载能力、预警提前时间，计算每条道路上的撤离人流密度，并用动画展示道路上车辆/人流的移动过程与未及时撤离的人员比例。

**交互设计**：

- 新增工具栏模式切换：「引爆模式」 / 「撤离模拟模式」
- 在撤离模式下：点击地图添加避难所（绿色旗帜图标），每个城市自动连接到最近避难所的路径
- 引爆按钮变为「启动撤离倒计时」：先播放 30 秒撤离动画（道路上移动的粒子人流），倒计时归零后才触发爆炸
- 新增数据面板：撤离成功率 / 滞留人数 / 各条道路拥堵等级（颜色编码）

**核心实现要点**：

- 新增函数 `findEvacuationRoutes(cities, shelters, roads)`：用 Dijkstra 算法计算每个城市到所有避难所的最短路径
- 新增函数 `simulateEvacuationFlow(routes, prepTimeMinutes)`：基于道路容量和提前时间计算撤离进度
- 在 roads 数据结构中增加 `capacity`（车道数）、`congestion`（0-1 拥堵系数）字段
- 撤离动画阶段：沿道路 polyline 以不同速度移动小型车/人流粒子，拥堵路段颜色变红且速度变慢

***

### 5. 建筑结构等级分类系统

不同建筑结构建筑展示未做差异化

**模块描述**：将每个城市拆分为多种建筑类型（木质住宅 / 砖混公寓 / 钢筋混凝土写字楼 / 钢结构地标 / 地下掩体），不同类型对同一冲击波超压的破坏程度和人员存活率不同，最终伤亡估算由按建筑类型加权求和得出。

**交互设计**：

- 侧边栏新增「建筑构成」面板：6 个滑块分别调整当前爆炸点周边（或全局默认）的 6 种建筑比例
- 城市节点可视化升级：每个城市不再是单一圆点，而是按建筑比例绘制不同颜色和大小的方块集群（木=黄/砖混=橙/钢混=灰/钢=蓝/掩体=绿）
- 破坏后不同建筑变色/消失动画不同：木质瞬间变灰消失，钢混出现裂纹后缓慢坍塌，掩体保持不变
- 数据卡片拆分为按建筑类型的分项死亡/受伤统计

**核心实现要点**：

- 在 city 对象中新增 `buildings: {wood: ratio, brick: ratio, concrete: ratio, steel: ratio, bunker: ratio}` 字段
- 新增 `BUILDING_DAMAGE_TABLE` 常量：映射「建筑类型 × 超压 psi」→ 损坏等级（无/轻/中/重/全毁）+ 人员死亡率
- 重写 `updateDataDisplay` 中伤亡计算逻辑：遍历每个城市 × 每种建筑，按 BUILDING\_DAMAGE\_TABLE 取死亡率加权
- `drawCities` 中按比例绘制多种颜色方块代替单一圆点，`destroyed` 状态下按类型播放不同破坏动画

***

### 6. 核爆声音与震动模拟（Web Audio API）

**模块描述**：为爆炸动画配上分层合成的音效（闪光瞬间的高频爆裂声、冲击波到达的低频隆隆声、持续的轰鸣声），同时在视觉上同步模拟地震效果（整个地图容器的随机微幅位移 + 窗口边缘红光闪烁）。

**交互设计**：

- 侧边栏新增「音频与震动」开关 + 音量滑块（默认开启，可关闭）
- 爆炸触发时：
  - T+0ms：播放高频爆裂声 + 屏幕闪光 + 边缘红光 1 次
  - T+300ms：播放低频冲击波声 + 地图容器开始震动（强度随冲击波半径扩散到屏幕边缘时达到峰值）
  - T+1000ms \~ T+4000ms：持续低沉轰鸣声 + 震动强度线性衰减
- 震动强度会根据当前地图上爆炸点距离屏幕中心的远近而有所区分（越近震感越强）

**核心实现要点**：

- 使用 `AudioContext` + `OscillatorNode` + `GainNode` 分层合成 3 段音效（无真实音频文件依赖）
  - 爆裂声：白噪声源 + 高通滤波器 + 快速 ADSR 包络
  - 冲击波：低频正弦 40Hz 扫频到 80Hz + 延迟反馈
  - 轰鸣：棕噪声 + 低通 + 缓慢衰减
- 震动实现：在 animateExplosion 的每个 frame 中对 mapWrapper 应用 `transform: translate(randomX, randomY)`，振幅随 progress 从 `maxShakePx` 衰减到 0
- 边缘红光：在 flashOverlay 之外新增 `quakeGlow` 固定定位伪元素，用 box-shadow 闪烁红光

***

### 7. 参数方案并排对比模式

**模块描述**：允许用户保存当前参数组合为「方案 A」，然后调整参数得到「方案 B」，页面横向切分为左右两半，左右各有独立的画布、参数面板、引爆按钮，可同步或独立引爆，直观对比两种核弹参数在同一地形/城市布局下的破坏差异。

**交互设计**：

- 顶部新增「对比模式」开关按钮
- 开启后：页面中间出现可拖动的分割条，左侧画布保持当前状态，右侧画布复制当前城市/地形布局但参数重置
- 每个面板顶部有「保存为方案」「从方案加载」「交换左右」三个快捷按钮
- 两个画布共享同一套随机种子生成的城市/地形（保证公平对比），但爆炸中心、参数、动画完全独立
- 底部新增对比数据汇总：两个方案各圈层半径、伤亡数字的差值表格（正负数颜色区分）

**核心实现要点**：

- 重构画布管理：抽象 `SimulationInstance` 类，每个实例持有独立的 `state`、`canvas`、`ctx`、`elements`
- 初始化时传入共享的 `seededCities` 和 `seededHeightMap`（用固定 seed 的伪随机数生成器，保证两次生成一致）
- HTML 结构新增 `#compareContainer` flex 容器 + `#dividerHandle` 拖拽条，JS 中根据拖拽位置实时设置左右 width%
- 新增函数 `compareDiff(schemeA, schemeB)`：计算各字段差值并渲染到对比表格

***

### 8. 自定义破坏圈层编辑器

**模块描述**：用户可以新增/删除/编辑破坏圈层的定义（名称、阈值说明、颜色、计算公式、伤害类型标签），而不是固定为 6 种预设圈层。编辑后的圈层定义会实时反映在地图、图例、数据面板、伤亡计算中。

**交互设计**：

- 侧边栏新增「圈层编辑器」折叠面板，默认列出当前 6 个预设
- 每个圈层条目可点击「编辑」：弹出模态框，可修改名称、颜色选择器、简述、计算公式（支持选择内置公式模板或输入自定义系数）
- 可新增自定义圈层（比如 2 psi 轻微破坏 / 1000 rem 瞬时致死），也可删除非核心圈层
- 提供「恢复默认」按钮一键还原 6 种标准配置
- 圈层顺序按半径自动排序（始终从大到小绘制）

**核心实现要点**：

- 将目前硬编码在 `calculateRadii` 中的 6 个公式和 `drawExplosionZones` 中的 zones 数组，提升为可配置的 `ZONE_DEFINITIONS` 状态数组
- 每个 zone 定义包含：`{id, name, formula: (W, H) => number, color, borderStyle, description, damageType, isRemovable}`
- 新增模态框 DOM 结构（纯前端，无需后端）+ 颜色选择器 + 公式模板下拉（内置火球/辐射/超压/热辐射 4 种模板，每种模板允许调整系数）
- `drawExplosionZones` 和 `updateDataDisplay` 改为遍历 ZONE\_DEFINITIONS 动态生成，不再硬编码 6 个字段 id

***

## 二、可迭代功能模块（在已有功能上开发）

以下模块均在现有功能基础上**迭代增强**，与「可扩展功能模块」无重复无相似，互相之间无依赖。

***

### 1. 爆炸动画时间轴控制（增强 animateExplosion）

**现状**：[animateExplosion](file:///Users/tog/Desktop/code/solo/xyj-134/app.js#L490-L704) 动画启动后只能一次性播放完 5 秒，无法暂停、跳转、调速。

**迭代内容**：

- 在动画下方新增时间轴控制条：播放/暂停按钮、进度条（可点击/拖拽跳转）、倍速选择（0.5x / 1x / 2x / 4x）、循环播放开关
- 将当前 `progress` 改为可外部设置，`draw(now)` 不再以 startTime 计算，而是读取外部控制的 `currentTime`
- 进度条旁标注 4 个关键阶段节点（闪光 / 火球最大 / 冲击波最大 / 蘑菇云完成），点击可直接跳到对应进度
- 暂停时画面冻结在当前帧，恢复时从断点继续；循环播放时动画结束后自动重置回到 0 并重新开始

**改造点**：

- `animateExplosion` 拆分为 `startAnimation()` / `setProgress(p)` / `pauseAnimation()` / `resumeAnimation()` 四个方法
- `draw()` 接收明确的 `progress` 参数，不再内部计算 elapsed
- 新增 DOM 元素：`#animationTimeline` 容器 + 内部控件，CSS 中设置样式

***

### 2. 核弹预设自定义保存（增强 BOMB\_TYPES）

**现状**：[BOMB\_TYPES](file:///Users/tog/Desktop/code/solo/xyj-134/app.js#L4-L13) 是硬编码常量，下拉选择后无法保存用户自定义的组合。

**迭代内容**：

- 当用户手动拖动当量滑块或修改爆炸高度后，在下拉框旁出现「💾 保存为预设」按钮
- 点击弹出输入框，用户输入自定义名称（如「我的核弹 1 号」），保存后自动出现在下拉列表顶部
- 自定义预设项右侧有删除图标（×），可一键删除（内置预设不可删除）
- 保存的预设使用 `localStorage` 持久化（不依赖外部 API），下次打开页面仍存在
- 预设列表项支持拖拽排序（用户可调整自定义预设的显示顺序）

**改造点**：

- `BOMB_TYPES` 改为 `loadBombPresets()` 函数返回的可变数组，首次加载合并内置预设 + localStorage 中的自定义项
- 新增 `saveCustomPreset(name, yield, height)` / `deleteCustomPreset(id)` / `reorderPresets(newOrder)` 三个工具函数
- 下拉框 `<option>` 改为 JS 动态渲染（目前是 HTML 静态写死），每个自定义 option 后追加删除按钮

***

### 3. 伤亡估算多因素升级（增强 updateDataDisplay）

**现状**：[updateDataDisplay](file:///Users/tog/Desktop/code/solo/xyj-134/app.js#L420-L475) 只基于城市距爆炸中心距离和人口，按固定比例计算伤亡。

**迭代内容**：

- 侧边栏新增「情景设定」面板：
  - 时段切换（白天/夜晚/深夜）：白天办公楼满员 + 住宅半空，夜晚相反，深夜都在住宅（死亡率不同）
  - 人口密度等级（稀疏/一般/密集/超密集）：城市人口乘以系数
  - 防护措施（无 / 部分掩蔽 / 全民防核演习）：整体死亡率 × 1.0 / 0.6 / 0.3
- 伤亡数字旁增加「情景标签」图标（白天☀️ / 夜晚🌙），鼠标 hover 显示当前情景的伤亡占比说明
- 数据面板增加「情景敏感度」小字说明：如果切换到深夜模式，预计死亡会减少 X% 等

**改造点**：

- `state` 新增 `scenario: {timeOfDay, densityLevel, protectionLevel}` 字段
- `updateDataDisplay` 中每个死亡率再乘以 3 个情景系数（`timeFactor * densityFactor * protectionFactor`）
- `formatNumber` 旁新增 `getScenarioLabel(scenario)` 辅助函数，用于 DOM 中展示标签

***

### 4. 地图交互增强（拖拽移动 + 滚轮缩放 + 平移）

**现状**：[handleCanvasClick](file:///Users/tog/Desktop/code/solo/xyj-134/app.js#L706-L718) 只能点击设置爆炸点，无法移动已有点，也无法缩放/平移画布。

**迭代内容**：

- 按住爆炸中心标记（十字准星）拖拽可以移动爆炸点位置，实时重绘圈层和刷新数据
- 鼠标滚轮缩放地图比例尺（替代侧边栏的比例尺滑块，滑块仍然保留但不再是唯一方式）
- 按住空格键 + 鼠标拖拽可以平移整个画布（改变视口偏移），右下角出现「罗盘」显示当前平移偏移量和「重置视图」按钮
- 所有缩放/平移操作保持爆炸中心在画布中的真实地理坐标不变（即缩放是围绕鼠标指针位置进行的）

**改造点**：

- `state` 新增 `viewOffset: {x, y}` 和 `isDraggingCenter: boolean` / `isPanning: boolean` 标记
- 新增事件监听：`mousedown` 判断点击位置是否靠近中心标记（8px 内）则进入拖拽模式，`mousemove` 根据模式更新 center 或 viewOffset，`mouseup` 结束模式
- `wheel` 事件：围绕 `(e.clientX, e.clientY)` 计算新 scale，同时调整 viewOffset 保持鼠标下的点位置不变
- 所有绘制函数（`drawMap` / `drawExplosionZones` 等）在取坐标时统一加上 `viewOffset.x / viewOffset.y`

***

### 5. 数据面板可视化增强（柱状图 + 饼图）

**现状**：[index.html](file:///Users/tog/Desktop/code/solo/xyj-134/index.html#L153-L218) 数据面板全部是纯数字展示，缺乏视觉对比。

**迭代内容**：

- 6 个半径数据卡片下方新增迷你横向柱状图：6 根柱子长度按比例对比各圈层半径，柱子颜色与对应圈层一致
- 伤亡预估面板新增饼图：区分「即时死亡 / 烧伤死亡 / 放射病死亡 / 受伤」四部分占比
- 所有数值在参数变化时播放数字滚动动画（从旧值平滑过渡到新值，不是直接跳变）
- 柱状图柱子可点击：点击后在地图上高亮对应圈层（脉冲闪烁 3 次 + 图例项加粗）

**改造点**：

- 新增 `<canvas id="radiusChartCanvas">` 和 `<canvas id="casualtyPieCanvas">` 两个迷你画布（各约 200×60 / 150×150）
- 新增 `drawRadiusBars(radii)` 和 `drawCasualtyPie(deathsBreakdown)` 两个绘制函数
- 数字滚动：用 `requestAnimationFrame` 在 300ms 内对每个数字执行线性插值 `lerp(oldVal, newVal, t)` 并更新 `textContent`
- 柱状图点击：在对应柱子区域绑定 click 事件，触发 `highlightZone(zoneId)` 函数（通过修改 CSS class + setTimeout 切换来实现闪烁）

***

### 6. 城市生成逻辑升级（分级城市 + 道路网络拓扑）

**现状**：[generateCities](file:///Users/tog/Desktop/code/solo/xyj-134/app.js#L90-L127) 完全随机生成 80 个城市，只有一个中心都市，其余大小相近，道路也是局部随机。

**迭代内容**：

- 城市规模分 4 级：特大城市（1-2 个，人口 300w+，size 55）/ 大城市（3-5 个，100w-200w，size 40）/ 中等城市（10-15 个，20w-80w，size 28）/ 小城镇（50+ 个，5w-15w，size 18）
- 使用「中心地理论」算法生成：围绕中心都市按六边形网格分布大城市，每个大城市周围再分布中等城市，以此类推（不再是完全随机散布）
- 道路生成：
  - 特大城市 ↔ 特大城市：高速公路（粗橙色双虚线）
  - 大城市 ↔ 中等城市：国道（中黄色实线）
  - 中等 ↔ 小城镇：县道（细灰色点线）
  - 道路交叉点自动生成「小镇」节点
- 城市名称按级别生成更真实的层级感（特大城市用「XX 都会」、大城市用「XX 市」、中等用「XX 城」、小镇用「XX 镇」）

**改造点**：

- 重写 `generateCities`：改为 3 步嵌套算法
  - 第 1 步：生成特大城市 1-2 个（含固定的「中心都市」）
  - 第 2 步：六边形网格布点生成大城市，过滤重叠点
  - 第 3 步：围绕每个大城市径向生成中等城市和小城镇
- `generateRoads` 重写为按城市级别分类生成，并在道路对象中增加 `type: 'highway'|'national'|'county'` 字段
- `drawRoadsLayer` 根据 `road.type` 使用不同的 `strokeStyle`/`lineWidth`/`setLineDash`
- `getCityName` 根据城市级别参数切换后缀词库

***

### 7. 爆炸高度参数精细化（连续滑块 + 物理修正增强）

**现状**：[burstHeight](file:///Users/tog/Desktop/code/solo/xyj-134/app.js#L44-L53) 只有 5 个离散档位，物理修正仅用简单的 `pressureFactor`。

**迭代内容**：

- 从 `<select>` 改为连续滑块（范围 0m \~ 10,000m，步长 50m），旁边保留常用档位快捷按钮（地面/低空/中空/高空/超高空）作为一键设置
- 物理修正升级：
  - 超高空爆炸（>3000m）：火球半径增大 30%，冲击波衰减更快（超压半径减小 40%），辐射范围大增
  - 近地爆炸（<200m）：火球半径减小但弹坑出现（新增一个「弹坑」圈层），致命辐射粉尘化，沉降物生成量提高 2 倍
  - 最优空爆高度（约 2 × 火球半径）：冲击波叠加效应，中度破坏区半径额外扩大 15%
- 高度滑块下方新增「当前高度效应说明」动态文本：根据当前值显示效应描述

**改造点**：

- HTML 将 `<select id="burstHeight">` 改为 `<input type="range" id="burstHeightSlider">` + 一组快捷按钮
- `calculateRadii` 重写高度修正部分：
  - 新增 `optimalAltitude = 2000 * fireballRadius` 计算最优爆炸高度
  - 增加 `craterRadius = max(0, (300 - burstHeight) / 300) * fireballRadius * 0.4`
  - 高度因子改用分段函数而不是简单指数
- 新增第 7 个圈层「弹坑」（仅在 burstHeight < 200 时绘制和显示）
- 侧边栏新增动态说明 DOM，参数变化时 JS 更新文本内容

***

### 8. 图例与标签系统增强（交叉区域说明 + 多语言）

**现状**：[图例](file:///Users/tog/Desktop/code/solo/xyj-134/index.html#L105-L151) 和标签是静态中文，两个圈层重叠区域（例如既在辐射区又在严重破坏区）没有特别说明。

**迭代内容**：

- 页面右上角新增语言切换按钮：中 / 英 / 日 三语切换，切换后整个 UI 所有文本（标题、按钮、标签、说明、图例、数据卡片标题）即时翻译
- 鼠标悬停在地图上某点时，在鼠标旁显示浮动提示卡，显示该点所在的所有圈层名称、到爆炸中心的精确距离、该点的综合破坏等级评估
- 图例增加「常见组合」说明卡片：例如「绿色辐射圈 + 红色严重破坏圈重叠区 = 人员几乎 100% 死亡」
- 数据面板每个数值支持悬停显示单位换算（如同时显示 km / 英里，TJ / 吨 TNT 当量）

**改造点**：

- 新增 `I18N` 常量对象：`{zh: {...}, en: {...}, ja: {...}}`，收录页面所有可翻译文本的 key-value
- 新增 `applyLanguage(lang)` 函数：遍历所有带 `data-i18n` 属性的 DOM 元素，替换其 `textContent`；canvas 内文字（圈层标签、城市名说明部分）通过 `drawMap` 重新绘制
- 新增 `mouseMove` 监听：根据鼠标坐标计算到爆炸中心的距离，判断落入哪些圈层，用 `zones.filter()` 输出重叠情况，浮动提示卡用绝对定位 div 显示
- 数值元素增加 `title` 属性（浏览器原生 tooltip），内容为换算后的数值

***

## 三、代码理解建议

***

### 建议 1：深入理解 [calculateRadii](file:///Users/tog/Desktop/code/solo/xyj-134/app.js#L66-L88) 的物理公式体系

#### 理解路径（建议分 4 步逐步验证）

**第 1 步：拆解 6 个公式的数学结构**

```
火球半径:      0.14 × W_MT^0.4
致命辐射半径:  1.2 × W_MT^(1/3) × 地爆系数
严重破坏(20psi): 0.7 × W_MT^(1/3) × 2.5
中度破坏(5psi):  0.7 × W_MT^(1/3) × 4.5
轻度破坏(1psi):  0.7 × W_MT^(1/3) × 8
热辐射半径:    2.8 × W_MT^0.41
```

观察规律：

- 火球 / 热辐射 用 **0.4 次幂**（表面积/热效应相关，按当量增长更慢）
- 压力 / 辐射 用 **1/3 次幂**（体积相关，按当量立方根增长）
- 压力类三圈层公式主干完全相同（`0.7 × W_MT^(1/3)`），仅倍率不同（2.5 / 4.5 / 8）→ 反映 20psi / 5psi / 1psi 的距离反比关系

**第 2 步：手算几个基准点，用浏览器控制台验证**

打开浏览器开发者工具，在 Console 中：

```js
// 以小男孩 15 千吨（=0.015 百万吨）为例，手工计算
const W_MT = 0.015;
const expectedFireball = 0.14 * Math.pow(W_MT, 0.4); 
console.log('手算火球半径:', expectedFireball); // 约 0.037 km = 37m
// 然后对比页面显示的火球半径值，判断误差
```

再试沙皇炸弹 50000 千吨，验证大数情况是否符合预期。

**第 3 步：理解高度修正的物理含义**

逐行分析修正因子：

- `heightFactor = max(0.85, 1 - burstHeight/10000)`：对 4 个压力类圈层统一乘以此系数，高度越高系数越小 → 解释：高空爆炸冲击波到达地面更分散
- `pressureFactor = exp(-burstHeight/2000)`：仅作用于辐射半径，高度越高指数衰减 → 解释：辐射在空气中的衰减与高度指数相关
- 热辐射的 `(burstHeight > 0 ? 1.15 : 0.9)`：空爆热辐射反而增强，地爆被尘埃遮蔽 → 解释：空爆火球视野更好，热辐射覆盖更广

**第 4 步：通过反向测试理解公式边界**

故意输入极端值观察行为：

- `yieldKilotons = 0.001`（1 吨 TNT，几乎最小）→ 观察各半径是否被 `Math.max(0.1, ...)` 截断
- `burstHeight = 99999`（极端高空）→ `pressureFactor` 趋近于 0，观察辐射半径是否异常缩小
- 切换不同预设核弹，记录各圈层半径比值，验证「火球/热辐射的增长速率慢于压力圈层」这一规律

#### 理解产出

完成上述 4 步后，写一份注释文档贴到 `calculateRadii` 函数上方，标注每个公式的来源假设、适用范围、修正因子的物理解释。这将作为后续任何修改该函数的「安全护栏」。

***

### 建议 2：可视化拆解 [animateExplosion](file:///Users/tog/Desktop/code/solo/xyj-134/app.js#L490-L704) 的状态机结构

#### 理解路径（4 个阶段 + 调试方法）

**第 1 步：在代码中标记 4 个状态边界**

用注释在 `draw(now)` 函数内标记：

```
progress = elapsed / 5000

progress ∈ [0, 0.05]   → 阶段 1：闪光 + 火球膨胀（极短，~250ms）
progress ∈ [0.05, 0.2]  → 阶段 2：火球达到最大 + 开始稳定（~750ms）
progress ∈ [0.2, 0.5]   → 阶段 3：冲击波扩散 + 粒子飞溅（~1500ms）
progress ∈ [0.5, 1.0]   → 阶段 4：蘑菇云升腾 + 碎屑（~2500ms）
```

**第 2 步：为每个阶段建立「输入 → 视觉输出」对应表**

| 阶段   | 输入参数                         | 视觉元素             | 关键变量                                    |
| ---- | ---------------------------- | ---------------- | --------------------------------------- |
| 阶段 1 | `p = progress / 0.05`        | 全屏闪光 + 火球从 0 膨胀  | `flashAlpha`, `currentFireballRadius`   |
| 阶段 2 | `fireballP = progress / 0.2` | 火球内/外双层渐变 + 脉动   | `drawPersistentFireball(0.2)`           |
| 阶段 3 | `swP = (progress-0.2)/0.3`   | 5 层冲击波环 + 150 粒子 | `currentSW`, `swAlpha`, particles 数组    |
| 阶段 4 | `mp = (progress-0.5)/0.5`    | 云柱 + 蘑菇冠 + 碎屑    | `cloudY`, `cloudBaseWidth`, `stemWidth` |

**第 3 步：用临时调试钩子观察变量**

在 `draw` 函数内加入临时控制台输出（仅调试时使用，事后删除）：

```js
// 在 draw(now) 开头插入
if (Math.random() < 0.02) { // 降低输出频率
  console.log('阶段:', 
    progress <= 0.05 ? '1闪光' :
    progress <= 0.2  ? '2火球' :
    progress <= 0.5  ? '3冲击波' : '4蘑菇云',
    'progress:', progress.toFixed(3));
}
```

点击引爆观察 Console 中 4 个阶段的切换时机是否符合预期。

**第 4 步：关键参数敏感性测试**

逐个修改以下常量，观察视觉变化，理解其作用：

- `totalDuration = 5000` → 改为 10000 看慢放、改为 1000 看快放
- `particleCount = 150` → 改为 500 观察粒子系统对帧率的影响
- 阶段 3 中的 `i < 4`（冲击波环数量）→ 改为 8 层的效果
- 阶段 4 中的 `cloudY = cy - mp * 150 * scale / 20` → 修改 150 观察蘑菇云高度变化

#### 理解产出

画一张时序图（ASCII 即可），横轴为 progress (0\~1)，纵轴为视觉元素，标注各元素的出现/消失/渐隐时间点，作为后续扩展动画模块的参考蓝图。

***

## 四、代码重构建议

***

### 建议 1：IIFE 单体 → 模块化拆分（文件级重构）

#### 现状问题

[app.js](file:///Users/tog/Desktop/code/solo/xyj-134/app.js) 单文件 828 行，包含物理计算、Canvas 渲染、UI 交互、动画系统、数据展示 5 个完全不同的职责，耦合严重，难以多人协作和单元测试。

#### 重构步骤（可分步实施，每步都保持功能完整）

**第 1 步：建立目录结构**

```
xyj-134/
├── index.html
├── styles.css
└── src/
    ├── main.js              ← 入口，组装所有模块
    ├── physics/
    │   └── nuclear.js       ← calculateRadii, BOMB_TYPES, 伤亡算法
    ├── rendering/
    │   ├── mapRenderer.js   ← drawMap, drawTerrain, drawCities, drawGrid 等
    │   └── zoneRenderer.js  ← drawExplosionZones, 图例绘制
    ├── animation/
    │   └── explosion.js     ← animateExplosion, 粒子系统, 蘑菇云
    ├── ui/
    │   ├── controls.js      ← 侧边栏滑块/按钮事件, setupEventListeners
    │   └── dataDisplay.js   ← updateDataDisplay, formatNumber
    └── core/
        ├── state.js         ← state 对象 + getState/setState
        └── canvas.js        ← setupCanvas, getCtx, 画布尺寸管理
```

**第 2 步：逐模块剥离（以 physics/nuclear.js 为例）**

```js
// src/physics/nuclear.js — 完全纯函数，零 DOM 依赖
export const BOMB_TYPES = { /* 原有常量 */ };

export function calculateRadii(yieldKilotons, burstHeight) {
  // 原有函数体，一字不改
}

export function estimateCasualties(cities, center, scale, radii) {
  // 将 updateDataDisplay 中的伤亡计算逻辑抽出为纯函数
  // 输入 cities 数组和参数，返回 { deaths, injured, destroyedCityIds }
}
```

判断剥离是否成功的标准：这个文件**不包含任何 document.getElementById / Canvas / 事件监听**，可以直接被 Node.js 或 Jest 引入进行单元测试。

**第 3 步：管理模块间依赖**

用显式 import 代替全局共享：

```js
// animation/explosion.js
import { calculateRadii } from '../physics/nuclear.js';
import { getState } from '../core/state.js';
```

**第 4 步：main.js 作为组合根**

```js
// main.js
import { initState, getState } from './core/state.js';
import { setupCanvas } from './core/canvas.js';
import { setupControls } from './ui/controls.js';
import { drawFullMap } from './rendering/mapRenderer.js';
import { startExplosion } from './animation/explosion.js';

document.addEventListener('DOMContentLoaded', () => {
  initState();
  setupCanvas();
  setupControls();
  drawFullMap();
  // ...
});
```

**第 5 步：接入原生 ES Modules 或构建工具**

- 最简方案：HTML 中 `<script type="module" src="src/main.js"></script>` 即可（现代浏览器支持）
- 进阶方案：引入 Vite，获得 Tree-shaking + HMR + 打包优化

#### 重构收益

1. 每个模块可独立单元测试（特别是 physics 模块，见测试建议章节）
2. 多人开发时可按模块并行开发，减少 Git 冲突
3. 新增功能时能准确找到修改位置，降低遗漏风险
4. 为 TypeScript 迁移铺路（模块边界 = 类型边界）

***

### 建议 2：裸 state 对象 → 发布订阅模式 + 不可变更新

#### 现状问题

```js
// 任何地方都可以直接修改 state，无通知机制：
state.yieldKilotons = 15000;
state.explosionCenter = {x, y};
// 修改后必须手动调用 updateCalculations() + drawMap()，极易遗漏
```

症状：

- [init 函数](file:///Users/tog/Desktop/code/solo/xyj-134/app.js#L812-L825) 中 `updateCalculations` 重复调用两次（见评估报告中缺陷 1）
- 每次事件回调末尾都要手写 `updateCalculations(); drawMap();`，偶尔漏写就导致 UI 不刷新

#### 重构方案

**第 1 步：封装 state 为 Store 类**

```js
// src/core/state.js
const listeners = new Set();

let state = { /* 原有字段 */ };

export function getState() {
  return { ...state }; // 返回浅拷贝，防止外部直接修改
}

export function setState(patch) {
  // 1. 不可变更新：创建新对象而不是修改原对象
  const newState = { ...state, ...patch };
  
  // 2. 浅比较检测是否真的变化了（简单实现）
  const changed = Object.keys(patch).some(key => state[key] !== newState[key]);
  if (!changed) return;
  
  // 3. 提交更新
  state = newState;
  
  // 4. 通知所有订阅者
  listeners.forEach(fn => fn(state, patch));
}

export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn); // 返回取消订阅函数
}
```

**第 2 步：建立「派生数据」响应式链**

什么是派生数据？`radii` 就是从 `yieldKilotons` + `burstHeight` 派生的；伤亡数字是从 `radii` + `cities` + `explosionCenter` 派生的。

```js
// src/core/derived.js
import { getState, setState, subscribe } from './state.js';
import { calculateRadii, estimateCasualties } from '../physics/nuclear.js';

// 订阅 state 变化，自动重算派生值
subscribe((state, patch) => {
  // 如果当量或高度变了 → 重算 radii
  if (patch.yieldKilotons !== undefined || patch.burstHeight !== undefined) {
    const radii = calculateRadii(state.yieldKilotons, state.burstHeight);
    setState({ radii }); // 这会再次触发 subscribe，但下一轮不会进入该分支
  }
  
  // 如果 radii 或爆炸中心变了 → 重算伤亡数据
  if (patch.radii !== undefined || patch.explosionCenter !== undefined || patch.cities !== undefined) {
    if (state.radii && state.explosionCenter) {
      const casualties = estimateCasualties(
        state.cities, state.explosionCenter, state.scale, state.radii
      );
      // 伤亡数据也放入 state 中，UI 层直接订阅读取
      setState({ casualtyData: casualties });
    }
  }
});
```

**第 3 步：UI 层订阅并自动刷新**

```js
// src/ui/dataDisplay.js
import { subscribe, getState } from '../core/state.js';

// UI 只订阅，不关心数据从哪来
subscribe((state) => {
  if (state.radii) renderRadiiData(state.radii);
  if (state.casualtyData) renderCasualties(state.casualtyData);
});

// src/rendering/mapRenderer.js
subscribe((state) => {
  // 任何 state 变化都重绘地图（简单粗暴，后续可加 diff 优化）
  drawFullMap(state);
});
```

**第 4 步：事件回调简化**

原来每个回调要写 3 行：

```js
elements.yieldSlider.addEventListener('input', e => {
  state.yieldKilotons = parseInt(e.target.value, 10);
  updateCalculations();
  drawMap();
});
```

现在简化为 1 行 setState：

```js
elements.yieldSlider.addEventListener('input', e => {
  setState({ yieldKilotons: parseInt(e.target.value, 10) });
});
```

数据更新链自动完成：`yieldKilotons` 变化 → `radii` 重算 → 伤亡重算 → UI 订阅者全部刷新。

#### 重构收益

1. **消除重复调用**：init 中两次 updateCalculations 的问题自然消失
2. **减少遗漏风险**：回调只负责更新源数据，派生数据和 UI 刷新全自动
3. **可调试性强**：subscribe 中加 `console.log` 可以打印每一次 state 变更轨迹
4. **为时间旅行调试 / undo/redo 功能铺路**：所有 state 变更都经过 setState，可被记录和回放

***

## 五、代码测试建议

***

### 建议 1：物理计算单元测试（physics 模块）

#### 测试目标

验证 [calculateRadii](file:///Users/tog/Desktop/code/solo/xyj-134/app.js#L66-L88) 和伤亡估算函数的公式正确性、边界值处理、极端值鲁棒性。

#### 测试框架选型

使用 **Vitest**（零配置、基于 Vite、与 ES Modules 原生兼容、速度极快）。

#### 实施步骤

**第 1 步：初始化测试环境**

```bash
cd /Users/tog/Desktop/code/solo/xyj-134
npm init -y
npm install -D vitest
```

在 `package.json` 中增加：

```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest"
  }
}
```

**第 2 步：将物理函数剥离为纯模块**（与重构建议 1 的 physics/nuclear.js 相同）

**第 3 步：编写测试用例（示例：tests/physics.test.js）**

```js
import { describe, it, expect } from 'vitest';
import { calculateRadii, estimateCasualties } from '../src/physics/nuclear.js';

describe('calculateRadii 公式验证', () => {

  // 用例 1：公开已知数据对照（小男孩 15 千吨）
  it('小男孩(15kt)地爆的火球半径应接近公开数据 37m', () => {
    const r = calculateRadii(15, 0); // 15 千吨，地面爆炸
    expect(r.fireball).toBeGreaterThan(0.03);  // 30m
    expect(r.fireball).toBeLessThan(0.06);     // 60m
  });

  // 用例 2：沙皇炸弹尺度合理性
  it('沙皇炸弹(50Mt)火球半径应 > 2km, 热辐射 > 30km', () => {
    const r = calculateRadii(50000, 4000);
    expect(r.fireball).toBeGreaterThan(2);
    expect(r.thermal).toBeGreaterThan(30);
  });

  // 用例 3：半径大小顺序不变（任何参数下）
  it('各圈层半径应严格满足: 热辐射 > 轻度 > 中度 > 严重 > 辐射 > 火球', () => {
    for (let W = 1; W <= 50000; W *= 10) {
      for (let H of [0, 500, 1000, 5000]) {
        const r = calculateRadii(W, H);
        const order = [r.thermal, r.light, r.moderate, r.severe, r.radiation, r.fireball];
        for (let i = 0; i < order.length - 1; i++) {
          expect(order[i]).toBeGreaterThan(order[i + 1], 
            `W=${W}, H=${H} 时圈层顺序异常`);
        }
      }
    }
  });

  // 用例 4：边界值 — 极小当量不会出现负半径或 NaN
  it('极小当量(0.001kt)不会产生 NaN 或负半径', () => {
    const r = calculateRadii(0.001, 0);
    Object.values(r).forEach(val => {
      expect(Number.isFinite(val)).toBe(true);
      expect(val).toBeGreaterThan(0);
    });
  });

  // 用例 5：单调性 — 当量增大，各半径单调不减
  it('当量增加时各圈层半径应单调不减', () => {
    let prev = calculateRadii(100, 1000);
    for (let W = 200; W <= 10000; W += 100) {
      const curr = calculateRadii(W, 1000);
      expect(curr.fireball).toBeGreaterThanOrEqual(prev.fireball);
      expect(curr.thermal).toBeGreaterThanOrEqual(prev.thermal);
      expect(curr.light).toBeGreaterThanOrEqual(prev.light);
      prev = curr;
    }
  });

  // 用例 6：高度影响 — 地爆 vs 空爆的热辐射差异
  it('相同当量下，空爆(burstHeight>0)热辐射半径应大于地爆', () => {
    const ground = calculateRadii(1000, 0);
    const air = calculateRadii(1000, 2000);
    expect(air.thermal).toBeGreaterThan(ground.thermal);
  });
});

describe('estimateCasualties 伤亡估算', () => {

  // 用例 7：极远城市伤亡为 0
  it('距离爆炸中心极远的城市伤亡应为 0', () => {
    const cities = [{x: 0, y: 0, population: 1000000}];
    const center = {x: 99999, y: 99999}; // 极远
    const scale = 20;
    const radii = calculateRadii(15000, 1000);
    const result = estimateCasualties(cities, center, scale, radii);
    expect(result.deaths).toBe(0);
    expect(result.injured).toBe(0);
  });

  // 用例 8：火球内城市死亡率极高（>95%）
  it('位于火球内的城市死亡率应 > 95%', () => {
    const radii = calculateRadii(50000, 1000); // 沙皇炸弹
    const scale = 100; // 100px/km，方便放置城市
    const cityX = 0;
    const cityY = 0;
    const cities = [{x: cityX, y: cityY, population: 1000000}];
    const center = {x: cityX, y: cityY}; // 正好在中心
    const result = estimateCasualties(cities, center, scale, radii);
    expect(result.deaths / 1000000).toBeGreaterThan(0.95);
  });

  // 用例 9：伤亡数字不会超过总人口（数学完整性）
  it('死亡 + 受伤不应超过总人口', () => {
    const radii = calculateRadii(15000, 1000);
    const cities = [];
    for (let i = 0; i < 20; i++) {
      cities.push({x: i * 30, y: i * 30, population: 100000});
    }
    const center = {x: 300, y: 300};
    const result = estimateCasualties(cities, center, 20, radii);
    const totalPop = cities.reduce((s, c) => s + c.population, 0);
    expect(result.deaths + result.injured).toBeLessThanOrEqual(totalPop * 1.001); // 留浮点误差
  });
});
```

**第 4 步：运行测试并建立基线**

```bash
npm test
```

全部通过后，将测试命令加入 CI 流程（见工程化建议）。后续任何修改 `calculateRadii` 或新增参数时，先跑测试，确保没有破坏已知规律。

#### 测试价值

- 防止修改物理公式时引入回归错误（例如调整高度修正后不小心破坏了单调性）
- 边界值测试覆盖极端输入场景（极小值、极大值、NaN 防护）
- 数学完整性检查（伤亡不超过总人口等）对后续重构起到安全网作用

***

### 建议 2：动画集成测试（状态转换 + 生命周期）

#### 测试目标

验证 [animateExplosion](file:///Users/tog/Desktop/code/solo/xyj-134/app.js#L490-L704) 的生命周期完整性：启动 → 4 个阶段按序出现 → 结束后按钮恢复、资源清理、重复引爆不崩溃。

#### 测试技术选型

使用 **Playwright**（浏览器自动化，支持无头模式截图 + DOM 检查 + JS 执行 + 网络捕获）。

#### 实施步骤

**第 1 步：安装 Playwright**

```bash
npm install -D @playwright/test
npx playwright install chromium  # 只安装 chrome，减少体积
```

**第 2 步：编写测试用例（tests/explosion.spec.js）**

```js
import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:8080'; // 需要本地先启动 http.server

test.describe('爆炸动画生命周期', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
    // 等待画布初始化完成
    await page.waitForSelector('#mapCanvas');
  });

  // 用例 1：初始状态 — 引爆按钮可用，动画未运行
  test('初始状态引爆按钮应可点击', async ({ page }) => {
    const btn = page.locator('#detonateBtn');
    await expect(btn).toBeEnabled();
  });

  // 用例 2：未选择位置时点击引爆 → 弹出 alert
  test('未选爆炸点点击引爆应 alert', async ({ page }) => {
    // 先重置确保无爆炸点
    await page.click('#resetBtn');
    // 监听 dialog
    page.on('dialog', async dialog => {
      expect(dialog.message()).toContain('选择爆炸位置');
      await dialog.accept();
    });
    await page.click('#detonateBtn');
  });

  // 用例 3：引爆后按钮禁用，动画结束后恢复（关键生命周期测试）
  test('引爆后按钮禁用，5.5秒内恢复可用', async ({ page }) => {
    // 先选爆炸点（点击画布中心）
    const canvas = page.locator('#mapCanvas');
    const box = await canvas.boundingBox();
    await canvas.click({
      position: { x: box.width / 2, y: box.height / 2 }
    });

    const btn = page.locator('#detonateBtn');

    // 点击引爆
    const startTime = Date.now();
    await btn.click();

    // 0.5 秒内应变为禁用
    await expect(btn).toBeDisabled({ timeout: 500 });

    // 6 秒内应恢复可用（动画 5 秒 + 0.5 秒缓冲）
    await expect(btn).toBeEnabled({ timeout: 6500 });
    const elapsed = Date.now() - startTime;
    // 且至少花了 5 秒（不能瞬间完成，说明动画被跳过了）
    expect(elapsed).toBeGreaterThan(5000);
  });

  // 用例 4：连续引爆不崩溃（无内存泄漏 / 状态错位）
  test('连续 3 次引爆不报错，每次按钮状态正确', async ({ page }) => {
    const canvas = page.locator('#mapCanvas');
    const box = await canvas.boundingBox();
    await canvas.click({ position: { x: box.width / 2, y: box.height / 2 } });

    const errors = [];
    page.on('pageerror', e => errors.push(e));

    for (let i = 0; i < 3; i++) {
      await page.locator('#detonateBtn').click();
      await expect(page.locator('#detonateBtn')).toBeDisabled();
      await expect(page.locator('#detonateBtn')).toBeEnabled({ timeout: 6500 });
    }

    // 3 次引爆后页面不应有 JS 错误
    expect(errors).toHaveLength(0);
  });

  // 用例 5：动画中 reset 能正确中断
  test('动画中途点击 reset 应立即停止并重置按钮状态', async ({ page }) => {
    const canvas = page.locator('#mapCanvas');
    const box = await canvas.boundingBox();
    await canvas.click({ position: { x: box.width / 2, y: box.height / 2 } });

    const btn = page.locator('#detonateBtn');
    const resetBtn = page.locator('#resetBtn');

    await btn.click();
    await expect(btn).toBeDisabled({ timeout: 500 });

    // 2 秒后（动画中途）点击 reset
    await page.waitForTimeout(2000);
    await resetBtn.click();

    // 1 秒内按钮应恢复可用（不必等动画结束）
    await expect(btn).toBeEnabled({ timeout: 1500 });
  });

  // 用例 6：引爆后数据面板数值不为 0
  test('引爆后各半径数据面板应显示正值', async ({ page }) => {
    const canvas = page.locator('#mapCanvas');
    const box = await canvas.boundingBox();
    await canvas.click({ position: { x: box.width / 2, y: box.height / 2 } });

    // 检查数据
    const fireball = await page.locator('#fireballRadius').textContent();
    expect(parseFloat(fireball)).toBeGreaterThan(0);

    const deaths = await page.locator('#estimatedDeaths').textContent();
    // 死亡文本应包含数字（不能是纯 "0"）
    expect(deaths).not.toBe('0');
  });
});
```

**第 3 步：运行测试**

```bash
# 先确保 HTTP 服务器在运行（本项目已在 8080 启动）
npx playwright test tests/explosion.spec.js
```

**第 4 步：高级扩展 — 截图快照对比**

```js
// 在用例 3 中，动画结束后截图并与基线对比
await page.waitForTimeout(500); // 动画完全结束
await expect(page).toHaveScreenshot('after-explosion.png', {
  maxDiffPixels: 1000, // 允许 1000 像素差异（抗锯齿/随机元素）
});
```

首次运行会生成 `after-explosion.png` 作为基线，后续运行如果页面视觉差异过大，测试会失败。

#### 测试价值

- 覆盖了纯单元测试无法触达的 DOM + Canvas + 定时器的集成行为
- 连续引爆测试可以提前发现 `animationId` 未清理、`isAnimating` 状态未重置等常见 Bug
- 可以作为重构后的回归验证：完成模块化/状态管理重构后，确保外部行为没有改变

***

## 六、代码工程化建议

***

### 建议 1：构建流水线配置（Vite + ESLint + Prettier + 版本注入）

#### 目标

建立一套「开发时即时反馈、提交前自动校验、构建时自动优化」的工程流水线。

#### 实施步骤

**第 1 步：引入 Vite 作为构建工具**

```bash
npm install -D vite
```

创建 `vite.config.js`：

```js
import { defineConfig } from 'vite';
import { version } from './package.json';

export default defineConfig({
  root: '.',
  base: './',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: true,        // 生产环境保留 sourcemap 方便调试
    target: 'es2018',       // 兼容主流现代浏览器
    rollupOptions: {
      input: {
        main: './index.html'
      },
      output: {
        manualChunks: {     // 按模块拆包，优化缓存命中率
          'physics': ['./src/physics/nuclear.js'],
          'rendering': ['./src/rendering/mapRenderer.js', './src/rendering/zoneRenderer.js'],
          'animation': ['./src/animation/explosion.js'],
        }
      }
    }
  },
  define: {
    // 在代码中注入版本号和构建时间，页面 footer 处可展示
    __APP_VERSION__: JSON.stringify(version),
    __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
  },
  server: {
    port: 8080,             // 与现有 http.server 端口一致，无痛切换
    open: true,             // dev 启动时自动打开浏览器
    host: true              // 允许局域网访问（手机测试方便）
  }
});
```

更新 `package.json` scripts：

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview --port 8080"
  }
}
```

**第 2 步：配置 ESLint + Prettier 统一代码风格**

```bash
npm install -D eslint prettier eslint-config-prettier eslint-plugin-prettier
```

创建 `.eslintrc.cjs`：

```js
module.exports = {
  env: { browser: true, es2022: true },
  extends: ['eslint:recommended', 'plugin:prettier/recommended'],
  parserOptions: { ecmaVersion: 'latest', sourceType: 'module' },
  rules: {
    'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    'no-console': ['warn', { allow: ['warn', 'error'] }], // 禁止遗留 console.log
    'prefer-const': 'error',
    'eqeqeq': ['error', 'smart'],
    'curly': ['error', 'all'],
    'prefer-template': 'error'
  },
  globals: {
    __APP_VERSION__: 'readonly',
    __BUILD_TIME__: 'readonly'
  }
};
```

创建 `.prettierrc`：

```json
{
  "semi": true,
  "singleQuote": true,
  "trailingComma": "es5",
  "printWidth": 100,
  "tabWidth": 2,
  "arrowParens": "always"
}
```

**第 3 步：配置 Husky + lint-staged，提交前自动格式化**

```bash
npm install -D husky lint-staged
npx husky install
npx husky add .husky/pre-commit "npx lint-staged"
```

在 `package.json` 新增：

```json
{
  "lint-staged": {
    "*.js": ["eslint --fix", "prettier --write"],
    "*.css": ["prettier --write"],
    "*.html": ["prettier --write"]
  }
}
```

效果：每次 `git commit` 前，暂存区的 JS/CSS/HTML 文件会自动被 ESLint 修复 + Prettier 格式化，避免格式不统一、遗漏 `console.log`、未使用变量等低级问题。

**第 4 步：版本号与构建时间注入到页面**

在 footer 处展示，便于排查用户访问的是哪个版本：

```html
<!-- index.html footer 内追加 -->
<p>版本 <span id="appVersion"></span> · 构建于 <span id="buildTime"></span></p>
```

```js
// main.js 末尾
document.getElementById('appVersion').textContent = __APP_VERSION__;
document.getElementById('buildTime').textContent = 
  new Date(__BUILD_TIME__).toLocaleString('zh-CN');
```

#### 工程化收益

1. `npm run dev` 启动的开发服务器有 HMR（热模块替换），保存文件后浏览器自动局部刷新，不再需要手动 F5
2. ESLint 在保存/提交时即时反馈代码问题，避免低级错误在 Review 中才被发现
3. 生产构建自动压缩、拆包、sourcemap，首屏加载性能显著提升
4. 提交前自动格式化，团队成员代码风格完全一致，Git diff 中不会出现格式变更噪音

***

### 建议 2：可访问性与性能工程化（Lighthouse CI 门禁 + Canvas 性能基准）

#### 目标

建立**不可回退**的质量基线：可访问性评分 ≥ 90，性能评分 ≥ 85，任何 PR 导致评分下降则自动拦截。同时为 Canvas 渲染和动画建立性能基准测试。

#### 实施步骤

**第 1 步：安装 Lighthouse CI**

```bash
npm install -D @lhci/cli
```

创建 `lighthouserc.cjs`：

```js
module.exports = {
  ci: {
    collect: {
      staticDistDir: './dist', // 基于 Vite 构建产物测试
      url: ['http://localhost/index.html'],
      numberOfRuns: 3,         // 跑 3 次取中位数，减少波动
      settings: {
        preset: 'desktop',     // 桌面端配置（本项目主要是桌面交互）
        chromeFlags: '--no-sandbox'
      }
    },
    assert: {
      assertions: {
        // 核心评分门禁
        'categories:performance': ['warn', { minScore: 0.85 }],
        'categories:accessibility': ['error', { minScore: 0.9 }],
        'categories:best-practices': ['warn', { minScore: 0.9 }],
        // 性能指标门禁（毫秒）
        'largest-contentful-paint': ['warn', { maxNumericValue: 2500 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],
        'total-blocking-time': ['warn', { maxNumericValue: 300 }],
        // 可访问性硬规则
        'button-name': ['error', {}],          // 所有按钮必须有可读名称
        'color-contrast': ['error', {}],       // 颜色对比度达标
        'label': ['error', {}],                // 表单控件都有 label
        'meta-viewport': ['error', {}],        // 移动端 viewport 设置
        'bypass': ['warn', {}]                 // 提供跳过导航链接
      }
    },
    upload: {
      target: 'temporary-public-storage'       // 免费临时存储报告
    }
  }
};
```

**第 2 步：立即发现并修复可访问性问题（基于当前项目已知问题）**

| 当前问题位置                        | 问题                | 修复方式                                                                                                     |
| ----------------------------- | ----------------- | -------------------------------------------------------------------------------------------------------- |
| `#detonateBtn` 内只有 emoji + 中文 | emoji 可能被读屏软件识别异常 | 给 button 添加 `aria-label="引爆核弹"`                                                                          |
| `#mapCanvas` 无描述              | 画布对无障碍用户不可感知      | 添加 `role="img"` + `aria-label="核爆范围模拟地图，可点击选择爆炸位置"`                                                      |
| range 滑块无 aria                | 读屏用户无法理解滑块数值含义    | 添加 `aria-valuemin`, `aria-valuemax`, `aria-valuenow`, `aria-label="爆炸当量千吨 TNT"`，`input` 事件中同步更新 valuenow |
| 地图 hint 在 opacity:0 时仍存在      | 屏幕阅读器仍会朗读不可见内容    | `.map-hint.hidden` 增加 `display:none` 或 `visibility:hidden`                                               |
| 侧边栏分区无语义容器                    | 读屏用户无法快速跳转        | 将每个 `.panel-section` 包在 `<section aria-labelledby="...">` 内，h2 加 id                                      |

**第 3 步：建立 Canvas 性能基准测试**

创建 `tests/perf/benchmark.js`：

```js
import { calculateRadii } from '../../src/physics/nuclear.js';
import { drawFullMap } from '../../src/rendering/mapRenderer.js';

// 基准 1：物理计算吞吐
export function benchmarkPhysics() {
  const ITER = 100_000;
  const t0 = performance.now();
  for (let i = 0; i < ITER; i++) {
    calculateRadii(1 + (i % 50000), (i * 7) % 5000);
  }
  const t1 = performance.now();
  return {
    name: 'calculateRadii',
    totalMs: (t1 - t0).toFixed(2),
    perCallUs: ((t1 - t0) * 1000 / ITER).toFixed(3), // 微秒/次
    iterations: ITER
  };
}

// 基准 2：地图重绘帧率（模拟滑块拖动时的连续重绘）
export function benchmarkMapDraw(n = 500) {
  // 假设已在测试页面中初始化了 canvas 和 ctx
  const canvas = document.getElementById('mapCanvas');
  const ctx = canvas.getContext('2d');
  const state = { /* 构造一个典型状态 */ };

  const t0 = performance.now();
  for (let i = 0; i < n; i++) {
    drawFullMap(ctx, state, canvas.width, canvas.height);
  }
  const t1 = performance.now();
  const fps = (n / (t1 - t0)) * 1000;
  return {
    name: 'drawFullMap',
    draws: n,
    totalMs: (t1 - t0).toFixed(2),
    fps: fps.toFixed(1),
    target: fps >= 30 ? 'PASS' : 'FAIL' // 连续拖动滑块至少 30fps 才不卡
  };
}

// 基准 3：动画单帧耗时（爆炸动画每帧必须 < 16ms 才能 60fps）
export function benchmarkAnimationFrame() {
  // 模拟一次 progress=0.4 时的 draw 调用（最复杂的冲击波阶段）
  const frames = 120; // 模拟 2 秒动画 @60fps
  let totalFrameTime = 0;
  
  for (let i = 0; i < frames; i++) {
    const t0 = performance.now();
    // 调用动画 draw 函数（需要构造 progress = i/frames）
    // simulateAnimationDraw(progress = i / frames)
    const t1 = performance.now();
    totalFrameTime += (t1 - t0);
  }
  
  const avgFrameMs = totalFrameTime / frames;
  return {
    name: 'animationFrame',
    avgMs: avgFrameMs.toFixed(3),
    targetFps: (1000 / avgFrameMs).toFixed(0),
    target: avgFrameMs <= 16.67 ? 'PASS' : 'FAIL' // 必须达到 60fps
  };
}

// CLI 执行时自动运行并打印报告
if (typeof process !== 'undefined' && process.argv.includes('--run')) {
  const results = [benchmarkPhysics(), benchmarkMapDraw(), benchmarkAnimationFrame()];
  console.table(results);
  const anyFail = results.some(r => r.target === 'FAIL');
  process.exit(anyFail ? 1 : 0);
}
```

在 `package.json` 增加：

```json
{
  "scripts": {
    "benchmark": "node tests/perf/benchmark.js --run",
    "lighthouse": "npm run build && lhci autorun"
  }
}
```

**第 4 步：在 CI 中集成（可选，示例 GitHub Actions）**

创建 `.github/workflows/ci.yml`：

```yaml
name: CI
on: [push, pull_request]
jobs:
  quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - run: npm ci
      - run: npm test                       # 单元测试 + 集成测试
      - run: npm run lint                   # ESLint 全量检查
      - run: npm run benchmark              # 性能基准（失败则 exit 1）
      - run: npm run lighthouse             # Lighthouse 门禁
```

#### 工程化收益

1. **可访问性门禁不可回退**：任何 PR 如果破坏了无障碍（如移除了 aria-label、降低了对比度），CI 会直接报错拦截
2. **性能问题提前暴露**：基准测试能在重构后发现「draw 函数新增了 2ms」这种肉眼看不出但会导致卡顿的退化
3. **合规性积累**：90+ 可访问性评分意味着视障用户、键盘操作用户也能正常使用本工具
4. **性能文化**：通过 30fps / 60fps 的明确数值目标，让后续功能开发时对性能开销有意识，避免「加一个功能卡一点」的温水煮青蛙

***

> 文档结束 · 以上建议可按任意顺序独立实施，互不依赖

