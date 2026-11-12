import base64
import json
import logging
import httpx
from app.core.config import settings

logger = logging.getLogger("lucky10.ai_vision")

EXTRACTION_PROMPT = """You are an expert at extracting numbers from lottery result charts and screenshots.
Analyze this lottery result image and extract all winning numbers.

CRITICAL INSTRUCTIONS:
1. 1st Prize is NOT needed (it will be typed manually).
2. Extract 2nd Prize, 3rd Prize, 4th Prize, 5th Prize as 3-digit strings (preserve leading zeros e.g. "077", "008", "080").
3. Extract all 30 Compliments numbers as 3-digit strings.
4. Compliments table structure:
   - The compliments are displayed in 3 vertical columns with 10 numbers each.
   - You MUST return them in COLUMN-MAJOR order (flat array of 30 items):
     * Items index 0 to 9: Column 1 from top to bottom
     * Items index 10 to 19: Column 2 from top to bottom
     * Items index 20 to 29: Column 3 from top to bottom
5. NEVER deduplicate! If a number appears multiple times, include every occurrence.
6. Do NOT confuse dates, times, telegram handles, draw slots, or year labels with prize numbers.

Return strictly a JSON object with this exact structure:
{
  "prize2": "265",
  "prize3": "169",
  "prize4": "668",
  "prize5": "788",
  "compliments": ["024", "135", "...", 30 strings total]
}
"""


async def extract_lottery_result_from_image(image_bytes: bytes, mime_type: str = "image/jpeg") -> dict:
    api_key = settings.GEMINI_API_KEY.strip()
    if not api_key:
        raise ValueError(
            "GEMINI_API_KEY is not configured in backend/.env. "
            "Please add your Google Gemini API key to enable AI extraction."
        )

    b64_data = base64.b64encode(image_bytes).decode("utf-8")

    payload = {
        "contents": [
            {
                "parts": [
                    {"text": EXTRACTION_PROMPT},
                    {
                        "inline_data": {
                            "mime_type": mime_type if mime_type in ["image/jpeg", "image/png", "image/webp"] else "image/jpeg",
                            "data": b64_data,
                        }
                    },
                ]
            }
        ],
        "generationConfig": {
            "response_mime_type": "application/json",
            "temperature": 0.0,
        },
    }

    # Try gemini-2.5-flash first, fallback to gemini-1.5-flash
    models = ["gemini-2.5-flash", "gemini-1.5-flash"]
    last_error = None

    async with httpx.AsyncClient(timeout=45.0) as client:
        for model in models:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"
            try:
                resp = await client.post(url, json=payload, headers={"Content-Type": "application/json"})
                if resp.status_code == 200:
                    data = resp.json()
                    candidates = data.get("candidates", [])
                    if not candidates:
                        raise ValueError("Gemini returned empty response candidates.")

                    parts = candidates[0].get("content", {}).get("parts", [])
                    if not parts or "text" not in parts[0]:
                        raise ValueError("Gemini response missing content text.")

                    raw_json_str = parts[0]["text"]
                    parsed = json.loads(raw_json_str)

                    # Normalize prizes
                    p2 = str(parsed.get("prize2", "")).strip().zfill(3)[-3:] if parsed.get("prize2") else ""
                    p3 = str(parsed.get("prize3", "")).strip().zfill(3)[-3:] if parsed.get("prize3") else ""
                    p4 = str(parsed.get("prize4", "")).strip().zfill(3)[-3:] if parsed.get("prize4") else ""
                    p5 = str(parsed.get("prize5", "")).strip().zfill(3)[-3:] if parsed.get("prize5") else ""

                    raw_comps = parsed.get("compliments", [])
                    comp_boxes = []
                    for c in raw_comps:
                        if c is not None and str(c).strip():
                            num_str = str(c).strip()
                            # Ensure 3-digit format
                            if num_str.isdigit():
                                num_str = num_str.zfill(3)[-3:]
                            comp_boxes.append(num_str)

                    # Pad to 30 if slightly short
                    while len(comp_boxes) < 30:
                        comp_boxes.append("")
                    comp_boxes = comp_boxes[:30]

                    return {
                        "prize2": p2,
                        "prize3": p3,
                        "prize4": p4,
                        "prize5": p5,
                        "complimentBoxes": comp_boxes,
                        "model": model,
                    }
                else:
                    err_detail = resp.text[:300]
                    logger.warning(f"Gemini API {model} failed with {resp.status_code}: {err_detail}")
                    last_error = f"Gemini API returned status {resp.status_code}: {err_detail}"
            except Exception as e:
                logger.warning(f"Error calling Gemini model {model}: {e}")
                last_error = str(e)

    raise RuntimeError(f"AI image extraction failed: {last_error}")

