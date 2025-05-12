import React, { useState } from 'react';
import axios from 'axios';

const CharacterGenerator: React.FC = () => {
  const [result, setResult] = useState<any>(null);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus('분석 중...');
    setResult(null);
    setLoading(true);

    const form = e.target as HTMLFormElement;
    const formData = new FormData();
    formData.append('parent1', (form.parent1 as any).files[0]);
    formData.append('parent2', (form.parent2 as any).files[0]);

    try {
      const res = await axios.post('http://localhost:5001/analyze', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setResult(res.data);
      setStatus('캐릭터 생성 성공!');
    } catch (err) {
      setStatus('서버 연결 실패');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ margin: '2rem 0' }}>
      <h2>부모 사진으로 AI 캐릭터 생성</h2>
      <form onSubmit={handleSubmit}>
        <input type="file" name="parent1" accept="image/*" required />
        <input type="file" name="parent2" accept="image/*" required />
        <button type="submit" disabled={loading}>
          {loading ? '분석 중...' : '캐릭터 생성'}
        </button>
      </form>
      <div style={{ margin: '1rem 0', color: 'blue' }}>{status}</div>
      {result && (
        <div style={{ marginTop: '2rem' }}>
          <h3>AI 캐릭터 설명 (GPT 결과)</h3>
          <div style={{ whiteSpace: 'pre-line', background: '#f5f5f5', padding: '1rem', borderRadius: '8px' }}>
            {result.gpt_response}
          </div>
          <h4>부모1 특징</h4>
          <pre>{JSON.stringify(result.parent1_features, null, 2)}</pre>
          <h4>부모2 특징</h4>
          <pre>{JSON.stringify(result.parent2_features, null, 2)}</pre>
        </div>
      )}
    </div>
  );
};

export default CharacterGenerator;