import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';

import { Separator } from './ui/separator';
import { CheckCircle, XCircle, Edit, Plus, Trash2, Save, X } from 'lucide-react';

interface DesignOptionData {
  title: string;
  synopsis: string;
  coreRequirements: string[];
  goal: string;
  painPoints: string[];
}

interface DesignOptionTemplateProps {
  onTitleUpdate?: (title: string) => void;
  release: string;
  team: string;
  app: string;
  state: string;
  availableReleases: string[];
  availableTeams: string[];
  availableApps: string[];
  availableStates: string[];
  onReleaseUpdate?: (release: string) => void;
  onTeamUpdate?: (team: string) => void;
  onAppUpdate?: (app: string) => void;
  onStateUpdate?: (state: string) => void;
}

// Color mappings for each category
const appColors = {
  'CAD': { 
    bg: 'bg-[#F38746]/10 dark:bg-[#F38746]/20', 
    text: 'text-[#C76A37] dark:text-[#F38746]', 
    border: 'border-[#F38746]/30 dark:border-[#F38746]/50' 
  },
  'GO': { 
    bg: 'bg-emerald-100 dark:bg-emerald-900/30', 
    text: 'text-emerald-700 dark:text-emerald-300', 
    border: 'border-emerald-200 dark:border-emerald-700' 
  },
  'Mapping': { 
    bg: 'bg-green-800/10 dark:bg-green-800/20', 
    text: 'text-green-800 dark:text-green-400', 
    border: 'border-green-800/30 dark:border-green-800/50' 
  },
  'MDM': { 
    bg: 'bg-purple-100 dark:bg-purple-900/30', 
    text: 'text-purple-800 dark:text-purple-200', 
    border: 'border-purple-200 dark:border-purple-700' 
  },
  'Mobile': { bg: 'bg-pink-100 dark:bg-pink-900/30', text: 'text-pink-800 dark:text-pink-200', border: 'border-pink-200 dark:border-pink-700' },
  'Ops': { 
    bg: 'bg-primary/10 dark:bg-primary/20', 
    text: 'text-primary dark:text-primary', 
    border: 'border-primary/30 dark:border-primary/50' 
  },
  'Sched': { bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-800 dark:text-yellow-200', border: 'border-yellow-200 dark:border-yellow-700' },
  'SP': { bg: 'bg-indigo-100 dark:bg-indigo-900/30', text: 'text-indigo-800 dark:text-indigo-200', border: 'border-indigo-200 dark:border-indigo-700' }
};

const teamColors = {
  'CAD Project Blue': { bg: 'bg-primary/10 dark:bg-primary/20', text: 'text-primary dark:text-primary', border: 'border-primary/30 dark:border-primary/50' },
  'Core CAD': { bg: 'bg-slate-100 dark:bg-slate-900/30', text: 'text-slate-800 dark:text-slate-200', border: 'border-slate-200 dark:border-slate-700' },
  'MDM Suite Integration': { bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-800 dark:text-orange-200', border: 'border-orange-200 dark:border-orange-700' },
  'Red Team': { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-800 dark:text-red-200', border: 'border-red-200 dark:border-red-700' },
  'Spherical Cows': { bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-800 dark:text-purple-200', border: 'border-purple-200 dark:border-purple-700' }
};

const stateColors = {
  'In Concept': { bg: 'bg-gray-100 dark:bg-gray-900/30', text: 'text-gray-800 dark:text-gray-200', border: 'border-gray-200 dark:border-gray-700' },
  'In Design': { bg: 'bg-primary/10 dark:bg-primary/20', text: 'text-primary dark:text-primary', border: 'border-primary/30 dark:border-primary/50' },
  'In Development': { bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-800 dark:text-yellow-200', border: 'border-yellow-200 dark:border-yellow-700' },
  'Blocked': { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-800 dark:text-red-200', border: 'border-red-200 dark:border-red-700' },
  'Released': { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-800 dark:text-green-200', border: 'border-green-200 dark:border-green-700' }
};

export default function DesignOptionTemplate({ onTitleUpdate, release, team, app, state, availableReleases, availableTeams, availableApps, availableStates, onReleaseUpdate, onTeamUpdate, onAppUpdate, onStateUpdate }: DesignOptionTemplateProps) {
  // Title editing state
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editTitleText, setEditTitleText] = useState('');

  // Synopsis editing state
  const [isEditingSynopsis, setIsEditingSynopsis] = useState(false);
  const [editSynopsisText, setEditSynopsisText] = useState('');

  // Core Requirements editing state
  const [isEditingRequirements, setIsEditingRequirements] = useState(false);
  const [editingRequirementIndex, setEditingRequirementIndex] = useState<number | null>(null);
  const [editRequirementText, setEditRequirementText] = useState('');
  const [newRequirementText, setNewRequirementText] = useState('');

  // Goal editing state
  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [editGoalText, setEditGoalText] = useState('');

  // Pain Points editing state
  const [isEditingPainPoints, setIsEditingPainPoints] = useState(false);
  const [editingPainPointIndex, setEditingPainPointIndex] = useState<number | null>(null);
  const [editPainPointText, setEditPainPointText] = useState('');
  const [newPainPointText, setNewPainPointText] = useState('');

  const [designOption, setDesignOption] = useState<DesignOptionData>({
    title: "Advanced Search Interface",
    synopsis: "A comprehensive search interface that allows users to filter, sort, and find content quickly with advanced filtering options and real-time suggestions.",
    coreRequirements: [
      "Real-time search suggestions",
      "Advanced filter options",
      "Sort functionality",
      "Mobile responsive design",
      "Accessibility compliance"
    ],
    goal: "Improve user experience by reducing time to find relevant content from 3 minutes to under 30 seconds, increasing user engagement by 40%.",
    painPoints: [
      "Current search is slow and inaccurate",
      "Users can't filter results effectively",
      "No search suggestions or autocomplete",
      "Mobile search experience is poor"
    ]
  });

  // Title handlers
  const handleEditTitle = () => {
    setEditTitleText(designOption.title);
    setIsEditingTitle(true);
  };

  const handleSaveTitle = () => {
    if (editTitleText.trim()) {
      const newTitle = editTitleText.trim();
      setDesignOption(prev => ({ ...prev, title: newTitle }));
      onTitleUpdate?.(newTitle);
      setIsEditingTitle(false);
      setEditTitleText('');
    }
  };

  const handleCancelEditTitle = () => {
    setIsEditingTitle(false);
    setEditTitleText('');
  };

  // Synopsis handlers
  const handleEditSynopsis = () => {
    setEditSynopsisText(designOption.synopsis);
    setIsEditingSynopsis(true);
  };

  const handleSaveSynopsis = () => {
    if (editSynopsisText.trim()) {
      setDesignOption(prev => ({ ...prev, synopsis: editSynopsisText.trim() }));
      setIsEditingSynopsis(false);
      setEditSynopsisText('');
    }
  };

  const handleCancelEditSynopsis = () => {
    setIsEditingSynopsis(false);
    setEditSynopsisText('');
  };

  // Core Requirements handlers
  const handleAddRequirement = () => {
    if (newRequirementText.trim()) {
      setDesignOption(prev => ({
        ...prev,
        coreRequirements: [...prev.coreRequirements, newRequirementText.trim()]
      }));
      setNewRequirementText('');
    }
  };

  const handleEditRequirement = (index: number) => {
    setEditingRequirementIndex(index);
    setEditRequirementText(designOption.coreRequirements[index]);
  };

  const handleSaveRequirement = () => {
    if (editingRequirementIndex !== null && editRequirementText.trim()) {
      const updatedRequirements = [...designOption.coreRequirements];
      updatedRequirements[editingRequirementIndex] = editRequirementText.trim();
      setDesignOption(prev => ({ ...prev, coreRequirements: updatedRequirements }));
      setEditingRequirementIndex(null);
      setEditRequirementText('');
    }
  };

  const handleCancelEditRequirement = () => {
    setEditingRequirementIndex(null);
    setEditRequirementText('');
  };

  const handleDeleteRequirement = (index: number) => {
    setDesignOption(prev => ({
      ...prev,
      coreRequirements: prev.coreRequirements.filter((_, i) => i !== index)
    }));
  };

  // Goal handlers
  const handleEditGoal = () => {
    setEditGoalText(designOption.goal);
    setIsEditingGoal(true);
  };

  const handleSaveGoal = () => {
    if (editGoalText.trim()) {
      setDesignOption(prev => ({ ...prev, goal: editGoalText.trim() }));
      setIsEditingGoal(false);
      setEditGoalText('');
    }
  };

  const handleCancelEditGoal = () => {
    setIsEditingGoal(false);
    setEditGoalText('');
  };

  // Pain Points handlers
  const handleAddPainPoint = () => {
    if (newPainPointText.trim()) {
      setDesignOption(prev => ({
        ...prev,
        painPoints: [...prev.painPoints, newPainPointText.trim()]
      }));
      setNewPainPointText('');
    }
  };

  const handleEditPainPoint = (index: number) => {
    setEditingPainPointIndex(index);
    setEditPainPointText(designOption.painPoints[index]);
  };

  const handleSavePainPoint = () => {
    if (editingPainPointIndex !== null && editPainPointText.trim()) {
      const updatedPainPoints = [...designOption.painPoints];
      updatedPainPoints[editingPainPointIndex] = editPainPointText.trim();
      setDesignOption(prev => ({ ...prev, painPoints: updatedPainPoints }));
      setEditingPainPointIndex(null);
      setEditPainPointText('');
    }
  };

  const handleCancelEditPainPoint = () => {
    setEditingPainPointIndex(null);
    setEditPainPointText('');
  };

  const handleDeletePainPoint = (index: number) => {
    setDesignOption(prev => ({
      ...prev,
      painPoints: prev.painPoints.filter((_, i) => i !== index)
    }));
  };

  // Tag handlers - simplified without editing states
  const handleAppChange = (selectedApp: string) => {
    onAppUpdate?.(selectedApp);
  };

  const handleReleaseChange = (newRelease: string) => {
    onReleaseUpdate?.(newRelease);
  };

  const handleTeamChange = (selectedTeam: string) => {
    onTeamUpdate?.(selectedTeam);
  };

  const handleStateChange = (selectedState: string) => {
    onStateUpdate?.(selectedState);
  };

  // Helper function to get colors for each category
  const getAppColors = (appName: string) => appColors[appName as keyof typeof appColors] || appColors['CAD'];
  const getTeamColors = (teamName: string) => teamColors[teamName as keyof typeof teamColors] || teamColors['Core CAD'];
  const getStateColors = (stateName: string) => stateColors[stateName as keyof typeof stateColors] || stateColors['In Concept'];

  return (
    <div className="w-full max-w-none mx-auto p-6 space-y-6">
      {/* Header Section */}
      <Card className="w-full">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          {isEditingTitle ? (
            <div className="flex-1 flex gap-2 items-center">
              <Input
                value={editTitleText}
                onChange={(e) => setEditTitleText(e.target.value)}
                className="flex-1 text-2xl"
                onKeyPress={(e) => e.key === 'Enter' && handleSaveTitle()}
              />
              <button
                onClick={handleSaveTitle}
                className="p-1 hover:bg-green-100 dark:hover:bg-green-900 rounded"
              >
                <Save className="w-4 h-4 text-green-600" />
              </button>
              <button
                onClick={handleCancelEditTitle}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
              >
                <X className="w-4 h-4 text-gray-600" />
              </button>
            </div>
          ) : (
            <>
              <CardTitle className="text-2xl">{designOption.title}</CardTitle>
              <button
                onClick={handleEditTitle}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors"
              >
                <Edit className="w-4 h-4" />
              </button>
            </>
          )}
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Tags Section - Direct Edit Layout */}
            <div className="w-full">
              <Label className="block mb-3">Tags</Label>
              
              <div className="flex flex-col gap-4">
                {/* Top row: Apps (far left), Team (far right) */}
                <div className="flex justify-between gap-4">
                  <div className="flex-1 max-w-xs">
                    <Label className="text-xs text-muted-foreground mb-1 block">App</Label>
                    <div className="relative">
                      <select
                        value={app}
                        onChange={(e) => handleAppChange(e.target.value)}
                        className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm hover:border-ring focus:border-ring focus:ring-1 focus:ring-ring transition-colors appearance-none cursor-pointer text-background"
                      >
                        {availableApps.map(availableApp => (
                          <option key={availableApp} value={availableApp} className="text-foreground bg-background">
                            {availableApp}
                          </option>
                        ))}
                      </select>
                      {/* Selected value display as tag */}
                      <div className={`absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none`}>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs whitespace-nowrap ${getAppColors(app).bg} ${getAppColors(app).text} ${getAppColors(app).border} border`}>
                          {app}
                        </span>
                      </div>
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex-1 max-w-xs">
                    <Label className="text-xs text-muted-foreground mb-1 block">Team</Label>
                    <div className="relative">
                      <select
                        value={team}
                        onChange={(e) => handleTeamChange(e.target.value)}
                        className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm hover:border-ring focus:border-ring focus:ring-1 focus:ring-ring transition-colors appearance-none cursor-pointer text-background"
                      >
                        {availableTeams.map(availableTeam => (
                          <option key={availableTeam} value={availableTeam} className="text-foreground bg-background">
                            {availableTeam}
                          </option>
                        ))}
                      </select>
                      {/* Selected value display as tag */}
                      <div className={`absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none`}>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs whitespace-nowrap ${getTeamColors(team).bg} ${getTeamColors(team).text} ${getTeamColors(team).border} border`}>
                          {team}
                        </span>
                      </div>
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Bottom row: Release (far left), State (far right) */}
                <div className="flex justify-between gap-4">
                  <div className="flex-1 max-w-xs">
                    <Label className="text-xs text-muted-foreground mb-1 block">Release</Label>
                    <Input
                      value={release}
                      onChange={(e) => handleReleaseChange(e.target.value)}
                      className="w-full"
                      placeholder="Enter release (e.g., 2026.1)"
                    />
                  </div>

                  <div className="flex-1 max-w-xs">
                    <Label className="text-xs text-muted-foreground mb-1 block">State</Label>
                    <div className="relative">
                      <select
                        value={state}
                        onChange={(e) => handleStateChange(e.target.value)}
                        className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm hover:border-ring focus:border-ring focus:ring-1 focus:ring-ring transition-colors appearance-none cursor-pointer text-background"
                      >
                        {availableStates.map(availableState => (
                          <option key={availableState} value={availableState} className="text-foreground bg-background">
                            {availableState}
                          </option>
                        ))}
                      </select>
                      {/* Selected value display as tag */}
                      <div className={`absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none`}>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs whitespace-nowrap ${getStateColors(state).bg} ${getStateColors(state).text} ${getStateColors(state).border} border`}>
                          {state}
                        </span>
                      </div>
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Synopsis</Label>
                {!isEditingSynopsis && (
                  <button
                    onClick={handleEditSynopsis}
                    className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
                  >
                    <Edit className="w-3 h-3" />
                  </button>
                )}
              </div>
              {isEditingSynopsis ? (
                <div className="space-y-2">
                  <Textarea
                    value={editSynopsisText}
                    onChange={(e) => setEditSynopsisText(e.target.value)}
                    className="min-h-20"
                    rows={3}
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleSaveSynopsis}
                      className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors"
                    >
                      <Save className="w-4 h-4" />
                    </button>
                    <button
                      onClick={handleCancelEditSynopsis}
                      className="px-3 py-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <p className="mt-2 text-muted-foreground leading-relaxed">
                  {designOption.synopsis}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Requirements and Goal */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle>Core Requirements</CardTitle>
            <button
              onClick={() => setIsEditingRequirements(!isEditingRequirements)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors"
            >
              <Edit className="w-4 h-4" />
            </button>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {designOption.coreRequirements.map((requirement, index) => (
                <div key={index} className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  {editingRequirementIndex === index ? (
                    <div className="flex-1 flex gap-2">
                      <Input
                        value={editRequirementText}
                        onChange={(e) => setEditRequirementText(e.target.value)}
                        className="flex-1"
                        onKeyPress={(e) => e.key === 'Enter' && handleSaveRequirement()}
                      />
                      <button
                        onClick={handleSaveRequirement}
                        className="p-1 hover:bg-green-100 dark:hover:bg-green-900 rounded"
                      >
                        <Save className="w-4 h-4 text-green-600" />
                      </button>
                      <button
                        onClick={handleCancelEditRequirement}
                        className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
                      >
                        <X className="w-4 h-4 text-gray-600" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex-1 flex items-start justify-between group">
                      <span className="text-sm flex-1">{requirement}</span>
                      {isEditingRequirements && (
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleEditRequirement(index)}
                            className="p-1 hover:bg-primary/10 dark:hover:bg-primary/20 rounded"
                          >
                            <Edit className="w-3 h-3 text-primary" />
                          </button>
                          <button
                            onClick={() => handleDeleteRequirement(index)}
                            className="p-1 hover:bg-red-100 dark:hover:bg-red-900 rounded"
                          >
                            <Trash2 className="w-3 h-3 text-red-600" />
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
              
              {isEditingRequirements && (
                <div className="flex items-center gap-2 mt-4 pt-2 border-t">
                  <Plus className="w-4 h-4 text-green-500 flex-shrink-0" />
                  <div className="flex-1 flex gap-2">
                    <Input
                      placeholder="Add new requirement..."
                      value={newRequirementText}
                      onChange={(e) => setNewRequirementText(e.target.value)}
                      className="flex-1"
                      onKeyPress={(e) => e.key === 'Enter' && handleAddRequirement()}
                    />
                    <button
                      onClick={handleAddRequirement}
                      disabled={!newRequirementText.trim()}
                      className="p-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-md transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle>Goal</CardTitle>
            {!isEditingGoal && (
              <button
                onClick={handleEditGoal}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors"
              >
                <Edit className="w-4 h-4" />
              </button>
            )}
          </CardHeader>
          <CardContent>
            {isEditingGoal ? (
              <div className="space-y-2">
                <Textarea
                  value={editGoalText}
                  onChange={(e) => setEditGoalText(e.target.value)}
                  className="min-h-20"
                  rows={3}
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleSaveGoal}
                    className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors"
                  >
                    <Save className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleCancelEditGoal}
                    className="px-3 py-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground leading-relaxed">
                {designOption.goal}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Pain Points */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle>Pain Points</CardTitle>
          <button
            onClick={() => setIsEditingPainPoints(!isEditingPainPoints)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors"
          >
            <Edit className="w-4 h-4" />
          </button>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {designOption.painPoints.map((painPoint, index) => (
              <div key={index} className="flex items-start gap-2">
                <XCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                {editingPainPointIndex === index ? (
                  <div className="flex-1 flex gap-2">
                    <Input
                      value={editPainPointText}
                      onChange={(e) => setEditPainPointText(e.target.value)}
                      className="flex-1"
                      onKeyPress={(e) => e.key === 'Enter' && handleSavePainPoint()}
                    />
                    <button
                      onClick={handleSavePainPoint}
                      className="p-1 hover:bg-green-100 dark:hover:bg-green-900 rounded"
                    >
                      <Save className="w-4 h-4 text-green-600" />
                    </button>
                    <button
                      onClick={handleCancelEditPainPoint}
                      className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
                    >
                      <X className="w-4 h-4 text-gray-600" />
                    </button>
                  </div>
                ) : (
                  <div className="flex-1 flex items-start justify-between group">
                    <span className="text-sm flex-1">{painPoint}</span>
                    {isEditingPainPoints && (
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleEditPainPoint(index)}
                          className="p-1 hover:bg-blue-100 dark:hover:bg-blue-900 rounded"
                        >
                          <Edit className="w-3 h-3 text-blue-600" />
                        </button>
                        <button
                          onClick={() => handleDeletePainPoint(index)}
                          className="p-1 hover:bg-red-100 dark:hover:bg-red-900 rounded"
                        >
                          <Trash2 className="w-3 h-3 text-red-600" />
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
            
            {isEditingPainPoints && (
              <div className="flex items-center gap-2 mt-4 pt-2 border-t">
                <Plus className="w-4 h-4 text-red-500 flex-shrink-0" />
                <div className="flex-1 flex gap-2">
                  <Input
                    placeholder="Add new pain point..."
                    value={newPainPointText}
                    onChange={(e) => setNewPainPointText(e.target.value)}
                    className="flex-1"
                    onKeyPress={(e) => e.key === 'Enter' && handleAddPainPoint()}
                  />
                  <button
                    onClick={handleAddPainPoint}
                    disabled={!newPainPointText.trim()}
                    className="p-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-md transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

    </div>
  );
}