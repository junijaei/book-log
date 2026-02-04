import type { ReactNode } from 'react';
import { Label } from './ui/label';
import { MESSAGES } from '@/lib/constants';

interface FormFieldProps {
  label: string;
  required?: boolean;
  children: ReactNode;
  htmlFor?: string;
}

export function FormField({ label, required = false, children, htmlFor }: FormFieldProps) {
  return (
    <div>
      <Label htmlFor={htmlFor}>
        {label} {required && <span className="text-destructive">{MESSAGES.REQUIRED_FIELD}</span>}
      </Label>
      {children}
    </div>
  );
}
