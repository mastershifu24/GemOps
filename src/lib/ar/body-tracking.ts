import type { ProductType } from "@/types/database";
import { getIosMajorVersion } from "@/lib/ar/capabilities";

const WASM_CDN =
  typeof window !== "undefined"
    ? `${window.location.origin}/mediapipe/wasm`
    : "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.35/wasm";

const WASM_CDN_FALLBACK =
  "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.35/wasm";

const HAND_MODEL =
  "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task";

const POSE_MODEL =
  "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task";

export interface ArOverlayTransform {
  /** Viewport pixels */
  x: number;
  y: number;
  /** Uniform scale for ring diameter */
  scale: number;
  /** Degrees */
  rotation: number;
  /** Ellipse squash for wrist perspective */
  scaleX: number;
  scaleY: number;
  confidence: number;
}

export type ArTrackingMode = "hand" | "pose" | "none";

export interface ArTrackingConfig {
  productType: ProductType;
  mirrorX: boolean;
}

type Landmark = { x: number; y: number; z?: number; visibility?: number };

function dist(
  a: { x: number; y: number },
  b: { x: number; y: number }
): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function midpoint(
  a: { x: number; y: number },
  b: { x: number; y: number }
): { x: number; y: number } {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}

/** Map normalized landmark coords → viewport pixels (object-cover video). */
export function landmarkToViewport(
  landmark: { x: number; y: number },
  video: HTMLVideoElement,
  viewportWidth: number,
  viewportHeight: number,
  mirrorX: boolean
): { x: number; y: number } {
  const nx = mirrorX ? 1 - landmark.x : landmark.x;
  const ny = landmark.y;

  const vw = video.videoWidth || viewportWidth;
  const vh = video.videoHeight || viewportHeight;
  if (!vw || !vh) {
    return { x: nx * viewportWidth, y: ny * viewportHeight };
  }

  const videoAspect = vw / vh;
  const screenAspect = viewportWidth / viewportHeight;

  if (videoAspect > screenAspect) {
    const scale = viewportHeight / vh;
    const renderedW = vw * scale;
    const offsetX = (viewportWidth - renderedW) / 2;
    return { x: nx * renderedW + offsetX, y: ny * viewportHeight };
  }

  const scale = viewportWidth / vw;
  const renderedH = vh * scale;
  const offsetY = (viewportHeight - renderedH) / 2;
  return { x: nx * viewportWidth, y: ny * renderedH + offsetY };
}

type HandLandmarkerInstance = {
  detectForVideo: (
    video: HTMLVideoElement,
    timestamp: number
  ) => { landmarks?: { x: number; y: number; z?: number }[][] };
  close: () => void;
};

type PoseLandmarkerInstance = {
  detectForVideo: (
    video: HTMLVideoElement,
    timestamp: number
  ) => { landmarks?: { x: number; y: number; z?: number }[][] };
  close: () => void;
};

let handLandmarkerPromise: Promise<HandLandmarkerInstance | null> | null =
  null;
let poseLandmarkerPromise: Promise<PoseLandmarkerInstance | null> | null = null;

type VisionDelegate = "GPU" | "CPU";

function visionDelegates(): VisionDelegate[] {
  const ios = getIosMajorVersion();
  // iOS Safari GPU WebGL for MediaPipe is flaky — prefer CPU first
  if (ios !== null) return ["CPU", "GPU"];
  return ["GPU", "CPU"];
}

async function resolveVisionWasm(): Promise<string> {
  if (typeof window === "undefined") return WASM_CDN_FALLBACK;
  try {
    const probe = await fetch(`${WASM_CDN}/vision_wasm_internal.js`, {
      method: "HEAD",
    });
    if (probe.ok) return WASM_CDN;
  } catch {
    // same-origin wasm not deployed — CDN fallback
  }
  return WASM_CDN_FALLBACK;
}

