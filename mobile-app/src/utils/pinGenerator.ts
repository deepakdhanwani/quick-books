export function generateLoginPin(): string {
  const pin = 100000 + Math.floor(Math.random() * 900000);
  return String(pin);
}
