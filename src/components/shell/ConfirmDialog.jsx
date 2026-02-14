import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AlertTriangle, Info } from 'lucide-react';
import { Badge } from "@/components/ui/badge";

export default function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  onConfirm,
  destructive = false,
  changes = [],
  preview
}) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-2xl">
        <AlertDialogHeader>
          <div className="flex items-center gap-3">
            {destructive ? (
              <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
            ) : (
              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                <Info className="h-5 w-5 text-blue-600" />
              </div>
            )}
            <AlertDialogTitle>{title}</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="mt-2">
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>

        {/* Preview Changes */}
        {changes.length > 0 && (
          <div className="mt-4 space-y-2">
            <p className="text-sm font-semibold text-slate-700">Changes to be applied:</p>
            <div className="border border-slate-200 rounded-lg p-3 bg-slate-50 max-h-48 overflow-auto">
              <ul className="space-y-1 text-sm">
                {changes.map((change, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-slate-500">•</span>
                    <span className="text-slate-700">{change}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Custom Preview */}
        {preview && (
          <div className="mt-4">
            <p className="text-sm font-semibold text-slate-700 mb-2">Preview:</p>
            <div className="border border-slate-200 rounded-lg p-3 bg-slate-50 max-h-64 overflow-auto">
              {preview}
            </div>
          </div>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel>{cancelText}</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className={destructive ? 'bg-red-600 hover:bg-red-700' : ''}
          >
            {confirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}