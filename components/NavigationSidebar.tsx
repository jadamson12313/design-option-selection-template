import { useState } from 'react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Plus, Settings, FileText, Layers, CheckCircle, Trash2, Filter } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

interface Page {
  id: string;
  type: 'feature' | 'variant' | 'agreed-solution';
  title?: string;
  parentFeatureId?: string;
}

interface AppState {
  pages: Page[];
  currentPageId: string;
  selectedRelease: string | null;
  selectedTeam: string | null;
  selectedApp: string | null;
  selectedState: string | null;
}

interface NavigationSidebarProps {
  appState: AppState;
  setAppState: (state: AppState) => void;
  availableTeams: string[];
  availableApps: string[];
  availableStates: string[];
  onNavigateToPage: (pageId: string) => void;
  onAddFeature: () => void;
  onAddVariant: (parentFeatureId: string) => void;
  onAddAgreedSolution: (parentFeatureId: string) => void;
  onDeletePage: (pageId: string) => void;
}

export function NavigationSidebar({
  appState,
  setAppState,
  availableTeams,
  availableApps,
  availableStates,
  onNavigateToPage,
  onAddFeature,
  onAddVariant,
  onAddAgreedSolution,
  onDeletePage
}: NavigationSidebarProps) {
  const [showFilters, setShowFilters] = useState(false);

  const featurePages = appState.pages.filter(p => p.type === 'feature');
  
  const getPageIcon = (type: string) => {
    switch (type) {
      case 'feature': return <FileText className="w-4 h-4" />;
      case 'variant': return <Layers className="w-4 h-4" />;
      case 'agreed-solution': return <CheckCircle className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const getVariants = (featureId: string) => 
    appState.pages.filter(p => p.type === 'variant' && p.parentFeatureId === featureId);

  const getAgreedSolution = (featureId: string) =>
    appState.pages.find(p => p.type === 'agreed-solution' && p.parentFeatureId === featureId);

  return (
    <aside className="w-80 border-r bg-background flex flex-col">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold">Pages</h2>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={onAddFeature}>
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="space-y-2">
            <Select
              value={appState.selectedRelease || ''}
              onValueChange={(value) => setAppState({
                ...appState,
                selectedRelease: value || null
              })}
            >
              <SelectTrigger className="h-8">
                <SelectValue placeholder="All Releases" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Releases</SelectItem>
                {appState.availableReleases?.map(release => (
                  <SelectItem key={release} value={release}>{release}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={appState.selectedTeam || ''}
              onValueChange={(value) => setAppState({
                ...appState,
                selectedTeam: value || null
              })}
            >
              <SelectTrigger className="h-8">
                <SelectValue placeholder="All Teams" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Teams</SelectItem>
                {availableTeams.map(team => (
                  <SelectItem key={team} value={team}>{team}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* Pages List */}
      <div className="flex-1 overflow-y-auto p-2">
        {featurePages.length === 0 ? (
          <div className="text-center p-8 text-muted-foreground">
            <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No pages yet</p>
            <Button
              variant="outline"
              size="sm"
              onClick={onAddFeature}
              className="mt-2"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Feature
            </Button>
          </div>
        ) : (
          <div className="space-y-1">
            {featurePages.map((feature) => {
              const variants = getVariants(feature.id);
              const agreedSolution = getAgreedSolution(feature.id);
              const isFeatureActive = appState.currentPageId === feature.id;

              return (
                <div key={feature.id} className="space-y-1">
                  {/* Feature */}
                  <div
                    className={`flex items-center gap-2 p-2 rounded-md cursor-pointer group hover:bg-accent ${
                      isFeatureActive ? 'bg-accent' : ''
                    }`}
                    onClick={() => onNavigateToPage(feature.id)}
                  >
                    {getPageIcon('feature')}
                    <span className="flex-1 text-sm truncate">
                      {feature.title || 'Untitled Feature'}
                    </span>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          onAddVariant(feature.id);
                        }}
                        className="h-6 w-6 p-0"
                      >
                        <Plus className="w-3 h-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeletePage(feature.id);
                        }}
                        className="h-6 w-6 p-0 text-destructive"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>

                  {/* Variants */}
                  {variants.map((variant) => {
                    const isVariantActive = appState.currentPageId === variant.id;
                    return (
                      <div
                        key={variant.id}
                        className={`flex items-center gap-2 p-2 pl-8 rounded-md cursor-pointer group hover:bg-accent ${
                          isVariantActive ? 'bg-accent' : ''
                        }`}
                        onClick={() => onNavigateToPage(variant.id)}
                      >
                        {getPageIcon('variant')}
                        <span className="flex-1 text-sm truncate">
                          {variant.title || 'Untitled Variant'}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeletePage(variant.id);
                          }}
                          className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 text-destructive"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    );
                  })}

                  {/* Agreed Solution */}
                  {agreedSolution && (
                    <div
                      className={`flex items-center gap-2 p-2 pl-8 rounded-md cursor-pointer hover:bg-accent ${
                        appState.currentPageId === agreedSolution.id ? 'bg-accent' : ''
                      }`}
                      onClick={() => onNavigateToPage(agreedSolution.id)}
                    >
                      {getPageIcon('agreed-solution')}
                      <span className="flex-1 text-sm">Agreed Solution</span>
                      <Badge variant="secondary" className="text-xs">
                        Final
                      </Badge>
                    </div>
                  )}

                  {/* Add Agreed Solution button */}
                  {variants.length > 0 && !agreedSolution && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onAddAgreedSolution(feature.id)}
                      className="w-full justify-start pl-8 h-8 text-xs text-muted-foreground"
                    >
                      <CheckCircle className="w-3 h-3 mr-2" />
                      Add Agreed Solution
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </aside>
  );
}