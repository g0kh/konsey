export function maskTcNo(tcNo: string): string {
  if (!tcNo) {
    return "***********";
  }

  return tcNo[0] + "*".repeat(10);
}
