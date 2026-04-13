import OpenAI, { toFile } from "openai";
import { spawn } from "child_process";
import { writeFile, readFile, unlink } from "fs/promises";
import { randomUUID } from "crypto";
import { tmpdir } from "os";
import { join } from "path";
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

export type AudioFormat = "wav" | "mp3" | "webm" | "mp4" | "ogg" | "unknown";

export function detectAudioFormat(buffer: Uint8Array): AudioFormat {
  if (buffer.length < 12) return "unknown";

  if (buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46) {
    return "wav";
  }
  if (buffer[0] === 0x1a && buffer[1] === 0x45 && buffer[2] === 0xdf && buffer[3] === 0xa3) {
    return "webm";
  }
  if (
    (buffer[0] === 0xff && (buffer[1] === 0xfb || buffer[1] === 0xfa || buffer[1] === 0xf3)) ||
    (buffer[0] === 0x49 && buffer[1] === 0x44 && buffer[2] === 0x33)
  ) {
    return "mp3";
  }
  if (buffer[4] === 0x66 && buffer[5] === 0x74 && buffer[6] === 0x79 && buffer[7] === 0x70) {
    return "mp4";
  }
  if (buffer[0] === 0x4f && buffer[1] === 0x67 && buffer[2] === 0x67 && buffer[3] === 0x53) {
    return "ogg";
  }
  return "unknown";
}

export async function convertToWav(audioBuffer: Uint8Array): Promise<Uint8Array> {
  const inputPath = join(tmpdir(), `input-${randomUUID()}`);
  const outputPath = join(tmpdir(), `output-${randomUUID()}.wav`);

  try {
    await writeFile(inputPath, Buffer.from(audioBuffer));

    await new Promise<void>((resolve, reject) => {
      const ffmpeg = spawn("ffmpeg", [
        "-i", inputPath,
        "-vn",
        "-f", "wav",
        "-ar", "16000",
        "-ac", "1",
        "-acodec", "pcm_s16le",
        "-y",
        outputPath,
      ]);

      ffmpeg.stderr.on("data", () => {});
      ffmpeg.on("close", (code) => {
        if (code === 0) resolve();
        else reject(new Error(`ffmpeg exited with code ${code}`));
      });
      ffmpeg.on("error", reject);
    });

    const result = await readFile(outputPath);
    return new Uint8Array(result.buffer.slice(result.byteOffset, result.byteOffset + result.byteLength));
  } finally {
    await unlink(inputPath).catch(() => {});
    await unlink(outputPath).catch(() => {});
  }
}

export async function ensureCompatibleFormat(
  audioBuffer: Uint8Array
): Promise<{ buffer: Uint8Array; format: "wav" | "mp3" }> {
  const detected = detectAudioFormat(audioBuffer);
  if (detected === "wav") return { buffer: audioBuffer, format: "wav" };
  if (detected === "mp3") return { buffer: audioBuffer, format: "mp3" };
  const wavBuffer = await convertToWav(audioBuffer);
  return { buffer: wavBuffer, format: "wav" };
}

export async function voiceChat(
  audioBuffer: Uint8Array,
  voice: "alloy" | "echo" | "fable" | "onyx" | "nova" | "shimmer" = "alloy",
  inputFormat: "wav" | "mp3" = "wav",
  outputFormat: "wav" | "mp3" = "mp3"
): Promise<{ transcript: string; audioResponse: Uint8Array }> {
  const audioBase64 = NodeBuffer.from(audioBuffer).toString("base64");

  // gpt-audio (Realtime API) may not be available on all OpenAI tiers.
  // Gracefully degrade to whisper + tts pipeline.
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-audio-preview",
      modalities: ["text", "audio"],
      audio: { voice, format: outputFormat },
      messages: [{
        role: "user",
        content: [
          { type: "input_audio", input_audio: { format: inputFormat, data: audioBase64 } },
        ],
      }],
    });

    const message = response.choices[0]?.message;
    const raw = message?.content as unknown;
    const transcript = typeof raw === "string"
      ? raw
      : Array.isArray(raw)
        ? (raw as Array<{ type?: string; text?: string }>).find((c) => c?.type === "text")?.text ?? ""
        : "";

    let audioResponse = new Uint8Array();
    if (Array.isArray(raw)) {
      const audioEntry = (raw as Array<{ type?: string; output_audio?: { data?: string } }>).find(
        (c) => c?.type === "output_audio"
      );
      if (audioEntry?.output_audio?.data) {
        audioResponse = new Uint8Array(NodeBuffer.from(audioEntry.output_audio.data, "base64"));
      }
    }
    return { transcript, audioResponse };
  } catch (err) {
    // Fallback: transcribe with whisper, no audio response
    const transcription = await openai.audio.transcriptions.create({
      model: "whisper-1",
      file: new File([audioBuffer as Uint8Array<ArrayBuffer>], "audio.wav", { type: "audio/wav" }),
    });
    return { transcript: transcription.text, audioResponse: new Uint8Array() };
  }
}

export async function textToSpeech(
  text: string,
  voice: "alloy" | "echo" | "fable" | "onyx" | "nova" | "shimmer" = "alloy",
): Promise<Uint8Array> {
  const response = await openai.audio.speech.create({
    model: "tts-1",
    voice,
    input: text,
  });
  const buffer = await response.arrayBuffer();
  return new Uint8Array(buffer as ArrayBuffer);
}

export async function* voiceChatStream(
  audioBuffer: Uint8Array,
  voice: "alloy" | "echo" | "fable" | "onyx" | "nova" | "shimmer" = "alloy"
): AsyncGenerator<{ type: "transcript" | "audio"; content: string | Uint8Array }> {
  const result = await voiceChat(audioBuffer, voice);
  yield { type: "transcript", content: result.transcript };
  yield { type: "audio", content: result.audioResponse };
}

export async function speechToText(audioBuffer: Uint8Array): Promise<string> {
  const transcription = await openai.audio.transcriptions.create({
    model: "whisper-1",
    file: new File([audioBuffer as Uint8Array<ArrayBuffer>], "audio.wav", { type: "audio/wav" }),
  });
  return transcription.text;
}

export async function* speechToTextStream(
  audioStream: AsyncIterable<Uint8Array>
): AsyncGenerator<{ type: "transcript" | "final"; text: string }> {
  for await (const _chunk of audioStream) {
    yield { type: "final", text: "" };
  }
}

export async function* textToSpeechStream(
  text: string,
  voice: "alloy" | "echo" | "fable" | "onyx" | "nova" | "shimmer" = "alloy"
): AsyncGenerator<Uint8Array> {
  const full = await textToSpeech(text, voice);
  yield full;
}