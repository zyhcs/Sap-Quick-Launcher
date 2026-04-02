import { useState, useEffect } from 'react';
import { open } from '@tauri-apps/plugin-dialog';
import { Translations } from '../types';
import Modal from './Modal';
import { X, CheckCircle, WarningCircle, FolderOpen, Check } from '@phosphor-icons/react';

interface PathConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  t: Translations;
  path: string;
  onSave: (path: string) => void;
}

export default function PathConfigModal({ isOpen, onClose, t, path, onSave }: PathConfigModalProps) {
  const [currentPath, setCurrentPath] = useState(path);
  const [isValid, setIsValid] = useState(!!path);

  useEffect(() => {
    setCurrentPath(path);
    setIsValid(!!path);
  }, [path, isOpen]);

  const handleSelectPath = async () => {
    try {
      const selected = await open({
        multiple: false,
        directory: false,
        filters: [{
          name: 'Executable',
          extensions: ['exe']
        }]
      });
      if (selected) {
        setCurrentPath(selected as string);
        setIsValid(true);
      }
    } catch (e) {
      console.error('Failed to select path:', e);
    }
  };

  const handleSave = () => {
    onSave(currentPath);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="modal-header">
        <h2 className="modal-title">{t.path.title}</h2>
        <button
          onClick={onClose}
          className="w-8 h-8 flex items-center justify-center rounded-[var(--radius-md)] transition-all hover:bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
        >
          <X size={18} />
        </button>
      </div>

      <div className="modal-body">
        <label className="block text-[11px] font-semibold uppercase tracking-wider mb-2 text-[var(--text-tertiary)]">
          {t.path.current}
        </label>
        <div
          className={`p-3 rounded-[var(--radius-md)] font-mono text-xs break-all mb-3 bg-[var(--bg-input)] border border-[var(--border-default)] ${
            isValid ? 'text-emerald-500' : 'text-red-500'
          }`}
        >
          {currentPath || t.path.notSet}
        </div>

        <div className={`text-[12px] mb-5 ${isValid ? 'text-emerald-500' : 'text-red-500'}`}>
          {currentPath ? (
            <span className="flex items-center gap-1.5">
              {isValid ? <CheckCircle size={14} weight="fill" /> : <WarningCircle size={14} weight="fill" />}
              {isValid ? t.path.valid : t.path.invalid}
            </span>
          ) : ''}
        </div>

        <button
          onClick={handleSelectPath}
          className="btn btn-secondary w-full"
        >
          <FolderOpen size={16} className="text-amber-500" />
          {t.path.select}
        </button>
      </div>

      <div className="modal-footer">
        <button onClick={onClose} className="btn btn-secondary">
          <X size={16} />
          {t.modal.cancel}
        </button>
        <button
          onClick={handleSave}
          disabled={!isValid}
          className="btn btn-primary disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Check size={16} weight="bold" />
          {t.modal.save}
        </button>
      </div>
    </Modal>
  );
}
