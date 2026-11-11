# Part 6. Implementation and Delivery

Group 3

## How to open the dashboard

Open the folder `Part 6 - Implementation and Delivery/dashboard/` and double-click `index.html`, or open it in any web browser or in VS Code. No server, no command and no internet connection are needed: the data, the chart specifications and the Vega libraries are all local files in that folder. The dashboard is made for a computer screen in full-screen mode (F11): on a 16:9 screen of 1536 × 864 px or larger, each screen fits without scrolling. The link "Countries of the guests" leads to the detail screen, "Accessibility help" to `accessibility.html`, and "Night mode" switches to a dark theme.

## What was built

The two screens planned in Parts 4 and 5 for Natalia: the main screen (Figures 1 to 3) shows guests, cancellations and price per month; the detail screen (Figures 4 and 5) shows where the guests come from, when each market travels, how long it stays and how early it books. The dashboard is made to fit in a 16:9 screen, use the Okabe–Ito colours for better understanding for a person with deuteranopia, a night mode, and different types of graphs: line charts, a calendar heatmap, a dumbbell chart, animated bubbles and box plots.

## Implementation decisions

`code/build_dashboard.ipynb` aggregates the cleaned bookings with pandas into six small tables in `data/processed/`, keeping the hotel, year, month and country so that every filter and selection still works; medians are computed in advance for each filter combination. The country charts count guests of stays, not bookings, because Natalia plans for people who travel.

The charts are built with Vega-Altair and drawn as SVG. The pages are plain HTML, CSS and JavaScript around them, because the keyboard navigation and announcements the accessibility skill requires cannot be made with Altair alone. The data and the chart specifications are written as `data.js` and `specs.js`. The screens share `dashboard.css` and `dashboard.js`, and `theme.js` sets the night mode, which swaps each colour of the charts for a lighter or darker one. The list of countries is built by the page instead of a browser list, so that a point on the right can mark the countries that do not appear in the bubble chart in every month.

All twelve interactions of Part 5 were built: filters with reset, the linked month, tooltips, country selection, the Chart / Map switch, sorting, Play, a Table button per chart and the night mode.

## Accessibility and review

Every chart can be used with the keyboard, has a text alternative and a data table, and never shows a value by colour alone (line styles, the heatmap dots, the stripes of the selected country). Both screens have been tested in a browser, in both themes and at 200 % zoom. The heatmap shows its values by colour rather than position, and no detail chart reaches 40 % of the total visible area. No real screen reader was used. In the data, 26.8 % of the rows repeat an earlier row and are kept, because without a booking identifier they cannot be told apart from separate reservations, so the key figures say "duplicates included".

## Figures

![Main screen: dark header band with the title, screen links and Night mode button, four key figures, a large line chart of guests per month for both hotels, a calendar heatmap of cancellations with dots and a line chart of price, and the filter panel on the right.](images/main_screen.png)

*Figure 1. Main screen at first load, both hotels and all years, 1536 × 864 px. Source: dashboard/index.html; screenshot: final_review.ipynb.*

![Main screen used with the keyboard: a point of the guests chart has a blue-and-white focus ring, the other hotel's line is dimmed, a dark box shows the exact value, and October 2015 is marked in the three charts and written in the Selected month box.](images/main_screen_keyboard.png)

*Figure 2. Main screen used with the keyboard, with the focus ring, the value box and the linked month. Source: as Figure 1.*

![Main screen in night mode: dark page and chart boxes, the City Hotel line in sky blue and the Resort Hotel line in orange, the heatmap with its purple classes reversed, and the filter panel.](images/main_screen_night.png)

*Figure 3. Main screen in night mode. Source: as Figure 1.*

![Detail screen at first load: four key figures, the dumbbell chart of the ten largest markets with Chart, Map and Table buttons, the bubble chart for January with the Play button and month slider, the two box plots of nights and days booked ahead, and the filter panel with no country selected.](images/detail_screen.png)

*Figure 4. Detail screen at first load, with no country selected. Source: dashboard/detail.html; screenshot: final_review.ipynb.*

![Detail screen in night mode with United Kingdom selected: its row is highlighted in the dumbbell and the box plots with green striped boxes, its bubble is green with a trail of the earlier months, the animation shows July, and the panel shows its values.](images/detail_screen_night.png)

*Figure 5. Detail screen in night mode, United Kingdom selected, bubbles for July. Source: as Figure 4.*
