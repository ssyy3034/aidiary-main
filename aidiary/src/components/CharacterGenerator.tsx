import React, { useState } from 'react';
import axios from 'axios';

const CharacterGenerator: React.FC = () => {
  const [result, setResult] = useState<any>(null);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus('분석 중...');
    setResult(null);
    setGeneratedImage(null);
    setLoading(true);

    const form = e.target as HTMLFormElement;
    const formData = new FormData();
    formData.append('parent1', (form.parent1 as any).files[0]);
    formData.append('parent2', (form.parent2 as any).files[0]);

    try {
      const response = await axios.post('http://localhost:5001/analyze', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        responseType: 'blob'  // 응답을 blob으로 받음
      });

      // Blob URL 생성
      const imageUrl = URL.createObjectURL(response.data);
      setGeneratedImage(imageUrl);
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
          <div style={{ marginBottom: '1rem' }}>
            <input type="file" name="parent1" accept="image/*" required />
            <input type="file" name="parent2" accept="image/*" required />
          </div>
          <button
              type="submit"
              disabled={loading}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: loading ? '#cccccc' : '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: loading ? 'not-allowed' : 'pointer'
              }}
          >
            {loading ? '생성 중...' : '캐릭터 생성'}
          </button>
        </form>

        <div style={{ margin: '1rem 0', color: loading ? '#007bff' : status.includes('실패') ? 'red' : 'green' }}>
          {status}
        </div>

        {generatedImage && (
            <div style={{ marginTop: '2rem' }}>
              <h3>생성된 AI 캐릭터</h3>
              <div style={{
                maxWidth: '500px',
                margin: '0 auto',
                boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
                borderRadius: '8px',
                overflow: 'hidden'
              }}>
                <img
                    src={generatedImage}
                    alt="Generated Character"
                    style={{
                      width: '100%',
                      height: 'auto',
                      display: 'block'
                    }}
                />
              </div>
            </div>
        )}
      </div>
  );
};

export default CharacterGenerator;