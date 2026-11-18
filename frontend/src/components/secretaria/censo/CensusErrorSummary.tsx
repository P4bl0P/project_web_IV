import { AlertCircle } from 'lucide-react';
import { CENSUS_FIELD_LABELS, type CensusFieldErrors } from './censusForm';

interface Props {
  message: string;
  fieldErrors: CensusFieldErrors;
}

export default function CensusErrorSummary({ message, fieldErrors }: Props) {
  const fields = Object.keys(fieldErrors);
  return (
    <div
      role="alert"
      className="flex items-start gap-3 rounded-xl border border-rose-200/90 bg-rose-50/95 px-4 py-3 text-xs text-rose-900 shadow-2xs"
    >
      <AlertCircle size={16} className="mt-0.5 shrink-0 text-rose-600" />
      <div className="min-w-0">
        <p className="font-semibold text-rose-950">{message}</p>
        {fields.length > 0 && (
          <ul className="mt-1.5 list-disc pl-4 space-y-0.5 font-normal text-rose-800">
            {fields.map((field) => (
              <li key={field}>{CENSUS_FIELD_LABELS[field] || field}</li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
