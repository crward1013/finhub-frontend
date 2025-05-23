export interface CommissionPlan {
  id: string;
  name: string;
  businessLine: 'line1' | 'line2';  // Replace with your actual business lines
  criteria: CommissionCriteria[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CommissionCriteria {
  id: string;
  name: string;
  type: 'percentage' | 'fixed' | 'tiered';
  value: number;
  conditions?: {
    field: string;
    operator: 'equals' | 'greaterThan' | 'lessThan' | 'between';
    value: number | [number, number];
  }[];
}

export interface SalesData {
  id: string;
  repId: string;
  repName: string;
  repEmail: string;
  businessLine: 'line1' | 'line2';
  amount: number;
  date: Date;
  [key: string]: any; // For additional fields from CSV
}

export interface CommissionCalculation {
  id: string;
  repId: string;
  repName: string;
  repEmail: string;
  planId: string;
  planName: string;
  salesAmount: number;
  commissionAmount: number;
  calculationDate: Date;
  details: {
    criteriaId: string;
    criteriaName: string;
    amount: number;
  }[];
} 