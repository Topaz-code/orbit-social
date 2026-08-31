import { create } from 'zustand';

export interface ConfirmDialogOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'primary' | 'warning';
  onConfirm: () => void | Promise<void>;
  onCancel?: () => void;
}

export interface AlertDialogOptions {
  title: string;
  message: string;
  buttonText?: string;
  type?: 'info' | 'success' | 'warning' | 'error';
  onOk?: () => void;
}

export interface ToastItem {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
}

interface DialogState {
  confirmDialog: ConfirmDialogOptions | null;
  alertDialog: AlertDialogOptions | null;
  toasts: ToastItem[];
  openConfirm: (options: ConfirmDialogOptions) => void;
  closeConfirm: () => void;
  openAlert: (options: AlertDialogOptions) => void;
  closeAlert: () => void;
  toast: {
    success: (message: string) => void;
    error: (message: string) => void;
    info: (message: string) => void;
    warning: (message: string) => void;
  };
  removeToast: (id: string) => void;
}

export const useDialogStore = create<DialogState>((set, get) => ({
  confirmDialog: null,
  alertDialog: null,
  toasts: [],

  openConfirm: (options) => set({ confirmDialog: options }),
  closeConfirm: () => set({ confirmDialog: null }),

  openAlert: (options) => set({ alertDialog: options }),
  closeAlert: () => set({ alertDialog: null }),

  toast: {
    success: (message: string) => {
      const id = Math.random().toString(36).substring(2, 9);
      set((state) => ({
        toasts: [...state.toasts, { id, type: 'success', message }],
      }));
      setTimeout(() => get().removeToast(id), 4000);
    },
    error: (message: string) => {
      const id = Math.random().toString(36).substring(2, 9);
      set((state) => ({
        toasts: [...state.toasts, { id, type: 'error', message }],
      }));
      setTimeout(() => get().removeToast(id), 5000);
    },
    info: (message: string) => {
      const id = Math.random().toString(36).substring(2, 9);
      set((state) => ({
        toasts: [...state.toasts, { id, type: 'info', message }],
      }));
      setTimeout(() => get().removeToast(id), 4000);
    },
    warning: (message: string) => {
      const id = Math.random().toString(36).substring(2, 9);
      set((state) => ({
        toasts: [...state.toasts, { id, type: 'warning', message }],
      }));
      setTimeout(() => get().removeToast(id), 4000);
    },
  },

  removeToast: (id: string) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),
}));

// Quick helper for Promise-based confirmation
export const confirmAction = (options: {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'primary' | 'warning';
}): Promise<boolean> => {
  return new Promise((resolve) => {
    useDialogStore.getState().openConfirm({
      title: options.title || 'Are you sure?',
      message: options.message,
      confirmText: options.confirmText,
      cancelText: options.cancelText,
      variant: options.variant || 'primary',
      onConfirm: () => {
        useDialogStore.getState().closeConfirm();
        resolve(true);
      },
      onCancel: () => {
        useDialogStore.getState().closeConfirm();
        resolve(false);
      },
    });
  });
};
