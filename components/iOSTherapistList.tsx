import React from 'react';
import { Therapist } from '../types';

interface iOSTherapistListProps {
  therapists: Therapist[];
  onSelectTherapist: (therapistId: string) => void;
  onBack: () => void;
}

export const iOSTherapistList: React.FC<iOSTherapistListProps> = ({
  therapists,
  onSelectTherapist,
  onBack
}) => {
  const handleTherapistSelect = (therapistId: string) => {
    // Haptic feedback
    if (navigator.vibrate) {
      navigator.vibrate(10);
    }
    onSelectTherapist(therapistId);
  };

  const getAvailabilityColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-500';
      case 'busy': return 'bg-yellow-400';
      case 'offline': return 'bg-gray-400';
      default: return 'bg-gray-400';
    }
  };

  const getAvailabilityText = (status: string) => {
    switch (status) {
      case 'online': return 'Disponível';
      case 'busy': return 'Ocupado';
      case 'offline': return 'Offline';
      default: return 'Offline';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* iOS Navigation Header */}
      <div className="ios-navigation-bar">
        <button 
          onClick={onBack}
          className="ios-navigation-bar-button"
        >
          <i className="fas fa-chevron-left"></i>
        </button>
        <div className="ios-navigation-bar-title">
          Terapeutas
        </div>
        <div className="w-10"></div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Header Section */}
        <div className="bg-white p-6 border-b border-gray-200">
          <div className="text-center mb-6">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-blue-100 flex items-center justify-center">
              <i className="fas fa-user-md text-blue-600 text-2xl"></i>
            </div>
            <h1 className="ios-title2 ios-text-primary mb-2">Escolha seu terapeuta</h1>
            <p className="ios-body ios-text-secondary">
              Selecione um profissional disponível para iniciar sua conversa
            </p>
          </div>
        </div>

        {/* Therapists List */}
        <div className="p-4 space-y-4">
          {therapists.map((therapist) => (
            <button
              key={therapist.id}
              onClick={() => handleTherapistSelect(therapist.id)}
              className="ios-card-large w-full text-left hover:scale-[1.02] transition-transform ios-haptic"
            >
              <div className="flex items-center gap-4">
                {/* Avatar */}
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg flex-shrink-0"
                  style={{ backgroundColor: therapist.color }}
                >
                  <i className={`fas fa-${therapist.icon}`}></i>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="ios-headline ios-text-primary font-semibold truncate">
                      {therapist.name}
                    </h3>
                    <div className={`w-2 h-2 rounded-full ${getAvailabilityColor(therapist.availability?.status || 'offline')}`}></div>
                  </div>
                  
                  <p className="ios-callout ios-text-secondary mb-2 line-clamp-2">
                    {therapist.specialty}
                  </p>

                  <div className="flex items-center justify-between">
                    <span className={`ios-footnote ${
                      therapist.availability?.status === 'online' 
                        ? 'text-green-600' 
                        : therapist.availability?.status === 'busy'
                        ? 'text-yellow-600'
                        : 'text-gray-500'
                    }`}>
                      {getAvailabilityText(therapist.availability?.status || 'offline')}
                    </span>
                    
                    {therapist.approach && (
                      <span className="ios-footnote ios-text-tertiary">
                        {therapist.approach}
                      </span>
                    )}
                  </div>
                </div>

                {/* Arrow */}
                <div className="flex-shrink-0">
                  <i className="fas fa-chevron-right text-gray-400"></i>
                </div>
              </div>

              {/* Additional Info */}
              {therapist.description && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <p className="ios-footnote ios-text-secondary leading-relaxed">
                    {therapist.description}
                  </p>
                </div>
              )}

              {/* Tags */}
              {therapist.tags && therapist.tags.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {therapist.tags.slice(0, 3).map((tag, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full ios-caption2 font-medium"
                    >
                      {tag}
                    </span>
                  ))}
                  {therapist.tags.length > 3 && (
                    <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full ios-caption2 font-medium">
                      +{therapist.tags.length - 3}
                    </span>
                  )}
                </div>
              )}
            </button>
          ))}

          {therapists.length === 0 && (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                <i className="fas fa-user-clock text-gray-400 text-xl"></i>
              </div>
              <h3 className="ios-headline ios-text-primary mb-2">
                Nenhum terapeuta disponível
              </h3>
              <p className="ios-body ios-text-secondary">
                No momento, todos os nossos profissionais estão ocupados. 
                Tente novamente em alguns minutos.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Footer Info */}
      <div className="bg-white border-t border-gray-200 p-4">
        <div className="flex items-center gap-3 text-center">
          <i className="fas fa-shield-alt text-blue-600"></i>
          <p className="ios-footnote ios-text-secondary">
            Todas as conversas são criptografadas e confidenciais
          </p>
        </div>
      </div>
    </div>
  );
};

export default iOSTherapistList;
