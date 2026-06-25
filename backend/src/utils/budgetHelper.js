function calculateBudgetStatus(spent, limit, threshold = 75) {
  const percentage = (spent / limit) * 100;

  if (percentage >= 100) {
    return 'exceeded';
  } else if (percentage >= threshold) {
    return 'nearLimit';
  }
  return 'safe';
}

module.exports = { calculateBudgetStatus };
