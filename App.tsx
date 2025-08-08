import { useState, useEffect, useCallback } from 'react';
import FeatureTemplate from './components/FeatureTemplate';
import VariantTemplate from './components/VariantTemplate';
import AgreedSolutionTemplate from './components/AgreedSolutionTemplate';
import { NavigationSidebar } from './components/NavigationSidebar';
import { CloudSyncStatus } from './components/CloudSyncStatus';

import { Button } from './components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from './components/ui/alert-dialog';
import { toast, Toaster } from 'sonner@2.0.3';
import { Copy, Code, ChevronDown, Plus, Trash2, Users, RefreshCw } from 'lucide-react';
import { Badge } from './components/ui/badge';
import { cloudSync, User } from './services/cloudSync';
import { CollaborationPanel } from './components/CollaborationPanel';

interface FeaturePage {
  id: string;
  type: 'feature';
  image: string | null;
  title: string;
  release: string;
  team: string;
  app: string;
  state: string;
}

interface VariantData {
  title: string;
  variantNumber: number;
  minDevWorkWeeks: number;
  maxDevWorkWeeks: number;
  uiUxScore: number;
  pros: string[];
  cons: string[];
  image: string | null;
}

interface VariantPage {
  id: string;
  type: 'variant';
  parentFeatureId: string;
  data: VariantData;
}

interface AgreedSolutionPage {
  id: string;
  type: 'agreed-solution';
  parentFeatureId: string;
}

type Page = FeaturePage | VariantPage | AgreedSolutionPage;

interface AppState {
  pages: Page[];
  currentPageId: string;
  agreedSolutions: Record<string, string | null>;
  selectedRelease: string | null;
  availableReleases: string[];
  selectedTeam: string | null;
  selectedApp: string | null;
  selectedState: string | null;
  version?: string;
  lastSaved?: number;
}

