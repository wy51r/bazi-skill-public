# -*- coding: utf-8 -*-
"""
Fetch and clean public bazi classics from Wikisource into Markdown files.

Output directory: output_bazi_md/
"""

from __future__ import annotations

import logging
import re
import time
import unicodedata
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable
from urllib.parse import quote, unquote, urljoin, urlparse

import requests
from bs4 import BeautifulSoup, Tag
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry


OUTPUT_DIR = Path("output_bazi_md")
REQUEST_DELAY_SECONDS = 2.0
REQUEST_TIMEOUT_SECONDS = 30
MAX_DISCOVERED_PAGES_PER_BOOK = 180

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/125.0 Safari/537.36 "
        "BaziKnowledgePipeline/1.0"
    ),
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "zh-CN,zh;q=0.9,zh-TW;q=0.8,en;q=0.5",
    "Connection": "keep-alive",
}


@dataclass(frozen=True)
class BookConfig:
    name: str
    output_filename: str
    start_urls: list[str]
    title_prefixes: list[str]
    max_pages: int = MAX_DISCOVERED_PAGES_PER_BOOK


def ws_url(title: str, variant: str = "zh-hant") -> str:
    return f"https://zh.wikisource.org/{variant}/{quote(title)}"


BOOKS: list[BookConfig] = [
    BookConfig(
        name="渊海子平",
        output_filename="渊海子平.md",
        start_urls=[ws_url("淵海子平"), ws_url("淵海子平大全")],
        title_prefixes=["淵海子平", "渊海子平", "淵海子平大全", "渊海子平大全"],
    ),
    BookConfig(
        name="三命通会",
        output_filename="三命通会.md",
        start_urls=[ws_url("三命通會"), ws_url("三命通會 (四庫全書本)")],
        title_prefixes=["三命通會", "三命通会", "三命通會 (四庫全書本)", "三命通会 (四库全书本)"],
    ),
    BookConfig(
        name="子平真诠",
        output_filename="子平真诠.md",
        start_urls=[ws_url("子平真詮"), ws_url("子平真诠", variant="zh-hans")],
        title_prefixes=["子平真詮", "子平真诠"],
    ),
    BookConfig(
        name="滴天髓阐微",
        output_filename="滴天髓阐微.md",
        start_urls=[ws_url("滴天髓闡微"), ws_url("滴天髓闡微", variant="zh-hans")],
        title_prefixes=["滴天髓闡微", "滴天髓阐微"],
    ),
    BookConfig(
        name="穷通宝鉴",
        output_filename="穷通宝鉴.md",
        start_urls=[ws_url("窮通寶鑑"), ws_url("穷通宝鉴", variant="zh-hans")],
        title_prefixes=["窮通寶鑑", "穷通宝鉴", "窮通宝鉴", "穷通寶鑑"],
    ),
    BookConfig(
        name="千里命稿",
        output_filename="千里命稿.md",
        start_urls=[ws_url("千里命稿"), ws_url("千里命稿", variant="zh-hans")],
        title_prefixes=["千里命稿"],
    ),
]

FALLBACK_SOURCES = {
    "子平真诠": {
        "type": "simplelits",
        "index_url": "https://simplelits.com/books/classical/classical-08670-%E5%AD%90%E5%B9%B3%E7%9C%9F%E8%AF%A0",
        "source_label": "SimpleLits",
    },
    "千里命稿": {
        "type": "quanxue",
        "index_url": "https://www.quanxue.cn/qt_mingxiang/qianlimgindex.html",
        "source_label": "劝学网",
    },
}


