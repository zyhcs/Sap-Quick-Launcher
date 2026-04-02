import { useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { Theme, Language } from '../types';
import { WarningCircle } from '@phosphor-icons/react';

interface ActivationModalProps {
  theme: Theme;
  lang: Language;
  machineCode: string;
  onActivated: () => void;
}

export default function ActivationModal({ theme, lang, machineCode, onActivated }: ActivationModalProps) {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const isDark = theme === 'dark';

  const zh = lang === 'zh';

  const handleActivate = async () => {
    if (!code.trim()) {
      setError(zh ? '请输入激活码' : 'Please enter activation code');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await invoke('activate_license', { code: code.trim() });
      onActivated();
    } catch (e: unknown) {
      setError(typeof e === 'string' ? e : (zh ? '激活失败，请检查激活码' : 'Activation failed'));
    } finally {
      setLoading(false);
    }
  };

  const handleCopyMachineCode = () => {
    navigator.clipboard.writeText(machineCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  // 格式化输入：自动插入连字符
  const handleCodeInput = (val: string) => {
    // 去除非字母数字和连字符
    const cleaned = val.replace(/[^A-Za-z0-9\-]/g, '').toUpperCase();
    setCode(cleaned);
    setError('');
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      {/* 背景遮罩 */}
      <div className={`absolute inset-0 ${isDark ? 'bg-black/80' : 'bg-black/40'} backdrop-blur-sm`} />

      {/* 弹窗主体 */}
      <div className={`relative w-[480px] rounded-2xl border shadow-2xl p-8 ${
        isDark
          ? 'bg-[#0e0e18] border-white/10'
          : 'bg-white border-gray-200'
      }`}>

        {/* Logo + 标题 */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4"
            style={{
              background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
              boxShadow: '0 0 30px rgba(59,130,246,0.3)'
            }}>
            <span className="text-3xl font-black"
              style={{ background: 'linear-gradient(135deg, #60a5fa, #a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              S
            </span>
          </div>
          <h2 className={`text-xl font-bold mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            SAP Quick Launcher
          </h2>
          <p className={`text-sm ${isDark ? 'text-white/40' : 'text-gray-400'}`}>
            {zh ? '请激活软件后使用' : 'Please activate to continue'}
          </p>
        </div>

        {/* 机器码展示 */}
        <div className={`rounded-xl p-4 mb-6 ${isDark ? 'bg-white/5 border border-white/10' : 'bg-gray-50 border border-gray-200'}`}>
          <p className={`text-xs mb-2 font-medium ${isDark ? 'text-white/40' : 'text-gray-400'}`}>
            {zh ? '您的机器码（发送给软件提供方以获取激活码）' : 'Your Machine Code (send to software provider)'}
          </p>
          <div className="flex items-center gap-2">
            <code className={`flex-1 text-xs font-mono truncate ${isDark ? 'text-blue-300' : 'text-blue-600'}`}>
              {machineCode || '获取中...'}
            </code>
            <button
              onClick={handleCopyMachineCode}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                copied
                  ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                  : isDark
                    ? 'bg-white/10 text-white/60 hover:bg-white/20 hover:text-white border border-white/10'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border border-gray-200'
              }`}
            >
              {copied ? (zh ? '已复制' : 'Copied!') : (zh ? '复制' : 'Copy')}
            </button>
          </div>
        </div>

        {/* 激活码输入 */}
        <div className="mb-4">
          <label className={`block text-xs font-medium mb-2 ${isDark ? 'text-white/60' : 'text-gray-500'}`}>
            {zh ? '激活码' : 'Activation Code'}
          </label>
          <input
            type="text"
            value={code}
            onChange={(e) => handleCodeInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleActivate(); }}
            placeholder="SAP-XXXX-XXXX-XXXX-XXXX"
            spellCheck={false}
            className={`w-full px-4 py-3 rounded-xl text-sm font-mono tracking-widest transition-all outline-none border ${
              error
                ? 'border-red-500/50 bg-red-500/5'
                : isDark
                  ? 'bg-white/5 border-white/10 text-white placeholder-white/20 focus:border-blue-500/50 focus:bg-white/8'
                  : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-300 focus:border-blue-500 focus:bg-white'
            }`}
            maxLength={24}
            autoFocus
          />
          {error && (
            <p className="mt-2 text-xs text-red-400 flex items-center gap-1">
              <WarningCircle size={14} />
              {error}
            </p>
          )}
        </div>

        {/* 激活按钮 */}
        <button
          onClick={handleActivate}
          disabled={loading || !code.trim()}
          className={`w-full py-3 rounded-xl text-sm font-semibold transition-all ${
            loading || !code.trim()
              ? isDark ? 'bg-white/5 text-white/20 cursor-not-allowed' : 'bg-gray-100 text-gray-300 cursor-not-allowed'
              : isDark
                ? 'bg-gradient-to-r from-blue-600 to-violet-600 text-white hover:from-blue-500 hover:to-violet-500 shadow-lg hover:shadow-blue-500/25 active:scale-[0.98]'
                : 'bg-gradient-to-r from-gray-800 to-gray-700 text-white hover:from-gray-700 hover:to-gray-600 shadow-lg shadow-gray-800/20 active:scale-[0.98]'
          }`}
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              {zh ? '验证中...' : 'Verifying...'}
            </span>
          ) : (
            zh ? '立即激活' : 'Activate Now'
          )}
        </button>

        {/* 提示文字 */}
        <p className={`text-center text-xs mt-4 ${isDark ? 'text-white/25' : 'text-gray-300'}`}>
          {zh
            ? '激活码与机器绑定，请联系软件提供方获取'
            : 'License is bound to your machine. Contact provider to obtain one.'}
        </p>
      </div>
    </div>
  );
}
