import { Request, Response, NextFunction } from 'express';
import axios from 'axios';
import { env } from '../../config/env';
import { Price } from '../prices/price.model';

const KNOWN_COORDS: Record<string, [number, number]> = {
  kalyan: [19.2403, 73.1305],
  karjat: [18.9100, 73.3300],
  panvel: [18.9894, 73.1093],
  vashi: [19.0745, 73.0031],
  'navi mumbai': [19.0745, 73.0031],
  mumbai: [19.0178, 72.8478],
  pune: [18.5204, 73.8567],
  lasalgaon: [20.1418, 74.2255],
  nashik: [19.9975, 73.7898],
  pimpalgaon: [20.1700, 73.9800],
  baramati: [18.1517, 74.5815],
  rahuri: [19.3900, 74.6500],
  ahmednagar: [19.0952, 74.7496],
  thane: [19.2183, 72.9781],
  alibag: [18.6534, 72.8687],
  solapur: [17.6599, 75.9064],
  kolhapur: [16.7050, 74.2433],
  satara: [17.6805, 73.9935],
  sangli: [16.8524, 74.5815],
  aurangabad: [19.8762, 75.3433],
  sambhajinagar: [19.8762, 75.3433],
  jalgaon: [21.0077, 75.5626],
  dhule: [20.9042, 74.7749],
  nagpur: [21.1458, 79.0882]
};

function parseWeatherCode(code: number, lang: string = 'en') {
  if (code === 0) return lang === 'mr' ? 'निरभ्र आकाश (Clear Sky)' : 'Clear Sky';
  if (code <= 3) return lang === 'mr' ? 'अंशतः ढगाळ (Partly Cloudy)' : 'Partly Cloudy';
  if (code >= 51 && code <= 55) return lang === 'mr' ? 'हलका पाऊस / रिमझिम (Light Drizzle)' : 'Light Drizzle / Rain';
  if (code >= 61 && code <= 65) return lang === 'mr' ? 'पाऊस (Moderate Rain)' : 'Moderate Rain';
  if (code >= 80 && code <= 82) return lang === 'mr' ? 'पावसाच्या सरी (Rain Showers)' : 'Rain Showers';
  if (code >= 95) return lang === 'mr' ? 'वादळी पाऊस (Thunderstorm Alert)' : 'Thunderstorm Alert';
  return lang === 'mr' ? 'सामान्य हवामान (Fair Weather)' : 'Fair Weather';
}

