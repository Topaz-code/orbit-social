import React from 'react';
import { useDialogStore } from '../../stores/dialogStore.js';
import { AlertTriangle, Info, CheckCircle2, XCircle, X } from 'lucide-react';
import { Button } from './button.js';

export const InAppDialog: React.FC = () => {
  const { confirmDialog, closeConfirm, alertDialog, closeAlert, toasts, removeToast } =
    useDialogStore();

  return (
    <>
      {/* In-App Confirmation Modal */}
      {confirmDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-fade-in select-none">
          <div className="w-full max-w-sm rounded-3xl bg-[#202A2D] border border-[#3A4B4D] p-6 shadow-2xl animate-slide-up text-[#D9D0B8]">
            <div className="flex items-center gap-3 mb-3">
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border ${
                  confirmDialog.variant === 'danger'
                    ? 'bg-[#B87568]/20 border-[#B87568]/40 text-[#B87568]'
                    : confirmDialog.variant === 'warning'
                    ? 'bg-[#D0A56A]/20 border-[#D0A56A]/40 text-[#D0A56A]'
                    : 'bg-[#496D6B]/20 border-[#496D6B]/40 text-[#71877B]'
                }`}
              >
                <AlertTriangle className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-[#D9D0B8]">{confirmDialog.title}</h3>
            </div>

            <p className="text-sm text-[#A8AAA0] mb-6 leading-relaxed">
              {confirmDialog.message}
            </p>

            <div className="flex items-center justify-end gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  confirmDialog.onCancel?.();
                  closeConfirm();
                }}
                className="text-[#A8AAA0] hover:text-[#D9D0B8] hover:bg-[#2B3940] rounded-[10px]"
              >
                {confirmDialog.cancelText || 'Cancel'}
              </Button>
              <Button
                size="sm"
                onClick={async () => {
                  await confirmDialog.onConfirm();
                  closeConfirm();
                }}
                className={`rounded-[10px] font-semibold text-[#171A1C] shadow-xs ${
                  confirmDialog.variant === 'danger'
                    ? 'bg-[#B87568] hover:bg-[#C98679]'
                    : 'bg-[#D0A56A] hover:bg-[#E0B779]'
                }`}
              >
                {confirmDialog.confirmText || 'Confirm'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* In-App Alert Modal */}
      {alertDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-fade-in select-none">
          <div className="w-full max-w-sm rounded-3xl bg-[#202A2D] border border-[#3A4B4D] p-6 shadow-2xl animate-slide-up text-[#D9D0B8]">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#496D6B]/20 border border-[#496D6B]/40 text-[#71877B]">
                {alertDialog.type === 'error' ? (
                  <XCircle className="h-5 w-5 text-[#B87568]" />
                ) : alertDialog.type === 'success' ? (
                  <CheckCircle2 className="h-5 w-5 text-[#71877B]" />
                ) : (
                  <Info className="h-5 w-5 text-[#D0A56A]" />
                )}
              </div>
              <h3 className="text-base font-bold text-[#D9D0B8]">{alertDialog.title}</h3>
            </div>

            <p className="text-sm text-[#A8AAA0] mb-6 leading-relaxed">
              {alertDialog.message}
            </p>

            <div className="flex justify-end">
              <Button
                size="sm"
                onClick={() => {
                  alertDialog.onOk?.();
                  closeAlert();
                }}
                className="bg-[#496D6B] hover:bg-[#5A7D78] text-[#D9D0B8] rounded-[10px]"
              >
                {alertDialog.buttonText || 'OK'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Floating In-App Toast Stack */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 pointer-events-none max-w-sm w-full px-4 sm:px-0">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-center justify-between gap-3 p-3.5 rounded-2xl border shadow-xl animate-slide-up ${
              t.type === 'error'
                ? 'bg-[#202A2D] border-[#B87568] text-[#B87568]'
                : t.type === 'success'
                ? 'bg-[#202A2D] border-[#71877B] text-[#D9D0B8]'
                : 'bg-[#202A2D] border-[#3A4B4D] text-[#D9D0B8]'
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              {t.type === 'error' ? (
                <XCircle className="h-4 w-4 shrink-0 text-[#B87568]" />
              ) : t.type === 'success' ? (
                <CheckCircle2 className="h-4 w-4 shrink-0 text-[#71877B]" />
              ) : (
                <Info className="h-4 w-4 shrink-0 text-[#D0A56A]" />
              )}
              <span className="text-xs font-medium truncate">{t.message}</span>
            </div>
            <button
              onClick={() => removeToast(t.id)}
              className="p-1 text-[#7F8B86] hover:text-[#D9D0B8] rounded-md transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>
    </>
  );
};
