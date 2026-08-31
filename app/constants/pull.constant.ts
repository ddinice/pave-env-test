export const EDITOR_PLACEHOLDER = `# Structure
STR-PRIMARY-MASS

# Electrical power system
EPS-BUS-VOLTAGE=
EPS-PEAK-LOAD=

MASS-TOTAL-DRY=120.5`;

export const FORMATS = [
  {
    id: 1,
    title: '.env',
    isActive: true,
    tooltipText: 'ready to fill',
  },
  {
    id: 2,
    title: 'JSON',
    isActive: false,
    tooltipText: 'Soon...' 
  },
  {
    id: 3,
    title: 'CSV',
    isActive: false,
    tooltipText: 'Soon...' 
  },
]