async function createWithDelegate<T>(
  delegates: VisionDelegate[],
  create: (delegate: VisionDelegate) => Promise<T>
): Promise<T | null> {
  for (const delegate of delegates) {
    try {
      return await create(delegate);
    } catch (err) {
      console.warn(`[AR] ${delegate} delegate failed:`, err);
    }
  }
  return null;
}

async function loadHandLandmarker(): Promise<HandLandmarkerInstance | null> {
  if (typeof window === "undefined") return null;
  try {
    const { FilesetResolver, HandLandmarker } = await import(
      "@mediapipe/tasks-vision"
    );
    const wasmBase = await resolveVisionWasm();
    const vision = await FilesetResolver.forVisionTasks(wasmBase);
    return createWithDelegate(visionDelegates(), (delegate) =>
      HandLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: HAND_MODEL,
          delegate,
        },
        runningMode: "VIDEO",
        numHands: 2,
        minHandDetectionConfidence: 0.25,
        minHandPresenceConfidence: 0.25,
        minTrackingConfidence: 0.25,
      })
    );
  } catch (err) {
    console.error("[AR] Hand landmarker load failed:", err);
    return null;
  }
}

async function loadPoseLandmarker(): Promise<PoseLandmarkerInstance | null> {
  if (typeof window === "undefined") return null;
  try {
    const { FilesetResolver, PoseLandmarker } = await import(
      "@mediapipe/tasks-vision"
    );
    const wasmBase = await resolveVisionWasm();
    const vision = await FilesetResolver.forVisionTasks(wasmBase);
    return createWithDelegate(visionDelegates(), (delegate) =>
      PoseLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: POSE_MODEL,
          delegate,
        },
        runningMode: "VIDEO",
        numPoses: 1,
        minPoseDetectionConfidence: 0.35,
        minPosePresenceConfidence: 0.35,
        minTrackingConfidence: 0.35,
      })
    );
  } catch (err) {
    console.error("[AR] Pose landmarker load failed:", err);
    return null;
  }
}

export function getHandLandmarker(): Promise<HandLandmarkerInstance | null> {
  if (!handLandmarkerPromise) {
    handLandmarkerPromise = loadHandLandmarker().then((instance) => {
      if (!instance) handLandmarkerPromise = null;
      return instance;
    });
  }
  return handLandmarkerPromise;
}

export function getPoseLandmarker(): Promise<PoseLandmarkerInstance | null> {
  if (!poseLandmarkerPromise) {
    poseLandmarkerPromise = loadPoseLandmarker().then((instance) => {
      if (!instance) poseLandmarkerPromise = null;
      return instance;
    });
  }
  return poseLandmarkerPromise;
}

export async function arModelsAvailable(): Promise<{
  hand: boolean;
  pose: boolean;
}> {
  const [hand, pose] = await Promise.all([
    getHandLandmarker(),
    getPoseLandmarker(),
  ]);
  return { hand: hand !== null, pose: pose !== null };
}

