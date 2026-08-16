import React from 'react';
import { RefreshCw } from '../icons';
import { formatBuildId } from '../utils/appUpdate';
import { Btn } from './ui';

export function UpdateBanner({
  onUpdate,
  currentId,
  latestId,
}: {
  onUpdate: () => void;
  currentId: string | null;
  latestId: string | null;
}) {
  const current = currentId ? formatBuildId(currentId) : null;
  const latest = latestId ? formatBuildId(latestId) : null;

  return (
    <div className="w-full mb-3">
      <div className="flex items-center justify-between gap-3 rounded-xl border border-amber-500/40 bg-amber-500/10 px-3 py-2">
        <p className="text-sm text-amber-200 leading-snug">
          A newer version of Hnefatæfl is available.
          {current && latest ? (
            <span className="font-mono text-amber-100"> {current} → {latest}</span>
          ) : current ? (
            <span className="font-mono text-amber-100"> You have {current}.</span>
          ) : latest ? (
            <span className="font-mono text-amber-100"> {latest}</span>
          ) : null}
        </p>
        <Btn onClick={onUpdate} variant="primary" size="sm">
          <RefreshCw className="w-3.5 h-3.5" />
          Update
        </Btn>
      </div>
    </div>
  );
}
