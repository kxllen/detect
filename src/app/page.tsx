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
  const [model, setModel] = useState<cocoSsd.ObjectDetection | null>(null);
  const [fps, setFps] = useState(0);
  const [latency, setLatency] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);
  const frameCountRef = useRef<number>(0);
  const fpsTimeRef = useRef<number>(Date.now());

  // 加载模型
  useEffect(() => {
    const loadModel = async () => {
      try {
        const loadedModel = await cocoSsd.load();
        setModel(loadedModel);
      } catch (err) {
        setError("模型加载失败: " + (err as Error).message);
        console.error("模型加载错误:", err);
      }
    };
    loadModel();
  }, []);

  // 初始化摄像头
  const initCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment", // 使用后置摄像头
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        await videoRef.current.play();
      }
    } catch (err) {
      setError("无法访问摄像头: " + (err as Error).message);
      console.error("摄像头错误:", err);
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

    detections.forEach((detection) => {
      if (detection.score < 0.6) return;

      const [x, y, width, height] = detection.bbox;
      const scaledX = x * scaleX;
      const scaledY = y * scaleY;
      const scaledWidth = width * scaleX;
      const scaledHeight = height * scaleY;

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
    if (!videoRef.current || !canvasRef.current || !model || !isDetecting) {
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    if (!ctx || video.readyState !== video.HAVE_ENOUGH_DATA) {
      animationFrameRef.current = requestAnimationFrame(detect);
      return;
    }

    const startTime = performance.now();

    // 获取视频尺寸
    const videoWidth = video.videoWidth;
    const videoHeight = video.videoHeight;

    // 设置画布尺寸
    canvas.width = videoWidth;
    canvas.height = videoHeight;

    // 执行检测
    const predictions = await model.detect(video);

    const endTime = performance.now();
    const detectionLatency = endTime - startTime;
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
      setFps(frameCountRef.current);
      frameCountRef.current = 0;
      fpsTimeRef.current = now;
    }

    if (isDetecting) {
      animationFrameRef.current = requestAnimationFrame(detect);
    }
  };

  // 开始检测
  const startDetection = async () => {
    if (!model) {
      setError("模型尚未加载完成");
      return;
    }

    if (!streamRef.current) {
      await initCamera();
    }

    setIsDetecting(true);
    frameCountRef.current = 0;
    fpsTimeRef.current = Date.now();
    detect();
  };

  // 停止检测
  const stopDetection = () => {
    setIsDetecting(false);
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
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
    <div className="relative w-screen h-screen bg-black overflow-hidden">
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
      <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-70 p-4">
        {/* 状态信息 */}
        <div className="flex justify-between items-center mb-4 text-white">
          <div className="flex gap-4 text-sm">
            <div>
              <span className="text-gray-400">FPS: </span>
              <span className="font-bold">{fps}</span>
            </div>
            <div>
              <span className="text-gray-400">延迟: </span>
              <span className="font-bold">{latency.toFixed(0)}ms</span>
            </div>
            <div>
              <span className="text-gray-400">状态: </span>
              <span className={model ? "text-green-400" : "text-yellow-400"}>
                {model ? "就绪" : "加载中..."}
              </span>
            </div>
          </div>
        </div>

        {/* 错误信息 */}
        {error && (
          <div className="mb-4 p-2 bg-red-500 text-white text-sm rounded">
            {error}
          </div>
        )}

        {/* 控制按钮 */}
        <div className="flex gap-4">
          <button
            onClick={startDetection}
            disabled={isDetecting || !model}
            className={`flex-1 py-3 px-6 rounded-lg font-semibold text-white transition-all ${
              isDetecting || !model
                ? "bg-gray-500 cursor-not-allowed"
                : "bg-green-500 hover:bg-green-600 active:bg-green-700"
            }`}
          >
            开始检测
          </button>
          <button
            onClick={stopDetection}
            disabled={!isDetecting}
            className={`flex-1 py-3 px-6 rounded-lg font-semibold text-white transition-all ${
              !isDetecting
                ? "bg-gray-500 cursor-not-allowed"
                : "bg-red-500 hover:bg-red-600 active:bg-red-700"
            }`}
          >
            停止检测
          </button>
        </div>
      </div>
    </div>
  );
}
