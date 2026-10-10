import React, { useCallback, useId, useMemo, useState } from 'react';
import { UsesIcon, hostOf, monogramFor } from './uses-icons';
import * as styles from './uses-tools.module.css';

const ALL = 'all';

const slugify = (value) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

/**
 * Category-filterable grid of the tools listed on /uses.
 *
 * Props:
 *   categories — [{ id, title, hue, items: [{ name, url?, description?, tags? }] }]
 *
 * Everything is rendered on the server with no filter applied, so the static
 * HTML holds the full list; filtering only hides cards once hydrated.
 */
export const UsesTools = ({ categories = [] }) => {
  const baseId = useId();
  const [active, setActive] = useState(ALL);
  const [expanded, setExpanded] = useState(() => new Set());

  // Every item gets its category and a stable id.
  const groups = useMemo(
    () =>
      categories.map((category) => ({
        ...category,
        items: category.items.map((item) => ({
          ...item,
          id: `${category.id}-${slugify(item.name)}`,
          categoryId: category.id,
          categoryTitle: category.title,
        })),
      })),
    [categories]
  );

  const allItems = useMemo(() => groups.flatMap((g) => g.items), [groups]);

  // Items sharing at least one tag, for the "related" row of an open card.
  const related = useMemo(() => {
    const byTag = new Map();
    allItems.forEach((item) =>
      (item.tags || []).forEach((tag) => {
        if (!byTag.has(tag)) byTag.set(tag, []);
        byTag.get(tag).push(item);
      })
    );
    return byTag;
  }, [allItems]);

  const visibleGroups =
    active === ALL ? groups : groups.filter((group) => group.id === active);

  const toggle = useCallback((id) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const showCategory = useCallback((id) => setActive(id), []);

  return (
    <div className={styles.root}>
      <div className={styles.controls} data-uses-controls="">
        <div
          className={styles.chips}
          role="group"
          aria-label="Filter by category"
        >
          <Chip
            label="All"
            icon="all"
            count={allItems.length}
            pressed={active === ALL}
            onClick={() => setActive(ALL)}
          />
          {groups.map((group) => (
            <Chip
              key={group.id}
              label={group.title}
              icon={group.id}
              hue={group.hue}
              count={group.items.length}
              pressed={active === group.id}
              onClick={() => setActive(group.id)}
            />
          ))}
        </div>
      </div>

      {visibleGroups.map((group) => {
        const headingId = `${baseId}-${group.id}`;
        return (
          <section
            key={group.id}
            className={styles.group}
            aria-labelledby={headingId}
            style={{ '--hue': group.hue }}
          >
            <h3 id={headingId} className={styles.groupTitle}>
              <span className={styles.groupIcon}>
                <UsesIcon name={group.id} />
              </span>
              {group.title}
              <span className={styles.groupCount}>{group.items.length}</span>
            </h3>
            <ul className={styles.grid}>
              {group.items.map((item) => (
                <ToolCard
                  key={item.id}
                  item={item}
                  baseId={baseId}
                  open={expanded.has(item.id)}
                  onToggle={toggle}
                  onCategory={showCategory}
                  related={related}
                />
              ))}
            </ul>
          </section>
        );
      })}

      {/* Without JS: hide the inert controls and show every card's details. */}
      <noscript>
        <style>
          {
            '[data-uses-controls]{display:none!important}[data-uses-details]{grid-template-rows:1fr!important;visibility:visible!important;opacity:1!important}[data-uses-desc]{-webkit-line-clamp:unset!important;line-clamp:unset!important}'
          }
        </style>
      </noscript>
    </div>
  );
};

const Chip = ({ label, icon, hue, count, pressed, onClick }) => (
  <button
    type="button"
    className={styles.chip}
    aria-pressed={pressed}
    onClick={onClick}
    style={hue != null ? { '--hue': hue } : undefined}
  >
    <UsesIcon name={icon} size={14} className={styles.chipIcon} />
    {label}
    <span className={styles.chipCount}>{count}</span>
  </button>
);

const ToolCard = ({ item, baseId, open, onToggle, onCategory, related }) => {
  const detailsId = `${baseId}-${item.id}-details`;
  const siblings = [];
  (item.tags || []).forEach((tag) =>
    (related.get(tag) || []).forEach((other) => {
      if (other.id !== item.id && !siblings.includes(other)) {
        siblings.push(other);
      }
    })
  );

  return (
    <li className={`${styles.card} ${open ? styles.cardOpen : ''}`}>
      <button
        type="button"
        className={styles.cardButton}
        aria-expanded={open}
        aria-controls={detailsId}
        onClick={() => onToggle(item.id)}
      >
        <span className={styles.monogram} aria-hidden="true">
          {monogramFor(item)}
        </span>
        <span className={styles.cardText}>
          <span className={styles.name}>{item.name}</span>
          {item.description && (
            <span className={styles.description} data-uses-desc="">
              {item.description}
            </span>
          )}
        </span>
        <UsesIcon name="chevron" className={styles.chevron} />
      </button>

      {item.tags && item.tags.length > 0 && (
        <ul className={styles.tags} aria-label="Tags">
          {item.tags.map((tag) => (
            <li key={tag} className={styles.tag}>
              {tag}
            </li>
          ))}
        </ul>
      )}

      <div id={detailsId} className={styles.details} data-uses-details="">
        <div className={styles.detailsInner}>
          <div className={styles.detailRow}>
            {item.url && (
              <a
                href={item.url}
                className={styles.visit}
                target="_blank"
                rel="noopener noreferrer"
              >
                {hostOf(item.url)}
                <UsesIcon name="external" size={13} />
                <span className={styles.srOnly}> (opens in a new tab)</span>
              </a>
            )}
            <button
              type="button"
              className={styles.tagButton}
              aria-label={`Show only ${item.categoryTitle}`}
              onClick={() => onCategory(item.categoryId)}
            >
              <UsesIcon name={item.categoryId} size={12} />
              {item.categoryTitle}
            </button>
          </div>
          {siblings.length > 0 && (
            <p className={styles.detailRow}>
              <span className={styles.detailLabel}>Related</span>
              <span className={styles.related}>
                {siblings.map((s) => s.name).join(' · ')}
              </span>
            </p>
          )}
        </div>
      </div>
    </li>
  );
};

export default UsesTools;
