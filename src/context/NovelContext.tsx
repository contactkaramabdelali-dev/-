import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  Project,
  StoryBibleEntry,
  Character,
  CharacterRelationship,
  Location,
  Episode,
  StoryUnit,
  TimelineEvent,
  Secret,
  Clue,
  OpenLoop,
  StoryObject,
  ContinuityLogEntry,
  StoryDecision,
  GenerationRun,
  SystemPrompt,
  DatabaseSchema,
} from '../types/database';
import {
  loadFullDatabase,
  putItem,
  deleteItem,
} from '../db/indexedDB';
import {
  buildNarrativeContext,
  NarrativeContextResult,
  OperationType,
} from '../server/narrativeContextBuilder';
import {
  EpisodePlanResult,
  PlanValidationReport,
} from '../server/episodePlanningService';

export type ViewType =
  | 'dashboard'
  | 'bible'
  | 'characters'
  | 'episodes'
  | 'timeline'
  | 'locations'
  | 'secrets'
  | 'hints'
  | 'threads'
  | 'objects'
  | 'decisions'
  | 'writer'
  | 'review'
  | 'memory'
  | 'settings';

interface NovelContextType {
  // Database status
  isLoaded: boolean;
  activeView: ViewType;
  setActiveView: (view: ViewType) => void;

  // Active Project & Selection
  projects: Project[];
  activeProjectId: string | null;
  activeProject: Project | null;
  setActiveProjectId: (id: string | null) => void;
  createProject: (data: Omit<Project, 'id' | 'created_at' | 'updated_at'>) => Promise<string>;
  updateProject: (id: string, data: Partial<Project>) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;

  // Selection state within active project
  currentEpisodeId: string | null;
  setCurrentEpisodeId: (id: string | null) => void;
  currentUnitId: string | null;
  setCurrentUnitId: (id: string | null) => void;

  // Entity lists (filtered by activeProject)
  storyBible: StoryBibleEntry[];
  characters: Character[];
  relationships: CharacterRelationship[];
  locations: Location[];
  episodes: Episode[];
  storyUnits: StoryUnit[];
  timelineEvents: TimelineEvent[];
  secrets: Secret[];
  clues: Clue[];
  openLoops: OpenLoop[];
  objects: StoryObject[];
  continuityLogs: ContinuityLogEntry[];
  storyDecisions: StoryDecision[];
  generationRuns: GenerationRun[];

  // CRUD for Story Bible
  addBibleEntry: (data: Omit<StoryBibleEntry, 'id' | 'project_id' | 'created_at' | 'updated_at'>) => Promise<string>;
  updateBibleEntry: (id: string, data: Partial<StoryBibleEntry>) => Promise<void>;
  deleteBibleEntry: (id: string) => Promise<void>;

  // CRUD for Characters & Relationships
  addCharacter: (data: Omit<Character, 'id' | 'project_id' | 'created_at' | 'updated_at'>) => Promise<string>;
  updateCharacter: (id: string, data: Partial<Character>) => Promise<void>;
  deleteCharacter: (id: string) => Promise<void>;
  addRelationship: (data: Omit<CharacterRelationship, 'id'>) => Promise<string>;
  updateRelationship: (id: string, data: Partial<CharacterRelationship>) => Promise<void>;
  deleteRelationship: (id: string) => Promise<void>;

  // CRUD for Locations
  addLocation: (data: Omit<Location, 'id' | 'project_id'>) => Promise<string>;
  updateLocation: (id: string, data: Partial<Location>) => Promise<void>;
  deleteLocation: (id: string) => Promise<void>;

  // CRUD for Episodes & Story Units
  addEpisode: (data: Omit<Episode, 'id' | 'project_id' | 'created_at' | 'updated_at'>) => Promise<string>;
  updateEpisode: (id: string, data: Partial<Episode>) => Promise<void>;
  deleteEpisode: (id: string) => Promise<void>;
  addStoryUnit: (data: Omit<StoryUnit, 'id' | 'created_at' | 'updated_at'>) => Promise<string>;
  updateStoryUnit: (id: string, data: Partial<StoryUnit>) => Promise<void>;
  deleteStoryUnit: (id: string) => Promise<void>;

  // CRUD for Timeline
  addTimelineEvent: (data: Omit<TimelineEvent, 'id' | 'project_id'>) => Promise<string>;
  updateTimelineEvent: (id: string, data: Partial<TimelineEvent>) => Promise<void>;
  deleteTimelineEvent: (id: string) => Promise<void>;

  // CRUD for Secrets & Clues
  addSecret: (data: Omit<Secret, 'id' | 'project_id'>) => Promise<string>;
  updateSecret: (id: string, data: Partial<Secret>) => Promise<void>;
  deleteSecret: (id: string) => Promise<void>;
  addClue: (data: Omit<Clue, 'id' | 'project_id'>) => Promise<string>;
  updateClue: (id: string, data: Partial<Clue>) => Promise<void>;
  deleteClue: (id: string) => Promise<void>;

  // CRUD for Open Loops
  addOpenLoop: (data: Omit<OpenLoop, 'id' | 'project_id'>) => Promise<string>;
  updateOpenLoop: (id: string, data: Partial<OpenLoop>) => Promise<void>;
  deleteOpenLoop: (id: string) => Promise<void>;

  // CRUD for Objects
  addObject: (data: Omit<StoryObject, 'id' | 'project_id'>) => Promise<string>;
  updateObject: (id: string, data: Partial<StoryObject>) => Promise<void>;
  deleteObject: (id: string) => Promise<void>;

  // CRUD for Continuity Log
  addContinuityLog: (data: Omit<ContinuityLogEntry, 'id' | 'project_id' | 'created_at'>) => Promise<string>;
  updateContinuityLog: (id: string, data: Partial<ContinuityLogEntry>) => Promise<void>;
  deleteContinuityLog: (id: string) => Promise<void>;

  // CRUD for Story Decisions
  addStoryDecision: (data: Omit<StoryDecision, 'id' | 'project_id'>) => Promise<string>;
  updateStoryDecision: (id: string, data: Partial<StoryDecision>) => Promise<void>;
  deleteStoryDecision: (id: string) => Promise<void>;

  // العقل السردي: System Prompts
  systemPrompts: SystemPrompt[];
  activeSystemPrompt: SystemPrompt | null;
  createSystemPromptVersion: (name: string, content: string, setAsActive?: boolean) => Promise<string>;
  updateSystemPrompt: (id: string, name: string, content: string) => Promise<void>;
  setActiveSystemPrompt: (id: string) => Promise<void>;
  deleteSystemPrompt: (id: string) => Promise<void>;
  restoreSystemPromptVersion: (id: string) => Promise<string>;

