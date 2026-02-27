import axios from 'axios';
import puppeteer from 'puppeteer';
import puppeteerCore from 'puppeteer-core';
import chromium from '@sparticuz/chromium';

export interface PostData {
    url: string;
    title: string;
    content: string;
    source: 'blog' | 'cafe';
    date: string;
}

const NAVER_CLIENT_ID = process.env.NAVER_CLIENT_ID || '';
const NAVER_CLIENT_SECRET = process.env.NAVER_CLIENT_SECRET || '';

/**
 * 네이버 Open API (Search) - 블로그 전용
 * 병렬로 최대 1000건까지 수집하여 일관성 확보
 */
async function fetchBlogPostsApi(keyword: string, maxItems: number = 1000): Promise<PostData[]> {
    const items: Array<{ link: string; postdate?: string; title: string; description: string }> = [];
    const maxPages = Math.ceil(maxItems / 100);
    const promises = [];

    for (let page = 1; page <= maxPages; page++) {
        const start = ((page - 1) * 100) + 1;
        const url = `https://openapi.naver.com/v1/search/blog.json`;
        promises.push(
            axios.get(url, {
                params: { query: keyword, display: 100, start, sort: 'sim' },
                headers: {
                    'X-Naver-Client-Id': NAVER_CLIENT_ID,
                    'X-Naver-Client-Secret': NAVER_CLIENT_SECRET,
                }
            }).catch(() => {
                return { data: { items: [] } };
            })
        );
    }

    const responses = await Promise.all(promises);
    responses.forEach(res => {
        if (res.data && res.data.items) {
            items.push(...res.data.items);
        }
    });

    // 중복 제거 및 포맷팅
    const uniqueMap = new Map();
    items.forEach(item => {
        if (!uniqueMap.has(item.link)) {
            const dateStr = item.postdate || '';
            const formattedDate = dateStr.length === 8
                ? `${dateStr.substring(0, 4)}-${dateStr.substring(4, 6)}-${dateStr.substring(6, 8)}`
                : dateStr;

            uniqueMap.set(item.link, {
                url: item.link,
                title: item.title.replace(/<[^>]*>?/g, ''),
                content: item.description.replace(/<[^>]*>?/g, ''),
                source: 'blog',
                date: formattedDate
            });
        }
    });

    return Array.from(uniqueMap.values());
}

/**
 * 네이버 웹 검색 (통합검색 카페탭) - 기간 검색 옵션 적용
 * Puppeteer를 사용해 무한 스크롤 후 실제 렌더링된 건수를 도출
 */
async function fetchCafePostsWeb(keyword: string, startDate: string, endDate: string): Promise<PostData[]> {
    // startDate, endDate format: "2024-01-01" -> "20240101"
    const startStr = startDate.replace(/-/g, '');
    const endStr = endDate.replace(/-/g, '');

    let browser;
    if (process.env.VERCEL || process.env.NODE_ENV === 'production') {
        chromium.setGraphicsMode = false;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const ch = chromium as any;
        browser = await puppeteerCore.launch({
            args: [...ch.args, '--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--blink-settings=imagesEnabled=false'],
            defaultViewport: ch.defaultViewport,
            executablePath: await ch.executablePath(),
            headless: ch.headless,
        });
    } else {
        browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--blink-settings=imagesEnabled=false']
        });
    }

    let items: PostData[] = [];

    try {
        const page = await browser.newPage();
        await page.setViewport({ width: 1280, height: 1024 });

        // CSS, 폰트 요청 전면 차단하여 구동 속도 극대화
        await page.setRequestInterception(true);
        page.on('request', (req) => {
            if (['image', 'stylesheet', 'font', 'media'].includes(req.resourceType())) {
                req.abort();
            } else {
                req.continue();
            }
        });

        const url = `https://search.naver.com/search.naver?ssc=tab.cafe.all&query=${encodeURIComponent(keyword)}&sm=tab_opt&nso=so:r,p:from${startStr}to${endStr}`;
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });

        let prevHeight = 0;
        let noChangeCount = 0;
        const MAX_SCROLL_ATTEMPTS = 50; // 카페 결과가 방대할 경우를 대비해 스크롤 최대 횟수 지정
        let scrolls = 0;

        while (scrolls < MAX_SCROLL_ATTEMPTS) {
            await page.evaluate(() => document.body.scrollHeight);
            await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

            // 네이버 검색 결과 비동기 렌더링 대기
            await new Promise(r => setTimeout(r, 600));

            const newHeight = await page.evaluate(() => document.body.scrollHeight);
            if (newHeight === prevHeight) {
                noChangeCount++;
                if (noChangeCount >= 3) break; // 3번 시도해도 더 바닥에 안 내려가면 끝 (렌더 완료)
            } else {
                noChangeCount = 0;
                prevHeight = newHeight;
            }
            scrolls++;
        }

        // 렌더링된 모든 카페글(.title_area 안의 .title_link) 추출
        const pageData = await page.evaluate(() => {
            const results: { title: string; url: string }[] = [];
            document.querySelectorAll('.title_area .title_link').forEach(el => {
                results.push({
                    title: (el as HTMLElement).innerText.trim(),
                    url: (el as HTMLAnchorElement).href,
                });
            });
            return results;
        });

        // 프론트엔드 합산을 위해 더미 Data 포맷 맞추기. (날짜는 이미 네이버 기간 타겟 필터에 의존하므로 굳이 파싱안함)
        items = pageData.map(data => ({
            url: data.url,
            title: data.title,
            content: '',
            source: 'cafe',
            date: startDate // 기간 검색 필터로 찾았기 때문에 전부 허용된다고 가정하고 통과를 위해 startDate로 지정 
        }));

    } catch (e) {
        console.error("Puppeteer 카페 검색 스크롤 오류:", e);
    } finally {
        await browser.close();
    }

    return items;
}

/**
 * 
 * 1. 블로그: API 1000건 병렬 (속도 가장 빠르고 안정적)
 * 2. 카페: 네이버 통합검색 웹 페이지 크롤링 (기간 옵션 적용, 다이나믹 스크롤링 카운트)
 */
export async function crawlSocialData(keyword: string, startDate: string, endDate: string): Promise<PostData[]> {
    const results: PostData[] = [];

    const [blogItems, cafeItems] = await Promise.all([
        fetchBlogPostsApi(keyword, 1000),
        fetchCafePostsWeb(keyword, startDate, endDate)
    ]);

    // 블로그는 날짜 정보가 있으므로 최종 타겟 기간 필터링 완료
    const filteredBlog = blogItems.filter(item => item.date >= startDate && item.date <= endDate);

    // 카페는 브라우저 네이버 검색 `nso=p:from...to...` 자체 필터에 의존하므로 이미 유효
    results.push(...filteredBlog, ...cafeItems);

    return results;
}
