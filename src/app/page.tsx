"use client";

import { useEffect, useRef, useState } from "react";
import * as cocoSsd from "@tensorflow-models/coco-ssd";
import "@tensorflow/tfjs";

interface Detection {
  bbox: [number, number, number, number];
  class: string;
  score: number;
}

// COCO-SSD 类别中文映射
const classLabels: { [key: string]: string } = {
  person: "人",
  bicycle: "自行车",
  car: "汽车",
  motorcycle: "摩托车",
  airplane: "飞机",
  bus: "公交车",
  train: "火车",
  truck: "卡车",
  boat: "船",
  traffic_light: "交通灯",
  fire_hydrant: "消防栓",
  stop_sign: "停止标志",
  parking_meter: "停车计时器",
  bench: "长椅",
  bird: "鸟",
  cat: "猫",
  dog: "狗",
  horse: "马",
  sheep: "羊",
  cow: "牛",
  elephant: "大象",
  bear: "熊",
  zebra: "斑马",
  giraffe: "长颈鹿",
  backpack: "背包",
  umbrella: "雨伞",
  handbag: "手提包",
  tie: "领带",
  suitcase: "行李箱",
  frisbee: "飞盘",
  skis: "滑雪板",
  snowboard: "滑雪板",
  sports_ball: "运动球",
  kite: "风筝",
  baseball_bat: "棒球棒",
  baseball_glove: "棒球手套",
  skateboard: "滑板",
  surfboard: "冲浪板",
  tennis_racket: "网球拍",
  bottle: "瓶子",
  wine_glass: "酒杯",
  cup: "杯子",
  fork: "叉子",
  knife: "刀",
  spoon: "勺子",
  bowl: "碗",
  banana: "香蕉",
  apple: "苹果",
  sandwich: "三明治",
  orange: "橙子",
  broccoli: "西兰花",
  carrot: "胡萝卜",
  hot_dog: "热狗",
  pizza: "披萨",
  donut: "甜甜圈",
  cake: "蛋糕",
  chair: "椅子",
  couch: "沙发",
  potted_plant: "盆栽",
  bed: "床",
  dining_table: "餐桌",
  toilet: "马桶",
  tv: "电视",
  laptop: "笔记本电脑",
  mouse: "鼠标",
  remote: "遥控器",
  keyboard: "键盘",
  cell_phone: "手机",
  microwave: "微波炉",
  oven: "烤箱",
  toaster: "烤面包机",
  sink: "水槽",
  refrigerator: "冰箱",
  book: "书",
  clock: "时钟",
  vase: "花瓶",
  scissors: "剪刀",
  teddy_bear: "泰迪熊",
  hair_drier: "吹风机",
  toothbrush: "牙刷",
};

export default function Home() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const isDetectingRef = useRef<boolean>(false); // 使用 ref 来同步跟踪检测状态
  const [model, setModel] = useState<cocoSsd.ObjectDetection | null>(null);
  const [fps, setFps] = useState(0);
  const [latency, setLatency] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const frameCountRef = useRef<number>(0);
  const fpsTimeRef = useRef<number>(Date.now());

  // 加载模型
  useEffect(() => {
    const loadModel = async () => {
      console.log("[模型] 开始加载模型...");
      try {
        const loadedModel = await cocoSsd.load();
        console.log("[模型] 模型加载成功", loadedModel);
        setModel(loadedModel);
        console.log("[模型] 模型状态已更新");
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
        await videoRef.current.play();
        console.log("[摄像头] 视频开始播放");
        console.log("[摄像头] 视频尺寸:", videoRef.current.videoWidth, "x", videoRef.current.videoHeight);
      } else {
        console.error("[摄像头] videoRef.current 为 null");
      }
    } catch (err) {
      const errorMsg = "无法访问摄像头: " + (err as Error).message;
      console.error("[摄像头] 摄像头错误:", err);
      setError(errorMsg);
    }
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
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    const scaleX = canvasWidth / videoWidth;
    const scaleY = canvasHeight / videoHeight;

    const validDetections = detections.filter(d => d.score >= 0.6);
    console.log(`[绘制] 检测到 ${detections.length} 个对象，有效对象 ${validDetections.length} 个`);

    validDetections.forEach((detection, index) => {
      const [x, y, width, height] = detection.bbox;
      const scaledX = x * scaleX;
      const scaledY = y * scaleY;
      const scaledWidth = width * scaleX;
      const scaledHeight = height * scaleY;

      console.log(`[绘制] 对象 ${index + 1}: ${detection.class} (${(detection.score * 100).toFixed(1)}%) - 位置: [${x.toFixed(0)}, ${y.toFixed(0)}, ${width.toFixed(0)}, ${height.toFixed(0)}]`);

      // 绘制绿色边框
      ctx.strokeStyle = "#00ff00";
      ctx.lineWidth = 3;
      ctx.strokeRect(scaledX, scaledY, scaledWidth, scaledHeight);

      // 绘制标签背景
      const label = classLabels[detection.class] || detection.class;
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

    const startTime = performance.now();

    // 获取视频尺寸
    const videoWidth = video.videoWidth;
    const videoHeight = video.videoHeight;

    if (videoWidth === 0 || videoHeight === 0) {
      console.warn(`[检测] 视频尺寸无效: ${videoWidth}x${videoHeight}`);
      animationFrameRef.current = requestAnimationFrame(detect);
      return;
    }

    // 设置画布尺寸
    canvas.width = videoWidth;
    canvas.height = videoHeight;
    console.log(`[检测] 画布尺寸设置为: ${canvas.width}x${canvas.height}`);

    // 执行检测
    console.log("[检测] 开始执行模型检测...");
    const predictions = await model.detect(video);
    console.log(`[检测] 检测完成，检测到 ${predictions.length} 个对象`);

    const endTime = performance.now();
    const detectionLatency = endTime - startTime;
    console.log(`[检测] 检测延迟: ${detectionLatency.toFixed(2)}ms`);
    setLatency(detectionLatency);

    // 转换检测结果格式
    const detections: Detection[] = predictions.map((pred) => ({
      bbox: pred.bbox as [number, number, number, number],
      class: pred.class,
      score: pred.score,
    }));

    // 绘制检测结果
    drawDetections(ctx, detections, videoWidth, videoHeight, canvas.width, canvas.height);

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

    // 使用 ref 来检查检测状态
    if (isDetectingRef.current) {
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
          </div>
        </div>

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