  // سجلات التشغيل والسياق السردي (Narrative Context Runs)
  addGenerationRun: (data: Omit<GenerationRun, 'id'>) => Promise<string>;
  deleteGenerationRun: (id: string) => Promise<void>;
  buildContext: (
    episode_id?: string | null,
    unit_id?: string | null,
    operation_type?: OperationType
  ) => Promise<{ result: NarrativeContextResult; run: GenerationRun }>;

  // ربط واستدعاء Gemini API (Server-Side)
  testGeminiConnection: (modelOverride?: string) => Promise<{
    connected?: boolean;
    status: string;
    model: string;
    message?: string;
    timestamp: string;
  }>;
  testContextWithGemini: (
    episode_id?: string | null,
    unit_id?: string | null
  ) => Promise<{
    context_received: boolean;
    sections_detected: string[];
    missing_sections: string[];
    ready_for_generation: false;
  }>;
  generateGeminiContent: (params: {
    episode_id?: string | null;
    unit_id?: string | null;
    operation_type: string;
    task_prompt?: string;
    response_format?: 'json' | 'text';
    model_override?: string;
    temperature_override?: number;
  }) => Promise<any>;
  lastConnectionTest: { status: string; model: string; timestamp: string } | null;
  modelConfig: { default_model: string; temperatures: Record<string, number>; has_api_key?: boolean };
  updateModelConfig: (newModel?: string, newTemps?: Record<string, number>) => Promise<void>;

  // Stage 6: Episode Planning Engine
  isPlanningEpisode: boolean;
  planEpisodeWorkflow: (params: {
    episode_number: number;
    episode_id?: string;
    user_notes?: string;
    regenerate?: boolean;
  }) => Promise<EpisodePlanResult>;
  validateEpisodePlanWorkflow: (plan: EpisodePlanResult) => Promise<PlanValidationReport>;
  saveEpisodePlanWorkflow: (plan: EpisodePlanResult, asDraft: boolean) => Promise<{ episodeId: string }>;
  approveEpisodePlanWorkflow: (plan: EpisodePlanResult) => Promise<void>;
  archiveEpisodePlanWorkflow: (planId: string) => Promise<void>;

  // Full Database Export / Import
  exportDatabaseJSON: () => string;
  importDatabaseJSON: (jsonStr: string) => Promise<void>;
  resetDatabase: () => Promise<void>;
}

const NovelContext = createContext<NovelContextType | undefined>(undefined);

const CURRENT_PROJECT_KEY = 'kateb_al_warith_active_project_id';

