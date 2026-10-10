import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import * as styles from './table-of-contents.module.css';

// Fraction of the viewport height used as the "reading line": the section
// whose heading most recently crossed above this line is the active one.
const READING_LINE_RATIO = 0.3;

// After a click on a TOC link, ignore scrollspy updates while the (smooth)
// scroll runs, so the highlight doesn't flicker through every section it
// passes. Released on `scrollend`, or after this delay as a fallback.
const CLICK_LOCK_MS = 1000;

const idFromUrl = (url) => {
  const hash = (url || '').replace(/^#/, '');
  try {
    return decodeURIComponent(hash);
  } catch (e) {
    return hash;
  }
};

// A heading level jump (e.g. h2 -> h4) yields an intermediate TOC item with
// no title nor url: promote its children instead of rendering an empty entry.
const withoutEmptyItems = (items) =>
  (items || []).flatMap((item) =>
    item.url
      ? [{ ...item, items: withoutEmptyItems(item.items) }]
      : withoutEmptyItems(item.items)
  );

const flattenIds = (items) =>
  (items || []).reduce((acc, item) => {
    if (item.url) acc.push(idFromUrl(item.url));
    acc.push(...flattenIds(item.items));
    return acc;
  }, []);

const prefersReducedMotion = () =>
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/**
 * Post table of contents.
 *
 * Wraps the post body: below the wide breakpoint it renders the classic
 * collapsible box above the content; on wide screens the same element moves
 * into the right margin as a sticky side block (pure CSS, see the module).
 * In both cases the link of the section being read is highlighted.
 */
export const TableOfContents = ({ headings, children }) => {
  const [activeId, setActiveId] = useState('');
  const [isOpen, setIsOpen] = useState(true);
  const layoutRef = useRef(null);
  const contentRef = useRef(null);
  const clickLockRef = useRef(null);

  const items = useMemo(
    () => (Array.isArray(headings) ? withoutEmptyItems(headings) : []),
    [headings]
  );
  const ids = useMemo(() => flattenIds(items), [items]);

  // Scrollspy. The IntersectionObserver only tells us *when* a heading
  // crosses the reading line; the active heading is then derived from the
  // headings' positions, which stays correct for fast jumps too.
  useEffect(() => {
    const elements = ids
      .map((id) => document.getElementById(id))
      .filter(Boolean);
    if (elements.length === 0) return undefined;

    const computeActive = () => {
      if (clickLockRef.current) return;

      const viewportHeight = window.innerHeight;
      const doc = document.documentElement;
      const atBottom = viewportHeight + window.scrollY >= doc.scrollHeight - 2;
      if (atBottom) {
        setActiveId(elements[elements.length - 1].id);
        return;
      }

      // Near the end of the post the reading line slides down, reaching the
      // bottom of the viewport when the end of the content does: a short last
      // section, whose heading may never reach the regular line, still gets
      // highlighted.
      const contentEnd = layoutRef.current
        ? layoutRef.current.getBoundingClientRect().bottom
        : Infinity;
      const line = Math.max(
        viewportHeight * READING_LINE_RATIO,
        Math.min(viewportHeight, 2 * viewportHeight - contentEnd)
      );
      let current = elements[0];
      for (const element of elements) {
        if (element.getBoundingClientRect().top > line) break;
        current = element;
      }
      setActiveId(current.id);
    };

    const observer = new IntersectionObserver(computeActive, {
      rootMargin: `0px 0px -${100 - READING_LINE_RATIO * 100}% 0px`,
      threshold: 0,
    });
    elements.forEach((element) => observer.observe(element));

    const releaseClickLock = () => {
      if (!clickLockRef.current) return;
      clearTimeout(clickLockRef.current);
      clickLockRef.current = null;
    };
    // Headings can jump past the reading line without the observer firing
    // (keyboard End/Home, back/forward navigation): resync once scrolling
    // settles. A scroll triggered by a TOC click keeps the clicked section
    // active, even if the next heading also sits above the reading line.
    const onScrollEnd = () => {
      if (clickLockRef.current) {
        releaseClickLock();
        return;
      }
      computeActive();
    };

    // Debounced `scroll` stands in for `scrollend` where it's unsupported.
    const scrollEndEvent = 'onscrollend' in window ? 'scrollend' : 'scroll';
    let scrollEndTimer;
    const onScrollEndEvent =
      scrollEndEvent === 'scrollend'
        ? onScrollEnd
        : () => {
            clearTimeout(scrollEndTimer);
            scrollEndTimer = setTimeout(onScrollEnd, 150);
          };

    window.addEventListener(scrollEndEvent, onScrollEndEvent, {
      passive: true,
    });
    window.addEventListener('resize', computeActive);
    window.addEventListener('hashchange', computeActive);
    computeActive();

    return () => {
      observer.disconnect();
      releaseClickLock();
      clearTimeout(scrollEndTimer);
      window.removeEventListener(scrollEndEvent, onScrollEndEvent);
      window.removeEventListener('resize', computeActive);
      window.removeEventListener('hashchange', computeActive);
    };
  }, [ids]);

  // Keep the active link visible when the TOC box itself scrolls (long TOCs
  // in the sticky side block). Only the box is scrolled, never the page.
  useEffect(() => {
    const container = contentRef.current;
    if (!activeId || !container) return;
    if (container.scrollHeight <= container.clientHeight) return;

    const link = container.querySelector('[aria-current="true"]');
    if (!link) return;

    const containerRect = container.getBoundingClientRect();
    const linkRect = link.getBoundingClientRect();
    const margin = 24;
    let delta = 0;
    if (linkRect.top < containerRect.top + margin) {
      delta = linkRect.top - containerRect.top - margin;
    } else if (linkRect.bottom > containerRect.bottom - margin) {
      delta = linkRect.bottom - containerRect.bottom + margin;
    }
    if (delta !== 0) {
      container.scrollBy({
        top: delta,
        behavior: prefersReducedMotion() ? 'auto' : 'smooth',
      });
    }
  }, [activeId]);

  const handleLinkClick = useCallback((event, url) => {
    const id = idFromUrl(url);
    const target = document.getElementById(id);
    if (!target) return;

    event.preventDefault();
    setActiveId(id);
    clearTimeout(clickLockRef.current);
    clickLockRef.current = setTimeout(() => {
      clickLockRef.current = null;
    }, CLICK_LOCK_MS);

    // Headings carry `scroll-margin-top`, so they land below the sticky
    // site header.
    target.scrollIntoView({
      behavior: prefersReducedMotion() ? 'auto' : 'smooth',
      block: 'start',
    });
    if (window.location.hash !== url) {
      window.history.pushState(null, '', url);
    }
  }, []);

  if (ids.length === 0) {
    return children;
  }

  const renderList = (items) => (
    <ol className={styles.tocList}>
      {items.map((item) => {
        const isActive = activeId === idFromUrl(item.url);
        return (
          <li key={item.url} className={styles.tocItem}>
            <a
              href={item.url}
              className={`${styles.tocLink} ${
                isActive ? styles.tocLinkActive : ''
              }`}
              aria-current={isActive ? 'true' : undefined}
              onClick={(event) => handleLinkClick(event, item.url)}
            >
              {item.title}
            </a>
            {item.items && item.items.length > 0 && renderList(item.items)}
          </li>
        );
      })}
    </ol>
  );

  return (
    <div ref={layoutRef} className={styles.tocLayout}>
      <aside className={styles.tocRail}>
        <nav className={styles.tocWrapper} aria-label="Table of contents">
          <button
            type="button"
            className={styles.tocToggle}
            onClick={() => setIsOpen(!isOpen)}
            aria-expanded={isOpen}
            aria-label={
              isOpen ? 'Close table of contents' : 'Open table of contents'
            }
          >
            <svg
              className={styles.tocToggleIcon}
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path
                d="M3 4h14M3 10h14M3 16h14"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
            <span className={styles.tocToggleText}>Table of contents</span>
            <svg
              className={`${styles.tocChevron} ${isOpen ? styles.tocChevronOpen : ''}`}
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path
                d="M4 6l4 4 4-4"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          <p className={styles.tocTitle} aria-hidden="true">
            On this page
          </p>
          <div
            ref={contentRef}
            className={`${styles.tocContent} ${isOpen ? styles.tocContentOpen : ''}`}
          >
            {renderList(items)}
          </div>
        </nav>
      </aside>
      {children}
    </div>
  );
};