function transformFromHand(
  landmarks: Landmark[],
  video: HTMLVideoElement,
  viewportWidth: number,
  viewportHeight: number,
  mirrorX: boolean
): ArOverlayTransform | null {
  if (landmarks.length < 18) return null;

  const wrist = landmarks[0];
  const indexMcp = landmarks[5];
  const middleMcp = landmarks[9];
  const ringMcp = landmarks[13];
  const pinkyMcp = landmarks[17];

  // Center on wrist joint (between wrist knuckle and palm)
  const wristCenter = {
    x: wrist.x * 0.55 + middleMcp.x * 0.45,
    y: wrist.y * 0.55 + middleMcp.y * 0.45,
  };

  const center = landmarkToViewport(
    wristCenter,
    video,
    viewportWidth,
    viewportHeight,
    mirrorX
  );

  const wristNorm = { x: wrist.x, y: wrist.y };
  const handWidth = dist(indexMcp, pinkyMcp);
  const palmSpread =
    (dist(wristNorm, indexMcp) +
      dist(wristNorm, middleMcp) +
      dist(wristNorm, ringMcp) +
      dist(wristNorm, pinkyMcp)) /
    4;
  const wristSpan = Math.max(handWidth, palmSpread * 1.6);

  const baseSize = Math.min(viewportWidth, viewportHeight);
  const scale = Math.max(
    baseSize * 0.18,
    Math.min(baseSize * 0.55, wristSpan * baseSize * 2.6)
  );

  const rotation =
    (Math.atan2(middleMcp.y - wrist.y, middleMcp.x - wrist.x) * 180) /
    Math.PI;

  const forearmTilt = Math.abs(middleMcp.z ?? 0);
  const scaleX = Math.max(0.55, 1 - forearmTilt * 0.8);
  const scaleY = 1;

  return {
    x: center.x,
    y: center.y,
    scale,
    rotation: mirrorX ? -rotation : rotation,
    scaleX,
    scaleY,
    confidence: 0.9,
  };
}

function transformFromPoseNeck(
  landmarks: Landmark[],
  video: HTMLVideoElement,
  viewportWidth: number,
  viewportHeight: number,
  mirrorX: boolean
): ArOverlayTransform | null {
  if (landmarks.length < 13) return null;

  const nose = landmarks[0];
  const leftShoulder = landmarks[11];
  const rightShoulder = landmarks[12];

  const shoulderMid = midpoint(leftShoulder, rightShoulder);
  const neckNorm = {
    x: shoulderMid.x,
    y: shoulderMid.y + Math.abs(nose.y - shoulderMid.y) * 0.15,
  };

  const center = landmarkToViewport(
    neckNorm,
    video,
    viewportWidth,
    viewportHeight,
    mirrorX
  );

  const shoulderWidthNorm = dist(leftShoulder, rightShoulder);
  const baseSize = Math.min(viewportWidth, viewportHeight);
  const scale = Math.max(
    baseSize * 0.35,
    Math.min(baseSize * 0.95, shoulderWidthNorm * baseSize * 2.4)
  );

  const rotation =
    (Math.atan2(
      rightShoulder.y - leftShoulder.y,
      rightShoulder.x - leftShoulder.x
    ) *
      180) /
    Math.PI;

  return {
    x: center.x,
    y: center.y,
    scale,
    rotation: mirrorX ? -rotation : rotation,
    scaleX: 1.1,
    scaleY: 0.75,
    confidence: 0.85,
  };
}

function transformFromPoseAnkle(
  landmarks: Landmark[],
  video: HTMLVideoElement,
  viewportWidth: number,
  viewportHeight: number,
  mirrorX: boolean
): ArOverlayTransform | null {
  if (landmarks.length < 29) return null;

  const leftAnkle = landmarks[27];
  const rightAnkle = landmarks[28];
  const leftKnee = landmarks[25];
  const rightKnee = landmarks[26];

  const ankle = leftAnkle.y > rightAnkle.y ? leftAnkle : rightAnkle;
  const knee = leftAnkle.y > rightAnkle.y ? leftKnee : rightKnee;

  const center = landmarkToViewport(
    ankle,
    video,
    viewportWidth,
    viewportHeight,
    mirrorX
  );

  const legLen = dist(ankle, knee);
  const baseSize = Math.min(viewportWidth, viewportHeight);
  const scale = Math.max(
    baseSize * 0.2,
    Math.min(baseSize * 0.55, legLen * baseSize * 2.8)
  );

  const rotation =
    (Math.atan2(knee.y - ankle.y, knee.x - ankle.x) * 180) / Math.PI + 90;

  return {
    x: center.x,
    y: center.y,
    scale,
    rotation: mirrorX ? -rotation : rotation,
    scaleX: 0.9,
    scaleY: 1,
    confidence: 0.75,
  };
}

