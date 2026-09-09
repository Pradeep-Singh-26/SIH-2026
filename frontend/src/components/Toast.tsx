import React from 'react';
import { AlertTriangle, CheckCircle2, Info, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'info' | 'success' | 'warning' | 'danger';
  title: string;
  message?: string;
}

interface ToastContainerProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="toast-container" aria-live="polite">
      {toasts.map((toast) => {
        let Icon = Info;
        let borderClass = 'toast-info';

        if (toast.type === 'success') {
          Icon = CheckCircle2;
          borderClass = 'toast-success';
        } else if (toast.type === 'warning') {
          Icon = AlertTriangle;
          borderClass = 'toast-warning';
        } else if (toast.type === 'danger') {
          Icon = AlertTriangle;
          borderClass = 'toast-danger';
        }

        return (
          <div key={toast.id} className={`toast-item ${borderClass}`}>
            <div className="toast-icon">
              <Icon size={16} />
            </div>
            <div className="toast-body">
              <div className="toast-title">{toast.title}</div>
              {toast.message && <div className="toast-desc">{toast.message}</div>}
            </div>
            <button
              className="toast-close"
              onClick={() => onDismiss(toast.id)}
              aria-label="Dismiss toast notification"
            >
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
};
