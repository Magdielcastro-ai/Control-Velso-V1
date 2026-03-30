import { useEffect, useState } from 'react';
import { WifiOff, RefreshCw, Cloud, CloudOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface OfflineIndicatorProps {
  pendingCount?: number;
  onSync?: () => void;
  isSyncing?: boolean;
}

export function OfflineIndicator({ 
  pendingCount = 0, 
  onSync, 
  isSyncing = false 
}: OfflineIndicatorProps) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast.success('Conexión restaurada');
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast.warning('Modo sin conexión activado');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline && pendingCount === 0) {
    return (
      <div className="flex items-center gap-2 text-xs text-green-600">
        <Cloud className="w-4 h-4" />
        <span>Conectado</span>
      </div>
    );
  }

  if (!isOnline) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded">
          <WifiOff className="w-4 h-4" />
          <span>Sin conexión</span>
          {pendingCount > 0 && (
            <span className="bg-amber-200 text-amber-800 px-1.5 py-0.5 rounded-full text-xs">
              {pendingCount}
            </span>
          )}
        </div>
      </div>
    );
  }

  // Online pero con datos pendientes
  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-2 text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
        <CloudOff className="w-4 h-4" />
        <span>{pendingCount} pendientes</span>
      </div>
      {onSync && (
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={onSync}
          disabled={isSyncing}
          className="h-6 px-2 text-xs"
        >
          <RefreshCw className={`w-3 h-3 mr-1 ${isSyncing ? 'animate-spin' : ''}`} />
          Sincronizar
        </Button>
      )}
    </div>
  );
}

// Botón flotante para móvil
export function FloatingSyncButton({ 
  pendingCount = 0, 
  onSync, 
  isSyncing 
}: OfflineIndicatorProps) {
  if (pendingCount === 0) return null;

  return (
    <button
      onClick={onSync}
      disabled={isSyncing}
      className="fixed bottom-4 right-4 z-50 bg-blue-600 text-white rounded-full p-4 shadow-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
    >
      <RefreshCw className={`w-6 h-6 ${isSyncing ? 'animate-spin' : ''}`} />
      {pendingCount > 0 && (
        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
          {pendingCount}
        </span>
      )}
    </button>
  );
}
