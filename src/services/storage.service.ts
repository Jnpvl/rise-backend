import fs from "fs";
import path from "path";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { uploadsDir } from "../utils/uploads-path";

let supabaseClient: SupabaseClient | null = null;

export function isRemoteStorageEnabled(): boolean {
  return Boolean(
    process.env.SUPABASE_URL?.trim() &&
      process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()
  );
}

function getSupabase(): SupabaseClient {
  if (supabaseClient) return supabaseClient;

  const url = process.env.SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !key) {
    throw new Error(
      "Supabase Storage no configurado (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY)"
    );
  }

  supabaseClient = createClient(url, key);
  return supabaseClient;
}

function getBucketName(): string {
  return process.env.SUPABASE_STORAGE_BUCKET?.trim() || "rise-uploads";
}

export function buildStoredName(originalName: string): string {
  const safeName = originalName.replace(/[^a-zA-Z0-9._-]/g, "_");
  return `${Date.now()}-${safeName}`;
}

export async function savePatientFile(
  patientId: string,
  file: Express.Multer.File
): Promise<{ storedName: string; fileUrl: string }> {
  const storedName = buildStoredName(file.originalname);
  const buffer = file.buffer;

  if (!buffer?.length) {
    throw new Error("Archivo vacío o no recibido en memoria");
  }

  if (isRemoteStorageEnabled()) {
    const bucket = getBucketName();
    const objectPath = `${patientId}/${storedName}`;
    const supabase = getSupabase();

    const { error } = await supabase.storage
      .from(bucket)
      .upload(objectPath, buffer, {
        contentType: file.mimetype,
        upsert: true,
      });

    if (error) {
      throw new Error(error.message);
    }

    const { data } = supabase.storage.from(bucket).getPublicUrl(objectPath);
    return { storedName, fileUrl: data.publicUrl };
  }

  const dir = path.join(uploadsDir, patientId);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, storedName), buffer);
  return {
    storedName,
    fileUrl: `/uploads/${patientId}/${storedName}`,
  };
}

export async function deletePatientFile(
  patientId: string,
  storedName: string
): Promise<void> {
  if (isRemoteStorageEnabled()) {
    const bucket = getBucketName();
    const objectPath = `${patientId}/${storedName}`;
    const { error } = await getSupabase()
      .storage.from(bucket)
      .remove([objectPath]);

    if (error) {
      throw new Error(error.message);
    }
    return;
  }

  const filePath = path.join(uploadsDir, patientId, storedName);
  const resolved = path.resolve(filePath);
  const patientDir = path.resolve(uploadsDir, patientId);

  if (!resolved.startsWith(patientDir + path.sep)) {
    throw new Error("Ruta de archivo inválida");
  }

  if (!fs.existsSync(resolved)) {
    throw new Error("Archivo no encontrado");
  }

  fs.unlinkSync(resolved);
}
