// FIX: Replaced React.FC with a standard function component definition for better type inference and consistency.
// FIX: Converted the component from a class-based component to a functional component using hooks for state management. This simplifies the code and aligns with modern React practices.
// FIX: Reorganized state into logical groups using multiple useState hooks for better readability and state management.
import React, { useState, useEffect, useCallback } from 'react';
import { DEFAULT_SECTIONS } from './constants';
import { generateStudyAids } from './services/geminiService';
import { login, signup, checkAuthStatus, logout } from './services/authService';
import { getStats, recordSession, QuizData } from './services/statsService';
import { getProgress, toggleTopicCompletion, clearProgress } from './services/progressService';
import { saveState, loadState, clearUserState } from './services/persistenceService';
import {
  Section,
  User,
  StudyMode,
  GeneratedItems,
  Flashcard,
  QuizQuestion,
  UserStats,
  UserProgress,
  StudyFile,
  SectionId,
  LearningModule,
  LearningStyle,
  OptimizedSchedule,
  Topic,
  MemoryPalaceModule,
} from './types';
// FIX: Corrected and centralized all icon imports to use the new Icons.tsx component library, resolving multiple "missing icon" bugs.
import {
  HomeIcon,
  BookOpenIcon,
  AcademicCapIcon,
  UserCircleIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  ArrowLeftOnRectangleIcon,
  Bars3Icon,
  XMarkIcon,
  SparklesIcon,
  ArrowUpTrayIcon,
  TrashIcon,
  FileTypeIcon
} from './components/Icons';
import { AuthModal } from './components/AuthModal';
import { WelcomeModal } from './components/WelcomeModal';
import { StudySessionModal } from './components/StudySessionModal';
import { LearnSessionModal } from './components/LearnSessionModal';
import { SyllabusModal } from './components/SyllabusModal';
import { StatsModal } from './components/StatsModal';
import { DoubtSolverModal } from './components/DoubtSolverModal';
import FocusDashboard from './components/FocusDashboard';
import { ProgressTracker } from './components/ProgressTracker';
import { StudyTools } from './components/StudyTools';
// NEW: Imported the new MemoryPalaceModal component.
import { MemoryPalaceModal } from './components/MemoryPalaceModal';


