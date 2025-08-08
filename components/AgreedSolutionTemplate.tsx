import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';

import { CheckCircle, XCircle, Check } from 'lucide-react';
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

interface VariantPage {
  id: string;
  type: 'variant';
  parentFeatureId: string;
  data: VariantData;
}

interface AgreedSolutionTemplateProps {
  featureId: string;
  variants: VariantPage[];
  agreedSolutionId: string | null;
  onSelectAgreedSolution: (variantId: string | null) => void;
}

export default function AgreedSolutionTemplate({ 
  featureId, 
  variants, 
  agreedSolutionId, 
  onSelectAgreedSolution 
}: AgreedSolutionTemplateProps) {
  const defaultImageSrc = "https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1920&q=80";

  const renderSmileyFaces = (score: number) => {
    const smileyFaces = ['🚨', '🔥', '😐', '🙂', '😁'];
    
    return (
      <div className="flex items-center gap-1">
        {Array.from({ length: 5 }, (_, index) => {
          const faceIndex = index + 1;
          const isActive = faceIndex <= score;
          
          return (
            <span
              key={index}
              className={`text-lg select-none ${
                isActive 
                  ? 'opacity-100' 
                  : 'opacity-30'
              }`}
              title={`${faceIndex}/5 - ${faceIndex === 1 ? 'This feature is wanted for war crimes' : faceIndex === 2 ? 'Burn it! Burn it with fire!' : faceIndex === 3 ? 'Meh' : faceIndex === 4 ? 'Niiiiiiiiice!' : 'Excellent!'}`}
            >
              {smileyFaces[index]}
            </span>
          );
        })}
      </div>
    );
  };

  const handleSelectVariant = (variantId: string) => {
    if (agreedSolutionId === variantId) {
      // If clicking the already selected variant, deselect it
      onSelectAgreedSolution(null);
    } else {
      // Select the new variant
      onSelectAgreedSolution(variantId);
    }
  };

  if (variants.length === 0) {
    return (
      <div className="h-full overflow-y-auto">
        <div className="max-w-5xl mx-auto py-6 px-6">
          <div className="mb-8 text-center">
            <h1 className="text-3xl mb-2">Agreed Solution</h1>
            <p className="text-muted-foreground">
              No variants available for this feature. Create variants to select an agreed solution.
            </p>
          </div>
          
          <div className="flex items-center justify-center py-16">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-muted rounded-full flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg mb-2">No Variants Yet</h3>
              <p className="text-muted-foreground">
                Add variants to this feature to compare and select an agreed solution.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-7xl mx-auto py-6 px-6">
        <div className="mb-8 text-center">
          <h1 className="text-3xl mb-2">Agreed Solution</h1>
          <p className="text-muted-foreground">
            Compare all variants and select the agreed solution for this feature
          </p>
        </div>

          {agreedSolutionId && (
            <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <div className="flex items-center gap-2">
                <Check className="w-5 h-5 text-green-600" />
                <span className="text-green-800 dark:text-green-200">
                  Agreed Solution Selected: {variants.find(v => v.id === agreedSolutionId)?.data.title} - Variant {variants.find(v => v.id === agreedSolutionId)?.data.variantNumber}
                </span>
              </div>
            </div>
          )}

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {variants.map((variant) => {
              const isSelected = agreedSolutionId === variant.id;
              // Ensure we have valid data for the chart - always show at least 1 week
              const minWeeks = Math.max(Number(variant.data.minDevWorkWeeks) || 1, 1);
              const maxWeeks = Math.max(Number(variant.data.maxDevWorkWeeks) || minWeeks, minWeeks);

              return (
                <Card 
                  key={variant.id} 
                  className={`relative cursor-pointer transition-all duration-200 hover:shadow-lg ${
                    isSelected 
                      ? 'ring-2 ring-green-500 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' 
                      : 'hover:shadow-md'
                  }`}
                  onClick={() => handleSelectVariant(variant.id)}
                >
                  {isSelected && (
                    <div className="absolute top-3 right-3 z-10">
                      <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                        <Check className="w-4 h-4 text-white" />
                      </div>
                    </div>
                  )}

                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg">{variant.data.title}</CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">
                          Variant {variant.data.variantNumber}
                        </p>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {/* Image */}
                    <div className="aspect-video relative rounded-md overflow-hidden bg-gray-100 dark:bg-gray-800">
                      <ImageWithFallback
                        src={variant.data.image || defaultImageSrc}
                        alt={`${variant.data.title} - Variant ${variant.data.variantNumber}`}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {/* Development Sprints Chart */}
                    <div>
                      <h4 className="text-sm mb-2">Development Sprints: {minWeeks}-{maxWeeks} weeks</h4>
                      <div className="relative w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-sm p-3">
                        <div className="flex flex-col gap-2">
                          {/* Y-axis labels and bars */}
                          <div className="flex items-center gap-3">
                            <div className="w-8 text-right">
                              <span className="text-xs text-gray-600 dark:text-gray-400">Min</span>
                            </div>
                            <div className="flex-1 relative">
                              <div className="flex items-center">
                                <div 
                                  className="h-5 rounded-r-sm transition-all duration-300 ease-out"
                                  style={{
                                    backgroundColor: '#8E8E93',
                                    width: `${Math.max((minWeeks / Math.max(maxWeeks, 10)) * 100, 8)}%`,
                                    minWidth: '12px'
                                  }}
                                />
                                <span 
                                  className="ml-2 font-bold bg-white/95 dark:bg-gray-800/95 px-1.5 py-0.5 rounded shadow-sm"
                                  style={{ fontSize: '23px', color: '#8E8E93' }}
                                >
                                  {minWeeks}
                                </span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="h-2" /> {/* 8px spacing */}
                          
                          <div className="flex items-center gap-3">
                            <div className="w-8 text-right">
                              <span className="text-xs text-gray-600 dark:text-gray-400">Max</span>
                            </div>
                            <div className="flex-1 relative">
                              <div className="flex items-center">
                                <div 
                                  className="h-5 rounded-r-sm transition-all duration-300 ease-out"
                                  style={{
                                    backgroundColor: '#F38746',
                                    width: `${Math.max((maxWeeks / Math.max(maxWeeks, 10)) * 100, 8)}%`,
                                    minWidth: '12px'
                                  }}
                                />
                                <span 
                                  className="ml-2 font-bold bg-white/95 dark:bg-gray-800/95 px-1.5 py-0.5 rounded shadow-sm"
                                  style={{ fontSize: '23px', color: '#F38746' }}
                                >
                                  {maxWeeks}
                                </span>
                              </div>
                            </div>
                          </div>
                          
                          {/* X-axis reference lines (optional grid) */}
                          <div className="absolute inset-0 pointer-events-none opacity-15">
                            <div className="flex h-full items-center ml-11">
                              <div className="flex-1 relative h-full">
                                {Array.from({ length: Math.ceil(Math.max(maxWeeks, 10) / 2) + 1 }, (_, i) => i * 2).map(tick => (
                                  <div 
                                    key={tick}
                                    className="absolute top-0 bottom-0 border-l border-gray-300 dark:border-gray-600"
                                    style={{ left: `${(tick / Math.max(maxWeeks, 10)) * 100}%` }}
                                  >
                                    {tick > 0 && (
                                      <span className="absolute bottom-0 -translate-x-1/2 text-xs text-gray-400">
                                        {tick}
                                      </span>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* UI/UX Score */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm">UI/UX Score</h4>
                        <span className="text-sm">{variant.data.uiUxScore}/5</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {renderSmileyFaces(variant.data.uiUxScore)}
                        <Badge 
                          variant={variant.data.uiUxScore >= 4 ? "default" : variant.data.uiUxScore >= 3 ? "secondary" : "destructive"}
                          className="text-xs"
                        >
                          {variant.data.uiUxScore === 5 ? "Excellent!" : variant.data.uiUxScore === 4 ? "Niiiiiiiiice!" : variant.data.uiUxScore === 3 ? "Meh" : variant.data.uiUxScore === 2 ? "Burn it! Burn it with fire!" : "This feature is wanted for war crimes"}
                        </Badge>
                      </div>
                    </div>

                    {/* Pros */}
                    <div>
                      <h4 className="text-sm mb-2 text-green-700 dark:text-green-400">
                        Pros ({variant.data.pros.length})
                      </h4>
                      <div className="space-y-1 max-h-24 overflow-y-auto">
                        {variant.data.pros.slice(0, 3).map((pro, index) => (
                          <div key={index} className="flex items-start gap-2">
                            <CheckCircle className="w-3 h-3 text-green-500 mt-0.5 flex-shrink-0" />
                            <span className="text-xs text-muted-foreground">{pro}</span>
                          </div>
                        ))}
                        {variant.data.pros.length > 3 && (
                          <p className="text-xs text-muted-foreground italic">
                            +{variant.data.pros.length - 3} more...
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Cons */}
                    <div>
                      <h4 className="text-sm mb-2 text-red-700 dark:text-red-400">
                        Cons ({variant.data.cons.length})
                      </h4>
                      <div className="space-y-1 max-h-24 overflow-y-auto">
                        {variant.data.cons.slice(0, 3).map((con, index) => (
                          <div key={index} className="flex items-start gap-2">
                            <XCircle className="w-3 h-3 text-red-500 mt-0.5 flex-shrink-0" />
                            <span className="text-xs text-muted-foreground">{con}</span>
                          </div>
                        ))}
                        {variant.data.cons.length > 3 && (
                          <p className="text-xs text-muted-foreground italic">
                            +{variant.data.cons.length - 3} more...
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Selection Button */}
                    <Button
                      variant={isSelected ? "default" : "outline"}
                      size="sm"
                      className="w-full"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectVariant(variant.id);
                      }}
                    >
                      {isSelected ? (
                        <>
                          <Check className="w-4 h-4 mr-2" />
                          Selected
                        </>
                      ) : (
                        'Select as Agreed Solution'
                      )}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
        </div>
      </div>
    </div>
  );
}