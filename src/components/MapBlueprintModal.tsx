/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

interface MapBlueprintModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentMapId: string;
  hasMap: boolean;
}

const towns = [
  { id: 'village', name: 'Oakhaven', x: 54, y: 207, labelX: 38, labelY: 232, anchor: 'start' as const },
  { id: 'forest', name: 'Whispering Woods', x: 127, y: 137, labelX: 104, labelY: 116, anchor: 'middle' as const },
  { id: 'aiguemorte', name: 'Aiguemorte', x: 198, y: 207, labelX: 175, labelY: 232, anchor: 'middle' as const },
  { id: 'val_de_loire', name: 'Val-de-Loire', x: 255, y: 151, labelX: 238, labelY: 128, anchor: 'middle' as const },
  { id: 'orleans', name: 'Orléans', x: 316, y: 205, labelX: 316, labelY: 232, anchor: 'middle' as const },
  { id: 'tours', name: 'Tours', x: 354, y: 91, labelX: 332, labelY: 73, anchor: 'middle' as const },
  { id: 'dijon', name: 'Dijon', x: 422, y: 123, labelX: 440, labelY: 128, anchor: 'start' as const },
  { id: 'capital', name: 'Le Château Noir', x: 433, y: 39, labelX: 413, labelY: 20, anchor: 'middle' as const }
];

const routeNames: Record<string, string> = {
  route1: 'Route 1 · Le Chemin Fluvial',
  route2: 'Route 2 · Le Pont Royal',
  route4: 'Route 4 · Le Col des Collines',
  route5: 'Route 5 · La Sente du Vignoble',
  royalRoad: 'Le Chemin Royal',
  oakhaven_cottage: "Tobias's Cottage",
  oakhaven_inn: 'The Oakhaven Hearth',
  aiguemorte_bakery: "Madame Renée's Bakery",
  aiguemorte_home: 'Aiguemorte Townhouse'
};

const routeMarkers: Record<string, { x: number; y: number }> = {
  route1: { x: 226, y: 179 },
  route2: { x: 286, y: 178 },
  route4: { x: 337, y: 146 },
  route5: { x: 389, y: 106 },
  royalRoad: { x: 429, y: 79 }
};

const roadPath = 'M54 207 Q85 195 103 166 Q115 146 127 137 Q156 144 174 180 Q185 200 198 207 Q221 184 255 151 Q285 159 300 190 Q309 201 316 205 Q340 170 354 112 Q355 99 354 91 Q390 95 422 123 Q441 95 433 39';

