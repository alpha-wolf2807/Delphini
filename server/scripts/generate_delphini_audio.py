import os
import asyncio
import edge_tts

OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "public", "assets", "audio", "delphini")
os.makedirs(OUTPUT_DIR, exist_ok=True)

VOICE = "en-US-AriaNeural"  # Unified Delphini Female Neural Voice

AUDIO_PROMPTS = {
    "hi.wav": "Hey Aarav! Welcome to Delphini.",
    "welcome.wav": "Welcome to Delphini, the next generation of interactive holographic presentation systems.",
    "happy.wav": "I am thrilled to present this holographic interface with you!",
    "goodbye.wav": "Thank you everyone for experiencing Delphini.",
    "show_pen.wav": "Here is the smart pen you asked for.",
    "expand_pen.wav": "Let me show you what's inside. Here are the internal modular components.",
    "assemble_pen.wav": "Reassembling the components back into the chassis.",
    "magic.wav": "Observe the power of optical Pepper's Ghost holographic projection."
}

async def generate_all():
    print(f"Generating Delphini Audio Assets in {OUTPUT_DIR} using voice: {VOICE}...")
    for filename, text in AUDIO_PROMPTS.items():
        out_path = os.path.join(OUTPUT_DIR, filename)
        print(f"  -> Synthesizing {filename}: '{text}'")
        communicate = edge_tts.Communicate(text, VOICE)
        await communicate.save(out_path)
        print(f"     [OK] Saved to {out_path} ({os.path.getsize(out_path)} bytes)")
    print("\nAll Delphini audio assets generated successfully!")

if __name__ == "__main__":
    asyncio.run(generate_all())
