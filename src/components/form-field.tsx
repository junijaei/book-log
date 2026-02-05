import type { ReactNode } from 'react';
import { Label } from './ui/label';
import { MESSAGES } from '@/lib/constants';

interface FormFieldProps {
  label: string;
  required?: boolean;
  children: ReactNode;
  htmlFor?: string;
  error?: string;
}

export function FormField({ label, required = false, children, htmlFor, error }: FormFieldProps) {
  return (
    <div className="space-y-1">
      <Label htmlFor={htmlFor}>
        {label} {required && <span className="text-destructive">{MESSAGES.REQUIRED_FIELD}</span>}
      </Label>
      {children}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
