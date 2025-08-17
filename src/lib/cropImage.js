export async function cropImage(imageSrc, cropPixels) {
  const image = await loadImage(imageSrc);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  const { x, y, width, height } = cropPixels;

  canvas.width = width;
  canvas.height = height;
  ctx.drawImage(image, x, y, width, height, 0, 0, width, height);

  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), "image/jpeg", 0.92);
  });
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src; // 파일은 ObjectURL이라 CORS 이슈 없음
  });
}
