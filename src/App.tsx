import { useState, useEffect, useRef } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { open, save } from '@tauri-apps/plugin-dialog';
import { load } from '@tauri-apps/plugin-store';
import { Connection, Group, Theme, Language } from './types';
import { translations } from './hooks/useTranslation';
import {
  Header,
  Footer,
  ConnectionCard,
  ConnectionForm,
  Modal,
  PathConfigModal,
  ConfirmDialog,
  Toast,
  EmptyState,
  Particles,
  SettingsModal,
  ActivationModal,
  OnboardingTour,
  NebulaCanvas,
  StarfieldCanvas,
  MeteorCanvas,
  ConnectionList,
  GroupManageModal,
} from './components';
import type { BgEffect } from './components';
import { MagnifyingGlass, Copy, SortAscending, FolderSimple, DotsThree, CheckSquare, Square, Rocket, Trash, X, PencilSimple } from '@phosphor-icons/react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from '@dnd-kit/sortable';

// Store 文件名
const STORE_FILE = 'sap-launcher-data.json';

// 存储数据的接口
interface StoreData {
  connections: Connection[];
  groups: Group[];
  sapPath: string;
  recentConnections: string[];  // 最近使用的连接ID列表
}

// 设置接口
interface AppSettings {
  showBackground: boolean;
  hotkey: string;
  bgEffect: BgEffect;
}

const DEFAULT_SETTINGS: AppSettings = {
  showBackground: true,
  hotkey: 'Ctrl+Shift+Space',
  bgEffect: 'starlight',
  primaryColor: '#22C55E',
  primaryColorHover: '#4ADE80',
};

const MAX_RECENT = 10;  // 最多保存最近使用记录数

