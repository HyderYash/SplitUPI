import { formatINR } from "@/lib/formatting";

export function Progress({
  paidPaise,
  totalPaise,
}: {
  paidPaise: number;
  totalPaise: number;
}) {
  const percentage = (paidPaise / totalPaise) * 100;

  return (
    <>
      <div
        className="progress-track"
        role="progressbar"
        aria-label="Manually confirmed payments"
        aria-valuemin={0}
        aria-valuemax={totalPaise}
        aria-valuenow={paidPaise}
        aria-valuetext={`${formatINR(paidPaise)} of ${formatINR(totalPaise)} manually marked paid`}
      >
        <div className="progress-fill" style={{ width: `${percentage}%` }} />
      </div>
      <div className="progress-labels">
        <span>{formatINR(paidPaise)} marked paid</span>
        <span className="progress-percentage">{Math.round(percentage)}%</span>
        <span className="progress-remainder">{formatINR(totalPaise - paidPaise)} left</span>
      </div>
    </>
  );
}
