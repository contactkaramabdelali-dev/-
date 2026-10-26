import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import { buildNarrativeContext, NarrativeContextInput } from './src/server/narrativeContextBuilder.ts';
import {
  generateNarrativeContent,
  testGeminiConnection,
  testContextWithGemini,
  narrativeRuntimeConfig,
  DEFAULT_NARRATIVE_MODEL,
} from './src/server/geminiNarrativeService.ts';
import {
  planEpisode,
  runPlanValidationPass,
  EpisodePlanResult,
} from './src/server/episodePlanningService.ts';
import { DatabaseSchema, GenerationRun } from './src/types/database.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = parseInt(process.env.PORT || '3000', 10);

  // Body parsing with safe size limit
  app.use(express.json({ limit: '15mb' }));

  // In-memory backend runs store (mirrored with client persistence)
  const serverGenerationRuns: GenerationRun[] = [];

  /**
   * POST /api/narrative-context/build
   * Secure backend route for assembling the novel's memory context
   */
  app.post('/api/narrative-context/build', async (req: Request, res: Response): Promise<void> => {
    try {
      const {
        project_id,
        episode_id,
        unit_id,
        operation_type,
        db_snapshot,
        user_id,
      } = req.body;

      // 1. Validation & Security Checks
      if (!project_id) {
        res.status(400).json({ error: 'PROJECT_ID_REQUIRED', message: 'معرف المشروع مطلوب' });
        return;
      }

      if (!operation_type) {
        res.status(400).json({ error: 'OPERATION_TYPE_REQUIRED', message: 'نوع العملية مطلوب' });
        return;
      }

      const validOperations = [
        'plan_episode',
        'write_unit',
        'review_unit',
        'revise_unit',
        'extract_memory',
        'continuity_check',
      ];
      if (!validOperations.includes(operation_type)) {
        res.status(400).json({ error: 'INVALID_OPERATION_TYPE', message: 'نوع عملية غير صالح' });
        return;
      }

      // Check database snapshot passed securely from authorized author session
      const database: DatabaseSchema = db_snapshot || {
        projects: [],
        story_bible: [],
        characters: [],
        character_relationships: [],
        locations: [],
        episodes: [],
        story_units: [],
        timeline_events: [],
        secrets: [],
        clues: [],
        open_loops: [],
        objects: [],
        continuity_log: [],
        story_decisions: [],
        generation_runs: [],
        system_prompts: [],
      };

      const project = database.projects?.find((p) => p.id === project_id);
      if (!project) {
        res.status(404).json({
          error: 'PROJECT_NOT_FOUND',
          message: 'المشروع غير موجود أو غير مصرح بالوصول إليه',
        });
        return;
      }

      // 2. Build Context using Backend Service
      const input: NarrativeContextInput = {
        project_id,
        episode_id: episode_id || null,
        unit_id: unit_id || null,
        operation_type,
        user_id,
      };

      const result = await buildNarrativeContext(input, database);

      // 3. Create Generation Run entry (Section 20)
      const runId = 'run_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8);
      const validationSummary = `Warnings: ${result.continuity_warnings.length} (${result.continuity_warnings
        .map((w) => w.severity)
        .join(', ')}), Missing: ${result.missing_context.length}, Canon: ${result.published_facts.length}`;

      // Mask raw system prompt in stored log to avoid leaking in public logs
      const sanitizedForLog = {
        ...result,
        active_system_prompt: {
          id: result.active_system_prompt.id,
          name: result.active_system_prompt.name,
          version: result.active_system_prompt.version,
          is_active: result.active_system_prompt.is_active,
          word_count: result.active_system_prompt.word_count,
        },
      };

      const generationRunRecord: GenerationRun = {
        id: runId,
        project_id,
        episode_id: episode_id || undefined,
        unit_id: unit_id || undefined,
        operation_type,
        status: 'succeeded',
        input_context: JSON.stringify(sanitizedForLog),
        output: '',
        validation_result: validationSummary,
        accepted: false,
        created_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
      };

      serverGenerationRuns.push(generationRunRecord);

      // 4. Return assembled result and generated run record
      res.status(200).json({
        success: true,
        data: result,
        generation_run: generationRunRecord,
      });
    } catch (err: any) {
      console.error('Error in buildNarrativeContext:', err.message);
      res.status(500).json({
        error: 'NARRATIVE_CONTEXT_ERROR',
        message: err.message || 'حدث خطأ أثناء بناء سياق ذاكرة الرواية',
      });
    }
  });

  /**
   * GET /api/gemini/config
   * Returns current model configuration (safe, no secrets exposed)
   */
  app.get('/api/gemini/config', (_req: Request, res: Response) => {
    const hasKey = Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY');
    res.json({
      success: true,
      config: narrativeRuntimeConfig,
      default_model: DEFAULT_NARRATIVE_MODEL,
      has_api_key: hasKey,
    });
  });

  /**
   * POST /api/gemini/config
   * Updates runtime model configuration
   */
  app.post('/api/gemini/config', (req: Request, res: Response) => {
    const { model, temperatures, max_output_tokens } = req.body;
    if (model && typeof model === 'string') {
      narrativeRuntimeConfig.default_model = model.trim();
    }
    if (temperatures && typeof temperatures === 'object') {
      narrativeRuntimeConfig.temperatures = {
        ...narrativeRuntimeConfig.temperatures,
        ...temperatures,
      };
    }
    if (max_output_tokens && typeof max_output_tokens === 'number') {
      narrativeRuntimeConfig.max_output_tokens = max_output_tokens;
    }
    res.json({ success: true, config: narrativeRuntimeConfig });
  });

  /**
   * POST /api/gemini/test-connection
   * Section 8: Fast safe connection ping returning structured JSON
   */
  app.post('/api/gemini/test-connection', async (req: Request, res: Response): Promise<void> => {
    try {
      const { model_override } = req.body;
      const result = await testGeminiConnection(model_override);
      const httpStatus = result.connected ? 200 : (result.http_status || 500);
      res.status(httpStatus).json(result);
    } catch (err: any) {
      console.error('Unhandled error in test-connection endpoint:', err?.message || err);
      res.status(500).json({
        connected: false,
        status: 'failed',
        error_code: 'INTERNAL_ERROR',
        http_status: 500,
        message: 'حدث خطأ داخلي في الخادم أثناء اختبار الاتصال',
        technical_summary: err?.message || 'Unknown internal error',
        timestamp: new Date().toISOString(),
      });
    }
  });

  /**
   * POST /api/gemini/test-context
   * Section 9: Context structure validation with Gemini
   */
  app.post('/api/gemini/test-context', async (req: Request, res: Response): Promise<void> => {
    try {
      const { project_id, episode_id, unit_id, db_snapshot } = req.body;
      if (!project_id) {
        res.status(400).json({ error: 'PROJECT_ID_REQUIRED', message: 'معرف المشروع مطلوب' });
        return;
      }

      const database: DatabaseSchema = db_snapshot || {
        projects: [],
        story_bible: [],
        characters: [],
        character_relationships: [],
        locations: [],
        episodes: [],
        story_units: [],
        timeline_events: [],
        secrets: [],
        clues: [],
        open_loops: [],
        objects: [],
        continuity_log: [],
        story_decisions: [],
        generation_runs: [],
        system_prompts: [],
      };

      const result = await testContextWithGemini(project_id, database, episode_id, unit_id);
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error_code: 'GEMINI_CONTEXT_TEST_FAILED',
        error_message: err.message || 'فشل اختبار السياق مع Gemini',
      });
    }
  });

  /**
   * POST /api/gemini/generate
   * Section 1: Unified server-side narrative generation endpoint
   */
  app.post('/api/gemini/generate', async (req: Request, res: Response): Promise<void> => {
    try {
      const {
        project_id,
        episode_id,
        unit_id,
        operation_type,
        task_prompt,
        response_format,
        model_override,
        temperature_override,
        db_snapshot,
        user_id,
        request_id,
      } = req.body;

      if (!project_id) {
        res.status(400).json({ error_code: 'PROJECT_NOT_FOUND', error_message: 'معرف المشروع مطلوب' });
        return;
      }

      const database: DatabaseSchema = db_snapshot || {
        projects: [],
        story_bible: [],
        characters: [],
        character_relationships: [],
        locations: [],
        episodes: [],
        story_units: [],
        timeline_events: [],
        secrets: [],
        clues: [],
        open_loops: [],
        objects: [],
        continuity_log: [],
        story_decisions: [],
        generation_runs: [],
        system_prompts: [],
      };

      const result = await generateNarrativeContent(
        {
          project_id,
          episode_id,
          unit_id,
          operation_type,
          task_prompt,
          response_format,
          model_override,
          temperature_override,
          user_id,
          request_id,
        },
        database
      );

      // Save run to in-memory list
      serverGenerationRuns.push(result.generation_run);

      res.status(200).json(result);
    } catch (err: any) {
      console.error('Error in /api/gemini/generate:', err.message);
      res.status(500).json({
        success: false,
        status: 'failed',
        error_code: 'GEMINI_SERVER_ERROR',
        error_message: err.message || 'حدث خطأ في خادم Gemini',
      });
    }
  });

  /**
   * POST /api/episodes/plan
   * Stage 6: Episode Planning Engine endpoint
   */
  app.post('/api/episodes/plan', async (req: Request, res: Response): Promise<void> => {
    try {
      const {
        project_id,
        episode_id,
        episode_number,
        regenerate,
        user_notes,
        db_snapshot,
        user_id,
      } = req.body;

      const plan = await planEpisode({
        project_id,
        episode_id,
        episode_number: Number(episode_number),
        regenerate: Boolean(regenerate),
        user_notes,
        db_snapshot,
        user_id,
      });

      // Record generation run (Section 16)
      const runRecord: GenerationRun = {
        id: 'run_plan_' + Date.now(),
        project_id,
        episode_id: plan.episode_id,
        operation_type: 'plan_episode',
        model: DEFAULT_NARRATIVE_MODEL,
        status: 'succeeded',
        input_context: JSON.stringify({
          episode_number,
          user_notes: user_notes || '',
          regenerate: Boolean(regenerate),
        }),
        output: JSON.stringify(plan.episode),
        validation_result: JSON.stringify(plan.validation_report),
        accepted: false,
        created_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
      };
      serverGenerationRuns.push(runRecord);

      res.status(200).json({
        success: true,
        plan,
        generation_run: runRecord,
      });
    } catch (err: any) {
      console.error('Error in /api/episodes/plan:', err.message);
      const errorCode = err.code || 'PLANNING_FAILED';
      const statusCode =
        errorCode === 'PROJECT_NOT_FOUND' ||
        errorCode === 'ACTIVE_SYSTEM_PROMPT_NOT_FOUND' ||
        errorCode === 'MISSING_REQUIRED_CONTEXT' ||
        errorCode === 'APPROVED_PLAN_EXISTS' ||
        errorCode === 'INVALID_EPISODE_NUMBER'
          ? 400
          : errorCode === 'PLANNING_TIMEOUT'
          ? 504
          : 500;

      res.status(statusCode).json({
        success: false,
        error_code: errorCode,
        message: err.message || 'فشل بناء مخطط الحلقة',
        blocking_items: err.blocking_items,
        validation_errors: err.validation_errors,
      });
    }
  });

  /**
   * POST /api/episodes/validate-plan
   * Re-evaluates plan with Plan Validation Pass
   */
  app.post('/api/episodes/validate-plan', async (req: Request, res: Response): Promise<void> => {
    try {
      const { plan, db_snapshot, project_id } = req.body;
      if (!plan || !project_id) {
        res.status(400).json({ success: false, error_code: 'INVALID_INPUT', message: 'بيانات المخطط والمشروع مطلوبة' });
        return;
      }

      const database: DatabaseSchema = db_snapshot || {
        projects: [],
        story_bible: [],
        characters: [],
        character_relationships: [],
        locations: [],
        episodes: [],
        story_units: [],
        timeline_events: [],
        secrets: [],
        clues: [],
        open_loops: [],
        objects: [],
        continuity_log: [],
        story_decisions: [],
        generation_runs: [],
        system_prompts: [],
      };

      const context = await buildNarrativeContext(
        { project_id, episode_id: plan.episode_id || null, unit_id: null, operation_type: 'plan_episode' },
        database
      );

      const validation = await runPlanValidationPass(plan, context);
      res.status(200).json({
        success: true,
        validation_report: validation,
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error_code: 'VALIDATION_FAILED',
        message: err.message || 'فشل تدقيق المخطط',
      });
    }
  });

  /**
   * GET /api/health
   */
  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({ status: 'healthy', service: 'Narrative Studio Backend', timestamp: new Date().toISOString() });
  });

  // Dev server or Production static serving
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Narrative Studio] Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
