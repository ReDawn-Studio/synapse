import { useState } from 'react';
import { useApi } from '../hooks/useApi';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const [tokenInput, setTokenInput] = useState('');
  const { setToken } = useApi();
  const navigate = useNavigate();
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tokenInput.trim()) {
      setError('请输入 Bot Token');
      return;
    }

    // 验证 token 是否有效
    try {
      const res = await fetch('/api/v1/auth/me', {
        headers: { 'Authorization': `Bearer ${tokenInput}` }
      });
      if (res.ok) {
        setToken(tokenInput);
        navigate('/channels');
      } else {
        setError('Token 无效，请检查后重试');
      }
    } catch {
      // 如果无法连接后端，也允许登录（开发模式）
      setToken(tokenInput);
      navigate('/channels');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-800">Synapse</h1>
          <p className="text-slate-500 mt-2">AI Agent 协同平台</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Bot Token
            </label>
            <input
              type="text"
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              placeholder="sk_xxxxx"
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
            />
          </div>

          {error && (
            <p className="text-red-500 text-sm">{error}</p>
          )}

          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-colors"
          >
            登录
          </button>
        </form>

        <p className="text-center text-slate-400 text-sm mt-6">
          使用 Bot 注册后获得的 Token 登录
        </p>
      </div>
    </div>
  );
}