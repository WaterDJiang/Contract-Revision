import { DiffChange } from '../types';

// Helper to clean string for comparison
const clean = (str: string) => str.replace(/\s+/g, ' ').trim();

export const computeDiff = (oldText: string, newText: string): DiffChange[] => {
  // Legacy block-based diff for HTML (Rich Text)
  const splitRegex = /(?<=<\/p>|<\/h\d>|<\/ul>|<\/ol>|<br>)/g;
  
  const oldBlocks = oldText.replace(/\n/g, '').split(splitRegex).map(s => s.trim()).filter(Boolean);
  const newBlocks = newText.replace(/\n/g, '').split(splitRegex).map(s => s.trim()).filter(Boolean);
  
  const changes: DiffChange[] = [];
  
  let i = 0;
  let j = 0;

  while (i < oldBlocks.length || j < newBlocks.length) {
    const oldBlock = oldBlocks[i];
    const newBlock = newBlocks[j];

    if (clean(oldBlock || '') === clean(newBlock || '')) {
      changes.push({ type: 'unchanged', value: oldBlock });
      i++;
      j++;
    } else {
      // Simple lookahead
      let foundInNew = -1;
      for (let k = j + 1; k < Math.min(j + 5, newBlocks.length); k++) {
        if (clean(newBlocks[k]) === clean(oldBlock || '')) {
          foundInNew = k;
          break;
        }
      }

      let foundInOld = -1;
      for (let k = i + 1; k < Math.min(i + 5, oldBlocks.length); k++) {
        if (clean(oldBlocks[k]) === clean(newBlock || '')) {
          foundInOld = k;
          break;
        }
      }

      if (foundInNew !== -1) {
        while (j < foundInNew) {
          changes.push({ type: 'added', value: newBlocks[j] });
          j++;
        }
      } else if (foundInOld !== -1) {
        while (i < foundInOld) {
          changes.push({ type: 'removed', value: oldBlocks[i] });
          i++;
        }
      } else {
        if (i < oldBlocks.length) {
           changes.push({ type: 'removed', value: oldBlocks[i] });
           i++;
        }
        if (j < newBlocks.length) {
           changes.push({ type: 'added', value: newBlocks[j] });
           j++;
        }
      }
    }
  }

  return changes;
};

/**
 * Computes a line-by-line diff for raw text (Markdown).
 * Used in the "Draft/Content" tab.
 */
export const computeLineDiff = (oldText: string, newText: string): DiffChange[] => {
  const oldLines = oldText.split('\n');
  const newLines = newText.split('\n');
  
  const changes: DiffChange[] = [];
  
  let i = 0;
  let j = 0;

  while (i < oldLines.length || j < newLines.length) {
    const oldLine = oldLines[i];
    const newLine = newLines[j];

    // Exact match
    if (oldLine === newLine) {
      changes.push({ type: 'unchanged', value: oldLine });
      i++;
      j++;
    } else {
      // Lookahead Logic for Lines
      let foundInNew = -1;
      // Look ahead up to 10 lines
      for (let k = j + 1; k < Math.min(j + 10, newLines.length); k++) {
        if (newLines[k] === oldLine) {
          foundInNew = k;
          break;
        }
      }

      let foundInOld = -1;
      for (let k = i + 1; k < Math.min(i + 10, oldLines.length); k++) {
        if (oldLines[k] === newLine) {
          foundInOld = k;
          break;
        }
      }

      if (foundInNew !== -1) {
        // Added lines
        while (j < foundInNew) {
          changes.push({ type: 'added', value: newLines[j] });
          j++;
        }
      } else if (foundInOld !== -1) {
        // Removed lines
        while (i < foundInOld) {
          changes.push({ type: 'removed', value: oldLines[i] });
          i++;
        }
      } else {
        // Replacement or conflict
        if (i < oldLines.length) {
           changes.push({ type: 'removed', value: oldLines[i] });
           i++;
        }
        if (j < newLines.length) {
           changes.push({ type: 'added', value: newLines[j] });
           j++;
        }
      }
    }
  }
  return changes;
}