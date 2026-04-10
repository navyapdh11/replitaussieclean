import fs from "node:fs";
import OpenAI, { toFile } from "openai";
import { Buffer as NodeBuffer } from "node:buffer";

type Buffer = Uint8Array;

if (!process.env.AI_INTEGRATIONS_OPENAI_BASE_URL) {
  throw new Error(
    "AI_INTEGRATIONS_OPENAI_BASE_URL must be set. Did you forget to provision the OpenAI AI integration?",
  );
}

if (!process.env.AI_INTEGRATIONS_OPENAI_API_KEY) {
  throw new Error(
    "AI_INTEGRATIONS_OPENAI_API_KEY must be set. Did you forget to provision the OpenAI AI integration?",
  );
}

export const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

export async function generateImageBuffer(
  prompt: string,
  size: "1024x1024" | "512x512" | "256x256" = "1024x1024"
): Promise<Uint8Array> {
  const response = await openai.images.generate({
    model: "gpt-image-1",
    prompt,
    size,
  });
  const imageResult = response.data?.[0];
  if (!imageResult?.b64_json) {
    throw new Error("No image generated");
  }
  const base64 = imageResult.b64_json;
  return new Uint8Array(NodeBuffer.from(base64, "base64"));
}

export async function editImages(
  imageFiles: string[],
  prompt: string,
  outputPath?: string
): Promise<Uint8Array> {
  const images = await Promise.all(
    imageFiles.map((file) =>
      toFile(fs.createReadStream(file), file, {
        type: "image/png",
      })
    )
  );

  const response = await openai.images.edit({
    model: "gpt-image-1",
    image: images,
    prompt,
  });

  const imageResult = response.data?.[0];
  if (!imageResult?.b64_json) {
    throw new Error("No image generated");
  }
  const imageBase64 = imageResult.b64_json;
  const imageBytes = new Uint8Array(NodeBuffer.from(imageBase64, "base64"));

  if (outputPath) {
    fs.writeFileSync(outputPath, imageBytes);
  }

  return imageBytes;
}
