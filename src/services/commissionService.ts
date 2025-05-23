import type { CommissionPlan, CommissionCriteria, SalesData, CommissionCalculation } from '../types/commission';

type Condition = NonNullable<CommissionCriteria['conditions']>[number];

const evaluateCondition = (condition: Condition, value: number): boolean => {
  switch (condition.operator) {
    case 'equals':
      return value === condition.value;
    case 'greaterThan':
      return value > (condition.value as number);
    case 'lessThan':
      return value < (condition.value as number);
    case 'between':
      const [min, max] = condition.value as [number, number];
      return value >= min && value <= max;
    default:
      return false;
  }
};

const calculateCriteriaAmount = (criteria: CommissionCriteria, salesAmount: number): number => {
  if (criteria.conditions) {
    const conditionsMet = criteria.conditions.every(condition => 
      evaluateCondition(condition, salesAmount)
    );
    if (!conditionsMet) return 0;
  }

  switch (criteria.type) {
    case 'percentage':
      return salesAmount * (criteria.value / 100);
    case 'fixed':
      return criteria.value;
    case 'tiered':
      // Implement tiered calculation logic here
      return salesAmount * (criteria.value / 100);
    default:
      return 0;
  }
};

export const calculateCommission = (
  salesData: SalesData,
  plan: CommissionPlan
): CommissionCalculation => {
  const details = plan.criteria.map(criteria => {
    const amount = calculateCriteriaAmount(criteria, salesData.amount);
    return {
      criteriaId: criteria.id,
      criteriaName: criteria.name,
      amount
    };
  });

  const totalCommission = details.reduce((sum, detail) => sum + detail.amount, 0);

  return {
    id: crypto.randomUUID(),
    repId: salesData.repId,
    repName: salesData.repName,
    repEmail: salesData.repEmail,
    planId: plan.id,
    planName: plan.name,
    salesAmount: salesData.amount,
    commissionAmount: totalCommission,
    calculationDate: new Date(),
    details
  };
};

export const calculateCommissions = (
  salesData: SalesData[],
  plans: CommissionPlan[]
): CommissionCalculation[] => {
  return salesData.map(sale => {
    const applicablePlan = plans.find(plan => 
      plan.businessLine === sale.businessLine
    );
    
    if (!applicablePlan) {
      throw new Error(`No commission plan found for business line: ${sale.businessLine}`);
    }

    return calculateCommission(sale, applicablePlan);
  });
}; 