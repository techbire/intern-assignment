export function formatMoney(amount) {
  const n = Number(amount);
  if (!Number.isFinite(n)) return "$0.00";
  const sign = n < 0 ? "-" : "";
  return `${sign}$${Math.abs(n).toFixed(2)}`;
}

export function splitEqual(amount, ids) {
  if (!ids.length) return {};
  const totalCents = Math.round(Number(amount) * 100);
  const n = ids.length;
  const baseCents = Math.floor(totalCents / n);
  let remainder = totalCents - baseCents * n;

  const shares = {};
  for (const id of ids) {
    let personCents = baseCents;
    if (remainder > 0) {
      personCents += 1;
      remainder -= 1;
    }
    shares[id] = personCents / 100;
  }
  return shares;
}

export function percentsSumTo100(percents) {
  const values = Object.values(percents).map(Number);
  const sum = values.reduce((a, b) => a + b, 0);
  return Math.abs(sum - 100) < 0.01;
}

export function splitByPercent(amount, percents) {
  const totalCents = Math.round(Number(amount) * 100);
  const entries = Object.entries(percents);
  if (!entries.length) return {};

  const sharesInCents = {};
  let assigned = 0;
  for (const [id, pct] of entries) {
    const shareCents = Math.round((totalCents * Number(pct)) / 100);
    sharesInCents[id] = shareCents;
    assigned += shareCents;
  }

  const diff = totalCents - assigned;
  if (diff !== 0) {
    const lastId = entries[entries.length - 1][0];
    sharesInCents[lastId] += diff;
  }

  const shares = {};
  for (const [id, cents] of Object.entries(sharesInCents)) {
    shares[id] = cents / 100;
  }
  return shares;
}

export function sharesForExpense(expense) {
  if (expense.splitType === "percent" && expense.percents) {
    return splitByPercent(expense.amount, expense.percents);
  }
  return splitEqual(expense.amount, expense.splitWith);
}
