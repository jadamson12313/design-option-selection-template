import { useState } from 'react';
import { Button } from './ui/button';
import { Separator } from './ui/separator';
import { ScrollArea } from './ui/scroll-area';
import { Badge } from './ui/badge';
import { 
  Layers, 
  GitBranch, 
  CheckCircle, 
  Plus, 
  X, 
  Filter, 
  ChevronDown,
  ChevronRight,
  Folder,
  FolderOpen,
  Code,
  Users,
  Monitor,
  Activity
} from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu';
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from './ui/context-menu';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';

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
}

interface NavigationSidebarProps {
  appState: AppState;
  setAppState: (updater: (prev: AppState) => AppState) => void;
  availableTeams: string[];
  availableApps: string[];
  availableStates: string[];
  onNavigateToPage: (pageId: string) => void;
  onAddFeature: () => void;
  onAddVariant: (featureId: string) => void;
  onAddAgreedSolution: (featureId: string) => void;
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
  const [expandedFeatures, setExpandedFeatures] = useState<Set<string>>(new Set());
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const toggleFeatureExpanded = (featureId: string) => {
    setExpandedFeatures(prev => {
      const newSet = new Set(prev);
      if (newSet.has(featureId)) {
        newSet.delete(featureId);
      } else {
        newSet.add(featureId);
      }
      return newSet;
    });
  };

  const getFilteredPages = () => {
    return appState.pages.filter(page => {
      if (page.type !== 'feature') return false;
      
      const featurePage = page as FeaturePage;
      
      if (appState.selectedRelease && featurePage.release !== appState.selectedRelease) return false;
      if (appState.selectedTeam && featurePage.team !== appState.selectedTeam) return false;
      if (appState.selectedApp && featurePage.app !== appState.selectedApp) return false;
      if (appState.selectedState && featurePage.state !== appState.selectedState) return false;
      
      return true;
    });
  };

  const getFeatureVariants = (featureId: string) => {
    return appState.pages.filter(page => 
      page.type === 'variant' && (page as VariantPage).parentFeatureId === featureId
    ) as VariantPage[];
  };

  const getFeatureAgreedSolution = (featureId: string) => {
    return appState.pages.find(page => 
      page.type === 'agreed-solution' && (page as AgreedSolutionPage).parentFeatureId === featureId
    ) as AgreedSolutionPage | undefined;
  };

