"use client";

import { firebaseAuth } from "./firebase";

type UploadOptions = {
  folder: "aur/logos" | "aur/campuses" | "aur/blogs" | "aur/profiles" | "aur/applications" | "aur/nominations";
  publicId?: string;
  resourceType?: "image" | "raw" | "auto";
};

export type CloudinaryUploadResult = {
  secure_url: string;
  public_id: string;
  resource_type: string;
  bytes: number;
  format?: string;
};

export async function uploadToCloudinary(
  file: File,
  options: UploadOptions,
): Promise<CloudinaryUploadResult> {
  const user = firebaseAuth.currentUser;
  if (!user) throw new Error("Please sign in before uploading files.");

  const idToken = await user.getIdToken();
  const signatureResponse = await fetch("/api/cloudinary/sign", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${idToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(options),
  });
  if (!signatureResponse.ok) {
    throw new Error(await signatureResponse.text());
  }

  const signed = (await signatureResponse.json()) as {
    timestamp: number;
    signature: string;
    cloudName: string;
    apiKey: string;
    folder: string;
    publicId?: string;
    resourceType: string;
  };

  const formData = new FormData();
  formData.set("file", file);
  formData.set("api_key", signed.apiKey);
  formData.set("timestamp", String(signed.timestamp));
  formData.set("signature", signed.signature);
  formData.set("folder", signed.folder);
  if (signed.publicId) formData.set("public_id", signed.publicId);

  const uploadResponse = await fetch(
    `https://api.cloudinary.com/v1_1/${signed.cloudName}/${signed.resourceType}/upload`,
    { method: "POST", body: formData },
  );
  if (!uploadResponse.ok) {
    const payload = await uploadResponse.json().catch(() => null);
    throw new Error(payload?.error?.message ?? "Cloudinary upload failed.");
  }
  return uploadResponse.json() as Promise<CloudinaryUploadResult>;
}
