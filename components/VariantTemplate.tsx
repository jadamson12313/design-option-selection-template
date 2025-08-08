import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';

import { CheckCircle, XCircle, Edit, Plus, Trash2, Save, X, Upload } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';

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

interface VariantTemplateProps {
  variantData: VariantData;
  onUpdate: (data: VariantData) => void;
  onTitleUpdate?: (title: string) => void;
}

export default function VariantTemplate({ variantData, onUpdate, onTitleUpdate }: VariantTemplateProps) {
  // Image state
  const [isImageHovered, setIsImageHovered] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Title editing state
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editTitleText, setEditTitleText] = useState('');

  // Pros editing state
  const [isEditingPros, setIsEditingPros] = useState(false);
  const [editingProIndex, setEditingProIndex] = useState<number | null>(null);
  const [editProText, setEditProText] = useState('');
  const [newProText, setNewProText] = useState('');

  // Cons editing state
  const [isEditingCons, setIsEditingCons] = useState(false);
  const [editingConIndex, setEditingConIndex] = useState<number | null>(null);
  const [editConText, setEditConText] = useState('');
  const [newConText, setNewConText] = useState('');

  const defaultImageSrc = "https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1920&q=80";

  // Function to resize image
  const resizeImage = (file: File, maxWidth: number, maxHeight: number): Promise<string> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        let { width, height } = img;
        const aspectRatio = width / height;

        if (width > height) {
          if (width > maxWidth) {
            width = maxWidth;
            height = width / aspectRatio;
          }
        } else {
          if (height > maxHeight) {
            height = maxHeight;
            width = height * aspectRatio;
          }
        }

        if (width > maxWidth) {
          width = maxWidth;
          height = width / aspectRatio;
        }
        if (height > maxHeight) {
          height = maxHeight;
          width = height * aspectRatio;
        }

        canvas.width = width;
        canvas.height = height;

        if (ctx) {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, width, height);
          ctx.drawImage(img, 0, 0, width, height);
        }

        resolve(canvas.toDataURL('image/jpeg', 0.9));
      };

      img.src = URL.createObjectURL(file);
    });
  };

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      try {
        const viewportWidth = window.innerWidth;
        const leftPanelWidth = viewportWidth >= 1280 ? viewportWidth * 0.4 : viewportWidth * 0.5;
        const maxHeight = window.innerHeight;
        
        const resizedImageDataUrl = await resizeImage(file, leftPanelWidth, maxHeight);
        onUpdate({ ...variantData, image: resizedImageDataUrl });
      } catch (error) {
        console.error('Error resizing image:', error);
        const reader = new FileReader();
        reader.onload = (e) => {
          onUpdate({ ...variantData, image: e.target?.result as string });
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const resetToDefaultImage = () => {
    onUpdate({ ...variantData, image: null });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Ensure we have valid data for the chart - always show at least 1 week
  const minWeeks = Math.max(Number(variantData.minDevWorkWeeks) || 1, 1);
  const maxWeeks = Math.max(Number(variantData.maxDevWorkWeeks) || minWeeks, minWeeks);

  const handleMinDevWeeksChange = (value: string) => {
    const weeks = Math.max(parseInt(value) || 0, 0); // Ensure non-negative
    // If min would exceed max, adjust max to equal min
    const currentMax = Number(variantData.maxDevWorkWeeks) || 0;
    const adjustedMaxWeeks = Math.max(weeks, currentMax);
    onUpdate({ 
      ...variantData, 
      minDevWorkWeeks: weeks, 
      maxDevWorkWeeks: adjustedMaxWeeks 
    });
  };

  const handleMaxDevWeeksChange = (value: string) => {
    const weeks = Math.max(parseInt(value) || 0, 0); // Ensure non-negative
    // If max would be less than min, adjust min to equal max
    const currentMin = Number(variantData.minDevWorkWeeks) || 0;
    const adjustedMinWeeks = Math.min(weeks, currentMin);
    onUpdate({ 
      ...variantData, 
      minDevWorkWeeks: adjustedMinWeeks, 
      maxDevWorkWeeks: weeks 
    });
  };

  const handleUiUxScoreChange = (newScore: number) => {
    onUpdate({ ...variantData, uiUxScore: newScore });
  };

  // Title handlers
  const handleEditTitle = () => {
    setEditTitleText(variantData.title);
    setIsEditingTitle(true);
  };

  const handleSaveTitle = () => {
    if (editTitleText.trim()) {
      const newTitle = editTitleText.trim();
      // Update the local variant data
      onUpdate({ ...variantData, title: newTitle });
      // Propagate title change to parent feature and all sibling variants
      onTitleUpdate?.(newTitle);
      setIsEditingTitle(false);
      setEditTitleText('');
    }
  };

  const handleCancelEditTitle = () => {
    setIsEditingTitle(false);
    setEditTitleText('');
  };

  // Pros handlers
  const handleAddPro = () => {
    if (newProText.trim()) {
      onUpdate({ ...variantData, pros: [...variantData.pros, newProText.trim()] });
      setNewProText('');
    }
  };

  const handleEditPro = (index: number) => {
    setEditingProIndex(index);
    setEditProText(variantData.pros[index]);
  };

  const handleSavePro = () => {
    if (editingProIndex !== null && editProText.trim()) {
      const updatedPros = [...variantData.pros];
      updatedPros[editingProIndex] = editProText.trim();
      onUpdate({ ...variantData, pros: updatedPros });
      setEditingProIndex(null);
      setEditProText('');
    }
  };

  const handleCancelEditPro = () => {
    setEditingProIndex(null);
    setEditProText('');
  };

  const handleDeletePro = (index: number) => {
    const updatedPros = variantData.pros.filter((_, i) => i !== index);
    onUpdate({ ...variantData, pros: updatedPros });
  };

  // Cons handlers
  const handleAddCon = () => {
    if (newConText.trim()) {
      onUpdate({ ...variantData, cons: [...variantData.cons, newConText.trim()] });
      setNewConText('');
    }
  };

  const handleEditCon = (index: number) => {
    setEditingConIndex(index);
    setEditConText(variantData.cons[index]);
  };

  const handleSaveCon = () => {
    if (editingConIndex !== null && editConText.trim()) {
      const updatedCons = [...variantData.cons];
      updatedCons[editingConIndex] = editConText.trim();
      onUpdate({ ...variantData, cons: updatedCons });
      setEditingConIndex(null);
      setEditConText('');
    }
  };

  const handleCancelEditCon = () => {
    setEditingConIndex(null);
    setEditConText('');
  };

  const handleDeleteCon = (index: number) => {
    const updatedCons = variantData.cons.filter((_, i) => i !== index);
    onUpdate({ ...variantData, cons: updatedCons });
  };

  const renderSmileyFaces = (score: number) => {
    const [hoveredFace, setHoveredFace] = useState<number | null>(null);
    const smileyFaces = ['🚨', '🔥', '😐', '🙂', '😁'];
    
    return (
      <div className="flex items-center gap-1">
        {Array.from({ length: 5 }, (_, index) => {
          const faceIndex = index + 1;
          const currentScore = hoveredFace !== null ? hoveredFace : score;
          const isActive = faceIndex <= currentScore;
          
          return (
            <span
              key={index}
              className={`text-2xl cursor-pointer transition-all duration-200 select-none ${
                isActive 
                  ? 'opacity-100 transform scale-110' 
                  : 'opacity-40 hover:opacity-70 hover:transform hover:scale-105'
              }`}
              onMouseEnter={() => setHoveredFace(faceIndex)}
              onMouseLeave={() => setHoveredFace(null)}
              onClick={() => handleUiUxScoreChange(faceIndex)}
              title={`${faceIndex}/5 - ${faceIndex === 1 ? 'This feature is wanted for war crimes' : faceIndex === 2 ? 'Burn it! Burn it with fire!' : faceIndex === 3 ? 'Meh' : faceIndex === 4 ? 'Niiiiiiiiice!' : 'Excellent!'}`}
            >
              {smileyFaces[index]}
            </span>
          );
        })}
      </div>
    );
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-5xl mx-auto py-6 px-6">
        {/* Header Image Section */}
        <div className="mb-8">
          <div 
            className="relative w-full h-64 cursor-pointer group rounded-lg overflow-hidden border bg-muted/20"
            onMouseEnter={() => setIsImageHovered(true)}
            onMouseLeave={() => setIsImageHovered(false)}
            onClick={handleImageClick}
          >
            <ImageWithFallback
              src={variantData.image || defaultImageSrc}
              alt={`${variantData.title} - Variant ${variantData.variantNumber}`}
              className="w-full h-full object-cover transition-all duration-200 group-hover:brightness-90"
            />
            
            <div className="absolute inset-0 bg-black/10"></div>
            
            {isImageHovered && (
              <div className="absolute inset-0 bg-black/20 flex items-center justify-center transition-all duration-200">
                <div className="bg-white/90 dark:bg-black/90 px-4 py-2 rounded-md flex items-center gap-2 shadow-lg">
                  <Upload className="w-4 h-4" />
                  <span className="text-sm">Click to upload image</span>
                </div>
              </div>
            )}

            {variantData.image && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  resetToDefaultImage();
                }}
                className="absolute top-4 right-4 bg-white/90 dark:bg-black/90 hover:bg-white dark:hover:bg-black p-2 rounded-md shadow-lg transition-colors"
                title="Reset to default image"
              >
                <Edit className="w-4 h-4" />
              </button>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>

        {/* Main Content */}
        <div className="space-y-6">
          {/* Title Section */}
          <Card>
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
                  <div>
                    <CardTitle className="text-2xl">{variantData.title}</CardTitle>
                    <p className="text-muted-foreground mt-1">Variant {variantData.variantNumber}</p>
                  </div>
                  <button
                    onClick={handleEditTitle}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                </>
              )}
            </CardHeader>
          </Card>

          {/* Development Work - Full Width */}
          <Card>
            <CardHeader>
              <CardTitle>Development Sprints</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-center gap-8">
                <div className="flex items-center gap-2">
                  <Label htmlFor="min-weeks" className="text-sm">Min:</Label>
                  <Input
                    id="min-weeks"
                    type="number"
                    value={variantData.minDevWorkWeeks}
                    onChange={(e) => handleMinDevWeeksChange(e.target.value)}
                    className="w-20"
                    min="0"
                    max={variantData.maxDevWorkWeeks || 52}
                    step="1"
                  />
                  <span className="text-xs text-muted-foreground">weeks</span>
                </div>
                <div className="flex items-center gap-2">
                  <Label htmlFor="max-weeks" className="text-sm">Max:</Label>
                  <Input
                    id="max-weeks"
                    type="number"
                    value={variantData.maxDevWorkWeeks}
                    onChange={(e) => handleMaxDevWeeksChange(e.target.value)}
                    className="w-20"
                    min={variantData.minDevWorkWeeks || 0}
                    max="52"
                    step="1"
                  />
                  <span className="text-xs text-muted-foreground">weeks</span>
                </div>
              </div>
              <div className="text-center text-sm text-muted-foreground">
                Development Time Range: {minWeeks}-{maxWeeks} weeks
              </div>
              <div className="relative w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md p-4">
                <div className="flex flex-col gap-2">
                  {/* Y-axis labels and bars */}
                  <div className="flex items-center gap-4">
                    <div className="w-10 text-right">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Min</span>
                    </div>
                    <div className="flex-1 relative">
                      <div className="flex items-center">
                        <div 
                          className="h-5 rounded-r-sm transition-all duration-300 ease-out"
                          style={{
                            backgroundColor: '#8E8E93',
                            width: `${Math.max((minWeeks / Math.max(maxWeeks, 12)) * 100, 8)}%`,
                            minWidth: '16px'
                          }}
                        />
                        <span 
                          className="ml-3 font-bold bg-white/90 dark:bg-gray-800/90 px-2 py-1 rounded shadow-sm"
                          style={{ fontSize: '23px', color: '#8E8E93' }}
                        >
                          {minWeeks}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="h-2" /> {/* 8px spacing */}
                  
                  <div className="flex items-center gap-4">
                    <div className="w-10 text-right">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Max</span>
                    </div>
                    <div className="flex-1 relative">
                      <div className="flex items-center">
                        <div 
                          className="h-5 rounded-r-sm transition-all duration-300 ease-out"
                          style={{
                            backgroundColor: '#F38746',
                            width: `${Math.max((maxWeeks / Math.max(maxWeeks, 12)) * 100, 8)}%`,
                            minWidth: '16px'
                          }}
                        />
                        <span 
                          className="ml-3 font-bold bg-white/90 dark:bg-gray-800/90 px-2 py-1 rounded shadow-sm"
                          style={{ fontSize: '23px', color: '#F38746' }}
                        >
                          {maxWeeks}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {/* X-axis reference lines (optional grid) */}
                  <div className="absolute inset-0 pointer-events-none opacity-20">
                    <div className="flex h-full items-center ml-14">
                      <div className="flex-1 relative h-full">
                        {Array.from({ length: Math.ceil(Math.max(maxWeeks, 12) / 4) + 1 }, (_, i) => i * 4).map(tick => (
                          <div 
                            key={tick}
                            className="absolute top-0 bottom-0 border-l border-gray-300 dark:border-gray-600"
                            style={{ left: `${(tick / Math.max(maxWeeks, 12)) * 100}%` }}
                          >
                            <span className="absolute bottom-1 -translate-x-1/2 text-xs text-gray-400">
                              {tick}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* UI/UX Score - Standalone */}
          <Card>
            <CardHeader>
              <CardTitle>UI/UX Score</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Customer Happiness (Click to rate)</Label>
                <div className="flex items-center gap-2 mt-2">
                  {renderSmileyFaces(variantData.uiUxScore)}
                  <span className="ml-2 text-lg">{variantData.uiUxScore}/5</span>
                </div>
              </div>
              <div className="mt-4">
                <Badge variant={variantData.uiUxScore >= 4 ? "default" : variantData.uiUxScore >= 3 ? "secondary" : "destructive"}>
                  {variantData.uiUxScore === 5 ? "Excellent!" : variantData.uiUxScore === 4 ? "Niiiiiiiiice!" : variantData.uiUxScore === 3 ? "Meh" : variantData.uiUxScore === 2 ? "Burn it! Burn it with fire!" : "This feature is wanted for war crimes"}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Pros and Cons */}
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <CardTitle className="text-green-700 dark:text-green-400">Pros</CardTitle>
                <button
                  onClick={() => setIsEditingPros(!isEditingPros)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors"
                >
                  <Edit className="w-4 h-4" />
                </button>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {variantData.pros.map((pro, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      {editingProIndex === index ? (
                        <div className="flex-1 flex gap-2">
                          <Input
                            value={editProText}
                            onChange={(e) => setEditProText(e.target.value)}
                            className="flex-1"
                            onKeyPress={(e) => e.key === 'Enter' && handleSavePro()}
                          />
                          <button
                            onClick={handleSavePro}
                            className="p-1 hover:bg-green-100 dark:hover:bg-green-900 rounded"
                          >
                            <Save className="w-4 h-4 text-green-600" />
                          </button>
                          <button
                            onClick={handleCancelEditPro}
                            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
                          >
                            <X className="w-4 h-4 text-gray-600" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex-1 flex items-start justify-between group">
                          <span className="text-sm flex-1">{pro}</span>
                          {isEditingPros && (
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => handleEditPro(index)}
                                className="p-1 hover:bg-primary/10 dark:hover:bg-primary/20 rounded"
                              >
                                <Edit className="w-3 h-3 text-primary" />
                              </button>
                              <button
                                onClick={() => handleDeletePro(index)}
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
                  
                  {isEditingPros && (
                    <div className="flex items-center gap-2 mt-4 pt-2 border-t">
                      <Plus className="w-4 h-4 text-green-500 flex-shrink-0" />
                      <div className="flex-1 flex gap-2">
                        <Input
                          placeholder="Add new pro..."
                          value={newProText}
                          onChange={(e) => setNewProText(e.target.value)}
                          className="flex-1"
                          onKeyPress={(e) => e.key === 'Enter' && handleAddPro()}
                        />
                        <button
                          onClick={handleAddPro}
                          disabled={!newProText.trim()}
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
                <CardTitle className="text-red-700 dark:text-red-400">Cons</CardTitle>
                <button
                  onClick={() => setIsEditingCons(!isEditingCons)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors"
                >
                  <Edit className="w-4 h-4" />
                </button>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {variantData.cons.map((con, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <XCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                      {editingConIndex === index ? (
                        <div className="flex-1 flex gap-2">
                          <Input
                            value={editConText}
                            onChange={(e) => setEditConText(e.target.value)}
                            className="flex-1"
                            onKeyPress={(e) => e.key === 'Enter' && handleSaveCon()}
                          />
                          <button
                            onClick={handleSaveCon}
                            className="p-1 hover:bg-green-100 dark:hover:bg-green-900 rounded"
                          >
                            <Save className="w-4 h-4 text-green-600" />
                          </button>
                          <button
                            onClick={handleCancelEditCon}
                            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
                          >
                            <X className="w-4 h-4 text-gray-600" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex-1 flex items-start justify-between group">
                          <span className="text-sm flex-1">{con}</span>
                          {isEditingCons && (
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => handleEditCon(index)}
                                className="p-1 hover:bg-primary/10 dark:hover:bg-primary/20 rounded"
                              >
                                <Edit className="w-3 h-3 text-primary" />
                              </button>
                              <button
                                onClick={() => handleDeleteCon(index)}
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
                  
                  {isEditingCons && (
                    <div className="flex items-center gap-2 mt-4 pt-2 border-t">
                      <Plus className="w-4 h-4 text-red-500 flex-shrink-0" />
                      <div className="flex-1 flex gap-2">
                        <Input
                          placeholder="Add new con..."
                          value={newConText}
                          onChange={(e) => setNewConText(e.target.value)}
                          className="flex-1"
                          onKeyPress={(e) => e.key === 'Enter' && handleAddCon()}
                        />
                        <button
                          onClick={handleAddCon}
                          disabled={!newConText.trim()}
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
        </div>
      </div>
    </div>
  );
}