import type { RunResult } from "../types";

type Props = {
  result: RunResult;
};

export default function MetricsPanel({ result }: Props) {
  return (
    <div className="metrics">
      <span>
        Speed (TTFT):{" "}
        {result.ttftMs === null ? "—" : `${result.ttftMs} ms`}
      </span>
      <span>Total: {result.latencyMs} ms</span>
      <span>
        Cost:{" "}
        {result.costUsd === null
          ? "—"
          : `$${result.costUsd.toFixed(4)}`}
      </span>
    </div>
  );
}
