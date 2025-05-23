import React, { useState, useMemo } from 'react';
import { Typography, Box, Tabs, Tab, Paper, Chip, FormControl, InputLabel, Select, MenuItem, Grid } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import type { GridColDef, GridValueFormatterParams } from '@mui/x-data-grid';
import { alpha } from '@mui/material/styles';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`financial-tabpanel-${index}`}
      aria-labelledby={`financial-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

// Helper function to format currency with scale
const formatCurrency = (value: number, scale: 'actual' | 'thousands' | 'millions') => {
  let scaledValue = value;
  let suffix = '';
  let fractionDigits = 0;
  
  switch (scale) {
    case 'thousands':
      scaledValue = value / 1000;
      suffix = 'k';
      break;
    case 'millions':
      scaledValue = value / 1000000;
      suffix = 'm';
      fractionDigits = 1;
      break;
    default:
      scaledValue = value;
  }

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(scaledValue) + suffix;
};

// Helper function to format percentage
const formatPercentage = (value: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value / 100);
};

// Helper function to format date as "MMM-YY"
const formatDateCompact = (date: Date) => {
  return date.toLocaleString('default', { 
    month: 'short',
    year: '2-digit'
  }).replace(' ', '-');
};

// Helper function to generate year options
const generateYearOptions = () => {
  const currentYear = new Date().getFullYear();
  const years = [];
  for (let i = currentYear - 2; i <= currentYear + 5; i++) {
    years.push(i);
  }
  return years;
};

// Helper function to generate date options
const generateDateOptions = (selectedYear: number) => {
  const options = [];
  const startDate = new Date(selectedYear, 0, 1);
  const endDate = new Date(selectedYear, 11, 31);
  
  for (let i = 0; i < 12; i++) {
    const date = new Date(selectedYear, i, 1);
    options.push({
      value: date.toISOString(),
      label: formatDateCompact(date)
    });
  }
  
  return options;
};

// Helper function to check if a date is a business day (not weekend)
const isBusinessDay = (date: Date): boolean => {
  const day = date.getDay();
  return day !== 0 && day !== 6; // 0 is Sunday, 6 is Saturday
};

// Helper function to get the most recent close month
const getMostRecentCloseMonth = (): Date => {
  const today = new Date();
  const currentMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const previousMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  
  // Count business days in current month up to today
  let businessDaysCount = 0;
  const tempDate = new Date(currentMonth);
  
  while (tempDate < today) {
    if (isBusinessDay(tempDate)) {
      businessDaysCount++;
    }
    tempDate.setDate(tempDate.getDate() + 1);
  }
  
  // If we're more than 10 business days into the current month, use previous month
  // Otherwise, use the month before that
  return businessDaysCount > 10 ? previousMonth : new Date(previousMonth.getFullYear(), previousMonth.getMonth() - 1, 1);
};

const StatementModel = () => {
  const [tabValue, setTabValue] = useState(0);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [actualsThrough, setActualsThrough] = useState(() => getMostRecentCloseMonth().toISOString());
  const [periodType, setPeriodType] = useState<'monthly' | 'quarterly'>('monthly');
  const [valueScale, setValueScale] = useState<'actual' | 'thousands' | 'millions'>('millions');

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleYearChange = (year: number) => {
    setSelectedYear(year);
    // Update actualsThrough to January of the selected year if current selection is outside the new year
    const currentActualsThrough = new Date(actualsThrough);
    if (currentActualsThrough.getFullYear() !== year) {
      setActualsThrough(new Date(year, 0, 1).toISOString());
    }
  };

  const dateOptions = useMemo(() => generateDateOptions(selectedYear), [selectedYear]);
  const yearOptions = useMemo(() => generateYearOptions(), []);

  // Generate columns based on period type and selected year
  const generateColumns = () => {
    const columns: GridColDef[] = [];
    const startDate = new Date(selectedYear, 0, 1);
    const periods = periodType === 'monthly' ? 12 : 8; // 12 months or 8 quarters
    const actualsThroughDate = new Date(actualsThrough);
    
    for (let i = 0; i < periods; i++) {
      const date = new Date(startDate.getFullYear(), startDate.getMonth() + (periodType === 'monthly' ? i : i * 3), 1);
      const isActual = date <= actualsThroughDate;
      
      let headerLabel;
      if (periodType === 'monthly') {
        headerLabel = formatDateCompact(date);
      } else {
        const quarter = Math.floor(date.getMonth() / 3) + 1;
        headerLabel = `Q${quarter}-${date.getFullYear().toString().slice(-2)}`;
      }
      
      columns.push({
        field: `period${i}`,
        headerName: headerLabel,
        width: 100,
        type: 'number',
        valueFormatter: (params: GridValueFormatterParams) => {
          if (params.value === null || params.value === undefined) return '';
          // Only apply scaling to dollar values (not percentages)
          let row: any = undefined;
          if (params.id !== undefined) {
            row = params.api.getRow(params.id as any);
          }
          if (row?.metric?.includes('%')) {
            return formatPercentage(params.value as number);
          }
          return formatCurrency(params.value as number, valueScale);
        },
        renderHeader: () => (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
            <Typography variant="subtitle2" sx={{ fontSize: '0.875rem' }}>{headerLabel}</Typography>
            <Chip 
              label={isActual ? "Actual" : "Forecast"} 
              size="small" 
              color={isActual ? "default" : "info"}
              sx={{ 
                height: 18, 
                fontSize: '0.7rem',
                backgroundColor: isActual ? 'rgba(0, 0, 0, 0.08)' : 'rgba(33, 150, 243, 0.08)',
                color: 'rgba(0, 0, 0, 0.87)',
                '& .MuiChip-label': {
                  px: 1
                }
              }}
            />
          </Box>
        ),
      });
    }
    // Helper to get FY label
    const getFYLabel = (year: number) => `FY${String(year).slice(-2)}`;
    // Helper to check if actualsThrough is December of a given year
    const isYearActualized = (year: number) => {
      const actualsDate = new Date(actualsThrough);
      return actualsDate.getFullYear() === year && actualsDate.getMonth() === 11; // 11 = December
    };
    if (periodType === 'monthly') {
      const isActual = isYearActualized(selectedYear);
      columns.push({
        field: `annualTotal${selectedYear}`,
        headerName: getFYLabel(selectedYear),
        width: 110,
        type: 'number',
        renderHeader: () => (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
            <Typography variant="subtitle2" sx={{ fontSize: '0.875rem' }}>{getFYLabel(selectedYear)}</Typography>
            <Chip
              label={isActual ? 'Actual' : 'Forecast'}
              size="small"
              color={isActual ? 'default' : 'info'}
              sx={{
                height: 18,
                fontSize: '0.7rem',
                backgroundColor: isActual ? 'rgba(0, 0, 0, 0.08)' : 'rgba(33, 150, 243, 0.08)',
                color: 'rgba(0, 0, 0, 0.87)',
                '& .MuiChip-label': {
                  px: 1
                }
              }}
            />
          </Box>
        ),
        valueGetter: (params: any) => {
          // Sum all 12 months for the selected year
          let sum = 0;
          for (let i = 0; i < 12; i++) {
            const val = params.row[`period${i}`];
            if (typeof val === 'number') sum += val;
          }
          return sum;
        },
        valueFormatter: (params: GridValueFormatterParams) => {
          let row: any = undefined;
          if (params.id !== undefined) {
            row = params.api.getRow(params.id as any);
          }
          if (row?.metric?.includes('%')) {
            return formatPercentage(params.value as number);
          }
          return formatCurrency(params.value as number, valueScale);
        },
      });
    } else if (periodType === 'quarterly') {
      const year1 = selectedYear;
      const year2 = selectedYear + 1;
      const isActual1 = isYearActualized(year1);
      const isActual2 = isYearActualized(year2);
      columns.push({
        field: `annualTotal${year1}`,
        headerName: getFYLabel(year1),
        width: 110,
        type: 'number',
        renderHeader: () => (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
            <Typography variant="subtitle2" sx={{ fontSize: '0.875rem' }}>{getFYLabel(year1)}</Typography>
            <Chip
              label={isActual1 ? 'Actual' : 'Forecast'}
              size="small"
              color={isActual1 ? 'default' : 'info'}
              sx={{
                height: 18,
                fontSize: '0.7rem',
                backgroundColor: isActual1 ? 'rgba(0, 0, 0, 0.08)' : 'rgba(33, 150, 243, 0.08)',
                color: 'rgba(0, 0, 0, 0.87)',
                '& .MuiChip-label': {
                  px: 1
                }
              }}
            />
          </Box>
        ),
        valueGetter: (params: any) => {
          // Sum quarters for year1 (first 4 quarters)
          let sum = 0;
          for (let i = 0; i < 4; i++) {
            const val = params.row[`period${i}`];
            if (typeof val === 'number') sum += val;
          }
          return sum;
        },
        valueFormatter: (params: GridValueFormatterParams) => {
          let row: any = undefined;
          if (params.id !== undefined) {
            row = params.api.getRow(params.id as any);
          }
          if (row?.metric?.includes('%')) {
            return formatPercentage(params.value as number);
          }
          return formatCurrency(params.value as number, valueScale);
        },
      });
      columns.push({
        field: `annualTotal${year2}`,
        headerName: getFYLabel(year2),
        width: 110,
        type: 'number',
        renderHeader: () => (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
            <Typography variant="subtitle2" sx={{ fontSize: '0.875rem' }}>{getFYLabel(year2)}</Typography>
            <Chip
              label={isActual2 ? 'Actual' : 'Forecast'}
              size="small"
              color={isActual2 ? 'default' : 'info'}
              sx={{
                height: 18,
                fontSize: '0.7rem',
                backgroundColor: isActual2 ? 'rgba(0, 0, 0, 0.08)' : 'rgba(33, 150, 243, 0.08)',
                color: 'rgba(0, 0, 0, 0.87)',
                '& .MuiChip-label': {
                  px: 1
                }
              }}
            />
          </Box>
        ),
        valueGetter: (params: any) => {
          // Sum quarters for year2 (last 4 quarters)
          let sum = 0;
          for (let i = 4; i < 8; i++) {
            const val = params.row[`period${i}`];
            if (typeof val === 'number') sum += val;
          }
          return sum;
        },
        valueFormatter: (params: GridValueFormatterParams) => {
          let row: any = undefined;
          if (params.id !== undefined) {
            row = params.api.getRow(params.id as any);
          }
          if (row?.metric?.includes('%')) {
            return formatPercentage(params.value as number);
          }
          return formatCurrency(params.value as number, valueScale);
        },
      });
    }
    return columns;
  };

  const columns: GridColDef[] = [
    {
      field: 'metric',
      headerName: 'Metric',
      width: 180,
    },
    ...generateColumns(),
  ];

  // Sample data - replace with actual data later
  const rows = [
    {
      id: 1,
      metric: 'Total Revenue',
      period0: 1000000,
      period1: 1100000,
      period2: 1200000,
      period3: 1300000,
      period4: 1400000,
      period5: 1500000,
      period6: 1600000,
      period7: 1700000,
    },
    {
      id: 2,
      metric: 'Gross Margin $',
      period0: 400000,
      period1: 440000,
      period2: 480000,
      period3: 520000,
      period4: 560000,
      period5: 600000,
      period6: 640000,
      period7: 680000,
    },
    {
      id: 3,
      metric: 'Gross Margin %',
      period0: 40,
      period1: 40,
      period2: 40,
      period3: 40,
      period4: 40,
      period5: 40,
      period6: 40,
      period7: 40,
    },
    {
      id: 4,
      metric: 'Total Indirect Costs',
      period0: 200000,
      period1: 220000,
      period2: 240000,
      period3: 260000,
      period4: 280000,
      period5: 300000,
      period6: 320000,
      period7: 340000,
    },
    {
      id: 5,
      metric: 'Total SG&A',
      period0: 150000,
      period1: 165000,
      period2: 180000,
      period3: 195000,
      period4: 210000,
      period5: 225000,
      period6: 240000,
      period7: 255000,
    },
    {
      id: 6,
      metric: 'Operating Income',
      period0: 50000,
      period1: 55000,
      period2: 60000,
      period3: 65000,
      period4: 70000,
      period5: 75000,
      period6: 80000,
      period7: 85000,
    },
  ];

  return (
    <Box sx={{ height: '100vh', background: '#f7f8fa', p: { xs: 2, md: 4 }, boxSizing: 'border-box', display: 'flex', flexDirection: 'column' }}>
      <Typography
        variant="h5"
        gutterBottom
        sx={{ mb: 2, fontWeight: 700, color: '#222', letterSpacing: -1, fontSize: { xs: '1.25rem', md: '1.5rem' }, lineHeight: 1.2 }}
      >
        Financial Statements
      </Typography>
      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={12} md={3}>
          <FormControl fullWidth size="small" sx={{ borderRadius: 2, background: '#f7f8fa' }}>
            <InputLabel>Year</InputLabel>
            <Select
              value={selectedYear}
              label="Year"
              onChange={(e) => handleYearChange(e.target.value as number)}
              sx={{ borderRadius: 2 }}
            >
              {yearOptions.map((year) => (
                <MenuItem key={year} value={year}>
                  {year}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} md={3}>
          <FormControl fullWidth size="small" sx={{ borderRadius: 2, background: '#f7f8fa' }}>
            <InputLabel>Actuals Through</InputLabel>
            <Select
              value={actualsThrough}
              label="Actuals Through"
              onChange={(e) => setActualsThrough(e.target.value)}
              sx={{ borderRadius: 2 }}
            >
              {dateOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} md={3}>
          <FormControl fullWidth size="small" sx={{ borderRadius: 2, background: '#f7f8fa' }}>
            <InputLabel>Period Type</InputLabel>
            <Select
              value={periodType}
              label="Period Type"
              onChange={(e) => setPeriodType(e.target.value as 'monthly' | 'quarterly')}
              sx={{ borderRadius: 2 }}
            >
              <MenuItem value="monthly">Monthly</MenuItem>
              <MenuItem value="quarterly">Quarterly</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} md={3}>
          <FormControl fullWidth size="small" sx={{ borderRadius: 2, background: '#f7f8fa' }}>
            <InputLabel>Values Type</InputLabel>
            <Select
              value={valueScale}
              label="Values Type"
              onChange={(e) => setValueScale(e.target.value as 'actual' | 'thousands' | 'millions')}
              sx={{ borderRadius: 2 }}
            >
              <MenuItem value="actual">Actual</MenuItem>
              <MenuItem value="thousands">Thousands</MenuItem>
              <MenuItem value="millions">Millions</MenuItem>
            </Select>
          </FormControl>
        </Grid>
      </Grid>
      <Paper elevation={2} sx={{
        width: '100%',
        flex: 1,
        minHeight: 0,
        borderRadius: 4,
        boxShadow: '0 4px 24px 0 rgba(0,0,0,0.04)',
        background: '#fff',
        p: { xs: 2, md: 3 },
        display: 'flex',
        flexDirection: 'column',
      }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          aria-label="financial statements tabs"
          sx={{
            borderBottom: 1,
            borderColor: 'divider',
            minHeight: 48,
            '.MuiTabs-indicator': {
              height: 3,
              borderRadius: 2,
              background: '#007aff',
            },
            '.MuiTab-root': {
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '1rem',
              color: '#555',
              minHeight: 48,
              borderRadius: 2,
              '&.Mui-selected': {
                color: '#007aff',
                background: alpha('#007aff', 0.08),
              },
            },
          }}
        >
          <Tab label="Income Statement" />
          <Tab label="Balance Sheet" />
          <Tab label="Cash Flow" />
        </Tabs>
        <TabPanel value={tabValue} index={0}>
          <Box sx={{
            flex: 1,
            minHeight: 0,
            width: '100%',
            overflow: 'auto',
            borderRadius: 3,
            background: '#fafbfc',
            boxShadow: '0 2px 8px 0 rgba(0,0,0,0.03)',
            p: { xs: 0.5, md: 1 },
            m: 0,
            display: 'flex',
            flexDirection: 'column',
          }}>
            <DataGrid
              rows={rows}
              columns={columns}
              disableRowSelectionOnClick
              sx={{
                border: 'none',
                borderRadius: 3,
                background: '#fafbfc',
                fontFamily: 'SF Pro Display, Inter, Roboto, Arial, sans-serif',
                '& .MuiDataGrid-cell': {
                  borderRight: 'none',
                  fontSize: '1rem',
                  background: 'transparent',
                  py: 1.5,
                  px: 1,
                },
                '& .MuiDataGrid-columnHeaders': {
                  backgroundColor: '#f4f5f7',
                  position: 'sticky',
                  top: 0,
                  zIndex: 1,
                  borderBottom: '1px solid #e0e3e8',
                  fontWeight: 600,
                  fontSize: '1rem',
                  color: '#222',
                  borderRadius: 3,
                },
                '& .MuiDataGrid-virtualScroller': {
                  overflow: 'auto',
                },
                '& .MuiDataGrid-row': {
                  borderRadius: 0,
                  background: 'transparent',
                  mb: 0,
                  boxShadow: 'none',
                  transition: 'none',
                  '&:hover': {
                    boxShadow: 'none',
                    background: 'rgba(0,0,0,0.02)',
                  },
                },
                '& .MuiDataGrid-footerContainer': {
                  borderTop: 'none',
                  background: 'transparent',
                },
              }}
              autoHeight={false}
              density="comfortable"
              hideFooterSelectedRowCount
              hideFooterPagination
            />
          </Box>
        </TabPanel>
        <TabPanel value={tabValue} index={1}>
          <Typography variant="h6" gutterBottom>
            Balance Sheet
          </Typography>
          {/* Balance Sheet content will go here */}
        </TabPanel>
        <TabPanel value={tabValue} index={2}>
          <Typography variant="h6" gutterBottom>
            Cash Flow Statement
          </Typography>
          {/* Cash Flow content will go here */}
        </TabPanel>
      </Paper>
    </Box>
  );
};

export default StatementModel; 