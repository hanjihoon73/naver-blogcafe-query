import { NextResponse } from 'next/server';
import { crawlSocialData } from '@/lib/crawler';
import { getMonthsBetweenDates } from '@/utils/date';

export async function POST(request: Request) {
    try {
        const { keyword, startDate, endDate } = await request.json();

        if (!keyword || !startDate || !endDate) {
            return NextResponse.json({ error: '키워드, 시작일, 종료일 정보가 필요합니다.' }, { status: 400 });
        }

        // 월별 단위로 기간 분할
        const monthRanges = getMonthsBetweenDates(startDate, endDate);

        // 데이터 수집 수행 (댓글 수집 완전 제외, 블로그는 API/카페는 브라우저 스크롤 검색)
        let totalBlogPostCount = 0;
        let totalCafePostCount = 0;

        const monthlyData = [];

        for (const range of monthRanges) {
            const posts = await crawlSocialData(keyword, range.startDate, range.endDate);

            let blogPostCount = 0;
            let cafePostCount = 0;

            posts.forEach(post => {
                if (post.source === 'blog') {
                    blogPostCount++;
                } else if (post.source === 'cafe') {
                    cafePostCount++;
                }
            });

            totalBlogPostCount += blogPostCount;
            totalCafePostCount += cafePostCount;

            monthlyData.push({
                month: range.month,
                blogPostCount,
                cafePostCount,
                total: blogPostCount + cafePostCount
            });
        }

        return NextResponse.json({
            success: true,
            keyword,
            startDate,
            endDate,
            monthlyData,
            summary: {
                blogPostCount: totalBlogPostCount,
                cafePostCount: totalCafePostCount,
                totalPosts: totalBlogPostCount + totalCafePostCount
            }
        });

    } catch (error: unknown) {
        console.error('API Error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json({ error: '데이터 수집 중 오류가 발생했습니다.', details: errorMessage }, { status: 500 });
    }
}