function App() {
  // User & Auth State
  const [user, setUser] = useState<User | null>(checkAuthStatus());
  const [isAuthModalOpen, setAuthModalOpen] = useState(false);

  // App Content & Navigation State
  const [sections, setSections] = useState<Section[]>(DEFAULT_SECTIONS);
  const [activeSectionId, setActiveSectionId] = useState<SectionId>('home');
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [isSyllabusCustom, setIsSyllabusCustom] = useState(false);

  // Study & Modal State
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [studyFiles, setStudyFiles] = useState<Record<SectionId, StudyFile[]>>({});
  const [generatedItems, setGeneratedItems] = useState<GeneratedItems | null>(null);
  const [studyMode, setStudyMode] = useState<StudyMode | null>(null);
  // NEW: Added state for the "Memory Palace" feature.
  const [memoryPalaceItems, setMemoryPalaceItems] = useState<MemoryPalaceModule | null>(null);
  const [modalStates, setModalStates] = useState({
    welcome: false,
    syllabus: false,
    stats: false,
    doubtSolver: false,
  });
  
  // Data & Progress State
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [userProgress, setUserProgress] = useState<UserProgress | null>(null);
  
  // Loading & Error State
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load user-specific state from localStorage on login
  useEffect(() => {
    if (user) {
      const loadedSections = loadState<Section[]>(user.username, 'sections');
      const loadedIsCustom = loadState<boolean>(user.username, 'isSyllabusCustom');
      
      if (loadedSections && loadedIsCustom) {
        setSections(loadedSections);
        setIsSyllabusCustom(loadedIsCustom);
      } else {
        setSections(DEFAULT_SECTIONS);
        setIsSyllabusCustom(false);
      }
      
      setUserStats(getStats(user.username));
      setUserProgress(getProgress(user.username));
      setAuthModalOpen(false);

      // Show welcome modal for first-time users
      const hasSeenWelcome = loadState<boolean>(user.username, 'hasSeenWelcome');
      if (!hasSeenWelcome) {
        setModalStates(prev => ({ ...prev, welcome: true }));
        saveState(user.username, 'hasSeenWelcome', true);
      }
    } else {
      setAuthModalOpen(true);
    }
  }, [user]);

  // Persist state to localStorage when it changes
  useEffect(() => {
    if (user) {
      saveState(user.username, 'sections', sections);
      saveState(user.username, 'isSyllabusCustom', isSyllabusCustom);
    }
  }, [user, sections, isSyllabusCustom]);

  const handleLogin = async (username: string, pass: string) => {
    const loggedInUser = await login(username, pass);
    setUser(loggedInUser);
  };
  
  const handleSignup = async (username: string, pass: string) => {
    const newUser = await signup(username, pass);
    setUser(newUser);
  };
  
  const handleLogout = () => {
    logout();
    setUser(null);
    setSections(DEFAULT_SECTIONS);
    setActiveSectionId('home');
    setIsSyllabusCustom(false);
    setStudyFiles({});
  };

  const handleSyllabusUpdate = (newSections: Section[]) => {
    if (user) {
        // Clear old progress when a new syllabus is uploaded
        const clearedProgress = clearProgress(user.username); 
        setUserProgress(clearedProgress);
        setSections(newSections);
        setIsSyllabusCustom(true);
        setActiveSectionId(newSections[0]?.id || 'home');
        setStudyFiles({}); // Clear files from previous syllabus
    }
  };

  const handleRevertToDefault = () => {
    if (user) {
        clearUserState(user.username, ['sections', 'isSyllabusCustom']);
        const clearedProgress = clearProgress(user.username); 
        setUserProgress(clearedProgress);
        setSections(DEFAULT_SECTIONS);
        setIsSyllabusCustom(false);
        setActiveSectionId('home');
        setStudyFiles({});
        setModalStates(prev => ({...prev, syllabus: false}));
    }
  };

  const handleFileChange = (sectionId: SectionId, event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;

    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const fileContent = e.target?.result as string;
        const newFile: StudyFile = {
            id: `${sectionId}-${file.name}-${Date.now()}`,
            name: file.name,
            type: file.type,
            content: fileContent,
        };
        setStudyFiles(prev => ({
          ...prev,
          [sectionId]: [...(prev[sectionId] || []), newFile],
        }));
      };
      if (file.type.startsWith('text/')) {
        reader.readAsText(file);
      } else {
        reader.readAsDataURL(file);
      }
    });
  };

  const removeFile = (sectionId: SectionId, fileId: string) => {
    setStudyFiles(prev => ({
      ...prev,
      [sectionId]: (prev[sectionId] || []).filter(f => f.id !== fileId),
    }));
  };

  const handleGenerateStudyAids = useCallback(async (mode: StudyMode, topic: string, customInstructions: string) => {
    setIsLoading(true);
    setError(null);
    setGeneratedItems(null);
    setStudyMode(null);
    setMemoryPalaceItems(null);

    const activeSection = sections.find(s => s.id === activeSectionId);
    const filesForSection = studyFiles[activeSectionId] || [];
    
    // Pass either section-specific files OR all files if generating from the dashboard
    const filesToUse = activeSectionId === 'home' 
        ? Object.values(studyFiles).flat()
        : filesForSection;

    try {
      const items = await generateStudyAids(mode, topic, filesToUse, customInstructions);
      if (items.length > 0 && 'stepType' in items[0]) {
        setMemoryPalaceItems(items as MemoryPalaceModule);
      } else if (mode === 'learn') {
        setGeneratedItems(items);
        setStudyMode(mode);
      } else {
        setGeneratedItems(items);
        setStudyMode(mode);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  }, [activeSectionId, sections, studyFiles]);

  const handleQuizComplete = useCallback((topic: string, score: number, total: number) => {
    if (user) {
        const quizData: QuizData = { topic, score, total };
        const updatedStats = recordSession(user.username, 'quiz', quizData);
        setUserStats(updatedStats);
    }
  }, [user]);

  const handleTopicToggle = (topicName: string) => {
    if (user) {
        const newProgress = toggleTopicCompletion(user.username, topicName);
        setUserProgress(newProgress);
    }
  }

  const handleModalToggle = (modalName: keyof typeof modalStates, isOpen: boolean) => {
    setModalStates(prev => ({...prev, [modalName]: isOpen}));
  };

  const renderActiveSection = () => {
    if (activeSectionId === 'home') {
      return <FocusDashboard 
        user={user} 
        stats={userStats}
        sections={sections}
        isSyllabusCustom={isSyllabusCustom}
        onGenerate={handleGenerateStudyAids}
        onNavigate={(id) => setActiveSectionId(id)}
      />;
    }
    const section = sections.find(s => s.id === activeSectionId);
    if (!section) return <div className="p-8 text-center text-slate-500">Section not found.</div>;

    const filesForSection = studyFiles[section.id] || [];
    const allTopics = section.topics.flatMap(t => [t.name, ...(t.subTopics || [])]);
    
    return (
      <div className="p-4 sm:p-6 lg:p-8 space-y-8">
        <header>
            <h2 className="text-4xl font-bold text-white flex items-baseline gap-4">{section.title} <span className="text-2xl font-normal text-slate-400">{section.sanskritTitle}</span></h2>
            <p className="text-slate-400 mt-2 max-w-2xl">{section.description}</p>
        </header>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column: Study Library */}
            <div className="bg-slate-900/70 backdrop-blur-sm border border-slate-800 rounded-2xl p-6">
                 <h3 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-violet-400 mb-6">Study Library</h3>
                 
                 {section.topics.map((topic, index) => (
                    <div key={index} className="mb-4">
                        <div 
                            className={`p-3 rounded-lg cursor-pointer transition-colors ${selectedTopic === topic.name ? 'bg-cyan-500/20' : 'hover:bg-slate-800'}`}
                            onClick={() => setSelectedTopic(topic.name)}
                        >
                           <label className="flex items-center space-x-3 cursor-pointer">
                                <input
                                type="checkbox"
                                className="w-5 h-5 bg-slate-700 border-slate-600 rounded text-cyan-500 focus:ring-cyan-600"
                                checked={userProgress?.completedTopics.includes(topic.name) || false}
                                onChange={() => handleTopicToggle(topic.name)}
                                onClick={(e) => e.stopPropagation()} // Prevent topic selection on checkbox click
                                />
                                <span className="font-semibold text-slate-200">{topic.name}</span>
                           </label>
                        </div>
                        {topic.subTopics && (
                           <div className="ml-8 mt-2 space-y-2 border-l-2 border-slate-800 pl-4">
                                {topic.subTopics.map(subTopic => (
                                    <div 
                                        key={subTopic} 
                                        className={`p-2 rounded-md cursor-pointer text-sm transition-colors ${selectedTopic === subTopic ? 'bg-cyan-500/20' : 'hover:bg-slate-800'}`}
                                        onClick={() => setSelectedTopic(subTopic)}
                                    >
                                         <label className="flex items-center space-x-3 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                className="w-4 h-4 bg-slate-700 border-slate-600 rounded text-cyan-500 focus:ring-cyan-600"
                                                checked={userProgress?.completedTopics.includes(subTopic) || false}
                                                onChange={() => handleTopicToggle(subTopic)}
                                                onClick={(e) => e.stopPropagation()}
                                            />
                                            <span className="text-slate-300">{subTopic}</span>
                                        </label>
                                    </div>
                                ))}
                           </div>
                        )}
                    </div>
                 ))}

                <div className="mt-8 border-t border-slate-800 pt-6">
                  <h4 className="text-xl font-bold text-slate-200 mb-2">Section Materials</h4>
                  <p className="text-sm text-slate-400 mb-4">Upload your notes or PDFs. Lex will use them to generate study aids for this section.</p>
                  
                  <div className="space-y-2 mb-4 max-h-48 overflow-y-auto pr-2">
                      {filesForSection.map(file => (
                          <div key={file.id} className="bg-slate-800/50 p-2 rounded-lg flex items-center justify-between animate-fade-in border border-slate-700">
                              <div className="flex items-center gap-3 flex-1 overflow-hidden">
                                  <FileTypeIcon type={file.type} className="w-5 h-5 flex-shrink-0" />
                                  <span className="text-sm text-slate-200 truncate">{file.name}</span>
                              </div>
                              <button onClick={() => removeFile(section.id, file.id)} className="p-1.5 rounded-full hover:bg-slate-700 text-slate-400 hover:text-white flex-shrink-0 ml-2">
                                  <TrashIcon className="w-5 h-5"/>
                              </button>
                          </div>
                      ))}
                  </div>

                  <label className="w-full cursor-pointer border-2 border-dashed border-slate-700 hover:border-cyan-500 hover:bg-slate-800/50 rounded-lg p-4 flex flex-col items-center justify-center text-center text-slate-400 hover:text-cyan-400 transition-colors">
                      <ArrowUpTrayIcon className="w-8 h-8 mb-1" />
                      <span className="text-sm font-semibold">{filesForSection.length > 0 ? 'Upload more files' : 'Upload study materials'}</span>
                      <input 
                          type="file" 
                          multiple
                          className="hidden" 
                          onChange={(e) => handleFileChange(section.id, e)} 
                      />
                  </label>
                </div>
            </div>

            {/* Right Column: AI Tools */}
            <StudyTools 
                selectedTopic={selectedTopic}
                onGenerate={handleGenerateStudyAids}
                onDoubtSolverOpen={() => handleModalToggle('doubtSolver', true)}
            />
        </div>
      </div>
    );
  };

  const NavItem: React.FC<{ icon: React.ReactNode; label: string; isActive: boolean; onClick: () => void; }> = ({ icon, label, isActive, onClick }) => (
    <li>
      <button onClick={onClick} className={`w-full flex items-center p-3 rounded-lg transition-colors ${isActive ? 'bg-cyan-500/10 text-cyan-400' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
        {icon}
        <span className="ml-4 font-semibold">{label}</span>
      </button>
    </li>
  );

  if (!user) {
    return (
      <div className="h-screen bg-slate-950 flex items-center justify-center">
        <AuthModal
            isOpen={isAuthModalOpen}
            onLogin={handleLogin}
            onSignup={handleSignup}
        />
      </div>
    );
  }

  const completedCount = userProgress?.completedTopics.length || 0;
  const allTopics = sections.flatMap(s => s.topics.flatMap(t => [t.name, ...(t.subTopics || [])]));
  const totalCount = allTopics.length;
  const progressPercentage = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;
  
  return (
    <div className="flex h-screen bg-slate-950">
      <aside className={`absolute lg:relative inset-y-0 left-0 z-40 w-64 bg-slate-900/95 backdrop-blur-lg border-r border-slate-800 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 transition-transform duration-300 ease-in-out`}>
        <div className="flex flex-col h-full">
            <div className="flex items-center justify-between p-4 border-b border-slate-800">
                <div className="flex items-center gap-2">
                    <SparklesIcon className="w-8 h-8 text-cyan-400" />
                    <span className="text-xl font-bold text-white">LEX</span>
                </div>
                <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-1 text-slate-400 hover:text-white">
                    <XMarkIcon />
                </button>
            </div>
            <nav className="flex-1 p-4 space-y-2">
                <ul>
                    <NavItem icon={<HomeIcon />} label="Home" isActive={activeSectionId === 'home'} onClick={() => { setActiveSectionId('home'); setSidebarOpen(false); }}/>
                    <li className="px-3 pt-4 pb-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">Sections</li>
                    {sections.map(section => (
                    <NavItem 
                        key={section.id} 
                        icon={<BookOpenIcon />} 
                        label={section.title} 
                        isActive={activeSectionId === section.id} 
                        onClick={() => { setActiveSectionId(section.id); setSidebarOpen(false); }}
                    />
                    ))}
                </ul>
            </nav>
            <div className="p-4 border-t border-slate-800 space-y-2">
                 <NavItem icon={<ChartBarIcon />} label="My Stats" isActive={modalStates.stats} onClick={() => handleModalToggle('stats', true)}/>
                 <NavItem icon={<Cog6ToothIcon />} label="My Syllabus" isActive={modalStates.syllabus} onClick={() => handleModalToggle('syllabus', true)}/>
                 <div className="pt-2 border-t border-slate-800/50">
                    <button onClick={handleLogout} className="w-full flex items-center p-3 rounded-lg text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-colors">
                        <ArrowLeftOnRectangleIcon />
                        <span className="ml-4 font-semibold">Logout</span>
                    </button>
                    <div className="text-center text-xs text-slate-600 mt-2">Logged in as {user.username}</div>
                 </div>
            </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="lg:hidden bg-slate-900/80 backdrop-blur-sm border-b border-slate-800 p-4 flex items-center">
            <button onClick={() => setSidebarOpen(true)} className="p-2 text-slate-300">
                <Bars3Icon />
            </button>
            <div className="flex-1 text-center">
                <span className="text-lg font-bold text-white">LEX</span>
            </div>
        </header>
        <div className="flex-1 overflow-y-auto">
            {renderActiveSection()}
        </div>
      </main>

      {/* Modals */}
      {modalStates.welcome && <WelcomeModal onClose={() => handleModalToggle('welcome', false)} />}
      
      {generatedItems && studyMode && ['flashcards', 'quiz'].includes(studyMode) && (
        <StudySessionModal
            topic={selectedTopic || 'Review'}
            mode={studyMode as 'flashcards' | 'quiz'}
// FIX: Added type assertion to resolve TypeScript error where `GeneratedItems` was not assignable to `Flashcard[] | QuizQuestion[]`.
            items={generatedItems as Flashcard[] | QuizQuestion[]}
            onClose={() => { setGeneratedItems(null); setStudyMode(null); }}
            onQuizComplete={handleQuizComplete}
        />
      )}

      {generatedItems && studyMode === 'learn' && (
        <LearnSessionModal
            topic={selectedTopic || 'Learn'}
            items={generatedItems as LearningModule}
            onClose={() => { setGeneratedItems(null); setStudyMode(null); }}
        />
      )}
      
      {/* NEW: Render the Memory Palace modal when its items are available */}
      {memoryPalaceItems && (
        <MemoryPalaceModal
            topic={selectedTopic || 'Memorize'}
            items={memoryPalaceItems}
            onClose={() => setMemoryPalaceItems(null)}
        />
      )}

      {modalStates.syllabus && (
        <SyllabusModal
          onClose={() => handleModalToggle('syllabus', false)}
          onSyllabusUpdate={handleSyllabusUpdate}
          onRevertToDefault={handleRevertToDefault}
        />
      )}
      
      {modalStates.stats && <StatsModal stats={userStats} onClose={() => handleModalToggle('stats', false)} />}

      {modalStates.doubtSolver && (
         <DoubtSolverModal 
            isOpen={modalStates.doubtSolver}
            onClose={() => handleModalToggle('doubtSolver', false)}
            topic={selectedTopic || 'General'}
            files={studyFiles[activeSectionId] || []}
         />
      )}

      {isLoading && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center z-[100]">
            <SparklesIcon className="w-12 h-12 text-cyan-400 animate-pulse" />
            <p className="text-slate-300 mt-4 text-lg">Lex is thinking...</p>
        </div>
      )}

       {error && (
        <div className="fixed bottom-4 right-4 bg-red-800/90 border border-red-600 text-white p-4 rounded-lg shadow-2xl z-[100] max-w-sm animate-fade-in">
          <div className="flex justify-between items-start">
            <div>
              <h4 className="font-bold">An Error Occurred</h4>
              <p className="text-sm mt-1">{error}</p>
            </div>
            <button onClick={() => setError(null)} className="p-1 -mr-1 -mt-1 rounded-full hover:bg-red-700">
                <XMarkIcon className="w-5 h-5"/>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;