DROP_LINE_PATTERNS = [
    r"^添加语言$",
    r"^添加链接$",
    r"^作品$",
    r"^讨论$",
    r"^閱讀$",
    r"^阅读$",
    r"^编辑$",
    r"^編輯$",
    r"^查看历史$",
    r"^檢視歷史$",
    r"^工具$",
    r"^打印/导出$",
    r"^下載為",
    r"^下载为",
    r"^维基共享资源$",
    r"^維基共享資源$",
    r"^维基百科$",
    r"^維基百科$",
    r"^维基数据项目$",
    r"^維基數據項目$",
    r"^检索自",
    r"^檢索自",
    r"^此页面最后编辑于",
    r"^此頁面最後編輯於",
    r"^Public domain",
    r"^Image$",
    r"^分类[:：]?$",
    r"^分類[:：]?$",
    r"^不转换$",
    r"^不轉換$",
    r"^简体$",
    r"^簡體$",
    r"^繁體$",
    r"^繁体$",
    r"^上一",
    r"^下一",
    r"^移至侧栏$",
    r"^移至側欄$",
    r"^隐藏$",
    r"^隱藏$",
]

NOISE_REGEXES = [
    re.compile(r"\[编辑\]|\[編輯\]"),
    re.compile(r"檢索自[“\"].*?[”\"]"),
    re.compile(r"检索自[“\"].*?[”\"]"),
    re.compile(r"此页面最后编辑于.*"),
    re.compile(r"此頁面最後編輯於.*"),
    re.compile(r"本站的全部文字在知识共享.*"),
    re.compile(r"本站的全部文字在知識共享.*"),
    re.compile(r"维基文库，自由的图书馆"),
    re.compile(r"維基文庫，自由的圖書館"),
    re.compile(r"[\u200b\u200c\u200d\ufeff]"),
    re.compile(r"[�]+"),
    re.compile(r"[ㄅ-ㄩ˙ˊˇˋ]+"),
    re.compile(r"[ \t]{2,}"),
]

VOLUME_RE = re.compile(r"^(卷[一二三四五六七八九十百〇零\d]+(?:[上下]?)?.{0,24})$")
SECTION_RE = re.compile(
    r"^("
    r"序|原序|凡例|目录|目錄|"
    r"五行总论|五行總論|十干分论|十干分論|"
    r"论[\u4e00-\u9fff〇零一二三四五六七八九十]{1,18}|"
    r"論[\u4e00-\u9fff〇零一二三四五六七八九十]{1,18}|"
    r"[\u4e00-\u9fff〇零一二三四五六七八九十]{1,18}(?:赋|賦|歌|诀|訣|论|論|篇)|"
    r"[甲乙丙丁戊己庚辛壬癸][木火土金水]|"
    r"[一二三四五六七八九十]+月[甲乙丙丁戊己庚辛壬癸][木火土金水]"
    r")$"
)


def build_session() -> requests.Session:
    session = requests.Session()
    session.headers.update(HEADERS)
    retry = Retry(
        total=4,
        connect=4,
        read=4,
        backoff_factor=1.5,
        status_forcelist=(429, 500, 502, 503, 504),
        allowed_methods=frozenset(["GET"]),
        raise_on_status=False,
    )
    adapter = HTTPAdapter(max_retries=retry)
    session.mount("http://", adapter)
    session.mount("https://", adapter)
    return session


def fetch_html(session: requests.Session, url: str) -> str:
    logging.info("GET %s", url)
    time.sleep(REQUEST_DELAY_SECONDS)
    response = session.get(url, timeout=REQUEST_TIMEOUT_SECONDS)
    response.raise_for_status()
    if not response.encoding or response.encoding.lower() in {"iso-8859-1", "ascii"}:
        response.encoding = response.apparent_encoding or "utf-8"
    return response.text


def canonicalize_url(url: str) -> str:
    parsed = urlparse(url)
    path = quote(unquote(parsed.path), safe="/:%()")
    return parsed._replace(path=path, fragment="").geturl()


def extract_title_from_url(url: str) -> str:
    path = unquote(urlparse(url).path)
    for marker in ("/wiki/", "/zh-hans/", "/zh-hant/", "/zh/"):
        if marker in path:
            return path.split(marker, 1)[1].strip("/")
    return ""


def is_wikisource_subpage(url: str, prefixes: Iterable[str]) -> bool:
    parsed = urlparse(url)
    if "zh.wikisource.org" not in parsed.netloc:
        return False
    title = extract_title_from_url(url)
    if not title or ":" in title:
        return False
    return any(title == p or title.startswith(p + "/") for p in prefixes)


