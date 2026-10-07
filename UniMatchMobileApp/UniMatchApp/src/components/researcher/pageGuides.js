// src/components/researcher/pageGuides.js
//
// "How to use" content for each researcher page (web: the question, guide
// and next props of researcher/ResearcherPageHeader.jsx), shortened for a
// phone. Passed to PageHeader as `guide`.

import { RESEARCHER_ROUTES } from '../../constants/researcherConstants';

export function pageGuide(page, { dataset = 'qs' } = {}) {
  switch (page) {
    case 'dataset':
      return {
        question: 'Which universities are ranked, and how did each score?',
        steps: ['Pick a dataset and edition.', 'Search a university or filter by country.', 'Switch to 0–1 scores if needed, then export CSV.'],
        next: { label: 'Statistics', route: RESEARCHER_ROUTES.statistics, params: { dataset, view: 'summary' } },
      };
    case 'statistics':
      return {
        question: 'What do the scores look like, and which go together?',
        steps: ['Pick a dataset, edition and, if you like, a country.', 'Summary: averages, ranges and missing scores.', 'Relationships: which indicators go together.'],
        next: { label: 'Dataset Comparison', route: RESEARCHER_ROUTES.datasetComparison },
      };
    case 'datasetComparison':
      return {
        question: 'How do QS, THE and ARWU rank the same universities?',
        steps: ['Choose an edition for each dataset.', 'Search a university or country to find it in all three.', 'Open “Why the rankings differ” to see how each is made.'],
        next: { label: 'Attributes Explorer', route: RESEARCHER_ROUTES.attributes },
      };
    case 'attributes':
      return {
        question: 'What do fees, scholarships and acceptance rates look like?',
        steps: ['Search a university or country.', 'Filter by region, type or scholarship.', 'Export this page or all filtered rows as CSV.'],
        next: { label: 'Compare Universities', route: RESEARCHER_ROUTES.compare, params: { dataset } },
      };
    case 'compare':
      return {
        question: 'How do up to 3 universities differ on every indicator?',
        steps: ['Pick a dataset and edition. Your picks carry over.', 'Search and add 2 or 3 universities.', 'Green marks the best value in each row.'],
        next: { label: 'University Journey', route: RESEARCHER_ROUTES.journey },
      };
    case 'journey':
      return {
        question: "How has a university's rank changed over the years?",
        steps: ["Type a university's name.", 'Tap Journey on it (or the name for its page).', 'Read the chart and the table of every edition.'],
        next: { label: 'Weight Analysis', route: RESEARCHER_ROUTES.weights, params: { dataset, section: 'weights' } },
      };
    case 'weights':
      return {
        question: 'What happens to the ranking if each indicator counts more or less?',
        steps: ['Move a slider or type a weight (0–100).', 'The new ranking updates by itself.', 'Test Stability, then save as an experiment.'],
        next: { label: 'Research Report', route: RESEARCHER_ROUTES.report },
      };
    case 'report':
      return {
        question: 'What did my experiment find?',
        steps: ['Choose a saved experiment.', 'Every analysis runs on its own.', 'Read the findings, then share as PDF or CSV.'],
      };
    default:
      return null;
  }
}
