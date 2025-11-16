/**
 * 光遇线下活动码解析算法
 * 结合多种解码策略，确保最佳兼容性
 */

// Base64URL 解码为原始 bytes（100% 保留）
function decodeBase64URLToBytes(base64url) {
    // 1. 将 Base64URL 转换为标准 Base64（如果需要）
    let base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
    
    // 2. 补齐 padding 使长度变为 4 的倍数
    const padded = base64.padEnd(base64.length + (4 - base64.length % 4) % 4, '=');

    // 3. 使用 atob 解码为二进制字符串
    const binaryString = atob(padded);
    
    // 4. 转换为 Uint8Array（原始字节数组，100% 保留）
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    
    return bytes;
}

// 从解码数据中提取并构建标准 JSON（模糊匹配关键字）
// 参考 Android 版本的正则逻辑
function extractFieldsFromDecoded(decodedText) {
    const obj = { body: {} };
    
    // 提取 height - 使用 Android 同款正则
    // eight[^:=\d\-.eE]{0,5}[:=]\s*(-?\d+(\.\d+)?([eE][+-]?\d+)?)(?![\w.])
    const heightMatch = decodedText.match(/eight[^:=\d\-.eE]{0,5}[:=]\s*(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)(?![\w.])/i);
    if (heightMatch) obj.height = parseFloat(heightMatch[1]);
    
    // 提取 scale - 使用 Android 同款正则
    // cale[^:=\d\-.eE]{0,5}[:=]\s*(-?\d+(\.\d+)?([eE][+-]?\d+)?)(?![\w.])
    const scaleMatch = decodedText.match(/cale[^:=\d\-.eE]{0,5}[:=]\s*(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)(?![\w.])/i);
    if (scaleMatch) obj.scale = parseFloat(scaleMatch[1]);
    
    // 提取 body.id
    const idMatch = decodedText.match(/["\']?id["\']?\s*[:：]\s*([0-9]+)/i);
    if (idMatch) obj.body.id = parseInt(idMatch[1]);
    
    // 提取 body.tex
    const texMatch = decodedText.match(/["\']?tex["\']?\s*[:：]\s*([0-9]+)/i);
    if (texMatch) obj.body.tex = parseInt(texMatch[1]);
    
    // 提取 body.pattern
    if (decodedText.includes('Amask') || decodedText.includes('mask')) {
        obj.body.pattern = 'Amask';
    }
    
    // 提取 body.dye
    const dyeMatch = decodedText.match(/["\']?dye["\']?\s*[:：]\s*["\']([^"\']+)["\']/i);
    if (dyeMatch) {
        obj.body.dye = dyeMatch[1];
    } else if (decodedText.includes('none')) {
        obj.body.dye = '(none, )';
    }
    
    // 提取装备字段
    const wingMatch = decodedText.match(/wing[^0-9]*?([0-9]{10,11})/i);
    if (wingMatch) obj.wing = `F:${wingMatch[1]}`;
    
    const hairMatch = decodedText.match(/hair[^0-9]*?([0-9]{10,11})/i);
    if (hairMatch) obj.hair = `F:${hairMatch[1]}`;
    
    const neckMatch = decodedText.match(/nec[k]?[^0-9]*?([0-9]{8,10})/i);
    if (neckMatch) obj.neck = parseInt(neckMatch[1]);
    
    const feetMatch = decodedText.match(/fe[e]?t[^0-9]*?([0-9]{8,10})/i);
    if (feetMatch) obj.feet = `F:${feetMatch[1]}`;
    
    const hornMatch = decodedText.match(/horn[^0-9]*?([0-9]{6,8})/i);
    if (hornMatch) obj.horn = parseInt(hornMatch[1]);
    
    const faceMatch = decodedText.match(/face[^0-9]*?([0-9]{6,8})/i);
    if (faceMatch) obj.face = parseInt(faceMatch[1]);
    
    const propMatch = decodedText.match(/prop[^0-9]*?([0-9]{8,10})/i);
    if (propMatch) obj.prop = parseInt(propMatch[1]);
    
    // 提取 voice
    const voiceMatch = decodedText.match(/voi[ce]*["\']?\s*[:：]\s*([0-9]+)/i);
    if (voiceMatch) obj.voice = parseInt(voiceMatch[1]);
    
    // 提取 attitude
    if (decodedText.includes('see') || decodedText.includes('attitude')) {
        obj.attitude = 'see';
    }
    
    // 提取 refreshversion
    const versionMatch = decodedText.match(/[refresh]*version["\']?\s*[:：]\s*([0-9]+)/i);
    if (versionMatch) obj.refreshversion = parseInt(versionMatch[1]);
    
    return obj;
}

// 将字节数组转换为十六进制 hex dump
function bytesToHexDump(bytes) {
    let hex = '';
    for (let i = 0; i < bytes.length; i++) {
        const byte = bytes[i].toString(16).padStart(2, '0');
        hex += byte;
        // 每 32 字节换行，方便查看
        if ((i + 1) % 32 === 0) {
            hex += '\n';
        } else if ((i + 1) % 4 === 0) {
            hex += ' '; // 每 4 字节空格
        }
    }
    return hex.trim();
}

// 将字节数组转换为 Latin-1 字符串（保证不丢字节）
function bytesToLatin1(bytes) {
    let latin1 = '';
    for (let i = 0; i < bytes.length; i++) {
        // Latin-1 直接映射 0-255 到 Unicode U+0000 到 U+00FF
        latin1 += String.fromCharCode(bytes[i]);
    }
    return latin1;
}

// 将字节数组转换为 UTF-8 字符串（ignore 模式，用于提取可读内容）
function bytesToUTF8Ignore(bytes) {
    // 使用 TextDecoder 的 fatal=false 模式（相当于 errors="ignore"）
    const decoder = new TextDecoder('utf-8', { fatal: false });
    return decoder.decode(bytes);
}

// 从可读文本中提取 height 和 scale
function extractHeightAndScale(readableText) {
    // 提取 height（可能为负数、小数）
    const heightMatch = readableText.match(/"height"\s*:\s*(-?[0-9]+\.?[0-9]*)/i);
    const height = heightMatch ? parseFloat(heightMatch[1]) : null;
    
    // 提取 scale（可能为小数）
    const scaleMatch = readableText.match(/"scale"\s*:\s*(-?[0-9]+\.?[0-9]*)/i);
    const scale = scaleMatch ? parseFloat(scaleMatch[1]) : null;
    
    return { height, scale };
}

// 完整解析函数（容错处理）
function parseSkyQRCode(b64) {
    // 0. 清理 Base64 字符串 - 移除非标准字符
    // Base64 只包含: A-Z, a-z, 0-9, +, /, =
    let cleaned = '';
    for (let i = 0; i < b64.length; i++) {
        const char = b64[i];
        const code = b64.charCodeAt(i);
        // 只保留标准 Base64 字符
        if ((code >= 65 && code <= 90) ||   // A-Z
            (code >= 97 && code <= 122) ||  // a-z
            (code >= 48 && code <= 57) ||   // 0-9
            char === '+' || char === '/' || char === '=' || char === '-' || char === '_') {
            // 转换 Base64URL 为标准 Base64
            if (char === '-') {
                cleaned += '+';
            } else if (char === '_') {
                cleaned += '/';
            } else {
                cleaned += char;
            }
        }
    }
    
    // 1. 补齐 Base64 padding
    const padded = cleaned.padEnd(cleaned.length + (4 - cleaned.length % 4) % 4, '=');
    
    // 2. 解码为字节数组
    const bytes = Uint8Array.from(atob(padded), c => c.charCodeAt(0));
    
    // 3. 用 latin1 解码（保留所有字节）
    let raw = '';
    for (let i = 0; i < bytes.length; i++) {
        raw += String.fromCharCode(bytes[i]);
    }
    
    // 4. 找到第一个 { 开始位置
    const start = raw.indexOf('{');
    if (start === -1) throw new Error('无效数据');
    
    // 5. 提取 height (使用正则)
    const heightMatch = raw.match(/eight"[^:=\d\-.eE]{0,5}[:=]\s*(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)/i);
    if (!heightMatch) throw new Error('无法提取 height');
    let height = parseFloat(heightMatch[1]);
    
    // 6. 提取 scale (使用准确的 protobuf 解析)
    let scale = null;
    
    // 查找 "scale" 字符串位置
    const scaleBytes = [0x73, 0x63, 0x61, 0x6c, 0x65]; // "scale"
    let scaleIndex = -1;
    for (let i = 0; i < bytes.length - 5; i++) {
        let match = true;
        for (let j = 0; j < 5; j++) {
            if (bytes[i + j] !== scaleBytes[j]) {
                match = false;
                break;
            }
        }
        if (match) {
            scaleIndex = i;
            break;
        }
    }
    
    if (scaleIndex !== -1 && scaleIndex + 9 < bytes.length) {
        // Sky QR 编码格式: "scale" + 0x15 + [3字节控制] + ASCII数字
        const pbMarker = bytes[scaleIndex + 5];
        
        if (pbMarker === 0x15) {
            // 验证控制字节模式 [0x00, 0xf1, 0x00] 或类似的
            const ctrl1 = bytes[scaleIndex + 6];
            const ctrl2 = bytes[scaleIndex + 7];
            const ctrl3 = bytes[scaleIndex + 8];
            
            // 从 scaleIndex + 9 开始读取 ASCII 数字
            let digitStr = '';
            for (let i = scaleIndex + 9; i < bytes.length; i++) {
                const byte = bytes[i];
                if (byte >= 0x30 && byte <= 0x39) { // '0'-'9'
                    digitStr += String.fromCharCode(byte);
                } else {
                    break;
                }
            }
            
            if (digitStr.length > 0) {
                // Sky 编码规则: ASCII数字 × 10^-10
                // 示例: "72681494" × 10^-10 = 0.0072681494
                const numValue = parseInt(digitStr);
                scale = numValue * 1e-10;
                
                // 验证是否在合理范围 [-0.2, 0.2]
                if (scale < -0.2 || scale > 0.2) {
                    // 如果不在范围内,尝试其他缩放因子
                    const candidates = [1e-8, 1e-6, 1e-4, 1e-2];
                    for (const factor of candidates) {
                        const testValue = numValue * factor;
                        if (testValue >= -0.2 && testValue <= 0.2) {
                            scale = testValue;
                            break;
                        }
                    }
                }
            }
        }
    }
    
    // 备用方案: 如果 protobuf 解析失败,使用正则提取
    if (scale === null) {
        const scaleMatch = raw.match(/scale[^\d]*?(\d+\.?\d*(?:[eE][+-]?\d+)?)/i);
        if (!scaleMatch) throw new Error('无法提取 scale');
        
        const scaleRaw = scaleMatch[1];
        // 如果是8位整数（无小数点），转换为 0.00xxxxxxxx
        if (scaleRaw.length === 8 && !scaleRaw.includes('.') && !scaleRaw.includes('e') && !scaleRaw.includes('E')) {
            scale = parseFloat('0.00' + scaleRaw);
        } else {
            scale = parseFloat(scaleRaw);
        }
    }
    
    // 7. 尝试解析完整 JSON（用于显示）
    let jsonData = null;
    try {
        const jsonPart = raw.slice(start);
        let cleaned = '';
        for (let i = 0; i < jsonPart.length; i++) {
            const code = jsonPart.charCodeAt(i);
            if ((code >= 0x20 && code <= 0x7E) || code === 0x09 || code === 0x0A || code === 0x0D) {
                cleaned += jsonPart[i];
            }
        }
        jsonData = JSON.parse(cleaned);
    } catch (e) {
        // JSON 解析失败，使用提取的值
        jsonData = { height, scale };
    }
    
    // 9. 计算身高（使用 Android 版本的公式）
    let currentHeight = null;
    let maxHeight = null;
    let minHeight = null;
    
    if (height !== null && scale !== null) {
        // 当前身高 = 7.6 - 8.3 * scale - 3 * height
        currentHeight = 7.6 - 8.3 * scale - 3 * height;
    }
    
    if (scale !== null) {
        // 最大身高（height = 2.0）
        maxHeight = 7.6 - 8.3 * scale - 3 * 2.0;
        // 最小身高（height = -2.0）
        minHeight = 7.6 - 8.3 * scale - 3 * (-2.0);
    }
    
    // 8. 返回结果
    return {
        height,
        scale,
        currentHeight,
        maxHeight,
        minHeight,
        raw: raw.slice(start, start + 500), // 原始文本（前500字符）
        jsonData,         // 解析的 JSON 对象
        originalBytes: bytes  // 原始字节数组
    };
}



// 解析二维码内容
function parseQRCode(imageData) {
    const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: "dontInvert"
    });
    
    if (!code) {
        return null;
    }

    return code.data;
}

// 从 URL 提取并解析参数（使用新算法）
function extractAndParseParams(qrContent) {
    const resultDiv = document.getElementById('resultContent');
    resultDiv.innerHTML = '';

    function addLine(text, className = '') {
        const line = document.createElement('div');
        line.className = 'result-line ' + className;
        line.innerHTML = text;
        resultDiv.appendChild(line);
    }

    function addHighlight(content) {
        const highlight = document.createElement('div');
        highlight.className = 'highlight';
        highlight.innerHTML = content;
        resultDiv.appendChild(highlight);
    }

    function addCodeBlock(title, content, maxHeight = '200px') {
        addLine(`<span class="key">${title}</span>`);
        addLine(`<pre style="background: rgba(0,0,0,0.3); padding: 15px; border-radius: 8px; overflow-x: auto; max-height: ${maxHeight}; font-size: 0.8em; line-height: 1.4; margin-top: 8px; border-left: 3px solid #4FACFE;"><code>${content}</code></pre>`);
    }

    addLine('<span class="prompt">▶</span> <span class="success">Sky 光遇线下活动码解析算法</span>');
    addLine('');
    addLine('<span class="key">📋 二维码原始内容:</span>');
    addLine(`<span class="value" style="word-break: break-all;">${qrContent}</span>`);
    addLine('');

    // 步骤 1: 直接使用二维码内容作为 Base64 数据（去掉 URL 部分）
    // 如果是完整 URL，提取 o= 参数；否则直接当作 Base64 数据
    let base64Data = qrContent;
    
    const urlMatch = qrContent.match(/[/?&]o=([^&\s]+)/);
    if (urlMatch) {
        base64Data = urlMatch[1];
    } else if (qrContent.startsWith('http')) {
        addLine('<span class="error">❌ 错误: URL 中未找到 o= 参数</span>');
        addLine('<span class="error">请确保上传的是 Sky 光遇线下活动二维码</span>');
        return;
    }
    
    addLine('<span class="key">🔍 步骤 1: 提取 Base64 编码串</span>');
    addLine(`<span class="value" style="word-break: break-all; font-size: 0.85em;">${base64Data.substring(0, 100)}${base64Data.length > 100 ? '...' : ''}</span>`);
    addLine(`<span class="value" style="color: #8892b0;">长度: ${base64Data.length} 字符</span>`);
    addLine('');

    // 步骤 2: 使用解析算法
    try {
        addLine('<span class="key">⚙️ 步骤 2: Base64 解码并提取参数</span>');
        addLine('');
        
        const result = parseSkyQRCode(base64Data);

        // 显示解析结果
        addLine('<span class="success">━━━━━━━━━━━━━━━━━━━━━━━━━━━━</span>');
        addLine('<span class="success">✨ 解析完成！</span>');
        addLine('<span class="success">━━━━━━━━━━━━━━━━━━━━━━━━━━━━</span>');
        addLine('');

        // 显示身高计算结果
        if (result.currentHeight !== null) {
            addHighlight(`<span class="key">📏 你的身高为:</span> <span class="value">${result.currentHeight.toFixed(4)}</span>`);
        }
        
        if (result.maxHeight !== null) {
            addLine(`<span class="key">📐 最大身高为:</span> <span class="value">${result.maxHeight.toFixed(4)}</span>`);
        }
        
        if (result.minHeight !== null) {
            addLine(`<span class="key">📐 最小身高为:</span> <span class="value">${result.minHeight.toFixed(4)}</span>`);
        }

        addLine('');
        addLine('<span class="key">━━━━━━━━━━━━━━━━━━━━━━━━━━━━</span>');
        
        // 显示原始参数
        if (result.height !== null) {
            addLine(`<span class="key">height:</span> <span class="value">${result.height}</span>`);
        } else {
            addLine('<span class="error">height: 数据损坏</span>');
        }

        if (result.scale !== null) {
            // 处理科学计数法显示
            const scaleStr = result.scale.toString();
            const formattedScale = scaleStr.includes('e') ? result.scale.toFixed(16).replace(/\.?0+$/, '') : scaleStr;
            addLine(`<span class="key">scale:</span> <span class="value">${formattedScale}</span>`);
        } else {
            addLine('<span class="error">scale: 数据损坏</span>');
        }
        
        addLine('');
        
        // 显示清理后的解码内容
        addLine('<span class="key">━━━━━━━━━━━━━━━━━━━━━━━━━━━━</span>');
        addLine('<span class="key">📄 解码内容 (已去除控制符):</span>');
        addLine('');
        
        // 显示原始数据（带控制字符标记）
        const escapedRaw = result.raw
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/[\x00-\x1F\x7F-\xFF]/g, (c) => {
                const code = c.charCodeAt(0);
                return `<span style="background:#ffeb3b;color:#000;">\\x${code.toString(16).padStart(2, '0')}</span>`;
            });
        addCodeBlock('', escapedRaw, '300px');
        
        // 如果数据损坏，显示警告
        if (result.height === null || result.scale === null) {
            addLine('');
            addLine('<span class="error">⚠️ 数据损坏警告</span>');
            addLine('<span class="error">目前本方法暂无法完全准确地解析和反序列化游戏内二维码原始内容，</span>');
            addLine('<span class="error">所以存在无法正确测算的可能。本二维码解析时即存在问题，</span>');
            addLine('<span class="error">目前暂无解决方案，十分抱歉。</span>');
        }

    } catch (error) {
        addLine('<span class="error">❌ 解析失败: ' + error.message + '</span>');
        addLine('<span class="error">错误堆栈: ' + error.stack + '</span>');
    }
}

// 显示结果弹窗
function showResultModal() {
    const modal = document.getElementById('modalOverlay');
    modal.classList.add('show');
    document.body.style.overflow = 'hidden';
}

// 隐藏结果弹窗
function hideResultModal() {
    const modal = document.getElementById('modalOverlay');
    modal.classList.remove('show');
    document.body.style.overflow = '';
}

// 处理文件上传
document.getElementById('fileInput').addEventListener('change', function(event) {
    const file = event.target.files[0];
    if (!file) return;

    const loading = document.getElementById('loading');

    loading.classList.add('show');

    const reader = new FileReader();
    reader.onload = function(e) {
        const img = new Image();
        img.onload = function() {
            // 创建 canvas 来读取图片数据
            const canvas = document.createElement('canvas');
            let width = img.width;
            let height = img.height;
            
            // 如果图片太大，缩小以提高解析速度和成功率
            const maxSize = 1500;
            if (width > maxSize || height > maxSize) {
                const scale = maxSize / Math.max(width, height);
                width = Math.floor(width * scale);
                height = Math.floor(height * scale);
            }
            
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d', { willReadFrequently: true });
            
            // 使用高质量缩放
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            ctx.drawImage(img, 0, 0, width, height);
            
            // 尝试多次解析：原图、增强对比度、灰度图
            let qrContent = null;
            
            // 第一次尝试：原图
            let imageData = ctx.getImageData(0, 0, width, height);
            qrContent = parseQRCode(imageData);
            
            // 第二次尝试：增强对比度
            if (!qrContent) {
                ctx.filter = 'contrast(1.5) brightness(1.1)';
                ctx.drawImage(canvas, 0, 0);
                ctx.filter = 'none';
                imageData = ctx.getImageData(0, 0, width, height);
                qrContent = parseQRCode(imageData);
            }
            
            // 第三次尝试：转灰度并增强
            if (!qrContent) {
                ctx.drawImage(img, 0, 0, width, height);
                imageData = ctx.getImageData(0, 0, width, height);
                const data = imageData.data;
                
                // 转换为灰度并增强对比度
                for (let i = 0; i < data.length; i += 4) {
                    const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
                    // 增强对比度
                    const enhanced = gray < 128 ? Math.max(0, gray - 30) : Math.min(255, gray + 30);
                    data[i] = data[i + 1] = data[i + 2] = enhanced;
                }
                
                ctx.putImageData(imageData, 0, 0);
                imageData = ctx.getImageData(0, 0, width, height);
                qrContent = parseQRCode(imageData);
            }
            
            loading.classList.remove('show');
            
            if (qrContent) {
                extractAndParseParams(qrContent);
                showResultModal();
            } else {
                const resultDiv = document.getElementById('resultContent');
                resultDiv.innerHTML = '<div class="result-line error">❌ 错误: 未检测到有效的二维码</div>' +
                    '<div class="result-line error">已尝试多种方式解析，但未能识别二维码</div>' +
                    '<div class="result-line" style="margin-top: 15px;">💡 可能的原因:</div>' +
                    '<div class="result-line">• 二维码被遮挡或不完整</div>' +
                    '<div class="result-line">• 图片过度压缩或模糊</div>' +
                    '<div class="result-line">• 二维码过小或角度倾斜</div>' +
                    '<div class="result-line">• 背景干扰过多</div>' +
                    '<div class="result-line" style="margin-top: 10px;">🔧 建议:</div>' +
                    '<div class="result-line">• 直接截取二维码部分重新上传</div>' +
                    '<div class="result-line">• 确保二维码占据图片大部分区域</div>' +
                    '<div class="result-line">• 使用原图而非压缩后的图片</div>';
                showResultModal();
            }
        };
        img.onerror = function() {
            loading.classList.remove('show');
            const resultDiv = document.getElementById('resultContent');
            resultDiv.innerHTML = '<div class="result-line error">❌ 图片加载失败</div>' +
                '<div class="result-line error">请确保上传的是有效的图片文件</div>';
            showResultModal();
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
});

// 关闭弹窗事件
document.getElementById('closeBtn').addEventListener('click', hideResultModal);
document.getElementById('modalOverlay').addEventListener('click', function(e) {
    if (e.target === this) {
        hideResultModal();
    }
});

// ESC键关闭弹窗
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        hideResultModal();
    }
});
