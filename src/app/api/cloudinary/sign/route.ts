import { v2 as cloudinary } from "cloudinary";

import { verifyFirebaseRequest } from "../../../lib/firebase-admin";

export const runtime = "nodejs";

const ADMIN_FOLDERS = new Set(["aur/logos", "aur/campuses", "aur/blogs"]);
const USER_FOLDERS = new Set(["aur/profiles", "aur/applications", "aur/nominations"]);

function safePublicId(value: unknown) {
  if (typeof value !== "string" || !value.trim()) return undefined;
  return value.trim().replace(/[^a-zA-Z0-9_-]/g, "-").slice(0, 120);
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      folder?: string;
      publicId?: string;
      resourceType?: string;
    };
    const folder = body.folder ?? "";
    const isAdminFolder = ADMIN_FOLDERS.has(folder);
    if (!isAdminFolder && !USER_FOLDERS.has(folder)) {
      return new Response("Upload folder is not allowed", { status: 400 });
    }

    await verifyFirebaseRequest(request, { admin: isAdminFolder });

    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;
    if (!cloudName || !apiKey || !apiSecret) {
      return new Response("Cloudinary is not configured", { status: 500 });
    }

    const resourceType = ["image", "raw", "auto"].includes(body.resourceType ?? "")
      ? body.resourceType!
      : "auto";
    const timestamp = Math.floor(Date.now() / 1000);
    const publicId = safePublicId(body.publicId);
    const parameters: Record<string, string | number> = { folder, timestamp };
    if (publicId) parameters.public_id = publicId;

    const signature = cloudinary.utils.api_sign_request(parameters, apiSecret);
    return Response.json({
      timestamp,
      signature,
      cloudName,
      apiKey,
      folder,
      publicId,
      resourceType,
    });
  } catch (error) {
    if (error instanceof Response) return error;
    return new Response("Unable to authorize upload", { status: 401 });
  }
}