const STORAGE_KEY = 'design-option-app-state';
const STORAGE_BACKUP_KEY = 'design-option-app-state-backup';
const AUTOSAVE_DELAY = 500;
const CURRENT_DATA_VERSION = '1.0';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [appState, setAppState] = useState<AppState>({
    pages: [],
    currentPageId: '',
    agreedSolutions: {},
    selectedRelease: null,
    availableReleases: ['2025.1', '2025.2', '2026.1', '2026.2'],
    selectedTeam: null,
    selectedApp: null,
    selectedState: null,
    version: CURRENT_DATA_VERSION,
    lastSaved: Date.now()
  });

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [pageToDelete, setPageToDelete] = useState<string | null>(null);
  const [showCollaboration, setShowCollaboration] = useState(false);

  // Available options
  const availableApps = ['CAD', 'GO', 'Mapping', 'MDM', 'Mobile', 'Ops', 'Sched', 'SP'];
  const availableTeams = ['CAD Project Blue', 'Core CAD', 'MDM Suite Integration', 'Red Team', 'Spherical Cows'].sort();
  const availableStates = ['In Concept', 'In Design', 'In Development', 'Blocked', 'Released'];

  // Initialize app and cloud sync
  useEffect(() => {
    const initialize = async () => {
      try {
        loadFromStorage();
        const currentUser = await cloudSync.getCurrentUser();
        setUser(currentUser);

        if (currentUser && currentUser.email) {
          try {
            const cloudData = await cloudSync.syncFromCloud('default-project');
            if (cloudData && Object.keys(cloudData).length > 0) {
              setAppState(cloudData as AppState);
            }
          } catch (error) {
            console.error('Cloud sync error during initialization:', error);
            if (error.message?.includes('sign in again') || error.message?.includes('User not found')) {
              setUser(null);
            }
          }
        }
      } catch (error) {
        console.error('Initialization failed:', error);
      } finally {
        setIsInitializing(false);
      }
    };

    initialize();
  }, []);

  // Auto-save functionality
  const debouncedSave = useCallback(
    (() => {
      let timeoutId: NodeJS.Timeout;
      return (state: AppState) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(async () => {
          try {
            const isValid = validateAppState(state);
            if (!isValid) {
              console.warn('Invalid app state detected, skipping save');
              return;
            }

            saveToStorage(state);
            
            if (user && user.email) {
              cloudSync.syncToCloud(state, 'default-project').catch((error) => {
                console.error('Cloud sync error during auto-save:', error);
                if (error.message?.includes('sign in again') || error.message?.includes('User not found')) {
                  setUser(null);
                }
              });
            }
          } catch (error) {
            console.error('Auto-save failed:', error);
          }
        }, AUTOSAVE_DELAY);
      };
    })(),
    [user]
  );

  useEffect(() => {
    if (!isInitializing) {
      const stateWithTimestamp = { ...appState, lastSaved: Date.now() };
      debouncedSave(stateWithTimestamp);
    }
  }, [appState, debouncedSave, isInitializing]);

  const saveToStorage = (state: AppState) => {
    try {
      const currentState = localStorage.getItem(STORAGE_KEY);
      if (currentState) {
        localStorage.setItem(STORAGE_BACKUP_KEY, currentState);
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      console.error('Failed to save to localStorage:', error);
      toast.error('Failed to save data locally');
    }
  };

  const loadFromStorage = () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as AppState;
        
        if (parsed.version !== CURRENT_DATA_VERSION) {
          console.log('Migrating data from version', parsed.version, 'to', CURRENT_DATA_VERSION);
          parsed.version = CURRENT_DATA_VERSION;
        }
        
        setAppState(parsed);
        
        if (parsed.pages.length === 0) {
          createInitialFeaturePage(parsed);
        }
      } else {
        createInitialFeaturePage(appState);
      }
    } catch (error) {
      console.error('Failed to load from localStorage:', error);
      
      try {
        const backup = localStorage.getItem(STORAGE_BACKUP_KEY);
        if (backup) {
          const parsed = JSON.parse(backup) as AppState;
          setAppState(parsed);
          toast.warning('Loaded from backup due to corruption');
          return;
        }
      } catch (backupError) {
        console.error('Backup also corrupted:', backupError);
      }
      
      createInitialFeaturePage(appState);
      toast.error('Failed to load saved data, starting fresh');
    }
  };

  const createInitialFeaturePage = (currentState: AppState) => {
    const initialFeaturePage: FeaturePage = {
      id: 'feature-1',
      type: 'feature',
      image: null,
      title: 'New Design Feature',
      release: '2025.1',
      team: availableTeams[0],
      app: availableApps[0],
      state: availableStates[0]
    };

    const newState = {
      ...currentState,
      pages: [initialFeaturePage],
      currentPageId: initialFeaturePage.id
    };

    setAppState(newState);
  };

  const currentPage = appState.pages.find(page => page.id === appState.currentPageId);
  const currentFeaturePage = currentPage?.type === 'feature' ? currentPage : 
    appState.pages.find(page => page.id === (currentPage as VariantPage | AgreedSolutionPage)?.parentFeatureId) as FeaturePage | undefined;

  const validateAppState = (state: AppState): boolean => {
    try {
      return (
        state &&
        Array.isArray(state.pages) &&
        typeof state.currentPageId === 'string' &&
        typeof state.agreedSolutions === 'object' &&
        Array.isArray(state.availableReleases)
      );
    } catch {
      return false;
    }
  };

  const addFeature = async () => {
    const newFeatureId = `feature-${Date.now()}`;
    const newFeaturePage: FeaturePage = {
      id: newFeatureId,
      type: 'feature',
      image: null,
      title: 'New Design Feature',
      release: '2025.1',
      team: availableTeams[0],
      app: availableApps[0],
      state: availableStates[0]
    };

    setAppState(prev => ({
      ...prev,
      pages: [...prev.pages, newFeaturePage],
      currentPageId: newFeatureId
    }));
  };

  const addVariant = async (parentFeatureId: string) => {
    if (!parentFeatureId) return;
    
    const existingVariants = appState.pages.filter(page => 
      page.type === 'variant' && (page as VariantPage).parentFeatureId === parentFeatureId
    );
    
    const newVariantId = `variant-${parentFeatureId}-${Date.now()}`;
    const variantData = {
      title: `Variant ${existingVariants.length + 1}`,
      variantNumber: existingVariants.length + 1,
      minDevWorkWeeks: 1,
      maxDevWorkWeeks: 4,
      uiUxScore: 3,
      pros: ['Easy to implement', 'Low maintenance'],
      cons: ['Limited functionality'],
      image: null
    };

    const newVariantPage: VariantPage = {
      id: newVariantId,
      type: 'variant',
      parentFeatureId,
      data: variantData
    };

    setAppState(prev => ({
      ...prev,
      pages: [...prev.pages, newVariantPage],
      currentPageId: newVariantId
    }));
  };

  const addAgreedSolution = (parentFeatureId: string) => {
    if (!parentFeatureId) return;
    
    const newAgreedSolutionId = `agreed-solution-${parentFeatureId}`;
    const newAgreedSolutionPage: AgreedSolutionPage = {
      id: newAgreedSolutionId,
      type: 'agreed-solution',
      parentFeatureId
    };

    setAppState(prev => ({
      ...prev,
      pages: [...prev.pages, newAgreedSolutionPage],
      currentPageId: newAgreedSolutionId,
      agreedSolutions: {
        ...prev.agreedSolutions,
        [parentFeatureId]: newAgreedSolutionId
      }
    }));
  };

  const deletePage = (pageId: string) => {
    const pageToDelete = appState.pages.find(p => p.id === pageId);
    if (!pageToDelete) return;

    let pagesToRemove = [pageId];
    
    if (pageToDelete.type === 'feature') {
      const childPages = appState.pages.filter(page => 
        (page.type === 'variant' || page.type === 'agreed-solution') && 
        (page as VariantPage | AgreedSolutionPage).parentFeatureId === pageId
      );
      pagesToRemove = [pageId, ...childPages.map(p => p.id)];
    }

    const remainingPages = appState.pages.filter(page => !pagesToRemove.includes(page.id));
    
    let newCurrentPageId = appState.currentPageId;
    if (pagesToRemove.includes(appState.currentPageId)) {
      newCurrentPageId = remainingPages.length > 0 ? remainingPages[0].id : '';
    }

    const newAgreedSolutions = { ...appState.agreedSolutions };
    if (pageToDelete.type === 'feature') {
      delete newAgreedSolutions[pageId];
    }

    setAppState(prev => ({
      ...prev,
      pages: remainingPages,
      currentPageId: newCurrentPageId,
      agreedSolutions: newAgreedSolutions
    }));

    if (remainingPages.length === 0) {
      createInitialFeaturePage(appState);
    }
    
    setShowDeleteDialog(false);
    setPageToDelete(null);
  };

  const confirmDelete = (pageId: string) => {
    setPageToDelete(pageId);
    setShowDeleteDialog(true);
  };

  const navigateToPage = (pageId: string) => {
    setAppState(prev => ({
      ...prev,
      currentPageId: pageId
    }));
  };

  const updateCurrentPage = async (updates: Partial<FeaturePage | VariantPage>) => {
    const currentPage = appState.pages.find(page => page.id === appState.currentPageId);
    if (!currentPage) return;

    const updatedPage = { ...currentPage, ...updates };

    setAppState(prev => ({
      ...prev,
      pages: prev.pages.map(page => 
        page.id === appState.currentPageId 
          ? updatedPage
          : page
      )
    }));
  };

  const copyPageStructure = async () => {
    const structure = {
      pages: appState.pages,
      agreedSolutions: appState.agreedSolutions
    };
    
    try {
      await navigator.clipboard.writeText(JSON.stringify(structure, null, 2));
      toast.success('Page structure copied to clipboard');
    } catch (error) {
      console.error('Failed to copy:', error);
      toast.error('Failed to copy to clipboard');
    }
  };

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading Design Option Selection...</p>
        </div>
      </div>
    );
  }

  const renderCurrentPage = () => {
    if (!currentPage) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center">
            <p className="text-muted-foreground mb-4">No pages found</p>
            <Button onClick={addFeature}>
              <Plus className="w-4 h-4 mr-2" />
              Create First Feature
            </Button>
          </div>
        </div>
      );
    }

    switch (currentPage.type) {
      case 'feature':
        return (
          <FeatureTemplate
            key={currentPage.id}
            image={(currentPage as FeaturePage).image}
            release={(currentPage as FeaturePage).release}
            team={(currentPage as FeaturePage).team}
            app={(currentPage as FeaturePage).app}
            state={(currentPage as FeaturePage).state}
            availableReleases={appState.availableReleases}
            availableTeams={availableTeams}
            availableApps={availableApps}
            availableStates={availableStates}
            onImageUpdate={(image) => updateCurrentPage({ image })}
            onTitleUpdate={(title) => updateCurrentPage({ title })}
            onReleaseUpdate={(release) => {
              updateCurrentPage({ release });
              if (!appState.availableReleases.includes(release)) {
                setAppState(prev => ({
                  ...prev,
                  availableReleases: [...prev.availableReleases, release].sort()
                }));
              }
            }}
            onTeamUpdate={(team) => updateCurrentPage({ team })}
            onAppUpdate={(app) => updateCurrentPage({ app })}
            onStateUpdate={(state) => updateCurrentPage({ state })}
          />
        );
      
      case 'variant':
        return (
          <VariantTemplate
            key={currentPage.id}
            variantData={(currentPage as VariantPage).data}
            onUpdate={(data) => updateCurrentPage({ data })}
          />
        );
      
      case 'agreed-solution':
        const variants = appState.pages.filter(p => 
          p.type === 'variant' && (p as VariantPage).parentFeatureId === (currentPage as AgreedSolutionPage).parentFeatureId
        ) as VariantPage[];
        return (
          <AgreedSolutionTemplate
            key={currentPage.id}
            featureId={(currentPage as AgreedSolutionPage).parentFeatureId}
            variants={variants}
            agreedSolutionId={appState.agreedSolutions[(currentPage as AgreedSolutionPage).parentFeatureId] || null}
            onSelectAgreedSolution={(variantId) => {
              const parentId = (currentPage as AgreedSolutionPage).parentFeatureId;
              setAppState(prev => ({
                ...prev,
                agreedSolutions: {
                  ...prev.agreedSolutions,
                  [parentId]: variantId
                }
              }));
            }}
          />
        );
      
      default:
        return <div>Unknown page type</div>;
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      <Toaster />
      
      <NavigationSidebar
        appState={appState}
        setAppState={setAppState}
        availableTeams={availableTeams}
        availableApps={availableApps}
        availableStates={availableStates}
        onNavigateToPage={navigateToPage}
        onAddFeature={addFeature}
        onAddVariant={addVariant}
        onAddAgreedSolution={addAgreedSolution}
        onDeletePage={confirmDelete}
      />

      <div className="flex-1 flex flex-col">
        <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
          <div className="px-6 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <h1 className="text-xl font-semibold">Design Option Selection</h1>
                <CloudSyncStatus user={user} onUserChange={setUser} />
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowCollaboration(true)}
                >
                  <Users className="w-4 h-4 mr-2" />
                  Team
                </Button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Code className="w-4 h-4 mr-2" />
                      Actions
                      <ChevronDown className="w-4 h-4 ml-2" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={copyPageStructure}>
                      <Copy className="w-4 h-4 mr-2" />
                      Copy Structure
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-hidden">
          {renderCurrentPage()}
        </main>
      </div>

      <CollaborationPanel 
        projectId="default-project"
        isOpen={showCollaboration}
        onClose={() => setShowCollaboration(false)}
      />

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Page</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this page? This action cannot be undone.
              {pageToDelete && appState.pages.find(p => p.id === pageToDelete)?.type === 'feature' && 
                ' This will also delete all associated variants and agreed solutions.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => pageToDelete && deletePage(pageToDelete)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}