export const MapBlueprintModal: React.FC<MapBlueprintModalProps> = ({
  isOpen,
  onClose,
  currentMapId,
  hasMap
}) => {
  if (!isOpen) return null;

  const cityId = currentMapId.startsWith('oakhaven_')
    ? 'village'
    : currentMapId.startsWith('aiguemorte_')
      ? 'aiguemorte'
      : currentMapId;
  const routeMarker = routeMarkers[cityId];
  const currentLocation = routeNames[currentMapId] || towns.find(town => town.id === cityId)?.name || 'Unknown road';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xs">
      <div className="relative w-full max-w-4xl bg-slate-900 border-2 border-amber-700/70 rounded-xl shadow-2xl p-5 text-slate-200 flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
          <div className="flex items-center gap-2">
            <span className="text-xl" aria-hidden="true">🗺️</span>
            <div>
              <h2 className="text-base font-bold text-amber-300 tracking-wide">
                {hasMap ? "The Wayfarer's Map" : 'No Map Yet'}
              </h2>
              <p className="text-[11px] text-slate-400">
                {hasMap ? 'A hand-drawn guide from Oakhaven to the royal capital' : 'Ask a local for a map of the kingdom'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close map"
            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold flex items-center justify-center border border-slate-700"
          >
            ✕
          </button>
        </div>

        <div className="relative flex-1 min-h-0 overflow-hidden rounded-lg border border-amber-800/70 bg-cyan-700 p-1">
          {hasMap ? (
            <svg
              viewBox="0 0 500 270"
              role="img"
              aria-label={`Illustrated kingdom map. Current location: ${currentLocation}`}
              className="block h-auto w-full rounded-md"
            >
              <defs>
                <pattern id="mapGrass" width="18" height="18" patternUnits="userSpaceOnUse">
                  <circle cx="4" cy="5" r="1" fill="#d5e7a0" opacity=".55" />
                  <circle cx="14" cy="13" r="1" fill="#77b76d" opacity=".45" />
                </pattern>
                <filter id="mapShadow" x="-30%" y="-30%" width="160%" height="160%">
                  <feDropShadow dx="0" dy="2" stdDeviation="1.5" floodColor="#253e37" floodOpacity=".42" />
                </filter>
              </defs>
              <rect width="500" height="270" rx="12" fill="#53c5c6" />
              <path d="M12 24Q51 11 86 23T154 17Q189 27 226 16T296 20Q334 8 372 21T447 16Q480 20 500 13V270H0V70Q18 57 8 43T12 24Z" fill="#e1d49a" />
              <path d="M16 28Q57 16 87 28T154 22Q192 32 227 21T296 25Q335 13 372 26T447 21Q480 25 500 18V270H0V73Q20 61 12 45T16 28Z" fill="#a9d77c" stroke="#f3e4ad" strokeWidth="5" />
              <path d="M16 28Q57 16 87 28T154 22Q192 32 227 21T296 25Q335 13 372 26T447 21Q480 25 500 18V270H0V73Q20 61 12 45T16 28Z" fill="url(#mapGrass)" />

              <g fill="none" stroke="#d7f0d4" strokeWidth="2" opacity=".62">
                <path d="M24 89q12-6 24 0t24 0" />
                <path d="M443 184q12-6 24 0t24 0" />
                <path d="M16 111q12-6 24 0t24 0" />
              </g>

              <path d="M235 36Q214 66 225 90T208 128Q196 151 213 172T201 214Q194 236 210 270" fill="none" stroke="#6eb8db" strokeWidth="8" strokeLinecap="round" />
              <path d="M235 36Q214 66 225 90T208 128Q196 151 213 172T201 214Q194 236 210 270" fill="none" stroke="#bce9e9" strokeWidth="2" strokeLinecap="round" />

              <g fill="#4a8f55" stroke="#397348" strokeWidth="1">
                <path d="M73 105l8-17 8 17zM89 108l9-21 9 21zM104 101l8-17 8 17zM119 107l9-20 9 20zM135 99l8-18 8 18z" />
                <path d="M263 77l8-18 8 18zM279 80l9-21 9 21zM295 76l8-18 8 18zM311 83l9-21 9 21z" />
                <path d="M371 182l8-17 8 17zM386 188l9-20 9 20zM402 180l8-17 8 17zM418 189l9-21 9 21z" />
                <path d="M67 249l8-17 8 17zM82 251l9-20 9 20zM99 250l8-17 8 17z" />
              </g>
              <g fill="#607b8b" stroke="#f0ebce" strokeWidth="1.5">
                <path d="M317 50l12-24 12 24zM337 54l15-29 15 29zM359 49l12-24 12 24z" />
                <path d="M295 115l11-22 11 22zM311 119l14-27 14 27zM333 115l11-22 11 22z" />
              </g>
              <g fill="#fff3d4">
                <path d="M329 36l3 6-3 6-3-6zM350 37l3 6-3 6-3-6zM317 103l3 6-3 6-3-6z" />
              </g>

              <path d={roadPath} fill="none" stroke="#fff2c6" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" />
              <path d={roadPath} fill="none" stroke="#d95643" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
              <g fill="#fff8dc" stroke="#d95643" strokeWidth="2">
                <circle cx="85" cy="195" r="3" /><circle cx="115" cy="148" r="3" />
                <circle cx="161" cy="154" r="3" /><circle cx="184" cy="193" r="3" />
                <circle cx="239" cy="166" r="3" /><circle cx="275" cy="155" r="3" />
                <circle cx="305" cy="197" r="3" /><circle cx="348" cy="133" r="3" />
                <circle cx="376" cy="96" r="3" /><circle cx="410" cy="113" r="3" />
                <circle cx="438" cy="98" r="3" /><circle cx="431" cy="61" r="3" />
              </g>

              {towns.map(town => {
                const isCurrent = cityId === town.id && !routeMarker;
                return (
                  <g key={town.id} filter="url(#mapShadow)">
                    {isCurrent && <circle cx={town.x} cy={town.y} r="18" fill="#ffcf4f" opacity=".38" />}
                    <circle cx={town.x} cy={town.y} r="9" fill="#f3d16f" stroke="#fff6d5" strokeWidth="2" />
                    <path d={`M${town.x - 5} ${town.y + 2}v-5l5-4 5 4v5h-3v-4h-4v4z`} fill="#99543d" stroke="#6e4333" strokeWidth=".8" />
                    <text
                      x={town.labelX}
                      y={town.labelY}
                      textAnchor={town.anchor}
                      fill={isCurrent ? '#fff5a8' : '#294f3a'}
                      stroke="#f3e9c5"
                      strokeWidth="3"
                      paintOrder="stroke"
                      fontSize="10"
                      fontWeight="bold"
                    >
                      {town.name}
                    </text>
                  </g>
                );
              })}

              {routeMarker && (
                <g>
                  <circle cx={routeMarker.x} cy={routeMarker.y} r="15" fill="#fff3a6" opacity=".55" />
                  <path
                    d={`M${routeMarker.x} ${routeMarker.y - 9}l8 9-8 9-8-9z`}
                    fill="#278bd1"
                    stroke="#fff"
                    strokeWidth="2"
                  />
                </g>
              )}
              <g transform="translate(469 53)" fill="none" stroke="#325f55" strokeWidth="2">
                <path d="M0 22L8 0l8 22-8-5z" fill="#fff1ad" />
                <text x="8" y="-5" textAnchor="middle" fill="#325f55" stroke="none" fontSize="10" fontWeight="bold">N</text>
              </g>
            </svg>
          ) : (
            <div className="flex h-full min-h-[250px] flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-slate-700 bg-slate-900/70 p-6 text-center">
              <span className="text-4xl" aria-hidden="true">🧭</span>
              <p className="max-w-md text-sm text-slate-300">
                You do not have a kingdom map yet. Find the guard in Aiguemorte and speak with him to get one.
              </p>
            </div>
          )}
        </div>

        <div className="mt-3 pt-2 border-t border-slate-800 flex flex-wrap items-center justify-between text-xs text-slate-400 gap-2">
          <div className="flex items-center gap-2">
            {hasMap && <span className="h-2.5 w-2.5 rounded-full bg-sky-400" />}
            <span>Current location: <strong className="text-amber-300">{currentLocation}</strong></span>
          </div>
          <div className="flex items-center gap-3 text-[11px] text-slate-500">
            {hasMap && <span><span className="text-sky-300">◆</span> You are here</span>}
            <span>Press <kbd className="bg-slate-800 px-1 py-0.5 rounded border border-slate-700 text-slate-300">M</kbd> to close</span>
          </div>
        </div>
      </div>
    </div>
  );
};