def is_missing_or_search_page(html: str) -> bool:
    soup = BeautifulSoup(html, "html.parser")
    body_classes = soup.body.get("class", []) if soup.body else []
    heading = soup.select_one("h1#firstHeading")
    heading_text = heading.get_text(" ", strip=True) if heading else ""
    return (
        "noarticletext" in html
        or "searchresults" in html
        or "mw-search-results" in html
        or "special" in body_classes
        or heading_text in {"搜索", "搜尋", "Search"}
    )


def discover_wikisource_pages(
    session: requests.Session,
    start_url: str,
    title_prefixes: list[str],
    max_pages: int,
) -> list[str]:
    html = fetch_html(session, start_url)
    if is_missing_or_search_page(html):
        logging.warning("跳过不存在或搜索页：%s", start_url)
        return []

    soup = BeautifulSoup(html, "html.parser")
    content = soup.select_one("#mw-content-text .mw-parser-output")
    urls: list[str] = [canonicalize_url(start_url)]
    seen = set(urls)

    if not content:
        return urls

    for a in content.select("a[href]"):
        href = a.get("href", "")
        if not href or "redlink=1" in href or "action=edit" in href:
            continue
        absolute = canonicalize_url(urljoin(start_url, href))
        if absolute in seen:
            continue
        if is_wikisource_subpage(absolute, title_prefixes):
            seen.add(absolute)
            urls.append(absolute)
        if len(urls) >= max_pages:
            break

    return urls


def get_page_title(soup: BeautifulSoup) -> str:
    h1 = soup.select_one("h1#firstHeading")
    if h1:
        return clean_inline_text(h1.get_text(" ", strip=True))
    title = soup.find("title")
    return clean_inline_text(title.get_text(" ", strip=True)) if title else ""


def parse_wikisource_dom_example(html: str) -> str:
    soup = BeautifulSoup(html, "html.parser")
    content = soup.select_one("#mw-content-text .mw-parser-output")
    if not content:
        return ""
    for node in content.select(
        "script, style, noscript, .mw-editsection, .noprint, .metadata, "
        ".ambox, .printfooter, .mw-references-wrap, .navbox, table, figure, "
        ".thumb, sup.reference, #toc, .toc"
    ):
        node.decompose()
    return content.get_text("\n", strip=True)


def extract_wikisource_blocks(html: str) -> tuple[str, str]:
    soup = BeautifulSoup(html, "html.parser")
    page_title = get_page_title(soup)
    content = soup.select_one("#mw-content-text .mw-parser-output")
    if not content or is_missing_or_search_page(html):
        return page_title, ""

    for node in content.select(
        "script, style, noscript, .mw-editsection, .noprint, .metadata, "
        ".ambox, .printfooter, .mw-references-wrap, .navbox, table, figure, "
        ".thumb, sup.reference, #toc, .toc"
    ):
        node.decompose()

    blocks: list[str] = []
    selector = "h2, h3, h4, h5, p, li, dd, dt, blockquote"
    for node in content.select(selector):
        if not isinstance(node, Tag):
            continue
        if node.find_parent(["table", "figure"]):
            continue
        text = clean_inline_text(node.get_text(" ", strip=True))
        if not text or should_drop_line(text):
            continue
        name = node.name.lower()
        if name == "h2":
            blocks.append(f"## {text}")
        elif name in {"h3", "h4", "h5"}:
            blocks.append(f"### {text}")
        else:
            blocks.append(text)
    return page_title, "\n\n".join(blocks)


def discover_simplelits_pages(session: requests.Session, index_url: str) -> list[str]:
    html = fetch_html(session, index_url)
    soup = BeautifulSoup(html, "html.parser")
    pages: list[str] = []
    seen: set[str] = set()
    for a in soup.select("a[href]"):
        href = a.get("href", "")
        if not href or "classical-08670" not in href:
            continue
        url = canonicalize_url(urljoin(index_url, href))
        if re.search(r"/\d+$", url) and url not in seen:
            seen.add(url)
            pages.append(url)
    pages.sort(key=lambda item: int(item.rstrip("/").rsplit("/", 1)[-1]))
    return pages


