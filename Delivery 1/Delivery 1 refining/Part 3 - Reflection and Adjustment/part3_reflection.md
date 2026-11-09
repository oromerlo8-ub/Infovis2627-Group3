# Part 3. Reflection and Adjustment

Group 3, Presentation and Visualization, Infovis2627

## Reviewing the loop

The course asks to move between the bottom-up view of the data and the top-down view of the audience and back again (TOBOGGAN). Part 1 described the data on its own; Part 2 then gave it a reader, Natalia, a tourism analyst who wants to know when each destination is busy and where its guests come from. Looking at Part 1 again with her seven questions shows that the dataset already contains what they need: arrival dates, hotel, country, cancellations, guests, nights, lead time and price. No other dataset has to be merged, and the data covers only two hotels, so it remains a case study of a city and a resort, not of the whole region.

## New data: country names

The one gap is the country field. It holds ISO three-letter codes such as PRT or GBR, which Natalia should not have to decode, and plain language is part of cognitive accessibility. We therefore added a lookup table, `data/processed/country_names.csv`, built by the notebook `country_names.ipynb`. Its source is the Python package pycountry, version 26.2.16, which distributes the ISO 3166 country lists of the Debian iso-codes project under the LGPL-2.1 licence. The table has 178 rows, one per value of `country` in the cleaned data, and three columns: the code, the English name (the short common name when ISO gives one, such as "South Korea"), and the source of the name. 176 names come from the current ISO list, one from the former code TMP (East Timor), and "Unknown" keeps the label of the cleaning rule for missing countries. Every one of the 119,201 cleaned bookings joins to a name. UN regions were not added, so small countries will be grouped as "Other".

## Small changes to Part 1

The field list of Part 1 is narrowed to the questions: hotel, arrival date, country, cancellation, guests, nights, lead time and price stay, while market segment, customer type, deposit type and reservation status leave the dashboard. The code CN, which is not an ISO three-letter code, is read as Canada, because the data has no CAN code while China already appears as CHN; Canada becomes the 13th market (1.1 % of bookings) and the ten largest markets stay as in Part 1. Finally, the duplicated rows are kept, as decided in Part 1, but Portugal's cancellation rate (56.7 %, against 37.1 % overall) falls to 39.0 % without its non-refundable bookings, which are mostly repeated rows; the dashboard will state this next to any cancellation rate by country.
