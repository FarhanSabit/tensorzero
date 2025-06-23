import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableEmptyState,
} from "~/components/ui/table";
import FeedbackValue from "~/components/feedback/FeedbackValue";
import { getMetricName } from "~/utils/clickhouse/helpers";
import type { FeedbackRow } from "~/utils/clickhouse/feedback";
import MetricBadges from "~/components/metric/MetricBadges";
import { useConfig } from "~/context/config";
import { TableItemShortUuid, TableItemTime } from "~/components/ui/TableItems";
import { useMemo } from "react";
import { cn } from "~/utils/common";
import { Badge } from "../ui/badge";

export default function FeedbackTable({
  feedback,
}: {
  feedback: FeedbackRow[];
}) {
  const config = useConfig();
  const metrics = config.metrics;

  const overwrittenRows = useMemo<Set<FeedbackRow>>(() => {
    const overwrittenRows = new Set<FeedbackRow>();

    // Mapping of metric name => most recent feedback row
    const mostRecentFeedbackByMetric = new Map<string, FeedbackRow>();

    for (const row of feedback) {
      if (!("metric_name" in row)) {
        continue;
      }

      const existingRow = mostRecentFeedbackByMetric.get(row.metric_name);
      if (!existingRow) {
        mostRecentFeedbackByMetric.set(row.metric_name, row);
      } else if (new Date(row.timestamp) > new Date(existingRow.timestamp)) {
        // Current row is newer
        overwrittenRows.add(existingRow);
        mostRecentFeedbackByMetric.set(row.metric_name, row);
      } else {
        // Current row is older
        overwrittenRows.add(row);
      }
    }

    return overwrittenRows;
  }, [feedback]);

  const showLatestColumn = overwrittenRows.size > 0;

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>ID</TableHead>
          <TableHead>Metric</TableHead>
          {showLatestColumn && <TableHead />}
          <TableHead>Value</TableHead>
          <TableHead>Time</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {feedback.length === 0 ? (
          <TableEmptyState message="No feedback found" />
        ) : (
          feedback.map((item) => {
            return (
              <TableRow
                key={item.id}
                className={cn(overwrittenRows.has(item) && "opacity-50")}
              >
                <TableCell className="max-w-[200px]">
                  <TableItemShortUuid id={item.id} />
                </TableCell>

                <TableCell className="flex items-center gap-2">
                  <span className="font-mono">{getMetricName(item)}</span>
                  <MetricBadges
                    metric={metrics[getMetricName(item)]}
                    row={item}
                  />
                </TableCell>

                {showLatestColumn && (
                  <TableCell>
                    {"metric_name" in item && !overwrittenRows.has(item) && (
                      <Badge variant="secondary">Latest</Badge>
                    )}
                  </TableCell>
                )}

                <TableCell className="max-w-[200px]">
                  <FeedbackValue
                    feedback={item}
                    metric={metrics[getMetricName(item)]}
                  />
                </TableCell>

                <TableCell>
                  <TableItemTime timestamp={item.timestamp} />
                </TableCell>
              </TableRow>
            );
          })
        )}
      </TableBody>
    </Table>
  );
}
