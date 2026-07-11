/** Capture camera frame + ring placement for fit confirmation. */
export async function captureTryOnSnapshot(input: {
  video: HTMLVideoElement;
  mirrorX: boolean;
  viewportWidth: number;
  viewportHeight: number;
  centerX: number;
  centerY: number;
  ringDiameterPx: number;
}): Promise<string | null> {
  const {
    video,
    mirrorX,
    viewportWidth,
    viewportHeight,
    centerX,
    centerY,
    ringDiameterPx,
  } = input;

  if (video.videoWidth <= 0 || video.videoHeight <= 0) return null;

  const canvas = document.createElement("canvas");
  canvas.width = viewportWidth;
  canvas.height = viewportHeight;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  const vw = video.videoWidth;
  const vh = video.videoHeight;
  const videoAspect = vw / vh;
  const screenAspect = viewportWidth / viewportHeight;

  ctx.save();
  if (mirrorX) {
    ctx.translate(viewportWidth, 0);
    ctx.scale(-1, 1);
  }

  if (videoAspect > screenAspect) {
    const scale = viewportHeight / vh;
    const renderedW = vw * scale;
    const offsetX = (viewportWidth - renderedW) / 2;
    ctx.drawImage(video, offsetX, 0, renderedW, viewportHeight);
  } else {
    const scale = viewportWidth / vw;
    const renderedH = vh * scale;
    const offsetY = (viewportHeight - renderedH) / 2;
    ctx.drawImage(video, 0, offsetY, viewportWidth, renderedH);
  }
  ctx.restore();

  const radius = Math.max(24, ringDiameterPx / 2);
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
  ctx.strokeStyle = "rgba(201, 169, 98, 0.95)";
  ctx.lineWidth = 4;
  ctx.shadowColor = "rgba(201, 169, 98, 0.6)";
  ctx.shadowBlur = 16;
  ctx.stroke();

  try {
    return canvas.toDataURL("image/jpeg", 0.82);
  } catch {
    return null;
  }
}
