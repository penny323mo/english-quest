export function seededOrder(length, seed) {
  const order = [];
  for (let i = 0; i < length; i += 1) order.push(i);
  let s = seed >>> 0;
  for (let i = length - 1; i > 0; i -= 1) {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    const j = s % (i + 1);
    const tmp = order[i];
    order[i] = order[j];
    order[j] = tmp;
  }
  return order;
}
