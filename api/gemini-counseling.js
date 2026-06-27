export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  }

  const { studentAlias, gradeSummary, learningTraits, teacherConcern } = req.body;

  if (!studentAlias || !gradeSummary || !learningTraits || !teacherConcern) {
    return res.status(400).json({ success: false, error: '필수 값이 누락되었습니다.' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ success: false, error: 'GEMINI_API_KEY 환경 변수가 설정되지 않았습니다.' });
  }

  const prompt = `
다음은 학생(${studentAlias})에 대한 정보와 교사의 고민입니다.

[학생 정보]
- 성적 요약: ${gradeSummary}
- 학습 특성 요약: ${learningTraits}

[교사 고민]
${teacherConcern}

위 내용을 바탕으로 다음 형식에 맞춰 학생 상담 전략을 제안해주세요. 
단정적으로 학생을 판단하거나(예: 의지가 부족하다, 주의력 문제가 있다 등) 진단하는 표현은 피하고, 
교사가 학생을 이해하고 대화할 수 있도록 돕는 방향으로 응답해주세요.

1. 현재 상황 요약
2. 학생 데이터 기반 해석
3. 상담 접근 전략
4. 교사가 던질 수 있는 질문 3개
5. 피해야 할 말 또는 주의점
6. 다음 수업에서 해볼 수 있는 작은 지원
`;

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || 'Gemini API 호출에 실패했습니다.');
    }

    const resultText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    return res.status(200).json({ success: true, result: resultText });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}
