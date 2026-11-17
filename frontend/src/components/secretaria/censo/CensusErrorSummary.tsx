import { AlertCircle } from 'lucide-react';
import { CENSUS_FIELD_LABELS, type CensusFieldErrors } from './censusForm';

interface Props {
  message: string;
  fieldErrors: CensusFieldErrors;
}

export default function CensusErrorSummary({ message, fieldErrors }: Props) {
  const fields = Object.keys(fieldErrors);
  return (
    <div role="alert" className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-800">
      <AlertCircle size={16} className="mt-0.5 shrink-0 text-red-600" />
      <div>
        <p className="font-semibold">{message}</p>
        {fields.length > 0 && (
          <ul className="mt-1 list-disc pl-4 font-normal">
            {fields.map((field) => <li key={field}>{CENSUS_FIELD_LABELS[field] || field}</li>)}
          </ul>
        )}
      </div>
    </div>
  );
}
