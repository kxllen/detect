"use client";

import { useEffect, useRef, useState } from "react";
import * as tf from "@tensorflow/tfjs";

interface Detection {
  bbox: [number, number, number, number];
  class: string;
  score: number;
}

// YOLOv8 OIV7 类别映射
const CLASSES = ["Accordion", "Adhesive tape", "Aircraft", "Airplane", "Alarm clock", "Alpaca", "Ambulance", "Animal", "Ant", "Antelope", "Apple", "Armadillo", "Artichoke", "Auto part", "Axe", "Backpack", "Bagel", "Baked goods", "Balance beam", "Ball", "Balloon", "Banana", "Band-aid", "Banjo", "Barge", "Barrel", "Baseball bat", "Baseball glove", "Bat (Animal)", "Bathroom accessory", "Bathroom cabinet", "Bathtub", "Beaker", "Bear", "Bed", "Bee", "Beehive", "Beer", "Beetle", "Bell pepper", "Belt", "Bench", "Bicycle", "Bicycle helmet", "Bicycle wheel", "Bidet", "Billboard", "Billiard table", "Binoculars", "Bird", "Blender", "Blue jay", "Boat", "Bomb", "Book", "Bookcase", "Boot", "Bottle", "Bottle opener", "Bow and arrow", "Bowl", "Bowling equipment", "Box", "Boy", "Brassiere", "Bread", "Briefcase", "Broccoli", "Bronze sculpture", "Brown bear", "Building", "Bull", "Burrito", "Bus", "Bust", "Butterfly", "Cabbage", "Cabinetry", "Cake", "Cake stand", "Calculator", "Camel", "Camera", "Can opener", "Canary", "Candle", "Candy", "Cannon", "Canoe", "Cantaloupe", "Car", "Carnivore", "Carrot", "Cart", "Cassette deck", "Castle", "Cat", "Cat furniture", "Caterpillar", "Cattle", "Ceiling fan", "Cello", "Centipede", "Chainsaw", "Chair", "Cheese", "Cheetah", "Chest of drawers", "Chicken", "Chime", "Chisel", "Chopsticks", "Christmas tree", "Clock", "Closet", "Clothing", "Coat", "Cocktail", "Cocktail shaker", "Coconut", "Coffee", "Coffee cup", "Coffee table", "Coffeemaker", "Coin", "Common fig", "Common sunflower", "Computer keyboard", "Computer monitor", "Computer mouse", "Container", "Convenience store", "Cookie", "Cooking spray", "Corded phone", "Cosmetics", "Couch", "Countertop", "Cowboy hat", "Crab", "Cream", "Cricket ball", "Crocodile", "Croissant", "Crown", "Crutch", "Cucumber", "Cupboard", "Curtain", "Cutting board", "Dagger", "Dairy Product", "Deer", "Desk", "Dessert", "Diaper", "Dice", "Digital clock", "Dinosaur", "Dishwasher", "Dog", "Dog bed", "Doll", "Dolphin", "Door", "Door handle", "Doughnut", "Dragonfly", "Drawer", "Dress", "Drill (Tool)", "Drink", "Drinking straw", "Drum", "Duck", "Dumbbell", "Eagle", "Earrings", "Egg (Food)", "Elephant", "Envelope", "Eraser", "Face powder", "Facial tissue holder", "Falcon", "Fashion accessory", "Fast food", "Fax", "Fedora", "Filing cabinet", "Fire hydrant", "Fireplace", "Fish", "Flag", "Flashlight", "Flower", "Flowerpot", "Flute", "Flying disc", "Food", "Food processor", "Football", "Football helmet", "Footwear", "Fork", "Fountain", "Fox", "French fries", "French horn", "Frog", "Fruit", "Frying pan", "Furniture", "Garden Asparagus", "Gas stove", "Giraffe", "Girl", "Glasses", "Glove", "Goat", "Goggles", "Goldfish", "Golf ball", "Golf cart", "Gondola", "Goose", "Grape", "Grapefruit", "Grinder", "Guacamole", "Guitar", "Hair dryer", "Hair spray", "Hamburger", "Hammer", "Hamster", "Hand dryer", "Handbag", "Handgun", "Harbor seal", "Harmonica", "Harp", "Harpsichord", "Hat", "Headphones", "Heater", "Hedgehog", "Helicopter", "Helmet", "High heels", "Hiking equipment", "Hippopotamus", "Home appliance", "Honeycomb", "Horizontal bar", "Horse", "Hot dog", "House", "Houseplant", "Human arm", "Human beard", "Human body", "Human ear", "Human eye", "Human face", "Human foot", "Human hair", "Human hand", "Human head", "Human leg", "Human mouth", "Human nose", "Humidifier", "Ice cream", "Indoor rower", "Infant bed", "Insect", "Invertebrate", "Ipod", "Isopod", "Jacket", "Jacuzzi", "Jaguar (Animal)", "Jeans", "Jellyfish", "Jet ski", "Jug", "Juice", "Kangaroo", "Kettle", "Kitchen & dining room table", "Kitchen appliance", "Kitchen knife", "Kitchen utensil", "Kitchenware", "Kite", "Knife", "Koala", "Ladder", "Ladle", "Ladybug", "Lamp", "Land vehicle", "Lantern", "Laptop", "Lavender (Plant)", "Lemon", "Leopard", "Light bulb", "Light switch", "Lighthouse", "Lily", "Limousine", "Lion", "Lipstick", "Lizard", "Lobster", "Loveseat", "Luggage and bags", "Lynx", "Magpie", "Mammal", "Man", "Mango", "Maple", "Maracas", "Marine invertebrates", "Marine mammal", "Measuring cup", "Mechanical fan", "Medical equipment", "Microphone", "Microwave oven", "Milk", "Miniskirt", "Mirror", "Missile", "Mixer", "Mixing bowl", "Mobile phone", "Monkey", "Moths and butterflies", "Motorcycle", "Mouse", "Muffin", "Mug", "Mule", "Mushroom", "Musical instrument", "Musical keyboard", "Nail (Construction)", "Necklace", "Nightstand", "Oboe", "Office building", "Office supplies", "Orange", "Organ (Musical Instrument)", "Ostrich", "Otter", "Oven", "Owl", "Oyster", "Paddle", "Palm tree", "Pancake", "Panda", "Paper cutter", "Paper towel", "Parachute", "Parking meter", "Parrot", "Pasta", "Pastry", "Peach", "Pear", "Pen", "Pencil case", "Pencil sharpener", "Penguin", "Perfume", "Person", "Personal care", "Personal flotation device", "Piano", "Picnic basket", "Picture frame", "Pig", "Pillow", "Pineapple", "Pitcher (Container)", "Pizza", "Pizza cutter", "Plant", "Plastic bag", "Plate", "Platter", "Plumbing fixture", "Polar bear", "Pomegranate", "Popcorn", "Porch", "Porcupine", "Poster", "Potato", "Power plugs and sockets", "Pressure cooker", "Pretzel", "Printer", "Pumpkin", "Punching bag", "Rabbit", "Raccoon", "Racket", "Radish", "Ratchet (Device)", "Raven", "Rays and skates", "Red panda", "Refrigerator", "Remote control", "Reptile", "Rhinoceros", "Rifle", "Ring binder", "Rocket", "Roller skates", "Rose", "Rugby ball", "Ruler", "Salad", "Salt and pepper shakers", "Sandal", "Sandwich", "Saucer", "Saxophone", "Scale", "Scarf", "Scissors", "Scoreboard", "Scorpion", "Screwdriver", "Sculpture", "Sea lion", "Sea turtle", "Seafood", "Seahorse", "Seat belt", "Segway", "Serving tray", "Sewing machine", "Shark", "Sheep", "Shelf", "Shellfish", "Shirt", "Shorts", "Shotgun", "Shower", "Shrimp", "Sink", "Skateboard", "Ski", "Skirt", "Skull", "Skunk", "Skyscraper", "Slow cooker", "Snack", "Snail", "Snake", "Snowboard", "Snowman", "Snowmobile", "Snowplow", "Soap dispenser", "Sock", "Sofa bed", "Sombrero", "Sparrow", "Spatula", "Spice rack", "Spider", "Spoon", "Sports equipment", "Sports uniform", "Squash (Plant)", "Squid", "Squirrel", "Stairs", "Stapler", "Starfish", "Stationary bicycle", "Stethoscope", "Stool", "Stop sign", "Strawberry", "Street light", "Stretcher", "Studio couch", "Submarine", "Submarine sandwich", "Suit", "Suitcase", "Sun hat", "Sunglasses", "Surfboard", "Sushi", "Swan", "Swim cap", "Swimming pool", "Swimwear", "Sword", "Syringe", "Table", "Table tennis racket", "Tablet computer", "Tableware", "Taco", "Tank", "Tap", "Tart", "Taxi", "Tea", "Teapot", "Teddy bear", "Telephone", "Television", "Tennis ball", "Tennis racket", "Tent", "Tiara", "Tick", "Tie", "Tiger", "Tin can", "Tire", "Toaster", "Toilet", "Toilet paper", "Tomato", "Tool", "Toothbrush", "Torch", "Tortoise", "Towel", "Tower", "Toy", "Traffic light", "Traffic sign", "Train", "Training bench", "Treadmill", "Tree", "Tree house", "Tripod", "Trombone", "Trousers", "Truck", "Trumpet", "Turkey", "Turtle", "Umbrella", "Unicycle", "Van", "Vase", "Vegetable", "Vehicle", "Vehicle registration plate", "Violin", "Volleyball (Ball)", "Waffle", "Waffle iron", "Wall clock", "Wardrobe", "Washing machine", "Waste container", "Watch", "Watercraft", "Watermelon", "Weapon", "Whale", "Wheel", "Wheelchair", "Whisk", "Whiteboard", "Willow", "Window", "Window blind", "Wine", "Wine glass", "Wine rack", "Winter melon", "Wok", "Woman", "Wood-burning stove", "Woodpecker", "Worm", "Wrench", "Zebra", "Zucchini"];

