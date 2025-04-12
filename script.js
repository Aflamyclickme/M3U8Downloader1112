// 将所有代码包装在一个立即执行的异步函数中
(async function() {
    try {
        console.log('开始初始化应用');

        // 检查piexif库是否正确加载
        if (typeof piexif === 'undefined') {
            console.error('piexif库未正确加载，元数据功能将不可用');
            alert('元数据处理库加载失败，部分功能可能不可用。请刷新页面重试。');
        } else {
            console.log('piexif库已成功加载');
        }

        // 等待 DOM 加载完成
        if (document.readyState === 'loading') {
            console.log('等待 DOM 加载...');
            await new Promise(resolve => {
                document.addEventListener('DOMContentLoaded', () => {
                    console.log('DOM 加载完成');
                    resolve();
                });
            });
        }

        // 获取并验证 DOM 元素
        const elements = {
            uploadArea: document.getElementById('uploadArea'),
            fileInput: document.getElementById('fileInput'),
            previewContainer: document.getElementById('previewContainer'),
            downloadBtn: document.getElementById('downloadBtn'),
            processInfo: document.getElementById('processInfo'),
            options: {
                brightness: document.getElementById('brightness'),
                contrast: document.getElementById('contrast'),
                watermark: document.getElementById('watermark'),
                pixelShift: document.getElementById('pixelShift'),
                modifyMetadata: document.getElementById('modifyMetadata'),
                noiseLevel: document.getElementById('noiseLevel'),
                // 新增高级选项
                microRotation: document.getElementById('microRotation'),
                edgeProcessing: document.getElementById('edgeProcessing'),
                colorSpaceTransform: document.getElementById('colorSpaceTransform'),
                invisibleWatermark: document.getElementById('invisibleWatermark'),
                compressionLevel: document.getElementById('compressionLevel'),
                adaptiveProcessing: document.getElementById('adaptiveProcessing')
            }
        };

        // 打印详细的元素状态
        console.log('元素状态详情:');
        console.log('主要元素:', {
            uploadArea: elements.uploadArea?.id || '未找到',
            fileInput: elements.fileInput?.id || '未找到',
            previewContainer: elements.previewContainer?.id || '未找到',
            downloadBtn: elements.downloadBtn?.id || '未找到',
            processInfo: elements.processInfo?.id || '未找到'
        });
        
        console.log('选项元素:', Object.fromEntries(
            Object.entries(elements.options)
                .map(([k, v]) => [k, {
                    found: v ? true : false,
                    id: v?.id || '未找到',
                    type: v?.type || '未知',
                    value: v?.value || '未知'
                }])
        ));

        // 验证必需的元素
        const requiredElements = ['uploadArea', 'fileInput', 'previewContainer', 'downloadBtn'];
        const missingElements = requiredElements.filter(id => !elements[id]);
        if (missingElements.length > 0) {
            throw new Error(`缺少必需的元素: ${missingElements.join(', ')}`);
        }

        const requiredOptions = ['brightness', 'contrast', 'watermark', 'pixelShift', 'modifyMetadata', 'noiseLevel'];
        const missingOptions = requiredOptions.filter(id => !elements.options[id]);
        if (missingOptions.length > 0) {
            throw new Error(`缺少必需的选项元素: ${missingOptions.join(', ')}`);
        }

        // 存储上传的图片
        let uploadedImages = [];
        // 标记当前是否在显示原图
        let isShowingOriginal = false;

        // 处理文件上传
        async function handleFiles(files) {
            console.log(`开始处理 ${files.length} 个文件`);
            
            // 清空预览容器
            elements.previewContainer.innerHTML = '';
            uploadedImages = [];

            // 处理每个文件
            for (const file of files) {
                if (!file.type.startsWith('image/')) {
                    console.warn(`跳过非图片文件: ${file.name}`);
                    continue;
                }

                try {
                    console.log(`处理文件: ${file.name}`);

                    // 加载图片
                    const imageUrl = URL.createObjectURL(file);
                    const loadedImage = await new Promise((resolve, reject) => {
                        const img = new Image();
                        img.onload = () => resolve(img);
                        img.onerror = reject;
                        img.src = imageUrl;
                    });

                    // 存储原始图片
                    uploadedImages.push({
                        name: file.name,
                        original: loadedImage,
                        file: file
                    });
                    
                    console.log(`文件 ${file.name} 处理完成`);
                } catch (error) {
                    console.error(`处理文件 ${file.name} 失败:`, error);
                }
            }

            // 更新下载按钮状态
            elements.downloadBtn.disabled = uploadedImages.length === 0;
            
            // 如果有图片，更新预览
            if (uploadedImages.length > 0) {
                updatePreviews();
            }
        }

        // 设置拖放处理
        elements.uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.stopPropagation();
            elements.uploadArea.classList.add('dragover');
        });

        elements.uploadArea.addEventListener('dragleave', (e) => {
            e.preventDefault();
            e.stopPropagation();
            elements.uploadArea.classList.remove('dragover');
        });

        elements.uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            e.stopPropagation();
            elements.uploadArea.classList.remove('dragover');
            
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                handleFiles(files);
            }
        });

        // 设置点击上传
        elements.uploadArea.addEventListener('click', () => {
            console.log('上传区域被点击');
            elements.fileInput.click();
        });

        elements.fileInput.addEventListener('change', (e) => {
            console.log('文件选择发生变化', e.target.files);
            if (e.target.files.length > 0) {
                handleFiles(e.target.files);
            }
        });

        // 生成随机元数据的函数
        function generateRandomMetadata() {
            // 检查piexif库是否可用
            if (typeof piexif === 'undefined') {
                console.error('piexif库未加载，无法生成元数据');
                throw new Error('元数据处理库未加载');
            }
            
            // 随机相机型号
            const cameraModels = [
                "iPhone 12 Pro", "iPhone 13", "iPhone 14 Pro Max", 
                "Samsung Galaxy S21", "Samsung Galaxy S22 Ultra", 
                "Huawei P40 Pro", "Xiaomi Mi 11 Ultra", 
                "Google Pixel 6 Pro", "Sony Alpha A7 IV", "Canon EOS R5",
                "Nikon Z6 II", "Fujifilm X-T4", "OPPO Find X5 Pro", "vivo X80 Pro",
                "Sony Xperia 1 IV", "OnePlus 10 Pro", "Honor Magic4 Pro"
            ];
            
            // 随机GPS位置（中国主要城市和热门旅游景点）
            const locations = [
                { lat: [39, 40], lng: [116, 117], desc: "北京" },  // 北京
                { lat: [31, 32], lng: [121, 122], desc: "上海" },  // 上海
                { lat: [22, 23], lng: [113, 114], desc: "广州" },  // 广州
                { lat: [30, 31], lng: [103, 104], desc: "成都" },  // 成都
                { lat: [22, 23], lng: [114, 115], desc: "深圳" },  // 深圳
                { lat: [34, 35], lng: [108, 109], desc: "西安" },  // 西安
                { lat: [36, 37], lng: [117, 118], desc: "青岛" },  // 青岛
                { lat: [29, 30], lng: [106, 107], desc: "重庆" },  // 重庆
                { lat: [45, 46], lng: [126, 127], desc: "哈尔滨" }, // 哈尔滨
                { lat: [25, 26], lng: [102, 103], desc: "大理" },  // 大理
                { lat: [30, 31], lng: [120, 121], desc: "杭州" },  // 杭州
                { lat: [43, 44], lng: [87, 88], desc: "乌鲁木齐" }, // 乌鲁木齐
                { lat: [31, 32], lng: [120, 121], desc: "苏州" },  // 苏州
                { lat: [23, 24], lng: [110, 111], desc: "桂林" },  // 桂林
                { lat: [25, 26], lng: [100, 101], desc: "丽江" },  // 丽江
                { lat: [39, 40], lng: [117, 118], desc: "天津" },  // 天津
                { lat: [27, 28], lng: [115, 116], desc: "庐山" },  // 庐山
                { lat: [46, 47], lng: [129, 130], desc: "雪乡" },  // 雪乡
                { lat: [37, 38], lng: [112, 113], desc: "太原" }   // 太原
            ];
            
            // 随机日期时间（过去3年内更合理）
            const now = new Date();
            const threeYearsAgo = new Date();
            threeYearsAgo.setFullYear(now.getFullYear() - 3);
            const randomTime = new Date(threeYearsAgo.getTime() + Math.random() * (now.getTime() - threeYearsAgo.getTime()));
            
            // 格式化为EXIF需要的格式 YYYY:MM:DD HH:MM:SS
            const dateTimeStr = randomTime.getFullYear() + ":" + 
                                String(randomTime.getMonth() + 1).padStart(2, '0') + ":" + 
                                String(randomTime.getDate()).padStart(2, '0') + " " + 
                                String(randomTime.getHours()).padStart(2, '0') + ":" + 
                                String(randomTime.getMinutes()).padStart(2, '0') + ":" + 
                                String(randomTime.getSeconds()).padStart(2, '0');
            
            // 随机选择位置
            const randomLocation = locations[Math.floor(Math.random() * locations.length)];
            const randomLat = randomLocation.lat[0] + Math.random() * (randomLocation.lat[1] - randomLocation.lat[0]);
            const randomLng = randomLocation.lng[0] + Math.random() * (randomLocation.lng[1] - randomLocation.lng[0]);
            
            // 创建GPS信息
            const latRef = randomLat >= 0 ? "N" : "S";
            const lngRef = randomLng >= 0 ? "E" : "W";
            const latAbs = Math.abs(randomLat);
            const lngAbs = Math.abs(randomLng);
            
            // 将坐标转换为度分秒格式
            function convertToDMS(coord) {
                const deg = Math.floor(coord);
                const minTemp = (coord - deg) * 60;
                const min = Math.floor(minTemp);
                const sec = (minTemp - min) * 60 * 100; // 秒 * 100表示两位小数
                return [[deg, 1], [min, 1], [Math.round(sec), 100]];
            }
            
            // 准备EXIF数据
            const zeroth = {};
            const exif = {};
            const gps = {};
            
            // 随机选择相机制造商和型号，确保它们匹配
            const randomCameraModelIndex = Math.floor(Math.random() * cameraModels.length);
            const randomCameraModel = cameraModels[randomCameraModelIndex];
            const manufacturerMap = {
                "iPhone": "Apple",
                "Samsung": "Samsung",
                "Huawei": "Huawei",
                "Xiaomi": "Xiaomi",
                "Google": "Google",
                "Sony": "Sony",
                "Canon": "Canon",
                "Nikon": "Nikon",
                "Fujifilm": "Fujifilm",
                "OPPO": "OPPO",
                "vivo": "vivo",
                "OnePlus": "OnePlus",
                "Honor": "Honor"
            };
            const manufacturer = manufacturerMap[randomCameraModel.split(' ')[0]] || randomCameraModel.split(' ')[0];

            // 随机软件版本
            const softwareVersions = [
                "Camera App v1.2.3", "Photo Pro 2.5", "iOS 16.5.1", "Android 13",
                "EMUI 12.0.1", "MIUI 14", "ColorOS 13", "OneUI 5.1", "OriginOS 3.0",
                "小红书图片去重工具 v1.2", "Adobe Lightroom Mobile 8.1.2", "Snapseed 2.0"
            ];
            const randomSoftware = softwareVersions[Math.floor(Math.random() * softwareVersions.length)];
            
            // 随机镜头信息
            const lensModels = [
                "iPhone 镜头", "Samsung 镜头", "Leica 镜头", "Zeiss 镜头", 
                "24-70mm f/2.8", "70-200mm f/4", "50mm f/1.8", "超广角镜头",
                "微距镜头", "长焦镜头"
            ];
            const randomLens = lensModels[Math.floor(Math.random() * lensModels.length)];
            
            // Zeroth IFD（基本信息）
            zeroth[piexif.ImageIFD.Make] = manufacturer; // 制造商
            zeroth[piexif.ImageIFD.Model] = randomCameraModel; // 型号
            zeroth[piexif.ImageIFD.Software] = randomSoftware; // 软件
            zeroth[piexif.ImageIFD.DateTime] = dateTimeStr; // 日期时间
            zeroth[piexif.ImageIFD.XResolution] = [Math.floor(Math.random() * 300) + 72, 1]; // 分辨率X
            zeroth[piexif.ImageIFD.YResolution] = [Math.floor(Math.random() * 300) + 72, 1]; // 分辨率Y
            zeroth[piexif.ImageIFD.ResolutionUnit] = 2; // 英寸
            
            // 添加IPTC数据（嵌入在EXIF中）
            // IPTC数据包含标题、关键词、描述等
            const iptcKeywords = [
                "风景", "美食", "旅行", "生活", "时尚", "美妆", "穿搭", "宠物", "手工", 
                "音乐", "电影", "读书", "摄影", "健身", "运动", "家居", "园艺", "咖啡",
                "甜品", "设计", "艺术", "手账", "博物馆", "古风", "小清新", "复古", "展览",
                "街拍", "美景", "日落", "日出", "夜景", "花卉", "海边", "山水", "自然",
                "建筑", "创意", "美甲", "下午茶", "网红店", "探店", "露营", "徒步", "自驾游"
            ];
            const randomKeywords = [];
            const keywordCount = Math.floor(Math.random() * 5) + 1; // 1-5个关键词
            for (let i = 0; i < keywordCount; i++) {
                const randomIndex = Math.floor(Math.random() * iptcKeywords.length);
                if (!randomKeywords.includes(iptcKeywords[randomIndex])) {
                    randomKeywords.push(iptcKeywords[randomIndex]);
                }
            }
            
            // 随机创作者名
            const creators = [
                "小红书用户", "摄影师", "设计师", "旅行者", "美食家", "生活家", "时尚博主",
                "探索者", "艺术家", "创作者", "收藏家", "达人", "达人", "爱好者", "发现者",
                "分享者", "记录者", "旅行博主", "美食博主", "时尚达人", "生活美学家"
            ];
            const randomCreator = creators[Math.floor(Math.random() * creators.length)];
            
            // 随机标题
            const titlePrefixes = [
                "我的", "美丽的", "精彩的", "难忘的", "惊艳的", "温暖的", "治愈的", 
                "浪漫的", "独特的", "神秘的", "魅力的", "令人向往的", "慵懒的", "活力的",
                "文艺的", "精致的", "自然的", "快乐的", "舒适的", "甜蜜的", "奇妙的"
            ];
            const titleSuffixes = [
                "记录", "瞬间", "回忆", "日常", "分享", "生活", "体验", "发现", "收获",
                "灵感", "故事", "见闻", "心情", "感受", "旅程", "时光", "足迹", "日记",
                "笔记", "随笔", "点滴", "片段", "场景", "趣事"
            ];
            const randomTitle = titlePrefixes[Math.floor(Math.random() * titlePrefixes.length)] + 
                               randomLocation.desc + 
                               titleSuffixes[Math.floor(Math.random() * titleSuffixes.length)];
            
            // 更丰富的随机描述
            const descriptions = [
                `在${randomLocation.desc}的一天，${Math.random() < 0.5 ? '阳光明媚' : '微风轻拂'}，留下了这美好的回忆。`,
                `${randomLocation.desc}之行，发现了这个${Math.random() < 0.5 ? '小众景点' : '网红打卡地'}，分享给大家。`,
                `${Math.random() <.5 ? '周末' : '假期'}来到${randomLocation.desc}，感受${Math.random() < 0.5 ? '当地文化' : '美食美景'}。`,
                `第一次来${randomLocation.desc}，真的被这里的${Math.random() < 0.5 ? '风景' : '氛围'}惊艳到了。`,
                `和${Math.random() < 0.5 ? '朋友' : '家人'}一起探索${randomLocation.desc}的${Math.random() < 0.5 ? '小巷' : '美食'}。`,
                `${randomLocation.desc}的${Math.random() < 0.5 ? '日落' : '日出'}真的太美了，推荐大家一定要来看看。`,
                `${randomLocation.desc}${Math.random() < 0.5 ? '的这家店' : '的这个地方'}太值得打卡了，上图分享给大家。`,
                `这次${randomLocation.desc}之行收获满满，认识了很多有趣的${Math.random() < 0.5 ? '人' : '事物'}。`,
                `${randomLocation.desc}${Math.random() < 0.5 ? '的美食' : '的风景'}果然名不虚传，给这次旅行打满分！`,
                `终于打卡了心心念念的${randomLocation.desc}，真的没有辜负我的期待。`
            ];
            const randomDescription = descriptions[Math.floor(Math.random() * descriptions.length)];
            
            // 在EXIF中嵌入部分IPTC数据
            zeroth[piexif.ImageIFD.ImageDescription] = randomTitle;
            zeroth[piexif.ImageIFD.Artist] = randomCreator;
            zeroth[piexif.ImageIFD.Copyright] = `© ${randomTime.getFullYear()} ${randomCreator}`;
            
            // Exif IFD（曝光相关信息）
            exif[piexif.ExifIFD.DateTimeOriginal] = dateTimeStr; // 原始日期时间
            exif[piexif.ExifIFD.DateTimeDigitized] = dateTimeStr; // 数字化日期时间
            exif[piexif.ExifIFD.ExposureTime] = [1, Math.floor(Math.random() * 1000) + 100]; // 曝光时间
            exif[piexif.ExifIFD.FNumber] = [Math.floor(Math.random() * 40) + 10, 10]; // 光圈
            exif[piexif.ExifIFD.ISOSpeedRatings] = 100 * (Math.floor(Math.random() * 16) + 1); // ISO
            exif[piexif.ExifIFD.LensModel] = randomLens; // 镜头信息
            exif[piexif.ExifIFD.FocalLength] = [Math.floor(Math.random() * 120) + 24, 1]; // 焦距
            exif[piexif.ExifIFD.WhiteBalance] = Math.floor(Math.random() * 2); // 白平衡
            exif[piexif.ExifIFD.Sharpness] = Math.floor(Math.random() * 3); // 锐度
            exif[piexif.ExifIFD.Flash] = Math.floor(Math.random() * 2); // 闪光灯
            
            // 添加更多随机EXIF信息
            if (Math.random() > 0.5) {
                // 图像处理软件
                exif[piexif.ExifIFD.UserComment] = `Processed with ${randomSoftware}`;
            }
            
            // 添加用户注释（可包含XMP类似的信息）
            const appVersions = ["v1.0.2", "v2.1.0", "v3.0.1", "v1.5.3", "v2.0.0", "v4.2.1"];
            const randomAppVersion = appVersions[Math.floor(Math.random() * appVersions.length)];
            
            const devices = [randomCameraModel, "MacBook Pro", "Windows PC", "iPad Pro", "Android Tablet"];
            const randomDevice = devices[Math.floor(Math.random() * devices.length)];
            
            const editingActions = ["Crop", "Filter", "Adjust", "Retouch", "Enhance", "Collage"];
            const randomActions = [];
            const actionCount = Math.floor(Math.random() * 3) + 1;
            for (let i = 0; i < actionCount; i++) {
                randomActions.push(editingActions[Math.floor(Math.random() * editingActions.length)]);
            }
            
            exif[piexif.ExifIFD.UserComment] = JSON.stringify({
                keywords: randomKeywords,
                description: randomDescription,
                location: randomLocation.desc,
                creator: randomCreator,
                title: randomTitle,
                software: randomSoftware,
                app_version: randomAppVersion,
                device: randomDevice,
                editing_actions: randomActions,
                timestamp: new Date().getTime(),
                uuid: Array.from({length: 16}, () => Math.floor(Math.random() * 16).toString(16)).join('')
            });
            
            // GPS IFD
            gps[piexif.GPSIFD.GPSLatitudeRef] = latRef; // 纬度参考（N/S）
            gps[piexif.GPSIFD.GPSLatitude] = convertToDMS(latAbs); // 纬度
            gps[piexif.GPSIFD.GPSLongitudeRef] = lngRef; // 经度参考（E/W）
            gps[piexif.GPSIFD.GPSLongitude] = convertToDMS(lngAbs); // 经度
            gps[piexif.GPSIFD.GPSDateStamp] = dateTimeStr.split(' ')[0].replace(/:/g, '-'); // GPS日期
            gps[piexif.GPSIFD.GPSTimeStamp] = dateTimeStr.split(' ')[1].split(':').map(v => [parseInt(v), 1]); // GPS时间
            
            // 随机添加高度信息
            if (Math.random() > 0.5) {
                gps[piexif.GPSIFD.GPSAltitude] = [Math.floor(Math.random() * 1000) + 1, 1]; // 海拔高度
                gps[piexif.GPSIFD.GPSAltitudeRef] = 0; // 海平面以上
            }
            
            // 创建EXIF对象
            const exifObj = {"0th":zeroth, "Exif":exif, "GPS":gps};
            return {
                exifObj: exifObj,
                dateTime: dateTimeStr,
                location: randomLocation.desc,
                camera: zeroth[piexif.ImageIFD.Model],
                title: randomTitle,
                creator: randomCreator,
                keywords: randomKeywords,
                description: randomDescription
            };
        }

        // 图片处理函数
        function processImage(img) {
            console.log('开始处理图片');
            
            // 验证输入图片
            if (!img || !img.width || !img.height) {
                console.error('无效的图片输入:', img);
                throw new Error('无效的图片输入');
            }

            // 验证所有必需的选项元素是否存在
            if (!elements.options) {
                console.error('选项对象未初始化');
                throw new Error('选项对象未初始化');
            }

            Object.entries(elements.options).forEach(([key, element]) => {
                if (!element) {
                    console.error(`未找到选项元素: ${key}`);
                    throw new Error(`未找到选项元素: ${key}`);
                }
            });

            // 获取选项值（添加默认值和验证）
            const options = {
                brightness: parseFloat(elements.options.brightness.value) || 0,
                contrast: parseFloat(elements.options.contrast.value) || 0,
                pixelShift: parseInt(elements.options.pixelShift.value) || 1,
                noiseLevel: parseInt(elements.options.noiseLevel.value) || 2,
                watermark: elements.options.watermark.checked || false,
                modifyMetadata: elements.options.modifyMetadata.checked || true,
                // 新增高级选项
                microRotation: parseInt(elements.options.microRotation?.value) || 0,
                edgeProcessing: elements.options.edgeProcessing?.value || 'none',
                colorSpaceTransform: elements.options.colorSpaceTransform?.checked || false,
                invisibleWatermark: elements.options.invisibleWatermark?.value || 'none',
                compressionLevel: parseInt(elements.options.compressionLevel?.value) || 3,
                adaptiveProcessing: elements.options.adaptiveProcessing?.checked || false
            };

            console.log('处理图片使用的选项:', options);

            // 创建一个临时的工作用canvas，用于各种处理
            const tempCanvas = document.createElement('canvas');
            const tempCtx = tempCanvas.getContext('2d');
            tempCanvas.width = img.width;
            tempCanvas.height = img.height;
            tempCtx.clearRect(0, 0, tempCanvas.width, tempCanvas.height);
            tempCtx.drawImage(img, 0, 0, img.width, img.height);
            
            // 应用微小旋转
            if (options.microRotation > 0) {
                applyMicroRotation(tempCanvas, tempCtx, options.microRotation);
            }
            
            // 设置画布尺寸 - 添加微小的随机偏移使每张图片尺寸稍有不同
            const widthOffset = Math.floor(Math.random() * 3) + options.pixelShift;
            const heightOffset = Math.floor(Math.random() * 3) + options.pixelShift;
            
            // 创建最终输出用的canvas
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = tempCanvas.width + widthOffset;
            canvas.height = tempCanvas.height + heightOffset;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            // 绘制图片到最终canvas，加上微小偏移
            const xOffset = options.pixelShift / 2 + (Math.random() * 0.5);
            const yOffset = options.pixelShift / 2 + (Math.random() * 0.5);
            ctx.drawImage(tempCanvas, xOffset, yOffset);
            
            // 应用边缘处理
            if (options.edgeProcessing !== 'none') {
                applyEdgeProcessing(canvas, ctx, options.edgeProcessing);
            }
            
            // 应用亮度和对比度调整以及其他像素级处理
            try {
                // 获取图像数据
                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                const data = imageData.data;
                
                // 生成随机颜色通道微调值
                const redAdjust = (Math.random() - 0.5) * 0.5;
                const greenAdjust = (Math.random() - 0.5) * 0.5;
                const blueAdjust = (Math.random() - 0.5) * 0.5;
                
                // 如果启用了色彩空间转换，生成色相调整值
                let hueAdjust = 0;
                if (options.colorSpaceTransform) {
                    hueAdjust = (Math.random() - 0.5) * 4; // ±2度色相调整
                }
                
                // 随机选择几个像素位置进行不可见修改
                const uniquePixels = new Set();
                const pixelCount = Math.floor(canvas.width * canvas.height * 0.001); // 修改约0.1%的像素
                for (let i = 0; i < pixelCount; i++) {
                    const randomPos = Math.floor(Math.random() * (data.length / 4)) * 4;
                    uniquePixels.add(randomPos);
                }
                
                // 区域适应性处理的准备工作
                let regions = [];
                if (options.adaptiveProcessing) {
                    // 将图像分成3x3的区域
                    const regionWidth = Math.floor(canvas.width / 3);
                    const regionHeight = Math.floor(canvas.height / 3);
                    for (let y = 0; y < 3; y++) {
                        for (let x = 0; x < 3; x++) {
                            regions.push({
                                x: x * regionWidth,
                                y: y * regionHeight,
                                width: regionWidth,
                                height: regionHeight,
                                // 为每个区域生成随机调整值
                                adjustments: {
                                    contrast: (Math.random() - 0.5) * 0.1,
                                    brightness: (Math.random() - 0.5) * 0.1,
                                    noise: Math.random() * options.noiseLevel * 0.3
                                }
                            });
                        }
                    }
                }
                
                // 处理每个像素
                for (let i = 0; i < data.length; i += 4) {
                    const x = (i / 4) % canvas.width;
                    const y = Math.floor((i / 4) / canvas.width);
                    
                    // 基础亮度调整
                    data[i] = Math.min(255, Math.max(0, data[i] + options.brightness * 40));     // R
                    data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + options.brightness * 40)); // G
                    data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + options.brightness * 40)); // B

                    // 基础对比度调整
                    const factor = (259 * (options.contrast * 8 + 255)) / (255 * (259 - options.contrast * 8));
                    data[i] = Math.min(255, Math.max(0, factor * (data[i] - 128) + 128));
                    data[i + 1] = Math.min(255, Math.max(0, factor * (data[i + 1] - 128) + 128));
                    data[i + 2] = Math.min(255, Math.max(0, factor * (data[i + 2] - 128) + 128));

                    // 添加随机噪点
                    if (options.noiseLevel > 0) {
                        const noise = (Math.random() - 0.5) * options.noiseLevel * 2;
                        data[i] = Math.min(255, Math.max(0, data[i] + noise));
                        data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + noise));
                        data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + noise));
                    }
                    
                    // 应用微小的颜色通道偏移
                    data[i] = Math.min(255, Math.max(0, data[i] + redAdjust));
                    data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + greenAdjust));
                    data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + blueAdjust));
                    
                    // 对特定像素进行微调
                    if (uniquePixels.has(i)) {
                        // 修改像素值但保持在±1范围内，肉眼无法察觉
                        data[i] = Math.min(255, Math.max(0, data[i] + (Math.random() < 0.5 ? -1 : 1)));
                        data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + (Math.random() < 0.5 ? -1 : 1)));
                        data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + (Math.random() < 0.5 ? -1 : 1)));
                    }
                    
                    // 如果启用了色彩空间转换，进行HSL转换和调整
                    if (options.colorSpaceTransform) {
                        // RGB转HSL
                        const r = data[i] / 255;
                        const g = data[i + 1] / 255;
                        const b = data[i + 2] / 255;
                        
                        const max = Math.max(r, g, b);
                        const min = Math.min(r, g, b);
                        let h, s, l = (max + min) / 2;
                        
                        if (max === min) {
                            h = s = 0; // 灰色
                        } else {
                            const d = max - min;
                            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
                            
                            switch (max) {
                                case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                                case g: h = (b - r) / d + 2; break;
                                case b: h = (r - g) / d + 4; break;
                            }
                            
                            h /= 6;
                        }
                        
                        // 调整色相 (hueAdjust已转为0-1范围的值)
                        h = (h + hueAdjust/360 + 1) % 1;
                        
                        // HSL转回RGB
                        if (s === 0) {
                            data[i] = data[i + 1] = data[i + 2] = Math.round(l * 255);
                        } else {
                            const hue2rgb = (p, q, t) => {
                                if (t < 0) t += 1;
                                if (t > 1) t -= 1;
                                if (t < 1/6) return p + (q - p) * 6 * t;
                                if (t < 1/2) return q;
                                if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
                                return p;
                            };
                            
                            const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
                            const p = 2 * l - q;
                            
                            data[i] = Math.round(hue2rgb(p, q, h + 1/3) * 255);
                            data[i + 1] = Math.round(hue2rgb(p, q, h) * 255);
                            data[i + 2] = Math.round(hue2rgb(p, q, h - 1/3) * 255);
                        }
                    }
                    
                    // 应用区域适应性处理
                    if (options.adaptiveProcessing) {
                        // 找到当前像素所在的区域
                        for (const region of regions) {
                            if (x >= region.x && x < region.x + region.width && 
                                y >= region.y && y < region.y + region.height) {
                                
                                // 应用区域特定的调整
                                const rBrightness = data[i] * (1 + region.adjustments.brightness);
                                const gBrightness = data[i + 1] * (1 + region.adjustments.brightness);
                                const bBrightness = data[i + 2] * (1 + region.adjustments.brightness);
                                
                                // 应用区域对比度
                                const regionFactor = (259 * (region.adjustments.contrast * 255 + 255)) / (255 * (259 - region.adjustments.contrast * 255));
                                data[i] = Math.min(255, Math.max(0, regionFactor * (rBrightness - 128) + 128));
                                data[i + 1] = Math.min(255, Math.max(0, regionFactor * (gBrightness - 128) + 128));
                                data[i + 2] = Math.min(255, Math.max(0, regionFactor * (bBrightness - 128) + 128));
                                
                                // 添加区域特定的噪点
                                if (Math.random() < 0.1) { // 只对10%的像素添加噪点，减少处理时间
                                    const regionNoise = (Math.random() - 0.5) * region.adjustments.noise;
                                    data[i] = Math.min(255, Math.max(0, data[i] + regionNoise));
                                    data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + regionNoise));
                                    data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + regionNoise));
                                }
                                
                                break;
                            }
                        }
                    }
                }
                
                // 应用LSB水印
                if (options.invisibleWatermark === 'lsb') {
                    applyLSBWatermark(data);
                }

                ctx.putImageData(imageData, 0, 0);

                // 添加可见水印
                if (options.watermark) {
                    const timestamp = new Date().getTime().toString().slice(-6);
                    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
                    ctx.font = '12px Arial';
                    ctx.fillText(timestamp, Math.random() * (canvas.width - 50), Math.random() * (canvas.height - 20));
                }
                
                // 添加不可见水印（随机选择一个边角添加极低透明度的文本）
                const invisibleText = new Date().getTime().toString();
                ctx.font = '8px Arial';
                ctx.fillStyle = 'rgba(255, 255, 255, 0.02)'; // 2%透明度，肉眼几乎不可见
                
                // 随机选择一个角落
                const corner = Math.floor(Math.random() * 4);
                let xPos, yPos;
                
                switch (corner) {
                    case 0: // 左上
                        xPos = 5;
                        yPos = 10;
                        break;
                    case 1: // 右上
                        xPos = canvas.width - 60;
                        yPos = 10;
                        break;
                    case 2: // 左下
                        xPos = 5;
                        yPos = canvas.height - 5;
                        break;
                    case 3: // 右下
                        xPos = canvas.width - 60;
                        yPos = canvas.height - 5;
                        break;
                }
                
                ctx.fillText(invisibleText, xPos, yPos);
                
                // 添加DCT域水印
                if (options.invisibleWatermark === 'dct') {
                    // DCT域水印需要在单独函数中实现，这里只是模拟
                    // 实际上，浏览器环境中完整实现DCT域水印比较复杂
                    // 简单起见，我们在频域处理后再次添加一些微小扰动
                    applyFakeFrequencyDomainWatermark(canvas, ctx);
                }
                
                // 添加随机1像素边框
                if (Math.random() < 0.5) {
                    const borderColor = `rgba(${Math.floor(Math.random()*255)}, ${Math.floor(Math.random()*255)}, ${Math.floor(Math.random()*255)}, 0.01)`;
                    ctx.strokeStyle = borderColor;
                    ctx.lineWidth = 1;
                    ctx.strokeRect(0, 0, canvas.width, canvas.height);
                }

            } catch (error) {
                console.error('绘制图片失败:', error);
                throw error;
            }
            
            // 根据压缩级别控制压缩质量
            let compressionQuality = 0.92;
            if (options.compressionLevel) {
                const qualityVariation = (Math.random() * 0.04) - 0.02; // 添加±0.02的随机变化
                switch (options.compressionLevel) {
                    case 1: compressionQuality = 0.95 + qualityVariation; break; // 高质量
                    case 2: compressionQuality = 0.90 + qualityVariation; break;
                    case 3: compressionQuality = 0.85 + qualityVariation; break; // 中等质量
                    case 4: compressionQuality = 0.80 + qualityVariation; break;
                    case 5: compressionQuality = 0.75 + qualityVariation; break; // 低质量，更多数字差异
                }
                compressionQuality = Math.min(0.99, Math.max(0.7, compressionQuality)); // 确保在合理范围内
            }
            
            // 获取处理后的图片数据
            const jpegData = canvas.toDataURL('image/jpeg', compressionQuality);
            
            // 如果选择了多级压缩，模拟多次压缩和解压的过程
            if (options.compressionLevel >= 4) {
                return simulateMultiCompressionCycle(jpegData, options);
            }
            
            // 如果选择了修改元数据，则添加随机元数据
            if (options.modifyMetadata && typeof piexif !== 'undefined') {
                try {
                    // 生成随机元数据
                    const metadata = generateRandomMetadata();
                    console.log('生成的随机元数据:', metadata);
                    
                    // 将JPEG数据转换为二进制
                    const jpegBinary = piexif.remove(jpegData);
                    
                    // 添加EXIF数据
                    const exifBytes = piexif.dump(metadata.exifObj);
                    const newJpegData = piexif.insert(exifBytes, jpegBinary);
                    
                    return newJpegData;
                } catch (error) {
                    console.error('添加元数据失败:', error);
                    console.warn('将返回无元数据的图片');
                    return jpegData;
                }
            }
            
            return jpegData;
        }

        // 应用微小旋转
        function applyMicroRotation(canvas, ctx, rotationLevel) {
            const width = canvas.width;
            const height = canvas.height;
            
            // 保存原始图像数据
            const originalData = ctx.getImageData(0, 0, width, height);
            
            // 计算旋转角度 (0-5级对应0-2度)
            const maxRotation = 2.0; // 最大旋转角度
            const rotationDegree = (Math.random() * rotationLevel / 5) * maxRotation;
            const rotationRad = (rotationDegree * Math.PI) / 180;
            
            // 清除画布
            ctx.clearRect(0, 0, width, height);
            
            // 保存当前状态
            ctx.save();
            
            // 将旋转中心移到画布中心
            ctx.translate(width/2, height/2);
            
            // 执行旋转
            ctx.rotate(rotationRad);
            
            // 创建临时图像以保存原始数据
            const tempImg = document.createElement('canvas');
            tempImg.width = width;
            tempImg.height = height;
            const tempCtx = tempImg.getContext('2d');
            tempCtx.putImageData(originalData, 0, 0);
            
            // 绘制回原始图像，但位置偏移以保持居中
            ctx.drawImage(tempImg, -width/2, -height/2);
            
            // 恢复状态
            ctx.restore();
            
            return canvas;
        }

        // 应用边缘处理
        function applyEdgeProcessing(canvas, ctx, processingType) {
            const width = canvas.width;
            const height = canvas.height;
            
            switch (processingType) {
                case 'crop': // 轻微裁剪
                    const cropPixels = Math.floor(Math.random() * 3) + 1; // 裁剪1-3像素
                    const imageData = ctx.getImageData(cropPixels, cropPixels, width - cropPixels * 2, height - cropPixels * 2);
                    ctx.clearRect(0, 0, width, height);
                    ctx.putImageData(imageData, cropPixels, cropPixels);
                    break;
                    
                case 'blur': // 边缘模糊
                    const edgeThickness = 5; // 边缘模糊区域厚度
                    
                    // 获取中心区域的图像数据
                    const centerData = ctx.getImageData(edgeThickness, edgeThickness, 
                                                       width - edgeThickness * 2, 
                                                       height - edgeThickness * 2);
                    
                    // 获取完整图像数据
                    const fullData = ctx.getImageData(0, 0, width, height);
                    const data = fullData.data;
                    
                    // 对边缘区域进行模糊处理
                    for (let y = 0; y < height; y++) {
                        for (let x = 0; x < width; x++) {
                            // 检查是否在边缘区域
                            if (x < edgeThickness || x >= width - edgeThickness || 
                                y < edgeThickness || y >= height - edgeThickness) {
                                
                                const i = (y * width + x) * 4;
                                
                                // 简单的模糊处理：用相邻几个像素的平均值替代当前像素
                                let r = 0, g = 0, b = 0, count = 0;
                                
                                // 采样3x3区域
                                for (let dy = -1; dy <= 1; dy++) {
                                    for (let dx = -1; dx <= 1; dx++) {
                                        const nx = x + dx;
                                        const ny = y + dy;
                                        
                                        if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                                            const ni = (ny * width + nx) * 4;
                                            r += data[ni];
                                            g += data[ni + 1];
                                            b += data[ni + 2];
                                            count++;
                                        }
                                    }
                                }
                                
                                // 设置平均值
                                if (count > 0) {
                                    data[i] = r / count;
                                    data[i + 1] = g / count;
                                    data[i + 2] = b / count;
                                }
                            }
                        }
                    }
                    
                    // 更新图像数据
                    ctx.putImageData(fullData, 0, 0);
                    break;
                    
                case 'sharpen': // 边缘锐化
                    // 实现边缘锐化
                    const imageData2 = ctx.getImageData(0, 0, width, height);
                    const data2 = imageData2.data;
                    
                    // 使用拉普拉斯算子进行边缘检测和锐化
                    const tempData = new Uint8ClampedArray(data2);
                    
                    for (let y = 1; y < height - 1; y++) {
                        for (let x = 1; x < width - 1; x++) {
                            const i = (y * width + x) * 4;
                            
                            // 对RGB通道分别进行处理
                            for (let c = 0; c < 3; c++) {
                                // 拉普拉斯锐化算子
                                const val = 5 * tempData[i + c]
                                         - tempData[i - 4 + c]  // 左
                                         - tempData[i + 4 + c]  // 右
                                         - tempData[i - width * 4 + c]  // 上
                                         - tempData[i + width * 4 + c]; // 下
                                
                                // 仅对边缘区域应用锐化
                                if (x < 5 || x >= width - 5 || y < 5 || y >= height - 5) {
                                    data2[i + c] = Math.min(255, Math.max(0, val));
                                }
                            }
                        }
                    }
                    
                    ctx.putImageData(imageData2, 0, 0);
                    break;
            }
            
            return canvas;
        }

        // 应用LSB水印（最低有效位）
        function applyLSBWatermark(data) {
            // 生成随机水印信息
            const watermarkText = `XHS${new Date().getTime()}`;
            const watermarkBytes = [];
            
            // 将水印文本转换为字节
            for (let i = 0; i < watermarkText.length; i++) {
                const code = watermarkText.charCodeAt(i);
                watermarkBytes.push(code);
            }
            
            // 将水印字节嵌入到图像LSB中
            const bytesLength = watermarkBytes.length;
            
            // 首先存储水印长度 (2 bytes = 16 bits)
            const lengthBits = bytesLength.toString(2).padStart(16, '0');
            
            let bitIndex = 0;
            
            // 存储长度
            for (let i = 0; i < 16; i++) {
                const pixelIndex = i * 4; // 每个像素4个字节 (RGBA)
                
                // 修改最低位
                data[pixelIndex] = (data[pixelIndex] & 0xFE) | parseInt(lengthBits[i]);
            }
            
            // 存储水印数据
            for (let i = 0; i < bytesLength; i++) {
                const byte = watermarkBytes[i];
                const bits = byte.toString(2).padStart(8, '0');
                
                // 每个字节需要8个像素位置
                for (let j = 0; j < 8; j++) {
                    bitIndex++;
                    const pixelIndex = (16 + bitIndex) * 4;
                    
                    if (pixelIndex < data.length) {
                        // 修改最低位
                        data[pixelIndex] = (data[pixelIndex] & 0xFE) | parseInt(bits[j]);
                    }
                }
            }
        }

        // 模拟DCT域水印（实际上是一个简化的频域水印模拟）
        function applyFakeFrequencyDomainWatermark(canvas, ctx) {
            // 实际的DCT域水印需要在频域中嵌入水印，然后反变换回空域
            // 这里我们使用一个简化的方法来模拟频域水印的效果
            
            const width = canvas.width;
            const height = canvas.height;
            const blockSize = 8; // DCT通常以8x8的块为单位
            
            // 获取图像数据
            const imageData = ctx.getImageData(0, 0, width, height);
            const data = imageData.data;
            
            // 生成一个伪随机序列，用于确定修改哪些中频系数
            const pseudoRandomSequence = [];
            const watermarkBits = 32; // 水印比特数
            
            for (let i = 0; i < watermarkBits; i++) {
                pseudoRandomSequence.push(Math.floor(Math.random() * 1000));
            }
            
            // 处理图像块
            for (let y = 0; y < height - blockSize; y += blockSize) {
                for (let x = 0; x < width - blockSize; x += blockSize) {
                    // 在每个8x8块中选择一些像素进行微小修改
                    if (Math.random() < 0.2) { // 只修改20%的块，减少处理时间
                        // 选择块中的一个中心点
                        const centerX = x + 4;
                        const centerY = y + 4;
                        const centerIdx = (centerY * width + centerX) * 4;
                        
                        // 选择一个伪随机序列的索引
                        const seqIdx = pseudoRandomSequence[Math.floor(Math.random() * watermarkBits)];
                        
                        // 使用伪随机数修改该像素，模拟频域修改
                        const mod = seqIdx % 4 - 2; // -2到1的范围
                        
                        // 修改中频区域的像素
                        if (centerIdx + 4 < data.length) {
                            data[centerIdx] = Math.min(255, Math.max(0, data[centerIdx] + mod));
                            data[centerIdx + 1] = Math.min(255, Math.max(0, data[centerIdx + 1] - mod));
                            data[centerIdx + 2] = Math.min(255, Math.max(0, data[centerIdx + 2] + mod));
                        }
                    }
                }
            }
            
            // 更新图像数据
            ctx.putImageData(imageData, 0, 0);
        }

        // 模拟多级压缩循环
        function simulateMultiCompressionCycle(jpegData, options) {
            // 实际的多级压缩会将图像压缩、解压、再压缩多次
            // 这里我们模拟这个过程，通过在每次循环中轻微地改变压缩质量
            
            return new Promise((resolve, reject) => {
                try {
                    let currentData = jpegData;
                    const img = new Image();
                    
                    img.onload = () => {
                        const canvas = document.createElement('canvas');
                        const ctx = canvas.getContext('2d');
                        canvas.width = img.width;
                        canvas.height = img.height;
                        
                        // 绘制图像
                        ctx.drawImage(img, 0, 0);
                        
                        // 应用轻微的调整
                        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                        const data = imageData.data;
                        
                        // 对少量随机像素进行修改
                        const pixelCount = Math.floor(canvas.width * canvas.height * 0.001); // 修改0.1%的像素
                        for (let i = 0; i < pixelCount; i++) {
                            const pixelIndex = Math.floor(Math.random() * (data.length / 4)) * 4;
                            if (pixelIndex + 2 < data.length) {
                                data[pixelIndex] = Math.min(255, Math.max(0, data[pixelIndex] + (Math.random() < 0.5 ? -1 : 1)));
                                data[pixelIndex + 1] = Math.min(255, Math.max(0, data[pixelIndex + 1] + (Math.random() < 0.5 ? -1 : 1)));
                                data[pixelIndex + 2] = Math.min(255, Math.max(0, data[pixelIndex + 2] + (Math.random() < 0.5 ? -1 : 1)));
                            }
                        }
                        
                        ctx.putImageData(imageData, 0, 0);
                        
                        // 使用不同的压缩质量再次压缩
                        const compressionQuality = 0.75 + Math.random() * 0.15; // 随机质量在0.75-0.9之间
                        const compressedData = canvas.toDataURL('image/jpeg', compressionQuality);
                        
                        resolve(compressedData);
                    };
                    
                    img.onerror = (error) => {
                        console.error('多级压缩循环中加载图像失败:', error);
                        resolve(jpegData); // 出错时返回原始数据
                    };
                    
                    img.src = jpegData;
                } catch (error) {
                    console.error('多级压缩循环失败:', error);
                    resolve(jpegData);
                }
            });
        }

        // 添加下载按钮事件处理
        elements.downloadBtn.addEventListener('click', async () => {
            console.log('开始下载处理后的图片');
            
            if (uploadedImages.length === 0) {
                console.warn('没有可下载的图片');
                alert('请先上传图片');
                return;
            }

            try {
                // 显示加载状态
                const originalText = elements.downloadBtn.textContent;
                elements.downloadBtn.textContent = '处理中...';
                elements.downloadBtn.disabled = true;
                elements.downloadBtn.style.cursor = 'wait';

                // 创建ZIP文件
                const zip = new JSZip();
                
                // 处理每张图片
                for (let i = 0; i < uploadedImages.length; i++) {
                    const image = uploadedImages[i];
                    console.log(`处理第 ${i + 1}/${uploadedImages.length} 张图片`);
                    elements.downloadBtn.textContent = `处理中 ${i + 1}/${uploadedImages.length}...`;
                    
                    try {
                        // 获取处理后的图片数据
                        const processedDataUrl = processImage(image.original);
                        
                        // 将Base64数据转换为二进制
                        const base64Data = processedDataUrl.replace(/^data:image\/jpeg;base64,/, '');
                        const binaryData = atob(base64Data);
                        const array = new Uint8Array(binaryData.length);
                        for (let j = 0; j < binaryData.length; j++) {
                            array[j] = binaryData.charCodeAt(j);
                        }
                        
                        // 添加到ZIP文件
                        const filename = `processed_${image.name}`;
                        zip.file(filename, array);
                        
                        console.log(`第 ${i + 1} 张图片已添加到ZIP文件`);
                    } catch (error) {
                        console.error(`处理第 ${i + 1} 张图片失败:`, error);
                    }
                }
                
                // 生成并下载ZIP文件
                console.log('生成ZIP文件...');
                elements.downloadBtn.textContent = '打包中...';
                const content = await zip.generateAsync({type: 'blob'});
                const downloadUrl = URL.createObjectURL(content);
                
                const link = document.createElement('a');
                link.href = downloadUrl;
                link.download = 'processed_images.zip';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(downloadUrl);
                
                console.log('下载完成');
                elements.downloadBtn.textContent = '下载完成!';
                setTimeout(() => {
                    elements.downloadBtn.textContent = originalText;
                    elements.downloadBtn.disabled = false;
                    elements.downloadBtn.style.cursor = 'pointer';
                }, 2000);
            } catch (error) {
                console.error('下载过程中出错:', error);
                alert('处理图片时出错，请重试');
                elements.downloadBtn.textContent = originalText;
                elements.downloadBtn.disabled = false;
                elements.downloadBtn.style.cursor = 'pointer';
            }
        });

        // 添加事件监听器
        Object.entries(elements.options).forEach(([key, element]) => {
            if (element) {
                console.log(`为 ${key} 添加事件监听器`);
                element.addEventListener('input', (event) => {
                    console.log(`${key} 值改变为:`, event.target.value || event.target.checked);
                    if (uploadedImages.length > 0) {
                        // 立即更新预览
                        updatePreviews();
                    }
                });
            }
        });

        // 更新预览函数
        async function updatePreviews() {
            console.log('开始更新预览');
            
            // 验证是否有上传的图片
            if (!uploadedImages || uploadedImages.length === 0) {
                console.warn('没有可以预览的图片');
                return;
            }

            // 获取当前选项值并打印
            const currentOptions = {
                brightness: parseFloat(elements.options.brightness.value) || 0,
                contrast: parseFloat(elements.options.contrast.value) || 0,
                pixelShift: parseInt(elements.options.pixelShift.value) || 1,
                noiseLevel: parseInt(elements.options.noiseLevel.value) || 2,
                watermark: elements.options.watermark.checked || false,
                modifyMetadata: elements.options.modifyMetadata.checked || true,
                // 新增高级选项
                microRotation: parseInt(elements.options.microRotation?.value) || 0,
                edgeProcessing: elements.options.edgeProcessing?.value || 'none',
                colorSpaceTransform: elements.options.colorSpaceTransform?.checked || false,
                invisibleWatermark: elements.options.invisibleWatermark?.value || 'none',
                compressionLevel: parseInt(elements.options.compressionLevel?.value) || 3,
                adaptiveProcessing: elements.options.adaptiveProcessing?.checked || false
            };
            console.log('当前处理选项:', currentOptions);

            // 清空预览容器
            elements.previewContainer.innerHTML = '';
            
            // 显示处理信息
            let processInfoText = '图片处理选项：';
            if (currentOptions.brightness !== 0) processInfoText += `亮度(${currentOptions.brightness}) `;
            if (currentOptions.contrast !== 0) processInfoText += `对比度(${currentOptions.contrast}) `;
            if (currentOptions.watermark) processInfoText += `水印 `;
            if (currentOptions.pixelShift > 1) processInfoText += `像素偏移(${currentOptions.pixelShift}) `;
            if (currentOptions.noiseLevel > 0) processInfoText += `噪点(${currentOptions.noiseLevel}) `;
            if (currentOptions.modifyMetadata) processInfoText += `随机元数据 `;
            if (currentOptions.microRotation > 0) processInfoText += `微旋转(${currentOptions.microRotation}) `;
            if (currentOptions.edgeProcessing !== 'none') processInfoText += `边缘处理(${currentOptions.edgeProcessing}) `;
            if (currentOptions.colorSpaceTransform) processInfoText += `色彩调整 `;
            if (currentOptions.invisibleWatermark !== 'none') processInfoText += `隐形水印(${currentOptions.invisibleWatermark}) `;
            if (currentOptions.compressionLevel > 1) processInfoText += `压缩级别(${currentOptions.compressionLevel}) `;
            if (currentOptions.adaptiveProcessing) processInfoText += `区域处理 `;
            
            elements.processInfo.textContent = processInfoText;
            
            console.log(`处理 ${uploadedImages.length} 张图片`);

            // 处理每张图片
            for (let index = 0; index < uploadedImages.length; index++) {
                const image = uploadedImages[index];
                if (!image || !image.original) {
                    console.error(`第 ${index + 1} 张图片无效`);
                    continue;
                }

                try {
                    console.log(`处理第 ${index + 1} 张图片`);
                    
                    // 创建包含原图和处理后图片的比较容器
                    const comparisonContainer = document.createElement('div');
                    comparisonContainer.className = 'comparison-container';
                    elements.previewContainer.appendChild(comparisonContainer);
                    
                    // 创建原图容器
                    const originalContainer = document.createElement('div');
                    originalContainer.className = 'preview-item original-preview';
                    comparisonContainer.appendChild(originalContainer);
                    
                    // 创建处理后的图片容器
                    const processedContainer = document.createElement('div');
                    processedContainer.className = 'preview-item processed-preview';
                    comparisonContainer.appendChild(processedContainer);
                    
                    // 创建原图
                    const originalImg = document.createElement('img');
                    originalContainer.appendChild(originalImg);
                    
                    // 创建处理后的图片
                    const processedImg = document.createElement('img');
                    processedContainer.appendChild(processedImg);
                    
                    // 添加"原图"标记
                    const originalMark = document.createElement('div');
                    originalMark.className = 'original-mark';
                    originalMark.textContent = '原图';
                    originalContainer.appendChild(originalMark);
                    
                    // 添加"处理后"标记
                    const processedMark = document.createElement('div');
                    processedMark.className = 'processed-mark';
                    processedMark.textContent = '处理后';
                    processedContainer.appendChild(processedMark);

            // 添加加载指示器
                const loadingDiv = document.createElement('div');
                loadingDiv.className = 'loading-indicator';
                loadingDiv.textContent = '处理中...';
                loadingDiv.style.position = 'absolute';
                loadingDiv.style.top = '50%';
                loadingDiv.style.left = '50%';
                loadingDiv.style.transform = 'translate(-50%, -50%)';
                loadingDiv.style.background = 'rgba(0, 0, 0, 0.7)';
                loadingDiv.style.color = 'white';
                loadingDiv.style.padding = '5px 10px';
                loadingDiv.style.borderRadius = '4px';
                    processedContainer.appendChild(loadingDiv);
                    
                    // 设置原图
                    const originalImageUrl = URL.createObjectURL(image.file);
                    originalImg.src = originalImageUrl;
                    
                    // 显示处理中状态
                    elements.downloadBtn.textContent = `处理图片 ${index + 1}/${uploadedImages.length}...`;
                    elements.downloadBtn.disabled = true;
                    
                    // 获取元数据选项状态
                    const modifyMetadata = elements.options.modifyMetadata.checked;
                    
                    // 调用处理函数，并获取处理后的数据和元数据信息
                    let processedDataUrl;
                    let metadataInfo = null;
                    
                    try {
                        // 生成随机元数据
                        if (modifyMetadata && typeof piexif !== 'undefined') {
                            const metadata = generateRandomMetadata();
                            metadataInfo = metadata; // 保存元数据信息
                        }
                        
                        // 处理图片
                        processedDataUrl = await processImage(image.original);
                        
                        // 保存处理后的URL
                        uploadedImages[index].processedUrl = processedDataUrl;
                        
                    } catch (error) {
                        console.error(`处理图片失败:`, error);
                        processedDataUrl = URL.createObjectURL(image.file); // 出错时显示原图
                    }
                    
                    // 设置处理后的图片
                    processedImg.src = processedDataUrl;
                    
                        // 移除加载指示器
                    loadingDiv.remove();
                    
                    // 如果有元数据，显示元数据信息
                    if (metadataInfo) {
                        const metadataDiv = document.createElement('div');
                        metadataDiv.className = 'metadata-info';
                        
                        metadataDiv.innerHTML = `
                            <div>设备: ${metadataInfo.camera}</div>
                            <div>位置: ${metadataInfo.location}</div>
                            <div>时间: ${metadataInfo.dateTime}</div>
                            <div>创作者: ${metadataInfo.creator}</div>
                        `;
                        
                        processedContainer.appendChild(metadataDiv);
                    }
                    
                    console.log(`第 ${index + 1} 张图片预览更新成功`);
                } catch (error) {
                    console.error(`第 ${index + 1} 张图片预览更新失败:`, error);
                    elements.previewContainer.innerHTML += `<div class="preview-error">第 ${index + 1} 张图片处理失败: ${error.message}</div>`;
                }
            }
            
            // 恢复下载按钮状态
            elements.downloadBtn.textContent = '处理并下载图片';
            elements.downloadBtn.disabled = false;
        }

        console.log('初始化完成');

    } catch (error) {
        console.error('初始化失败:', error);
    }
})(); 
