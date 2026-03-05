# Prompt (Always Follow)
- Always define colors as variables at the top of the styles.css file, then use the variables within elements. Never hardcode color codes in elements without defining variables. 

#  Design-Prompt
## Couple Goals Tab
### Style 

The style is built on a wireframe foundation. It uses thin but distinct #38000a borders, a light pink background #fad4d4ff for contrast against white cards. Typography relies on the Switzer sans-serif family for an editorial, modern feel. 

## Spec

Apply a minimalist wireframe aesthetic. Background color: #fad4d4ff. Card background: #FFFFFF. Primary text and borders: #38000a. Secondary text: #9b1313. Borders: 1px solid #38000a. Typography: Use 'Switzer' font family; Headings at font-weight 600, labels at font-weight 500 with letter-spacing 0.05em. 

## Sticky Header

Create a sticky header for the tab title with a background of #fad4d4ff at 90% opacity and a 4px backdrop-blur. Padding: top 56px, sides 24px, bottom 24px. Elements: a 30px bold #cd1c18 'Couple Goals' title. On the right, place a 40x40px circular button with a 1px #38000a border, containing a centered filters icon. The filters are for the category and the frequency.

## Primary Stats Card

A 220px tall featured card. Structure: Header (Weekly Overview) with title and date, a data visualization area, and a status footer. Data Viz: Five vertical bars of varying heights (based on the ratio of number of goals completed vs. total goals on that day), using #38000a for the active bar (showing today's data) and #fad4d4ff for inactive bars. 

## Goal Cards
(Same border, main text and background color as the primary stats card.)
A list of cards with minimal vertical spacing between them. Each card contains: the goal name in  #38000a, backgroun in white and a bottom row of monospaced secondary texts showing the category and the frequency, both within a rounded #fad4d4ff background. On the right place the gold star. Gold star should be empty for non-complete tasks. For completed tasks, gold star shoule be filled with gradient from top #ffcc00ff to bottom #f4e091ff. Include a hidden-by-default grip icon (lucide:grip-vertical) that appears on hover at the right side.

## Modular Action Footer

A full-width button (padding 8px) with a 2px dashed border (#D1D5DB). Text: 'Add Goal' in 14px medium weight with a leading plus icon. On hover, the border and text transition to #38000a.

# Special Components

## Wireframe Bar Chart

A minimalist data representation using simple geometric blocks.

A flex container with 'items-end' and 'justify-between'. Child elements: Divs with width: 100% and variable heights. Inactive state: bg-[#fad4d4ff]. Active/Highlighted state: bg-[#38000a]. Rounded corners: 2px (sm).


--- end design-prompt ---

#cd1c18, #ffa896, #9b1313, #38000a

#ffb343, #42eaff, #4272ff, #ff7e42