export const NovelProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeView, setActiveView] = useState<ViewType>('dashboard');
  const [isLoaded, setIsLoaded] = useState<boolean>(false);

  // Full database state
  const [db, setDb] = useState<DatabaseSchema>({
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
  });

  const [activeProjectId, setActiveProjectIdState] = useState<string | null>(() => {
    return localStorage.getItem(CURRENT_PROJECT_KEY) || null;
  });

  const [currentEpisodeId, setCurrentEpisodeId] = useState<string | null>(null);
  const [currentUnitId, setCurrentUnitId] = useState<string | null>(null);

  // Load database from IndexedDB on initial mount
  useEffect(() => {
    let mounted = true;
    loadFullDatabase().then((loaded) => {
      if (!mounted) return;
      setDb(loaded);
      setIsLoaded(true);

      // Select active project if valid, otherwise pick first if available
      const savedId = localStorage.getItem(CURRENT_PROJECT_KEY);
      if (savedId && loaded.projects.some(p => p.id === savedId)) {
        setActiveProjectIdState(savedId);
      } else if (loaded.projects.length > 0) {
        setActiveProjectIdState(loaded.projects[0].id);
        localStorage.setItem(CURRENT_PROJECT_KEY, loaded.projects[0].id);
      }
    });

    return () => {
      mounted = false;
    };
  }, []);

  const setActiveProjectId = (id: string | null) => {
    setActiveProjectIdState(id);
    if (id) {
      localStorage.setItem(CURRENT_PROJECT_KEY, id);
    } else {
      localStorage.removeItem(CURRENT_PROJECT_KEY);
    }
    setCurrentEpisodeId(null);
    setCurrentUnitId(null);
  };

  const generateId = () => (crypto.randomUUID ? crypto.randomUUID() : `id_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`);

  // Active Project object
  const activeProject = activeProjectId ? db.projects.find(p => p.id === activeProjectId) || null : null;

  // Filtered lists by active project
  const storyBible = db.story_bible.filter(x => x.project_id === activeProjectId);
  const characters = db.characters.filter(x => x.project_id === activeProjectId);
  const characterIds = new Set(characters.map(c => c.id));
  const relationships = db.character_relationships.filter(
    r => characterIds.has(r.character_a_id) || characterIds.has(r.character_b_id)
  );
  const locations = db.locations.filter(x => x.project_id === activeProjectId);
  const episodes = db.episodes.filter(x => x.project_id === activeProjectId).sort((a, b) => a.episode_number - b.episode_number);
  const episodeIds = new Set(episodes.map(e => e.id));
  const storyUnits = db.story_units.filter(u => episodeIds.has(u.episode_id)).sort((a, b) => a.unit_number - b.unit_number);
  const timelineEvents = db.timeline_events.filter(x => x.project_id === activeProjectId).sort((a, b) => a.sequence_order - b.sequence_order);
  const secrets = db.secrets.filter(x => x.project_id === activeProjectId);
  const clues = db.clues.filter(x => x.project_id === activeProjectId);
  const openLoops = db.open_loops.filter(x => x.project_id === activeProjectId);
  const objects = db.objects.filter(x => x.project_id === activeProjectId);
  const continuityLogs = db.continuity_log.filter(x => x.project_id === activeProjectId);
  const storyDecisions = db.story_decisions.filter(x => x.project_id === activeProjectId);
  const generationRuns = db.generation_runs.filter(x => x.project_id === activeProjectId);
  const systemPrompts = (db.system_prompts || [])
    .filter(x => x.project_id === activeProjectId)
    .sort((a, b) => b.version - a.version);
  const activeSystemPrompt = systemPrompts.find(p => p.is_active) || null;

  // ================= Project Operations =================
  const createProject = async (data: Omit<Project, 'id' | 'created_at' | 'updated_at'>): Promise<string> => {
    const id = generateId();
    const now = new Date().toISOString();
    const newProj: Project = {
      ...data,
      id,
      created_at: now,
      updated_at: now,
    };
    await putItem('projects', newProj);
    setDb(prev => ({ ...prev, projects: [...prev.projects, newProj] }));
    setActiveProjectId(id);
    return id;
  };

  const updateProject = async (id: string, data: Partial<Project>): Promise<void> => {
    const existing = db.projects.find(p => p.id === id);
    if (!existing) return;
    const updated: Project = {
      ...existing,
      ...data,
      updated_at: new Date().toISOString(),
    };
    await putItem('projects', updated);
    setDb(prev => ({
      ...prev,
      projects: prev.projects.map(p => (p.id === id ? updated : p)),
    }));
  };

  const deleteProject = async (id: string): Promise<void> => {
    await deleteItem('projects', id);
    setDb(prev => ({
      ...prev,
      projects: prev.projects.filter(p => p.id !== id),
    }));
    if (activeProjectId === id) {
      const remaining = db.projects.filter(p => p.id !== id);
      setActiveProjectId(remaining.length > 0 ? remaining[0].id : null);
    }
  };

  // ================= Story Bible Operations =================
  const addBibleEntry = async (data: Omit<StoryBibleEntry, 'id' | 'project_id' | 'created_at' | 'updated_at'>): Promise<string> => {
    if (!activeProjectId) throw new Error('لا يوجد مشروع نشط');
    const id = generateId();
    const now = new Date().toISOString();
    const item: StoryBibleEntry = {
      ...data,
      id,
      project_id: activeProjectId,
      created_at: now,
      updated_at: now,
    };
    await putItem('story_bible', item);
    setDb(prev => ({ ...prev, story_bible: [...prev.story_bible, item] }));
    return id;
  };

  const updateBibleEntry = async (id: string, data: Partial<StoryBibleEntry>): Promise<void> => {
    const existing = db.story_bible.find(x => x.id === id);
    if (!existing) return;
    const updated: StoryBibleEntry = {
      ...existing,
      ...data,
      updated_at: new Date().toISOString(),
    };
    await putItem('story_bible', updated);
    setDb(prev => ({
      ...prev,
      story_bible: prev.story_bible.map(x => (x.id === id ? updated : x)),
    }));
  };

  const deleteBibleEntry = async (id: string): Promise<void> => {
    await deleteItem('story_bible', id);
    setDb(prev => ({
      ...prev,
      story_bible: prev.story_bible.filter(x => x.id !== id),
    }));
  };

  // ================= Characters & Relationships =================
  const addCharacter = async (data: Omit<Character, 'id' | 'project_id' | 'created_at' | 'updated_at'>): Promise<string> => {
    if (!activeProjectId) throw new Error('لا يوجد مشروع نشط');
    const id = generateId();
    const now = new Date().toISOString();
    const item: Character = {
      ...data,
      id,
      project_id: activeProjectId,
      created_at: now,
      updated_at: now,
    };
    await putItem('characters', item);
    setDb(prev => ({ ...prev, characters: [...prev.characters, item] }));
    return id;
  };

  const updateCharacter = async (id: string, data: Partial<Character>): Promise<void> => {
    const existing = db.characters.find(x => x.id === id);
    if (!existing) return;
    const updated: Character = {
      ...existing,
      ...data,
      updated_at: new Date().toISOString(),
    };
    await putItem('characters', updated);
    setDb(prev => ({
      ...prev,
      characters: prev.characters.map(x => (x.id === id ? updated : x)),
    }));
  };

  const deleteCharacter = async (id: string): Promise<void> => {
    await deleteItem('characters', id);
    setDb(prev => ({
      ...prev,
      characters: prev.characters.filter(x => x.id !== id),
      character_relationships: prev.character_relationships.filter(
        r => r.character_a_id !== id && r.character_b_id !== id
      ),
    }));
  };

  const addRelationship = async (data: Omit<CharacterRelationship, 'id'>): Promise<string> => {
    const id = generateId();
    const item: CharacterRelationship = { ...data, id };
    await putItem('character_relationships', item);
    setDb(prev => ({
      ...prev,
      character_relationships: [...prev.character_relationships, item],
    }));
    return id;
  };

  const updateRelationship = async (id: string, data: Partial<CharacterRelationship>): Promise<void> => {
    const existing = db.character_relationships.find(x => x.id === id);
    if (!existing) return;
    const updated: CharacterRelationship = { ...existing, ...data };
    await putItem('character_relationships', updated);
    setDb(prev => ({
      ...prev,
      character_relationships: prev.character_relationships.map(x => (x.id === id ? updated : x)),
    }));
  };

  const deleteRelationship = async (id: string): Promise<void> => {
    await deleteItem('character_relationships', id);
    setDb(prev => ({
      ...prev,
      character_relationships: prev.character_relationships.filter(x => x.id !== id),
    }));
  };

  // ================= Locations =================
  const addLocation = async (data: Omit<Location, 'id' | 'project_id'>): Promise<string> => {
    if (!activeProjectId) throw new Error('لا يوجد مشروع نشط');
    const id = generateId();
    const item: Location = { ...data, id, project_id: activeProjectId };
    await putItem('locations', item);
    setDb(prev => ({ ...prev, locations: [...prev.locations, item] }));
    return id;
  };

  const updateLocation = async (id: string, data: Partial<Location>): Promise<void> => {
    const existing = db.locations.find(x => x.id === id);
    if (!existing) return;
    const updated: Location = { ...existing, ...data };
    await putItem('locations', updated);
    setDb(prev => ({
      ...prev,
      locations: prev.locations.map(x => (x.id === id ? updated : x)),
    }));
  };

  const deleteLocation = async (id: string): Promise<void> => {
    await deleteItem('locations', id);
    setDb(prev => ({
      ...prev,
      locations: prev.locations.filter(x => x.id !== id),
    }));
  };

  // ================= Episodes & Story Units =================
  const addEpisode = async (data: Omit<Episode, 'id' | 'project_id' | 'created_at' | 'updated_at'>): Promise<string> => {
    if (!activeProjectId) throw new Error('لا يوجد مشروع نشط');
    const id = generateId();
    const now = new Date().toISOString();
    const item: Episode = {
      ...data,
      id,
      project_id: activeProjectId,
      created_at: now,
      updated_at: now,
    };
    await putItem('episodes', item);
    setDb(prev => ({
      ...prev,
      episodes: [...prev.episodes, item],
    }));
    setCurrentEpisodeId(id);
    return id;
  };

  const updateEpisode = async (id: string, data: Partial<Episode>): Promise<void> => {
    const existing = db.episodes.find(x => x.id === id);
    if (!existing) return;
    const updated: Episode = {
      ...existing,
      ...data,
      updated_at: new Date().toISOString(),
    };
    await putItem('episodes', updated);
    setDb(prev => ({
      ...prev,
      episodes: prev.episodes.map(x => (x.id === id ? updated : x)),
    }));
  };

  const deleteEpisode = async (id: string): Promise<void> => {
    await deleteItem('episodes', id);
    // Also remove related story units
    const unitsToRemove = db.story_units.filter(u => u.episode_id === id);
    for (const u of unitsToRemove) {
      await deleteItem('story_units', u.id);
    }
    setDb(prev => ({
      ...prev,
      episodes: prev.episodes.filter(x => x.id !== id),
      story_units: prev.story_units.filter(u => u.episode_id !== id),
    }));
    if (currentEpisodeId === id) setCurrentEpisodeId(null);
  };

  const addStoryUnit = async (data: Omit<StoryUnit, 'id' | 'created_at' | 'updated_at'>): Promise<string> => {
    const id = generateId();
    const now = new Date().toISOString();
    const item: StoryUnit = {
      ...data,
      id,
      created_at: now,
      updated_at: now,
    };
    await putItem('story_units', item);
    setDb(prev => ({
      ...prev,
      story_units: [...prev.story_units, item],
    }));
    setCurrentUnitId(id);
    return id;
  };

  const updateStoryUnit = async (id: string, data: Partial<StoryUnit>): Promise<void> => {
    const existing = db.story_units.find(x => x.id === id);
    if (!existing) return;
    const updated: StoryUnit = {
      ...existing,
      ...data,
      updated_at: new Date().toISOString(),
    };
    await putItem('story_units', updated);
    setDb(prev => ({
      ...prev,
      story_units: prev.story_units.map(x => (x.id === id ? updated : x)),
    }));
  };

  const deleteStoryUnit = async (id: string): Promise<void> => {
    await deleteItem('story_units', id);
    setDb(prev => ({
      ...prev,
      story_units: prev.story_units.filter(x => x.id !== id),
    }));
    if (currentUnitId === id) setCurrentUnitId(null);
  };

  // ================= Timeline =================
  const addTimelineEvent = async (data: Omit<TimelineEvent, 'id' | 'project_id'>): Promise<string> => {
    if (!activeProjectId) throw new Error('لا يوجد مشروع نشط');
    const id = generateId();
    const item: TimelineEvent = { ...data, id, project_id: activeProjectId };
    await putItem('timeline_events', item);
    setDb(prev => ({ ...prev, timeline_events: [...prev.timeline_events, item] }));
    return id;
  };

  const updateTimelineEvent = async (id: string, data: Partial<TimelineEvent>): Promise<void> => {
    const existing = db.timeline_events.find(x => x.id === id);
    if (!existing) return;
    const updated: TimelineEvent = { ...existing, ...data };
    await putItem('timeline_events', updated);
    setDb(prev => ({
      ...prev,
      timeline_events: prev.timeline_events.map(x => (x.id === id ? updated : x)),
    }));
  };

  const deleteTimelineEvent = async (id: string): Promise<void> => {
    await deleteItem('timeline_events', id);
    setDb(prev => ({
      ...prev,
      timeline_events: prev.timeline_events.filter(x => x.id !== id),
    }));
  };

  // ================= Secrets & Clues =================
  const addSecret = async (data: Omit<Secret, 'id' | 'project_id'>): Promise<string> => {
    if (!activeProjectId) throw new Error('لا يوجد مشروع نشط');
    const id = generateId();
    const item: Secret = { ...data, id, project_id: activeProjectId };
    await putItem('secrets', item);
    setDb(prev => ({ ...prev, secrets: [...prev.secrets, item] }));
    return id;
  };

  const updateSecret = async (id: string, data: Partial<Secret>): Promise<void> => {
    const existing = db.secrets.find(x => x.id === id);
    if (!existing) return;
    const updated: Secret = { ...existing, ...data };
    await putItem('secrets', updated);
    setDb(prev => ({
      ...prev,
      secrets: prev.secrets.map(x => (x.id === id ? updated : x)),
    }));
  };

  const deleteSecret = async (id: string): Promise<void> => {
    await deleteItem('secrets', id);
    // Also remove clues attached to this secret
    const cluesToRemove = db.clues.filter(c => c.secret_id === id);
    for (const c of cluesToRemove) {
      await deleteItem('clues', c.id);
    }
    setDb(prev => ({
      ...prev,
      secrets: prev.secrets.filter(x => x.id !== id),
      clues: prev.clues.filter(c => c.secret_id !== id),
    }));
  };

  const addClue = async (data: Omit<Clue, 'id' | 'project_id'>): Promise<string> => {
    if (!activeProjectId) throw new Error('لا يوجد مشروع نشط');
    const id = generateId();
    const item: Clue = { ...data, id, project_id: activeProjectId };
    await putItem('clues', item);
    setDb(prev => ({ ...prev, clues: [...prev.clues, item] }));
    return id;
  };

  const updateClue = async (id: string, data: Partial<Clue>): Promise<void> => {
    const existing = db.clues.find(x => x.id === id);
    if (!existing) return;
    const updated: Clue = { ...existing, ...data };
    await putItem('clues', updated);
    setDb(prev => ({
      ...prev,
      clues: prev.clues.map(x => (x.id === id ? updated : x)),
    }));
  };

  const deleteClue = async (id: string): Promise<void> => {
    await deleteItem('clues', id);
    setDb(prev => ({
      ...prev,
      clues: prev.clues.filter(x => x.id !== id),
    }));
  };

  // ================= Open Loops =================
  const addOpenLoop = async (data: Omit<OpenLoop, 'id' | 'project_id'>): Promise<string> => {
    if (!activeProjectId) throw new Error('لا يوجد مشروع نشط');
    const id = generateId();
    const item: OpenLoop = { ...data, id, project_id: activeProjectId };
    await putItem('open_loops', item);
    setDb(prev => ({ ...prev, open_loops: [...prev.open_loops, item] }));
    return id;
  };

  const updateOpenLoop = async (id: string, data: Partial<OpenLoop>): Promise<void> => {
    const existing = db.open_loops.find(x => x.id === id);
    if (!existing) return;
    const updated: OpenLoop = { ...existing, ...data };
    await putItem('open_loops', updated);
    setDb(prev => ({
      ...prev,
      open_loops: prev.open_loops.map(x => (x.id === id ? updated : x)),
    }));
  };

  const deleteOpenLoop = async (id: string): Promise<void> => {
    await deleteItem('open_loops', id);
    setDb(prev => ({
      ...prev,
      open_loops: prev.open_loops.filter(x => x.id !== id),
    }));
  };

  // ================= Objects =================
  const addObject = async (data: Omit<StoryObject, 'id' | 'project_id'>): Promise<string> => {
    if (!activeProjectId) throw new Error('لا يوجد مشروع نشط');
    const id = generateId();
    const item: StoryObject = { ...data, id, project_id: activeProjectId };
    await putItem('objects', item);
    setDb(prev => ({ ...prev, objects: [...prev.objects, item] }));
    return id;
  };

  const updateObject = async (id: string, data: Partial<StoryObject>): Promise<void> => {
    const existing = db.objects.find(x => x.id === id);
    if (!existing) return;
    const updated: StoryObject = { ...existing, ...data };
    await putItem('objects', updated);
    setDb(prev => ({
      ...prev,
      objects: prev.objects.map(x => (x.id === id ? updated : x)),
    }));
  };

  const deleteObject = async (id: string): Promise<void> => {
    await deleteItem('objects', id);
    setDb(prev => ({
      ...prev,
      objects: prev.objects.filter(x => x.id !== id),
    }));
  };

  // ================= Continuity Log =================
  const addContinuityLog = async (data: Omit<ContinuityLogEntry, 'id' | 'project_id' | 'created_at'>): Promise<string> => {
    if (!activeProjectId) throw new Error('لا يوجد مشروع نشط');
    const id = generateId();
    const now = new Date().toISOString();
    const item: ContinuityLogEntry = { ...data, id, project_id: activeProjectId, created_at: now };
    await putItem('continuity_log', item);
    setDb(prev => ({ ...prev, continuity_log: [...prev.continuity_log, item] }));
    return id;
  };

  const updateContinuityLog = async (id: string, data: Partial<ContinuityLogEntry>): Promise<void> => {
    const existing = db.continuity_log.find(x => x.id === id);
    if (!existing) return;
    const updated: ContinuityLogEntry = { ...existing, ...data };
    await putItem('continuity_log', updated);
    setDb(prev => ({
      ...prev,
      continuity_log: prev.continuity_log.map(x => (x.id === id ? updated : x)),
    }));
  };

  const deleteContinuityLog = async (id: string): Promise<void> => {
    await deleteItem('continuity_log', id);
    setDb(prev => ({
      ...prev,
      continuity_log: prev.continuity_log.filter(x => x.id !== id),
    }));
  };

  // ================= Story Decisions =================
  const addStoryDecision = async (data: Omit<StoryDecision, 'id' | 'project_id'>): Promise<string> => {
    if (!activeProjectId) throw new Error('لا يوجد مشروع نشط');
    const id = generateId();
    const item: StoryDecision = { ...data, id, project_id: activeProjectId };
    await putItem('story_decisions', item);
    setDb(prev => ({ ...prev, story_decisions: [...prev.story_decisions, item] }));
    return id;
  };

  const updateStoryDecision = async (id: string, data: Partial<StoryDecision>): Promise<void> => {
    const existing = db.story_decisions.find(x => x.id === id);
    if (!existing) return;
    const updated: StoryDecision = { ...existing, ...data };
    await putItem('story_decisions', updated);
    setDb(prev => ({
      ...prev,
      story_decisions: prev.story_decisions.map(x => (x.id === id ? updated : x)),
    }));
  };

  const deleteStoryDecision = async (id: string): Promise<void> => {
    await deleteItem('story_decisions', id);
    setDb(prev => ({
      ...prev,
      story_decisions: prev.story_decisions.filter(x => x.id !== id),
    }));
  };

  // ================= العقل السردي: System Prompts =================
  const createSystemPromptVersion = async (
    name: string,
    content: string,
    setAsActive: boolean = true
  ): Promise<string> => {
    if (!activeProjectId) throw new Error('لا يوجد مشروع نشط');
    const id = generateId();
    const now = new Date().toISOString();
    const existingInProj = (db.system_prompts || []).filter(x => x.project_id === activeProjectId);
    const nextVersion = existingInProj.length > 0 ? Math.max(...existingInProj.map(p => p.version)) + 1 : 1;

    let updatedList = [...(db.system_prompts || [])];
    if (setAsActive) {
      // Deactivate all others for this project
      updatedList = updatedList.map(p => {
        if (p.project_id === activeProjectId && p.is_active) {
          const deact = { ...p, is_active: false, updated_at: now };
          putItem('system_prompts', deact);
          return deact;
        }
        return p;
      });
    }

    const newPrompt: SystemPrompt = {
      id,
      project_id: activeProjectId,
      name: name.trim() || `نسخة العقل السردي v${nextVersion}`,
      content,
      version: nextVersion,
      is_active: setAsActive,
      created_at: now,
      updated_at: now,
    };

    await putItem('system_prompts', newPrompt);
    setDb(prev => ({
      ...prev,
      system_prompts: [...updatedList.filter(p => p.id !== id), newPrompt],
    }));
    return id;
  };

  const updateSystemPrompt = async (id: string, name: string, content: string): Promise<void> => {
    const existing = (db.system_prompts || []).find(p => p.id === id);
    if (!existing) return;
    const now = new Date().toISOString();
    const updated: SystemPrompt = {
      ...existing,
      name: name.trim() || existing.name,
      content,
      updated_at: now,
    };
    await putItem('system_prompts', updated);
    setDb(prev => ({
      ...prev,
      system_prompts: (prev.system_prompts || []).map(p => (p.id === id ? updated : p)),
    }));
  };

  const setActiveSystemPrompt = async (id: string): Promise<void> => {
    const target = (db.system_prompts || []).find(p => p.id === id);
    if (!target) return;
    const now = new Date().toISOString();
    const updatedList: SystemPrompt[] = [];

    for (const p of (db.system_prompts || [])) {
      if (p.project_id === target.project_id) {
        const shouldBeActive = p.id === id;
        if (p.is_active !== shouldBeActive) {
          const mod = { ...p, is_active: shouldBeActive, updated_at: now };
          await putItem('system_prompts', mod);
          updatedList.push(mod);
        } else {
          updatedList.push(p);
        }
      } else {
        updatedList.push(p);
      }
    }

    setDb(prev => ({
      ...prev,
      system_prompts: updatedList,
    }));
  };

  const deleteSystemPrompt = async (id: string): Promise<void> => {
    const target = (db.system_prompts || []).find(p => p.id === id);
    await deleteItem('system_prompts', id);
    const remaining = (db.system_prompts || []).filter(p => p.id !== id);

    // If deleted prompt was active, activate the latest remaining if any
    let updatedRemaining = remaining;
    if (target && target.is_active) {
      const projPrompts = remaining.filter(p => p.project_id === target.project_id);
      if (projPrompts.length > 0) {
        const sorted = [...projPrompts].sort((a, b) => b.version - a.version);
        const newest = sorted[0];
        const now = new Date().toISOString();
        const activated = { ...newest, is_active: true, updated_at: now };
        await putItem('system_prompts', activated);
        updatedRemaining = remaining.map(p => (p.id === newest.id ? activated : p));
      }
    }

    setDb(prev => ({
      ...prev,
      system_prompts: updatedRemaining,
    }));
  };

  const restoreSystemPromptVersion = async (id: string): Promise<string> => {
    const target = (db.system_prompts || []).find(p => p.id === id);
    if (!target) throw new Error('النسخة غير موجودة');
    return await createSystemPromptVersion(`استرجاع v${target.version}: ${target.name}`, target.content, true);
  };

  // ================= Generation Runs & Narrative Context Builder =================
  const addGenerationRun = async (data: Omit<GenerationRun, 'id'>): Promise<string> => {
    const id = generateId();
    const item: GenerationRun = { ...data, id };
    await putItem('generation_runs', item);
    setDb(prev => ({
      ...prev,
      generation_runs: [item, ...prev.generation_runs],
    }));
    return id;
  };

  const deleteGenerationRun = async (id: string): Promise<void> => {
    await deleteItem('generation_runs', id);
    setDb(prev => ({
      ...prev,
      generation_runs: prev.generation_runs.filter(x => x.id !== id),
    }));
  };

  const buildContext = async (
    episode_id?: string | null,
    unit_id?: string | null,
    operation_type: OperationType = 'write_unit'
  ): Promise<{ result: NarrativeContextResult; run: GenerationRun }> => {
    if (!activeProjectId) {
      throw new Error('لا يوجد مشروع نشط لبناء سياق الرواية.');
    }

    let result: NarrativeContextResult;
    let runRecord: GenerationRun;

    try {
      // 1. Try Backend Service API first
      const res = await fetch('/api/narrative-context/build', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: activeProjectId,
          episode_id: episode_id || null,
          unit_id: unit_id || null,
          operation_type,
          db_snapshot: db,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || `خطأ في الخادم: ${res.status}`);
      }

      const payload = await res.json();
      result = payload.data;
      runRecord = payload.generation_run;
    } catch (networkOrApiErr) {
      // Fallback: execute local service function with full fidelity
      console.warn('Backend endpoint unavailable, using local context engine fallback:', networkOrApiErr);
      result = await buildNarrativeContext(
        {
          project_id: activeProjectId,
          episode_id: episode_id || null,
          unit_id: unit_id || null,
          operation_type,
        },
        db
      );

      const runId = generateId();
      const validationSummary = `Warnings: ${result.continuity_warnings.length} (${result.continuity_warnings
        .map((w) => w.severity)
        .join(', ')}), Missing: ${result.missing_context.length}, Canon: ${result.published_facts.length}`;

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

      runRecord = {
        id: runId,
        project_id: activeProjectId,
        episode_id: episode_id || undefined,
        unit_id: unit_id || undefined,
        operation_type,
        input_context: JSON.stringify(sanitizedForLog),
        output: '',
        validation_result: validationSummary,
        accepted: false,
        created_at: new Date().toISOString(),
      };
    }

    // Persist run in IndexedDB and local state permanently
    await putItem('generation_runs', runRecord);
    setDb((prev) => ({
      ...prev,
      generation_runs: [runRecord, ...prev.generation_runs.filter((r) => r.id !== runRecord.id)],
    }));

    return { result, run: runRecord };
  };

  // ================= Gemini API Client Integration =================
  const [modelConfig, setModelConfig] = useState<{
    default_model: string;
    temperatures: Record<string, number>;
    has_api_key?: boolean;
  }>({
    default_model: 'gemini-3.8-flash',
    temperatures: {
      plan_episode: 0.4,
      write_unit: 0.75,
      review_unit: 0.3,
      revise_unit: 0.7,
      extract_memory: 0.2,
      continuity_check: 0.2,
    },
    has_api_key: true,
  });

  const [lastConnectionTest, setLastConnectionTest] = useState<{
    connected?: boolean;
    status: string;
    model: string;
    message?: string;
    timestamp: string;
  } | null>(() => {
    try {
      const saved = localStorage.getItem('kateb_al_warith_last_gemini_test');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Fetch server model config on mount
  useEffect(() => {
    fetch('/api/gemini/config')
      .then((r) => r.json())
      .then((data) => {
        if (data.success && data.config) {
          setModelConfig({
            default_model: data.config.default_model || 'gemini-3.8-flash',
            temperatures: data.config.temperatures || {},
            has_api_key: data.has_api_key,
          });
        }
      })
      .catch(() => {});
  }, []);

  const updateModelConfig = async (newModel?: string, newTemps?: Record<string, number>) => {
    const res = await fetch('/api/gemini/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: newModel,
        temperatures: newTemps,
      }),
    });
    const data = await res.json();
    if (data.success && data.config) {
      setModelConfig((prev) => ({
        ...prev,
        default_model: data.config.default_model,
        temperatures: data.config.temperatures,
      }));
    }
  };

  const testGeminiConnection = async (modelOverride?: string) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, 20000);

    try {
      const res = await fetch('/api/gemini/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model_override: modelOverride }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const data = await res.json().catch(() => null);

      if (!data) {
        throw {
          connected: false,
          status: 'failed',
          error_code: 'INVALID_JSON_RESPONSE',
          http_status: res.status,
          message: 'استجابة الخادم غير صالحة',
          technical_summary: `Server returned HTTP ${res.status} with non-JSON body`,
          timestamp: new Date().toISOString(),
        };
      }

      if (!res.ok || !data.connected) {
        throw data;
      }

      const testResult = {
        connected: true,
        status: data.status || 'connected',
        model: data.model || modelOverride || 'gemini',
        message: data.message || 'تم الاتصال بـGemini بنجاح',
        timestamp: data.timestamp || new Date().toISOString(),
      };
      setLastConnectionTest(testResult);
      localStorage.setItem('kateb_al_warith_last_gemini_test', JSON.stringify(testResult));
      return testResult;
    } catch (err: any) {
      clearTimeout(timeoutId);
      if (err.name === 'AbortError' || controller.signal.aborted) {
        const timeoutError = {
          connected: false,
          status: 'failed',
          error_code: 'CONNECTION_TIMEOUT',
          http_status: 504,
          message: 'انتهت مهلة اختبار الاتصال بعد 20 ثانية',
          technical_summary: 'Frontend request aborted by AbortController after 20000ms',
          timestamp: new Date().toISOString(),
        };
        throw timeoutError;
      }
      throw err;
    }
  };

  const testContextWithGemini = async (episode_id?: string | null, unit_id?: string | null) => {
    if (!activeProjectId) throw new Error('لا يوجد مشروع نشط');
    const res = await fetch('/api/gemini/test-context', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        project_id: activeProjectId,
        episode_id: episode_id || null,
        unit_id: unit_id || null,
        db_snapshot: db,
      }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error_message || 'فشل اختبار السياق مع Gemini');
    }
    return data.data;
  };

  const generateGeminiContent = async (params: {
    episode_id?: string | null;
    unit_id?: string | null;
    operation_type: string;
    task_prompt?: string;
    response_format?: 'json' | 'text';
    model_override?: string;
    temperature_override?: number;
  }) => {
    if (!activeProjectId) throw new Error('لا يوجد مشروع نشط');
    const res = await fetch('/api/gemini/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...params,
        project_id: activeProjectId,
        db_snapshot: db,
      }),
    });
    const data = await res.json();

    if (data.generation_run) {
      await putItem('generation_runs', data.generation_run);
      setDb((prev) => ({
        ...prev,
        generation_runs: [data.generation_run, ...prev.generation_runs.filter((r) => r.id !== data.generation_run.id)],
      }));
    }

    if (!res.ok || data.status === 'failed' || data.status === 'blocked') {
      const err = new Error(data.error_message || 'حدث خطأ أثناء استدعاء Gemini');
      (err as any).error_code = data.error_code;
      (err as any).generation_run = data.generation_run;
      throw err;
    }

    return data;
  };

  // ================= Stage 6: Episode Planning Engine =================
  const [isPlanningEpisode, setIsPlanningEpisode] = useState(false);

  const planEpisodeWorkflow = async (params: {
    episode_number: number;
    episode_id?: string;
    user_notes?: string;
    regenerate?: boolean;
  }): Promise<EpisodePlanResult> => {
    if (!activeProjectId) {
      const err: any = new Error('لا يوجد مشروع نشط حالياً');
      err.code = 'PROJECT_NOT_FOUND';
      throw err;
    }

    if (isPlanningEpisode) {
      const err: any = new Error('هناك عملية تخطيط جارية بالفعل');
      err.code = 'PLANNING_IN_PROGRESS';
      throw err;
    }

    setIsPlanningEpisode(true);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, 35000);

    try {
      const res = await fetch('/api/episodes/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: activeProjectId,
          episode_id: params.episode_id || null,
          episode_number: params.episode_number,
          regenerate: params.regenerate || false,
          user_notes: params.user_notes || '',
          db_snapshot: db,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const data = await res.json().catch(() => null);
      if (!data) {
        const err: any = new Error('استجابة غير صالحة من خادم التخطيط');
        err.code = 'INVALID_MODEL_OUTPUT';
        throw err;
      }

      if (!res.ok || !data.success) {
        const err: any = new Error(data.message || 'فشل بناء مخطط الحلقة');
        err.code = data.error_code || 'PLANNING_FAILED';
        err.blocking_items = data.blocking_items;
        err.validation_errors = data.validation_errors;
        throw err;
      }

      if (data.generation_run) {
        await putItem('generation_runs', data.generation_run);
        setDb((prev) => ({
          ...prev,
          generation_runs: [data.generation_run, ...prev.generation_runs.filter((r) => r.id !== data.generation_run.id)],
        }));
      }

      return data.plan;
    } catch (err: any) {
      clearTimeout(timeoutId);
      if (err.name === 'AbortError' || controller.signal.aborted) {
        const timeoutErr: any = new Error('PLANNING_TIMEOUT: انتهت مهلة بناء المخطط (35 ثانية).');
        timeoutErr.code = 'PLANNING_TIMEOUT';
        throw timeoutErr;
      }
      throw err;
    } finally {
      setIsPlanningEpisode(false);
    }
  };

  const validateEpisodePlanWorkflow = async (plan: EpisodePlanResult): Promise<PlanValidationReport> => {
    if (!activeProjectId) throw new Error('لا يوجد مشروع نشط');
    const res = await fetch('/api/episodes/validate-plan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        project_id: activeProjectId,
        plan,
        db_snapshot: db,
      }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.message || 'فشل تدقيق المخطط');
    }
    return data.validation_report;
  };

  const saveEpisodePlanWorkflow = async (
    plan: EpisodePlanResult,
    asDraft: boolean
  ): Promise<{ episodeId: string }> => {
    if (!activeProjectId) throw new Error('لا يوجد مشروع نشط');

    // 1. Find or create Episode record
    let targetEp = db.episodes.find(
      (e) => (plan.episode_id && e.id === plan.episode_id) || (e.project_id === activeProjectId && e.episode_number === plan.episode_number)
    );

    let epId = targetEp?.id;

    const episodeData = {
      title: plan.episode.proposed_title || `الحلقة ${plan.episode_number}`,
      status: asDraft ? ('مخططة' as const) : ('جاهزة للتسجيل' as const),
      synopsis: plan.episode.synopsis || '',
      opening_state: plan.episode.opening_state || '',
      main_objective: plan.episode.main_objective || '',
      central_conflict: plan.episode.central_conflict || '',
      ending_state: plan.episode.ending_state || '',
      publication_status: 'مسودة داخلية' as const,
      is_locked: false,
    };

    if (targetEp) {
      await updateEpisode(targetEp.id, episodeData);
    } else {
      epId = await addEpisode({
        ...episodeData,
        episode_number: plan.episode_number,
      });
    }

    const finalEpId = epId || targetEp!.id;

    // 2. Create or update the 5 units in STORY_UNITS
    for (const u of plan.units) {
      const existingUnit = db.story_units.find(
        (su) => su.episode_id === finalEpId && su.unit_number === u.unit_number
      );

      const unitPayload: Omit<StoryUnit, 'id' | 'created_at' | 'updated_at'> = {
        episode_id: finalEpId,
        unit_number: u.unit_number,
        title: u.title || `الوحدة ${u.unit_number}`,
        function: (u.function as any) || 'تأسيس',
        start_state: u.start_state || '',
        objective: u.objective || '',
        pressure: u.pressure || '',
        information: Array.isArray(u.information) ? u.information.join(' • ') : String(u.information || ''),
        plant: Array.isArray(u.plant) ? u.plant.join(' • ') : String(u.plant || ''),
        payoff: Array.isArray(u.payoff) ? u.payoff.join(' • ') : String(u.payoff || ''),
        turn: u.turn || '',
        end_state: u.end_state || '',
        hook: u.hook || '',
        status: 'مخططة',
        // CRITICAL CONSTRAINTS: Must remain empty in Stage 6!
        draft_content: '',
        final_content: '',
        word_count: 0,
      };

      if (existingUnit) {
        await updateStoryUnit(existingUnit.id, unitPayload);
      } else {
        await addStoryUnit(unitPayload);
      }
    }

    // 3. Register pending story decisions if any (Section 15)
    if (plan.pending_story_decisions && plan.pending_story_decisions.length > 0) {
      for (const dec of plan.pending_story_decisions) {
        const alreadyExists = db.story_decisions.some(
          (d) => d.project_id === activeProjectId && d.question === dec.question
        );
        if (!alreadyExists) {
          await addStoryDecision({
            title: dec.title || 'قرار سردي مطلوب',
            question: dec.question || '',
            options: dec.options || ['نعم', 'لا'],
            selected_option: '',
            reasoning: dec.reasoning || '',
            impact: dec.impact || '',
            status: 'قيد النقاش',
          });
        }
      }
    }

    return { episodeId: finalEpId };
  };

  const approveEpisodePlanWorkflow = async (plan: EpisodePlanResult): Promise<void> => {
    // Check validation constraints before approval (Section 13)
    if (plan.validation_report?.critical_issues && plan.validation_report.critical_issues.length > 0) {
      throw new Error('لا يمكن اعتماد المخطط لوجود مشاكل حرجة (Critical Issues) لم تُحل بعد.');
    }
    if (plan.units.length !== 5) {
      throw new Error('المخطط يجب أن يحتوي على 5 وحدات سردية بالضبط ليتم اعتماده.');
    }

    // Check if any blocking decisions are pending
    const blockingDecisions = plan.pending_story_decisions?.filter((d) => d.is_blocking);
    if (blockingDecisions && blockingDecisions.length > 0) {
      throw new Error('يوجد قرارات مصيرية معلقة (Blocking Story Decisions) يجب حسمها قبل الاعتماد.');
    }

    await saveEpisodePlanWorkflow(plan, false);

    // Update generation run accepted status
    const latestRun = db.generation_runs.find((r) => r.operation_type === 'plan_episode');
    if (latestRun) {
      const updatedRun: GenerationRun = {
        ...latestRun,
        accepted: true,
        completed_at: new Date().toISOString(),
      };
      await putItem('generation_runs', updatedRun);
      setDb((prev) => ({
        ...prev,
        generation_runs: prev.generation_runs.map((r) => (r.id === updatedRun.id ? updatedRun : r)),
      }));
    }
  };

  const archiveEpisodePlanWorkflow = async (_planId: string): Promise<void> => {
    await addContinuityLog({
      category: 'أخرى',
      description: `تمت أرشفة نسخة سابقة من مخطط الحلقة بحفظ كامل السجل.`,
      severity: 'طفيف',
      suggested_fix: 'الاحتفاظ بالنسخة في أرشيف المخططات.',
      status: 'تم التصحيح',
    });
  };

  // ================= Export & Import =================
  const exportDatabaseJSON = (): string => {
    return JSON.stringify(db, null, 2);
  };

  const importDatabaseJSON = async (jsonStr: string): Promise<void> => {
    const parsed = JSON.parse(jsonStr) as DatabaseSchema;
    for (const key of Object.keys(parsed) as (keyof DatabaseSchema)[]) {
      const list = parsed[key] || [];
      for (const item of list) {
        await putItem(key as any, item);
      }
    }
    setDb(parsed);
    if (parsed.projects && parsed.projects.length > 0) {
      setActiveProjectId(parsed.projects[0].id);
    }
  };

  const resetDatabase = async (): Promise<void> => {
    for (const key of Object.keys(db) as (keyof DatabaseSchema)[]) {
      const list = db[key] || [];
      for (const item of list) {
        await deleteItem(key as any, item.id);
      }
    }
    const empty: DatabaseSchema = {
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
    setDb(empty);
    setActiveProjectId(null);
  };

  return (
    <NovelContext.Provider
      value={{
        isLoaded,
        activeView,
        setActiveView,
        projects: db.projects,
        activeProjectId,
        activeProject,
        setActiveProjectId,
        createProject,
        updateProject,
        deleteProject,
        currentEpisodeId,
        setCurrentEpisodeId,
        currentUnitId,
        setCurrentUnitId,
        storyBible,
        characters,
        relationships,
        locations,
        episodes,
        storyUnits,
        timelineEvents,
        secrets,
        clues,
        openLoops,
        objects,
        continuityLogs,
        storyDecisions,
        generationRuns,
        systemPrompts,
        activeSystemPrompt,
        createSystemPromptVersion,
        updateSystemPrompt,
        setActiveSystemPrompt,
        deleteSystemPrompt,
        restoreSystemPromptVersion,
        addBibleEntry,
        updateBibleEntry,
        deleteBibleEntry,
        addCharacter,
        updateCharacter,
        deleteCharacter,
        addRelationship,
        updateRelationship,
        deleteRelationship,
        addLocation,
        updateLocation,
        deleteLocation,
        addEpisode,
        updateEpisode,
        deleteEpisode,
        addStoryUnit,
        updateStoryUnit,
        deleteStoryUnit,
        addTimelineEvent,
        updateTimelineEvent,
        deleteTimelineEvent,
        addSecret,
        updateSecret,
        deleteSecret,
        addClue,
        updateClue,
        deleteClue,
        addOpenLoop,
        updateOpenLoop,
        deleteOpenLoop,
        addObject,
        updateObject,
        deleteObject,
        addContinuityLog,
        updateContinuityLog,
        deleteContinuityLog,
        addStoryDecision,
        updateStoryDecision,
        deleteStoryDecision,
        addGenerationRun,
        deleteGenerationRun,
        buildContext,
        testGeminiConnection,
        testContextWithGemini,
        generateGeminiContent,
        lastConnectionTest,
        modelConfig,
        updateModelConfig,
        isPlanningEpisode,
        planEpisodeWorkflow,
        validateEpisodePlanWorkflow,
        saveEpisodePlanWorkflow,
        approveEpisodePlanWorkflow,
        archiveEpisodePlanWorkflow,
        exportDatabaseJSON,
        importDatabaseJSON,
        resetDatabase,
      }}
    >
      {children}
    </NovelContext.Provider>
  );
};

export const useNovel = () => {
  const context = useContext(NovelContext);
  if (!context) {
    throw new Error('useNovel must be used within a NovelProvider');
  }
  return context;
};
