import { createClient, SupabaseClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

const SUPABASE_URL = process.env.SUPABASE_URL || "https://hqmwvgtortsgowrxdkpb.supabase.co";
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || "";
const BUCKET_NAME = process.env.SUPABASE_STORAGE_BUCKET || "orbit-media";

let supabaseClient: SupabaseClient | null = null;

if (SUPABASE_URL && SUPABASE_KEY) {
  try {
    supabaseClient = createClient(SUPABASE_URL, SUPABASE_KEY);
    console.log("📦 Supabase Storage client initialized for permanent media uploads");
  } catch (err) {
    console.warn("[Storage] Failed to initialize Supabase storage client:", err);
  }
}

export interface UploadResult {
  url: string;
  filename: string;
  originalName: string;
  mimetype: string;
  size: number;
}

export async function uploadMediaBuffer(
  buffer: Buffer,
  filename: string,
  mimetype: string,
  category: string = "posts"
): Promise<UploadResult> {
  const filePath = `${category}/${filename}`;

  // 1. Try Supabase Storage first for permanent hosting
  if (supabaseClient) {
    try {
      const { data, error } = await supabaseClient.storage
        .from(BUCKET_NAME)
        .upload(filePath, buffer, {
          contentType: mimetype,
          upsert: true,
        });

      if (!error && data) {
        const { data: publicUrlData } = supabaseClient.storage
          .from(BUCKET_NAME)
          .getPublicUrl(filePath);

        return {
          url: publicUrlData.publicUrl,
          filename,
          originalName: filename,
          mimetype,
          size: buffer.length,
        };
      } else if (error) {
        console.warn("[Storage] Supabase upload error, falling back to local disk:", error.message);
      }
    } catch (err) {
      console.warn("[Storage] Supabase upload failed, falling back to local disk:", err);
    }
  }

  // 2. Fallback to Local Disk
  const uploadDir = path.join(process.cwd(), "uploads", category);
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const localFilePath = path.join(uploadDir, filename);
  fs.writeFileSync(localFilePath, buffer);

  return {
    url: `/uploads/${category}/${filename}`,
    filename,
    originalName: filename,
    mimetype,
    size: buffer.length,
  };
}