  const getStateColor = (state: string) => {
    const colors = {
      'In Concept': 'bg-gray-100 text-gray-800',
      'In Design': 'bg-primary/10 text-primary',
      'In Development': 'bg-yellow-100 text-yellow-800',
      'Blocked': 'bg-red-100 text-red-800',
      'Released': 'bg-green-100 text-green-800'
    };
    return colors[state as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const filterIcons = {
    release: Code,
    team: Users,
    app: Monitor,
    state: Activity
  };

  const getActiveFilters = () => {
    const filters = [];
    if (appState.selectedRelease) filters.push({ type: 'release', icon: filterIcons.release });
    if (appState.selectedTeam) filters.push({ type: 'team', icon: filterIcons.team });
    if (appState.selectedApp) filters.push({ type: 'app', icon: filterIcons.app });
    if (appState.selectedState) filters.push({ type: 'state', icon: filterIcons.state });
    return filters;
  };

  const activeFilters = getActiveFilters();
  const totalFilters = 4; // Release, Team, App, State

  const filteredFeatures = getFilteredPages() as FeaturePage[];

  return (
    <TooltipProvider>
      <div className="w-[450px] border-r bg-muted/30 flex flex-col h-screen">
        {/* Sidebar Header */}
        <div className="p-4 border-b">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold">Design Options</h2>
            <Button onClick={onAddFeature} size="sm">
              <Plus className="w-4 h-4 mr-1" />
              Feature
            </Button>
          </div>

          {/* Filter Controls */}
          <DropdownMenu open={isFilterOpen} onOpenChange={setIsFilterOpen}>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="w-full justify-between">
                <div className="flex items-center">
                  <Filter className="w-4 h-4 mr-2" />
                  Filter
                  {activeFilters.length > 0 && (
                    <div className="flex items-center ml-2 gap-1">
                      {activeFilters.map((filter, index) => {
                        const IconComponent = filter.icon;
                        return (
                          <IconComponent key={filter.type} className="w-3 h-3 text-primary" />
                        );
                      })}
                      <span className="ml-1 text-xs text-muted-foreground">
                        {activeFilters.length}/{totalFilters}
                      </span>
                    </div>
                  )}
                </div>
                <ChevronDown className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-72">
              <div className="p-3 space-y-3">
                {/* Release Filter */}
                <div>
                  <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                    <Code className="w-3 h-3" />
                    Release
                  </label>
                  <select 
                    className="w-full mt-1 p-2 border rounded text-sm"
                    value={appState.selectedRelease || ''}
                    onChange={(e) => setAppState(prev => ({ ...prev, selectedRelease: e.target.value || null }))}
                  >
                    <option value="">All Releases</option>
                    {appState.availableReleases.map(release => (
                      <option key={release} value={release}>{release}</option>
                    ))}
                  </select>
                </div>
                
                {/* Team Filter */}
                <div>
                  <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    Team
                  </label>
                  <select 
                    className="w-full mt-1 p-2 border rounded text-sm"
                    value={appState.selectedTeam || ''}
                    onChange={(e) => setAppState(prev => ({ ...prev, selectedTeam: e.target.value || null }))}
                  >
                    <option value="">All Teams</option>
                    {availableTeams.map(team => (
                      <option key={team} value={team}>{team}</option>
                    ))}
                  </select>
                </div>
                
                {/* App Filter */}
                <div>
                  <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                    <Monitor className="w-3 h-3" />
                    App
                  </label>
                  <select 
                    className="w-full mt-1 p-2 border rounded text-sm"
                    value={appState.selectedApp || ''}
                    onChange={(e) => setAppState(prev => ({ ...prev, selectedApp: e.target.value || null }))}
                  >
                    <option value="">All Apps</option>
                    {availableApps.map(app => (
                      <option key={app} value={app}>{app}</option>
                    ))}
                  </select>
                </div>
                
                {/* State Filter */}
                <div>
                  <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                    <Activity className="w-3 h-3" />
                    State
                  </label>
                  <select 
                    className="w-full mt-1 p-2 border rounded text-sm"
                    value={appState.selectedState || ''}
                    onChange={(e) => setAppState(prev => ({ ...prev, selectedState: e.target.value || null }))}
                  >
                    <option value="">All States</option>
                    {availableStates.map(state => (
                      <option key={state} value={state}>{state}</option>
                    ))}
                  </select>
                </div>
                
                {/* Clear filters */}
                {(appState.selectedRelease || appState.selectedTeam || appState.selectedApp || appState.selectedState) && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="w-full"
                    onClick={() => setAppState(prev => ({
                      ...prev,
                      selectedRelease: null,
                      selectedTeam: null,
                      selectedApp: null,
                      selectedState: null
                    }))}
                  >
                    Clear All Filters
                  </Button>
                )}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Navigation Tree */}
        <ScrollArea className="flex-1">
          <div className="p-2">
            {filteredFeatures.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Layers className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No features found</p>
                <Button onClick={onAddFeature} variant="outline" size="sm" className="mt-2">
                  <Plus className="w-4 h-4 mr-1" />
                  Add Feature
                </Button>
              </div>
            ) : (
              <div className="space-y-1">
                {filteredFeatures.map((feature) => {
                  const variants = getFeatureVariants(feature.id);
                  const agreedSolution = getFeatureAgreedSolution(feature.id);
                  const isExpanded = expandedFeatures.has(feature.id);
                  const hasChildren = variants.length > 0 || agreedSolution;
                  const isSelected = feature.id === appState.currentPageId;

                  return (
                    <div key={feature.id} className="space-y-1">
                      {/* Feature Node */}
                      <ContextMenu>
                        <ContextMenuTrigger asChild>
                          <div className={`group flex items-center gap-1 p-2 rounded-md transition-colors ${
                            isSelected ? 'bg-[#E6E6E6] text-foreground' : 'hover:bg-[#F0F0F0]'
                          }`}>
                            {/* Expand/Collapse Button */}
                            {hasChildren ? (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="w-4 h-4 p-0 hover:bg-transparent"
                                onClick={() => toggleFeatureExpanded(feature.id)}
                              >
                                {isExpanded ? (
                                  <ChevronDown className="w-3 h-3" />
                                ) : (
                                  <ChevronRight className="w-3 h-3" />
                                )}
                              </Button>
                            ) : (
                              <div className="w-4" />
                            )}

                            {/* Feature Icon */}
                            <div className="flex-shrink-0">
                              {isExpanded ? (
                                <FolderOpen className="w-4 h-4" />
                              ) : (
                                <Folder className="w-4 h-4" />
                              )}
                            </div>

                            {/* Feature Content and Actions Container */}
                            <div className="flex-1 min-w-0 flex items-center">
                              <div 
                                className="flex-1 min-w-0 cursor-pointer"
                                onClick={() => onNavigateToPage(feature.id)}
                              >
                                <div className="flex items-center justify-between">
                                  <span className="text-sm font-medium truncate">
                                    {feature.title || 'Untitled Feature'}
                                  </span>
                                  <div className="flex items-center gap-1 ml-2">
                                    <Badge variant="secondary" className={`text-xs ${getStateColor(feature.state)}`}>
                                      {feature.state}
                                    </Badge>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                                  <span>{feature.app}</span>
                                  <span>•</span>
                                  <span>{feature.team}</span>
                                  <span>•</span>
                                  <span>{feature.release}</span>
                                </div>
                              </div>

                              {/* Actions */}
                              <div className="flex items-center gap-1 ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="w-6 h-6 p-0 hover:bg-white/20"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        onAddFeature();
                                      }}
                                    >
                                      <Plus className="w-3 h-3" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Add Feature</p>
                                  </TooltipContent>
                                </Tooltip>
                                
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="w-6 h-6 p-0 hover:bg-white/20"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        onAddVariant(feature.id);
                                      }}
                                    >
                                      <GitBranch className="w-3 h-3" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Add Variant</p>
                                  </TooltipContent>
                                </Tooltip>
                                
                                {!agreedSolution && (
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="w-6 h-6 p-0 hover:bg-white/20"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          onAddAgreedSolution(feature.id);
                                        }}
                                      >
                                        <CheckCircle className="w-3 h-3" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Add Agreed Solution</p>
                                    </TooltipContent>
                                  </Tooltip>
                                )}
                              </div>
                            </div>
                          </div>
                        </ContextMenuTrigger>
                        <ContextMenuContent>
                          <ContextMenuItem onClick={onAddFeature}>
                            <Plus className="w-4 h-4 mr-2" />
                            Add Feature
                          </ContextMenuItem>
                          <ContextMenuItem onClick={() => onAddVariant(feature.id)}>
                            <GitBranch className="w-4 h-4 mr-2" />
                            Add Variant
                          </ContextMenuItem>
                          {!agreedSolution && (
                            <ContextMenuItem onClick={() => onAddAgreedSolution(feature.id)}>
                              <CheckCircle className="w-4 h-4 mr-2" />
                              Add Agreed Solution
                            </ContextMenuItem>
                          )}
                        </ContextMenuContent>
                      </ContextMenu>

