import { useState } from 'react';

export type LandFilters = {
  landCategory?: 'Residential' | 'Commercial' | 'Agricultural' | 'Industrial' | 'any';
  tenureType?: 'Freehold' | 'Leasehold_99' | 'Leasehold_999' | 'any';
  plotSize?: '50x100' | '1_8_acre' | '1_4_acre' | '1_2_acre' | 'full_acre' | 'any';
  docReadyTitle?: boolean;
  docAllotment?: boolean;
  docSearch?: boolean;
  investFenced?: boolean;
  investBeacons?: boolean;
  investBorehole?: boolean;
  investElectricity?: boolean;
  nearMainRoad?: boolean;
  topography?: 'Flat' | 'Sloped' | 'RedSoil' | 'any';
  paymentPlan?: 'Cash' | 'Installments' | 'BankFinancing' | 'any';
  verified?: boolean;
  controlledDevelopment?: boolean;
};

const defaultLandFilters: LandFilters = {
  landCategory: 'any',
  tenureType: 'any',
  plotSize: 'any',
  topography: 'any',
  paymentPlan: 'any',
  docReadyTitle: false,
  docAllotment: false,
  docSearch: false,
  investFenced: false,
  investBeacons: false,
  investBorehole: false,
  investElectricity: false,
  nearMainRoad: false,
  verified: false,
  controlledDevelopment: false,
};

type Props = {
  value?: LandFilters;
  onChange: (v: LandFilters) => void;
};

const LandFilters = ({ value, onChange }: Props) => {
  const [filters, setFilters] = useState<LandFilters>(value || defaultLandFilters);
  const update = (patch: Partial<LandFilters>) => {
    const next = { ...filters, ...patch };
    setFilters(next);
    onChange(next);
  };

  return (
    <div className="bg-card p-4 rounded-sm border border-border">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Land</h4>
          <div className="grid grid-cols-2 gap-2">
            <select value={filters.landCategory} onChange={e=>update({ landCategory: e.target.value as LandFilters['landCategory']})} className="bg-input border border-border p-2 rounded-sm text-sm">
              <option value="any">Any Category</option>
              <option value="Residential">Residential</option>
              <option value="Commercial">Commercial</option>
              <option value="Agricultural">Agricultural</option>
              <option value="Industrial">Industrial</option>
            </select>
            <select value={filters.tenureType} onChange={e=>update({ tenureType: e.target.value as LandFilters['tenureType']})} className="bg-input border border-border p-2 rounded-sm text-sm">
              <option value="any">Any Tenure</option>
              <option value="Freehold">Freehold</option>
              <option value="Leasehold_99">Leasehold 99</option>
              <option value="Leasehold_999">Leasehold 999</option>
            </select>
            <select value={filters.plotSize} onChange={e=>update({ plotSize: e.target.value as LandFilters['plotSize']})} className="bg-input border border-border p-2 rounded-sm text-sm">
              <option value="any">Any Size</option>
              <option value="50x100">50x100 (1/8 Acre)</option>
              <option value="1_8_acre">1/8 Acre</option>
              <option value="1_4_acre">1/4 Acre</option>
              <option value="1_2_acre">1/2 Acre</option>
              <option value="full_acre">Full Acre</option>
            </select>
            <select value={filters.topography} onChange={e=>update({ topography: e.target.value as LandFilters['topography']})} className="bg-input border border-border p-2 rounded-sm text-sm">
              <option value="any">Any Topography</option>
              <option value="Flat">Flat</option>
              <option value="Sloped">Sloped</option>
              <option value="RedSoil">Red Soil</option>
            </select>
          </div>
        </div>

        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Documentation</h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <label className="flex items-center gap-2"><input type="checkbox" checked={filters.docReadyTitle} onChange={e=>update({ docReadyTitle: e.target.checked })}/> Ready Title Deed</label>
            <label className="flex items-center gap-2"><input type="checkbox" checked={filters.docAllotment} onChange={e=>update({ docAllotment: e.target.checked })}/> Allotment Letter</label>
            <label className="flex items-center gap-2"><input type="checkbox" checked={filters.docSearch} onChange={e=>update({ docSearch: e.target.checked })}/> Search Conducted</label>
            <label className="flex items-center gap-2"><input type="checkbox" checked={filters.verified} onChange={e=>update({ verified: e.target.checked })}/> Verified Listing</label>
          </div>
        </div>

        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Investment Readiness</h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <label className="flex items-center gap-2"><input type="checkbox" checked={filters.investFenced} onChange={e=>update({ investFenced: e.target.checked })}/> Fenced/Gated</label>
            <label className="flex items-center gap-2"><input type="checkbox" checked={filters.investBeacons} onChange={e=>update({ investBeacons: e.target.checked })}/> Beacons in Place</label>
            <label className="flex items-center gap-2"><input type="checkbox" checked={filters.investBorehole} onChange={e=>update({ investBorehole: e.target.checked })}/> Borehole On Site</label>
            <label className="flex items-center gap-2"><input type="checkbox" checked={filters.investElectricity} onChange={e=>update({ investElectricity: e.target.checked })}/> Electricity On Site</label>
            <label className="flex items-center gap-2"><input type="checkbox" checked={filters.controlledDevelopment} onChange={e=>update({ controlledDevelopment: e.target.checked })}/> Controlled Development</label>
          </div>
        </div>

        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Proximity & Payment</h4>
          <div className="grid grid-cols-2 gap-2">
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={filters.nearMainRoad} onChange={e=>update({ nearMainRoad: e.target.checked })}/> Near Main Road</label>
            <select value={filters.paymentPlan} onChange={e=>update({ paymentPlan: e.target.value as LandFilters['paymentPlan'] })} className="bg-input border border-border p-2 rounded-sm text-sm">
              <option value="any">Any Plan</option>
              <option value="Cash">Cash Only</option>
              <option value="Installments">Installments</option>
              <option value="BankFinancing">Bank Financing</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandFilters;
