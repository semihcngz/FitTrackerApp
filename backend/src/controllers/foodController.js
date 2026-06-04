const OPENAI_CHAT_URL = 'https://api.openai.com/v1/chat/completions';
const DEFAULT_MODEL = 'gpt-5.4-mini';

const clampMacro = (value) => {
  const number = Number(value);
  if (!Number.isFinite(number) || number < 0) return 0;
  return Math.round(number * 10) / 10;
};

const normalizeMeal = (meal, source) => ({
  name: meal.name || 'Estimated Meal',
  description: meal.description || 'Nutrition estimate from the selected food photo.',
  calories: Math.round(clampMacro(meal.calories)),
  protein: clampMacro(meal.protein),
  carbs: clampMacro(meal.carbs),
  fat: clampMacro(meal.fat),
  confidence: ['low', 'medium', 'high'].includes(meal.confidence) ? meal.confidence : 'medium',
  notes: Array.isArray(meal.notes) ? meal.notes.slice(0, 3) : [],
  source,
});

const analyzeFoodPhoto = async (req, res) => {
  const { imageBase64 } = req.body;

  if (!imageBase64 || typeof imageBase64 !== 'string') {
    return res.status(400).json({ error: 'imageBase64 is required' });
  }

  if (!process.env.OPENAI_API_KEY) {
    return res.status(503).json({ error: 'OPENAI_API_KEY is not configured' });
  }

  const model = process.env.OPENAI_MODEL || DEFAULT_MODEL;

  try {
    const response = await fetch(OPENAI_CHAT_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        max_completion_tokens: 700,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content:
              'You are a nutrition analysis assistant. Always respond with valid JSON only, no extra text. Use this exact structure: { "name": string, "description": string, "calories": number, "protein": number, "carbs": number, "fat": number, "confidence": "low"|"medium"|"high", "notes": string[] }',
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Estimate the nutrition of this food photo. Return one meal estimate with realistic values. If uncertain, infer a common serving size.',
              },
              {
                type: 'image_url',
                image_url: {
                  url: imageBase64,
                  detail: 'low',
                },
              },
            ],
          },
        ],
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('OpenAI food analysis error:', data);
      return res.status(502).json({ error: 'Food analysis failed' });
    }

    const outputText = data.choices?.[0]?.message?.content;
    const meal = outputText ? JSON.parse(outputText) : null;

    if (!meal) {
      return res.status(502).json({ error: 'Food analysis returned an empty result' });
    }

    res.status(200).json(normalizeMeal(meal, model));
  } catch (err) {
    console.error('Analyze food photo error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = { analyzeFoodPhoto };
