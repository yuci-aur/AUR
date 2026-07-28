import { v2 as cloudinary } from "cloudinary";

import { verifyFirebaseRequest } from "../../../lib/firebase-admin";

export const runtime = "nodejs";

export async function DELETE(request: Request) {
  try {
    await verifyFirebaseRequest(request, { admin: true });
    const body = (await request.json()) as {
      publicId?: string;
      resourceType?: "image" | "raw" | "video";
    };
    if (!body.publicId || !/^aur\/[a-zA-Z0-9_./-]{1,296}$/.test(body.publicId)) {
      return new Response("Invalid Cloudinary public ID", { status: 400 });
    }

    cloudinary.config({
      cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
      secure: true,
    });
    const result = await cloudinary.uploader.destroy(body.publicId, {
      resource_type: body.resourceType ?? "image",
      invalidate: true,
    });
    return Response.json({ result: result.result });
  } catch (error) {
    if (error instanceof Response) return error;
    return new Response("Unable to delete asset", { status: 401 });
  }
}
