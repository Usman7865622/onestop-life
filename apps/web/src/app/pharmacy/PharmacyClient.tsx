'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import styles from './page.module.css';
import FormIcon from '../../components/pharmacy/FormIcon';
import { money } from '../../lib/doctors/types';
import type { Medicine, MedicineClass } from '../../lib/pharmacy/types';

type RxFilter = 'all' | 'otc' | 'rx';

const PAGE_STEP = 24;

const rxOptions: Array<{ value: RxFilter; label: string }> = [
  { value: 'all', label: 'All medicines' },
  { value: 'otc', label: 'No prescription needed' },
  { value: 'rx', label: 'Prescription required' },
];

export default function PharmacyClient({ medicines, classes }: { medicines: Medicine[]; classes: MedicineClass[] }) {
  const [search, setSearch] = useState('');
  const [selectedClass, setSelectedClass] = useState('all');
  const [rxFilter, setRxFilter] = useState<RxFilter>('all');
  const [visibleCount, setVisibleCount] = useState(PAGE_STEP);

  const visible = useMemo(() => medicines.filter((medicine) => {
    const text = `${medicine.nameEn} ${medicine.genericName ?? ''} ${medicine.brandName ?? ''} ${medicine.therapeuticClass ?? ''}`.toLowerCase();
    const matchesSearch = !search.trim() || text.includes(search.trim().toLowerCase());
    const matchesClass = selectedClass === 'all' || medicine.therapeuticClass === selectedClass;
    const matchesRx = rxFilter === 'all' || (rxFilter === 'rx' ? medicine.requiresRx : !medicine.requiresRx);
    return matchesSearch && matchesClass && matchesRx;
  }), [medicines, rxFilter, search, selectedClass]);

  const shown = visible.slice(0, visibleCount);
  const hasFilters = Boolean(search.trim()) || selectedClass !== 'all' || rxFilter !== 'all';

  const clearFilters = () => {
    setSearch('');
    setSelectedClass('all');
    setRxFilter('all');
    setVisibleCount(PAGE_STEP);
  };

  return (
    <>
      <section className={styles.searchPanel} aria-label="Find a medicine">
        <label className={`${styles.filterField} ${styles.searchField}`}>
          <span>Search medicines</span>
          <input
            value={search}
            onChange={(event) => { setSearch(event.target.value); setVisibleCount(PAGE_STEP); }}
            placeholder="Try paracetamol, Panadol, metformin, vitamin D…"
          />
        </label>
        <div className={styles.rxToggle} role="group" aria-label="Prescription filter">
          {rxOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              className={rxFilter === option.value ? styles.rxActive : styles.rxButton}
              onClick={() => { setRxFilter(option.value); setVisibleCount(PAGE_STEP); }}
              aria-pressed={rxFilter === option.value}
            >
              {option.label}
            </button>
          ))}
        </div>
      </section>

      <div className={styles.chipRow} role="group" aria-label="Filter by care category">
        <button
          type="button"
          className={selectedClass === 'all' ? styles.chipActive : styles.chip}
          onClick={() => { setSelectedClass('all'); setVisibleCount(PAGE_STEP); }}
        >
          All categories <span>{medicines.length}</span>
        </button>
        {classes.map((item) => (
          <button
            key={item.name}
            type="button"
            className={selectedClass === item.name ? styles.chipActive : styles.chip}
            onClick={() => { setSelectedClass(item.name); setVisibleCount(PAGE_STEP); }}
          >
            {item.name} <span>{item.count}</span>
          </button>
        ))}
      </div>

      <div className={styles.resultsHeader}>
        <p className={styles.resultCount}>
          {visible.length} {visible.length === 1 ? 'medicine' : 'medicines'} found
          {selectedClass !== 'all' ? <> in <strong>{selectedClass}</strong></> : null}
        </p>
        {hasFilters ? <button type="button" className={styles.clearButton} onClick={clearFilters}>Clear filters</button> : null}
      </div>

      {shown.length ? (
        <div className={styles.grid}>
          {shown.map((medicine) => (
            <article className={styles.card} key={medicine.id}>
              <div className={styles.cardTop}>
                <div className={styles.formIcon} aria-hidden="true"><FormIcon form={medicine.form} /></div>
                <div className={styles.cardTitle}>
                  <h3>{medicine.nameEn}</h3>
                  <p className={styles.generic}>
                    {medicine.genericName ?? medicine.nameEn}
                    {medicine.brandName ? <> · <span className={styles.brand}>{medicine.brandName}</span></> : null}
                  </p>
                </div>
                {medicine.requiresRx
                  ? <span className={styles.rxBadge}>Rx required</span>
                  : <span className={styles.otcBadge}>No Rx</span>}
              </div>

              <div className={styles.metaRow}>
                {medicine.therapeuticClass ? <span className={styles.classPill}>{medicine.therapeuticClass}</span> : null}
                {medicine.strength ? <span className={styles.metaChip}>{medicine.strength}</span> : null}
                {medicine.form ? <span className={styles.metaChip}>{medicine.form}</span> : null}
                {medicine.packSize ? <span className={styles.metaChip}>{medicine.packSize}</span> : null}
              </div>

              <div className={styles.cardFooter}>
                <div className={styles.fee}>
                  <strong>{money(medicine.priceMinor)}</strong>
                  <span>{medicine.inStock ? 'In stock · COD available' : 'Out of stock'}</span>
                </div>
                <Link className={styles.shopButton} href={`/products?q=${encodeURIComponent(medicine.nameEn)}`}>
                  View in shop
                </Link>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <section className={styles.emptyState}>
          <div className={styles.emptyIcon}><FormIcon form="Tablet" /></div>
          <h2>No medicines match your search</h2>
          <p>Try the generic name (for example “paracetamol”) or a brand (for example “Panadol”), or clear the filters.</p>
          {hasFilters ? <button type="button" className={styles.clearButton} onClick={clearFilters}>Clear filters</button> : null}
        </section>
      )}

      {visible.length > shown.length ? (
        <div className={styles.loadMoreRow}>
          <button type="button" className={styles.loadMoreButton} onClick={() => setVisibleCount((count) => count + PAGE_STEP)}>
            Show more medicines ({visible.length - shown.length} remaining)
          </button>
        </div>
      ) : null}

      <p className={styles.rxNote}>
        Items marked <strong>Rx required</strong> can only be dispensed against a valid prescription — our pharmacy team will ask you to share it before dispatch. All other items can be ordered right away.
      </p>
    </>
  );
}
