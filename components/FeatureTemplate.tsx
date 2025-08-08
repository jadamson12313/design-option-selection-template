import { useState, useRef } from 'react';
import DesignOptionTemplate from './DesignOptionTemplate';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { Edit, Upload } from 'lucide-react';

interface FeatureTemplateProps {
  image: string | null;
  release: string;
  team: string;
  app: string;
  state: string;
  availableReleases: string[];
  availableTeams: string[];
  availableApps: string[];
  availableStates: string[];
  onImageUpdate: (image: string | null) => void;
  onTitleUpdate?: (title: string) => void;
  onReleaseUpdate?: (release: string) => void;
  onTeamUpdate?: (team: string) => void;
  onAppUpdate?: (app: string) => void;
  onStateUpdate?: (state: string) => void;
}

export default function FeatureTemplate({ image, release, team, app, state, availableReleases, availableTeams, availableApps, availableStates, onImageUpdate, onTitleUpdate, onReleaseUpdate, onTeamUpdate, onAppUpdate, onStateUpdate }: FeatureTemplateProps) {
  const [isImageHovered, setIsImageHovered] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const defaultImageSrc = "https://images.unsplash.com/photo-1581287053822-fd7bf4f4bfec?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1920&q=80";

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
        onImageUpdate(resizedImageDataUrl);
      } catch (error) {
        console.error('Error resizing image:', error);
        const reader = new FileReader();
        reader.onload = (e) => {
          onImageUpdate(e.target?.result as string);
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const resetToDefaultImage = () => {
    onImageUpdate(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
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
              src={image || defaultImageSrc}
              alt="Design workspace with sketches and prototypes"
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

            {image && (
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
        <DesignOptionTemplate 
          onTitleUpdate={onTitleUpdate} 
          release={release}
          team={team}
          app={app}
          state={state}
          availableReleases={availableReleases}
          availableTeams={availableTeams}
          availableApps={availableApps}
          availableStates={availableStates}
          onReleaseUpdate={onReleaseUpdate}
          onTeamUpdate={onTeamUpdate}
          onAppUpdate={onAppUpdate}
          onStateUpdate={onStateUpdate}
        />
      </div>
    </div>
  );
}