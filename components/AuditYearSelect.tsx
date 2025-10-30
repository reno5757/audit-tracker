"use client";


import * as React from "react";


export default function AuditYearSelect({
    years,
    value,
    onChange,
}: {
    years: number[];
    value: string; // "all" or YYYY
    onChange: (val: string) => void;
}) {
    return (
        <label className="inline-flex items-center gap-2">
            <span className="text-sm text-slate-600">Audit year</span>
            <select
                className="rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                value={value}
                onChange={(e) => onChange(e.target.value)}
            >
                <option value="all">All</option>
                {years.map((y) => (
                    <option key={y} value={String(y)}>
                        {y}
                    </option>
                ))}
            </select>
        </label>
    );
}