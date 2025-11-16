# Sky 光遇身高计算器 ⛰️

一个纯前端的光遇线下活动二维码解析工具，用于提取身高数据并计算游戏内实际身高。

![Sky 主题界面](https://img.shields.io/badge/主题-Sky光遇-00bfff?style=for-the-badge)
![纯前端](https://img.shields.io/badge/类型-纯前端-brightgreen?style=for-the-badge)
![无需后端](https://img.shields.io/badge/后端-不需要-orange?style=for-the-badge)

## ✨ 特性

- 🎨 **精美 Sky 主题** - 渐变星空背景、浮动云朵、闪烁星星
- 📱 **纯前端实现** - 无需服务器，本地即可运行
- 🔍 **多格式支持** - 自动识别三种 QR 编码格式
  - 标准 JSON 格式
  - Protobuf 压缩格式
  - JSON + 控制符格式
- 📤 **多种上传方式** - 支持拖拽、点击上传、摄像头拍摄
- ⚡ **智能解析** - 自动清理 Base64、多次尝试识别
- 💫 **流畅动画** - 加载动画、模态框淡入淡出

## 🚀 快速开始

### 在线使用

直接打开 `index.html` 即可使用，无需安装任何依赖。

### 本地运行

```bash
# 克隆仓库
git clone https://github.com/oivio-up/Sky-QR-For-Height.git

# 进入目录
cd Sky-QR-For-Height

# 直接打开 index.html（双击或用浏览器打开）
# 或者使用本地服务器
python -m http.server 8000
# 访问 http://localhost:8000
```

## 📖 使用说明

1. **上传 QR 码**
   - 拖拽图片到上传区域
   - 点击上传按钮选择文件
   - 使用摄像头拍摄

2. **查看结果**
   - 自动解析并显示身高数据
   - Height: 游戏内身高偏移值
   - Scale: 游戏内缩放值
   - Current Height: 计算出的实际身高（单位：头身）

3. **身高计算公式**
   ```
   当前身高 = 7.6 - 8.3 × scale - 3 × height
   ```

## 🔧 技术栈

- **HTML5** - 语义化标签、拖拽 API
- **CSS3** - Flexbox、动画、渐变、毛玻璃效果
- **JavaScript ES6+** - 模块化、箭头函数、Promise
- **jsQR** - QR 码解码库 (v1.4.0)

## 📊 支持的 QR 格式

### 格式 1: 标准 JSON
```json
{
  "height": -1.9236053,
  "scale": 0.014059073
}
```

### 格式 2: Protobuf 压缩
```
"height"[0x15][控制字节]数值字符串
"scale"[0x15][控制字节]数值字符串
```
- Scale 使用科学计数法: `ASCII数字 × 10^-10`

### 格式 3: JSON + 控制符
```json
{
  "height": -1.6489592[0xe7][0x00],
  "scale": 0.07281[0xe7][0x00]
}
```

## 🎯 有效值范围

- **Scale**: -0.2 ~ 0.2
- **Height**: -2.0 ~ 2.0

超出范围会显示警告。

## 📁 项目结构

```
Sky-QR-For-Height/
├── index.html          # 主页面
├── style.css           # 样式文件
├── script.js           # 核心逻辑
└── README.md           # 说明文档
```

## 🐛 故障排除

### QR 码无法识别
- 确保图片清晰，二维码完整
- 尝试调整图片亮度和对比度
- 避免二维码变形或遮挡

### 解析失败
- 检查是否为光遇线下活动二维码
- 某些特殊格式可能不支持

### 浏览器兼容性
- 推荐使用 Chrome、Firefox、Edge 等现代浏览器
- Safari 需要较新版本 (支持 ES6)

## 💡 原理说明

### 编码格式检测
1. 清理 Base64 字符串（移除非标准字符）
2. 尝试 Protobuf 格式解析（检测 `0x15` 标记）
3. 回退到 JSON 正则表达式匹配
4. 多次尝试不同对比度和灰度处理

### 身高计算
基于光遇游戏内部公式:
- 基准高度: 7.6 头身
- Scale 影响: -8.3 倍系数
- Height 影响: -3 倍系数

## 📄 开源协议

MIT License

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📮 联系方式

如有问题或建议，请通过 GitHub Issues 联系。

---

⭐ 如果这个项目对您有帮助，请给个 Star！
