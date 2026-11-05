"""
Cleaning of the hotel bookings dataset (Part 1, task 1.6).

Reads the raw file, applies the cleaning rules approved by the students (see log.md, task 1.6),
writes the cleaned data to data/processed/hotel_bookings_clean.csv and saves a log of how many
rows each rule changes in clean_hotel_bookings_output/.

Run it from any folder with:  python clean_hotel_bookings.py
The raw file is only read, never changed.

Order: the two rules that remove rows (2 and 6) run first, so the counts of the recoding rules
(3, 4, 5) refer to the rows that stay; rules 7 and 1 only record what is kept; rule 8 runs last.
"""
from pathlib import Path

import pandas as pd

# ── Paths ─────────────────────────────────────────────────────────────────────
# The script lives in "Delivery 1/Part 1 - Exploratory Data Analysis/code/"
CODE_DIR = Path(__file__).resolve().parent
DELIVERY_DIR = CODE_DIR.parents[1]
RAW_FILE = DELIVERY_DIR / 'Course information' / 'hotel_bookings_dataset.csv'
CLEAN_FILE = DELIVERY_DIR / 'data' / 'processed' / 'hotel_bookings_clean.csv'
LOG_DIR = CODE_DIR / 'clean_hotel_bookings_output'
CLEAN_FILE.parent.mkdir(parents=True, exist_ok=True)
LOG_DIR.mkdir(exist_ok=True)

# Every rule adds one line to this list: what it did and how many rows it touched
cleaning_log = []


def log_rule(rule, description, rows_before, rows_after, rows_changed):
    """Remember and print the effect of one rule."""
    cleaning_log.append({'rule': rule, 'description': description, 'rows before': rows_before,
                         'rows after': rows_after, 'rows removed': rows_before - rows_after,
                         'rows with a changed value': rows_changed})
    print(f'Rule {rule}: {description}')
    print(f'    rows {rows_before:,} -> {rows_after:,} (removed {rows_before - rows_after:,}), '
          f'values changed in {rows_changed:,} rows')


# ── Load ──────────────────────────────────────────────────────────────────────
# Everything is read as written (NA and NULL stay as text), so each rule decides what to do with them;
# children is read as text because it contains 'NA'
bookings = pd.read_csv(RAW_FILE, keep_default_na=False, dtype={'children': str})
for field in ['adults', 'babies', 'stays_in_weekend_nights', 'stays_in_week_nights']:
    bookings[field] = bookings[field].astype(int)
bookings['adr'] = bookings['adr'].astype(float)
print(f'Raw file: {len(bookings):,} rows, {bookings.shape[1]} columns')

# ── Rule 2: remove rows with impossible values ────────────────────────────────
# 0 guests in total, a negative price, the price of 5,400 (ten times the next one) and 9-10 babies
children_as_number = pd.to_numeric(bookings['children'], errors='coerce').fillna(0)
total_guests = bookings['adults'] + children_as_number + bookings['babies']
impossible = (total_guests == 0) | (bookings['adr'] < 0) | (bookings['adr'] > 5000) | (bookings['babies'] >= 9)
rows_before = len(bookings)
bookings = bookings[~impossible]
log_rule(2, 'Remove rows with 0 guests, adr < 0, adr = 5,400 or 9-10 babies', rows_before, len(bookings), 0)

# ── Rule 6: remove the rows with the remaining placeholders ───────────────────
# children = NA, market_segment = Undefined, distribution_channel = Undefined (5 rows of July-August 2015)
badly_recorded = ((bookings['children'] == 'NA')
                  | (bookings['market_segment'] == 'Undefined')
                  | (bookings['distribution_channel'] == 'Undefined'))
rows_before = len(bookings)
bookings = bookings[~badly_recorded].copy()
bookings['children'] = bookings['children'].astype(int)   # no NA left, so children becomes a whole number
log_rule(6, 'Remove rows with children = NA or Undefined market segment or channel', rows_before, len(bookings), 0)

# ── Rule 3: agent and company NULL mean "not applicable" ──────────────────────
changed = int((bookings['agent'] == 'NULL').sum() + (bookings['company'] == 'NULL').sum())
rows_changed = int(((bookings['agent'] == 'NULL') | (bookings['company'] == 'NULL')).sum())
bookings['agent'] = bookings['agent'].replace('NULL', 'No agent')
bookings['company'] = bookings['company'].replace('NULL', 'No company')
log_rule(3, f"agent NULL -> 'No agent', company NULL -> 'No company' ({changed:,} cells)",
         len(bookings), len(bookings), rows_changed)

# ── Rule 4: meal Undefined is the same as SC (no meal package) ────────────────
rows_changed = int((bookings['meal'] == 'Undefined').sum())
bookings['meal'] = bookings['meal'].replace('Undefined', 'SC')
log_rule(4, "meal Undefined -> SC", len(bookings), len(bookings), rows_changed)

# ── Rule 5: country ───────────────────────────────────────────────────────────
# NULL is a real gap -> 'Unknown'; CN is taken as China (assumption) -> CHN
rows_changed = int(bookings['country'].isin(['NULL', 'CN']).sum())
bookings['country'] = bookings['country'].replace({'NULL': 'Unknown', 'CN': 'CHN'})
log_rule(5, "country NULL -> 'Unknown', CN -> CHN (assumption: CN = China)", len(bookings), len(bookings), rows_changed)

# ── Rule 7: odd but possible values are kept ──────────────────────────────────
# adr = 0, 0 nights, 0 adults with children, large groups, 27 check-out dates: nothing is changed
log_rule(7, 'Keep odd but possible values (adr = 0, 0 nights, 0 adults with children, large groups)',
         len(bookings), len(bookings), 0)

# ── Rule 1: duplicated rows are kept, without a flag ──────────────────────────
remaining_duplicates = int(bookings.duplicated().sum())
log_rule(1, f'Keep duplicated rows, no flag ({remaining_duplicates:,} rows repeat an earlier row)',
         len(bookings), len(bookings), 0)

# ── Rule 8: helper columns computed from existing fields ──────────────────────
month_number = {'January': 1, 'February': 2, 'March': 3, 'April': 4, 'May': 5, 'June': 6,
                'July': 7, 'August': 8, 'September': 9, 'October': 10, 'November': 11, 'December': 12}
bookings['arrival_date'] = pd.to_datetime(pd.DataFrame({
    'year': bookings['arrival_date_year'],
    'month': bookings['arrival_date_month'].map(month_number),
    'day': bookings['arrival_date_day_of_month']})).dt.strftime('%Y-%m-%d')
bookings['total_nights'] = bookings['stays_in_weekend_nights'] + bookings['stays_in_week_nights']
bookings['total_guests'] = bookings['adults'] + bookings['children'] + bookings['babies']
log_rule(8, 'Add arrival_date, total_nights and total_guests', len(bookings), len(bookings), len(bookings))

# ── Save ──────────────────────────────────────────────────────────────────────
bookings.to_csv(CLEAN_FILE, index=False)
pd.DataFrame(cleaning_log).to_csv(LOG_DIR / 'cleaning_log.csv', index=False)
print(f'\nCleaned file: {len(bookings):,} rows, {bookings.shape[1]} columns -> {CLEAN_FILE.relative_to(DELIVERY_DIR)}')
print(f'Log -> {(LOG_DIR / "cleaning_log.csv").relative_to(DELIVERY_DIR)}')