export default function Home() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const isDetectingRef = useRef<boolean>(false); // 使用 ref 来同步跟踪检测状态
  const [model, setModel] = useState<tf.GraphModel | null>(null);
  const [fps, setFps] = useState(0);
  const [latency, setLatency] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [backendInfo, setBackendInfo] = useState<{
    backend: string;
    isHardwareAccelerated: boolean;
    details: string;
  } | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const frameCountRef = useRef<number>(0);
  const fpsTimeRef = useRef<number>(Date.now());

  // 设置后端优先级（硬件加速优先）
  const setupBackend = async (): Promise<string | null> => {
    console.log("[后端] 开始设置后端，优先使用硬件加速...");
    
    // 检查 WebGPU 支持
    const webgpuSupported = typeof navigator !== "undefined" && "gpu" in navigator;
    console.log("[后端] WebGPU 浏览器支持:", webgpuSupported);
    
    // 检查 WebGL 支持
    const canvas = document.createElement("canvas");
    const webglSupported = !!(canvas.getContext("webgl2") || canvas.getContext("webgl"));
    console.log("[后端] WebGL 浏览器支持:", webglSupported);
    
    // 后端优先级：WebGPU > WebGL > WASM > CPU
    const backendPriority = ["webgpu", "webgl", "wasm", "cpu"];
    
    for (const backend of backendPriority) {
      try {
        // 快速检查浏览器支持（优化：提前跳过不支持的后端）
        if (backend === "webgpu" && !webgpuSupported) {
          console.log(`[后端] 跳过 ${backend}（浏览器不支持 WebGPU）`);
          continue;
        }
        
        if (backend === "webgl" && !webglSupported) {
          console.log(`[后端] 跳过 ${backend}（浏览器不支持 WebGL）`);
          continue;
        }
        
        console.log(`[后端] 尝试设置后端为: ${backend}`);
        
        // 尝试设置后端
        const backendAvailable = await tf.setBackend(backend);
        
        if (backendAvailable) {
          // 等待后端初始化
          await tf.ready();
          const currentBackend = tf.getBackend();
          
          if (currentBackend === backend) {
            const isHardware = backend === "webgpu" || backend === "webgl";
            console.log(`[后端] ✓ 成功设置后端为: ${backend}`);
            if (isHardware) {
              console.log(`[后端] ✓ 硬件加速已启用`);
            }
            return backend;
          } else {
            console.log(`[后端] ✗ 设置失败，实际后端为: ${currentBackend}`);
            // 如果设置失败，尝试重置并继续下一个
            try {
              await tf.removeBackend(backend);
            } catch (e) {
              // 忽略错误
            }
          }
        } else {
          console.log(`[后端] ✗ 后端 ${backend} 不可用`);
        }
      } catch (err) {
        console.warn(`[后端] ✗ 设置后端 ${backend} 时出错:`, err);
        // 继续尝试下一个后端
      }
    }
    
    // 如果所有后端都失败，使用默认后端
    const defaultBackend = tf.getBackend();
    console.warn(`[后端] 所有后端设置失败，使用默认后端: ${defaultBackend}`);
    return defaultBackend;
  };

  // 检测后端信息
  const detectBackend = () => {
    try {
      const backend = tf.getBackend();
      console.log("[后端] 当前后端:", backend);
      
      let isHardwareAccelerated = false;
      let details = "";

      // 检查后端类型
      if (backend === "webgl") {
        isHardwareAccelerated = true;
        const gl = (tf.backend() as any).getGPGPUContext()?.gl;
        if (gl) {
          const debugInfo = gl.getExtension("WEBGL_debug_renderer_info");
          const vendor = debugInfo
            ? gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL)
            : "未知";
          const renderer = debugInfo
            ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL)
            : "未知";
          details = `GPU: ${renderer} (${vendor})`;
          console.log("[后端] WebGL GPU信息:", { vendor, renderer });
        } else {
          details = "WebGL (GPU加速)";
        }
      } else if (backend === "webgpu") {
        isHardwareAccelerated = true;
        details = "WebGPU (GPU加速)";
      } else if (backend === "wasm") {
        isHardwareAccelerated = false;
        details = "WebAssembly (CPU执行)";
      } else if (backend === "cpu") {
        isHardwareAccelerated = false;
        details = "CPU (纯CPU执行)";
      } else {
        details = backend || "未知";
      }

      // 检查是否支持WebGPU
      const webgpuSupported = typeof navigator !== "undefined" && "gpu" in navigator;
      console.log("[后端] WebGPU支持:", webgpuSupported);

      // 检查WebGL信息
      const canvas = document.createElement("canvas");
      const gl = canvas.getContext("webgl2") || canvas.getContext("webgl");
      if (gl) {
        const debugInfo = gl.getExtension("WEBGL_debug_renderer_info");
        if (debugInfo) {
          const vendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);
          const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
          console.log("[后端] 系统GPU信息:", { vendor, renderer });
        }
      }

      const info = {
        backend,
        isHardwareAccelerated,
        details,
      };

      setBackendInfo(info);
      console.log("[后端] 后端信息:", info);

      // 关于NPU的说明
      console.log("[后端] 注意: TensorFlow.js在浏览器中主要通过WebGL/WebGPU使用GPU加速。");
      console.log("[后端] 移动设备的NPU通常不会直接暴露给Web API，但GPU加速可以提供类似的性能提升。");
      console.log("[后端] 如果使用WebGL后端，说明正在使用硬件加速（可能是GPU或NPU）。");

      return info;
    } catch (err) {
      console.error("[后端] 检测后端信息时出错:", err);
      return null;
    }
  };

  // 加载模型
  useEffect(() => {
    const loadModel = async () => {
      console.log("[模型] 开始加载模型...");
      
      try {
        // 第一步：设置后端（硬件加速优先）
        const selectedBackend = await setupBackend();
        if (selectedBackend) {
          console.log(`[模型] 已选择后端: ${selectedBackend}`);
        }
        
        // 第二步：检测并显示后端信息
        detectBackend();
        
        // 第三步：加载模型
        console.log("[模型] 开始加载 YOLOv8 模型...");
        const modelUrl = "/yolov8n-oiv7_web_model/model.json";
        
        // 使用 GraphModel 加载（模型格式为 graph-model）
        const loadedModel = await tf.loadGraphModel(modelUrl);
        console.log("[模型] 模型加载成功 (GraphModel)", loadedModel);
        console.log("[模型] 模型输入:", loadedModel.inputs);
        console.log("[模型] 模型输出:", loadedModel.outputs);
        console.log("[模型] 模型输入名称:", loadedModel.inputs.map((inp: any) => inp.name));
        console.log("[模型] 模型输出名称:", loadedModel.outputs.map((out: any) => out.name));
        setModel(loadedModel);
        console.log("[模型] 模型状态已更新");
        
        // 第四步：模型加载后再次确认后端信息
        const finalBackend = tf.getBackend();
        console.log("[模型] 模型加载后的后端:", finalBackend);
        
        // 更新后端信息显示
        detectBackend();
      } catch (err) {
        const errorMsg = "模型加载失败: " + (err as Error).message;
        console.error("[模型] 模型加载错误:", err);
        setError(errorMsg);
      }
    };
    loadModel();
  }, []);

  // 初始化摄像头
  const initCamera = async () => {
    console.log("[摄像头] 开始初始化摄像头...");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment",
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });
      console.log("[摄像头] 获取到媒体流", stream);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        console.log("[摄像头] 设置视频源");
        
        // 等待视频元数据加载完成，确保尺寸可用
        await new Promise<void>((resolve) => {
          const video = videoRef.current!;
          const onLoadedMetadata = () => {
            const width = video.videoWidth;
            const height = video.videoHeight;
            console.log("[摄像头] 视频元数据已加载，尺寸:", width, "x", height);
            video.removeEventListener("loadedmetadata", onLoadedMetadata);
            resolve();
          };
          
          // 如果元数据已经加载，立即解析
          if (video.readyState >= video.HAVE_METADATA && video.videoWidth > 0) {
            onLoadedMetadata();
          } else {
            video.addEventListener("loadedmetadata", onLoadedMetadata);
            // 设置超时，避免无限等待
            setTimeout(() => {
              if (video.readyState >= video.HAVE_METADATA) {
                onLoadedMetadata();
              } else {
                console.warn("[摄像头] 等待元数据超时，继续执行");
                video.removeEventListener("loadedmetadata", onLoadedMetadata);
                resolve();
              }
            }, 2000);
          }
        });
        
        await videoRef.current.play();
        console.log("[摄像头] 视频开始播放");
        
        // 再次确认视频尺寸
        const finalWidth = videoRef.current.videoWidth;
        const finalHeight = videoRef.current.videoHeight;
        console.log("[摄像头] 视频尺寸确认:", finalWidth, "x", finalHeight);
      } else {
        console.error("[摄像头] videoRef.current 为 null");
      }
    } catch (err) {
      const errorMsg = "无法访问摄像头: " + (err as Error).message;
      console.error("[摄像头] 摄像头错误:", err);
      setError(errorMsg);
    }
  };

  // YOLOv8 后处理函数
  const processYOLOv8Output = async (
    output: tf.Tensor,
    originalWidth: number,
    originalHeight: number,
    inputSize: number
  ): Promise<Detection[]> => {
    const data = await output.data();
    const shape = output.shape;
    
    console.log(`[后处理] 输出形状: [${shape.join(', ')}]`);
    
    // YOLOv8 输出格式可能是：
    // 1. [1, num_detections, num_classes + 4] - 标准格式
    // 2. [1, 4, num_detections] 和 [1, num_classes, num_detections] - 分离格式
    // 3. [1, num_detections, num_classes + 4] - 合并格式
    
    let detections: Detection[] = [];
    const scaleX = originalWidth / inputSize;
    const scaleY = originalHeight / inputSize;
    
    // 阈值
    const CONF_THRESHOLD = 0.25;
    const IOU_THRESHOLD = 0.45;
    const numClasses = CLASSES.length;
    
    // 根据输出形状判断格式
    if (shape.length === 3 && shape[0] === 1) {
      // YOLOv8 输出格式可能是：
      // 1. [1, features, num_detections] - 转置格式 (605, 8400)
      // 2. [1, num_detections, features] - 标准格式
      
      const dim1 = shape[1];
      const dim2 = shape[2];
      
      console.log(`[后处理] 维度1: ${dim1}, 维度2: ${dim2}`);
      
      // 判断格式：如果 dim1 接近 numClasses + 4，则是 [1, features, num_detections]
      // 如果 dim2 接近 numClasses + 4，则是 [1, num_detections, features]
      let numDetections: number;
      let features: number;
      let isTransposed: boolean;
      
      if (dim1 === numClasses + 4 || (dim1 > 100 && dim2 > 1000)) {
        // 格式: [1, features(605), num_detections(8400)]
        isTransposed = true;
        features = dim1;
        numDetections = dim2;
        console.log(`[后处理] 检测到转置格式: [1, ${features}, ${numDetections}]`);
      } else if (dim2 === numClasses + 4 || (dim2 > 100 && dim1 > 1000)) {
        // 格式: [1, num_detections, features]
        isTransposed = false;
        numDetections = dim1;
        features = dim2;
        console.log(`[后处理] 检测到标准格式: [1, ${numDetections}, ${features}]`);
      } else {
        console.warn(`[后处理] 无法确定格式，尝试标准格式`);
        isTransposed = false;
        numDetections = dim1;
        features = dim2;
      }
      
      if (features === numClasses + 4) {
        // 解析每个检测结果
        for (let i = 0; i < numDetections; i++) {
          let offset: number;
          
          if (isTransposed) {
            // 转置格式: data[feature_index * numDetections + detection_index]
            // bbox 在 data[0 * numDetections + i], data[1 * numDetections + i], ...
            const x = data[0 * numDetections + i];
            const y = data[1 * numDetections + i];
            const w = data[2 * numDetections + i];
            const h = data[3 * numDetections + i];
            
            // 调试：打印前几个检测框的原始值
            if (i < 3) {
              console.log(`[后处理] 检测框 ${i} 原始值: x=${x.toFixed(4)}, y=${y.toFixed(4)}, w=${w.toFixed(4)}, h=${h.toFixed(4)}`);
            }
            
            // YOLOv8 输出格式判断：
            // 如果值在 0-1 之间，是归一化的中心点格式
            // 如果值在 0-640 之间，是像素坐标的中心点格式
            let cx: number, cy: number, width: number, height: number;
            
            if (x < 1 && y < 1 && w < 1 && h < 1) {
              // 归一化格式: (cx, cy, w, h) 都在 0-1 之间
              cx = x * inputSize;
              cy = y * inputSize;
              width = w * inputSize;
              height = h * inputSize;
            } else if (x < inputSize && y < inputSize) {
              // 已经是像素坐标的中心点格式
              cx = x;
              cy = y;
              width = w;
              height = h;
            } else {
              // 可能是其他格式，尝试直接使用
              cx = x;
              cy = y;
              width = w;
              height = h;
            }
            
            // 转换为左上角坐标 (相对于输入尺寸 640x640)
            const x1 = cx - width / 2;
            const y1 = cy - height / 2;
            
            // 缩放到原始视频尺寸
            const scaledX1 = x1 * scaleX;
            const scaledY1 = y1 * scaleY;
            const scaledWidth = width * scaleX;
            const scaledHeight = height * scaleY;
            
            // 获取类别概率
            let maxScore = 0;
            let maxClassIndex = 0;
            
            for (let j = 0; j < numClasses; j++) {
              const score = data[(4 + j) * numDetections + i];
              if (score > maxScore) {
                maxScore = score;
                maxClassIndex = j;
              }
            }
            
            const confidence = maxScore;
            
            if (confidence >= CONF_THRESHOLD && scaledWidth > 0 && scaledHeight > 0 && 
                scaledX1 >= -scaledWidth && scaledY1 >= -scaledHeight &&
                scaledX1 < originalWidth && scaledY1 < originalHeight) {
              detections.push({
                bbox: [scaledX1, scaledY1, scaledWidth, scaledHeight],
                class: CLASSES[maxClassIndex],
                score: confidence,
              });
              
              if (detections.length <= 3) {
                console.log(`[后处理] 添加检测结果 ${detections.length}: ${CLASSES[maxClassIndex]} (${(confidence * 100).toFixed(1)}%) - bbox: [${scaledX1.toFixed(0)}, ${scaledY1.toFixed(0)}, ${scaledWidth.toFixed(0)}, ${scaledHeight.toFixed(0)}]`);
              }
            }
          } else {
            // 标准格式: [1, num_detections, features]
            offset = i * features;
            
            // 获取 bbox
            const x = data[offset];
            const y = data[offset + 1];
            const w = data[offset + 2];
            const h = data[offset + 3];
            
            // YOLOv8 输出通常是中心点格式 (cx, cy, w, h)，归一化到输入尺寸
            const cx = x * inputSize;
            const cy = y * inputSize;
            const width = w * inputSize;
            const height = h * inputSize;
            
            // 转换为左上角坐标
            const x1 = (cx - width / 2) * scaleX;
            const y1 = (cy - height / 2) * scaleY;
            const scaledWidth = width * scaleX;
            const scaledHeight = height * scaleY;
            
            // 获取类别概率
            let maxScore = 0;
            let maxClassIndex = 0;
            
            for (let j = 0; j < numClasses; j++) {
              const score = data[offset + 4 + j];
              if (score > maxScore) {
                maxScore = score;
                maxClassIndex = j;
              }
            }
            
            const confidence = maxScore;
            
            if (confidence >= CONF_THRESHOLD && scaledWidth > 0 && scaledHeight > 0) {
              detections.push({
                bbox: [x1, y1, scaledWidth, scaledHeight],
                class: CLASSES[maxClassIndex],
                score: confidence,
              });
            }
          }
        }
      } else {
        console.warn(`[后处理] 特征数不匹配: features=${features}, 期望 ${numClasses + 4}`);
      }
    } else {
      console.warn(`[后处理] 不支持的输出形状: [${shape.join(', ')}]`);
    }
    
    console.log(`[后处理] 解析到 ${detections.length} 个检测结果`);
    
    // 应用 NMS (非极大值抑制)
    const nmsDetections = applyNMS(detections, IOU_THRESHOLD);
    console.log(`[后处理] NMS 后剩余 ${nmsDetections.length} 个检测结果`);
    
    return nmsDetections;
  };

  // NMS (非极大值抑制) 实现
  const applyNMS = (detections: Detection[], iouThreshold: number): Detection[] => {
    // 按置信度排序
    const sorted = [...detections].sort((a, b) => b.score - a.score);
    const selected: Detection[] = [];
    
    while (sorted.length > 0) {
      const best = sorted.shift()!;
      selected.push(best);
      
      // 移除与当前最佳检测框 IoU 过高的检测
      for (let i = sorted.length - 1; i >= 0; i--) {
        const iou = calculateIOU(best.bbox, sorted[i].bbox);
        if (iou > iouThreshold) {
          sorted.splice(i, 1);
        }
      }
    }
    
    return selected;
  };

  // 计算 IoU (交并比)
  const calculateIOU = (box1: [number, number, number, number], box2: [number, number, number, number]): number => {
    const [x1_1, y1_1, w1, h1] = box1;
    const [x1_2, y1_2, w2, h2] = box2;
    
    const x2_1 = x1_1 + w1;
    const y2_1 = y1_1 + h1;
    const x2_2 = x1_2 + w2;
    const y2_2 = y1_2 + h2;
    
    const xi1 = Math.max(x1_1, x1_2);
    const yi1 = Math.max(y1_1, y1_2);
    const xi2 = Math.min(x2_1, x2_2);
    const yi2 = Math.min(y2_1, y2_2);
    
    const interArea = Math.max(0, xi2 - xi1) * Math.max(0, yi2 - yi1);
    const box1Area = w1 * h1;
    const box2Area = w2 * h2;
    const unionArea = box1Area + box2Area - interArea;
    
    return unionArea > 0 ? interArea / unionArea : 0;
  };

  // 绘制检测结果
  const drawDetections = (
    ctx: CanvasRenderingContext2D,
    detections: Detection[],
    videoWidth: number,
    videoHeight: number,
    canvasWidth: number,
    canvasHeight: number
  ) => {
    // 先清空画布
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    if (detections.length === 0) {
      console.log(`[绘制] 没有检测结果需要绘制`);
      return;
    }

    // 注意：bbox 已经是相对于原始视频尺寸的坐标，不需要再次缩放
    // 但 canvas 可能和视频尺寸不同，需要缩放
    const scaleX = canvasWidth / videoWidth;
    const scaleY = canvasHeight / videoHeight;

    // 降低绘制阈值，显示更多检测结果
    const DRAW_THRESHOLD = 0.25; // 与后处理阈值一致
    const validDetections = detections.filter(d => d.score >= DRAW_THRESHOLD);
    console.log(`[绘制] 检测到 ${detections.length} 个对象，有效对象 ${validDetections.length} 个 (阈值: ${DRAW_THRESHOLD})`);

    if (validDetections.length === 0) {
      console.log(`[绘制] 所有检测结果都被过滤掉了`);
      return;
    }

    validDetections.forEach((detection, index) => {
      const [x, y, width, height] = detection.bbox;
      
      // bbox 已经是相对于原始视频尺寸的坐标，需要缩放到 canvas 尺寸
      const scaledX = x * scaleX;
      const scaledY = y * scaleY;
      const scaledWidth = width * scaleX;
      const scaledHeight = height * scaleY;

      // 检查坐标是否有效
      if (isNaN(scaledX) || isNaN(scaledY) || isNaN(scaledWidth) || isNaN(scaledHeight)) {
        console.warn(`[绘制] 对象 ${index + 1} 坐标无效: [${scaledX}, ${scaledY}, ${scaledWidth}, ${scaledHeight}]`);
        return;
      }

      if (scaledWidth <= 0 || scaledHeight <= 0) {
        console.warn(`[绘制] 对象 ${index + 1} 尺寸无效: [${scaledWidth}, ${scaledHeight}]`);
        return;
      }

      console.log(`[绘制] 对象 ${index + 1}: ${detection.class} (${(detection.score * 100).toFixed(1)}%) - 位置: [${scaledX.toFixed(0)}, ${scaledY.toFixed(0)}, ${scaledWidth.toFixed(0)}, ${scaledHeight.toFixed(0)}]`);

      // 绘制绿色边框
      ctx.strokeStyle = "#00ff00";
      ctx.lineWidth = 3;
      ctx.strokeRect(scaledX, scaledY, scaledWidth, scaledHeight);

      // 绘制标签背景
      const label = detection.class;
      const labelText = `${label} ${(detection.score * 100).toFixed(1)}%`;
      ctx.font = "16px Arial";
      ctx.fillStyle = "#00ff00";
      const textMetrics = ctx.measureText(labelText);
      const textWidth = textMetrics.width;
      const textHeight = 20;

      // 标签背景
      ctx.fillRect(
        scaledX,
        scaledY - textHeight - 4,
        textWidth + 8,
        textHeight + 4
      );

      // 标签文字
      ctx.fillStyle = "#000000";
      ctx.fillText(labelText, scaledX + 4, scaledY - 6);
    });
    
    console.log(`[绘制] 绘制完成，已绘制 ${validDetections.length} 个检测结果`);
  };

  // 执行检测
  const detect = async () => {
    // 检查前置条件
    if (!videoRef.current) {
      console.warn("[检测] videoRef.current 为 null");
      return;
    }
    if (!canvasRef.current) {
      console.warn("[检测] canvasRef.current 为 null");
      return;
    }
    if (!model) {
      console.warn("[检测] model 为 null");
      return;
    }
    // 使用 ref 来检查检测状态，避免 React 状态更新的异步问题
    if (!isDetectingRef.current) {
      console.log("[检测] 检测已停止 (isDetectingRef.current = false)");
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      console.warn("[检测] 无法获取 canvas context");
      animationFrameRef.current = requestAnimationFrame(detect);
      return;
    }

    if (video.readyState !== video.HAVE_ENOUGH_DATA) {
      console.log(`[检测] 视频未准备好，readyState: ${video.readyState}`);
      animationFrameRef.current = requestAnimationFrame(detect);
      return;
    }

    // 获取视频尺寸，确保尺寸有效且稳定
    let videoWidth = video.videoWidth;
    let videoHeight = video.videoHeight;

    // 检查视频尺寸是否有效
    if (videoWidth === 0 || videoHeight === 0 || isNaN(videoWidth) || isNaN(videoHeight)) {
      console.warn(`[检测] 视频尺寸无效或未就绪: ${videoWidth}x${videoHeight}, readyState: ${video.readyState}`);
      // 等待视频元数据加载
      if (video.readyState < video.HAVE_METADATA) {
        console.log(`[检测] 等待视频元数据加载...`);
      }
      animationFrameRef.current = requestAnimationFrame(detect);
      return;
    }

    // 验证视频尺寸是否合理（至少应该大于 0）
    if (videoWidth < 10 || videoHeight < 10) {
      console.warn(`[检测] 视频尺寸异常小: ${videoWidth}x${videoHeight}，等待稳定...`);
      animationFrameRef.current = requestAnimationFrame(detect);
      return;
    }

    const startTime = performance.now();

    console.log(`[检测] 视频尺寸: ${videoWidth}x${videoHeight}`);

    // 只在尺寸变化时设置画布尺寸（避免清空画布）
    if (canvas.width !== videoWidth || canvas.height !== videoHeight) {
    canvas.width = videoWidth;
    canvas.height = videoHeight;
      console.log(`[检测] 画布尺寸设置为: ${canvas.width}x${canvas.height}`);
    }

    // 执行检测
    console.log("[检测] 开始执行模型检测...");
    
    // YOLOv8 预处理：调整图像大小并归一化
    const INPUT_SIZE = 640; // YOLOv8 标准输入尺寸
    const imageTensor = tf.browser.fromPixels(video);
    const resized = tf.image.resizeBilinear(imageTensor, [INPUT_SIZE, INPUT_SIZE]);
    const normalized = resized.div(255.0);
    const batched = normalized.expandDims(0);
    
    // 执行模型推理
    let predictions: tf.Tensor;
    if ('execute' in model) {
      // GraphModel 使用 execute 方法（同步，更快）
      const result = (model as tf.GraphModel).execute(batched) as tf.Tensor | tf.Tensor[];
      if (Array.isArray(result)) {
        predictions = result[0]; // 取第一个输出
        // 清理其他输出
        result.slice(1).forEach(t => t.dispose());
      } else {
        predictions = result;
      }
    } else {
      // LayersModel 使用 predict 方法
      predictions = await (model as any).predict(batched) as tf.Tensor;
    }
    
    console.log("[检测] 模型输出形状:", predictions.shape);
    
    // 清理中间张量
    imageTensor.dispose();
    resized.dispose();
    normalized.dispose();
    batched.dispose();
    
    // 后处理：解码检测结果
    const detections = await processYOLOv8Output(
      predictions,
      videoWidth,
      videoHeight,
      INPUT_SIZE
    );
    
    predictions.dispose();
    
    console.log(`[检测] 检测完成，检测到 ${detections.length} 个对象`);

    const endTime = performance.now();
    const detectionLatency = endTime - startTime;
    console.log(`[检测] 检测延迟: ${detectionLatency.toFixed(2)}ms`);
    setLatency(detectionLatency);

    // 绘制检测结果（在检测完成后立即绘制）
    drawDetections(ctx, detections, videoWidth, videoHeight, canvas.width, canvas.height);
    console.log(`[绘制] 绘制完成，已绘制 ${detections.length} 个检测结果`);

    // 计算 FPS
    frameCountRef.current++;
    const now = Date.now();
    if (now - fpsTimeRef.current >= 1000) {
      const currentFps = frameCountRef.current;
      console.log(`[FPS] 当前 FPS: ${currentFps}`);
      setFps(currentFps);
      frameCountRef.current = 0;
      fpsTimeRef.current = now;
    }

    // 使用 ref 来检查检测状态，继续下一帧检测
    if (isDetectingRef.current) {
      // 使用 requestAnimationFrame 继续检测循环
      animationFrameRef.current = requestAnimationFrame(detect);
    } else {
      console.log("[检测] 检测循环结束，不再继续");
    }
  };

  // 开始检测
  const startDetection = async () => {
    console.log("[开始检测] 按钮被点击");
    console.log("[开始检测] 模型状态:", model ? "已加载" : "未加载");
    console.log("[开始检测] 当前检测状态:", isDetecting);

    if (!model) {
      const errorMsg = "模型尚未加载完成";
      console.error("[开始检测]", errorMsg);
      setError(errorMsg);
      return;
    }

    if (!streamRef.current) {
      console.log("[开始检测] 摄像头未初始化，开始初始化...");
      await initCamera();
    } else {
      console.log("[开始检测] 摄像头已初始化");
    }

    console.log("[开始检测] 设置检测状态为 true");
    isDetectingRef.current = true; // 先设置 ref，确保同步可用
    setIsDetecting(true); // 更新 state 用于 UI 显示
    frameCountRef.current = 0;
    fpsTimeRef.current = Date.now();
    console.log("[开始检测] 开始检测循环，isDetectingRef.current =", isDetectingRef.current);
    detect();
  };

  // 停止检测
  const stopDetection = () => {
    console.log("[停止检测] 停止检测被调用");
    isDetectingRef.current = false; // 先设置 ref
    setIsDetecting(false); // 更新 state
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
      console.log("[停止检测] 动画帧已取消");
    }
  };

  // 清理资源
  useEffect(() => {
    return () => {
      stopDetection();
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  return (
    <div className="relative w-screen h-screen bg-black overflow-hidden" style={{ height: '100dvh', minHeight: '-webkit-fill-available' }}>
      {/* 视频和画布容器 */}
      <div className="relative w-full h-full">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="absolute top-0 left-0 w-full h-full object-cover"
        />
        <canvas
          ref={canvasRef}
          className="absolute top-0 left-0 w-full h-full pointer-events-none"
        />
      </div>

      {/* 控制面板 */}
      <div 
        className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-70 backdrop-blur-sm p-3 sm:p-4 border-t border-white border-opacity-10"
        style={{ 
          paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))',
          paddingTop: '0.75rem'
        }}
      >
        {/* 状态信息 */}
        <div className="flex flex-wrap justify-between items-center gap-2 sm:gap-3 mb-3 sm:mb-4 text-white">
          <div className="flex flex-wrap gap-x-3 sm:gap-x-4 gap-y-1 sm:gap-y-2 text-xs sm:text-sm">
            <div className="flex items-center gap-2">
              <span className="text-gray-400">FPS:</span>
              <span className="font-semibold">{fps}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-400">延迟:</span>
              <span className="font-semibold">{latency.toFixed(0)}ms</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-400">状态:</span>
              <span
                className={`font-semibold ${
                  model ? "text-green-400" : "text-yellow-400"
                }`}
              >
                {model ? "就绪" : "加载中..."}
              </span>
            </div>
            {backendInfo && (
              <div className="flex items-center gap-2">
                <span className="text-gray-400">后端:</span>
                <span
                  className={`font-semibold ${
                    backendInfo.isHardwareAccelerated
                      ? "text-green-400"
                      : "text-yellow-400"
                  }`}
                  title={backendInfo.details}
                >
                  {backendInfo.backend}
                  {backendInfo.isHardwareAccelerated && " ⚡"}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* 后端详细信息 */}
        {backendInfo && (
          <div className="mb-2 sm:mb-3 p-2 bg-black bg-opacity-50 rounded text-xs text-gray-300">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-gray-400">硬件加速:</span>
              <span
                className={`font-semibold ${
                  backendInfo.isHardwareAccelerated
                    ? "text-green-400"
                    : "text-yellow-400"
                }`}
              >
                {backendInfo.isHardwareAccelerated ? "是" : "否"}
              </span>
            </div>
            <div className="text-gray-400 text-xs">
              {backendInfo.details}
            </div>
            {backendInfo.isHardwareAccelerated && (
              <div className="text-gray-400 text-xs mt-1">
                注意: 在移动设备上，WebGL/WebGPU 可能使用 GPU 或 NPU 进行加速
              </div>
            )}
          </div>
        )}

        {/* 错误信息 */}
        {error && (
          <div className="mb-3 sm:mb-4 p-2 sm:p-3 bg-red-500 bg-opacity-90 text-white text-xs sm:text-sm rounded-lg border border-red-400 border-opacity-50">
            {error}
          </div>
        )}

        {/* 控制按钮 */}
        <div className="flex gap-2 sm:gap-3">
          <button
            onClick={startDetection}
            disabled={isDetecting || !model}
            className={`flex-1 py-2.5 sm:py-3 px-4 sm:px-6 rounded-lg font-semibold text-sm sm:text-base text-white transition-all duration-200 touch-manipulation ${
              isDetecting || !model
                ? "bg-gray-500 bg-opacity-50 cursor-not-allowed opacity-50"
                : "bg-green-500 hover:bg-green-600 active:bg-green-700 active:scale-95 shadow-lg"
            }`}
          >
            开始检测
          </button>
          <button
            onClick={stopDetection}
            disabled={!isDetecting}
            className={`flex-1 py-2.5 sm:py-3 px-4 sm:px-6 rounded-lg font-semibold text-sm sm:text-base text-white transition-all duration-200 touch-manipulation ${
              !isDetecting
                ? "bg-gray-500 bg-opacity-50 cursor-not-allowed opacity-50"
                : "bg-red-500 hover:bg-red-600 active:bg-red-700 active:scale-95 shadow-lg"
            }`}
          >
            停止检测
          </button>
        </div>
      </div>
    </div>
  );
}
