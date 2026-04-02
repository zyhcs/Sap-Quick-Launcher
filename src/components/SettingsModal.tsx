import { useState, useEffect, useRef, useCallback } from 'react';
import { Theme, Language } from '../types';
import { Gear, X, Keyboard, Record, Info, PlayCircle, ArrowRight, Check, DownloadSimple, UploadSimple, Palette, Warning, Spinner } from '@phosphor-icons/react';

export type BgEffect = 'starlight' | 'nebula' | 'starfield' | 'meteor';

// 预设主题色
export const PRESET_COLORS = [
  { name: '翠绿', nameEn: 'Emerald', value: '#22C55E', hover: '#4ADE80' },
  { name: '蓝色', nameEn: 'Blue', value: '#3B82F6', hover: '#60A5FA' },
  { name: '紫色', nameEn: 'Purple', value: '#8B5CF6', hover: '#A78BFA' },
  { name: '橙色', nameEn: 'Orange', value: '#F97316', hover: '#FB923C' },
  { name: '粉色', nameEn: 'Pink', value: '#EC4899', hover: '#F472B6' },
  { name: '青色', nameEn: 'Cyan', value: '#06B6D4', hover: '#22D3EE' },
  { name: '红色', nameEn: 'Red', value: '#EF4444', hover: '#F87171' },
  { name: '靛蓝', nameEn: 'Indigo', value: '#6366F1', hover: '#818CF8' },
];

export interface Settings {
  showBackground: boolean;
  hotkey: string;
  bgEffect: BgEffect;
  /** 主题色 */
  primaryColor?: string;
  primaryColorHover?: string;
}

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme: Theme;
  lang: Language;
  settings: Settings;
  onSave: (settings: Settings) => void;
  onReplayTour?: () => void;
  onImport: () => void;
  onExport: () => void;
}

