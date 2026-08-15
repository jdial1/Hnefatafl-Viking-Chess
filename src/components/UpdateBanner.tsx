import React from 'react';
import { RefreshCw } from '../icons';
import { Btn } from './ui';

export function UpdateBanner({ onUpdate }: { onUpdate: () => void }) {
  return (
    <div className="w-full max-w-4xl mx-auto px-3 mb-2">
      <div className="flex items-center justify-between gap-3 rounded-xl border border-amber-500/40 bg-amber-500/10 px-3 py-2">
        <p className="text-sm text-amber-200 leading-snug">A newer version of Hnefatæfl is available.</p>
        <Btn onClick={onUpdate} variant="primary" size="sm">
          <RefreshCw className="w-3.5 h-3.5" />
          Update
        </Btn>
      </div>
    </div>
  );
}
