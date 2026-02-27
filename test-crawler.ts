import { crawlSocialData } from './src/lib/crawler';
// test 시에는 local env를 불러와야 하므로 dotenv를 사용하거나 tsx 실행 시 환경변수가 주입되어야 합니다.
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function runTest() {
    console.log("🚀 Naver OpenAPI 기반 크롤링 로컬 테스트 시작: '장원영'");

    // API는 기간 검색이 아닌 최신순(기본값)이므로 연월은 파라미터 구조상 유지하되 API 내부에선 무시됩니다.
    const TEST_YEAR = 2024;
    const TEST_MONTH = 5;

    console.log(`\n데이터 대상: 블로그/카페 (최대 3건씩 기본 정보 + 댓글 수집 시도)`);

    try {
        const results = await crawlSocialData('장원영', TEST_YEAR, TEST_MONTH, 3);

        console.log(`\n✅ 수집 완료: 총 ${results.length}개의 포스트를 가져왔습니다.\n`);

        results.forEach((post, index) => {
            console.log(`[${index + 1}] [${post.source.toUpperCase()}] ${post.title.substring(0, 30)}...`);
            console.log(`    URL: ${post.url}`);
            console.log(`    작성일: ${post.date}`);
            console.log(`    텍스트 길이: ${post.content.length} 자`);
            console.log(`    수집된 댓글 수: ${post.comments.length} 개`);
            if (post.comments.length > 0) {
                console.log(`    첫 댓글 샘플: "${post.comments[0].substring(0, 50)}..."`);
            }
            console.log('----------------------------------------------------');
        });

    } catch (error) {
        console.error("❌ 크롤링 중 오류가 발생했습니다:", error);
    }
}

runTest();