export default function SettingsModal({ isOpen, onClose, theme, lang, settings, onSave, onReplayTour, onImport, onExport }: SettingsModalProps) {
  const [showBackground] = useState(settings.showBackground);
  const [bgEffect] = useState<BgEffect>(settings.bgEffect ?? 'starlight');
  const [hotkey, setHotkey] = useState(settings.hotkey);
  const [primaryColor, setPrimaryColor] = useState(settings.primaryColor || '#22C55E');
  const [primaryColorHover, setPrimaryColorHover] = useState(settings.primaryColorHover || '#4ADE80');
  const [recording, setRecording] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [checkingHotkey, setCheckingHotkey] = useState(false);
  const [hotkeyAvailable, setHotkeyAvailable] = useState<boolean | null>(null);
  const hotkeyInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setHotkey(settings.hotkey);
    setPrimaryColor(settings.primaryColor || '#22C55E');
    setPrimaryColorHover(settings.primaryColorHover || '#4ADE80');
  }, [settings]);

  // 当recording变为true时，聚焦输入框
  useEffect(() => {
    if (recording && hotkeyInputRef.current) {
      hotkeyInputRef.current.focus();
    }
  }, [recording]);

  const isDark = theme === 'dark';

  // 快捷键录制 - 使用 document 级别的事件监听
  const handleRecordingKeyDown = useCallback((e: KeyboardEvent) => {
    if (!recording) return;
    e.preventDefault();
    e.stopPropagation();

    const modifiers: string[] = [];
    if (e.ctrlKey) modifiers.push('Ctrl');
    if (e.altKey) modifiers.push('Alt');
    if (e.shiftKey) modifiers.push('Shift');

    const key = e.key.length === 1 ? e.key.toUpperCase() : e.key;

    if (!['Control', 'Alt', 'Shift', 'Meta'].includes(key)) {
      setHotkey([...modifiers, key].join('+'));
      setRecording(false);
      setHotkeyAvailable(null); // 重置验证状态
    }
  }, [recording]);

  // 添加/移除 document 事件监听
  useEffect(() => {
    if (recording) {
      document.addEventListener('keydown', handleRecordingKeyDown, true);
    }
    return () => {
      document.removeEventListener('keydown', handleRecordingKeyDown, true);
    };
  }, [recording, handleRecordingKeyDown]);

  const handleSave = async () => {
    // 如果快捷键改变了，先验证是否可用
    if (hotkey !== settings.hotkey) {
      setCheckingHotkey(true);
      try {
        const { invoke } = await import('@tauri-apps/api/core');
        const available = await invoke<boolean>('check_hotkey_available', { hotkey });
        setHotkeyAvailable(available);
        
        if (!available) {
          setCheckingHotkey(false);
          return; // 快捷键冲突，不保存
        }
        
        // 保存设置
        onSave({ showBackground, hotkey, bgEffect, primaryColor, primaryColorHover });
        
        // 保存快捷键配置并重启
        await invoke('save_hotkey_config', { hotkey });
        
        // 提示用户即将重启
        setTimeout(() => {
          invoke('restart_app').catch(console.error);
        }, 500);
        
      } catch (e) {
        console.error('Failed to check/save hotkey:', e);
        setCheckingHotkey(false);
        return;
      }
    } else {
      // 快捷键未改变，直接保存
      onSave({ showBackground, hotkey, bgEffect, primaryColor, primaryColorHover });
      onClose();
    }
  };

  // 选择预设颜色
  const selectPresetColor = (color: typeof PRESET_COLORS[0]) => {
    setPrimaryColor(color.value);
    setPrimaryColorHover(color.hover);
  };

  const t = {
    zh: {
      settings: '设置',
      hotkey: '呼出快捷键',
      hotkeyDesc: '全局快捷键用于呼出/隐藏应用',
      pressKey: '按下任意键组合...',
      reset: '重置',
      resetDesc: '恢复默认设置 (Ctrl+Shift+Space)',
      save: '保存',
      cancel: '取消',
      restartTip: '修改快捷键后需重启应用才能生效',
      hotkeyConflict: '快捷键冲突，已被其他应用占用',
      hotkeyAvailable: '快捷键可用',
      restarting: '正在重启应用...',
      replayTour: '重新播放引导',
      replayTourDesc: '再次查看操作引导步骤',
      import: '导入连接',
      export: '导出连接',
      importDesc: '从文件导入连接数据',
      exportDesc: '将连接数据导出到文件',
      themeColor: '主题色',
      themeColorDesc: '自定义按钮和高亮颜色',
      presetColors: '预设颜色',
      customColor: '自定义颜色',
    },
    en: {
      settings: 'Settings',
      hotkey: 'Toggle Hotkey',
      hotkeyDesc: 'Global shortcut to show/hide app',
      pressKey: 'Press any key combo...',
      reset: 'Reset',
      resetDesc: 'Restore defaults (Ctrl+Shift+Space)',
      save: 'Save',
      cancel: 'Cancel',
      restartTip: 'Hotkey changes require restart to take effect',
      hotkeyConflict: 'Hotkey conflict - already in use by another app',
      hotkeyAvailable: 'Hotkey is available',
      restarting: 'Restarting app...',
      replayTour: 'Replay Onboarding Tour',
      replayTourDesc: 'View the step-by-step guide again',
      import: 'Import Connections',
      export: 'Export Connections',
      importDesc: 'Import connections from file',
      exportDesc: 'Export connections to file',
      themeColor: 'Theme Color',
      themeColorDesc: 'Customize button and highlight colors',
      presetColors: 'Preset Colors',
      customColor: 'Custom Color',
    }
  };

  const text = t[lang];

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className={`modal-content w-[520px] ${mounted ? 'animate-slide-up' : 'opacity-0'}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="modal-header">
          <h2 className="modal-title flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-[var(--radius-md)] flex items-center justify-center bg-[var(--primary-dim)] text-[var(--primary)]">
              <Gear size={18} />
            </div>
            {text.settings}
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-[var(--radius-md)] transition-all duration-200 hover:bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="modal-body space-y-4 max-h-[60vh] overflow-y-auto">
          {/* 主题色设置 */}
          <div className="p-4 rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--bg-input)]">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-[var(--radius-md)] flex items-center justify-center" style={{ backgroundColor: `${primaryColor}20` }}>
                <Palette size={18} style={{ color: primaryColor }} />
              </div>
              <div>
                <p className="text-sm font-semibold text-[var(--text-primary)]">
                  {text.themeColor}
                </p>
                <p className="text-xs text-[var(--text-tertiary)]">
                  {text.themeColorDesc}
                </p>
              </div>
            </div>

            {/* 预设颜色 */}
            <div className="mb-4">
              <p className="text-xs font-medium text-[var(--text-secondary)] mb-2">{text.presetColors}</p>
              <div className="flex flex-wrap gap-2">
                {PRESET_COLORS.map((color) => (
                  <button
                    key={color.value}
                    onClick={() => selectPresetColor(color)}
                    className={`
                      w-10 h-10 rounded-[var(--radius-md)] transition-all duration-200
                      hover:scale-110 hover:shadow-lg
                      ${primaryColor === color.value ? 'ring-2 ring-offset-2 ring-offset-[var(--bg-card-solid)] ring-white/50 scale-110' : ''}
                    `}
                    style={{ backgroundColor: color.value }}
                    title={lang === 'zh' ? color.name : color.nameEn}
                  />
                ))}
              </div>
            </div>

            {/* 自定义颜色 */}
            <div>
              <p className="text-xs font-medium text-[var(--text-secondary)] mb-2">{text.customColor}</p>
              <div className="flex items-center gap-3">
                <div className="flex-1 flex items-center gap-2">
                  <input
                    type="color"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="w-10 h-10 rounded-[var(--radius-md)] cursor-pointer border-none bg-transparent"
                  />
                  <input
                    type="text"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="flex-1 input text-xs font-mono"
                    placeholder="#22C55E"
                  />
                </div>
                {/* 预览按钮 */}
                <button
                  className="btn btn-primary px-4 py-2 text-sm"
                  style={{ 
                    background: `linear-gradient(135deg, ${primaryColor}, ${primaryColorHover || primaryColor})`,
                    boxShadow: `0 4px 12px ${primaryColor}40`
                  }}
                >
                  {lang === 'zh' ? '预览' : 'Preview'}
                </button>
              </div>
            </div>
          </div>

          {/* 导入导出 */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => { onImport(); onClose(); }}
              className="p-4 rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--bg-input)] hover:border-[var(--primary)]/30 hover:bg-[var(--primary-dim)] transition-all duration-200 text-left"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-[var(--radius-md)] flex items-center justify-center bg-emerald-500/15 text-emerald-500">
                  <DownloadSimple size={18} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-[var(--text-primary)]">
                    {text.import}
                  </p>
                  <p className="text-xs text-[var(--text-tertiary)]">
                    {text.importDesc}
                  </p>
                </div>
              </div>
            </button>

            <button
              onClick={() => { onExport(); onClose(); }}
              className="p-4 rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--bg-input)] hover:border-[var(--primary)]/30 hover:bg-[var(--primary-dim)] transition-all duration-200 text-left"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-[var(--radius-md)] flex items-center justify-center bg-amber-500/15 text-amber-500">
                  <UploadSimple size={18} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-[var(--text-primary)]">
                    {text.export}
                  </p>
                  <p className="text-xs text-[var(--text-tertiary)]">
                    {text.exportDesc}
                  </p>
                </div>
              </div>
            </button>
          </div>

          {/* 快捷键设置 */}
          <div
            className={`p-4 rounded-[var(--radius-lg)] border transition-all duration-200 ${
              focusedField === 'hotkey'
                ? 'border-[var(--primary)]/40 bg-[var(--primary-dim)]'
                : 'border-[var(--border-default)] bg-[var(--bg-input)]'
            }`}
            onClick={() => setFocusedField('hotkey')}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-[var(--radius-md)] flex items-center justify-center bg-blue-500/15 text-blue-500">
                  <Keyboard size={18} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-[var(--text-primary)]">
                    {text.hotkey}
                  </p>
                  <p className="text-xs text-[var(--text-tertiary)]">
                    {text.hotkeyDesc}
                  </p>
                </div>
              </div>
            </div>

            {/* 快捷键显示/输入区 */}
            <div className="mt-4 flex items-center gap-3">
              <div
                className={`flex-1 h-12 rounded-[var(--radius-md)] border flex items-center justify-center font-mono text-sm font-semibold transition-all duration-200 ${
                  recording
                    ? 'border-[var(--primary)]/60 bg-[var(--primary-dim)] text-[var(--primary)] animate-pulse'
                    : 'border-[var(--border-default)] bg-[var(--bg-card-solid)] text-[var(--text-secondary)]'
                }`}
                onClick={() => setRecording(true)}
              >
                {recording ? (
                  <span className="flex items-center gap-2">
                    <Record size={14} className="text-red-500" />
                    {text.pressKey}
                  </span>
                ) : (
                  hotkey || text.pressKey
                )}
              </div>
              {recording && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setRecording(false);
                  }}
                  className="btn btn-secondary text-xs px-4 py-2"
                >
                  {text.cancel}
                </button>
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setHotkey('Ctrl+Shift+Space');
                  setRecording(false);
                }}
                className="btn btn-secondary text-xs px-4 py-2"
              >
                {text.reset}
              </button>
            </div>

            {/* 重启提示 */}
            <div className="mt-3 text-xs text-center text-amber-500">
              <Info size={14} className="mr-1 inline" />
              {text.restartTip}
            </div>
          </div>

          {/* 重新播放引导 */}
          {onReplayTour && (
            <div
              className="p-4 rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--bg-input)] hover:border-[var(--primary)]/30 hover:bg-[var(--primary-dim)] transition-all duration-200 cursor-pointer"
              onClick={() => { onReplayTour(); onClose(); }}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-[var(--radius-md)] flex items-center justify-center bg-cyan-500/15 text-cyan-500">
                  <PlayCircle size={18} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-[var(--text-primary)]">
                    {text.replayTour}
                  </p>
                  <p className="text-xs text-[var(--text-tertiary)]">
                    {text.replayTourDesc}
                  </p>
                </div>
                <ArrowRight size={16} className="ml-auto text-[var(--text-tertiary)]" />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="modal-footer">
          {/* 快捷键冲突提示 */}
          {hotkeyAvailable === false && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/10 text-red-500 text-sm">
              <Warning size={16} weight="fill" />
              {text.hotkeyConflict}
            </div>
          )}
          
          {/* 重启提示 */}
          {checkingHotkey && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--primary-dim)] text-[var(--primary)] text-sm">
              <Spinner size={16} className="animate-spin" />
              {text.restarting}
            </div>
          )}
          
          <button onClick={onClose} className="btn btn-secondary" disabled={checkingHotkey}>
            <X size={16} />
            {text.cancel}
          </button>
          <button onClick={handleSave} className="btn btn-primary" disabled={checkingHotkey}>
            {checkingHotkey ? <Spinner size={16} className="animate-spin" /> : <Check size={16} weight="bold" />}
            {text.save}
          </button>
        </div>

        {/* 隐藏的输入框用于聚焦 */}
        <input
          ref={hotkeyInputRef}
          type="text"
          className="fixed opacity-0 pointer-events-none"
          style={{ left: '-9999px', top: '-9999px' }}
          readOnly
        />
      </div>
    </div>
  );
}