export const chatWithAdvisor = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { message, lang = 'en', crop, mandi } = req.body;

    if (!message) {
      return res.status(400).json({ success: false, message: 'Message is required' });
    }

    const lowerMsg = message.toLowerCase();

    // 1. WEATHER INTENT (Handles typos like "wheather", "wether", "hawaaman", "पाऊस", "हवामान")
    const isWeatherQuery = /weather|wheather|wether|hawaaman|hawaamann|हवामान|rain|paus|पाऊस|temperature|temp|forecast|climate|rainy/i.test(lowerMsg);

    if (isWeatherQuery) {
      let targetLocName = 'Karjat';
      let coords: [number, number] = KNOWN_COORDS.karjat;

      for (const [key, locCoords] of Object.entries(KNOWN_COORDS)) {
        if (lowerMsg.includes(key)) {
          targetLocName = key.charAt(0).toUpperCase() + key.slice(1);
          coords = locCoords;
          break;
        }
      }

      try {
        const openMeteoUrl = `https://api.open-meteo.com/v1/forecast?latitude=${coords[0]}&longitude=${coords[1]}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,apparent_temperature`;
        const weatherRes = await axios.get(openMeteoUrl, { timeout: 4000 });
        const current = weatherRes.data?.current;

        if (current) {
          const temp = Math.round(current.temperature_2m);
          const humidity = current.relative_humidity_2m;
          const wind = Math.round(current.wind_speed_10m);
          const condition = parseWeatherCode(current.weather_code, lang);

          const weatherReply = lang === 'mr'
            ? `🌤️ **${targetLocName} चे थेट हवामान (Live Weather Advisory):**\n\n* **तापमान:** ${temp}°C (वाटणारे तापमान: ${Math.round(current.apparent_temperature)}°C)\n* **हवामान स्थिती:** ${condition}\n* **सापेक्ष आर्द्रता:** ${humidity}%\n* **वाऱ्याचा वेग:** ${wind} किमी/तास\n\n💡 **शेतकरी सल्ला:** कापणी झालेला माल ताडपत्रीने झाकून सुरक्षित ठेवा व दमट हवामानात साठवणूक करताना हवा खेळती ठेवा.`
            : `🌤️ **Live Weather for ${targetLocName}:**\n\n* **Temperature:** ${temp}°C (Feels like: ${Math.round(current.apparent_temperature)}°C)\n* **Condition:** ${condition}\n* **Humidity:** ${humidity}%\n* **Wind Speed:** ${wind} km/h\n\n💡 **Farmer Advisory:** Ensure harvested crop batches are covered with waterproof tarpaulins during dispatch transit to prevent moisture damage.`;

          return res.status(200).json({
            success: true,
            data: {
              reply: weatherReply,
              isAi: true,
              intent: 'weather',
              model: 'open-meteo-live'
            }
          });
        }
      } catch (wErr) {
        console.error('Weather API error:', wErr);
      }
    }

    // 2. DISTANCE INTENT (Handles "distance between kalyan and karjat", "how far is karjat from vashi", etc.)
    const isDistanceQuery = /distance|ditance|distace|अंतर|किती लांब|how far|route|rasta|transit km|km between|length between/i.test(lowerMsg);

    if (isDistanceQuery) {
      const foundLocations: { name: string; coords: [number, number] }[] = [];
      for (const [key, locCoords] of Object.entries(KNOWN_COORDS)) {
        if (lowerMsg.includes(key)) {
          foundLocations.push({ name: key.charAt(0).toUpperCase() + key.slice(1), coords: locCoords });
        }
      }

      if (foundLocations.length === 1 && !lowerMsg.includes('vashi')) {
        foundLocations.unshift({ name: 'Vashi APMC', coords: KNOWN_COORDS.vashi });
      }

      if (foundLocations.length >= 2) {
        const [locA, locB] = foundLocations;
        const R = 6371;
        const dLat = ((locB.coords[0] - locA.coords[0]) * Math.PI) / 180;
        const dLon = ((locB.coords[1] - locA.coords[1]) * Math.PI) / 180;
        const a =
          Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos((locA.coords[0] * Math.PI) / 180) *
            Math.cos((locB.coords[0] * Math.PI) / 180) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const aerialKm = R * c;
        const estimatedRoadKm = Math.round(aerialKm * 1.35);

        const distReply = lang === 'mr'
          ? `📍 **${locA.name} ते ${locB.name} अंतर अंदाज:**\n\n* **अंदाजित रस्ता अंतर (Road Distance):** सुमारे **${estimatedRoadKm} किमी** (1.35x रस्ता वळण घटकासह).\n* **सरळ हवाई अंतर (Geodesic):** सुमारे **${Math.round(aerialKm)} किमी**.\n* **अंदाजित मालवाहतूक वेळ:** साधारण १ तास १५ मिनिटे ते १ तास ३० मिनिटे.\n* **वाहतूक खर्च अंदाज:** ₹१.५० प्रति किमी/क्विंटल प्रमाणे साधारण ₹${(estimatedRoadKm * 1.5).toFixed(0)} प्रति क्विंटल वाहतूक खर्च येऊ शकतो.`
          : `📍 **Distance between ${locA.name} and ${locB.name}:**\n\n* **Estimated Road Distance:** Approximately **${estimatedRoadKm} km** (calibrated with 1.35× rural road-factor).\n* **Straight-line Distance (Geodesic):** ~**${Math.round(aerialKm)} km**.\n* **Estimated Freight Transit Time:** ~1 hr 15 mins to 1 hr 30 mins depending on truck traffic.\n* **Estimated Freight Rate:** At PRISMS benchmark rate of ₹1.50/km/Quintal, logistics cost is ~₹${(estimatedRoadKm * 1.5).toFixed(0)} per quintal.`;

        return res.status(200).json({
          success: true,
          data: {
            reply: distReply,
            isAi: true,
            intent: 'distance',
            model: 'prisms-geodesic-engine'
          }
        });
      }
    }

    // 3. GEMINI LLM CALL WITH WORKING MODEL FALLBACKS
    const geminiKey = env.GEMINI_API_KEY;

    if (geminiKey) {
      const latestPrices = await Price.find({
        commodity: new RegExp(`^${crop || 'Onion'}$`, 'i')
      }).populate('marketId', 'name district').sort({ date: -1 }).limit(5);

      const priceContext = latestPrices.length > 0 
        ? latestPrices.map(p => `- ${(p.marketId as any)?.name || 'APMC'}: Modal ₹${p.modalPrice}/Qtl (Min: ₹${p.minPrice}, Max: ₹${p.maxPrice})`).join('\n')
        : '- Lasalgaon Mandi: ₹2,414/Qtl\n- Vashi APMC: ₹2,606/Qtl\n- Pune APMC: ₹2,412/Qtl';

      const systemPrompt = `You are "PRISMS AI Agri Advisor", an expert agricultural, market intelligence, and mandi negotiation assistant for farmers in Maharashtra and across India.
- DIRECT QUESTION ANSWERING: Always directly and specifically answer what the farmer asked (e.g. distance, transport freight rate, weather forecast, crop prices, or MSP).
- Do NOT output an unrelated market summary if the farmer asked a specific question about weather, distance, or transport.
- Always respond in ${lang === 'mr' ? 'Marathi (मराठी)' : 'English (or simple Hinglish if requested)'}.
- Keep your answers structured, encouraging, crisp (3 to 4 bullet points max), and practical for a farmer.
- Ground your market price answers strictly on this verified PRISMS government APMC dataset:
${priceContext}
- Farmer context: Active Crop: "${crop || 'Red Onion'}", Selected Mandi / Hub: "${mandi || 'Navi Mumbai / Lasalgaon'}".`;

      const candidateModels = ['gemini-3.5-flash-lite', 'gemini-3.1-flash-lite', 'gemini-3.5-flash'];

      for (const modelName of candidateModels) {
        try {
          const response = await axios.post(
            `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${geminiKey}`,
            {
              contents: [
                {
                  role: 'user',
                  parts: [{ text: `${systemPrompt}\n\nFarmer Question: "${message}"` }],
                },
              ],
            },
            {
              headers: { 'Content-Type': 'application/json' },
              timeout: 12000,
            }
          );

          const reply = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (reply) {
            return res.status(200).json({
              success: true,
              data: {
                reply,
                isAi: true,
                model: modelName
              },
            });
          }
        } catch (gErr: any) {
          console.error(`Gemini model ${modelName} failed:`, gErr?.response?.data?.error?.message || gErr?.message);
        }
      }
    }

    // 4. INTENT-AWARE FALLBACK RESPONSES
    let fallbackReply = lang === 'mr'
      ? 'लासलगाव व वाशी बाजारात सध्या आवक मध्यम असून दर स्थिर ते तेजीमध्ये आहेत. माल व्यवस्थित सुकवून प्रतवारीनुसार विक्री करा.'
      : 'Mandi supplies across Vashi and Lasalgaon are steady. Grade your crop before dispatch for maximum net realization.';

    if (/msp|government rate|हमीभाव/i.test(lowerMsg)) {
      fallbackReply = lang === 'mr'
        ? '🌾 **शासकीय हमीभाव (Govt MSP Rates):**\n* **गहू (Wheat MSP):** ₹२,२७५ / क्विंटल\n* **सोयाबीन (Soybean MSP):** ₹४,६०० / क्विंटल\n* **कापूस (Cotton MSP):** ₹७,०२० / क्विंटल\n* **धान/तांदूळ (Paddy MSP):** ₹२,१८३ / क्विंटल'
        : '🌾 **Government Minimum Support Price (MSP) Rates:**\n* **Wheat MSP:** ₹2,275 / Quintal\n* **Soybean MSP:** ₹4,600 / Quintal\n* **Cotton MSP:** ₹7,020 / Quintal\n* **Paddy MSP:** ₹2,183 / Quintal';
    } else if (/onion|कांदा/i.test(lowerMsg)) {
      fallbackReply = lang === 'mr'
        ? '🧅 **कांदा बाजारभाव अपडेट (Onion Rates):**\n* **वाशी APMC:** ₹२,६०६ / क्विंटल (सरासरी दर)\n* **लासलगाव APMC:** ₹२,४१४ / क्विंटल\n* **पुणे APMC:** ₹२,४१२ / क्विंटल\n* **सल्ला:** मध्यम दर्जाच्या कांद्याची तातडीने विक्री करा, उच्च दर्जाचा कांदा साठवून ठेवता येईल.'
        : '🧅 **Onion Benchmark Mandi Rates:**\n* **Vashi APMC:** ₹2,606 / Quintal (Modal Price)\n* **Lasalgaon APMC:** ₹2,414 / Quintal\n* **Pune APMC:** ₹2,412 / Quintal\n* **Recommendation:** Dispatch Grade-2 batches now; hold dry Grade-1 onion for peak price realization.';
    }

    res.status(200).json({
      success: true,
      data: {
        reply: fallbackReply,
        isAi: false,
        model: 'prisms-rules-engine'
      },
    });
  } catch (err: any) {
    console.error('Advisor Chat Controller Exception:', err);
    next(err);
  }
};

