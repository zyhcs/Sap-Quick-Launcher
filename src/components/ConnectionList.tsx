import { Connection, Theme, Translations } from '../types';
import { Play, PencilSimple, Trash, DotsSixVertical, Rocket } from '@phosphor-icons/react';

interface ConnectionListProps {
  connections: Connection[];
  selectedIds: Set<string>;
  theme: Theme;
  t: Translations;
  onToggleSelect: (id: string) => void;
  onEdit: (conn: Connection) => void;
  onDelete: (conn: Connection) => void;
  onLaunch: (conn: Connection) => void;
  onContextMenu: (e: React.MouseEvent, conn: Connection) => void;
  onDragStart?: (e: React.MouseEvent, conn: Connection) => void;
  isRecent?: boolean;
}

const ENV_COLORS = {
  prd: { bg: 'bg-red-500/10', text: 'text-red-400', label: 'PRD', dot: 'bg-red-500' },
  qas: { bg: 'bg-yellow-500/10', text: 'text-yellow-400', label: 'QAS', dot: 'bg-yellow-500' },
  dev: { bg: 'bg-green-500/10', text: 'text-green-400', label: 'DEV', dot: 'bg-green-500' },
};

export function ConnectionList({
  connections,
  selectedIds,
  theme,
  t,
  onToggleSelect,
  onEdit,
  onDelete,
  onLaunch,
  onContextMenu,
  isRecent,
}: ConnectionListProps) {
  return (
    <div className={`rounded-lg overflow-hidden border ${
      theme === 'dark' ? 'border-white/10 bg-white/5' : 'border-gray-200 bg-white/50'
    }`}>
      {/* 表头 */}
      <div className={`grid gap-2 px-4 py-2.5 text-xs font-semibold uppercase tracking-wider ${
        theme === 'dark' ? 'bg-white/[0.03] text-white/50' : 'bg-gray-100/50 text-gray-500'
      }`}
        style={{ gridTemplateColumns: '32px 32px 1fr 80px 80px 100px 60px 80px 100px' }}
      >
        <div></div>
        <div></div>
        <div>{t.form.name}</div>
        <div>{t.env.prd}</div>
        <div>{t.form.client}</div>
        <div>{t.form.user}</div>
        <div>{t.form.lang}</div>
        <div>{t.form.sysId}</div>
        <div className="text-right">{t.actions.launch}</div>
      </div>

      {/* 列表项 */}
      <div className="divide-y divide-white/5">
        {connections.map((conn) => {
          const envStyle = ENV_COLORS[conn.env || 'dev'];
          const isSelected = selectedIds.has(conn.id);

          return (
            <div
              key={conn.id}
              className={`grid gap-2 px-4 py-2.5 items-center group transition-colors cursor-pointer ${
                isSelected
                  ? theme === 'dark' ? 'bg-cyan-500/10' : 'bg-cyan-50'
                  : theme === 'dark' ? 'hover:bg-white/5' : 'hover:bg-gray-50/50'
              }`}
              style={{ gridTemplateColumns: '32px 32px 1fr 80px 80px 100px 60px 80px 100px' }}
              onContextMenu={(e) => onContextMenu(e, conn)}
            >
              {/* 拖拽把手 */}
              <div className={`opacity-0 group-hover:opacity-50 cursor-grab ${theme === 'dark' ? 'text-white/40' : 'text-gray-400'}`}>
                <DotsSixVertical size={14} />
              </div>

              {/* 选择框 */}
              <div onClick={(e) => { e.stopPropagation(); onToggleSelect(conn.id); }}>
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => {}}
                  className="w-4 h-4 rounded border cursor-pointer accent-cyan-500"
                />
              </div>

              {/* 名称 */}
              <div className={`text-sm font-medium truncate ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                {isRecent && <Rocket size={12} className="inline mr-1 text-cyan-400" />}
                {conn.name}
              </div>

              {/* 环境标签 */}
              <div>
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${envStyle.bg} ${envStyle.text}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${envStyle.dot}`} />
                  {envStyle.label}
                </span>
              </div>

              {/* 客户端 */}
              <div className={`text-sm ${theme === 'dark' ? 'text-white/70' : 'text-gray-600'}`}>
                {conn.client || '-'}
              </div>

              {/* 用户 */}
              <div className={`text-sm truncate ${theme === 'dark' ? 'text-white/70' : 'text-gray-600'}`}>
                {conn.user || '-'}
              </div>

              {/* 语言 */}
              <div className={`text-sm ${theme === 'dark' ? 'text-white/50' : 'text-gray-500'}`}>
                {conn.lang || '-'}
              </div>

              {/* 系统标识 */}
              <div className={`text-sm font-mono ${theme === 'dark' ? 'text-white/50' : 'text-gray-500'}`}>
                {conn.sysId || '-'}
              </div>

              {/* 操作按钮 */}
              <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={(e) => { e.stopPropagation(); onLaunch(conn); }}
                  className={`p-1.5 rounded transition-colors ${
                    theme === 'dark'
                      ? 'hover:bg-emerald-500/20 text-emerald-400'
                      : 'hover:bg-emerald-50 text-emerald-600'
                  }`}
                  title={t.actions.launch}
                >
                  <Play size={14} weight="fill" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); onEdit(conn); }}
                  className={`p-1.5 rounded transition-colors ${
                    theme === 'dark'
                      ? 'hover:bg-blue-500/20 text-blue-400'
                      : 'hover:bg-blue-50 text-blue-600'
                  }`}
                  title={t.actions.edit}
                >
                  <PencilSimple size={14} />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); onDelete(conn); }}
                  className={`p-1.5 rounded transition-colors ${
                    theme === 'dark'
                      ? 'hover:bg-red-500/20 text-red-400'
                      : 'hover:bg-red-50 text-red-500'
                  }`}
                  title={t.actions.delete}
                >
                  <Trash size={14} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}