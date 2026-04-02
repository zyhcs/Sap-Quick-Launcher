import { useState, useEffect } from 'react';
import { Connection, Group, Translations, Theme } from '../types';
import { X, PencilSimple, Plus, Eye, EyeSlash, CaretDown, Check, FolderSimple } from '@phosphor-icons/react';

interface ConnectionFormProps {
  connection: Connection | null;
  groups?: Group[];
  t: Translations;
  theme?: Theme;
  onSave: (form: Omit<Connection, 'id' | 'env'>) => void;
  onCancel: () => void;
  isEditing: boolean;
}

export default function ConnectionForm({ connection, groups = [], t, theme = 'dark', onSave, onCancel, isEditing }: ConnectionFormProps) {
  // 新建连接时清空所有字段，编辑时保留原值
  const [form, setForm] = useState<Omit<Connection, 'id' | 'env'>>({
    name: connection?.name || '',
    sysId: connection?.sysId || '',
    client: connection?.client || '',
    user: connection?.user || '',
    pwd: connection?.pwd || '',
    lang: connection?.lang || '',  // 新建时为空，编辑时保留原值
    remark: connection?.remark || '',
    groupId: connection?.groupId,
    order: connection?.order ?? 0,
    lastUsed: connection?.lastUsed ?? 0,
    useCount: connection?.useCount ?? 0,
  });
  const [showPwd, setShowPwd] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = theme === 'dark';

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(form);
  };

  const getFieldClass = (fieldName: string) => {
    const baseClass = `w-full h-11 border rounded-lg px-4 text-sm outline-none transition-all duration-200 ${
      isDark
        ? 'soft-input text-white placeholder:text-white/30 bg-[#1C1C1E]'
        : 'soft-input text-gray-800 placeholder:text-gray-400 bg-[#F2F2F7]'
    }`;

    // 只保留边框变化，移除底部动画线
    const focusClass = focusedField === fieldName
      ? 'border-[var(--primary)]'
      : 'border-[var(--border-default)]';

    return `${baseClass} ${focusClass}`;
  };

  const getLabelClass = (fieldName: string) => {
    const baseClass = `block text-[11px] font-bold uppercase tracking-wider mb-2 transition-colors duration-300 ${
      isDark ? 'text-white/50' : 'text-gray-500'
    }`;
    const activeClass = focusedField === fieldName
      ? isDark ? 'text-white/90' : 'text-gray-700'
      : '';
    return `${baseClass} ${activeClass}`;
  };

  // 语言选项
  const langOptions = [
    { value: 'ZH', label: '中文 ZH', icon: '🇨🇳' },
    { value: 'EN', label: 'English', icon: '🇺🇸' },
    { value: 'DE', label: 'Deutsch', icon: '🇩🇪' },
    { value: 'JA', label: '日本語', icon: '🇯🇵' },
  ];

  return (
    <form onSubmit={handleSubmit} className={`transition-all duration-500 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
      {/* Header */}
      <div className={`relative px-6 pt-5 pb-4 ${
        isDark ? 'border-b border-white/5' : 'border-b border-gray-200/50'
      }`}>
        {/* 柔和装饰线 */}
        <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-24 h-[2px] rounded-full ${
          isDark ? 'bg-gradient-to-r from-transparent via-white/20 to-transparent' : 'bg-gradient-to-r from-transparent via-gray-300 to-transparent'
        }`} />

        <div className="flex justify-between items-center">
          <h2 className={`text-[15px] font-bold flex items-center gap-3 ${
            isDark ? 'text-white' : 'text-gray-800'
          }`}>
            <div className={`w-9 h-9 rounded-2xl flex items-center justify-center ${
              isEditing
                ? isDark
                  ? 'neumorphic-btn text-white/80'
                  : 'neumorphic-btn text-gray-700'
                : isDark
                  ? 'glow-success text-emerald-300'
                  : 'glow-success text-emerald-600'
            }`}>
              {isEditing ? <PencilSimple size={18} /> : <Plus size={18} />}
            </div>
            <span>{isEditing ? t.modal.edit : t.modal.new}</span>
          </h2>
          <button
            type="button"
            onClick={onCancel}
            className={`w-9 h-9 flex items-center justify-center rounded-2xl transition-all duration-300 ${
              isDark
                ? 'neumorphic-btn text-white/60 hover:text-white'
                : 'neumorphic-btn text-gray-600 hover:text-gray-900'
            }`}
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Form Body */}
      <div className="px-6 py-5 overflow-y-auto max-h-[calc(85vh-120px)]">
        {/* Row 1: Name + SysId */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="relative">
            <label className={getLabelClass('name')}>
              {t.form.name}
            </label>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              onFocus={() => setFocusedField('name')}
              onBlur={() => setFocusedField(null)}
              required
              placeholder=""
              className={getFieldClass('name')}
            />
          </div>
          <div className="relative">
            <label className={getLabelClass('sysId')}>
              {t.form.sysId}
            </label>
            <input
              type="text"
              name="sysId"
              value={form.sysId}
              onChange={handleChange}
              onFocus={() => setFocusedField('sysId')}
              onBlur={() => setFocusedField(null)}
              required
              placeholder=""
              className={getFieldClass('sysId')}
            />
          </div>
        </div>

        {/* Row 2: Client + User */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="relative">
            <label className={getLabelClass('client')}>
              {t.form.client}
            </label>
            <input
              type="text"
              name="client"
              value={form.client}
              onChange={handleChange}
              onFocus={() => setFocusedField('client')}
              onBlur={() => setFocusedField(null)}
              required
              placeholder=""
              className={getFieldClass('client')}
            />
          </div>
          <div className="relative">
            <label className={getLabelClass('user')}>
              {t.form.user}
            </label>
            <input
              type="text"
              name="user"
              value={form.user}
              onChange={handleChange}
              onFocus={() => setFocusedField('user')}
              onBlur={() => setFocusedField(null)}
              required
              placeholder=""
              className={getFieldClass('user')}
            />
          </div>
        </div>

        {/* Row 3: Password + Language */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="relative">
            <label className={getLabelClass('pwd')}>
              {t.form.pwd}
            </label>
            <div className="relative">
              <input
                type={showPwd ? 'text' : 'password'}
                name="pwd"
                value={form.pwd}
                onChange={handleChange}
                onFocus={() => setFocusedField('pwd')}
                onBlur={() => setFocusedField(null)}
                required
                placeholder=""
                className={`${getFieldClass('pwd')} pr-11`}
              />
              <button
                type="button"
                onClick={() => setShowPwd(!showPwd)}
                className={`absolute right-3 top-1/2 -translate-y-1/2 bg-transparent border-none cursor-pointer transition-all duration-300 ${
                  isDark ? 'text-white/40 hover:text-white' : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                {showPwd ? <EyeSlash size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
          <div className="relative">
            <label className={getLabelClass('lang')}>
              {t.form.lang}
            </label>
            <div className="relative">
              <select
                name="lang"
                value={form.lang}
                onChange={handleChange}
                onFocus={() => setFocusedField('lang')}
                onBlur={() => setFocusedField(null)}
                required
                className={`${getFieldClass('lang')} appearance-none cursor-pointer pr-10`}
                style={{
                  color: isDark ? (form.lang ? '#fff' : '#ffffff66') : (form.lang ? '#1f2937' : '#6b728066')
                }}
              >
                {/* 默认空选项 */}
                <option value="" className={isDark ? 'bg-[#1a1a24] text-white' : 'bg-white text-gray-800'}>
                  {isDark ? '' : ''}
                </option>
                {langOptions.map(opt => (
                  <option key={opt.value} value={opt.value} className={isDark ? 'bg-[#1a1a24] text-white' : 'bg-white text-gray-800'}>
                    {opt.label}
                  </option>
                ))}
              </select>
              {/* Custom dropdown arrow */}
              <div className={`absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none transition-all duration-300 ${
                focusedField === 'lang' ? isDark ? 'text-white/80 rotate-180' : 'text-gray-600 rotate-180' : isDark ? 'text-white/40' : 'text-gray-400'
              }`}>
                <CaretDown size={14} />
              </div>
            </div>
          </div>
        </div>

        {/* Row 4: Group + Remark */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          {/* 分组选择 */}
          <div className="relative">
            <label className={getLabelClass('groupId')}>
              {t.group.title}
            </label>
            <div className="relative">
              <select
                name="groupId"
                value={form.groupId || ''}
                onChange={handleChange}
                onFocus={() => setFocusedField('groupId')}
                onBlur={() => setFocusedField(null)}
                className={`${getFieldClass('groupId')} appearance-none cursor-pointer pr-10`}
                style={{
                  color: isDark ? (form.groupId ? '#fff' : '#ffffff66') : (form.groupId ? '#1f2937' : '#6b728066')
                }}
              >
                <option value="" className={isDark ? 'bg-[#1a1a24] text-white' : 'bg-white text-gray-800'}>
                  {t.group.noGroup}
                </option>
                {groups.map(g => (
                  <option key={g.id} value={g.id} className={isDark ? 'bg-[#1a1a24] text-white' : 'bg-white text-gray-800'}>
                    {g.name}
                  </option>
                ))}
              </select>
              <div className={`absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none transition-all duration-300 ${
                focusedField === 'groupId' ? isDark ? 'text-white/80' : 'text-gray-600' : isDark ? 'text-white/40' : 'text-gray-400'
              }`}>
                <FolderSimple size={14} />
              </div>
            </div>
          </div>

          {/* Remark */}
          <div className="relative">
            <label className={getLabelClass('remark')}>
              {t.form.remark}
            </label>
            <input
              type="text"
              name="remark"
              value={form.remark}
              onChange={handleChange}
              onFocus={() => setFocusedField('remark')}
              onBlur={() => setFocusedField(null)}
              placeholder=""
              className={getFieldClass('remark')}
            />
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex justify-end gap-3 px-6 pb-5">
        <button
          type="button"
          onClick={onCancel}
          className={`flex items-center gap-1.5 px-5 py-2.5 rounded-lg text-sm font-medium cursor-pointer transition-all duration-200 ${
            isDark
              ? 'soft-btn text-white/70 hover:text-white'
              : 'soft-btn text-gray-600 hover:text-gray-900'
          }`}
        >
          <X size={16} />
          {t.modal.cancel}
        </button>
        <button
          type="submit"
          className={`flex items-center gap-1.5 px-6 py-2.5 rounded-lg text-sm font-bold cursor-pointer transition-all duration-200 ${
            isDark
              ? 'glow-success soft-btn text-emerald-300 hover:text-white'
              : 'glow-success soft-btn text-emerald-600 hover:text-emerald-700'
          }`}
        >
          <Check size={16} weight="bold" />
          {isEditing ? t.modal.save : t.modal.create}
        </button>
      </div>
    </form>
  );
}