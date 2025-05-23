import React, { useState } from 'react';
import { 
  Typography, 
  Box, 
  Paper, 
  Button,
  TextField,
  Tabs,
  Tab,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Menu,
  MenuItem,
  Grid
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import type { GridColDef, GridValueFormatterParams } from '@mui/x-data-grid';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import AddIcon from '@mui/icons-material/Add';
import EmailIcon from '@mui/icons-material/Email';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CommissionPlanForm from './CommissionPlanForm';
import type { CommissionPlan, SalesData, CommissionCalculation } from '../types/commission';
import { processCSVFile } from '../services/csvService';
import { calculateCommissions } from '../services/commissionService';

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

const CommissionCalculator = () => {
  const [tabValue, setTabValue] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [salesData, setSalesData] = useState<SalesData[]>([]);
  const [plans, setPlans] = useState<CommissionPlan[]>([]);
  const [calculations, setCalculations] = useState<CommissionCalculation[]>([]);
  const [isPlanDialogOpen, setIsPlanDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<CommissionPlan | undefined>();
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [rowMenuAnchor, setRowMenuAnchor] = useState<null | HTMLElement>(null);
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      setSelectedFile(file);
      try {
        const data = await processCSVFile(file);
        setSalesData(data);
      } catch (error) {
        console.error('Error processing CSV:', error);
        // TODO: Add error handling UI
      }
    }
  };

  const handlePlanSubmit = (planData: Omit<CommissionPlan, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newPlan: CommissionPlan = {
      ...planData,
      id: editingPlan?.id || crypto.randomUUID(),
      createdAt: editingPlan?.createdAt || new Date(),
      updatedAt: new Date()
    };

    if (editingPlan) {
      setPlans(plans.map(p => p.id === editingPlan.id ? newPlan : p));
    } else {
      setPlans([...plans, newPlan]);
    }

    setIsPlanDialogOpen(false);
    setEditingPlan(undefined);
  };

  const handleEditPlan = (plan: CommissionPlan) => {
    setEditingPlan(plan);
    setIsPlanDialogOpen(true);
  };

  const handleDeletePlan = (planId: string) => {
    setPlans(plans.filter(p => p.id !== planId));
  };

  const handleCalculateCommissions = () => {
    try {
      const results = calculateCommissions(salesData, plans);
      setCalculations(results);
    } catch (error) {
      console.error('Error calculating commissions:', error);
      // TODO: Add error handling UI
    }
  };

  const handleExportToExcel = () => {
    // TODO: Implement Excel export
  };

  const handleSendEmails = () => {
    // TODO: Implement email sending
  };

  const handleRowMenuOpen = (event: React.MouseEvent<HTMLElement>, id: string) => {
    setRowMenuAnchor(event.currentTarget);
    setSelectedRowId(id);
  };

  const handleRowMenuClose = () => {
    setRowMenuAnchor(null);
    setSelectedRowId(null);
  };

  const handleViewDetails = (id: string) => {
    // TODO: Implement view details functionality
    handleRowMenuClose();
  };

  const handleExportSelected = () => {
    // TODO: Implement export selected functionality
    handleRowMenuClose();
  };

  const columns: GridColDef[] = [
    { 
      field: 'repName', 
      headerName: 'Representative', 
      width: 200,
      filterable: true,
      sortable: true
    },
    { 
      field: 'repEmail', 
      headerName: 'Email', 
      width: 250,
      filterable: true,
      sortable: true
    },
    { 
      field: 'planName', 
      headerName: 'Plan', 
      width: 200,
      filterable: true,
      sortable: true
    },
    { 
      field: 'salesAmount', 
      headerName: 'Sales Amount', 
      width: 150,
      type: 'number',
      filterable: true,
      sortable: true,
      valueFormatter: (params: GridValueFormatterParams) => 
        new Intl.NumberFormat('en-US', { 
          style: 'currency', 
          currency: 'USD' 
        }).format(params.value as number)
    },
    { 
      field: 'commissionAmount', 
      headerName: 'Commission', 
      width: 150,
      type: 'number',
      filterable: true,
      sortable: true,
      valueFormatter: (params: GridValueFormatterParams) => 
        new Intl.NumberFormat('en-US', { 
          style: 'currency', 
          currency: 'USD' 
        }).format(params.value as number)
    },
    { 
      field: 'calculationDate', 
      headerName: 'Date', 
      width: 200,
      type: 'date',
      filterable: true,
      sortable: true,
      valueFormatter: (params: GridValueFormatterParams) => 
        new Date(params.value as string).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 100,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <IconButton
          onClick={(e) => handleRowMenuOpen(e, params.row.id)}
          size="small"
        >
          <MoreVertIcon />
        </IconButton>
      )
    }
  ];

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Commission Calculator
      </Typography>
      
      <Paper sx={{ mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab label="Data Import" />
          <Tab label="Plan Management" />
          <Tab label="Calculations" />
          <Tab label="Reports" />
        </Tabs>

        <TabPanel value={tabValue} index={0}>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={6}>
              <Button
                variant="contained"
                component="label"
                startIcon={<CloudUploadIcon />}
                fullWidth
              >
                Upload CSV File
                <input
                  type="file"
                  hidden
                  accept=".csv"
                  onChange={handleFileUpload}
                />
              </Button>
            </Grid>
            <Grid item xs={12} md={6}>
              {selectedFile && (
                <Typography>
                  Selected file: {selectedFile.name}
                </Typography>
              )}
            </Grid>
          </Grid>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6">Commission Plans</Typography>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => setIsPlanDialogOpen(true)}
                >
                  Add New Plan
                </Button>
              </Box>
              <List>
                {plans.map((plan) => (
                  <ListItem key={plan.id}>
                    <ListItemText
                      primary={plan.name}
                      secondary={`Business Line: ${plan.businessLine}`}
                    />
                    <ListItemSecondaryAction>
                      <IconButton
                        edge="end"
                        onClick={() => handleEditPlan(plan)}
                        sx={{ mr: 1 }}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        edge="end"
                        onClick={() => handleDeletePlan(plan.id)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>
            </Grid>
          </Grid>
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleCalculateCommissions}
                  disabled={!salesData.length || !plans.length}
                >
                  Calculate Commissions
                </Button>
                <Tooltip title="Send Email Reports">
                  <IconButton
                    color="primary"
                    onClick={handleSendEmails}
                    disabled={!calculations.length}
                  >
                    <EmailIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Export to Excel">
                  <IconButton
                    color="primary"
                    onClick={handleExportToExcel}
                    disabled={!calculations.length}
                  >
                    <FileDownloadIcon />
                  </IconButton>
                </Tooltip>
              </Box>
            </Grid>
          </Grid>
        </TabPanel>

        <TabPanel value={tabValue} index={3}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6">
                  Commission Reports
                </Typography>
                {selectedRows.length > 0 && (
                  <Button
                    variant="outlined"
                    startIcon={<FileDownloadIcon />}
                    onClick={handleExportSelected}
                  >
                    Export Selected ({selectedRows.length})
                  </Button>
                )}
              </Box>
              {calculations.length > 0 ? (
                <Box sx={{ height: 600, width: '100%' }}>
                  <DataGrid
                    rows={calculations}
                    columns={columns}
                    pageSizeOptions={[10, 25, 50]}
                    checkboxSelection
                    onRowSelectionModelChange={(newSelection) => {
                      setSelectedRows(newSelection as string[]);
                    }}
                    components={{
                      Toolbar: () => (
                        <Box sx={{ p: 1 }}>
                          <Typography variant="subtitle1">
                            Total Commission: {new Intl.NumberFormat('en-US', {
                              style: 'currency',
                              currency: 'USD'
                            }).format(calculations.reduce((sum, calc) => sum + calc.commissionAmount, 0))}
                          </Typography>
                        </Box>
                      )
                    }}
                    sx={{
                      '& .MuiDataGrid-cell:focus': {
                        outline: 'none'
                      }
                    }}
                  />
                </Box>
              ) : (
                <Typography color="text.secondary">
                  No commission calculations available. Please calculate commissions first.
                </Typography>
              )}
            </Grid>
          </Grid>
        </TabPanel>
      </Paper>

      <Dialog
        open={isPlanDialogOpen}
        onClose={() => {
          setIsPlanDialogOpen(false);
          setEditingPlan(undefined);
        }}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {editingPlan ? 'Edit Commission Plan' : 'New Commission Plan'}
        </DialogTitle>
        <DialogContent>
          <CommissionPlanForm
            onSubmit={handlePlanSubmit}
            initialData={editingPlan}
          />
        </DialogContent>
      </Dialog>

      {/* Row Actions Menu */}
      <Menu
        anchorEl={rowMenuAnchor}
        open={Boolean(rowMenuAnchor)}
        onClose={handleRowMenuClose}
      >
        <MenuItem onClick={() => selectedRowId && handleViewDetails(selectedRowId)}>
          <VisibilityIcon fontSize="small" sx={{ mr: 1 }} />
          View Details
        </MenuItem>
        <MenuItem onClick={() => selectedRowId && handleExportSelected()}>
          <FileDownloadIcon fontSize="small" sx={{ mr: 1 }} />
          Export
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default CommissionCalculator; 