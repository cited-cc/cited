import { z } from "zod";

/**
 * DataForSEO wire shapes. Never expose these to UI, exports, emails, or Slack.
 * Normalize into Cited's internal evidence model before persistence.
 */

export const dataForSeoAnnotationSchema = z
  .object({
    title: z.string().nullable().optional(),
    url: z.string().nullable().optional(),
  })
  .passthrough();

export const dataForSeoSectionSchema = z
  .object({
    type: z.string().optional(),
    text: z.string().nullable().optional(),
    annotations: z.array(dataForSeoAnnotationSchema).nullable().optional(),
  })
  .passthrough();

export const dataForSeoMessageItemSchema = z
  .object({
    type: z.literal("message").or(z.string()),
    sections: z.array(dataForSeoSectionSchema).optional(),
  })
  .passthrough();

export const dataForSeoResultItemSchema = z
  .object({
    model_name: z.string().optional(),
    input_tokens: z.number().optional(),
    output_tokens: z.number().optional(),
    reasoning_tokens: z.number().nullable().optional(),
    web_search: z.boolean().optional(),
    money_spent: z.number().nullable().optional(),
    datetime: z.string().optional(),
    items: z.array(dataForSeoMessageItemSchema).nullable().optional(),
  })
  .passthrough();

export const dataForSeoAiOverviewReferenceSchema = z
  .object({
    type: z.string().optional(),
    source: z.string().nullable().optional(),
    domain: z.string().nullable().optional(),
    url: z.string().nullable().optional(),
    title: z.string().nullable().optional(),
    text: z.string().nullable().optional(),
  })
  .passthrough();

export const dataForSeoAiOverviewElementSchema = z
  .object({
    type: z.string().optional(),
    title: z.string().nullable().optional(),
    text: z.string().nullable().optional(),
    markdown: z.string().nullable().optional(),
    references: z
      .array(dataForSeoAiOverviewReferenceSchema)
      .nullable()
      .optional(),
  })
  .passthrough();

export const dataForSeoAiOverviewItemSchema = z
  .object({
    type: z.literal("ai_overview").or(z.string()),
    markdown: z.string().nullable().optional(),
    items: z.array(dataForSeoAiOverviewElementSchema).nullable().optional(),
    references: z
      .array(dataForSeoAiOverviewReferenceSchema)
      .nullable()
      .optional(),
    asynchronous_ai_overview: z.boolean().optional(),
  })
  .passthrough();

export const dataForSeoSerpItemSchema = z.record(z.string(), z.unknown());

export const dataForSeoSerpResultSchema = z
  .object({
    keyword: z.string().optional(),
    type: z.string().optional(),
    se_domain: z.string().optional(),
    location_code: z.union([z.number(), z.string()]).optional(),
    language_code: z.string().optional(),
    datetime: z.string().optional(),
    item_types: z.array(z.string()).nullable().optional(),
    items: z.array(dataForSeoSerpItemSchema).nullable().optional(),
  })
  .passthrough();

export const dataForSeoTaskDataSchema = z.union([
  z.record(z.string(), z.unknown()),
  z.array(z.record(z.string(), z.unknown())),
]);

export const dataForSeoTaskSchema = z
  .object({
    id: z.string().optional(),
    status_code: z.number(),
    status_message: z.string().optional(),
    time: z.string().optional(),
    cost: z.number().nullable().optional(),
    result_count: z.number().optional(),
    path: z.array(z.string()).optional(),
    data: dataForSeoTaskDataSchema.optional(),
    result: z
      .array(z.union([dataForSeoResultItemSchema, dataForSeoSerpResultSchema]))
      .nullable()
      .optional(),
  })
  .passthrough();

export const dataForSeoEnvelopeSchema = z
  .object({
    version: z.string().optional(),
    status_code: z.number(),
    status_message: z.string().optional(),
    time: z.string().optional(),
    cost: z.number().nullable().optional(),
    tasks_count: z.number().optional(),
    tasks_error: z.number().optional(),
    tasks: z.array(dataForSeoTaskSchema),
  })
  .passthrough();

export type DataForSeoEnvelope = z.infer<typeof dataForSeoEnvelopeSchema>;
export type DataForSeoTask = z.infer<typeof dataForSeoTaskSchema>;
export type DataForSeoResultItem = z.infer<typeof dataForSeoResultItemSchema>;
export type DataForSeoSerpResult = z.infer<typeof dataForSeoSerpResultSchema>;
export type DataForSeoAiOverviewItem = z.infer<
  typeof dataForSeoAiOverviewItemSchema
>;
export type DataForSeoAiOverviewReference = z.infer<
  typeof dataForSeoAiOverviewReferenceSchema
>;

export type DataForSeoClientOptions = {
  login: string;
  password: string;
  baseUrl: string;
  timeoutMs: number;
  fetchImpl?: typeof fetch;
};

export type DataForSeoLiveRequestPayload = {
  model_name?: string;
  user_prompt: string;
  /** Omitted for Perplexity: Sonar models search the web by default. */
  web_search?: boolean;
  max_output_tokens: number;
  tag: string;
  /** Explicitly disable reasoning for models that support it but default oddly. */
  use_reasoning?: boolean;
  web_search_country_iso_code?: string;
  /** Not documented on Perplexity live; ChatGPT and Claude only. */
  web_search_city?: string;
};

export type DataForSeoSerpRequestPayload = {
  keyword: string;
  language_code: string;
  location_code: number;
  device?: "desktop" | "mobile";
  os?: "windows" | "macos" | "android" | "ios";
  tag?: string;
  load_async_ai_overview?: boolean;
};