def extract_simplelits_blocks(html: str) -> tuple[str, str]:
    soup = BeautifulSoup(html, "html.parser")
    title_node = soup.select_one("h1")
    page_title = clean_inline_text(title_node.get_text(" ", strip=True)) if title_node else get_page_title(soup)
    article = soup.select_one("article")
    if not article:
        return page_title, ""
    lines: list[str] = []
    if page_title:
        lines.append(f"### {page_title}")
    for p in article.select("p"):
        text = clean_inline_text(p.get_text(" ", strip=True))
        if not text or should_drop_line(text):
            continue
        if text in {"传硕公版书", "Want to learn Chinese with visual scenes and structured paths?"}:
            continue
        lines.append(text)
    return page_title, "\n\n".join(lines)


def discover_quanxue_pages(session: requests.Session, index_url: str) -> list[str]:
    html = fetch_html(session, index_url)
    soup = BeautifulSoup(html, "html.parser")
    pages: list[str] = []
    seen: set[str] = set()
    for a in soup.select("a[href]"):
        href = a.get("href", "")
        if not re.search(r"qianlimg\d+\.html$", href):
            continue
        url = canonicalize_url(urljoin(index_url, href))
        if url not in seen:
            seen.add(url)
            pages.append(url)
    pages.sort(key=lambda item: int(re.search(r"qianlimg(\d+)\.html$", item).group(1)))
    return pages


def extract_quanxue_blocks(html: str) -> tuple[str, str]:
    soup = BeautifulSoup(html, "html.parser")
    content = soup.select_one("#page_global") or soup.body
    if not content:
        return get_page_title(soup), ""
    for node in content.select("script, style, noscript, table, form, iframe"):
        node.decompose()

    h1 = content.select_one("h1")
    page_title = clean_inline_text(h1.get_text(" ", strip=True)) if h1 else get_page_title(soup)
    lines: list[str] = []
    for node in content.select("h1, h2, h3, p"):
        text = clean_inline_text(node.get_text(" ", strip=True))
        if not text or should_drop_line(text):
            continue
        tag = node.name.lower()
        if tag == "h1":
            lines.append(f"### {text}")
        elif tag in {"h2", "h3"}:
            lines.append(f"#### {text}")
        else:
            lines.append(text)
    return page_title, "\n\n".join(lines)


def fetch_fallback_book(session: requests.Session, book: BookConfig) -> list[str]:
    config = FALLBACK_SOURCES.get(book.name)
    if not config:
        return []

    index_url = config["index_url"]
    source_type = config["type"]
    source_label = config["source_label"]
    if source_type == "simplelits":
        pages = discover_simplelits_pages(session, index_url)
        extractor = extract_simplelits_blocks
    elif source_type == "quanxue":
        pages = discover_quanxue_pages(session, index_url)
        extractor = extract_quanxue_blocks
    else:
        return []

    chunks: list[str] = [
        f"> 维基文库未检索到有效正文，已使用 fallback 来源：{source_label}",
        f"> 目录页面：{index_url}",
        "",
    ]
    for page_url in pages:
        try:
            html = fetch_html(session, page_url)
            title, body = extractor(html)
            if title.strip().lower() == "coverpage":
                continue
            body = clean_full_text(body)
            if not body:
                logging.warning("fallback 空正文：%s", page_url)
                continue
            chunks.extend(["", f"## {title}", "", f"> 原始页面：{page_url}", "", inject_markdown_structure(body)])
        except Exception as exc:
            logging.exception("fallback 页面处理失败：%s | %s", page_url, exc)
    return chunks


def should_drop_line(line: str) -> bool:
    text = line.strip()
    if not text:
        return True
    if len(text) <= 2 and text in {"|", "〈", "〉"}:
        return True
    return any(re.search(pattern, text) for pattern in DROP_LINE_PATTERNS)


