'use client';

import dynamic from 'next/dynamic';
import type { MapSelectorInternalProps } from './MapSelectorInternal';

const DynamicMapSelector = dynamic(() => import('./MapSelectorInternal'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-64 rounded-3xl border border-slate-200 bg-slate-100 animate-pulse" />
  ),
});

export type MapSelectorProps = MapSelectorInternalProps;

export default function MapSelector(props: MapSelectorProps) {
  return <DynamicMapSelector {...props} />;
}
