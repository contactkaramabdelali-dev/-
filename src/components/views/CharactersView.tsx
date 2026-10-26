import React, { useState } from 'react';
import { Users, Plus, Mic, Search, Trash2, Edit3, ShieldAlert, Sparkles, Filter, GitCommit, HeartHandshake, Eye, Skull } from 'lucide-react';
import { useNovel } from '../../context/NovelContext';
import { Character, CharacterRelationship } from '../../types/database';
import { EmptyState } from '../common/EmptyState';
import { Modal } from '../common/Modal';

export const CharactersView: React.FC = () => {
  const {
    activeProject,
    characters,
    relationships,
    addCharacter,
    updateCharacter,
    deleteCharacter,
    addRelationship,
    updateRelationship,
    deleteRelationship,
  } = useNovel();

  const [activeTab, setActiveTab] = useState<'characters' | 'relationships'>('characters');
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');

  // Character Modal State
  const [isCharModalOpen, setIsCharModalOpen] = useState(false);
  const [editingChar, setEditingChar] = useState<Character | null>(null);
  const [charFormTab, setCharFormTab] = useState<'basic' | 'psychology' | 'arc' | 'knowledge'>('basic');

  // Form Fields
  const [name, setName] = useState('');
  const [aliases, setAliases] = useState('');
  const [role, setRole] = useState<Character['role']>('رئيسية');
  const [age, setAge] = useState<string>('');
  const [status, setStatus] = useState<Character['status']>('حي');
  const [background, setBackground] = useState('');
  const [physicalDescription, setPhysicalDescription] = useState('');
  const [personality, setPersonality] = useState('');
  const [speakingStyle, setSpeakingStyle] = useState('');
  const [wants, setWants] = useState('');
  const [fears, setFears] = useState('');
  const [beliefs, setBeliefs] = useState('');
  const [wound, setWound] = useState('');
  const [secret, setSecret] = useState('');
  const [limits, setLimits] = useState('');
  const [arcStart, setArcStart] = useState('');
  const [arcCurrent, setArcCurrent] = useState('');
  const [arcDestination, setArcDestination] = useState('');
  const [currentLocation, setCurrentLocation] = useState('');
  const [physicalState, setPhysicalState] = useState('');
  const [psychologicalState, setPsychologicalState] = useState('');
  const [currentGoal, setCurrentGoal] = useState('');
  const [currentKnowledge, setCurrentKnowledge] = useState('');
  const [forbiddenKnowledge, setForbiddenKnowledge] = useState('');

  // Relationship Modal State
  const [isRelModalOpen, setIsRelModalOpen] = useState(false);
  const [editingRel, setEditingRel] = useState<CharacterRelationship | null>(null);
  const [charAId, setCharAId] = useState('');
  const [charBId, setCharBId] = useState('');
  const [relType, setRelType] = useState<CharacterRelationship['relationship_type']>('قرابة عائلية');
  const [publicRel, setPublicRel] = useState('');
  const [realRel, setRealRel] = useState('');
  const [trustLevel, setTrustLevel] = useState<number>(5);
  const [tensionLevel, setTensionLevel] = useState<number>(5);
  const [currentState, setCurrentState] = useState('');
  const [history, setHistory] = useState('');

  const openAddCharModal = () => {
    setEditingChar(null);
    setName('');
    setAliases('');
    setRole('رئيسية');
    setAge('');
    setStatus('حي');
    setBackground('');
    setPhysicalDescription('');
    setPersonality('');
    setSpeakingStyle('');
    setWants('');
    setFears('');
    setBeliefs('');
    setWound('');
    setSecret('');
    setLimits('');
    setArcStart('');
    setArcCurrent('');
    setArcDestination('');
    setCurrentLocation('');
    setPhysicalState('');
    setPsychologicalState('');
    setCurrentGoal('');
    setCurrentKnowledge('');
    setForbiddenKnowledge('');
    setCharFormTab('basic');
    setIsCharModalOpen(true);
  };

  const openEditCharModal = (char: Character) => {
    setEditingChar(char);
    setName(char.name);
    setAliases(char.aliases || '');
    setRole(char.role);
    setAge(char.age ? String(char.age) : '');
    setStatus(char.status);
    setBackground(char.background);
    setPhysicalDescription(char.physical_description);
    setPersonality(char.personality);
    setSpeakingStyle(char.speaking_style);
    setWants(char.wants);
    setFears(char.fears);
    setBeliefs(char.beliefs);
    setWound(char.wound);
    setSecret(char.secret);
    setLimits(char.limits);
    setArcStart(char.arc_start);
    setArcCurrent(char.arc_current);
    setArcDestination(char.arc_destination);
    setCurrentLocation(char.current_location);
    setPhysicalState(char.physical_state);
    setPsychologicalState(char.psychological_state);
    setCurrentGoal(char.current_goal);
    setCurrentKnowledge(char.current_knowledge);
    setForbiddenKnowledge(char.forbidden_knowledge);
    setCharFormTab('basic');
    setIsCharModalOpen(true);
  };

  const handleCharSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (editingChar) {
      await updateCharacter(editingChar.id, {
        name: name.trim(),
        aliases: aliases.trim(),
        role,
        age: age ? parseInt(age) || age : undefined,
        status,
        background: background.trim(),
        physical_description: physicalDescription.trim(),
        personality: personality.trim(),
        speaking_style: speakingStyle.trim(),
        wants: wants.trim(),
        fears: fears.trim(),
        beliefs: beliefs.trim(),
        wound: wound.trim(),
        secret: secret.trim(),
        limits: limits.trim(),
        arc_start: arcStart.trim(),
        arc_current: arcCurrent.trim(),
        arc_destination: arcDestination.trim(),
        current_location: currentLocation.trim(),
        physical_state: physicalState.trim(),
        psychological_state: psychologicalState.trim(),
        current_goal: currentGoal.trim(),
        current_knowledge: currentKnowledge.trim(),
        forbidden_knowledge: forbiddenKnowledge.trim(),
      });
    } else {
      await addCharacter({
        name: name.trim(),
        aliases: aliases.trim(),
        role,
        age: age ? parseInt(age) || age : undefined,
        status,
        background: background.trim(),
        physical_description: physicalDescription.trim(),
        personality: personality.trim(),
        speaking_style: speakingStyle.trim(),
        wants: wants.trim(),
        fears: fears.trim(),
        beliefs: beliefs.trim(),
        wound: wound.trim(),
        secret: secret.trim(),
        limits: limits.trim(),
        arc_start: arcStart.trim(),
        arc_current: arcCurrent.trim(),
        arc_destination: arcDestination.trim(),
        current_location: currentLocation.trim(),
        physical_state: physicalState.trim(),
        psychological_state: psychologicalState.trim(),
        current_goal: currentGoal.trim(),
        current_knowledge: currentKnowledge.trim(),
        forbidden_knowledge: forbiddenKnowledge.trim(),
      });
    }
    setIsCharModalOpen(false);
  };

  const openAddRelModal = () => {
    if (characters.length < 2) {
      alert('يجب إضافة شخصيتين على الأقل لإنشاء علاقة بينهما.');
      return;
    }
    setEditingRel(null);
    setCharAId(characters[0].id);
    setCharBId(characters[1].id);
    setRelType('قرابة عائلية');
    setPublicRel('');
    setRealRel('');
    setTrustLevel(5);
    setTensionLevel(5);
    setCurrentState('');
    setHistory('');
    setIsRelModalOpen(true);
  };

  const openEditRelModal = (rel: CharacterRelationship) => {
    setEditingRel(rel);
    setCharAId(rel.character_a_id);
    setCharBId(rel.character_b_id);
    setRelType(rel.relationship_type);
    setPublicRel(rel.public_relationship);
    setRealRel(rel.real_relationship);
    setTrustLevel(rel.trust_level);
    setTensionLevel(rel.tension_level);
    setCurrentState(rel.current_state);
    setHistory(rel.history);
    setIsRelModalOpen(true);
  };

  const handleRelSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!charAId || !charBId || charAId === charBId) {
      alert('يرجى اختيار شخصيتين مختلفتين.');
      return;
    }

    if (editingRel) {
      await updateRelationship(editingRel.id, {
        character_a_id: charAId,
        character_b_id: charBId,
        relationship_type: relType,
        public_relationship: publicRel.trim(),
        real_relationship: realRel.trim(),
        trust_level: trustLevel,
        tension_level: tensionLevel,
        current_state: currentState.trim(),
        history: history.trim(),
      });
    } else {
      await addRelationship({
        character_a_id: charAId,
        character_b_id: charBId,
        relationship_type: relType,
        public_relationship: publicRel.trim(),
        real_relationship: realRel.trim(),
        trust_level: trustLevel,
        tension_level: tensionLevel,
        current_state: currentState.trim(),
        history: history.trim(),
      });
    }
    setIsRelModalOpen(false);
  };

  const filteredCharacters = characters.filter((char) => {
    const matchesSearch =
      char.name.toLowerCase().includes(search.toLowerCase()) ||
      (char.aliases && char.aliases.toLowerCase().includes(search.toLowerCase())) ||
      (char.personality && char.personality.toLowerCase().includes(search.toLowerCase()));
    const matchesRole = roleFilter === 'all' || char.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="space-y-6">
      {/* Top Tab Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-5 rounded-2xl bg-[#0f1117] border border-zinc-800/80">
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-zinc-900 p-1 rounded-xl border border-zinc-800">
            <button
              onClick={() => setActiveTab('characters')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'characters'
                  ? 'bg-amber-500 text-zinc-950 shadow-md'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              سجل الشخصيات ({characters.length})
            </button>
            <button
              onClick={() => setActiveTab('relationships')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'relationships'
                  ? 'bg-amber-500 text-zinc-950 shadow-md'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              شبكة العلاقات ({relationships.length})
            </button>
          </div>
        </div>

        {activeTab === 'characters' ? (
          <div className="flex items-center gap-3">
            <div className="relative w-48 sm:w-60">
              <Search className="w-3.5 h-3.5 text-zinc-500 absolute right-3 top-3 pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="بحث في الشخصيات..."
                className="w-full pr-9 pl-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-amber-500"
              />
            </div>

            <button
              onClick={openAddCharModal}
              className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-zinc-950 font-bold text-xs transition-colors cursor-pointer shadow-lg shadow-amber-950/40"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة شخصية</span>
            </button>
          </div>
        ) : (
          <button
            onClick={openAddRelModal}
            className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-zinc-950 font-bold text-xs transition-colors cursor-pointer shadow-lg shadow-amber-950/40"
          >
            <Plus className="w-4 h-4" />
            <span>توثيق علاقة جديدة</span>
          </button>
        )}
      </div>

      {/* Characters Tab Content */}
      {activeTab === 'characters' && (
        <>
          {characters.length === 0 ? (
            <EmptyState
              icon={Users}
              title="لا توجد شخصيات مسجلة في الرواية حتى الآن"
              description="سجل الشخصيات فارغ تماماً. قم بتوثيق أبطال القصة، أصواتهم، لهجاتهم، وأسرارهم لحفظها في قاعدة البيانات الدائمة."
              actionLabel="إضافة أول شخصية"
              onAction={openAddCharModal}
              hintText="نصيحة صوتية: دوّن دائماً نبرة صوت الشخصية ومخارج حروفها لتوجيه الأداء الإذاعي"
            />
          ) : filteredCharacters.length === 0 ? (
            <div className="text-center py-12 text-zinc-500 text-sm">
              لا توجد شخصية مطابقة لبحثك الحالي.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredCharacters.map((char) => (
                <div
                  key={char.id}
                  className="p-5 rounded-2xl bg-[#0f1117] border border-zinc-800/80 hover:border-zinc-700/80 transition-all flex flex-col justify-between group shadow-lg shadow-black/40"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div>
                        <h3 className="font-heading font-bold text-lg text-zinc-100 group-hover:text-amber-400 transition-colors">
                          {char.name}
                        </h3>
                        {char.aliases && (
                          <span className="text-xs text-amber-500/80 font-mono">
                            «{char.aliases}»
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-md font-semibold border ${
                            char.role === 'رئيسية'
                              ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                              : char.role === 'غامضة'
                              ? 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                              : 'bg-zinc-800 text-zinc-300 border-zinc-700'
                          }`}
                        >
                          {char.role}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-md border bg-zinc-800 text-zinc-400 border-zinc-700">
                          {char.status}
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-zinc-300 leading-relaxed line-clamp-3 mb-4">
                      {char.personality || char.background || 'لا يوجد ملف نفسي مسجل بعد.'}
                    </p>

                    {char.speaking_style && (
                      <div className="mb-2 p-2 rounded-xl bg-zinc-900/80 border border-zinc-850 flex items-start gap-2 text-xs text-zinc-300">
                        <Mic className="w-3.5 h-3.5 text-amber-400 mt-0.5 shrink-0" />
                        <div>
                          <span className="text-[10px] text-zinc-400 block font-mono">أسلوب الحوار والصوت:</span>
                          <span>{char.speaking_style}</span>
                        </div>
                      </div>
                    )}

                    {char.secret && (
                      <div className="mb-2 p-2 rounded-xl bg-red-950/20 border border-red-900/30 flex items-start gap-2 text-xs text-red-200">
                        <ShieldAlert className="w-3.5 h-3.5 text-red-400 mt-0.5 shrink-0" />
                        <div>
                          <span className="text-[10px] text-red-400 block font-mono">السر الشخصي:</span>
                          <span className="line-clamp-2">{char.secret}</span>
                        </div>
                      </div>
                    )}

                    {char.forbidden_knowledge && (
                      <div className="p-2 rounded-xl bg-purple-950/20 border border-purple-900/30 flex items-start gap-2 text-xs text-purple-200">
                        <Eye className="w-3.5 h-3.5 text-purple-400 mt-0.5 shrink-0" />
                        <div>
                          <span className="text-[10px] text-purple-400 block font-mono">المعرفة المحرمة:</span>
                          <span className="line-clamp-2">{char.forbidden_knowledge}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Actions footer */}
                  <div className="flex items-center justify-end gap-2 pt-4 mt-4 border-t border-zinc-850">
                    <button
                      onClick={() => openEditCharModal(char)}
                      className="p-1.5 text-zinc-400 hover:text-amber-400 rounded-lg hover:bg-zinc-800 transition-colors"
                      title="تعديل"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`هل أنت متأكد من حذف الشخصية "${char.name}" من قاعدة البيانات؟`)) {
                          deleteCharacter(char.id);
                        }
                      }}
                      className="p-1.5 text-zinc-400 hover:text-red-400 rounded-lg hover:bg-zinc-800 transition-colors"
                      title="حذف"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Relationships Tab Content */}
      {activeTab === 'relationships' && (
        <>
          {relationships.length === 0 ? (
            <EmptyState
              icon={HeartHandshake}
              title="لم يتم توثيق أي علاقات بين الشخصيات بعد"
              description="شبكة العلاقات ترصد مستويات الثقة والتوتر، والعلاقات المعلنة للملأ مقابل الحقيقية."
              actionLabel="توثيق أول علاقة"
              onAction={openAddRelModal}
              hintText="نصيحة: ضبط درجات التوتر يساعد في توجيه نبرة الحوارات الصوتية بالدارجة"
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {relationships.map((rel) => {
                const charA = characters.find(c => c.id === rel.character_a_id);
                const charB = characters.find(c => c.id === rel.character_b_id);

                return (
                  <div
                    key={rel.id}
                    className="p-5 rounded-2xl bg-[#0f1117] border border-zinc-800/80 hover:border-zinc-700/80 transition-all flex flex-col justify-between shadow-lg"
                  >
                    <div>
                      <div className="flex items-center justify-between border-b border-zinc-800 pb-3 mb-3">
                        <div className="flex items-center gap-2">
                          <span className="font-bold font-heading text-amber-400">
                            {charA?.name || 'شخصية مجهولة'}
                          </span>
                          <span className="text-zinc-600">⟷</span>
                          <span className="font-bold font-heading text-amber-400">
                            {charB?.name || 'شخصية مجهولة'}
                          </span>
                        </div>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 font-mono">
                          {rel.relationship_type}
                        </span>
                      </div>

                      <div className="space-y-2 text-xs">
                        {rel.public_relationship && (
                          <div>
                            <span className="text-zinc-500 font-mono block">العلاقة الظاهرة أمام الناس:</span>
                            <span className="text-zinc-300">{rel.public_relationship}</span>
                          </div>
                        )}

                        {rel.real_relationship && (
                          <div>
                            <span className="text-red-400/80 font-mono block">العلاقة الحقيقية المخفية:</span>
                            <span className="text-zinc-200">{rel.real_relationship}</span>
                          </div>
                        )}

                        <div className="grid grid-cols-2 gap-2 pt-2">
                          <div className="bg-zinc-900 p-2 rounded-lg border border-zinc-800 text-center font-mono">
                            <span className="text-zinc-500 block text-[10px]">مستوى الثقة</span>
                            <span className="text-emerald-400 font-bold">{rel.trust_level} / 10</span>
                          </div>
                          <div className="bg-zinc-900 p-2 rounded-lg border border-zinc-800 text-center font-mono">
                            <span className="text-zinc-500 block text-[10px]">مستوى التوتر</span>
                            <span className="text-red-400 font-bold">{rel.tension_level} / 10</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-3 mt-3 border-t border-zinc-850">
                      <button
                        onClick={() => openEditRelModal(rel)}
                        className="p-1.5 text-zinc-400 hover:text-amber-400 rounded-lg hover:bg-zinc-800 transition-colors"
                        title="تعديل"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`هل أنت متأكد من حذف هذه العلاقة؟`)) {
                            deleteRelationship(rel.id);
                          }
                        }}
                        className="p-1.5 text-zinc-400 hover:text-red-400 rounded-lg hover:bg-zinc-800 transition-colors"
                        title="حذف"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Add / Edit Character Modal */}
      <Modal
        isOpen={isCharModalOpen}
        onClose={() => setIsCharModalOpen(false)}
        title={editingChar ? 'تعديل بيانات الشخصية' : 'إضافة شخصية جديدة'}
        subtitle="توثيق الملف الشامل للشخصية في قاعدة البيانات الدائمة"
        maxWidth="max-w-3xl"
      >
        <form onSubmit={handleCharSubmit} className="space-y-4">
          {/* Sub Tabs */}
          <div className="flex items-center gap-2 border-b border-zinc-800 pb-2">
            <button
              type="button"
              onClick={() => setCharFormTab('basic')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold ${
                charFormTab === 'basic' ? 'bg-amber-500 text-zinc-950' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              الملف الأساسي
            </button>
            <button
              type="button"
              onClick={() => setCharFormTab('psychology')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold ${
                charFormTab === 'psychology' ? 'bg-amber-500 text-zinc-950' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              النفسية والدوافع
            </button>
            <button
              type="button"
              onClick={() => setCharFormTab('arc')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold ${
                charFormTab === 'arc' ? 'bg-amber-500 text-zinc-950' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              المسار والحالة
            </button>
            <button
              type="button"
              onClick={() => setCharFormTab('knowledge')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold ${
                charFormTab === 'knowledge' ? 'bg-amber-500 text-zinc-950' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              الأسرار والمعرفة
            </button>
          </div>

          {/* Tab 1: Basic */}
          {charFormTab === 'basic' && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">الاسم الكامل *</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="مثال: يونس المرابطي"
                    className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-100 text-xs focus:border-amber-500 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">اللقب / الاسم الحركي</label>
                  <input
                    type="text"
                    value={aliases}
                    onChange={(e) => setAliases(e.target.value)}
                    placeholder="«الغراب»"
                    className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-100 text-xs focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">الدور</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as Character['role'])}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-200 text-xs focus:border-amber-500 focus:outline-none"
                  >
                    <option value="رئيسية">رئيسية</option>
                    <option value="ثانوية">ثانوية</option>
                    <option value="غامضة">غامضة</option>
                    <option value="عابرة">عابرة</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">العمر التقديري</label>
                  <input
                    type="text"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    placeholder="مثال: 38"
                    className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-100 text-xs focus:border-amber-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">الحالة</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as Character['status'])}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-200 text-xs focus:border-amber-500 focus:outline-none"
                  >
                    <option value="حي">حي</option>
                    <option value="مختفي">مختفي</option>
                    <option value="متوفى">متوفى</option>
                    <option value="مجهول">مجهول المصير</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">الخلفية والنشأة (Background)</label>
                <textarea
                  rows={2}
                  value={background}
                  onChange={(e) => setBackground(e.target.value)}
                  placeholder="من أين جاء؟ ما هي أصوله وماضيه العائلي؟"
                  className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-100 text-xs focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1 flex items-center gap-1">
                  <Mic className="w-3 h-3 text-amber-500" />
                  <span>طريقة الكلام ونبرة الصوت الإذاعي (Speaking Style)</span>
                </label>
                <input
                  type="text"
                  value={speakingStyle}
                  onChange={(e) => setSpeakingStyle(e.target.value)}
                  placeholder="نبرة مبحوحة، مخارج حروف فاسية، استخدام مكثف لأمثال دارجة..."
                  className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-100 text-xs focus:border-amber-500 focus:outline-none"
                />
              </div>
            </div>
          )}

          {/* Tab 2: Psychology */}
          {charFormTab === 'psychology' && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">السمات النفسية والطباع (Personality)</label>
                <textarea
                  rows={2}
                  value={personality}
                  onChange={(e) => setPersonality(e.target.value)}
                  placeholder="كتوم، سريع الشك، يحلل التفاصيل الدقيقة..."
                  className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-100 text-xs focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">الرغبة الكبرى (Wants)</label>
                  <input
                    type="text"
                    value={wants}
                    onChange={(e) => setWants(e.target.value)}
                    placeholder="ماذا يطلب أو يتمنى ظاهرياً؟"
                    className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-100 text-xs focus:border-amber-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">المخاوف (Fears)</label>
                  <input
                    type="text"
                    value={fears}
                    onChange={(e) => setFears(e.target.value)}
                    placeholder="ما الذي يرتعد منه؟"
                    className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-100 text-xs focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">الجرح النفسي القديم (Wound)</label>
                  <input
                    type="text"
                    value={wound}
                    onChange={(e) => setWound(e.target.value)}
                    placeholder="صدمة الطفولة أو الخيانة التي شكلته"
                    className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-100 text-xs focus:border-amber-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">الخطوط الحمراء (Limits)</label>
                  <input
                    type="text"
                    value={limits}
                    onChange={(e) => setLimits(e.target.value)}
                    placeholder="ما الذي يرفض فعله مهما كانت الظروف؟"
                    className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-100 text-xs focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Tab 3: Arc */}
          {charFormTab === 'arc' && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">بداية القوس (Arc Start)</label>
                  <input
                    type="text"
                    value={arcStart}
                    onChange={(e) => setArcStart(e.target.value)}
                    placeholder="حالته في أول حلقة"
                    className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-100 text-xs focus:border-amber-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">الموقع الحالي في القوس</label>
                  <input
                    type="text"
                    value={arcCurrent}
                    onChange={(e) => setArcCurrent(e.target.value)}
                    placeholder="حالته الآن"
                    className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-100 text-xs focus:border-amber-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">وجهة القوس النهائية</label>
                  <input
                    type="text"
                    value={arcDestination}
                    onChange={(e) => setArcDestination(e.target.value)}
                    placeholder="أين سينتهي المطاف به؟"
                    className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-100 text-xs focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">المكان الحالي (Location)</label>
                  <input
                    type="text"
                    value={currentLocation}
                    onChange={(e) => setCurrentLocation(e.target.value)}
                    placeholder="أين يتواجد حالياً؟"
                    className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-100 text-xs focus:border-amber-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">الهدف الراهن (Current Goal)</label>
                  <input
                    type="text"
                    value={currentGoal}
                    onChange={(e) => setCurrentGoal(e.target.value)}
                    placeholder="ماذا يحاول أن يفعل في هذه الحلقة؟"
                    className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-100 text-xs focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Tab 4: Knowledge & Secrets */}
          {charFormTab === 'knowledge' && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1 flex items-center gap-1 text-red-400">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>سر الشخصية الدفين (Secret)</span>
                </label>
                <textarea
                  rows={2}
                  value={secret}
                  onChange={(e) => setSecret(e.target.value)}
                  placeholder="سر خطير لا يعرفه بقية الأبطال في القصة..."
                  className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-100 text-xs focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">ما يعرفه من حقائق القصة (Current Knowledge)</label>
                <textarea
                  rows={2}
                  value={currentKnowledge}
                  onChange={(e) => setCurrentKnowledge(e.target.value)}
                  placeholder="الحقائق المؤكدة التي يمتلكها في هذه المرحلة..."
                  className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-100 text-xs focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1 flex items-center gap-1 text-purple-400">
                  <Eye className="w-3.5 h-3.5" />
                  <span>المعرفة المحرمة (Forbidden Knowledge)</span>
                </label>
                <textarea
                  rows={2}
                  value={forbiddenKnowledge}
                  onChange={(e) => setForbiddenKnowledge(e.target.value)}
                  placeholder="معلومات خطيرة إذا تسربت قد تدمر كل شيء..."
                  className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-100 text-xs focus:border-amber-500 focus:outline-none"
                />
              </div>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800">
            <button
              type="button"
              onClick={() => setIsCharModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-zinc-950 font-bold text-xs cursor-pointer transition-colors"
            >
              {editingChar ? 'تحديث الشخصية' : 'حفظ الشخصية في قاعدة البيانات'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Add / Edit Relationship Modal */}
      <Modal
        isOpen={isRelModalOpen}
        onClose={() => setIsRelModalOpen(false)}
        title={editingRel ? 'تعديل علاقة' : 'توثيق علاقة جديدة'}
        subtitle="تحديد أواصر الثقة والتوتر والتاريخ المشترك بين شخصيتين"
      >
        <form onSubmit={handleRelSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">الشخصية الأولى *</label>
              <select
                value={charAId}
                onChange={(e) => setCharAId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-200 text-xs focus:border-amber-500 focus:outline-none"
                required
              >
                {characters.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">الشخصية الثانية *</label>
              <select
                value={charBId}
                onChange={(e) => setCharBId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-200 text-xs focus:border-amber-500 focus:outline-none"
                required
              >
                {characters.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1">نوع العلاقة</label>
            <select
              value={relType}
              onChange={(e) => setRelType(e.target.value as CharacterRelationship['relationship_type'])}
              className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-200 text-xs focus:border-amber-500 focus:outline-none"
            >
              <option value="قرابة عائلية">قرابة عائلية</option>
              <option value="عداوة">عداوة وصراع</option>
              <option value="تحالف مؤقت">تحالف مؤقت لمصلحة</option>
              <option value="حب خفي">حب خفي</option>
              <option value="شك وريبة">شك وريبة متبادلة</option>
              <option value="سيد وخادم">سيد وخادم</option>
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">العلاقة المعلنة للملأ</label>
              <input
                type="text"
                value={publicRel}
                onChange={(e) => setPublicRel(e.target.value)}
                placeholder="مثال: أبناء عمومة متصالحين"
                className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-100 text-xs focus:border-amber-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">العلاقة الحقيقية المخفية</label>
              <input
                type="text"
                value={realRel}
                onChange={(e) => setRealRel(e.target.value)}
                placeholder="مثال: تنافس دموي على ميراث دار الضمانة"
                className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-100 text-xs focus:border-amber-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                مستوى الثقة (1 إلى 10): {trustLevel}
              </label>
              <input
                type="range"
                min="1"
                max="10"
                value={trustLevel}
                onChange={(e) => setTrustLevel(parseInt(e.target.value))}
                className="w-full accent-amber-500 cursor-pointer"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                مستوى التوتر (1 إلى 10): {tensionLevel}
              </label>
              <input
                type="range"
                min="1"
                max="10"
                value={tensionLevel}
                onChange={(e) => setTensionLevel(parseInt(e.target.value))}
                className="w-full accent-red-500 cursor-pointer"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1">التاريخ المشترك (History)</label>
            <textarea
              rows={2}
              value={history}
              onChange={(e) => setHistory(e.target.value)}
              placeholder="ما الذي وقع بينهما في الماضي وأثر على علاقتهما اليوم؟"
              className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-100 text-xs focus:border-amber-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800">
            <button
              type="button"
              onClick={() => setIsRelModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-zinc-950 font-bold text-xs cursor-pointer transition-colors"
            >
              {editingRel ? 'تحديث العلاقة' : 'حفظ العلاقة'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
