// Utilidades para obtener procesos/materiales de un proyecto o cotización.
// Los proyectos convertidos guardan la información dentro de piezas[]
// (cada pieza tiene su material y sus procesos), no en los arreglos
// de nivel superior. Estas funciones aplanan ambas estructuras.

/** Todos los procesos: nivel superior + los de cada pieza.
 *  Cada proceso lleva captureId único (piezaId:procesoId) porque las
 *  plantillas de proceso repiten el mismo id en varias piezas. */
export function procesosAplanados(obj: any): any[] {
  const top = Array.isArray(obj?.procesos)
    ? obj.procesos.map((proc: any) => ({ ...proc, captureId: `top:${proc.id}` }))
    : [];
  const dePiezas = Array.isArray(obj?.piezas)
    ? obj.piezas.flatMap((pz: any) =>
        Array.isArray(pz?.procesos)
          ? pz.procesos.map((proc: any) => ({
              ...proc,
              captureId: `${pz.id}:${proc.id}`,
              piezaId: pz.id,
              piezaNombre: pz.nombre,
              piezaCodigo: pz.codigo,
            }))
          : []
      )
    : [];
  return [...top, ...dePiezas];
}

/** Busca el registro real de un proceso tolerando el formato viejo
 *  (id plano + piezaId) y el nuevo (captureId compuesto) */
export function buscarReal(procesosReales: any[] | undefined, proc: any): any | null {
  if (!Array.isArray(procesosReales)) return null;
  return (
    procesosReales.find((r: any) => r.id === proc.captureId) ||
    procesosReales.find((r: any) => r.piezaId && proc.piezaId && r.piezaId === proc.piezaId && r.id === proc.id) ||
    procesosReales.find((r: any) => !r.piezaId && !proc.piezaId && r.id === proc.id) ||
    null
  );
}

/** Todos los materiales: nivel superior + el de cada pieza.
 *  piezaCantidad = piezas a producir (la cotización cobra el material
 *  por pieza), distinto de la cantidad de compra del material. */
export function materialesAplanados(obj: any): any[] {
  const top = Array.isArray(obj?.materiales) ? obj.materiales : [];
  const dePiezas = Array.isArray(obj?.piezas)
    ? obj.piezas
        .filter((pz: any) => pz?.material)
        .map((pz: any) => ({
          ...pz.material,
          piezaId: pz.id,
          piezaNombre: pz.nombre,
          piezaCodigo: pz.codigo,
          piezaCantidad: Number(pz.cantidad) || 1,
        }))
    : [];
  return [...top, ...dePiezas];
}

/** Minutos cotizados de un proceso, tolerando ambos esquemas de campos */
export function minutosCotizados(proc: any): number {
  return Number(proc?.tiempoMinutos ?? proc?.tiempoMinutosCotizado ?? 0) || 0;
}

/** Minutos reales de un proceso (si ya se capturaron) */
export function minutosReales(proc: any): number {
  return Number(proc?.tiempoMinutosReal ?? 0) || 0;
}

/** Costo total cotizado de un proceso, tolerando ambos esquemas */
export function costoCotizadoProc(proc: any): number {
  return Number(proc?.costoTotal ?? proc?.costoTotalCotizado ?? 0) || 0;
}

/** Materiales cotizados de un proyecto con markup y escala por piezas
 *  a producir — la misma base que usa Control de Códigos para lo real */
export function materialesCotizadosDeProyecto(proyecto: any): any[] {
  return materialesAplanados(proyecto).map((m: any) => {
    const margenMat = Number(m.margenPorcentaje) || 0;
    const unitConMargen = (Number(m.costoUnitario) || 0) * (1 + margenMat / 100);
    const piezasAProducir = Number(m.piezaCantidad) || 1;
    const dimensionesTexto = [
      m.diametro && `⌀${m.diametro}`,
      m.lado && `□${m.lado}`,
      m.longitud && `× ${m.longitud}`,
      m.largo && `largo ${m.largo}`,
      m.ancho && `ancho ${m.ancho}`,
      m.espesor && `esp. ${m.espesor}`,
      m.unidadMedida,
    ].filter(Boolean).join(' ');
    return {
      id: m.id || crypto.randomUUID(),
      nombre: m.piezaNombre ? `${m.nombre} (${m.piezaNombre})` : (m.nombre || ''),
      nombreMaterial: m.nombre || '',
      piezaNombre: m.piezaNombre || '',
      tipo: m.tipo || '',
      forma: m.forma || '',
      dimensionesTexto,
      cantidad: piezasAProducir,
      unidad: m.unidad || 'pieza',
      costoUnitarioCotizado: unitConMargen,
      margenPorcentaje: margenMat,
      costoTotalCotizado: unitConMargen * piezasAProducir,
    };
  });
}
