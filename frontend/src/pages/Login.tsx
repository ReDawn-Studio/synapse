import { useState } from 'react';
import { useApi } from '../hooks/useApi';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const [tokenInput, setTokenInput] = useState('');
  const { setToken, request, handleError } = useApi();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tokenInput.trim()) {
      setError('请输入 Bot Token');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await request('/auth/me', {
        headers: { 'Authorization': `Bearer ${tokenInput}` }
      });
      setToken(tokenInput);
      navigate('/channels');
    } catch (err) {
      const apiError = handleError(err);
      
      if (apiError.type === 'AUTH_REQUIRED' || apiError.statusCode === 401) {
        setError('Token 无效，请检查后重试');
      } else if (apiError.type === 'NETWORK_ERROR') {
        // 如果无法连接后端，也允许登录（开发模式）
        setToken(tokenInput);
        navigate('/channels');
      } else {
        setError(apiError.message);
      }
    } finally {
      setLoading(false);
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
              disabled={loading}
            />
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              ⚠️ {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                验证中...
              </>
            ) : (
              '登录'
            )}
          </button>
        </form>

        <p className="text-center text-slate-400 text-sm mt-6">
          使用 Bot 注册后获得的 Token 登录
        </p>
      </div>
    </div>
  );
}
