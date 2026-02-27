import puppeteer from 'puppeteer';

(async () => {
    const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36');

    await page.goto('https://search.naver.com/search.naver?where=blog&query=%EA%B9%A8%EB%B4%89%EC%88%98%ED%95%99&sm=tab_opt&nso=so:r,p:from20240501to20240531', { waitUntil: 'domcontentloaded' });

    const links = await page.evaluate(() => {
        const titleLinks = Array.from(document.querySelectorAll('.title_link'));
        const titleAreaLinks = Array.from(document.querySelectorAll('.title_area > a'));
        const allLinks = Array.from(document.querySelectorAll('a'))
            .filter(a => a.href.includes('blog.naver.com') || a.href.includes('in.naver.com'))
            .map(a => `${a.className} | ${a.href}`);

        return {
            titleLinkCount: titleLinks.length,
            titleAreaLinkCount: titleAreaLinks.length,
            sampleLinks: allLinks.slice(0, 10)
        };
    });

    console.log(JSON.stringify(links, null, 2));
    await browser.close();
})();
