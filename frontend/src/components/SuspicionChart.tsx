import { useMemo } from 'react';
import type { Message } from '../types';

interface SuspicionChartProps {
    messages: Message[];
    className?: string;
}

interface DataPoint {
    turn: number;
    score: number;
    thought?: string;
}

export function SuspicionChart({ messages, className = '' }: SuspicionChartProps) {
    const dataPoints = useMemo(() => {
        const points: DataPoint[] = [];
        let turnCount = 0;

        messages.forEach((msg) => {
            if (msg.agent === 'interrogator' && msg.suspicionScore !== undefined) {
                turnCount++;
                points.push({
                    turn: turnCount,
                    score: msg.suspicionScore,
                    thought: msg.internalThought,
                });
            }
        });

        return points;
    }, [messages]);

    if (dataPoints.length < 2) {
        return (
            <div className={`text-center text-zinc-400 dark:text-zinc-500 text-xs py-4 ${className}`}>
                Not enough data points for chart
            </div>
        );
    }

    // Chart dimensions
    const width = 300;
    const height = 100;
    const padding = { top: 10, right: 10, bottom: 20, left: 30 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    // Scale functions
    const xScale = (turn: number) =>
        padding.left + ((turn - 1) / (dataPoints.length - 1)) * chartWidth;
    const yScale = (score: number) =>
        padding.top + chartHeight - (score / 100) * chartHeight;

    // Generate path
    const pathD = dataPoints
        .map((p, i) => {
            const x = xScale(p.turn);
            const y = yScale(p.score);
            return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
        })
        .join(' ');

    // Generate gradient fill path
    const areaD = `${pathD} L ${xScale(dataPoints.length)} ${padding.top + chartHeight} L ${padding.left} ${padding.top + chartHeight} Z`;

    // Get color based on final score
    const finalScore = dataPoints[dataPoints.length - 1].score;
    const getColorClass = (score: number) => {
        if (score >= 70) return { stroke: '#ef4444', fill: 'rgba(239, 68, 68, 0.1)' }; // red
        if (score >= 40) return { stroke: '#f59e0b', fill: 'rgba(245, 158, 11, 0.1)' }; // amber
        return { stroke: '#10b981', fill: 'rgba(16, 185, 129, 0.1)' }; // emerald
    };

    const colors = getColorClass(finalScore);

    // Y-axis labels
    const yLabels = [0, 50, 100];

    return (
        <div className={`${className}`}>
            <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
                    Suspicion Over Time
                </span>
                <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${finalScore >= 70 ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400' :
                        finalScore >= 40 ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400' :
                            'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'
                    }`}>
                    Final: {finalScore}%
                </span>
            </div>

            <svg
                viewBox={`0 0 ${width} ${height}`}
                className="w-full h-auto"
                style={{ maxHeight: '100px' }}
            >
                {/* Grid lines */}
                {yLabels.map((label) => (
                    <g key={label}>
                        <line
                            x1={padding.left}
                            y1={yScale(label)}
                            x2={width - padding.right}
                            y2={yScale(label)}
                            stroke="currentColor"
                            strokeOpacity={0.1}
                            strokeDasharray="2,2"
                        />
                        <text
                            x={padding.left - 4}
                            y={yScale(label)}
                            textAnchor="end"
                            dominantBaseline="middle"
                            className="fill-zinc-400 dark:fill-zinc-500"
                            fontSize="8"
                        >
                            {label}
                        </text>
                    </g>
                ))}

                {/* Area fill */}
                <path
                    d={areaD}
                    fill={colors.fill}
                />

                {/* Line */}
                <path
                    d={pathD}
                    fill="none"
                    stroke={colors.stroke}
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />

                {/* Data points */}
                {dataPoints.map((p, i) => (
                    <g key={i}>
                        <circle
                            cx={xScale(p.turn)}
                            cy={yScale(p.score)}
                            r={3}
                            fill="white"
                            stroke={colors.stroke}
                            strokeWidth={2}
                        />
                        {/* Turn label */}
                        <text
                            x={xScale(p.turn)}
                            y={height - 4}
                            textAnchor="middle"
                            className="fill-zinc-400 dark:fill-zinc-500"
                            fontSize="8"
                        >
                            {p.turn}
                        </text>
                    </g>
                ))}
            </svg>

            <div className="text-center mt-1">
                <span className="text-[10px] text-zinc-400 dark:text-zinc-500">Turn #</span>
            </div>
        </div>
    );
}
