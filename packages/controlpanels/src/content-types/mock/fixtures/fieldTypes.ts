import type { FieldType } from '../../types';

// The `Fields` vocabulary of the acceptance test backend.
export const fieldTypes: FieldType[] = [
  { id: 'Choice', title: 'Choice' },
  { id: 'Date', title: 'Date' },
  { id: 'Date/Time', title: 'Date/Time' },
  { id: 'Email', title: 'Email' },
  { id: 'File Upload', title: 'File Upload' },
  { id: 'Floating-point number', title: 'Floating-point number' },
  { id: 'Full Name', title: 'Full Name' },
  { id: 'Image', title: 'Image' },
  { id: 'Integer', title: 'Integer' },
  { id: 'JSONField', title: 'JSONField' },
  { id: 'Multiple Choice', title: 'Multiple Choice' },
  { id: 'Password', title: 'Password' },
  { id: 'Relation Choice', title: 'Relation Choice' },
  { id: 'Relation List', title: 'Relation List' },
  { id: 'Rich Text', title: 'Rich Text' },
  { id: 'Text', title: 'Text' },
  { id: 'Text line (String)', title: 'Text line (String)' },
  { id: 'URL', title: 'URL' },
  { id: 'Yes/No', title: 'Yes/No' },
];