function transformFromPoseWrist(
  landmarks: Landmark[],
  video: HTMLVideoElement,
  viewportWidth: number,
  viewportHeight: number,
  mirrorX: boolean
): ArOverlayTransform | null {
  if (landmarks.length < 17) return null;

  const leftWrist = landmarks[15];
  const rightWrist = landmarks[16];
  const leftElbow = landmarks[13];
  const rightElbow = landmarks[14];

  const useLeft =
    (leftWrist.visibility ?? 1) >= (rightWrist.visibility ?? 1);
  const wrist = useLeft ? leftWrist : rightWrist;
  const elbow = useLeft ? leftElbow : rightElbow;

  const center = landmarkToViewport(
    wrist,
    video,
    viewportWidth,
    viewportHeight,
    mirrorX
  );

  const forearm = dist(wrist, elbow);
  const baseSize = Math.min(viewportWidth, viewportHeight);
  const scale = Math.max(
    baseSize * 0.18,
    Math.min(baseSize * 0.5, forearm * baseSize * 3.5)
  );

  const rotation =
    (Math.atan2(elbow.y - wrist.y, elbow.x - wrist.x) * 180) / Math.PI + 90;

  return {
    x: center.x,
    y: center.y,
    scale,
    rotation: mirrorX ? -rotation : rotation,
    scaleX: 0.85,
    scaleY: 1,
    confidence: 0.8,
  };
}

export function pickTrackingMode(productType: ProductType): ArTrackingMode {
  if (productType === "necklace" || productType === "dog_collar") {
    return "pose";
  }
  if (productType === "anklet") {
    return "pose";
  }
  return "hand";
}

export async function detectArTransform(
  video: HTMLVideoElement,
  timestamp: number,
  config: ArTrackingConfig,
  viewportWidth: number,
  viewportHeight: number
): Promise<ArOverlayTransform | null> {
  const { productType, mirrorX } = config;
  const mode = pickTrackingMode(productType);

  const hand = await getHandLandmarker();
  if (mode === "hand" && hand) {
    const result = hand.detectForVideo(video, timestamp);
    for (const lm of result.landmarks ?? []) {
      if (!lm.length) continue;
      const t = transformFromHand(
        lm,
        video,
        viewportWidth,
        viewportHeight,
        mirrorX
      );
      if (t) return t;
    }
  }

  const pose = await getPoseLandmarker();
  if (!pose) return null;

  const result = pose.detectForVideo(video, timestamp);
  const lm = result.landmarks?.[0];
  if (!lm?.length) {
    if (mode === "hand" && hand) {
      const handResult = hand.detectForVideo(video, timestamp);
      for (const hlm of handResult.landmarks ?? []) {
        if (!hlm.length) continue;
        const t = transformFromHand(
          hlm,
          video,
          viewportWidth,
          viewportHeight,
          mirrorX
        );
        if (t) return t;
      }
    }
    return null;
  }

  if (productType === "necklace" || productType === "dog_collar") {
    return transformFromPoseNeck(
      lm,
      video,
      viewportWidth,
      viewportHeight,
      mirrorX
    );
  }

  if (productType === "anklet") {
    return (
      transformFromPoseAnkle(
        lm,
        video,
        viewportWidth,
        viewportHeight,
        mirrorX
      ) ??
      transformFromPoseWrist(
        lm,
        video,
        viewportWidth,
        viewportHeight,
        mirrorX
      )
    );
  }

  if (hand) {
    const handResult = hand.detectForVideo(video, timestamp);
    for (const hlm of handResult.landmarks ?? []) {
      if (!hlm.length) continue;
      const t = transformFromHand(
        hlm,
        video,
        viewportWidth,
        viewportHeight,
        mirrorX
      );
      if (t) return t;
    }
  }

  return transformFromPoseWrist(
    lm,
    video,
    viewportWidth,
    viewportHeight,
    mirrorX
  );
}
