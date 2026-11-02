// 4.6: shrink a photo in the browser and return base64 JPEG data for /api/treatment-photos.
export const ACCEPTED_PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"];

function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(",")[1] || "");
    reader.onerror = () => reject(new Error("Không đọc được ảnh."));
    reader.readAsDataURL(blob);
  });
}

export async function imageFileToUpload(file, maxSide = 1280, quality = 0.82) {
  if (!file || !ACCEPTED_PHOTO_TYPES.includes(file.type)) {
    throw new Error("Chỉ chọn ảnh JPEG, PNG hoặc WebP.");
  }
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  canvas.getContext("2d").drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  if (typeof bitmap.close === "function") bitmap.close();
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
  if (!blob) throw new Error("Không xử lý được ảnh.");
  return { contentType: "image/jpeg", data: await blobToBase64(blob) };
}
