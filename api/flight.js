export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', process.env.ALLOWED_ORIGIN);
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).send('Method Not Allowed');
  }

  const API_KEY = process.env.AVIATIONSTACK_API_KEY;
  if (!API_KEY) {
    return res.status(500).send('API key not configured');
  }

  const { flight } = req.query;
  if (!flight) {
    return res.status(400).json({ error: '항공편 번호를 입력해 주세요' });
  }

  try {
    const url = `http://api.aviationstack.com/v1/flights?access_key=${API_KEY}&flight_iata=${flight.toUpperCase()}`;
    const response = await fetch(url);
    const data = await response.json();

    if (!data.data || data.data.length === 0) {
      return res.status(404).json({ error: `${flight.toUpperCase()} 항공편을 찾을 수 없습니다` });
    }

    const f = data.data[0];
    const result = {
      flightNumber: f.flight?.iata || flight.toUpperCase(),
      airline: f.airline?.name || '-',
      status: translateStatus(f.flight_status),
      departure: {
        airport: f.departure?.airport || '-',
        iata: f.departure?.iata || '-',
        scheduled: formatTime(f.departure?.scheduled),
        actual: formatTime(f.departure?.actual),
        delay: f.departure?.delay || 0
      },
      arrival: {
        airport: f.arrival?.airport || '-',
        iata: f.arrival?.iata || '-',
        scheduled: formatTime(f.arrival?.scheduled),
        estimated: formatTime(f.arrival?.estimated),
        actual: formatTime(f.arrival?.actual),
        delay: f.arrival?.delay || 0
      }
    };

    return res.status(200).json(result);

  } catch (err) {
    return res.status(500).json({ error: '서버 오류: ' + err.message });
  }
}

function formatTime(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  return d.toLocaleString('ko-KR', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false });
}

function translateStatus(status) {
  const map = { scheduled: '예정', active: '운항 중', landed: '도착 완료', cancelled: '결항', incident: '사고', diverted: '우회 운항' };
  return map[status] || status || '-';
}
