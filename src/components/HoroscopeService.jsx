import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer } from 'recharts';
import { create, all } from 'mathjs';

const math = create(all);

// 基本定数
const ORBITAL_ELEMENTS = {
  sun: {
    epoch: 2451545.0,
    n: 0.0,
    L: 280.459,
    e: 0.016709,
    perihelion: 282.9404,
    a: 1.0
  },
  moon: {
    epoch: 2451545.0,
    n: 13.1763965268,
    L: 318.351,
    e: 0.0549,
    perihelion: 36.340,
    a: 60.2666
  },
  mercury: {
    epoch: 2451545.0,
    n: 4.092317,
    L: 252.251,
    e: 0.205635,
    perihelion: 77.456,
    a: 0.387098
  }
};

const ELEMENT_COLORS = {
  fire: '#FF6B6B',
  earth: '#4E9F3D',
  air: '#FFD93D',
  water: '#4D96FF'
};

const HoroscopeCalculator = () => {
  const [parentBirthDate, setParentBirthDate] = useState('');
  const [parentBirthTime, setParentBirthTime] = useState('');
  const [childBirthDate, setChildBirthDate] = useState('');
  const [childBirthTime, setChildBirthTime] = useState('');
  const [chartData, setChartData] = useState(null);
  const [loading, setLoading] = useState(false);

  // ユリウス日計算
  const dateToJulian = (date, time = '12:00') => {
    const [year, month, day] = date.split('-').map(Number);
    const [hour, minute] = time.split(':').map(Number);
    
    let a = math.floor((14 - month) / 12);
    let y = year + 4800 - a;
    let m = month + 12 * a - 3;
    
    let jd = day + math.floor((153 * m + 2) / 5) + 365 * y + 
             math.floor(y / 4) - math.floor(y / 100) + 
             math.floor(y / 400) - 32045 +
             (hour - 12) / 24 + minute / 1440;
    
    return jd;
  };

  // 惑星位置計算
  const calculatePlanetPosition = (planet, jd) => {
    const elements = ORBITAL_ELEMENTS[planet];
    const T = (jd - elements.epoch) / 36525;
    
    // 平均近点角
    const M = (elements.L + elements.n * T) % 360;
    const Mrad = M * Math.PI / 180;

    // 離心近点角
    let E = Mrad;
    for (let i = 0; i < 10; i++) {
      E = Mrad + elements.e * Math.sin(E);
    }

    // 真近点角
    const v = 2 * Math.atan(Math.sqrt((1 + elements.e) / (1 - elements.e)) * Math.tan(E / 2));

    // 黄経
    let longitude = (v * 180 / Math.PI + elements.perihelion) % 360;
    if (longitude < 0) longitude += 360;

    return longitude;
  };

  // 要素の計算
  const calculateElements = (birthDate, birthTime) => {
    const jd = dateToJulian(birthDate, birthTime);
    
    const positions = {
      sun: calculatePlanetPosition('sun', jd),
      moon: calculatePlanetPosition('moon', jd),
      mercury: calculatePlanetPosition('mercury', jd)
    };

    // 要素の集計
    const elements = {
      fire: 0,
      earth: 0,
      air: 0,
      water: 0
    };

    // 星座から要素を判定
    Object.entries(positions).forEach(([planet, position]) => {
      const signIndex = Math.floor(position / 30);
      const element = getElementFromSignIndex(signIndex);
      const weight = getWeightForPlanet(planet);
      elements[element] += weight;
    });

    return elements;
  };

  // 星座インデックスから要素を取得
  const getElementFromSignIndex = (index) => {
    const elements = ['fire', 'earth', 'air', 'water'];
    return elements[index % 4];
  };

  // 惑星の重み付け
  const getWeightForPlanet = (planet) => {
    const weights = {
      sun: 5,
      moon: 5,
      mercury: 3
    };
    return weights[planet] || 1;
  };

  // チャートの生成
  const generateChart = async () => {
    if (!parentBirthDate || !childBirthDate) {
      alert('生年月日を入力してください');
      return;
    }

    setLoading(true);
    try {
      const parentElements = calculateElements(parentBirthDate, parentBirthTime);
      const childElements = calculateElements(childBirthDate, childBirthTime);

      const data = [
        { 
          subject: '風 (思考)',
          child: childElements.air,
          parent: parentElements.air,
          fullMark: 20 
        },
        { 
          subject: '火 (直感)',
          child: childElements.fire,
          parent: parentElements.fire,
          fullMark: 20 
        },
        { 
          subject: '水 (感情)',
          child: childElements.water,
          parent: parentElements.water,
          fullMark: 20 
        },
        { 
          subject: '土 (感覚)',
          child: childElements.earth,
          parent: parentElements.earth,
          fullMark: 20 
        }
      ];

      setChartData(data);
    } catch (error) {
      console.error('計算エラー:', error);
      alert('計算中にエラーが発生しました。もう一度お試しください。');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4">
      <Card className="p-6">
        <h2 className="text-2xl font-bold text-center mb-6">親子の四元素診断</h2>
        
        <div className="space-y-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">お母様の生年月日</label>
              <input
                type="date"
                className="w-full p-2 border rounded"
                value={parentBirthDate}
                onChange={(e) => setParentBirthDate(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">出生時刻（分かる場合）</label>
              <input
                type="time"
                className="w-full p-2 border rounded"
                value={parentBirthTime}
                onChange={(e) => setParentBirthTime(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">お子様の生年月日</label>
              <input
                type="date"
                className="w-full p-2 border rounded"
                value={childBirthDate}
                onChange={(e) => setChildBirthDate(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">出生時刻（分かる場合）</label>
              <input
                type="time"
                className="w-full p-2 border rounded"
                value={childBirthTime}
                onChange={(e) => setChildBirthTime(e.target.value)}
              />
            </div>
          </div>

          <button
            className="w-full bg-blue-500 text-white py-3 rounded-lg hover:bg-blue-600 disabled:opacity-50"
            onClick={generateChart}
            disabled={loading}
          >
            {loading ? '診断中...' : 'グラフを作成する'}
          </button>
        </div>

        {chartData && (
          <div className="space-y-6">
            <div className="h-[500px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={chartData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="subject" />
                  <Radar
                    name="お子様"
                    dataKey="child"
                    stroke="#D4A5A5"
                    fill="#D4A5A5"
                    fillOpacity={0.5}
                  />
                  <Radar
                    name="お母様"
                    dataKey="parent"
                    stroke="#9E7676"
                    fill="#9E7676"
                    fillOpacity={0.5}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-bold mb-2">診断結果</h3>
              <p className="text-sm text-gray-600">
                このグラフは親子それぞれの四元素バランスを表しています。
                重なり合う部分は共感しやすい領域、異なる部分は互いに補い合える可能性を示しています。
              </p>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

export default HoroscopeCalculator;
