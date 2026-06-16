export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', process.env.ALLOWED_ORIGIN);
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).send('Method Not Allowed');
  }

  const TRAVEL_API_KEY = process.env.TRAVEL_API_KEY;
  if (!TRAVEL_API_KEY) {
    return res.status(500).send('API key not configured');
  }

  const { destination, duration, people, theme, budget } = req.body;

  if (!destination || !duration || !people || !theme || !budget) {
    return res.status(400).send('모든 항목을 입력해 주세요');
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TRAVEL_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        max_tokens: 2000,
        temperature: 0.7,
        messages: [
          {
            role: 'system',
            content: `당신은 10년 경력의 한국 여행 전문 플래너입니다.
반드시 아래 형식으로 작성해 주세요:

[여행 개요]
한 줄 소개

[일자별 코스]
Day 1 - (날짜 테마)
오전: 장소명 - 설명 (이동시간, 비용)
오후: 장소명 - 설명
저녁: 장소명 - 설명

(기간에 맞게 반복)

[추천 숙소]
숙소명 - 특징 및 가격대

[예상 비용 내역]
항목별 예상 비용 (총합 포함)

[꿀팁 3가지]
1.
2.
3.`
          },
          {
            role: 'user',
            content: `여행지: ${destination}\n여행 기간: ${duration}\n인원: ${people}\n테마: ${theme}\n예산: ${budget}\n\n위 조건에 맞는 구체적인 여행 코스를 추천해 주세요.`
          }
        ]
      })
    });

    const data = await response.json();

    if (data.error) {
      return res.status(500).send(data.error.message);
    }

    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    return res.status(200).send(data.choices[0].message.content);

  } catch (err) {
    return res.status(500).send('서버 오류: ' + err.message);
  }
}
