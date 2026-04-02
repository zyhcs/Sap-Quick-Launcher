import { Translations } from '../types';
import { X, Warning, Trash } from '@phosphor-icons/react';

interface ConfirmDialogProps {
  isOpen: boolean;
  t: Translations;
  name: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({ isOpen, t, name, onConfirm, onCancel }: ConfirmDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div
        className="modal-content w-[340px] p-6 text-center"
        onClick={e => e.stopPropagation()}
      >
        <div className="w-12 h-12 rounded-[var(--radius-lg)] flex items-center justify-center mb-4 mx-auto bg-red-500/15">
          <Warning size={20} className="text-red-500" />
        </div>

        <h3 className="modal-title mb-2 text-center">{t.confirm.title}</h3>
        <p className="text-sm mb-6 text-center leading-relaxed text-[var(--text-secondary)]">
          {t.confirm.message.replace('{name}', name)}
        </p>

        <div className="flex gap-3">
          <button onClick={onCancel} className="btn btn-secondary flex-1">
            <X size={16} />
            {t.modal.cancel}
          </button>
          <button onClick={onConfirm} className="btn btn-danger flex-1">
            <Trash size={16} weight="bold" />
            {t.confirm.confirm}
          </button>
        </div>
      </div>
    </div>
  );
}
