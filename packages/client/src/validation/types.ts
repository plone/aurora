import { z } from 'zod';

export const createTypeFieldDataSchema = z.object({
  description: z.string(),
  factory: z.string(),
  required: z.boolean().optional(),
  title: z.string(),
});

export const updateTypeFieldDataSchema = z.object({
  description: z.string().optional(),
  maxLength: z.number().optional(),
  minLength: z.number().optional(),
  fields: z.array(z.string()).optional(),
  required: z.boolean().optional(),
  title: z.string().optional(),
  properties: z.any().optional(),
  fieldsets: z.array(z.any()).optional(),
});

export const updateTypeSchemaDataSchema = z
  .object({
    fieldsets: z.array(z.any()),
    properties: z.record(z.string(), z.any()),
    required: z.array(z.string()).optional(),
    layouts: z.array(z.string()).optional(),
  })
  .passthrough();
