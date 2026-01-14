import React, { useEffect, useState, useMemo } from 'react';
import * as styles from './table-of-contents.module.css';

export const TableOfContents = ({ headings }) => {
  const [activeId, setActiveId] = useState('');
  const [isOpen, setIsOpen] = useState(false); // Start closed

  // Flatten headings for intersection observer - memoized
  const flatHeadings = useMemo(() => {
    const flatten = (items) => {
      if (!items) return [];
      return items.reduce((acc, item) => {
        acc.push({
          id: item.url?.replace('#', '') || '',
          url: item.url,
        });
        if (item.items) {
          acc.push(...flatten(item.items));
        }
        return acc;
      }, []);
    };

    if (!Array.isArray(headings)) return [];
    return flatten(headings);
  }, [headings]);

  useEffect(() => {
    // Get all headings on the page
    const headingElements = flatHeadings
      .map(({ id }) => document.getElementById(id))
      .filter(Boolean);

    if (headingElements.length === 0) return;

    const observerOptions = {
      rootMargin: '-80px 0px -80% 0px', // Trigger when heading is near top
      threshold: 0,
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setActiveId(entry.target.id);
        }
      });
    }, observerOptions);

    // Observe all heading elements
    headingElements.forEach((element) => {
      observer.observe(element);
    });

    // Cleanup
    return () => {
      headingElements.forEach((element) => {
        observer.unobserve(element);
      });
    };
  }, [flatHeadings]);

  if (!flatHeadings || flatHeadings.length === 0) {
    return null;
  }

  // Build nested structure for proper hierarchy
  const buildNestedList = (items) => {
    if (!items || items.length === 0) return null;

    return (
      <ol className={styles.tocList}>
        {items.map((item) => (
          <li key={item.url} className={styles.tocItem}>
            <a
              href={item.url}
              className={`${styles.tocLink} ${
                activeId === item.url?.replace('#', '')
                  ? styles.tocLinkActive
                  : ''
              }`}
              onClick={(e) => {
                e.preventDefault();
                const id = item.url?.replace('#', '');
                document.getElementById(id)?.scrollIntoView({
                  behavior: 'smooth',
                  block: 'start',
                });
              }}
            >
              {item.title}
            </a>
            {item.items && item.items.length > 0 && buildNestedList(item.items)}
          </li>
        ))}
      </ol>
    );
  };

  return (
    <nav className={styles.tocWrapper} aria-label="Table of contents">
      <button
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
        >
          <path
            d="M3 4h14M3 10h14M3 16h14"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
        <span className={styles.tocToggleText}>
          {isOpen ? 'Hide' : 'Table of contents'}
        </span>
        <svg
          className={`${styles.tocChevron} ${isOpen ? styles.tocChevronOpen : ''}`}
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
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
      <div
        className={`${styles.tocContent} ${isOpen ? styles.tocContentOpen : ''}`}
      >
        {buildNestedList(headings)}
      </div>
    </nav>
  );
};
