export function compareHousingOptions(optionA, optionB) {
  const totalA = (optionA.rentMonthly ?? 0) + (optionA.transportMonthly ?? 0);
  const totalB = (optionB.rentMonthly ?? 0) + (optionB.transportMonthly ?? 0);

  const costDifference = totalB - totalA;

  const commuteDiff =
    (optionB.commuteTimeMins ?? 0) - (optionA.commuteTimeMins ?? 0);

  return {
    cheaperOption: costDifference > 0 ? "Option A" : "Option B",
    monthlyCostDifference: Math.abs(costDifference),
    commuteTimeDifference: commuteDiff,
    insight:
      commuteDiff > 0
        ? `Option B increases commute by ${commuteDiff} mins daily`
        : `Option B reduces commute time`,
  };
}