                      {/* Children (Variants and Agreed Solution) */}
                      {isExpanded && hasChildren && (
                        <div className="ml-5 space-y-1">
                          {/* Variants */}
                          {variants.map((variant) => {
                            const isVariantSelected = variant.id === appState.currentPageId;
                            return (
                              <ContextMenu key={variant.id}>
                                <ContextMenuTrigger asChild>
                                  <div
                                    className={`group flex items-center gap-2 p-2 rounded-md cursor-pointer transition-colors ${
                                      isVariantSelected ? 'bg-[#E6E6E6] text-foreground' : 'hover:bg-[#F0F0F0]'
                                    }`}
                                    onClick={() => onNavigateToPage(variant.id)}
                                  >
                                    <GitBranch className="w-3 h-3 flex-shrink-0" />
                                    
                                    <div className="flex-1 min-w-0 flex items-center">
                                      <span className="text-sm flex-1 truncate">
                                        {variant.data.title}
                                      </span>
                                      
                                      <div className="flex items-center gap-2 ml-2 text-xs text-muted-foreground">
                                        <span>{variant.data.minDevWorkWeeks}-{variant.data.maxDevWorkWeeks}w</span>
                                        <span>•</span>
                                        <span>UI: {variant.data.uiUxScore}/5</span>
                                      </div>
                                      
                                      <div className="flex items-center gap-1 ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <Button
                                              variant="ghost"
                                              size="sm"
                                              className="w-5 h-5 p-0 hover:bg-white/20"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                onAddFeature();
                                              }}
                                            >
                                              <Plus className="w-2.5 h-2.5" />
                                            </Button>
                                          </TooltipTrigger>
                                          <TooltipContent>
                                            <p>Add Feature</p>
                                          </TooltipContent>
                                        </Tooltip>
                                        
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <Button
                                              variant="ghost"
                                              size="sm"
                                              className="w-5 h-5 p-0 hover:bg-white/20"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                onAddVariant(variant.parentFeatureId);
                                              }}
                                            >
                                              <GitBranch className="w-2.5 h-2.5" />
                                            </Button>
                                          </TooltipTrigger>
                                          <TooltipContent>
                                            <p>Add Variant</p>
                                          </TooltipContent>
                                        </Tooltip>
                                        
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <Button
                                              variant="ghost"
                                              size="sm"
                                              className="w-5 h-5 p-0 hover:bg-white/20"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                onAddAgreedSolution(variant.parentFeatureId);
                                              }}
                                            >
                                              <CheckCircle className="w-2.5 h-2.5" />
                                            </Button>
                                          </TooltipTrigger>
                                          <TooltipContent>
                                            <p>Add Agreed Solution</p>
                                          </TooltipContent>
                                        </Tooltip>
                                      </div>
                                    </div>
                                  </div>
                                </ContextMenuTrigger>
                                <ContextMenuContent>
                                  <ContextMenuItem onClick={onAddFeature}>
                                    <Plus className="w-4 h-4 mr-2" />
                                    Add Feature
                                  </ContextMenuItem>
                                  <ContextMenuItem onClick={() => onAddVariant(variant.parentFeatureId)}>
                                    <GitBranch className="w-4 h-4 mr-2" />
                                    Add Variant
                                  </ContextMenuItem>
                                  <ContextMenuItem onClick={() => onAddAgreedSolution(variant.parentFeatureId)}>
                                    <CheckCircle className="w-4 h-4 mr-2" />
                                    Add Agreed Solution
                                  </ContextMenuItem>
                                </ContextMenuContent>
                              </ContextMenu>
                            );
                          })}

                          {/* Agreed Solution */}
                          {agreedSolution && (
                            <ContextMenu>
                              <ContextMenuTrigger asChild>
                                <div
                                  className={`group flex items-center gap-2 p-2 rounded-md cursor-pointer transition-colors ${
                                    agreedSolution.id === appState.currentPageId 
                                      ? 'bg-[#E6E6E6] text-foreground' 
                                      : 'hover:bg-[#F0F0F0]'
                                  }`}
                                  onClick={() => onNavigateToPage(agreedSolution.id)}
                                >
                                  <CheckCircle className="w-3 h-3 flex-shrink-0 text-green-600" />
                                  
                                  <div className="flex-1 min-w-0 flex items-center">
                                    <span className="text-sm flex-1">Agreed Solution</span>
                                    
                                    <div className="flex items-center gap-1 ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            className="w-5 h-5 p-0 hover:bg-white/20"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              onAddFeature();
                                            }}
                                          >
                                            <Plus className="w-2.5 h-2.5" />
                                          </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                          <p>Add Feature</p>
                                        </TooltipContent>
                                      </Tooltip>
                                      
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            className="w-5 h-5 p-0 hover:bg-white/20"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              onAddVariant(agreedSolution.parentFeatureId);
                                            }}
                                          >
                                            <GitBranch className="w-2.5 h-2.5" />
                                          </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                          <p>Add Variant</p>
                                        </TooltipContent>
                                      </Tooltip>
                                      
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            className="w-5 h-5 p-0 hover:bg-white/20"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              onAddAgreedSolution(agreedSolution.parentFeatureId);
                                            }}
                                          >
                                            <CheckCircle className="w-2.5 h-2.5" />
                                          </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                          <p>Add Agreed Solution</p>
                                        </TooltipContent>
                                      </Tooltip>
                                    </div>
                                  </div>
                                </div>
                              </ContextMenuTrigger>
                              <ContextMenuContent>
                                <ContextMenuItem onClick={onAddFeature}>
                                  <Plus className="w-4 h-4 mr-2" />
                                  Add Feature
                                </ContextMenuItem>
                                <ContextMenuItem onClick={() => onAddVariant(agreedSolution.parentFeatureId)}>
                                  <GitBranch className="w-4 h-4 mr-2" />
                                  Add Variant
                                </ContextMenuItem>
                                <ContextMenuItem onClick={() => onAddAgreedSolution(agreedSolution.parentFeatureId)}>
                                  <CheckCircle className="w-4 h-4 mr-2" />
                                  Add Agreed Solution
                                </ContextMenuItem>
                              </ContextMenuContent>
                            </ContextMenu>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    </TooltipProvider>
  );
}