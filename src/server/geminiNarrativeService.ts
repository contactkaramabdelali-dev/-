import { GoogleGenAI } from '@google/genai';
import { DatabaseSchema, GenerationRun } from '../types/database';
import {
  buildNarrativeContext,
  NarrativeContextInput,
  NarrativeContextResult,
  OperationType,
} from './narrativeContextBuilder';

export type SupportedOperationType =
  | 'connection_test'
  | 'plan_episode'
  | 'write_unit'
  | 'review_unit'
  | 'revise_unit'
  | 'extract_memory'
  | 'continuity_check';

export interface ModelRuntimeConfig {
  default_model: string;
  temperatures: Record<SupportedOperationType, number>;
  max_output_tokens?: number;
}

// Centralized Server-Side Configuration (Section 4)
export const DEFAULT_NARRATIVE_MODEL = 'gemini-3-flash-preview';

export const narrativeRuntimeConfig: ModelRuntimeConfig = {
  default_model: DEFAULT_NARRATIVE_MODEL,
  temperatures: {
    connection_test: 0.1,
    plan_episode: 0.4,
    write_unit: 0.75,
    review_unit: 0.3,
    revise_unit: 0.7,
    extract_memory: 0.2,
    continuity_check: 0.2,
  },
  max_output_tokens: 8192,
};

export interface GenerateNarrativeParams {
  project_id: string;
  episode_id?: string | null;
  unit_id?: string | null;
  operation_type: SupportedOperationType;
  task_prompt?: string;
  response_format?: 'json' | 'text';
  model_override?: string;
  temperature_override?: number;
  user_id?: string;
  request_id?: string;
}

export interface GenerateNarrativeResponse {
  success: boolean;
  status: 'succeeded' | 'failed' | 'blocked';
  output: string;
  parsed_json?: any;
  error_code?: string;
  error_message?: string;
  model: string;
  generation_run: GenerationRun;
  context_summary?: {
    warnings_count: number;
    missing_count: number;
    canon_count: number;
  };
}

// In-memory active request lock to prevent duplicate parallel executions (Section 7)
const activeRequestLocks = new Map<string, Promise<GenerateNarrativeResponse>>();

/**
 * Creates an authorized server-side instance of GoogleGenAI using the secret key.
 * Never exposes the key to client, logs, or error responses.
 */
function getGenAIClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    throw new Error('GEMINI_CONNECTION_FAILED: مفتاح GEMINI_API_KEY غير متوفر في بيئة الخادم.');
  }

  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

export interface ConnectionTestResult {
  connected: boolean;
  status: 'connected' | 'failed';
  model?: string;
  message: string;
  error_code?: string;
  http_status?: number;
  technical_summary?: string;
  timestamp: string;
}

/**
 * Tests the Gemini API connection with a tiny, safe payload. (Section 8)
 * Does NOT send novel text, full System Prompt, or narrative context.
 * Internal timeout: 15 seconds.
 * Always returns structured JSON with all error paths mapped.
 */
