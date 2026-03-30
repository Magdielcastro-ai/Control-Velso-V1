import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';

interface PendingAction {
  id: string;
  type: 'cotizacion' | 'proyecto' | 'cliente';
  action: 'create' | 'update' | 'delete';
  data: any;
  timestamp: number;
}

export function useOfflineSync() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingActions, setPendingActions] = useState<PendingAction[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);

  // Escuchar cambios de conexión
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast.success('Conexión restaurada', {
        description: 'Sincronizando datos...'
      });
      syncPendingActions();
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast.warning('Sin conexión', {
        description: 'Los datos se guardarán localmente'
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Cargar acciones pendientes del localStorage
    const saved = localStorage.getItem('velso_pending_actions');
    if (saved) {
      try {
        setPendingActions(JSON.parse(saved));
      } catch (e) {
        console.error('Error cargando acciones pendientes:', e);
      }
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Guardar acciones pendientes en localStorage
  useEffect(() => {
    localStorage.setItem('velso_pending_actions', JSON.stringify(pendingActions));
  }, [pendingActions]);

  // Agregar acción pendiente
  const addPendingAction = useCallback((action: Omit<PendingAction, 'id' | 'timestamp'>) => {
    const newAction: PendingAction = {
      ...action,
      id: crypto.randomUUID(),
      timestamp: Date.now()
    };
    
    setPendingActions(prev => [...prev, newAction]);
    
    if (!isOnline) {
      toast.info('Guardado localmente', {
        description: 'Se sincronizará cuando haya conexión'
      });
    }
    
    return newAction.id;
  }, [isOnline]);

  // Eliminar acción pendiente
  const removePendingAction = useCallback((id: string) => {
    setPendingActions(prev => prev.filter(a => a.id !== id));
  }, []);

  // Sincronizar acciones pendientes
  const syncPendingActions = useCallback(async () => {
    if (pendingActions.length === 0 || !isOnline || isSyncing) return;
    
    setIsSyncing(true);
    const actionsToSync = [...pendingActions];
    const syncedIds: string[] = [];
    const failedIds: string[] = [];

    for (const action of actionsToSync) {
      try {
        // Aquí iría la lógica para sincronizar con Supabase
        // Por ahora simulamos éxito
        await new Promise(resolve => setTimeout(resolve, 500));
        syncedIds.push(action.id);
      } catch (error) {
        console.error('Error sincronizando acción:', error);
        failedIds.push(action.id);
      }
    }

    // Eliminar las acciones sincronizadas exitosamente
    setPendingActions(prev => prev.filter(a => !syncedIds.includes(a.id)));
    
    setIsSyncing(false);
    
    if (syncedIds.length > 0) {
      toast.success(`${syncedIds.length} datos sincronizados`);
    }
    
    if (failedIds.length > 0) {
      toast.error(`${failedIds.length} datos no pudieron sincronizarse`);
    }
  }, [pendingActions, isOnline, isSyncing]);

  // Forzar sincronización manual
  const forceSync = useCallback(async () => {
    if (!isOnline) {
      toast.error('No hay conexión a internet');
      return;
    }
    await syncPendingActions();
  }, [isOnline, syncPendingActions]);

  return {
    isOnline,
    isSyncing,
    pendingCount: pendingActions.length,
    addPendingAction,
    removePendingAction,
    syncPendingActions,
    forceSync
  };
}