def clean_inline_text(text: str) -> str:
    text = unicodedata.normalize("NFKC", text)
    for pattern in NOISE_REGEXES:
        text = pattern.sub("", text)
    text = re.sub(r"\s+", " ", text)
    return text.strip()


def clean_full_text(text: str) -> str:
    text = text.replace("\r\n", "\n").replace("\r", "\n")
    text = unicodedata.normalize("NFKC", text)
    for pattern in NOISE_REGEXES:
        text = pattern.sub("", text)

    lines: list[str] = []
    for raw_line in text.splitlines():
        line = clean_inline_text(raw_line)
        if not line:
            lines.append("")
            continue
        if should_drop_line(line):
            continue
        lines.append(line)

    text = "\n".join(lines)
    text = re.sub(r"\n{3,}", "\n\n", text)
    text = re.sub(r"[ \t]+\n", "\n", text)
    return text.strip()


def inject_markdown_structure(text: str) -> str:
    result: list[str] = []
    for raw_line in text.splitlines():
        line = raw_line.strip()
        if not line:
            result.append("")
            continue
        if line.startswith("#"):
            result.append(line)
            continue
        if VOLUME_RE.match(line):
            result.append(f"## {line}")
            continue
        if len(line) <= 24 and SECTION_RE.match(line):
            result.append(f"### {line}")
            continue
        result.append(line)
    text = "\n".join(result)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip() + "\n"


def write_markdown(book: BookConfig, markdown: str) -> Path:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    output_path = OUTPUT_DIR / book.output_filename
    output_path.write_text(markdown, encoding="utf-8", newline="\n")
    return output_path


def process_book(session: requests.Session, book: BookConfig) -> Path:
    logging.info("开始处理：《%s》", book.name)
    all_pages: list[str] = []
    seen: set[str] = set()

    for start_url in book.start_urls:
        try:
            pages = discover_wikisource_pages(
                session=session,
                start_url=start_url,
                title_prefixes=book.title_prefixes,
                max_pages=book.max_pages,
            )
        except Exception as exc:
            logging.warning("目录发现失败：%s | %s", start_url, exc)
            pages = []
        for page in pages:
            if page not in seen:
                seen.add(page)
                all_pages.append(page)

    chunks: list[str] = [
        f"# {book.name}",
        "",
        "> 来源：维基文库公开页面；本文由自动化脚本抓取、清洗并结构化，仅供知识库构建与文本研究使用。",
        "",
    ]
    body_chunk_count = 0

    for index, page_url in enumerate(all_pages, start=1):
        try:
            html = fetch_html(session, page_url)
            page_title, body = extract_wikisource_blocks(html)
            body = clean_full_text(body)
            body = inject_markdown_structure(body) if body else ""
            if not body.strip():
                logging.warning("空正文：%s", page_url)
                continue
            body_chunk_count += 1

            section_title = page_title or f"{book.name} 页面 {index}"
            section_title = section_title.replace(" - 维基文库，自由的图书馆", "").strip()
            section_title = section_title.replace(" - 維基文庫，自由的圖書館", "").strip()
            chunks.extend(["", f"## {section_title}", "", f"> 原始页面：{page_url}", "", body])
        except Exception as exc:
            logging.exception("页面处理失败：%s | %s", page_url, exc)

    if body_chunk_count == 0:
        logging.info("《%s》维基文库未获得正文，尝试 fallback 来源", book.name)
        fallback_chunks = fetch_fallback_book(session, book)
        if fallback_chunks:
            chunks.extend(fallback_chunks)

    final_markdown = clean_full_text("\n".join(chunks))
    final_markdown = inject_markdown_structure(final_markdown)
    output_path = write_markdown(book, final_markdown)
    logging.info("完成：《%s》 -> %s", book.name, output_path)
    return output_path


def main() -> None:
    logging.basicConfig(level=logging.INFO, format="%(asctime)s | %(levelname)s | %(message)s")
    session = build_session()
    outputs: list[Path] = []
    for book in BOOKS:
        outputs.append(process_book(session, book))
    print("\n生成完成：")
    for path in outputs:
        print(f"- {path.resolve()}")


if __name__ == "__main__":
    main()
