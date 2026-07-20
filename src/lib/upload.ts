import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { nanoid } from "nanoid";

/**
 * Persist an uploaded image. Uses Cloudinary when configured, otherwise saves
 * to /public/uploads (works out of the box locally; on Vercel switch to
 * Cloudinary or Vercel Blob by setting the env vars).
 */
export async function saveImage(file: File): Promise<{ url: string; width?: number; height?: number }> {
  const buffer = Buffer.from(await file.arrayBuffer());

  if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
    return uploadToCloudinary(buffer, file.type);
  }

  const ext = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "");
  const name = `${nanoid(16)}.${ext}`;
  const dir = path.join(process.cwd(), "public", "uploads");
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, name), buffer);
  return { url: `/uploads/${name}` };
}

async function uploadToCloudinary(buffer: Buffer, mime: string): Promise<{ url: string; width?: number; height?: number }> {
  const cloud = process.env.CLOUDINARY_CLOUD_NAME!;
  const apiKey = process.env.CLOUDINARY_API_KEY!;
  const apiSecret = process.env.CLOUDINARY_API_SECRET!;
  const timestamp = Math.floor(Date.now() / 1000);

  // Signed upload
  const { createHash } = await import("crypto");
  const signature = createHash("sha1").update(`timestamp=${timestamp}${apiSecret}`).digest("hex");

  const form = new FormData();
  form.append("file", new Blob([new Uint8Array(buffer)], { type: mime }));
  form.append("api_key", apiKey);
  form.append("timestamp", String(timestamp));
  form.append("signature", signature);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloud}/image/upload`, { method: "POST", body: form });
  if (!res.ok) throw new Error("Cloudinary upload failed");
  const data = (await res.json()) as { secure_url: string; width: number; height: number };
  return { url: data.secure_url, width: data.width, height: data.height };
}
