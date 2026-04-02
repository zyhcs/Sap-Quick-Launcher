import { useState } from 'react';
import { Translations, Theme, Language, Group, Connection } from '../types';
import { X, FolderSimple, Plus, PencilSimple, Trash, Folders, Check, Warning } from '@phosphor-icons/react';

interface GroupManageModalProps {
  isOpen: boolean;
  onClose: () => void;
  t: Translations;
  theme: Theme;
  lang: Language;
  groups: Group[];
  connections: Connection[];
  onCreateGroup: (name: string) => void;
  onRenameGroup: (groupId: string, newName: string) => void;
  onDeleteGroup: (groupId: string) => void;
}

export default function GroupManageModal({
  isOpen,
  onClose,
  t,
  theme,
  lang,
  groups,
  connections,
  onCreateGroup,
  onRenameGroup,
  onDeleteGroup,
}: GroupManageModalProps) {
  const isDark = theme === 'dark';
  const [newGroupName, setNewGroupName] = useState('');
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
  const [editName, setEditName] = useState('');
  const [deletingGroupId, setDeletingGroupId] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCreate = () => {
    if (newGroupName.trim()) {
      onCreateGroup(newGroupName.trim());
      setNewGroupName('');
    }
  };

  const handleRename = () => {
    if (editingGroup && editName.trim()) {
      onRenameGroup(editingGroup.id, editName.trim());
      setEditingGroup(null);
      setEditName('');
    }
  };

  const handleDelete = (groupId: string) => {
    onDeleteGroup(groupId);
    setDeletingGroupId(null);
  };

  const getConnectionCount = (groupId: string | undefined) => {
    return connections.filter(c => c.groupId === groupId).length;
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-content max-w-[420px] animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="modal-header">
          <div className="flex items-center gap-3">
            <div className={`
              w-9 h-9 rounded-xl flex items-center justify-center
              ${isDark ? 'bg-[var(--primary-dim)]' : 'bg-[var(--primary)]/10'}
            `}>
              <Folders size={20} weight="fill" className="text-[var(--primary)]" />
            </div>
            <h2 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {t.group.title}
            </h2>
          </div>
          <button
            onClick={onClose}
            className={`
              p-2 rounded-lg transition-all duration-200
              ${isDark ? 'hover:bg-white/10 text-white/50' : 'hover:bg-gray-100 text-gray-400'}
            `}
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="modal-body space-y-5">
          {/* 新建分组 */}
          <div className="space-y-2">
            <label className={`text-xs font-medium uppercase tracking-wider ${isDark ? 'text-white/40' : 'text-gray-500'}`}>
              {lang === 'zh' ? '创建新分组' : 'Create New Group'}
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                placeholder={t.group.new}
                className="input flex-1"
              />
              <button
                onClick={handleCreate}
                disabled={!newGroupName.trim()}
                className={`
                  px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200
                  flex items-center gap-2
                  ${newGroupName.trim()
                    ? 'bg-[var(--primary)] text-white hover:shadow-lg hover:shadow-[var(--primary)]/20'
                    : (isDark ? 'bg-white/5 text-white/30' : 'bg-gray-100 text-gray-400')
                  }
                `}
              >
                <Plus size={16} weight="bold" />
                {lang === 'zh' ? '创建' : 'Add'}
              </button>
            </div>
          </div>

          {/* 分组列表 */}
          <div className="space-y-2">
            <label className={`text-xs font-medium uppercase tracking-wider ${isDark ? 'text-white/40' : 'text-gray-500'}`}>
              {lang === 'zh' ? '已有分组' : 'Existing Groups'}
            </label>
            
            <div className="space-y-1.5 max-h-[280px] overflow-y-auto custom-scroll pr-1">
              {groups.length === 0 ? (
                <div className={`
                  text-center py-8 rounded-xl
                  ${isDark ? 'bg-white/[0.02] text-white/30' : 'bg-gray-50 text-gray-400'}
                `}>
                  <FolderSimple size={32} className="mx-auto mb-2 opacity-40" />
                  <p className="text-sm">{lang === 'zh' ? '暂无分组' : 'No groups yet'}</p>
                </div>
              ) : (
                groups.map(g => {
                  const count = getConnectionCount(g.id);
                  const isEditing = editingGroup?.id === g.id;
                  const isDeleting = deletingGroupId === g.id;
                  
                  return (
                    <div
                      key={g.id}
                      className={`
                        group rounded-xl transition-all duration-200 overflow-hidden
                        ${isDark 
                          ? 'bg-white/[0.03] hover:bg-white/[0.05]' 
                          : 'bg-gray-50/80 hover:bg-gray-100'
                        }
                        ${isEditing ? 'ring-2 ring-[var(--primary)]/30' : ''}
                      `}
                    >
                      {isEditing ? (
                        /* 编辑模式 */
                        <div className="p-3 flex items-center gap-2">
                          <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleRename();
                              if (e.key === 'Escape') { setEditingGroup(null); setEditName(''); }
                            }}
                            autoFocus
                            className="input flex-1 text-sm py-1.5"
                          />
                          <button
                            onClick={handleRename}
                            className="p-2 rounded-lg bg-[var(--primary)] text-white hover:shadow-lg transition-all"
                          >
                            <Check size={16} weight="bold" />
                          </button>
                          <button
                            onClick={() => { setEditingGroup(null); setEditName(''); }}
                            className={`p-2 rounded-lg transition-all ${isDark ? 'hover:bg-white/10 text-white/50' : 'hover:bg-gray-200 text-gray-500'}`}
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ) : isDeleting ? (
                        /* 删除确认模式 */
                        <div className="p-3">
                          <div className="flex items-center gap-2 mb-2">
                            <Warning size={16} weight="fill" className="text-amber-500" />
                            <span className={`text-sm ${isDark ? 'text-white/80' : 'text-gray-700'}`}>
                              {lang === 'zh' ? '确定删除此分组？' : 'Delete this group?'}
                            </span>
                          </div>
                          <p className={`text-xs mb-3 ${isDark ? 'text-white/40' : 'text-gray-500'}`}>
                            {lang === 'zh' 
                              ? `分组内的 ${count} 个连接将移至未分组`
                              : `${count} connections will be moved to Ungrouped`
                            }
                          </p>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleDelete(g.id)}
                              className="flex-1 py-2 rounded-lg bg-red-500 text-white text-sm font-medium hover:bg-red-600 transition-all"
                            >
                              {t.group.delete}
                            </button>
                            <button
                              onClick={() => setDeletingGroupId(null)}
                              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                                isDark ? 'bg-white/10 text-white/80 hover:bg-white/15' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                              }`}
                            >
                              {lang === 'zh' ? '取消' : 'Cancel'}
                            </button>
                          </div>
                        </div>
                      ) : (
                        /* 正常显示模式 */
                        <div className="p-3 flex items-center gap-3">
                          <div className={`
                            w-8 h-8 rounded-lg flex items-center justify-center
                            ${isDark ? 'bg-amber-500/10' : 'bg-amber-500/10'}
                          `}>
                            <FolderSimple size={18} weight="fill" className="text-amber-500" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-medium truncate ${isDark ? 'text-white/90' : 'text-gray-800'}`}>
                              {g.name}
                            </p>
                            <p className={`text-xs ${isDark ? 'text-white/40' : 'text-gray-500'}`}>
                              {count} {lang === 'zh' ? '个连接' : 'connections'}
                            </p>
                          </div>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => { setEditingGroup(g); setEditName(g.name); }}
                              className={`p-1.5 rounded-lg transition-all ${
                                isDark ? 'hover:bg-white/10 text-white/50' : 'hover:bg-gray-200 text-gray-500'
                              }`}
                              title={t.group.rename}
                            >
                              <PencilSimple size={14} />
                            </button>
                            <button
                              onClick={() => setDeletingGroupId(g.id)}
                              className={`p-1.5 rounded-lg transition-all ${
                                isDark ? 'hover:bg-red-500/20 text-red-400' : 'hover:bg-red-100 text-red-500'
                              }`}
                              title={t.group.delete}
                            >
                              <Trash size={14} />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* 未分组统计 */}
          <div className={`
            flex items-center gap-3 p-3 rounded-xl
            ${isDark ? 'bg-white/[0.02] border border-white/[0.05]' : 'bg-gray-50/50 border border-gray-100'}
          `}>
            <div className={`
              w-8 h-8 rounded-lg flex items-center justify-center
              ${isDark ? 'bg-white/5' : 'bg-gray-200'}
            `}>
              <FolderSimple size={18} className={isDark ? 'text-white/40' : 'text-gray-500'} />
            </div>
            <div className="flex-1">
              <p className={`text-sm font-medium ${isDark ? 'text-white/60' : 'text-gray-600'}`}>
                {t.group.noGroup}
              </p>
            </div>
            <span className={`text-sm font-medium ${isDark ? 'text-white/40' : 'text-gray-500'}`}>
              {getConnectionCount(undefined)} {lang === 'zh' ? '个' : ''}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
