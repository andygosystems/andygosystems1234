import { useState } from 'react';

export interface KenyaFilters {
  verifiedOnly: boolean;
  land: {
    titleDeedReady: boolean;
    fenced: boolean;
    nearMainRoad: boolean;
    plotSize: 'any' | '1_8_acre' | '50x100';
  };
  security: {
    gatedCommunity: boolean;
    electricFence: boolean;
    cctv: boolean;
    dayNightSecurity: boolean;
  };
  utilities: {
    boreholeWater: boolean;
    backupGenerator: boolean;
    solarReady: boolean;
  };
  diaspora: {
    readyForAirbnb: boolean;
    furnished: boolean;
    installmentPayment: boolean;
  };
  locationGroup: 'any' | 'nairobi_suburbs' | 'satellite_towns' | 'growth_corridors';
  town: 'any' | 'Ruiru' | 'Syokimau' | 'Kitengela' | 'Ngong';
}

export const defaultFilters: KenyaFilters = {
  verifiedOnly: false,
  land: { titleDeedReady: false, fenced: false, nearMainRoad: false, plotSize: 'any' },
  security: { gatedCommunity: false, electricFence: false, cctv: false, dayNightSecurity: false },
  utilities: { boreholeWater: false, backupGenerator: false, solarReady: false },
  diaspora: { readyForAirbnb: false, furnished: false, installmentPayment: false },
  locationGroup: 'any',
  town: 'any',
};

type Props = {
  value: KenyaFilters;
  onChange: (v: KenyaFilters) => void;
};

const KenyaSearchFilters = ({ value, onChange }: Props) => {
  const [filters, setFilters] = useState<KenyaFilters>(value);

  const update = (next: Partial<KenyaFilters>) => {
    const merged = { ...filters, ...next };
    setFilters(merged);
    onChange(merged);
  };

  return (
    <div className="bg-card p-4 rounded-sm border border-border">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h4 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-2">Verified</h4>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={filters.verifiedOnly} onChange={e => update({ verifiedOnly: e.target.checked })} />
            Verified Agents Only
          </label>
        </div>

        <div>
          <h4 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-2">Land Details</h4>
          <div className="grid grid-cols-2 gap-2">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={filters.land.titleDeedReady} onChange={e => update({ land: { ...filters.land, titleDeedReady: e.target.checked } })} />
              Title Deed Ready
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={filters.land.fenced} onChange={e => update({ land: { ...filters.land, fenced: e.target.checked } })} />
              Fenced
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={filters.land.nearMainRoad} onChange={e => update({ land: { ...filters.land, nearMainRoad: e.target.checked } })} />
              Near Main Road
            </label>
            <select
              value={filters.land.plotSize}
              onChange={e => update({ land: { ...filters.land, plotSize: e.target.value as KenyaFilters['land']['plotSize'] } })}
              className="bg-input border border-border p-2 rounded-sm text-sm"
            >
              <option value="any">Any</option>
              <option value="1_8_acre">1/8th Acre</option>
              <option value="50x100">50x100</option>
            </select>
          </div>
        </div>

        <div>
          <h4 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-2">Security</h4>
          <div className="grid grid-cols-2 gap-2">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={filters.security.gatedCommunity} onChange={e => update({ security: { ...filters.security, gatedCommunity: e.target.checked } })} />
              Gated Community
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={filters.security.electricFence} onChange={e => update({ security: { ...filters.security, electricFence: e.target.checked } })} />
              Electric Fence
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={filters.security.cctv} onChange={e => update({ security: { ...filters.security, cctv: e.target.checked } })} />
              CCTV
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={filters.security.dayNightSecurity} onChange={e => update({ security: { ...filters.security, dayNightSecurity: e.target.checked } })} />
              24/7 Security
            </label>
          </div>
        </div>

        <div>
          <h4 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-2">Utilities</h4>
          <div className="grid grid-cols-2 gap-2">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={filters.utilities.boreholeWater} onChange={e => update({ utilities: { ...filters.utilities, boreholeWater: e.target.checked } })} />
              Borehole Water
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={filters.utilities.backupGenerator} onChange={e => update({ utilities: { ...filters.utilities, backupGenerator: e.target.checked } })} />
              Back-up Generator
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={filters.utilities.solarReady} onChange={e => update({ utilities: { ...filters.utilities, solarReady: e.target.checked } })} />
              Solar Ready
            </label>
          </div>
        </div>

        <div>
          <h4 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-2">Diaspora</h4>
          <div className="grid grid-cols-2 gap-2">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={filters.diaspora.readyForAirbnb} onChange={e => update({ diaspora: { ...filters.diaspora, readyForAirbnb: e.target.checked } })} />
              Ready for Airbnb
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={filters.diaspora.furnished} onChange={e => update({ diaspora: { ...filters.diaspora, furnished: e.target.checked } })} />
              Furnished
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={filters.diaspora.installmentPayment} onChange={e => update({ diaspora: { ...filters.diaspora, installmentPayment: e.target.checked } })} />
              Installment Payment
            </label>
          </div>
        </div>

        <div>
          <h4 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-2">Smart Location</h4>
          <div className="grid grid-cols-2 gap-2">
            <select
              value={filters.locationGroup}
              onChange={e => update({ locationGroup: e.target.value as KenyaFilters['locationGroup'] })}
              className="bg-input border border-border p-2 rounded-sm text-sm"
            >
              <option value="any">Any</option>
              <option value="nairobi_suburbs">Nairobi Suburbs</option>
              <option value="satellite_towns">Satellite Towns</option>
              <option value="growth_corridors">Growth Corridors</option>
            </select>
            <select
              value={filters.town}
              onChange={e => update({ town: e.target.value as KenyaFilters['town'] })}
              className="bg-input border border-border p-2 rounded-sm text-sm"
            >
              <option value="any">Any Town</option>
              <option value="Ruiru">Ruiru</option>
              <option value="Syokimau">Syokimau</option>
              <option value="Kitengela">Kitengela</option>
              <option value="Ngong">Ngong</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KenyaSearchFilters;
