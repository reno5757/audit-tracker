"use client";

import * as React from "react";
import ProjectsTable from "@/components/ProjectsTable";
import AuditYearSelect from "@/components/AuditYearSelect";


export type Row = Parameters<typeof ProjectsTable>[0]["rows"][number];


function getYearFromDate(d?: string) {
    if (!d) return undefined;
    const t = new Date(d);
    return isNaN(+t) ? undefined : t.getFullYear();
}


export default function ProjectsClient({ initialRows }: { initialRows: Row[] }) {
    const years = React.useMemo(() => {
        const s = new Set<number>();
        for (const r of initialRows) {
            const y = getYearFromDate(r.inspection_date);
            if (typeof y === "number") s.add(y);
        }
        return Array.from(s).sort((a, b) => b - a);
    }, [initialRows]);


    const [year, setYear] = React.useState<string>("2025");


    const rows = React.useMemo(() => {
        if (year === "all") return initialRows;
        const y = Number(year);
        return initialRows.filter((r) => getYearFromDate(r.inspection_date) === y);
    }, [initialRows, year]);


    return (
        <>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <AuditYearSelect years={years} value={year} onChange={setYear} />
            </div>


            <ProjectsTable rows={rows} />
        </>
    );
}