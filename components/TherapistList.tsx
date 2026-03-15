import React from 'react';
import { Therapist, AvailabilityStatus } from '../types';

interface TherapistListProps {
  therapists: Array<Therapist & { availability: AvailabilityStatus }>;
  onSelectTherapist: (therapistId: string) => void;
  onBack: () => void;
}

export const TherapistList: React.FC<TherapistListProps> = ({
  therapists,
  onSelectTherapist,
  onBack
}) => {
  const handleTherapistClick = (therapistId: string, availability: AvailabilityStatus) => {
    if (!availability.allow) {
      alert(`${therapists.find(t => t.id === therapistId)?.name} atende no horário: ${therapists.find(t => t.id === therapistId)?.schedule}`);
      return;
    }
    onSelectTherapist(therapistId);
  };

  const getStatusDot = (availability: AvailabilityStatus) => {
    return (
      <span 
        className="status-dot"
        style={{ 
          backgroundColor: availability.color,
          boxShadow: `0 0 5px ${availability.color}` 
        }}
      ></span>
    );
  };

  const getTherapistCardClass = (availability: AvailabilityStatus) => {
    if (!availability.allow) {
      return 'bg-slate-900 border-slate-800 opacity-60 cursor-not-allowed';
    }
    return 'bg-slate-800 border-slate-700 cursor-pointer hover:bg-slate-700';
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="glass-card p-6 h-full">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={onBack}
            className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center hover:bg-slate-600 transition-colors"
          >
            <i className="fas fa-arrow-left text-slate-300"></i>
          </button>
          <h2 className="font-black text-sky-400 text-xl tracking-tight">Nossa Equipe</h2>
        </div>

        {/* Therapists List */}
        <div className="space-y-4 pb-20">
          {therapists.map((therapist) => (
            <div
              key={therapist.id}
              onClick={() => handleTherapistClick(therapist.id, therapist.availability)}
              className={`flex items-center gap-4 p-4 rounded-xl border shadow-sm transition-all mb-3 ${getTherapistCardClass(therapist.availability)}`}
            >
              {/* Avatar */}
              <div 
                className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold relative"
                style={{ 
                  backgroundColor: therapist.availability.allow ? therapist.color : '#475569' 
                }}
              >
                <i className={`fas fa-${therapist.icon} text-lg`}></i>
                <span 
                  className="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-slate-800"
                  style={{ backgroundColor: therapist.availability.color }}
                ></span>
              </div>

              {/* Info */}
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className={`font-bold text-sm ${therapist.availability.allow ? 'text-slate-200' : 'text-slate-500'}`}>
                    {therapist.name}
                  </span>
                  <span className={`text-[9px] font-bold uppercase ${therapist.availability.allow ? 'text-emerald-400' : 'text-slate-500'}`}>
                    {therapist.availability.text}
                  </span>
                </div>
                
                <p className="text-[10px] text-slate-500 font-bold tracking-wider mt-1">
                  {therapist.schedule}
                </p>
                
                <div className="flex items-center mt-2">
                  {getStatusDot(therapist.availability)}
                  <span className="text-[8px] uppercase font-bold text-slate-400 ml-1">
                    {therapist.availability.status === 'busy' && 'Ocupado (15 min)'}
                    {therapist.availability.status === 'online' && 'Disponível agora'}
                    {therapist.availability.status === 'offline' && 'Fora do horário'}
                  </span>
                </div>
              </div>

              {/* Status Indicator */}
              <div className="text-right">
                {therapist.availability.allow && (
                  <div className="flex items-center gap-2">
                    {therapist.availability.status === 'online' && (
                      <i className="fas fa-circle text-emerald-400 text-xs"></i>
                    )}
                    {therapist.availability.status === 'busy' && (
                      <i className="fas fa-clock text-yellow-400 text-xs"></i>
                    )}
                    <span className="text-xs text-slate-400">
                      {therapist.availability.status === 'online' && 'Livre'}
                      {therapist.availability.status === 'busy' && 'Ocupado'}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Info Section */}
        <div className="mt-6 p-4 bg-slate-900/50 rounded-xl border border-slate-700">
          <h3 className="text-sm font-bold text-slate-300 mb-3 flex items-center gap-2">
            <i className="fas fa-info-circle text-sky-400"></i>
            Informações Importantes
          </h3>
          <ul className="space-y-2 text-xs text-slate-400">
            <li className="flex items-start gap-2">
              <i className="fas fa-circle text-emerald-400 text-[6px] mt-1"></i>
              <span>Terapeutas <strong className="text-emerald-400">Online</strong> estão disponíveis para atendimento imediato</span>
            </li>
            <li className="flex items-start gap-2">
              <i className="fas fa-circle text-yellow-400 text-[6px] mt-1"></i>
              <span>Terapeutas <strong className="text-yellow-400">Ocupados</strong> podem atender em até 15 minutos</span>
            </li>
            <li className="flex items-start gap-2">
              <i className="fas fa-circle text-slate-500 text-[6px] mt-1"></i>
              <span>Terapeutas <strong className="text-slate-500">Offline</strong> estão fora do horário de atendimento</span>
            </li>
          </ul>
        </div>

        {/* Emergency Notice */}
        <div className="mt-4 p-3 bg-rose-900/20 rounded-xl border border-rose-500/30">
          <p className="text-xs text-rose-300 text-center">
            <i className="fas fa-exclamation-triangle mr-1"></i>
            Em caso de emergência, procure serviços médicos imediatamente
          </p>
        </div>
      </div>
    </div>
  );
};

export default TherapistList;