export default function App() {
  const [lang, setLang] = useState<Language>('zh');
  const [theme, setTheme] = useState<Theme>('dark');
  const [sapPath, setSapPath] = useState('');
  const [connections, setConnections] = useState<Connection[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [recentConnections, setRecentConnections] = useState<string[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showModal, setShowModal] = useState(false);
  const [showPathModal, setShowPathModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [editing, setEditing] = useState<Connection | null>(null);
  const [deleting, setDeleting] = useState<Connection | null>(null);
  const [batchDeleting, setBatchDeleting] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; conn: Connection } | null>(null);
  const contextMenuRef = useRef<HTMLDivElement>(null); // 右键菜单 DOM 引用
  const cardsContainerRef = useRef<HTMLDivElement>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'card' | 'list'>('card');

  // 拖拽传感器
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,  // 移动超过8px才触发拖拽
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // 激活状态
  const [activated, setActivated] = useState<boolean | null>(null); // null = 检查中
  const [machineCode, setMachineCode] = useState('');

  // 新手引导
  const [showTour, setShowTour] = useState(false);
  const TOUR_DONE_KEY = 'sap-launcher-tour-done';

  const t = translations[lang];

  // 启动动画状态
  const [isLoading, setIsLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  // 打字机效果状态
  const [typeLines, setTypeLines] = useState<string[]>([]);       // 已显示完整的行
  const [typingLine, setTypingLine] = useState('');               // 正在打字的当前行
  const [typingDone, setTypingDone] = useState(false);            // 所有行是否打完

  // 检查激活状态
  useEffect(() => {
    (async () => {
      try {
        const [licenseResult, mc] = await Promise.all([
          invoke<{ activated: boolean; expiry: string }>('check_license'),
          invoke<string>('get_machine_code'),
        ]);
        setMachineCode(mc);
        setActivated(licenseResult.activated);
      } catch {
        setActivated(false);
        setMachineCode('');
      }
    })();
  }, []);



  // 初始化主题和数据 - 从 Store 加载
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    // 从 Store 加载持久化数据
    const loadData = async () => {
      try {
        const store = await load(STORE_FILE);
        const savedConnections = await store.get<Connection[]>('connections');
        const savedGroups = await store.get<Group[]>('groups');
        const savedSapPath = await store.get<string>('sapPath');
        const savedSettings = await store.get<AppSettings>('settings');
        const savedRecent = await store.get<string[]>('recentConnections');

        // 确保 connections 有 order 字段（老数据兼容）
        if (savedConnections && Array.isArray(savedConnections)) {
          const connsWithOrder = savedConnections.map((c, idx) => ({
            ...c,
            order: c.order ?? idx,
            lastUsed: c.lastUsed ?? 0,
            useCount: c.useCount ?? 0,
          }));
          // 按 order 排序
          connsWithOrder.sort((a, b) => a.order - b.order);
          setConnections(connsWithOrder);
        }
        if (savedGroups && Array.isArray(savedGroups)) {
          const groupsWithOrder = savedGroups.map((g, idx) => ({
            ...g,
            order: g.order ?? idx,
            collapsed: g.collapsed ?? false,
          }));
          groupsWithOrder.sort((a, b) => a.order - b.order);
          setGroups(groupsWithOrder);
        }
        if (savedSapPath) {
          setSapPath(savedSapPath);
        }
        if (savedSettings) {
          setSettings(savedSettings);
          // 应用主题色到CSS变量
          if (savedSettings.primaryColor) {
            document.documentElement.style.setProperty('--primary', savedSettings.primaryColor);
            document.documentElement.style.setProperty('--primary-hover', savedSettings.primaryColorHover || savedSettings.primaryColor);
            document.documentElement.style.setProperty('--primary-dim', `${savedSettings.primaryColor}26`);
            document.documentElement.style.setProperty('--primary-glow', `${savedSettings.primaryColor}66`);
          }
        }
        if (savedRecent && Array.isArray(savedRecent)) {
          setRecentConnections(savedRecent);
        }
        // 检查是否已完成引导
        const tourDone = await store.get<boolean>(TOUR_DONE_KEY);
        if (!tourDone) {
          // 延迟到加载动画结束后再显示引导
          setTimeout(() => setShowTour(true), 2800);
        }
      } catch (e) {
        console.error('Failed to load data from store:', e);
      }
    };
    loadData();
  }, [theme]);

  // 保存 connections 到 Store 的函数
  const saveConnections = async (data: Connection[]) => {
    try {
      const store = await load(STORE_FILE);
      await store.set('connections', data);
      await store.save();
    } catch (e) {
      console.error('Failed to save connections:', e);
    }
  };

  // 保存 groups 到 Store 的函数
  const saveGroups = async (data: Group[]) => {
    try {
      const store = await load(STORE_FILE);
      await store.set('groups', data);
      await store.save();
    } catch (e) {
      console.error('Failed to save groups:', e);
    }
  };

  // 保存 recentConnections 到 Store 的函数
  const saveRecentConnections = async (data: string[]) => {
    try {
      const store = await load(STORE_FILE);
      await store.set('recentConnections', data);
      await store.save();
    } catch (e) {
      console.error('Failed to save recent connections:', e);
    }
  };

  // 保存 sapPath 到 Store 的函数
  const saveSapPath = async (path: string) => {
    try {
      const store = await load(STORE_FILE);
      await store.set('sapPath', path);
      await store.save();
    } catch (e) {
      console.error('Failed to save sapPath:', e);
    }
  };

  // 保存设置到 Store 的函数
  const saveSettings = async (newSettings: AppSettings) => {
    try {
      const store = await load(STORE_FILE);
      await store.set('settings', newSettings);
      await store.save();
      setSettings(newSettings);
      
      // 应用主题色到CSS变量
      if (newSettings.primaryColor) {
        document.documentElement.style.setProperty('--primary', newSettings.primaryColor);
        document.documentElement.style.setProperty('--primary-hover', newSettings.primaryColorHover || newSettings.primaryColor);
        document.documentElement.style.setProperty('--primary-dim', `${newSettings.primaryColor}26`); // 15% opacity
        document.documentElement.style.setProperty('--primary-glow', `${newSettings.primaryColor}66`); // 40% opacity
      }
    } catch (e) {
      console.error('Failed to save settings:', e);
    }
  };

  // 启动动画 - 打字机效果（精简版）
  useEffect(() => {
    const isZh = lang === 'zh';
    const features = isZh ? [
      '⚡  快速启动 SAP GUI 连接',
      '🔐  安全加密存储账号密码',
      '🎨  多主题 · 深色 / 浅色模式',
      '⌨️  全局快捷键呼出',
      '🚀  系统托盘常驻',
    ] : [
      '⚡  Launch SAP GUI instantly',
      '🔐  Encrypted credential storage',
      '🎨  Dark / Light theme support',
      '⌨️  Global hotkey toggle',
      '🚀  System tray ready',
    ];

    let lineIdx = 0;
    let charIdx = 0;
    let completedLines: string[] = [];
    let cancelled = false;

    // 进度条随打字推进
    const progressStep = 100 / features.length;

    const typeNextChar = () => {
      if (cancelled) return;
      const currentLine = features[lineIdx];
      if (charIdx < currentLine.length) {
        charIdx++;
        setTypingLine(currentLine.slice(0, charIdx));
        // 打字速度：加快到 12ms
        const ch = currentLine[charIdx - 1];
        const delay = /[·\-\/]/.test(ch) ? 25 : /\s/.test(ch) ? 15 : 12;
        setTimeout(typeNextChar, delay);
      } else {
        // 当前行打完，快速移到下一行
        completedLines = [...completedLines, currentLine];
        setTypeLines([...completedLines]);
        setTypingLine('');
        setLoadingProgress(Math.min(100, progressStep * (lineIdx + 1)));
        lineIdx++;
        charIdx = 0;
        if (lineIdx < features.length) {
          setTimeout(typeNextChar, 80);  // 行间停顿缩短
        } else {
          // 全部打完，快速结束
          setTypingDone(true);
          setLoadingProgress(100);
          setTimeout(() => {
            if (!cancelled) setIsLoading(false);
          }, 200);
        }
      }
    };

    // 重置状态
    setTypeLines([]);
    setTypingLine('');
    setTypingDone(false);
    setLoadingProgress(0);

    setTimeout(typeNextChar, 150);  // 入场延迟缩短

    return () => { cancelled = true; };
  }, [lang]);

  // 鼠标追踪效果
  useEffect(() => {
    const container = cardsContainerRef.current;
    if (!container) return;

    const handleMouseMove = (e: React.MouseEvent) => {
      const cards = container.querySelectorAll('.spotlight-card');
      cards.forEach((card) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        (card as HTMLElement).style.setProperty('--mouse-x', `${x}px`);
        (card as HTMLElement).style.setProperty('--mouse-y', `${y}px`);
      });
    };

    container.addEventListener('mousemove', handleMouseMove as unknown as EventListener);
    return () => container.removeEventListener('mousemove', handleMouseMove as unknown as EventListener);
  }, []);

  // 右键菜单：关闭逻辑（菜单打开时才注册）
  useEffect(() => {
    if (!contextMenu) return;

    // 用于防止菜单打开后的那次外部点击立刻触发关闭
    let ignoreNext = true;
    const tick = setTimeout(() => { ignoreNext = false; }, 150);

    const close = (e: PointerEvent) => {
      if (ignoreNext) return;
      if (contextMenuRef.current && contextMenuRef.current.contains(e.target as Node)) return;
      setContextMenu(null);
    };

    // 右键再次触发时也关闭旧菜单
    const closeOnContext = () => { setContextMenu(null); };

    document.addEventListener('pointerdown', close, true);
    document.addEventListener('contextmenu', closeOnContext, true);

    return () => {
      clearTimeout(tick);
      document.removeEventListener('pointerdown', close, true);
      document.removeEventListener('contextmenu', closeOnContext, true);
    };
  }, [contextMenu]);

  // 禁用系统右键菜单（仅在没有自定义菜单打开时阻止）
  useEffect(() => {
    const handler = (e: MouseEvent) => { e.preventDefault(); };
    document.addEventListener('contextmenu', handler);
    return () => document.removeEventListener('contextmenu', handler);
  }, []);

  const handleThemeChange = async (newTheme: Theme) => {
    setTheme(newTheme);
    // 同步修改系统窗口主题
    try {
      await invoke('set_window_theme', { theme: newTheme });
    } catch (e) {
      console.error('Failed to set window theme:', e);
    }
  };

  const handleLangChange = (newLang: Language) => {
    setLang(newLang);
  };

  const handleSavePath = (path: string) => {
    setSapPath(path);
    saveSapPath(path); // 保存到 Store
    setToast(t.toast.pathSaved);
  };

  const handleImport = async () => {
    try {
      const selected = await open({
        multiple: false,
        filters: [{
          name: 'JSON',
          extensions: ['json']
        }]
      });
      if (selected) {
        const data = await invoke<string>('import_connections', { path: selected });
        const importedData = JSON.parse(data);

        // 支持导入带 sapPath 的完整数据 或 仅 connections 数组
        let importedConnections: Connection[] = [];
        if (Array.isArray(importedData)) {
          importedConnections = importedData;
        } else if (importedData.connections && Array.isArray(importedData.connections)) {
          importedConnections = importedData.connections;
          // 如果导入数据包含 sapPath，也导入
          if (importedData.sapPath) {
            setSapPath(importedData.sapPath);
            saveSapPath(importedData.sapPath);
          }
        }

        const newConnections = [...connections, ...importedConnections];
        setConnections(newConnections);
        saveConnections(newConnections);
        setToast(lang === 'zh' ? `成功导入 ${importedConnections.length} 个连接` : `Imported ${importedConnections.length} connections`);
      }
    } catch (e) {
      console.error('Import failed:', e);
      setToast(lang === 'zh' ? `导入失败: ${e}` : `Import failed: ${e}`);
    }
  };

  const handleExport = async () => {
    try {
      const path = await save({
        filters: [{
          name: 'JSON',
          extensions: ['json']
        }],
        defaultPath: 'sap-connections.json'
      });
      if (path) {
        // 导出时包含 connections、groups、recentConnections 和 sapPath
        const exportData: StoreData = {
          connections,
          groups,
          recentConnections,
          sapPath
        };
        await invoke('export_connections', { path, data: JSON.stringify(exportData, null, 2) });
        setToast(lang === 'zh' ? '连接已导出' : 'Connections exported');
      }
    } catch (e) {
      console.error('Export failed:', e);
      setToast(lang === 'zh' ? `导出失败: ${e}` : `Export failed: ${e}`);
    }
  };

  const handleSort = () => {
    const sorted = [...connections].sort((a, b) => {
      const nameA = `${a.name}_${a.client}`.toLowerCase();
      const nameB = `${b.name}_${b.client}`.toLowerCase();
      return nameA.localeCompare(nameB);
    });
    setConnections(sorted);
    saveConnections(sorted); // 保存排序后的数据
    setContextMenu(null);
    setToast(lang === 'zh' ? '已按名称+客户端排序' : 'Sorted by name+client');
  };

  // 复制到新建
  const handleDuplicate = () => {
    if (contextMenu?.conn) {
      const conn = contextMenu.conn;
      setEditing({
        ...conn,
        id: '', // 清空ID，新建时会生成新ID
        name: conn.name + ' (Copy)',
      });
      setShowModal(true);
    }
    setContextMenu(null);
  };

  const handleSave = (form: Omit<Connection, 'id' | 'env'>) => {
    let newConnections: Connection[];
    if (editing) {
      const updated = connections.map(c => c.id === editing.id ? { ...form, id: editing.id, env: editing.env, order: c.order, lastUsed: c.lastUsed, useCount: c.useCount } : c);
      newConnections = updated;
      setConnections(newConnections);
      setToast(t.toast.updated);
    } else {
      const newId = `${form.name}_${form.client}_${form.user}_${Date.now()}`;
      const env = newId.includes('PRD') ? 'prd' : newId.includes('QAS') ? 'qas' : 'dev';
      const maxOrder = connections.reduce((max, c) => Math.max(max, c.order ?? 0), 0);
      newConnections = [...connections, { ...form, id: newId, env, order: maxOrder + 1, lastUsed: 0, useCount: 0 }];
      setConnections(newConnections);
      setToast(t.toast.created);
    }
    saveConnections(newConnections); // 保存到 Store
    setShowModal(false);
    setEditing(null);
  };

  const handleDelete = () => {
    if (deleting) {
      const newConnections = connections.filter(c => c.id !== deleting.id);
      setConnections(newConnections);
      saveConnections(newConnections); // 保存到 Store
      // 从最近使用中移除
      const newRecent = recentConnections.filter(id => id !== deleting.id);
      setRecentConnections(newRecent);
      saveRecentConnections(newRecent);
      // 从选中中移除
      const newSelected = new Set(selectedIds);
      newSelected.delete(deleting.id);
      setSelectedIds(newSelected);
      setToast(t.toast.deleted);
    }
    setDeleting(null);
  };

  // 批量删除
  const handleBatchDelete = () => {
    const idsToDelete = Array.from(selectedIds);
    const newConnections = connections.filter(c => !idsToDelete.includes(c.id));
    setConnections(newConnections);
    saveConnections(newConnections);
    // 从最近使用中移除
    const newRecent = recentConnections.filter(id => !idsToDelete.includes(id));
    setRecentConnections(newRecent);
    saveRecentConnections(newRecent);
    setSelectedIds(new Set());
    setBatchDeleting(false);
    setToast(t.toast.batchDeleted);
  };

  // 批量启动
  const handleBatchLaunch = async () => {
    if (!sapPath) {
      setToast(lang === 'zh' ? '请先设置SAP路径' : 'Please set SAP path first');
      setShowPathModal(true);
      return;
    }
    const toLaunch = connections.filter(c => selectedIds.has(c.id));
    for (const conn of toLaunch) {
      try {
        await invoke('launch_sap', {
          sapPath,
          user: conn.user,
          password: conn.pwd,
          language: conn.lang,
          system: conn.sysId,
          client: conn.client,
          sysname: conn.name,
        });
      } catch (e) {
        console.error('Launch failed:', e);
      }
    }
    setToast(t.toast.batchLaunched.replace('{count}', String(toLaunch.length)));
    // 更新每个连接的使用记录
    const now = Date.now();
    const newConnections = connections.map(c => {
      if (selectedIds.has(c.id)) {
        const newRecent = [c.id, ...recentConnections.filter(id => id !== c.id)].slice(0, MAX_RECENT);
        setRecentConnections(newRecent);
        saveRecentConnections(newRecent);
        return { ...c, lastUsed: now, useCount: (c.useCount ?? 0) + 1 };
      }
      return c;
    });
    setConnections(newConnections);
    saveConnections(newConnections);
    setSelectedIds(new Set());
  };

  const handleLaunch = async (conn: Connection) => {
    if (!sapPath) {
      setToast(lang === 'zh' ? '请先设置SAP路径' : 'Please set SAP path first');
      setShowPathModal(true);
      return;
    }
    try {
      await invoke('launch_sap', {
        sapPath,
        user: conn.user,
        password: conn.pwd,
        language: conn.lang,
        system: conn.sysId,
        client: conn.client,
        sysname: conn.name,
      });
      // 更新最近使用
      const now = Date.now();
      const newRecent = [conn.id, ...recentConnections.filter(id => id !== conn.id)].slice(0, MAX_RECENT);
      setRecentConnections(newRecent);
      saveRecentConnections(newRecent);
      // 更新连接的使用记录
      const newConnections = connections.map(c =>
        c.id === conn.id ? { ...c, lastUsed: now, useCount: (c.useCount ?? 0) + 1 } : c
      );
      setConnections(newConnections);
      saveConnections(newConnections);
      setToast(t.toast.launching.replace('{name}', conn.name));
    } catch (e) {
      console.error('Launch failed:', e);
      setToast(lang === 'zh' ? `启动失败: ${e}` : `Launch failed: ${e}`);
    }
  };

  const handleEdit = (conn: Connection) => {
    setEditing(conn);
    setShowModal(true);
  };

  const handleAdd = () => {
    setEditing(null);
    setShowModal(true);
  };

  const handleContextMenu = (e: React.MouseEvent, conn: Connection) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ x: e.clientX, y: e.clientY, conn });
  };

  // ========== 拖拽排序 ==========
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = connections.findIndex(c => c.id === active.id);
    const newIndex = connections.findIndex(c => c.id === over.id);

    if (oldIndex !== -1 && newIndex !== -1) {
      const newConnections = arrayMove(connections, oldIndex, newIndex).map((c, idx) => ({
        ...c,
        order: idx,
      }));
      setConnections(newConnections);
      saveConnections(newConnections);
    }
  };

  // ========== 选择功能 ==========
  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const selectAll = () => {
    const filtered = connections.filter(c => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        c.name?.toLowerCase().includes(q) ||
        c.sysId?.toLowerCase().includes(q) ||
        c.user?.toLowerCase().includes(q) ||
        c.client?.toLowerCase().includes(q) ||
        c.remark?.toLowerCase().includes(q)
      );
    });
    setSelectedIds(new Set(filtered.map(c => c.id)));
  };

  const deselectAll = () => {
    setSelectedIds(new Set());
  };

  // ========== 分组管理 ==========
  const handleCreateGroup = (name: string) => {
    const newGroup: Group = {
      id: `group_${Date.now()}`,
      name,
      order: groups.length,
      collapsed: false,
    };
    const newGroups = [...groups, newGroup];
    setGroups(newGroups);
    saveGroups(newGroups);
    setShowGroupModal(false);
    setEditingGroup(null);
    setToast(t.toast.groupCreated);
  };

  const handleRenameGroup = (groupId: string, newName: string) => {
    const newGroups = groups.map(g =>
      g.id === groupId ? { ...g, name: newName } : g
    );
    setGroups(newGroups);
    saveGroups(newGroups);
    setShowGroupModal(false);
    setEditingGroup(null);
  };

  const handleDeleteGroup = (groupId: string) => {
    // 分组内的连接移到未分组
    const newConnections = connections.map(c =>
      c.groupId === groupId ? { ...c, groupId: undefined } : c
    );
    const newGroups = groups.filter(g => g.id !== groupId);
    setConnections(newConnections);
    saveConnections(newConnections);
    setGroups(newGroups);
    saveGroups(newGroups);
    setToast(t.toast.groupDeleted);
  };

  const toggleGroupCollapse = (groupId: string) => {
    const newGroups = groups.map(g =>
      g.id === groupId ? { ...g, collapsed: !g.collapsed } : g
    );
    setGroups(newGroups);
    saveGroups(newGroups);
  };

  // 移动连接到的分组
  const moveToGroup = (connId: string, groupId: string | undefined) => {
    const newConnections = connections.map(c =>
      c.id === connId ? { ...c, groupId } : c
    );
    setConnections(newConnections);
    saveConnections(newConnections);
    setContextMenu(null);
    setToast(lang === 'zh' ? '已移动到分组' : 'Moved to group');
  };


  // 激活检查：未激活时显示激活弹窗，覆盖整个应用
  if (activated === null) {
    // 检查中：显示纯色背景，避免闪烁
    return (
      <div className={`min-h-screen flex items-center justify-center ${
        theme === 'dark' ? 'bg-[#1E2532]' : 'bg-[#E8EEF4]'
      }`}>
        <div className="w-6 h-6 border-2 border-blue-500/40 border-t-blue-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen h-screen w-screen flex justify-center items-center relative overflow-hidden">
      {/* 激活弹窗 - 覆盖在最顶层 */}
      {!activated && (
        <ActivationModal
          theme={theme}
          lang={lang}
          machineCode={machineCode}
          onActivated={() => setActivated(true)}
        />
      )}

      {/* 新手引导 */}
      {activated && showTour && (
        <OnboardingTour
          theme={theme}
          lang={lang}
          onFinish={async (dontShowAgain: boolean) => {
            setShowTour(false);
            if (dontShowAgain) {
              try {
                const store = await load(STORE_FILE);
                await store.set(TOUR_DONE_KEY, true);
                await store.save();
              } catch { /* ignore */ }
            }
          }}
        />
      )}

      {/* 背景特效 - 根据设置决定样式 */}
      {settings.showBackground && (() => {
        const effect = settings.bgEffect ?? 'starlight';
        if (effect === 'nebula')    return <NebulaCanvas theme={theme} />;
        if (effect === 'starfield') return <StarfieldCanvas theme={theme} />;
        if (effect === 'meteor')    return <MeteorCanvas theme={theme} />;
        return <Particles theme={theme} />;  // 默认 starlight
      })()}

      {/* 启动动画覆盖层 */}
      {isLoading && (
        <div className={`absolute inset-0 z-[9998] flex items-center justify-center
                        ${theme === 'dark' ? 'bg-[#080810]' : 'bg-[#f8f9fc]'}`}>
          <div className="flex gap-10 items-center w-full max-w-[700px] px-10">

            {/* 左侧：Logo + 应用名 + 进度条 */}
            <div className="flex flex-col items-center flex-shrink-0 w-[180px]">
              {/* Logo */}
              <div className="relative mb-5">
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-cyan-400 via-blue-500 to-purple-600 blur-xl opacity-40 scale-110" />
                <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-cyan-400 via-blue-500 to-purple-600 p-[2.5px] shadow-2xl">
                  <div className={`w-full h-full rounded-xl flex items-center justify-center text-3xl font-bold
                                  ${theme === 'dark' ? 'bg-[#080810]' : 'bg-white'}`}>
                    <span className="bg-gradient-to-br from-cyan-400 via-blue-500 to-purple-600 bg-clip-text text-transparent">S</span>
                  </div>
                </div>
              </div>

              <h1 className={`text-base font-bold text-center leading-tight mb-1
                              ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                SAP Quick Launcher
              </h1>
              <p className={`text-[11px] text-center mb-5 ${theme === 'dark' ? 'text-white/40' : 'text-gray-500'}`}>
                v1.0.0
              </p>

              {/* 进度条 */}
              <div className={`w-full h-[3px] rounded-full overflow-hidden mb-2
                              ${theme === 'dark' ? 'bg-white/[0.07]' : 'bg-gray-300'}`}>
                <div
                  className="h-full bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-600 rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${loadingProgress}%` }}
                />
              </div>
              <p className={`text-[11px] font-mono tabular-nums
                            ${typingDone
                              ? 'bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent font-semibold'
                              : theme === 'dark' ? 'text-white/30' : 'text-gray-600'
                            }`}>
                {typingDone ? (lang === 'zh' ? '✓  就绪' : '✓  Ready') : `${Math.round(loadingProgress)}%`}
              </p>
            </div>

            {/* 分隔线 */}
            <div className={`w-px self-stretch ${theme === 'dark' ? 'bg-white/[0.06]' : 'bg-gray-300'}`} />

            {/* 右侧：打字机内容区 */}
            <div className="flex-1 min-h-[200px] flex flex-col justify-center">
              {/* 标题 */}
              <p className={`text-[10px] font-semibold tracking-widest uppercase mb-3
                            ${theme === 'dark' ? 'text-white/25' : 'text-gray-500'}`}>
                {lang === 'zh' ? '功能特性' : 'Features'}
              </p>

              {/* 打字机区域 */}
              <div className="space-y-[5px]">
                {/* 已完成的行 */}
                {typeLines.map((line, i) => (
                  <div
                    key={i}
                    className={`text-[12px] font-mono leading-relaxed transition-all duration-300
                                ${theme === 'dark' ? 'text-white/55' : 'text-gray-700'}`}
                    style={{ animation: 'splashLineFadeIn 0.25s ease-out' }}
                  >
                    {line}
                  </div>
                ))}

                {/* 正在打字的行 */}
                {typingLine && (
                  <div className={`text-[12px] font-mono leading-relaxed flex items-center gap-0
                                  ${theme === 'dark' ? 'text-cyan-300' : 'text-blue-600'}`}>
                    <span>{typingLine}</span>
                    <span
                      className={`inline-block w-[2px] h-[13px] ml-[2px] rounded-sm
                                  ${theme === 'dark' ? 'bg-cyan-400' : 'bg-blue-500'}`}
                      style={{ animation: 'splashCursorBlink 0.6s steps(1) infinite' }}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 全局打字机动画 CSS */}
          <style>{`
            @keyframes splashLineFadeIn {
              from { opacity: 0; transform: translateY(4px); }
              to   { opacity: 1; transform: translateY(0); }
            }
            @keyframes splashCursorBlink {
              0%, 49% { opacity: 1; }
              50%, 100% { opacity: 0; }
            }
          `}</style>
        </div>
      )}

      {/* 主窗口客户端容器 - 填满窗口无边距 */}
      <div className={`w-full h-full rounded-none flex flex-col relative z-10 overflow-hidden bg-gradient-mesh
                      ${theme === 'dark' ? 'border border-white/[0.06]' : 'border border-gray-200/50'}`}>

        <Header
          t={t}
          theme={theme}
          lang={lang}
          onThemeChange={handleThemeChange}
          onLangChange={handleLangChange}
          onPathConfig={() => setShowPathModal(true)}
          onAdd={handleAdd}
          onSettings={() => setShowSettingsModal(true)}
          onManageGroups={() => { setShowGroupModal(true); setEditingGroup(null); }}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          showSearch={connections.length > 0}
          viewMode={viewMode}
          onViewChange={setViewMode}
        />

        <main
          ref={cardsContainerRef}
          className={`flex-1 overflow-y-auto custom-scroll p-5 relative z-10 ${
            theme === 'light' ? 'bg-white/50' : 'bg-transparent'
          }`}
          id="cards-container"
        >
          {(() => {
            const filtered = connections.filter(c => {
              if (!searchQuery.trim()) return true;
              const q = searchQuery.toLowerCase();
              return (
                c.name?.toLowerCase().includes(q) ||
                c.sysId?.toLowerCase().includes(q) ||
                c.user?.toLowerCase().includes(q) ||
                c.client?.toLowerCase().includes(q) ||
                c.remark?.toLowerCase().includes(q)
              );
            });

            if (filtered.length === 0) {
              return connections.length === 0 ? (
                <EmptyState t={t} />
              ) : (
                <div className={`flex flex-col items-center justify-center py-16 gap-3 ${theme === 'dark' ? 'text-white/30' : 'text-gray-400'}`}>
                  <MagnifyingGlass size={30} />
                  <p className="text-sm">{lang === 'zh' ? `未找到「${searchQuery}」相关连接` : `No results for "${searchQuery}"`}</p>
                </div>
              );
            }

            // 最近使用的连接（仅在没有搜索时显示）
            const recentConns = searchQuery.trim() ? [] : recentConnections
              .map(id => connections.find(c => c.id === id))
              .filter((c): c is Connection => c !== undefined)
              .slice(0, 5);

            // 按分组整理连接
            const groupedConns = new Map<string | undefined, Connection[]>();
            filtered.forEach(c => {
              const groupId = c.groupId;
              if (!groupedConns.has(groupId)) {
                groupedConns.set(groupId, []);
              }
              groupedConns.get(groupId)!.push(c);
            });

            // 分组排序：按 order 字段
            // 逻辑：所有分组（无论折叠与否）都显示标题 + 存在于连接中但不存在于 groups 中的 groupId
            const validGroupIds = new Set(groups.map(g => g.id));
            const sortedGroupIds = [
              ...groups.filter(g => groupedConns.has(g.id)).sort((a, b) => a.order - b.order).map(g => g.id),
              ...[...groupedConns.keys()].filter(k => k !== undefined && !validGroupIds.has(k)),
            ];

            const ungrouped = groupedConns.get(undefined) || [];
            const hasUngrouped = ungrouped.length > 0;

            // 列表视图
            if (viewMode === 'list') {
              return (
                <div className="space-y-4">
                  {/* 最近使用区域 - 列表视图 */}
                  {recentConns.length > 0 && !searchQuery.trim() && (
                    <div className="mb-6">
                      <h3 className={`text-xs font-semibold uppercase tracking-wider mb-3 flex items-center gap-2 ${theme === 'dark' ? 'text-white/40' : 'text-gray-500'}`}>
                        <Rocket size={12} className="text-cyan-400" />
                        {t.recent.title}
                      </h3>
                      <ConnectionList
                        connections={recentConns}
                        selectedIds={selectedIds}
                        theme={theme}
                        t={t}
                        onToggleSelect={toggleSelect}
                        onEdit={handleEdit}
                        onDelete={setDeleting}
                        onLaunch={handleLaunch}
                        onContextMenu={handleContextMenu}
                        isRecent
                      />
                    </div>
                  )}

                  {/* 分组列表 - 列表视图 */}
                  {sortedGroupIds.map(groupId => {
                    const group = groups.find(g => g.id === groupId);
                    const connsInGroup = groupedConns.get(groupId) || [];
                    if (connsInGroup.length === 0) return null;

                    return (
                      <div key={groupId}>
                        {/* 分组标题 */}
                        <div
                          className={`flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer mb-2 select-none ${
                            theme === 'dark' ? 'hover:bg-white/5' : 'hover:bg-gray-100'
                          }`}
                          onClick={() => toggleGroupCollapse(groupId!)}
                        >
                          <FolderSimple size={14} className={theme === 'dark' ? 'text-amber-400/70' : 'text-amber-500'} />
                          <span className={`text-sm font-medium ${theme === 'dark' ? 'text-white/70' : 'text-gray-700'}`}>
                            {group?.name || t.group.noGroup}
                          </span>
                          <span className={`text-xs ${theme === 'dark' ? 'text-white/30' : 'text-gray-400'}`}>
                            ({connsInGroup.length})
                          </span>
                          <span className={`ml-auto text-xs ${theme === 'dark' ? 'text-white/30' : 'text-gray-400'}`}>
                            {group?.collapsed ? '▶' : '▼'}
                          </span>
                        </div>

                        {/* 分组内的连接列表 */}
                        {!group?.collapsed && (
                          <ConnectionList
                            connections={connsInGroup}
                            selectedIds={selectedIds}
                            theme={theme}
                            t={t}
                            onToggleSelect={toggleSelect}
                            onEdit={handleEdit}
                            onDelete={setDeleting}
                            onLaunch={handleLaunch}
                            onContextMenu={handleContextMenu}
                          />
                        )}
                      </div>
                    );
                  })}

                  {/* 未分组 - 列表视图 */}
                  {hasUngrouped && (
                    <div>
                      {!searchQuery.trim() && groups.length > 0 && (
                        <div className={`flex items-center gap-2 px-2 py-1.5 rounded-md mb-2 ${theme === 'dark' ? 'text-white/40' : 'text-gray-500'}`}>
                          <FolderSimple size={14} />
                          <span className="text-sm font-medium">{t.group.noGroup}</span>
                          <span className="text-xs">({ungrouped.length})</span>
                        </div>
                      )}
                      <ConnectionList
                        connections={ungrouped}
                        selectedIds={selectedIds}
                        theme={theme}
                        t={t}
                        onToggleSelect={toggleSelect}
                        onEdit={handleEdit}
                        onDelete={setDeleting}
                        onLaunch={handleLaunch}
                        onContextMenu={handleContextMenu}
                      />
                    </div>
                  )}
                </div>
              );
            }

            // 卡片视图（默认）
            return (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext items={filtered.map(c => c.id)} strategy={rectSortingStrategy}>
                  <div className="space-y-4">
                    {/* 最近使用区域 */}
                    {recentConns.length > 0 && !searchQuery.trim() && (
                      <div className="mb-6">
                        <h3 className={`text-xs font-semibold uppercase tracking-wider mb-3 flex items-center gap-2 ${theme === 'dark' ? 'text-white/40' : 'text-gray-500'}`}>
                          <Rocket size={12} className="text-cyan-400" />
                          {t.recent.title}
                        </h3>
                        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                          {recentConns.map(conn => (
                            <ConnectionCard
                              key={conn.id}
                              conn={conn}
                              index={0}
                              t={t}
                              theme={theme}
                              onEdit={handleEdit}
                              onDelete={setDeleting}
                              onLaunch={handleLaunch}
                              onContextMenu={(e) => handleContextMenu(e, conn)}
                              isSelected={selectedIds.has(conn.id)}
                              onToggleSelect={() => toggleSelect(conn.id)}
                              showDragHandle={false}
                              isRecent
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 分组列表 */}
                    {sortedGroupIds.map(groupId => {
                      const group = groups.find(g => g.id === groupId);
                      const connsInGroup = groupedConns.get(groupId) || [];
                      if (connsInGroup.length === 0) return null;

                      return (
                        <div key={groupId} className="mb-4">
                          {/* 分组标题 */}
                          <div
                            className={`flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer mb-2 select-none ${
                              theme === 'dark' ? 'hover:bg-white/5' : 'hover:bg-gray-100'
                            }`}
                            onClick={() => toggleGroupCollapse(groupId!)}
                          >
                            <FolderSimple size={14} className={theme === 'dark' ? 'text-amber-400/70' : 'text-amber-500'} />
                            <span className={`text-sm font-medium ${theme === 'dark' ? 'text-white/70' : 'text-gray-700'}`}>
                              {group?.name || t.group.noGroup}
                            </span>
                            <span className={`text-xs ${theme === 'dark' ? 'text-white/30' : 'text-gray-400'}`}>
                              ({connsInGroup.length})
                            </span>
                            <span className={`ml-auto text-xs ${theme === 'dark' ? 'text-white/30' : 'text-gray-400'}`}>
                              {group?.collapsed ? '▶' : '▼'}
                            </span>
                          </div>

                          {/* 分组内的连接卡片 */}
                          {!group?.collapsed && (
                            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                              {connsInGroup.map(conn => (
                                <ConnectionCard
                                  key={conn.id}
                                  conn={conn}
                                  index={0}
                                  t={t}
                                  theme={theme}
                                  onEdit={handleEdit}
                                  onDelete={setDeleting}
                                  onLaunch={handleLaunch}
                                  onContextMenu={(e) => handleContextMenu(e, conn)}
                                  isSelected={selectedIds.has(conn.id)}
                                  onToggleSelect={() => toggleSelect(conn.id)}
                                  showDragHandle={true}
                                />
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {/* 未分组 */}
                    {hasUngrouped && (
                      <div>
                        {!searchQuery.trim() && groups.length > 0 && (
                          <div className={`flex items-center gap-2 px-2 py-1.5 rounded-md mb-2 ${theme === 'dark' ? 'text-white/40' : 'text-gray-500'}`}>
                            <FolderSimple size={14} />
                            <span className="text-sm font-medium">{t.group.noGroup}</span>
                            <span className="text-xs">({ungrouped.length})</span>
                          </div>
                        )}
                        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                          {ungrouped.map(conn => (
                            <ConnectionCard
                              key={conn.id}
                              conn={conn}
                              index={0}
                              t={t}
                              theme={theme}
                              onEdit={handleEdit}
                              onDelete={setDeleting}
                              onLaunch={handleLaunch}
                              onContextMenu={(e) => handleContextMenu(e, conn)}
                              isSelected={selectedIds.has(conn.id)}
                              onToggleSelect={() => toggleSelect(conn.id)}
                              showDragHandle={true}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </SortableContext>
              </DndContext>
            );
          })()}
        </main>

        <Footer 
          t={t} 
          theme={theme} 
          connectionCount={connections.length} 
          hasSapPath={!!sapPath} 
          hotkey={settings.hotkey}
          selectedCount={selectedIds.size}
          onSelectAll={selectAll}
          onDeselectAll={deselectAll}
          onBatchLaunch={handleBatchLaunch}
          onBatchDelete={() => setBatchDeleting(true)}
        />

        {/* 右键菜单 */}
        {contextMenu && (
          <div
            ref={contextMenuRef}
            className={`fixed z-[3000] py-1 rounded-lg shadow-xl border animate-fadeIn min-w-[200px] ${
              theme === 'dark'
                ? 'bg-[#1a1a24]/95 border-white/10'
                : 'bg-white/95 border-gray-200'
            }`}
            style={{ left: contextMenu.x, top: contextMenu.y }}
            onPointerDown={(e) => e.stopPropagation()}
          >
            {/* 选中切换 */}
            <button
              onClick={() => { toggleSelect(contextMenu.conn.id); setContextMenu(null); }}
              className={`w-full px-4 py-2 text-sm text-left flex items-center gap-2 transition-colors ${
                theme === 'dark'
                  ? 'text-white/80 hover:text-white hover:bg-white/10'
                  : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              {selectedIds.has(contextMenu.conn.id) ? (
                <CheckSquare size={16} className="text-cyan-400" />
              ) : (
                <Square size={16} className="text-white/40" />
              )}
              {selectedIds.has(contextMenu.conn.id)
                ? (lang === 'zh' ? '取消选择' : 'Deselect')
                : (lang === 'zh' ? '选择' : 'Select')}
            </button>

            {/* 复制 */}
            <button
              onClick={handleDuplicate}
              className={`w-full px-4 py-2 text-sm text-left flex items-center gap-2 transition-colors ${
                theme === 'dark'
                  ? 'text-white/80 hover:text-white hover:bg-white/10'
                  : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <Copy size={16} className="text-emerald-400" />
              {t.actions.duplicate}
            </button>

            {/* 移动到分组子菜单 */}
            <div className={`my-1 border-t ${theme === 'dark' ? 'border-white/5' : 'border-gray-200'}`} />
            <div className={`px-4 py-1.5 text-xs ${theme === 'dark' ? 'text-white/40' : 'text-gray-400'}`}>
              {lang === 'zh' ? '移动到分组' : 'Move to Group'}
            </div>
            <button
              onClick={() => moveToGroup(contextMenu.conn.id, undefined)}
              className={`w-full px-4 py-1.5 text-sm text-left flex items-center gap-2 transition-colors ${
                theme === 'dark'
                  ? 'text-white/70 hover:text-white hover:bg-white/10'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <FolderSimple size={14} />
              {t.group.noGroup}
            </button>
            {groups.map(g => (
              <button
                key={g.id}
                onClick={() => moveToGroup(contextMenu.conn.id, g.id)}
                className={`w-full px-4 py-1.5 text-sm text-left flex items-center gap-2 transition-colors ${
                  theme === 'dark'
                    ? 'text-white/70 hover:text-white hover:bg-white/10'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <FolderSimple size={14} className={theme === 'dark' ? 'text-amber-400/70' : 'text-amber-500'} />
                {g.name}
              </button>
            ))}

            <div className={`my-1 border-t ${theme === 'dark' ? 'border-white/5' : 'border-gray-200'}`} />
            {/* 排序 */}
            <button
              onClick={handleSort}
              className={`w-full px-4 py-2 text-sm text-left flex items-center gap-2 transition-colors ${
                theme === 'dark'
                  ? 'text-white/80 hover:text-white hover:bg-white/10'
                  : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <SortAscending size={16} className="text-purple-400" />
              {lang === 'zh' ? '按名称+客户端排序' : 'Sort by Name + Client'}
            </button>
          </div>
        )}

        {/* 批量删除确认 */}
        <ConfirmDialog
          isOpen={batchDeleting}
          t={t}
          name={`${selectedIds.size} ${lang === 'zh' ? '个连接' : 'connections'}`}
          onConfirm={handleBatchDelete}
          onCancel={() => setBatchDeleting(false)}
        />

        <Modal isOpen={showModal} onClose={() => setShowModal(false)}>
          <ConnectionForm
            connection={editing}
            groups={groups}
            t={t}
            theme={theme}
            onSave={handleSave}
            onCancel={() => { setShowModal(false); setEditing(null); }}
            isEditing={!!editing}
          />
        </Modal>

        <PathConfigModal
          isOpen={showPathModal}
          onClose={() => setShowPathModal(false)}
          t={t}
          path={sapPath}
          onSave={handleSavePath}
        />

        <ConfirmDialog
          isOpen={!!deleting}
          t={t}
          name={deleting?.name || ''}
          onConfirm={handleDelete}
          onCancel={() => setDeleting(null)}
        />

        {toast && <Toast message={toast} onClose={() => setToast(null)} theme={theme} />}

        <SettingsModal
          isOpen={showSettingsModal}
          onClose={() => setShowSettingsModal(false)}
          theme={theme}
          lang={lang}
          settings={settings}
          onSave={saveSettings}
          onReplayTour={() => {
            setShowTour(true);
          }}
          onImport={handleImport}
          onExport={handleExport}
        />

        {/* 分组管理弹窗 */}
        <GroupManageModal
          isOpen={showGroupModal}
          onClose={() => { setShowGroupModal(false); setEditingGroup(null); }}
          t={t}
          theme={theme}
          lang={lang}
          groups={groups}
          connections={connections}
          onCreateGroup={handleCreateGroup}
          onRenameGroup={handleRenameGroup}
          onDeleteGroup={handleDeleteGroup}
        />
      </div>
    </div>
  );
}