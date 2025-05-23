import React, { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  IconButton,
  Paper,
  Grid
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import type { CommissionPlan, CommissionCriteria } from '../types/commission';

interface CommissionPlanFormProps {
  onSubmit: (plan: Omit<CommissionPlan, 'id' | 'createdAt' | 'updatedAt'>) => void;
  initialData?: CommissionPlan;
}

const CommissionPlanForm: React.FC<CommissionPlanFormProps> = ({ onSubmit, initialData }) => {
  const [name, setName] = useState(initialData?.name || '');
  const [businessLine, setBusinessLine] = useState<'line1' | 'line2'>(initialData?.businessLine || 'line1');
  const [criteria, setCriteria] = useState<Omit<CommissionCriteria, 'id'>[]>(
    initialData?.criteria.map(c => ({ ...c, id: '' })) || []
  );

  const handleAddCriteria = () => {
    setCriteria([
      ...criteria,
      {
        name: '',
        type: 'percentage',
        value: 0,
        conditions: []
      }
    ]);
  };

  const handleRemoveCriteria = (index: number) => {
    setCriteria(criteria.filter((_, i) => i !== index));
  };

  const handleCriteriaChange = (index: number, field: keyof CommissionCriteria, value: any) => {
    const newCriteria = [...criteria];
    newCriteria[index] = {
      ...newCriteria[index],
      [field]: value
    };
    setCriteria(newCriteria);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      name,
      businessLine,
      criteria: criteria.map(c => ({
        ...c,
        id: crypto.randomUUID()
      }))
    });
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Plan Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <FormControl fullWidth>
            <InputLabel>Business Line</InputLabel>
            <Select
              value={businessLine}
              label="Business Line"
              onChange={(e) => setBusinessLine(e.target.value as 'line1' | 'line2')}
            >
              <MenuItem value="line1">Line 1</MenuItem>
              <MenuItem value="line2">Line 2</MenuItem>
            </Select>
          </FormControl>
        </Grid>
      </Grid>

      <Box sx={{ mt: 4 }}>
        <Typography variant="h6" gutterBottom>
          Commission Criteria
        </Typography>
        {criteria.map((criterion, index) => (
          <Paper key={index} sx={{ p: 2, mb: 2 }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  label="Criteria Name"
                  value={criterion.name}
                  onChange={(e) => handleCriteriaChange(index, 'name', e.target.value)}
                  required
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <FormControl fullWidth>
                  <InputLabel>Type</InputLabel>
                  <Select
                    value={criterion.type}
                    label="Type"
                    onChange={(e) => handleCriteriaChange(index, 'type', e.target.value)}
                  >
                    <MenuItem value="percentage">Percentage</MenuItem>
                    <MenuItem value="fixed">Fixed Amount</MenuItem>
                    <MenuItem value="tiered">Tiered</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  label="Value"
                  type="number"
                  value={criterion.value}
                  onChange={(e) => handleCriteriaChange(index, 'value', parseFloat(e.target.value))}
                  required
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <IconButton
                  color="error"
                  onClick={() => handleRemoveCriteria(index)}
                >
                  <DeleteIcon />
                </IconButton>
              </Grid>
            </Grid>
          </Paper>
        ))}
        <Button
          startIcon={<AddIcon />}
          onClick={handleAddCriteria}
          sx={{ mt: 2 }}
        >
          Add Criteria
        </Button>
      </Box>

      <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          type="submit"
          variant="contained"
          color="primary"
          disabled={!name || criteria.length === 0}
        >
          {initialData ? 'Update Plan' : 'Create Plan'}
        </Button>
      </Box>
    </Box>
  );
};

export default CommissionPlanForm; 