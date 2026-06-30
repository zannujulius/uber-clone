type TraceData = Record<string, unknown>;

const clean = (data: TraceData): TraceData =>
  Object.fromEntries(
    Object.entries(data).filter(([, value]) => value !== undefined),
  );

export const trace = (step: string, data: TraceData): void => {
  console.log(`[trace][fare] ${step}`, clean(data));
};