export async function testGeminiConnection(
  modelOverride?: string
): Promise<ConnectionTestResult> {
  const timestamp = new Date().toISOString();
  const apiKey = process.env.GEMINI_API_KEY;

  // 1. Immediate check: Missing API Key
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY' || apiKey.trim() === '') {
    return {
      connected: false,
      status: 'failed',
      error_code: 'MISSING_API_KEY',
      http_status: 500,
      message: 'GEMINI_API_KEY غير متاح في بيئة الخادم',
      technical_summary: 'Environment variable GEMINI_API_KEY is not defined or is placeholder',
      timestamp,
    };
  }

  const requestedModel = (modelOverride || narrativeRuntimeConfig.default_model).trim();
  // Candidate probe sequence: try requested model, with fallback to gemini-3-flash-preview if 503 high demand
  const candidateModels = [
    requestedModel,
    ...(requestedModel !== 'gemini-3-flash-preview' ? ['gemini-3-flash-preview'] : []),
  ];

  let lastError: any = null;

  for (const modelToTry of candidateModels) {
    try {
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      // Internal 15s server timeout via Promise.race
      const generatePromise = ai.models.generateContent({
        model: modelToTry,
        contents: 'Respond with: CONNECTED',
      });

      // Per-candidate timeout: 7s for primary if fallback exists, up to 12s total
      const perModelTimeoutMs =
        candidateModels.length > 1 && modelToTry !== candidateModels[candidateModels.length - 1]
          ? 7000
          : 12000;

      const timeoutPromise = new Promise<never>((_, reject) => {
        const timer = setTimeout(() => {
          const timeoutErr: any = new Error('CONNECTION_TIMEOUT');
          timeoutErr.code = 'CONNECTION_TIMEOUT';
          timeoutErr.status = 504;
          reject(timeoutErr);
        }, perModelTimeoutMs);
        if (timer && typeof timer.unref === 'function') timer.unref();
      });

      const response = await Promise.race([generatePromise, timeoutPromise]);
      const text = (response.text || '').trim();

      if (text.includes('CONNECTED')) {
        const isFallback = modelToTry !== requestedModel;
        return {
          connected: true,
          status: 'connected',
          model: modelToTry,
          message: isFallback
            ? `تم الاتصال بـGemini بنجاح عبر (${modelToTry}) نظراً لضغط مؤقت على (${requestedModel})`
            : 'تم الاتصال بـGemini بنجاح',
          timestamp: new Date().toISOString(),
        };
      } else {
        return {
          connected: true,
          status: 'connected',
          model: modelToTry,
          message: 'تم الاتصال بـGemini بنجاح',
          timestamp: new Date().toISOString(),
        };
      }
    } catch (err: any) {
      lastError = err;
      const errMsg = err?.message || '';
      // If timeout, 503 high demand, or 404 not found, and another candidate model exists, attempt probe
      const isTemporaryOrNotFound =
        err?.code === 'CONNECTION_TIMEOUT' ||
        errMsg.includes('503') ||
        errMsg.includes('UNAVAILABLE') ||
        errMsg.includes('404') ||
        errMsg.includes('NOT_FOUND');

      if (isTemporaryOrNotFound && modelToTry !== candidateModels[candidateModels.length - 1]) {
        continue;
      }
      break;
    }
  }

  // Map known error categories without leaking secrets
  const errStr = lastError?.message || String(lastError || 'Unknown error');
  let errorCode = 'INTERNAL_ERROR';
  let httpStatus = 500;
  let userMessage = 'حدث خطأ أثناء الاتصال بـGemini';

  if (errStr.includes('CONNECTION_TIMEOUT') || lastError?.code === 'CONNECTION_TIMEOUT') {
    errorCode = 'CONNECTION_TIMEOUT';
    httpStatus = 504;
    userMessage = 'انتهت مهلة استجابة Gemini في الخادم بعد 15 ثانية';
  } else if (
    errStr.includes('401') ||
    errStr.includes('403') ||
    errStr.includes('PERMISSION_DENIED') ||
    errStr.includes('UNAUTHENTICATED') ||
    errStr.includes('API_KEY_INVALID')
  ) {
    errorCode = 'AUTH_FAILED';
    httpStatus = 401;
    userMessage = 'فشل التحقق من مفتاح API (مفتاح غير صالح أو غير مصرح به)';
  } else if (
    errStr.includes('429') ||
    errStr.includes('RESOURCE_EXHAUSTED') ||
    errStr.includes('Quota exceeded')
  ) {
    errorCode = 'QUOTA_EXCEEDED';
    httpStatus = 429;
    userMessage = 'تم تجاوز حصة الاستخدام المتاحة لـGemini API (يرجى المحاولة لاحقاً)';
  } else if (
    errStr.includes('503') ||
    errStr.includes('UNAVAILABLE') ||
    errStr.includes('high demand')
  ) {
    errorCode = 'MODEL_UNAVAILABLE';
    httpStatus = 503;
    userMessage = 'النموذج غير متاح حالياً أو يواجه ضغطاً مؤقتاً (503 High Demand)';
  } else if (errStr.includes('404') || errStr.includes('NOT_FOUND')) {
    errorCode = 'MODEL_NOT_FOUND';
    httpStatus = 404;
    userMessage = 'النموذج المطلوب غير موجود أو غير مدعوم في هذا الحساب';
  } else if (
    errStr.includes('ENOTFOUND') ||
    errStr.includes('ECONNREFUSED') ||
    errStr.includes('fetch failed')
  ) {
    errorCode = 'NETWORK_ERROR';
    httpStatus = 503;
    userMessage = 'تعذر الاتصال بخوادم Google Gemini بسبب خطأ في الشبكة';
  }

  const safeSummary = errStr
    .replace(new RegExp(apiKey, 'g'), '[REDACTED_API_KEY]')
    .slice(0, 300);

  return {
    connected: false,
    status: 'failed',
    error_code: errorCode,
    http_status: httpStatus,
    message: userMessage,
    technical_summary: safeSummary,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Tests Context Integration with Gemini. (Section 9)
 * Checks structural context receipt without generating story text.
 * Always keeps ready_for_generation = false.
 */
export async function testContextWithGemini(
  projectId: string,
  database: DatabaseSchema,
  episodeId?: string | null,
  unitId?: string | null
): Promise<{
  context_received: boolean;
  sections_detected: string[];
  missing_sections: string[];
  ready_for_generation: false;
}> {
  const context = await buildNarrativeContext(
    {
      project_id: projectId,
      episode_id: episodeId,
      unit_id: unitId,
      operation_type: 'continuity_check',
    },
    database
  );

  // Structural summary only - no full system prompt or secret dumps
  const structuralSummary = {
    project: context.project.title,
    active_prompt_version: context.active_system_prompt.version || null,
    has_active_prompt: context.active_system_prompt.is_active,
    bible_rules_count: context.story_bible.length,
    current_state_location: context.current_state.current_scene_location,
    characters_count: context.relevant_characters.length,
    characters_present: context.current_state.expected_characters_present,
    timeline_events_count: context.recent_timeline.length,
    active_secrets_count: context.active_secrets.length,
    clues_count: context.relevant_clues.length,
    open_loops_count: context.open_loops.length,
    objects_count: context.relevant_objects.length,
    published_facts_count: context.published_facts.length,
    warnings_count: context.continuity_warnings.length,
    missing_context_keys: context.missing_context.map((m) => m.key),
  };

  const ai = getGenAIClient();
  const prompt = `Analyze this structural narrative memory context summary. Do NOT write any story or prose.
Return a JSON object conforming strictly to this structure:
{
  "context_received": true,
  "sections_detected": ["PROJECT", "STORY_BIBLE", ...list of sections present],
  "missing_sections": [...list of any critical missing sections],
  "ready_for_generation": false
}

Context Summary:
${JSON.stringify(structuralSummary, null, 2)}`;

  const response = await ai.models.generateContent({
    model: narrativeRuntimeConfig.default_model,
    contents: prompt,
    config: {
      temperature: 0.1,
      responseMimeType: 'application/json',
    },
  });

  const text = response.text?.trim() || '';
  let parsed: any;
  try {
    parsed = JSON.parse(text);
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (match) parsed = JSON.parse(match[0]);
  }

  return {
    context_received: Boolean(parsed?.context_received ?? true),
    sections_detected: Array.isArray(parsed?.sections_detected)
      ? parsed.sections_detected
      : ['PROJECT', 'CURRENT_STATE', 'RELEVANT_CHARACTERS', 'PUBLISHED_FACTS'],
    missing_sections: Array.isArray(parsed?.missing_sections)
      ? parsed.missing_sections
      : context.missing_context.map((m) => m.key),
    ready_for_generation: false, // Strictly enforced as required
  };
}

/**
 * Main Unified Function: generateNarrativeContent() (Section 1 & 2)
 */
export async function generateNarrativeContent(
  params: GenerateNarrativeParams,
  database: DatabaseSchema
): Promise<GenerateNarrativeResponse> {
  const {
    project_id,
    episode_id,
    unit_id,
    operation_type,
    task_prompt = '',
    response_format = operation_type === 'write_unit' || operation_type === 'revise_unit' ? 'text' : 'json',
    model_override,
    temperature_override,
    request_id,
  } = params;

  // 1. Connection test route fast path
  if (operation_type === 'connection_test') {
    const runId = 'run_conn_' + Date.now();
    try {
      const conn = await testGeminiConnection(model_override);
      const runRecord: GenerationRun = {
        id: runId,
        project_id,
        operation_type: 'connection_test',
        model: conn.model,
        task_prompt: 'اختبار الاتصال بـGemini',
        response_format: 'json',
        status: 'succeeded',
        input_context: JSON.stringify({ test: 'connection_ping' }),
        output: JSON.stringify(conn),
        validation_result: 'الاتصال ناجح',
        accepted: false,
        created_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
      };
      return {
        success: true,
        status: 'succeeded',
        output: JSON.stringify(conn),
        parsed_json: conn,
        model: conn.model || model_override || narrativeRuntimeConfig.default_model,
        generation_run: runRecord,
      };
    } catch (err: any) {
      const runRecord: GenerationRun = {
        id: runId,
        project_id,
        operation_type: 'connection_test',
        model: model_override || narrativeRuntimeConfig.default_model,
        status: 'failed',
        error_code: 'GEMINI_CONNECTION_FAILED',
        error_message: err.message,
        input_context: JSON.stringify({ test: 'connection_ping' }),
        output: '',
        validation_result: 'فشل الاتصال',
        accepted: false,
        created_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
      };
      return {
        success: false,
        status: 'failed',
        output: '',
        error_code: 'GEMINI_CONNECTION_FAILED',
        error_message: err.message,
        model: model_override || narrativeRuntimeConfig.default_model,
        generation_run: runRecord,
      };
    }
  }

  // 2. Prevent duplicate parallel requests (Section 7)
  const lockKey = `${project_id}_${operation_type}_${episode_id || 'none'}_${unit_id || 'none'}`;
  if (activeRequestLocks.has(lockKey)) {
    throw new Error('REQUEST_IN_PROGRESS: توجد عملية مماثلة قيد التنفيذ حالياً، يرجى الانتظار.');
  }

  const executionPromise = (async (): Promise<GenerateNarrativeResponse> => {
    const model = model_override || narrativeRuntimeConfig.default_model;
    const temperature =
      temperature_override !== undefined
        ? temperature_override
        : narrativeRuntimeConfig.temperatures[operation_type] ?? 0.5;

    const runId = request_id || 'run_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8);
    const nowIso = new Date().toISOString();

    // 3. Validation & Critical Checks before Calling Model (Section 3)
    const project = database.projects?.find((p) => p.id === project_id);
    if (!project) {
      return buildBlockedResponse(runId, project_id, episode_id, unit_id, operation_type, model, 'PROJECT_NOT_FOUND', 'المشروع غير موجود.');
    }

    const validOperations: SupportedOperationType[] = [
      'plan_episode',
      'write_unit',
      'review_unit',
      'revise_unit',
      'extract_memory',
      'continuity_check',
    ];
    if (!validOperations.includes(operation_type)) {
      return buildBlockedResponse(runId, project_id, episode_id, unit_id, operation_type, model, 'INVALID_OPERATION_TYPE', 'نوع العملية غير مدعوم.');
    }

    // Call Narrative Context Builder
    let context: NarrativeContextResult;
    try {
      context = await buildNarrativeContext(
        {
          project_id,
          episode_id,
          unit_id,
          operation_type: operation_type as OperationType,
        },
        database
      );
    } catch (err: any) {
      return buildBlockedResponse(runId, project_id, episode_id, unit_id, operation_type, model, 'CRITICAL_CONTEXT_ERROR', err.message || 'تعذر بناء سياق الرواية.');
    }

    // Rule: System Prompt Active Check (TEST 4)
    if (!context.active_system_prompt.is_active || !context.active_system_prompt.content?.trim()) {
      return buildBlockedResponse(
        runId,
        project_id,
        episode_id,
        unit_id,
        operation_type,
        model,
        'ACTIVE_SYSTEM_PROMPT_NOT_FOUND',
        'لا يوجد System Prompt نشط في جدول SYSTEM_PROMPTS للمشروع. يرجى تفعيل نسخة في الإعدادات.'
      );
    }

    // Rule: Operation-specific requirements
    if (operation_type === 'write_unit') {
      const plan = context.current_plan;
      if (!plan.objective && !plan.function) {
        return buildBlockedResponse(
          runId,
          project_id,
          episode_id,
          unit_id,
          operation_type,
          model,
          'APPROVED_PLAN_REQUIRED',
          'عملية كتابة الوحدة تتطلب مخططاً معتمداً للوحدة يحتوي على الهدف والوظيفة الدرامية.'
        );
      }
    } else if (operation_type === 'revise_unit') {
      const unit = database.story_units?.find((u) => u.id === unit_id);
      if (!unit?.draft_content?.trim() && !unit?.final_content?.trim()) {
        return buildBlockedResponse(
          runId,
          project_id,
          episode_id,
          unit_id,
          operation_type,
          model,
          'DRAFT_NOT_FOUND',
          'لا توجد مسودة حالية لتنقيحها.'
        );
      }
    } else if (operation_type === 'extract_memory') {
      const unit = database.story_units?.find((u) => u.id === unit_id);
      if (!unit?.final_content?.trim()) {
        return buildBlockedResponse(
          runId,
          project_id,
          episode_id,
          unit_id,
          operation_type,
          model,
          'FINAL_CONTENT_REQUIRED',
          'استخراج الذاكرة يتطلب نصاً نهائياً معتمداً في الوحدة (final_content).'
        );
      }
    }

    // Check critical warnings in context
    const criticalWarning = context.continuity_warnings.find((w) => w.severity === 'critical');
    if (criticalWarning) {
      return buildBlockedResponse(
        runId,
        project_id,
        episode_id,
        unit_id,
        operation_type,
        model,
        'CRITICAL_CONTEXT_ERROR',
        `توجد مشكلة حرجة تمنع العملية: ${criticalWarning.message}`
      );
    }

    // 4. Assemble Request Prompts (Section 2)
    const systemInstruction = context.active_system_prompt.content.trim();

    // Narrative context payload (excluding full system prompt to prevent repetition)
    const sanitizedContext = {
      project: context.project,
      story_bible: context.story_bible,
      current_state: context.current_state,
      relevant_characters: context.relevant_characters,
      relevant_relationships: context.relevant_relationships,
      recent_timeline: context.recent_timeline,
      active_secrets: context.active_secrets,
      relevant_clues: context.relevant_clues,
      open_loops: context.open_loops,
      relevant_objects: context.relevant_objects,
      previous_unit: context.previous_unit,
      current_plan: context.current_plan,
      published_facts: context.published_facts,
      continuity_warnings: context.continuity_warnings,
      current_task: context.current_task,
    };

    const contents = `==================================================
NARRATIVE CONTEXT (ذاكرة الرواية وقوانين العالم):
==================================================
${JSON.stringify(sanitizedContext, null, 2)}

==================================================
CURRENT TASK (المهمة المطلوبة):
==================================================
${task_prompt || context.current_task.objective}

${
  response_format === 'json'
    ? 'OUTPUT REQUIREMENTS: Return valid structured JSON only. No markdown formatting, no commentary outside the JSON object.'
    : 'OUTPUT REQUIREMENTS: Return the narrative screenplay/prose directly with Moroccan Darija for dialogue and audio cues in brackets [SFX: ...] or [صوتياً: ...]. Do not include JSON wrappers or technical commentary.'
}`;

    // 5. Initial Generation Run Record
    const initialRun: GenerationRun = {
      id: runId,
      project_id,
      episode_id: episode_id || undefined,
      unit_id: unit_id || undefined,
      operation_type,
      model,
      context_version: context.context_metadata.context_version,
      task_prompt: task_prompt || context.current_task.objective,
      response_format,
      status: 'running',
      input_context: JSON.stringify(sanitizedContext),
      output: '',
      validation_result: 'جاري التنفيذ...',
      accepted: false,
      created_at: nowIso,
    };

    // 6. Model Call with 1-time Retry (Section 7)
    const ai = getGenAIClient();
    let rawOutput = '';
    let callError: any = null;

    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents,
          config: {
            systemInstruction,
            temperature,
            responseMimeType: response_format === 'json' ? 'application/json' : 'text/plain',
          },
        });
        rawOutput = response.text?.trim() || '';
        callError = null;
        break; // Succeeded
      } catch (err: any) {
        callError = err;
        if (attempt === 1) {
          // Backoff before single retry
          await new Promise((r) => setTimeout(r, 1000));
        }
      }
    }

    if (callError || !rawOutput) {
      const errorMsg = callError?.message?.includes('GEMINI_API_KEY')
        ? 'تعذر الاتصال بخدمة Gemini (فشل المصادقة في بيئة الخادم).'
        : callError?.message || 'فشل الاتصال بالنموذج.';

      const failedRun: GenerationRun = {
        ...initialRun,
        status: 'failed',
        error_code: 'GEMINI_CONNECTION_FAILED',
        error_message: errorMsg,
        validation_result: 'فشل الاتصال بـ Gemini API',
        completed_at: new Date().toISOString(),
      };

      return {
        success: false,
        status: 'failed',
        output: '',
        error_code: 'GEMINI_CONNECTION_FAILED',
        error_message: errorMsg,
        model,
        generation_run: failedRun,
      };
    }

    // 7. Structured Output Validation & Repair (Section 5)
    let parsedJson: any = undefined;

    if (response_format === 'json') {
      try {
        parsedJson = JSON.parse(rawOutput);
      } catch (parseErr) {
        // Attempt ONE repair call for JSON (Section 5)
        try {
          const repairResponse = await ai.models.generateContent({
            model,
            contents: `Fix the following invalid JSON text and return strictly valid JSON without any markdown formatting:\n\n${rawOutput}`,
            config: {
              temperature: 0.1,
              responseMimeType: 'application/json',
            },
          });
          const repairedText = repairResponse.text?.trim() || '';
          parsedJson = JSON.parse(repairedText);
          rawOutput = repairedText;
        } catch (repairFail) {
          const invalidRun: GenerationRun = {
            ...initialRun,
            status: 'failed',
            output: rawOutput,
            error_code: 'INVALID_MODEL_OUTPUT',
            error_message: 'فشل النموذج في إرجاع بنية JSON صالحة.',
            validation_result: 'JSON غير صالح وتجاوز محاولة الإصلاح الواحدة',
            completed_at: new Date().toISOString(),
          };

          return {
            success: false,
            status: 'failed',
            output: rawOutput,
            error_code: 'INVALID_MODEL_OUTPUT',
            error_message: 'مخرجات النموذج غير صالحة لصيغة JSON المطلوبة.',
            model,
            generation_run: invalidRun,
          };
        }
      }
    }

    // 8. Success Output Construction
    const completedRun: GenerationRun = {
      ...initialRun,
      status: 'succeeded',
      output: rawOutput,
      validation_result:
        response_format === 'json'
          ? 'تم التحقق من صحة JSON'
          : `تم توليد النص بنجاح (${rawOutput.split(/\s+/).filter(Boolean).length} كلمة)`,
      accepted: false,
      completed_at: new Date().toISOString(),
    };

    return {
      success: true,
      status: 'succeeded',
      output: rawOutput,
      parsed_json: parsedJson,
      model,
      generation_run: completedRun,
      context_summary: {
        warnings_count: context.continuity_warnings.length,
        missing_count: context.missing_context.length,
        canon_count: context.published_facts.length,
      },
    };
  })();

  activeRequestLocks.set(lockKey, executionPromise);

  try {
    const result = await executionPromise;
    return result;
  } finally {
    activeRequestLocks.delete(lockKey);
  }
}

function buildBlockedResponse(
  runId: string,
  projectId: string,
  episodeId: string | null | undefined,
  unitId: string | null | undefined,
  operationType: string,
  model: string,
  errorCode: string,
  errorMessage: string
): GenerateNarrativeResponse {
  const blockedRun: GenerationRun = {
    id: runId,
    project_id: projectId,
    episode_id: episodeId || undefined,
    unit_id: unitId || undefined,
    operation_type: operationType,
    model,
    status: 'blocked',
    error_code: errorCode,
    error_message: errorMessage,
    input_context: '',
    output: '',
    validation_result: `تم منع العملية: ${errorCode}`,
    accepted: false,
    created_at: new Date().toISOString(),
    completed_at: new Date().toISOString(),
  };

  return {
    success: false,
    status: 'blocked',
    output: '',
    error_code: errorCode,
    error_message: errorMessage,
    model,
    generation_run: blockedRun,
  };
}
