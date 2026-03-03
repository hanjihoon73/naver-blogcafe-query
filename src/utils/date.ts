export interface MonthRange {
    month: string; // YYYY-MM
    startDate: string; // YYYY-MM-DD
    endDate: string; // YYYY-MM-DD
}

/**
 * 주어진 시작일과 종료일 사이의 기간을 속한 '월(Month)' 단위로 분할하여 배열로 반환합니다.
 * @param startStr 시작일 (YYYY-MM-DD)
 * @param endStr 종료일 (YYYY-MM-DD)
 */
export function getMonthsBetweenDates(startStr: string, endStr: string): MonthRange[] {
    const start = new Date(startStr);
    const end = new Date(endStr);
    const results: MonthRange[] = [];

    let current = new Date(start.getFullYear(), start.getMonth(), 1);

    while (current <= end) {
        const year = current.getFullYear();
        const monthIndex = current.getMonth(); // 0~11

        // 이 달의 첫 날
        const firstDayOfMonth = new Date(year, monthIndex, 1);
        // 이 달의 마지막 날
        const lastDayOfMonth = new Date(year, monthIndex + 1, 0);

        // 실제 검색 기간 내에서의 구간 시작일/종료일 계산
        const _start = start > firstDayOfMonth ? start : firstDayOfMonth;
        const _end = end < lastDayOfMonth ? end : lastDayOfMonth;

        // 포맷팅 (YYYY-MM-DD)
        const formatYMD = (d: Date) =>
            `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

        // 포맷팅 (YYYY-MM)
        const monthLabel = `${year}-${String(monthIndex + 1).padStart(2, '0')}`;

        results.push({
            month: monthLabel,
            startDate: formatYMD(_start),
            endDate: formatYMD(_end)
        });

        // 다음 달 1일로 이동
        current.setMonth(current.getMonth() + 1);
    }

    return results;
}
