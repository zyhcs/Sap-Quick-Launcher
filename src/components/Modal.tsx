import { ReactNode } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
}

export default function Modal({ isOpen, onClose, children }: ModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-[1000] modal-overlay"
      onClick={onClose}
    >
      <div
        className="modal-content w-[480px] max-h-[85vh]"
        onClick={e => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}
