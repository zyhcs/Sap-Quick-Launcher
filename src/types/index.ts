export interface Connection {
  id: string;
  name: string;
  sysId: string;
  client: string;
  user: string;
  pwd: string;
  lang: string;
  remark: string;
  env: 'prd' | 'qas' | 'dev';
  groupId?: string;       // 分组ID
  order: number;           // 排序顺序
  lastUsed?: number;      // 最后使用时间戳
  useCount?: number;      // 使用次数
}

export interface Group {
  id: string;
  name: string;
  order: number;          // 排序顺序
  collapsed: boolean;     // 是否折叠
}

export interface AppConfig {
  sapPath: string;
  connections: Record<string, Omit<Connection, 'id' | 'env'>>;
  groups: Record<string, Omit<Group, 'id'>>;
  recentConnections: string[];  // 最近使用的连接ID列表（最多10个）
}

export type Theme = 'dark' | 'light';
export type Language = 'zh' | 'en';

export interface Translations {
  title: string;
  subtitle: string;
  buttons: {
    shortcut: string;
    import: string;
    export: string;
    add: string;
  };
  env: {
    prd: string;
    qas: string;
    dev: string;
  };
  fields: {
    client: string;
    user: string;
    lang: string;
    pwd: string;
  };
  actions: {
    edit: string;
    delete: string;
    launch: string;
    copy: string;
    duplicate: string;
  };
  modal: {
    new: string;
    edit: string;
    save: string;
    cancel: string;
    create: string;
  };
  confirm: {
    title: string;
    message: string;
    confirm: string;
    deleteGroup: string;
  };
  empty: {
    title: string;
    desc: string;
  };
  toast: {
    created: string;
    updated: string;
    deleted: string;
    launching: string;
    pathSaved: string;
    copied: string;
    groupCreated: string;
    groupDeleted: string;
    batchLaunched: string;
    batchDeleted: string;
  };
  footer: string;
  shortcut: string;
  connections: string;
  notConfigured: string;
  form: {
    name: string;
    sysId: string;
    client: string;
    user: string;
    pwd: string;
    lang: string;
    remark: string;
  };
  path: {
    title: string;
    select: string;
    current: string;
    notSet: string;
    valid: string;
    invalid: string;
  };
  tooltip: {
    settings: string;
    pathConfig: string;
    import: string;
    export: string;
    lightTheme: string;
    darkTheme: string;
    add: string;
  };
  group: {
    title: string;
    new: string;
    rename: string;
    delete: string;
    noGroup: string;
    expand: string;
    collapse: string;
  };
  batch: {
    selectAll: string;
    deselectAll: string;
    launch: string;
    delete: string;
    selected: string;
  };
  recent: {
    title: string;
    frequently: string;
    clear: string;
  };
}
