import { useState } from 'react';
import { ComposableMap, Geographies, Geography, ZoomableGroup } from 'react-simple-maps';
import { useTheme } from '../context/ThemeContext';

const GEO_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json';

// ISO numeric → ISO3 mapping for common countries
const NUM_TO_ISO3: Record<string, string> = {
  '036': 'AUS', '840': 'USA', '826': 'GBR', '124': 'CAN', '554': 'NZL',
  '702': 'SGP', '356': 'IND', '372': 'IRL', '410': 'KOR', '392': 'JPN',
  '156': 'CHN', '158': 'TWN', '344': 'HKG', '250': 'FRA', '276': 'DEU',
  '724': 'ESP', '484': 'MEX', '076': 'BRA', '620': 'PRT', '380': 'ITA',
  '528': 'NLD', '643': 'RUS', '682': 'SAU', '792': 'TUR', '704': 'VNM',
  '764': 'THA', '360': 'IDN', '458': 'MYS', '608': 'PHL', '566': 'NGA',
  '710': 'ZAF', '818': 'EGY', '032': 'ARG', '152': 'CHL', '170': 'COL',
  '616': 'POL', '752': 'SWE', '578': 'NOR', '208': 'DNK', '246': 'FIN',
};

const ISO3_NAMES: Record<string, string> = {
  AUS: 'Australia', USA: 'United States', GBR: 'United Kingdom', CAN: 'Canada',
  NZL: 'New Zealand', SGP: 'Singapore', IND: 'India', IRL: 'Ireland',
  KOR: 'South Korea', JPN: 'Japan', CHN: 'China', TWN: 'Taiwan',
  HKG: 'Hong Kong', FRA: 'France', DEU: 'Germany', ESP: 'Spain',
  MEX: 'Mexico', BRA: 'Brazil', PRT: 'Portugal', ITA: 'Italy',
  NLD: 'Netherlands', RUS: 'Russia', SAU: 'Saudi Arabia', TUR: 'Turkey',
  VNM: 'Vietnam', THA: 'Thailand', IDN: 'Indonesia', MYS: 'Malaysia',
  PHL: 'Philippines',
};

interface Props {
  usersByCountry: Array<{ iso3: string; count: number }>;
  unknownLocationCount: number;
}

export function WorldMap({ usersByCountry, unknownLocationCount }: Props) {
  const { t } = useTheme();
  const [tooltip, setTooltip] = useState<{ name: string; count: number; x: number; y: number } | null>(null);

  const countryMap = Object.fromEntries(usersByCountry.map(c => [c.iso3, c.count]));
  const maxCount = Math.max(...usersByCountry.map(c => c.count), 1);
  const totalMapped = usersByCountry.reduce((s, c) => s + c.count, 0);

  const getColor = (iso3: string) => {
    const count = countryMap[iso3];
    if (!count) return t.cardBorder;
    const intensity = Math.max(0.15, count / maxCount);
    return `rgba(124, 58, 237, ${intensity})`;
  };

  return (
    <div className="rounded-2xl p-5" style={{ background: t.cardBg, border: `1px solid ${t.cardBorder}` }}>
      <div className="flex items-center justify-between mb-4">
        <p className="text-[12px] font-bold" style={{ color: t.textMuted }}>USERS BY LOCATION</p>
        <div className="flex items-center gap-3 text-[11px]" style={{ color: t.textFaint }}>
          {unknownLocationCount > 0 && (
            <span>{unknownLocationCount} location unknown</span>
          )}
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-2 rounded-sm" style={{ background: 'rgba(124,58,237,0.15)' }} />
            <span>Low</span>
            <div className="w-3 h-2 rounded-sm" style={{ background: 'rgba(124,58,237,0.6)' }} />
            <span>Mid</span>
            <div className="w-3 h-2 rounded-sm" style={{ background: 'rgba(124,58,237,1)' }} />
            <span>High</span>
          </div>
        </div>
      </div>

      <div className="relative" style={{ background: t.pageBg, borderRadius: 12, overflow: 'hidden' }}>
        <ComposableMap projectionConfig={{ scale: 147 }} style={{ width: '100%', height: 'auto' }}>
          <ZoomableGroup>
            <Geographies geography={GEO_URL}>
              {({ geographies }) =>
                geographies.map(geo => {
                  const numId = geo.id?.toString().padStart(3, '0');
                  const iso3  = NUM_TO_ISO3[numId] ?? '';
                  const count = countryMap[iso3] ?? 0;
                  return (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      fill={getColor(iso3)}
                      stroke={t.cardBorder}
                      strokeWidth={0.3}
                      style={{
                        default: { outline: 'none' },
                        hover:   { outline: 'none', fill: count ? 'rgba(124,58,237,0.9)' : 'rgba(124,58,237,0.15)', cursor: count ? 'pointer' : 'default' },
                        pressed: { outline: 'none' },
                      }}
                      onMouseEnter={e => {
                        if (!iso3) return;
                        setTooltip({ name: ISO3_NAMES[iso3] ?? iso3, count, x: e.clientX, y: e.clientY });
                      }}
                      onMouseMove={e => {
                        if (tooltip) setTooltip(p => p ? { ...p, x: e.clientX, y: e.clientY } : null);
                      }}
                      onMouseLeave={() => setTooltip(null)}
                    />
                  );
                })
              }
            </Geographies>
          </ZoomableGroup>
        </ComposableMap>

        {/* Tooltip */}
        {tooltip && tooltip.count > 0 && (
          <div className="fixed z-50 pointer-events-none px-2.5 py-1.5 rounded-lg text-[11px] font-semibold text-white shadow-lg"
            style={{ left: tooltip.x + 12, top: tooltip.y - 36, background: '#7C3AED' }}>
            {tooltip.name} · {tooltip.count} {tooltip.count === 1 ? 'user' : 'users'}
          </div>
        )}
      </div>

      {/* Country list */}
      {usersByCountry.length > 0 && (
        <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-2">
          {usersByCountry.slice(0, 12).map(({ iso3, count }) => (
            <div key={iso3} className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full shrink-0" style={{ background: 'rgba(124,58,237,0.7)' }} />
              <p className="text-[12px] truncate flex-1" style={{ color: t.textPrimary }}>
                {ISO3_NAMES[iso3] ?? iso3}
              </p>
              <p className="text-[11px] font-bold shrink-0" style={{ color: t.textMuted }}>{count}</p>
            </div>
          ))}
        </div>
      )}

      {usersByCountry.length === 0 && (
        <p className="text-center text-[12px] mt-4" style={{ color: t.textFaint }}>
          No location data yet — available for Google OAuth users
        </p>
      )}
    </div>
  );
}
