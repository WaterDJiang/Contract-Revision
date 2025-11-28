export enum Sender {
  USER = 'USER',
  AI = 'AI'
}

export interface Message {
  id: string;
  text: string;
  sender: Sender;
  timestamp: Date;
  isThinking?: boolean;
  contextText?: string;
}

export enum EditorMode {
  VIEW = 'VIEW',
  DIFF = 'DIFF'
}

export interface DiffChange {
  type: 'added' | 'removed' | 'unchanged';
  value: string;
}

export type AIIntent = 'MODIFICATION' | 'ANALYSIS';

export interface AIResponse {
  intent: AIIntent;
  content: string; // The new markdown OR the analysis answer
  highlights?: string[]; // Array of exact substrings to highlight (for analysis)
}

// We now store the initial state as Markdown, but the app will render it to HTML on load
export const INITIAL_CONTRACT = `# INDEPENDENT CONTRACTOR AGREEMENT

**This Independent Contractor Agreement** (the "Agreement") is entered into as of [Date], by and between:

**Client:** [Client Name], with a principal place of business at [Address] ("Client"), and
**Contractor:** [Contractor Name], with a principal place of business at [Address] ("Contractor").

## 1. Services Provided
Contractor agrees to perform the following services for Client (the "Services"):
[Description of Services]

## 2. Term and Termination
This Agreement shall commence on [Start Date] and continue until [End Date], unless terminated earlier by either party upon [Number] days written notice.

## 3. Compensation
Client shall pay Contractor at the rate of $[Rate] per [Hour/Project]. Payment shall be made within [Number] days of receipt of an invoice.

## 4. Independent Contractor Status
Contractor is an independent contractor, not an employee of Client. Contractor is solely responsible for all taxes, withholdings, and other statutory obligations.

## 5. Confidentiality
Contractor acknowledges that they may have access to information that is treated as confidential and proprietary by the Client. Contractor agrees to keep all such information confidential.

## 6. Governing Law
This Agreement shall be governed by and construed in accordance with the laws of the State of [State].`;
